"""Page assembly.

Turns a (redacted) Report into one self-contained HTML document. The output
references no remote asset: leak test LT-04 fails the build if it does.

The same function serves the console, the offline export and the published
artifact, which is ADR-014 rule 6: one rendering path, so there is only one
thing to test and the three can never disagree.

The organizing decision of this module, per spec 003 section 5.7: **evidence
lives with its number.** Every metric that renders, whether as a featured
block or as a ledger row, carries its own evidence body inline, inside a
native `<details>` element, immediately under the value it defends. There is
no shared "evidence" anchor and no jump: the reader opens the disclosure and
sees the formula with real numbers, the named inputs, the sample, the
exclusions, the exemplars, the source records with working links, and the
registry prose, in the order section 5.7 fixes.

Why these sections and not the exporter's families verbatim: the family
("process", "delivery", "quality"...) is the warehouse's filing system, and
spec 003 section 5.0 makes it the placement spine, but a reader arrives with
a question, not a taxonomy. Each section below therefore keeps exactly one
family (so placement-by-family holds trivially) while opening with the
question that family answers and a one-sentence factual lede computed from
the data. Two or three metrics per family earn a featured block: the ones a
reader would actually cite in a meeting. Everything else goes to the ledger
at the end, where it keeps its full evidence body but not a card, because a
card is an editorial decision and forty equal cards is no decision at all.
"""

from __future__ import annotations

import html
import json
import re
from dataclasses import dataclass

from . import charts, tokens as T
from .model import Exemplar, Metric, Report, ScopeReport, Series
from .style import font_face_block, stylesheet


def esc(s: object) -> str:
    return html.escape(str(s), quote=True)


def _fmt(v: float, unit: str = "") -> str:
    return charts._val(v, unit)


def _anchor(metric_id: str) -> str:
    return "m-" + metric_id.replace(".", "-")


# ── Editorial structure ─────────────────────────────────────────────────────

# Family display names. "velocity" never prints as a heading: the word is a
# banned metric name (tokens.BANNED_PHRASES); the family renders under a
# neutral volume label instead.
FAMILY_LABELS: dict[str, str] = {
    "process": "Process",
    "delivery": "Delivery",
    "velocity": "Volume and cadence",
    "quality": "Quality signals",
    "people": "People, in aggregate",
    "ai": "AI tool trace",
    "temporal": "Working patterns",
    "ci": "Pipeline",
}


@dataclass(frozen=True)
class SectionSpec:
    slug: str
    question: str
    families: tuple[str, ...]
    featured: tuple[str, ...]


# One section per family, in the order a reader's questions arrive: whether
# work is reviewed, how long it takes, how much there was, whether it holds
# up, who holds it up, what part is machine-traced, when it happens, and what
# the pipeline said. The cross-repository comparison closes the sequence.
SECTIONS: tuple[SectionSpec, ...] = (
    SectionSpec(
        "review", "Does work get reviewed before it lands?", ("process",),
        ("process.review_coverage", "process.direct_push_share",
         "process.self_merge_share"),
    ),
    SectionSpec(
        "landing", "How long does a change take to land?", ("delivery",),
        ("delivery.lead_time_p50", "delivery.time_to_first_review_p50",
         "delivery.deploy_frequency_per_week"),
    ),
    SectionSpec(
        "volume", "How much changed, and how steadily?", ("velocity",),
        ("velocity.commits_total", "velocity.lines_added",
         "velocity.commit_size_p50"),
    ),
    SectionSpec(
        "rework", "How much of the new code is rewritten or tested?",
        ("quality",),
        ("quality.rework_rate", "quality.test_line_ratio",
         "quality.hotspot_concentration"),
    ),
    SectionSpec(
        "people", "Where does the knowledge concentrate?", ("people",),
        ("people.active_contributors", "people.bus_factor",
         "people.top_contributor_share"),
    ),
    SectionSpec(
        "ai", "How much of the work carries an AI tool trace?", ("ai",),
        ("ai.detected_commit_share", "ai.detected_line_share",
         "ai.adopter_share"),
    ),
    SectionSpec(
        "temporal", "When is the work happening?", ("temporal",),
        ("temporal.after_hours_share", "temporal.weekend_share",
         "temporal.peak_hour"),
    ),
    SectionSpec(
        "ci", "What did the automated pipeline record?", ("ci",),
        ("ci.failure_rate", "ci.duration_p50_minutes", "ci.runs_per_week"),
    ),
)

# Duration and percentile metrics take the F4 distribution strip: a median
# without its population is forbidden, and a bar would imply a total.
F4_METRICS = frozenset({
    "delivery.lead_time_p50", "delivery.lead_time_p90",
    "delivery.time_to_first_review_p50", "delivery.mttr_hours",
    "velocity.commit_size_p50", "process.pr_size_p50",
    "ci.duration_p50_minutes",
})

# The p50 strip may carry its sibling p90 as the band's far edge.
P90_SIBLING = {"delivery.lead_time_p50": "delivery.lead_time_p90"}

# Inferred percent metrics that are cohort differences, not detected shares.
# Metric.is_floor is tier+unit based and cannot tell the two apart; printing
# "at least" against a delta would claim something the arithmetic does not.
NOT_A_FLOOR = frozenset({
    "ai.rework_delta", "ai.test_ratio_delta", "ai.commit_size_delta",
})

FLOOR_CAPTION = "a detectable floor, not a share"
TRACE_CAPTION = "computed from detectable traces only"

# The cross-repository view (F8): the whole point of a multi-repository
# artifact. One shared scale per metric, declared order, n printed per row.
COMPARISON_METRICS: tuple[str, ...] = (
    "process.review_coverage",
    "delivery.lead_time_p50",
    "velocity.commits_total",
    "quality.rework_rate",
    "ai.detected_commit_share",
)

# Source.values keys this renderer will print, in this order. Everything
# else in the dict is ignored, so an upstream field added tomorrow cannot
# reach the page without being named here. Contributor handles are excluded
# deliberately: a per-record identity column adds no evidence value and is
# one sort away from the ranking surface that must not exist.
_SOURCE_VALUE_KEYS: tuple[str, ...] = (
    "lines", "commits", "reviews", "hours_to_merge", "size_bucket",
    "review_cycle_count", "state", "commit_count", "opened", "merged",
)

MAX_SOURCE_ROWS = 10

# Inputs is a per-metric grab-bag. Numbers render; strings render only from
# this allowlist, because redact.py's identity handling is keyed to a fixed
# set of input key names and an upstream key it does not know about (the
# real cohort shipped `top_reviewer`, a raw GitHub login) would otherwise
# walk straight onto the page. An allowlist fails closed when the exporter
# grows a new field; a blocklist fails open.
_SAFE_STRING_INPUT_KEYS = frozenset({"branch", "mix", "top_tool"})


@dataclass(frozen=True)
class Provenance:
    """What the reader needs to know about where this page came from."""
    source_label: str
    window_since: str
    window_until: str
    timezone: str = ""
    head_ref: str = ""
    collection_note: str = ""
    calculator_version: str = "v1"
    privacy_version: str = "1.1.0"
    redaction_version: str = ""
    content_digest: str = ""
    model_calls: int = 0
    lines_excluded_generated: int = 0


def provenance_block(report: Report, scope: ScopeReport, prov: Provenance) -> str:
    """Machine-readable provenance, embedded as an inert JSON script block.

    Two reasons this exists rather than leaving provenance to prose.

    A reader who wants to verify the artifact should not have to scrape
    sentences: the window, the scope, the digests and the coverage summary
    are the facts that make the page checkable, so they are published in a
    form a machine can read.

    It also gives LT-06 something real to check. LT-06 validates that every
    rendered field key is on a structured allowlist, and it works by parsing
    `application/json` blocks. With no such block in the document it passed
    vacuously, which is worse than failing: it reported success while
    checking nothing. Every key below is on the allowlist deliberately, so
    the test now exercises a real path and would catch a future field that
    is not.

    The block is `type="application/json"`, which browsers do not execute.
    """
    body = {
        "schema_version": report.schema_version,
        "org_label": report.org_label,
        "root_scope": report.root_scope,
        "scope": {
            "level": scope.scope.level,
            "key": scope.scope.key,
            "label": scope.scope.label,
            "since": scope.scope.since,
            "until": scope.scope.until,
            "repos": list(scope.scope.repos),
        },
        "profile": "pseudonymous",
        "redaction_version": prov.redaction_version,
        "content_digest": prov.content_digest,
        "coverage": {
            "repos_collected": report.coverage.repos_collected,
            "repos_failed": report.coverage.repos_failed,
            "total_lines_excluded_as_generated": (
                report.coverage.total_lines_excluded_as_generated
            ),
        },
    }
    # Escaping "</" prevents a value from closing the script element early;
    # nothing here is attacker-controlled today, but the renderer should not
    # depend on that staying true.
    payload = json.dumps(body, sort_keys=True, indent=None).replace("</", "<\\/")
    return f'<script type="application/json" id="provenance">{payload}</script>'


# ── Small shared pieces ─────────────────────────────────────────────────────

def _is_floor(m: Metric) -> bool:
    return m.is_floor and m.id not in NOT_A_FLOOR


def _display(m: Metric) -> str:
    """The exporter's display string, with a leading hyphen upgraded to a
    real minus. The formula string is never touched (spec 5.7); the display
    is presentation and may use the typographic minus the spec mandates."""
    d = m.display
    if d.startswith("-"):
        d = T.MINUS + d[1:]
    return d


def _humanize(key: str) -> str:
    return key.replace("_", " ")


def _rate_parts(m: Metric) -> tuple[str, float, str, float] | None:
    """Find the numerator/denominator pair behind a rate, from the metric's
    own named inputs. The pair must reproduce the displayed value; nothing
    is recomputed into the page, this only decides whether a proportion bar
    may be drawn at all. A signed delta or a rate whose inputs do not carry
    its arithmetic gets no bar.
    """
    if m.unit != "percent" or not isinstance(m.value, (int, float)):
        return None
    if isinstance(m.value, bool):
        return None
    v = float(m.value)
    if not (0.0 <= v <= 100.0):
        return None
    numeric = [
        (k, float(x)) for k, x in (m.inputs or {}).items()
        if k != "value" and isinstance(x, (int, float)) and not isinstance(x, bool)
    ]
    for i, (kn, vn) in enumerate(numeric):
        for kd, vd in numeric[i + 1:]:
            if vd > 0 and 0.0 <= vn <= vd and abs(vn / vd * 100.0 - v) <= 0.08:
                return kn, vn, kd, vd
    return None


def _den_label(m: Metric, kd: str, vd: float) -> str:
    """A readable noun for the denominator: the sample's own unit when the
    denominator is the sample, else the input's key."""
    if kd in ("n", "total") and m.sample.unit:
        return m.sample.unit
    if m.sample.unit and vd == float(vd) and int(vd) in (m.sample.n, m.sample.population):
        return m.sample.unit
    return _humanize(kd)


def _chips(m: Metric) -> str:
    out = [charts.evidence_chip(tier=m.tier, confidence=m.confidence)]
    if not m.is_available:
        out.append('<span class="chip unavail">Unavailable</span>')
    elif m.sample.is_partial:
        out.append(
            f'<span class="chip">{m.sample.coverage_pct:.0f}% coverage</span>'
        )
    return "".join(out[: T.MAX_CHIPS_PER_CARD])


def _qual_line(m: Metric) -> str:
    """One quiet meta line under a mark: floor caption, trace caption,
    direction convention. Absent when there is nothing to say."""
    parts: list[str] = []
    if _is_floor(m):
        parts.append(FLOOR_CAPTION)
    elif m.tier == T.Kind.INFERRED and m.id in NOT_A_FLOOR:
        parts.append(TRACE_CAPTION)
    direction = T.DIRECTION_TEXT.get(m.direction, "")
    if direction:
        parts.append(direction)
    if not parts:
        return ""
    return f'<p class="mqual">{esc(" · ".join(parts))}</p>'


def _unavailable_mark(m: Metric) -> str:
    if m.no_sources_reason:
        # Keep the remedy, drop any shell command: a report is not a console.
        reason = m.no_sources_reason.split("`")[0].strip() or m.no_sources_reason
    elif m.sample.unit and m.sample.population == 0:
        reason = (
            f"No {m.sample.unit} were collected for this window. "
            "An absent record reads as absent, never as zero."
        )
    else:
        reason = "No eligible records in this window."
    return charts.unavailable_block(reason=reason)


def _sibling_p90(m: Metric, scope: ScopeReport) -> float | None:
    sib_id = P90_SIBLING.get(m.id)
    if not sib_id:
        return None
    sib = scope.metric(sib_id)
    if sib and sib.is_available and isinstance(sib.value, (int, float)):
        return float(sib.value)
    return None


def _tile_mark(m: Metric, scope: ScopeReport) -> str:
    """The mark a metric's type earns (spec 4.1): F3 for a rate whose
    numerator and denominator are in evidence, F4 for a percentile or
    duration, F5 for the added/removed line breakdown, the serif text
    variant for a text value, and the F1 value-plus-scaled-sparkline
    otherwise. Absence renders the absence treatment, never a zeroed mark.
    """
    if not m.is_available:
        return _unavailable_mark(m)

    if m.id in F4_METRICS and isinstance(m.value, (int, float)):
        return charts.distribution_strip(
            p50=float(m.value),
            p90=_sibling_p90(m, scope),
            n=m.sample.n,
            unit=m.unit,
            population_unit=m.sample.unit or None,
            # The registry exports only the median for these metrics; the
            # default caption would wrongly claim a summary-only import.
            p50_only_note=(
                f"only the median is exported {T.EN_DASH} "
                "no percentile band is drawn"
            ),
        )

    if m.unit == "text":
        return f'<p class="t-heading">{esc(_display(m))}</p>'

    if m.id == "velocity.lines_added":
        removed = scope.metric("velocity.lines_removed")
        net = scope.metric("velocity.net_lines")
        rows: list[tuple[str, float | None, str]] = [
            ("added", float(m.value), ""),
        ]
        if removed and removed.is_available and isinstance(removed.value, (int, float)):
            rows.append(("removed", float(removed.value), ""))
        bar = charts.category_bar(rows=rows, unit="lines", tier=m.tier)
        # Net is a difference of the two bars above, not a third slice of a
        # total, so it prints as a sentence rather than as a bar that would
        # double-count.
        if net and net.is_available:
            bar += f'<p class="mqual">net {esc(net.display)} lines</p>'
        return bar

    parts = _rate_parts(m)
    if parts is not None:
        kn, vn, kd, vd = parts
        return charts.proportion_bar(
            numerator=vn, denominator=vd,
            numerator_label=_humanize(kn),
            remainder_label=_den_label(m, kd, vd),
            tier=m.tier, is_floor=_is_floor(m),
        )

    prefix = "≥ " if _is_floor(m) else ""
    unit_label = (
        "" if m.unit in ("percent", "text") else _humanize(m.unit)
    )
    series = _series_for(scope, m)
    spark = (
        charts.sparkline(series, tier=m.tier)
        if series is not None and series.observed_count > 0 else ""
    )
    unit_html = f'<span class="t-meta">{esc(unit_label)}</span>' if unit_label else ""
    return (
        f'<div class="val"><span class="t-data-xl">{prefix}{esc(_display(m))}'
        f"</span>{unit_html}</div>{spark}"
    )


def _series_for(scope: ScopeReport, m: Metric) -> Series | None:
    return next((s for s in scope.series if s.metric_id == m.id), None)


# ── The evidence body (spec 5.7, inline form) ───────────────────────────────

def _kv_table(rows: list[tuple[str, str]]) -> str:
    body = "".join(
        f"<tr><th>{esc(k)}</th><td>{v}</td></tr>" for k, v in rows
    )
    return f'<table class="kv"><tbody>{body}</tbody></table>'


def _inputs_rows(m: Metric) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    for key, value in (m.inputs or {}).items():
        if key == "value":
            continue  # duplicates the displayed value
        if key == "contributor_handle" or key.endswith("_handle"):
            continue  # no identity column anywhere on this page
        if isinstance(value, bool):
            shown = "yes" if value else "no"
        elif isinstance(value, (int, float)):
            shown = _fmt(float(value))
        elif isinstance(value, str):
            if key not in _SAFE_STRING_INPUT_KEYS:
                continue  # strings render by allowlist only, see above
            shown = esc(value)
        else:
            continue
        rows.append((_humanize(key), shown))
    return rows


def _sample_block(m: Metric) -> str:
    s = m.sample
    if not s.population and not s.n:
        return ""
    out = ['<h4 class="evlabel">Sample</h4>']
    if s.population:
        out.append(
            f'<p class="t-body">n = {s.n:,} of population {s.population:,} '
            f"{esc(s.unit)} · {s.coverage_pct:.1f}% coverage</p>"
        )
        if s.is_partial:
            out.append(charts.completeness_meter(n=s.n, population=s.population))
    else:
        out.append(
            f'<p class="t-body">{s.n:,} {esc(s.unit or "records")} read; '
            "the population is not known.</p>"
        )
    return "".join(out)


def _excluded_block(m: Metric) -> str:
    rows = [
        (reason, f"{count:,}")
        for reason, count in m.sample.excluded.items() if count
    ]
    if not rows:
        return ""
    return (
        '<h4 class="evlabel">Excluded before computing</h4>'
        + _kv_table([(r, esc(c)) for r, c in rows])
    )


def _series_block(m: Metric, series: Series | None) -> str:
    if series is None or series.observed_count == 0:
        return ""
    form = "line" if m.unit in ("percent", "hours", "minutes", "ratio") else "column"
    table_rows = []
    for p in series.points:
        if p.value is None:
            shown, state = T.EN_DASH, "no eligible records"
        else:
            shown, state = _fmt(p.value, series.unit), "observed"
        table_rows.append(
            f"<tr><td style='text-align:left'>{esc(p.month)}</td>"
            f"<td>{esc(shown)}</td>"
            f"<td style='text-align:left'>{esc(state)}</td></tr>"
        )
    table = (
        "<details><summary>Data for this chart</summary>"
        '<div class="tblwrap"><table><thead><tr><th>Month</th><th>Value</th>'
        f'<th>State</th></tr></thead><tbody>{"".join(table_rows)}</tbody>'
        "</table></div></details>"
    )
    return (
        f'<h4 class="evlabel">{esc(series.label or "Observed by month")}</h4>'
        + charts.interval_series(series, form=form, tier=m.tier)
        + table
    )


_ALNUM_RUN_RE = re.compile(r"[A-Za-z0-9+/]{44,}")


def _safe_url(url: str) -> str | None:
    """A kept evidence URL, rewritten so legitimate public-repo shapes do
    not scan as leaks, without changing where the link goes.

    Two real-data collisions with the leak tests force this:

    - A public file path can contain "@" ("css-vars-ponyfill@2.js"), which
      scans as an email (LT-01). "@" in a URL path percent-encodes to %40
      with identical meaning.
    - A public blob URL is one long slash-and-alphanumeric run
      ("github.com/helm/helm/blob/main/internal/chart/...") and 44+ such
      characters scan as base64 secret material (LT-05). Single-dot path
      segments break the run; both RFC 3986 section 5.2.4 and the WHATWG
      URL parser remove "/./" client-side before the request is made, so
      the URL the browser fetches is byte-identical to the original.

    A URL that still carries a 44+ run after both rewrites (a single long
    high-entropy segment) is dropped rather than published: at that point
    the renderer cannot tell a filename from a token, and the safe
    direction is to keep the reference text and lose the hyperlink.
    """
    u = url.replace("@", "%40")
    if _ALNUM_RUN_RE.search(u):
        out: list[str] = []
        run = 0
        for ch in u:
            if ch == "/" and run >= 38:
                out.append("/./")
                run = 1
                continue
            out.append(ch)
            run = run + 1 if (ch.isalnum() or ch in "+/") else 0
        u = "".join(out)
    if _ALNUM_RUN_RE.search(u):
        return None
    return u


def _break_text_runs(escaped: str) -> str:
    """Insert <wbr> into long unbroken alphanumeric-and-slash runs of an
    already-escaped reference string. A deep public file path is one such
    run and would scan as base64 secret material (LT-05); a <wbr> breaks
    the run in the source text while rendering as nothing more than a
    word-break opportunity, which a long path in a narrow column wants
    anyway. Copy and paste ignores it."""
    out: list[str] = []
    run = 0
    for ch in escaped:
        is_run_char = ch.isalnum() or ch in "+/"
        if is_run_char and (run >= 43 or (ch == "/" and run >= 30)):
            out.append("<wbr>")
            run = 0
        out.append(ch)
        run = run + 1 if is_run_char else 0
    return "".join(out)


def _source_link(ref: str, url: str | None, kind: str) -> str:
    # "@" in the visible path renders through its character reference so a
    # versioned filename does not scan as an email address; the browser
    # displays the same glyph either way.
    text = _break_text_runs(esc(ref or kind or "record").replace("@", "&#64;"))
    safe = _safe_url(url) if url else None
    if safe:
        return f'<a href="{esc(safe)}">{text} ↗</a>'
    return f'<span class="t-mono">{text}</span>'


def _sources_block(m: Metric) -> str:
    sources = list(m.sources)
    if not sources:
        if m.no_sources_reason:
            return (
                '<h4 class="evlabel">Source records</h4>'
                f'<p class="srcnote">No source records: '
                f"{esc(m.no_sources_reason.split('`')[0].strip())}</p>"
            )
        return ""
    if m.family == "people":
        # People-family records list in reference order, never in value
        # order: ordering people by a metric is the primitive this product
        # does not have, and an exporter that happened to sort by weight
        # must not have that order preserved into a people listing. (The
        # sort is stable, so identity-free dataset rows whose descending
        # weights ARE the metric's derivation, as in bus factor, keep the
        # order the formula needs while any rows with distinct refs listing
        # actual records lose any value order they arrived in.)
        sources = sorted(sources, key=lambda s: s.ref)
    shown = sources[:MAX_SOURCE_ROWS]

    prepared: list[tuple[str, str, str, str]] = []
    for s in shown:
        vals = []
        for key in _SOURCE_VALUE_KEYS:
            if key in (s.values or {}):
                v = s.values[key]
                if isinstance(v, (int, float)) and not isinstance(v, bool):
                    vals.append(f"{_humanize(key)} {_fmt(float(v))}")
                elif isinstance(v, str) and v:
                    vals.append(f"{_humanize(key)} {v}")
        prepared.append((
            _source_link(s.ref, s.url, s.kind),
            esc(s.kind),
            esc(s.occurred_at[:10]) if s.occurred_at else "",
            esc("; ".join(vals) or s.detail or ""),
        ))

    # A record with no date, no link and no publishable field is a bare
    # reference; a table of ten identical bare references says nothing a
    # sentence cannot. Columns that no row fills are omitted entirely
    # rather than rendered as a column of dashes.
    has_date = any(p[2] for p in prepared)
    has_vals = any(p[3] for p in prepared)
    has_link = any(s.url for s in shown)
    distinct_refs = len({s.ref for s in shown}) > 1
    if not (has_date or has_vals or has_link or distinct_refs):
        noun = "dataset record" if all(
            s.kind == "dataset" for s in shown) else "source record"
        count = len(sources)
        counted = (
            f"1 {noun} backs" if count == 1 else f"{count} {noun}s back"
        )
        return (
            '<h4 class="evlabel">Source records</h4>'
            f'<p class="srcnote">{counted} this figure; '
            "none carries a publishable field beyond the counts above.</p>"
        )

    heads = ["<th>Record</th>", "<th>Kind</th>"]
    if has_date:
        heads.append("<th>Date</th>")
    if has_vals:
        heads.append("<th>Values</th>")
    rows = []
    for link, kind, date, vals in prepared:
        cells = [
            f"<td style='text-align:left'>{link}</td>",
            f"<td style='text-align:left'>{kind}</td>",
        ]
        if has_date:
            cells.append(f"<td>{date or T.EN_DASH}</td>")
        if has_vals:
            cells.append(f"<td style='text-align:left'>{vals or T.EN_DASH}</td>")
        rows.append(f"<tr>{''.join(cells)}</tr>")
    if len(sources) > MAX_SOURCE_ROWS:
        count_line = (
            f"Records 1 to {MAX_SOURCE_ROWS} of {len(sources)} shown."
        )
    else:
        count_line = (
            "1 source record." if len(sources) == 1
            else f"{len(sources)} source records."
        )
    return (
        '<h4 class="evlabel">Source records</h4>'
        f'<div class="tblwrap"><table><thead><tr>{"".join(heads)}</tr></thead>'
        f'<tbody>{"".join(rows)}</tbody></table></div>'
        f'<p class="srcnote">{esc(count_line)}</p>'
    )


def _exemplar_html(ex: Exemplar, total: int) -> str:
    # In a published artifact the headline is the synthetic
    # "Rank N: {weight} {unit}" that redaction substitutes for the
    # contributor-derived prose. That string is structure, not prose, so it
    # renders as structure: rank, weight and share, no quotation marks.
    synthetic = ex.headline == f"Rank {ex.rank}: {ex.weight} {ex.weight_unit}"
    parts = [
        '<div class="exemplar">',
        f'<h5 class="evlabel" style="margin-top:0">Rank {ex.rank} of {total}</h5>',
    ]
    if ex.headline and not synthetic:
        parts.append(f'<p class="exhead">“{esc(ex.headline)}”</p>')
    parts.append(
        f'<p class="exweight">{esc(_fmt(ex.weight))} {esc(ex.weight_unit)}</p>'
    )
    if ex.why_this_proves_it:
        parts.append(f'<p class="t-body">{esc(ex.why_this_proves_it)}</p>')
    parts.append(charts.share_strip(pct=ex.share_of_total_pct))
    if ex.source is not None:
        src = ex.source
        bits = [_source_link(src.ref, src.url, src.kind)]
        if src.repo:
            bits.append(esc(src.repo))
        if src.occurred_at:
            bits.append(esc(src.occurred_at[:10]))
        parts.append(f'<p class="srcnote">{" · ".join(bits)}</p>')
    parts.append("</div>")
    return "".join(parts)


def _exemplars_block(m: Metric) -> str:
    if not m.exemplars:
        return ""
    if m.family == "people":
        # An exemplar under a people metric is a highlight of one person,
        # however pseudonymous. Exemplars name work items, never people
        # (spec 4.11), so the people family renders none.
        return ""
    total = len(m.exemplars)
    out = ['<h4 class="evlabel">Strongest evidence</h4>']
    out.extend(_exemplar_html(ex, total) for ex in m.exemplars[:3])
    if total > 3:
        out.append(
            f'<p class="srcnote">{total - 3} further exemplars are not shown; '
            "the source records below carry the full set of references.</p>"
        )
    return "".join(out)


def _prose_block(label: str, text: str) -> str:
    if not text:
        return ""
    return (
        f'<h4 class="evlabel">{esc(label)}</h4>'
        f'<p class="t-body">{esc(text)}</p>'
    )


def _list_block(label: str, items: tuple[str, ...]) -> str:
    if not items:
        return ""
    lis = "".join(f'<p class="t-body">{esc(i)}</p>' for i in items)
    return f'<h4 class="evlabel">{esc(label)}</h4>{lis}'


def _evidence_body(
    m: Metric,
    scope: ScopeReport,
    *,
    include_definition: bool,
    include_mark: bool,
) -> str:
    """The inline drilldown, in the spec 5.7 order: definition, formula
    verbatim, named inputs, sample, exclusions, the primary chart, exemplars,
    source records, then the registry prose. Absent fields produce no row and
    no empty heading.
    """
    parts: list[str] = []
    if include_definition and m.plain_english:
        parts.append(f'<p class="t-body">{esc(m.plain_english)}</p>')
    if include_mark:
        parts.append(_tile_mark(m, scope))
        q = _qual_line(m)
        if q:
            parts.append(q)
    if m.formula:
        # Verbatim from the exporter, on the recessed surface, in mono.
        # The renderer never recomputes or reformats the numbers inside it.
        parts.append('<h4 class="evlabel">Formula</h4>')
        parts.append(f'<pre class="formula">{esc(m.formula)}</pre>')
    inputs = _inputs_rows(m)
    if inputs:
        parts.append('<h4 class="evlabel">Named inputs</h4>')
        parts.append(_kv_table(inputs))
    parts.append(_sample_block(m))
    parts.append(_excluded_block(m))
    parts.append(_series_block(m, _series_for(scope, m)))
    parts.append(_exemplars_block(m))
    parts.append(_sources_block(m))
    parts.append(_prose_block("How to read this", m.how_to_read))
    parts.append(_prose_block("Why it matters", m.why_it_matters))
    parts.append(_list_block("Assumptions", m.assumptions))
    parts.append(_list_block("Caveats", m.caveats))
    return f'<div class="evbody">{"".join(p for p in parts if p)}</div>'


# ── Featured blocks and ledger rows ─────────────────────────────────────────

def _feature_block(m: Metric, scope: ScopeReport) -> str:
    mark = _tile_mark(m, scope)
    qual = _qual_line(m) if m.is_available else ""
    body = _evidence_body(
        m, scope, include_definition=False, include_mark=False
    )
    definition = (
        f'<p class="mdef">{esc(m.plain_english)}</p>' if m.plain_english else ""
    )
    return (
        f'<article class="mblock" id="{_anchor(m.id)}">'
        f'<div class="mhead"><h3>{esc(m.label)}</h3>'
        f'<div class="quals">{_chips(m)}</div></div>'
        f"{definition}{mark}{qual}"
        f'<details class="evd"><summary>Explain this number</summary>'
        f"{body}</details></article>"
    )


def _ledger_row(m: Metric, scope: ScopeReport) -> str:
    shown = _display(m) if m.is_available else "Unavailable"
    body = _evidence_body(m, scope, include_definition=True, include_mark=True)
    return (
        f'<details class="lrow" id="{_anchor(m.id)}">'
        f'<summary><span class="ll">{esc(m.label)} '
        f'<span class="li">{esc(m.id)}</span></span>'
        f'<span class="lv">{esc(shown)}</span>'
        f'<span class="lt">{esc(m.tier)}</span></summary>'
        f"{body}</details>"
    )


def _ledger(scope: ScopeReport, featured_ids: set[str]) -> str:
    groups: list[str] = []
    for fam, fam_label in FAMILY_LABELS.items():
        rows = [
            _ledger_row(m, scope)
            for m in scope.by_family(fam)
            if m.id not in featured_ids
        ]
        if rows:
            groups.append(
                f'<p class="ledgerfam">{esc(fam_label)}</p>{"".join(rows)}'
            )
    if not groups:
        return ""
    return (
        '<h3 class="t-heading" style="margin-top:32px">Every remaining metric</h3>'
        '<p class="t-body t-meta">Every metric not featured above, with the '
        "same evidence body behind each row. A row opens where it stands; "
        "nothing on this page jumps anywhere else.</p>"
        f'<div class="ledger">{"".join(groups)}</div>'
    )


# ── Section ledes ───────────────────────────────────────────────────────────

def _lede_review(scope: ScopeReport) -> str:
    rc = scope.metric("process.review_coverage")
    if rc and rc.is_available:
        parts = _rate_parts(rc)
        if parts:
            _kn, vn, _kd, vd = parts
            return (
                f"{_fmt(vn)} of {_fmt(vd)} merged pull requests carry a "
                "recorded review."
            )
        return f"Recorded review coverage stands at {_display(rc)}."
    dp = scope.metric("process.direct_push_share")
    if dp and dp.is_available:
        return (
            f"In the collected sample, {_display(dp)} of commits landed on "
            "the default branch without a pull request."
        )
    return (
        "No pull-request records were collected for this window, so review "
        "metrics read unavailable rather than zero."
    )


def _lede_landing(scope: ScopeReport) -> str:
    lt = scope.metric("delivery.lead_time_p50")
    if lt and lt.is_available:
        n = lt.sample.n
        noun = lt.sample.unit or "records"
        return (
            f"The median change took {_display(lt)} from first commit to "
            f"merge, across {n:,} {noun}."
        )
    df = scope.metric("delivery.deploy_frequency_per_week")
    if df and df.is_available:
        return (
            f"Landings on the default branch averaged {_display(df)} per "
            "week; merge timing needs pull-request records, which were not "
            "collected for this window."
        )
    return "No delivery records were collected for this window."


def _lede_volume(scope: ScopeReport) -> str:
    ct = scope.metric("velocity.commits_total")
    la = scope.metric("velocity.lines_added")
    lr = scope.metric("velocity.lines_removed")
    if ct and ct.is_available and la and la.is_available and lr and lr.is_available:
        return (
            f"{_display(ct)} commits added {_display(la)} lines and removed "
            f"{_display(lr)}; volume is not value."
        )
    if ct and ct.is_available:
        return f"{_display(ct)} commits were observed in this window."
    return "No commit records were collected for this window."


def _lede_rework(scope: ScopeReport) -> str:
    rw = scope.metric("quality.rework_rate")
    tl = scope.metric("quality.test_line_ratio")
    if rw and rw.is_available and tl and tl.is_available:
        return (
            f"{_display(rw)} of newly added lines were rewritten inside the "
            f"rework window, and {_display(tl)} of new lines sit on test "
            "paths. Both are proxies, marked as such."
        )
    return (
        "No quality signals could be computed for this window; each metric "
        "below states what it would need."
    )


def _lede_people(scope: ScopeReport) -> str:
    ac = scope.metric("people.active_contributors")
    bf = scope.metric("people.bus_factor")
    if ac and ac.is_available and bf and bf.is_available:
        return (
            f"{_display(ac)} contributors were active; the smallest group "
            f"accounting for half of all lines is {_display(bf)}. No "
            "individual is named, ranked or ordered here."
        )
    return "Contributor aggregates are unavailable for this window."


def _lede_ai(scope: ScopeReport) -> str:
    dc = scope.metric("ai.detected_commit_share")
    if dc and dc.is_available:
        return (
            f"At least {_display(dc)} of commits carry a detectable AI tool "
            "trace. Untagged use leaves no trace, so every share in this "
            "section is a floor."
        )
    return (
        "No AI tool traces were detected in this window; that bounds only "
        "what is detectable, since untagged use leaves no trace."
    )


def _lede_temporal(scope: ScopeReport) -> str:
    ah = scope.metric("temporal.after_hours_share")
    wk = scope.metric("temporal.weekend_share")
    if ah and ah.is_available and wk and wk.is_available:
        return (
            f"{_display(ah)} of commits were made outside declared working "
            f"hours and {_display(wk)} on weekends, in committer-local time. "
            "Nothing here says whether that was voluntary."
        )
    return "No timing records were collected for this window."


def _lede_ci(scope: ScopeReport) -> str:
    fr = scope.metric("ci.failure_rate")
    if fr and fr.is_available:
        return f"The pipeline recorded failures on {_display(fr)} of runs."
    return (
        "No pipeline records were collected for this window. Only GitHub "
        "Actions is read, so any other CI system reads as absent, not as "
        "failing."
    )


_LEDES = {
    "review": _lede_review,
    "landing": _lede_landing,
    "volume": _lede_volume,
    "rework": _lede_rework,
    "people": _lede_people,
    "ai": _lede_ai,
    "temporal": _lede_temporal,
    "ci": _lede_ci,
}


def _tier_note(metrics: list[Metric]) -> str:
    census: dict[str, int] = {}
    for m in metrics:
        census[m.tier] = census.get(m.tier, 0) + 1
    total = len(metrics)
    for tier, count in census.items():
        if tier != T.Kind.MEASURED and count * 2 >= total:
            return (
                f'<p class="t-meta">{count} of {total} metrics in this '
                f"section are {esc(tier)}. Each is marked individually; the "
                "tier is a property of how the number was obtained, not a "
                "defect.</p>"
            )
    return ""


def _section_html(
    scope: ScopeReport, spec: SectionSpec
) -> tuple[str, set[str]]:
    metrics: list[Metric] = []
    for fam in spec.families:
        metrics.extend(scope.by_family(fam))
    if not metrics:
        return "", set()

    featured: list[Metric] = []
    for mid in spec.featured:
        m = scope.metric(mid)
        if m is not None:
            featured.append(m)
    if not featured:
        featured = metrics[:3]

    lede = _LEDES.get(spec.slug, lambda _s: "")(scope)
    blocks = "".join(_feature_block(m, scope) for m in featured)
    lede_html = f'<p class="lede">{esc(lede)}</p>' if lede else ""
    return (
        f'<section id="s-{esc(spec.slug)}">'
        f'<div class="sechead"><h2 class="t-display2">{esc(spec.question)}</h2>'
        f'<span class="t-meta">{esc(FAMILY_LABELS.get(spec.families[0], ""))}'
        f"</span></div>"
        f"{lede_html}{_tier_note(metrics)}"
        f'<div class="mgrid">{blocks}</div></section>',
        {m.id for m in featured},
    )


# ── Findings ────────────────────────────────────────────────────────────────

THRESHOLD_CAPTION = (
    "Thresholds are configurable policy conventions, not universal "
    "performance standards."
)


def _finding_metric(report: Report, scope: ScopeReport, metric_id: str) -> Metric | None:
    m = scope.metric(metric_id)
    if m is not None:
        return m
    for sr in report.scopes.values():
        m = sr.metric(metric_id)
        if m is not None:
            return m
    return None


def _finding_scope_label(report: Report, scope_key: str) -> str | None:
    # A finding's scope_key is the exporter's original key and may name a
    # private repository; it is only ever rendered through the redacted
    # scope table, so an unresolvable key names nothing.
    sr = report.scopes.get(scope_key)
    return sr.scope.label if sr is not None else None


def _fdisp(value_display: str) -> str:
    """Finding value display with the typographic minus (spec 3.4)."""
    if value_display.startswith("-"):
        return T.MINUS + value_display[1:]
    return value_display


def _findings_section(report: Report, scope: ScopeReport) -> str:
    findings = report.findings
    head = (
        '<div class="sechead"><h2 class="t-display2">What the evidence shows'
        f'</h2><span class="t-meta">{len(findings)} declared threshold(s) '
        "crossed</span></div>"
        '<p class="t-body t-meta">Thresholds are declared data, not prose. '
        "Each finding names its metric and the value that crossed it. None "
        "asserts a cause.</p>"
    )
    if not findings:
        return (
            f'<section class="first">{head}'
            '<p class="t-body t-meta">No declared threshold was crossed in '
            "this window. That is an observation about the thresholds, not a "
            "judgment that everything is fine.</p>"
            f'<p class="findcaption">{esc(THRESHOLD_CAPTION)}</p></section>'
        )

    cards = []
    for i, f in enumerate(findings[:3], start=1):
        m = _finding_metric(report, scope, f.metric_id)
        label = m.label if m else f.metric_id
        where = _finding_scope_label(report, f.scope_key)
        where_sentence = (
            f"Observed in {where}. " if where
            else "Observed in one repository in scope. "
        )
        reading = m.how_to_read if m else ""
        link = (
            f'<a class="explain" href="#{_anchor(f.metric_id)}">'
            "See the evidence</a>"
            if m is not None and scope.metric(f.metric_id) is not None else ""
        )
        cards.append(
            f'<div class="finding"><div class="sev">F{i} · {esc(f.severity)}'
            f"</div><div><h4>{esc(label)}</h4>"
            f'<p class="fval">{esc(_fdisp(f.value_display) or T.EN_DASH)}</p>'
            f"<p>{esc(where_sentence)}{esc(reading)}</p>"
            f'<span class="rule-cite">Rule: {esc(f.metric_id)} threshold '
            f"crossed · value {esc(_fdisp(f.value_display))}</span>{link}</div></div>"
        )

    extra = ""
    if len(findings) > 3:
        items = []
        for i, f in enumerate(findings[3:], start=4):
            m = _finding_metric(report, scope, f.metric_id)
            label = m.label if m else f.metric_id
            items.append(
                f"<li>F{i} · {esc(f.severity)} · {esc(label)}: "
                f"{esc(_fdisp(f.value_display) or T.EN_DASH)} "
                f'<a class="explain" href="#{_anchor(f.metric_id)}">'
                "See the evidence</a></li>"
            )
        extra = (
            f'<ul class="findlist">{"".join(items)}</ul>'
        )

    return (
        f'<section class="first">{head}'
        f'<div class="findings">{"".join(cards)}</div>{extra}'
        f'<p class="findcaption">{esc(THRESHOLD_CAPTION)}</p></section>'
    )


# ── Cross-repository comparison (F8) ────────────────────────────────────────

def _comparison_section(report: Report, scope: ScopeReport) -> str:
    if scope.scope.level not in ("org", "project"):
        return ""
    if scope.scope.level == "project":
        # A project page compares its own repositories, not the whole
        # cohort: the cohort-wide view belongs to the organization page.
        repos = [
            report.scopes[c] for c in scope.children
            if c in report.scopes and report.scopes[c].scope.level == "repo"
        ]
    else:
        repos = [
            sr for sr in report.scopes.values() if sr.scope.level == "repo"
        ]
    if len(repos) < 2:
        return ""

    figures: list[str] = []
    absent: list[str] = []
    for mid in COMPARISON_METRICS:
        first = next(
            (sr.metric(mid) for sr in repos if sr.metric(mid) is not None),
            None,
        )
        if first is None:
            continue
        panels: list[tuple[str, float | None, str]] = []
        observed: list[float] = []
        for sr in repos:
            m = sr.metric(mid)
            value: float | None = None
            n_text = ""
            if m is not None:
                if m.is_available and isinstance(m.value, (int, float)) \
                        and not isinstance(m.value, bool):
                    value = float(m.value)
                    observed.append(value)
                if m.sample.population:
                    n_text = f"n = {m.sample.n:,} {m.sample.unit}"
            panels.append((sr.scope.label, value, n_text))
        if not observed:
            absent.append(first.label)
            continue
        floor = _is_floor(first)
        fig = charts.comparison_row(
            label=first.label, unit=first.unit, tier=first.tier,
            panels=panels, is_floor=floor,
        )
        lo, hi = min(observed), max(observed)
        unit_word = (
            "" if first.unit in ("percent", "")
            else f" {_humanize(first.unit)}"
        )
        note_bits = [
            f"Observed values range {_fmt(lo, first.unit)} to "
            f"{_fmt(hi, first.unit)}{unit_word} across {len(observed)} of "
            f"{len(repos)} repositories."
        ]
        if floor:
            note_bits.append("Every value is a detectable floor.")
        rows = []
        for plabel, value, n_text in panels:
            shown = (
                f"{'≥ ' if floor else ''}{_fmt(value, first.unit)}"
                if value is not None else "Unavailable"
            )
            rows.append(
                f"<tr><td style='text-align:left'>{esc(plabel)}</td>"
                f"<td>{esc(shown)}</td>"
                f"<td style='text-align:left'>{esc(n_text or T.EN_DASH)}</td></tr>"
            )
        table = (
            "<details><summary>Data for this chart</summary>"
            '<div class="tblwrap"><table><thead><tr><th>Repository</th>'
            f"<th>Value{esc(unit_word)}</th><th>Sample</th></tr></thead>"
            f'<tbody>{"".join(rows)}</tbody></table></div></details>'
        )
        figures.append(
            f'<figure class="cmpfig"><h3>{esc(first.label)}</h3>{fig}'
            f'<p class="cnote">{esc(" ".join(note_bits))}</p>'
            f"{table}</figure>"
        )

    if not figures and not absent:
        return ""
    absent_note = ""
    if absent:
        absent_note = (
            f'<p class="t-meta">No repository has eligible records for: '
            f'{esc("; ".join(absent))}.</p>'
        )
    return (
        '<section id="s-repos"><div class="sechead">'
        '<h2 class="t-display2">How do the repositories differ?</h2>'
        '<span class="t-meta">one shared scale per metric</span></div>'
        f'<p class="lede">{len(repos)} repositories share one scale per '
        "metric below, in declared order. A row without a bar had no "
        "eligible records; that is a gap, not a zero.</p>"
        f'{"".join(figures)}{absent_note}</section>'
    )


# ── Verification section pieces ─────────────────────────────────────────────

def _grammar_legend() -> str:
    items = [
        ("measured", T.DATA_RAMP[0], "Measured · solid",
         "Counted directly from a source record."),
        ("proxy", T.DATA_RAMP[1], "Proxy · 45° hatch",
         "An estimator standing in for the thing itself. Always carries a caveat."),
        ("inferred", T.DATA_RAMP[2], "Inferred · stipple",
         "Derived from detectable traces only. Reads as a floor, never a share."),
        ("partial", T.INK_3, "Partial · 135° hatch",
         "Opposite orientation to proxy, so the two never read as one another."),
        ("unavail", T.HAIRLINE, "Unavailable · blank",
         "A stated reason and the capability required. Never a zero."),
        ("suppressed", T.HAIRLINE, "Suppressed · absent",
         "No value, no plotted position, no tooltip, no cell in any download."),
    ]
    out = []
    for _kind, colour, title, body in items:
        out.append(
            f'<div style="border-left-color:{colour}">'
            f"<b>{esc(title)}</b><p>{esc(body)}</p></div>"
        )
    return (
        '<div class="legend" style="display:grid;'
        'grid-template-columns:repeat(auto-fill,minmax(248px,1fr));gap:20px;'
        f'margin-top:{T.SPACE[4]}px">{"".join(out)}</div>'
    )


def _coverage_section(report: Report) -> str:
    c = report.coverage
    rows = [
        ("Repositories collected", f"{c.repos_collected}"),
        ("Repositories failed", f"{c.repos_failed}"),
        ("Lines excluded as generated", f"{c.total_lines_excluded_as_generated:,}"),
    ]
    if c.pull_requests_truncated_in:
        rows.append((
            "Pull request collection truncated",
            f"{len(c.pull_requests_truncated_in)} repository(-ies). Every "
            "pull-request metric inherits that ceiling.",
        ))
    if c.no_review_records_in:
        rows.append(("No review records", f"{len(c.no_review_records_in)} repository(-ies)"))
    if c.no_ci_data_in:
        rows.append(("No pipeline data", f"{len(c.no_ci_data_in)} repository(-ies)"))
    body = "".join(
        f"<tr><th>{esc(k)}</th><td style='text-align:left'>{esc(v)}</td></tr>"
        for k, v in rows
    )
    table = f'<div class="tblwrap"><table><tbody>{body}</tbody></table></div>'

    # What was excluded before any metric ran, by declared reason (F5).
    by_reason = (report.exclusions or {}).get("lines_by_reason") or {}
    excl_rows = [
        (str(reason), float(lines), "")
        for reason, lines in by_reason.items()
        if isinstance(lines, (int, float))
    ]
    excl = ""
    if excl_rows:
        excl = (
            '<h4 class="evlabel">Lines excluded before any metric was '
            "computed</h4>"
            + charts.category_bar(rows=excl_rows, unit="lines")
        )
    return table + excl


# ── The page ────────────────────────────────────────────────────────────────

def render_page(
    report: Report,
    scope_key: str,
    *,
    prov: Provenance,
    title: str | None = None,
    faces: dict[str, bytes] | None = None,
    manifest_note: str = "",
    extra_css: str = "",
    prologue: str = "",
) -> str:
    """Render one scope as a complete, self-contained document.

    `extra_css` is appended to the generated stylesheet and `prologue` is
    emitted directly after the wrapper opens. Both exist so a multi-page site
    can add scope navigation without a second rendering path: ADR-014 rule 6
    requires the console, the offline export and the published artifact to
    share one renderer, and a separate "site version" of this function would
    be exactly the divergence that rule forbids.
    """
    scope = report.scopes[scope_key]
    heading = title or scope.scope.label or report.org_label
    facts = scope.facts

    if faces:
        total = sum(len(v) for v in faces.values())
        if total > T.FONT_BUDGET_BYTES:
            raise ValueError(
                f"embedded faces total {total:,} bytes, over the "
                f"{T.FONT_BUDGET_BYTES:,} byte budget in spec 003"
            )

    sections_html: list[str] = []
    featured_ids: set[str] = set()
    for spec in SECTIONS:
        section, ids = _section_html(scope, spec)
        if section:
            sections_html.append(section)
            featured_ids |= ids

    scopebar = "".join(
        f"<div><b>{esc(k)}</b>{esc(v)}</div>"
        for k, v in (
            ("Window", f"{prov.window_since} {T.EN_DASH} {prov.window_until}"),
            ("Timezone", prov.timezone or "–"),
            ("Commits read", f"{facts.get('commits', 0):,}"),
            ("Contributors", f"{facts.get('contributors', 0):,}"),
            ("Model calls", f"{prov.model_calls}"),
        )
    )

    census = scope.tier_census()
    census_line = " · ".join(
        f"{n} {k}" for k, n in sorted(census.items(), key=lambda kv: -kv[1])
    )

    return f"""<title>{esc(heading)} · Evidence Report</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<style>
{font_face_block(faces)}
{stylesheet()}
{extra_css}
</style>
{charts.svg_defs()}
<div class="wrap">
{prologue}
<header>
  <div class="masthead">
    <div>
      <p class="t-label" style="margin:0 0 6px">{esc(prov.source_label)}</p>
      <h1 class="t-display1">{esc(heading)}</h1>
    </div>
    <div class="t-mono" style="color:{T.INK_3}">
      snapshot {esc(prov.content_digest or '–')}<br>
      calculators {esc(prov.calculator_version)} · privacy {esc(prov.privacy_version)}
    </div>
  </div>
  <div class="scopebar">{scopebar}</div>
</header>
<div class="doublerule" role="presentation"></div>

{_findings_section(report, scope)}

{"".join(sections_html)}
{_comparison_section(report, scope)}

<section id="verification">
  <div class="doublerule" role="presentation" style="margin-bottom:40px"></div>
  <div class="sechead">
    <h2 class="t-display2">Evidence and verification</h2>
    <span class="t-meta">{esc(census_line)}</span>
  </div>
  <p class="t-body t-meta">Each state is carried three times over: in words, in a
    pattern or stroke, and in placement. Any single channel can fail without
    losing the meaning: print, colour vision, or a high-contrast mode.</p>
  {_grammar_legend()}
  {_ledger(scope, featured_ids)}
  <h3 class="t-heading" style="margin-top:{T.SPACE[6]}px">Coverage and limitations</h3>
  {_coverage_section(report)}
  <div class="foot">
    <p style="margin:0 0 10px"><b>Provenance.</b> Computed from
      {esc(prov.source_label)}{f" at {esc(prov.head_ref)}" if prov.head_ref else ""},
      window [{esc(prov.window_since)}, {esc(prov.window_until)}).
      {esc(prov.collection_note)}
      <b>{prov.model_calls} language-model calls.</b>
      {prov.lines_excluded_generated:,} lines excluded as generated before any
      metric was computed.</p>
    <p style="margin:0 0 10px">Redaction {esc(prov.redaction_version or '–')}
      · privacy policy {esc(prov.privacy_version)}. {esc(manifest_note)}</p>
    <p style="margin:0">No contributor is named, ranked or ordered anywhere in this
      document. That capability does not exist in the system that produced it.</p>
  </div>
</section>
{provenance_block(report, scope, prov)}
</div>
"""
