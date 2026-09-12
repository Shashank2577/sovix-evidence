"""Page assembly.

Turns a (redacted) Report into one self-contained HTML document. The output
references no remote asset: leak test LT-04 fails the build if it does.

The same function serves the console, the offline export and the published
artifact, which is ADR-014 rule 6: one rendering path, so there is only one
thing to test and the three can never disagree.
"""

from __future__ import annotations

import hashlib
import html
import json
from dataclasses import dataclass

from . import charts, tokens as T
from .model import Metric, Report, ScopeReport
from .style import font_face_block, stylesheet


def esc(s: object) -> str:
    return html.escape(str(s), quote=True)


# Family -> report section, per spec 003 section 5.0. Family determines
# placement; the metric's type determines its chart form.
SECTIONS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("Delivery and process", ("delivery", "process")),
    ("Volume and cadence", ("velocity", "temporal")),
    ("Agent and cost", ("ai",)),
    ("Quality signals", ("quality", "ci")),
    ("People", ("people",)),
)

# Cards promoted to the top of a section. Registry order otherwise; never
# value order, because ordering by value is the ranking primitive.
LEAD_METRICS = (
    "process.review_coverage",
    "delivery.lead_time_p50",
    "ai.detected_commit_share",
    "quality.rework_rate",
    "people.active_contributors",
)


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


def _short_digest(s: str, n: int = 12) -> str:
    d = hashlib.sha256(s.encode()).hexdigest()
    return f"{d[:8]}·{d[8:8+4]}" if n >= 12 else d[:n]


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


# ── metric card ─────────────────────────────────────────────────────────────

def metric_card(m: Metric, *, series=None, explain_href: str = "#evidence") -> str:
    """One F1 card. Absence renders as absence, never as zero."""
    if not m.is_available:
        reason = m.no_sources_reason or "No eligible records in this window."
        # Keep the remedy, drop any shell command: a report is not a console.
        reason_text = reason.split("`")[0].strip() or reason
        body = charts.unavailable_block(
            reason="Unavailable · not collected",
            needs=reason_text,
        )
        chips = (
            f'<span class="chip unavail">Unavailable</span>'
            f'<span class="chip unavail">Not zero</span>'
        )
        return (
            f'<article class="card"><h3>{esc(m.label)}</h3>{body}'
            f'<div class="quals">{chips}</div>'
            f'<a class="explain" href="{esc(explain_href)}">What this needs</a>'
            f"</article>"
        )

    # A floor is not a share, and must not be read as one.
    prefix = "≥ " if m.is_floor else ""
    value_html = f'<span class="t-data-xl">{prefix}{esc(m.display)}</span>'

    den = _denominator_line(m)
    # The tier travels to the mark, not only to the chip: a proxy sparkline is
    # drawn with the proxy stroke so the qualifier survives being skim-read.
    spark = charts.sparkline(series, tier=m.tier) if series is not None else ""

    chips = [charts.evidence_chip(tier=m.tier, confidence=m.confidence)]
    if m.sample.is_partial:
        chips.append(
            f'<span class="chip">{m.sample.coverage_pct:.0f}% coverage</span>'
        )
    chips = chips[: T.MAX_CHIPS_PER_CARD]

    return (
        f'<article class="card"><h3>{esc(m.label)}</h3>'
        f'<div class="val">{value_html}</div>'
        f'{den}{spark}'
        f'<div class="quals">{"".join(chips)}</div>'
        f'<a class="explain" href="{esc(explain_href)}">Explain</a>'
        f"</article>"
    )


def _denominator_line(m: Metric) -> str:
    """Numerator and denominator ride with every rate. 0/0 is never 0%."""
    parts: list[str] = []
    ins = m.inputs or {}
    numeric = [
        (k, v) for k, v in ins.items()
        if k != "value" and isinstance(v, (int, float))
    ]
    if m.unit == "percent" and len(numeric) >= 2:
        (kn, vn), (kd, vd) = numeric[0], numeric[1]
        parts.append(f"{vn:,g} {esc(kn)} / {vd:,g} {esc(kd)}")
    elif m.sample.population:
        parts.append(f"over {m.sample.n:,} of {m.sample.population:,} {esc(m.sample.unit)}")

    if m.is_floor:
        parts.append("a detectable floor, not a share")

    direction = T.DIRECTION_TEXT.get(m.direction, "")
    if direction:
        parts.append(direction)

    return f'<div class="den">{" · ".join(parts)}</div>' if parts else ""


# ── sections ────────────────────────────────────────────────────────────────

def _section_cards(scope: ScopeReport, families: tuple[str, ...]) -> tuple[str, str]:
    """Returns (cards_html, density_note). Grammar never changes per screen;
    a section where most tiles share a tier gets a normalising summary so the
    page reads as typeset rather than stickered."""
    metrics: list[Metric] = []
    for fam in families:
        metrics.extend(scope.by_family(fam))
    if not metrics:
        return "", ""

    lead = [m for m in metrics if m.id in LEAD_METRICS]
    rest = [m for m in metrics if m.id not in LEAD_METRICS]
    ordered = lead + rest

    census: dict[str, int] = {}
    for m in ordered:
        census[m.tier] = census.get(m.tier, 0) + 1
    note = ""
    total = len(ordered)
    for tier, count in census.items():
        if tier != T.Kind.MEASURED and count * 2 >= total:
            note = (
                f'<p class="t-meta">{count} of {total} metrics in this section '
                f"are {esc(tier)}. Each is marked individually; the tier is "
                f"a property of how the number was obtained, not a defect.</p>"
            )
            break

    series_for = {
        "velocity.commits_total": "commits",
        "process.review_coverage": "review_coverage",
        "quality.test_line_ratio": "test_ratio",
        "ai.detected_commit_share": "ai_share",
        "people.active_contributors": "contributors",
        "delivery.lead_time_p50": "lead_time",
    }
    cards = []
    for m in ordered[:8]:  # a section shows its lead cards; the table has all
        sid = series_for.get(m.id)
        cards.append(metric_card(m, series=scope.series_by_id(sid) if sid else None))
    return f'<div class="cards">{"".join(cards)}</div>', note


def _all_metrics_table(scope: ScopeReport) -> str:
    rows = []
    for m in scope.metrics:
        avail = "Observed" if m.is_available else "Unavailable"
        disp = esc(m.display) if m.is_available else '<span class="na">–</span>'
        cov = f"{m.sample.coverage_pct:.0f}%" if m.sample.population else "–"
        rows.append(
            f"<tr><td>{esc(m.label)}</td>"
            f'<td class="t-mono">{esc(m.id)}</td>'
            f"<td>{disp}</td><td>{esc(m.tier)}</td>"
            f"<td>{esc(m.confidence)}</td><td>{cov}</td><td>{avail}</td></tr>"
        )
    return (
        '<details open><summary>All metrics in this scope</summary>'
        '<div class="tblwrap"><table><thead><tr>'
        "<th>Metric</th><th>Identifier</th><th>Value</th><th>Evidence kind</th>"
        "<th>Confidence</th><th>Coverage</th><th>State</th>"
        f'</tr></thead><tbody>{"".join(rows)}</tbody></table></div></details>'
    )


def _findings(report: Report) -> str:
    if not report.findings:
        return (
            '<p class="t-body t-meta">No declared threshold was crossed in this '
            "window. That is an observation about the thresholds, not a "
            "judgment that everything is well.</p>"
        )
    out = []
    for f in report.findings:
        rule = (
            f'<span class="rule-cite">Rule: {esc(f.metric_id)} '
            f"threshold crossed · value {esc(f.value_display)}</span>"
            if f.metric_id else ""
        )
        detail = esc(f.detail)
        action = f" {esc(f.action)}" if f.action else ""
        out.append(
            f'<div class="finding"><div class="sev">{esc(f.severity)}</div>'
            f"<div><h4>{esc(f.title)}</h4><p>{detail}{action}</p>{rule}</div></div>"
        )
    return f'<div class="findings">{"".join(out)}</div>'


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
    return f'<div class="tblwrap"><table><tbody>{body}</tbody></table></div>'


def _derivation(m: Metric | None) -> str:
    if m is None:
        return ""
    rows: list[tuple[str, str]] = [("Formula", m.formula)]
    if m.sample.population:
        rows.append((
            "Sample",
            f"n = {m.sample.n:,} of population {m.sample.population:,} "
            f"{m.sample.unit} · {m.sample.coverage_pct:.1f}% coverage",
        ))
    for reason, count in list(m.sample.excluded.items())[:3]:
        if count:
            rows.append(("Excluded", f"{count:,} · {reason}"))
    if m.assumptions:
        rows.append(("Assumption", m.assumptions[0]))
    for ex in m.exemplars[:1]:
        rows.append(("Strongest evidence", f"{ex.headline}. {ex.why_this_proves_it}"))
    body = "".join(
        f"<tr><th>{esc(k)}</th>"
        f"<td style='text-align:left'{' class=\"t-mono\"' if k == 'Formula' else ''}>"
        f"{esc(v)}</td></tr>"
        for k, v in rows
    )
    return (
        f'<h3 class="t-heading" style="margin-top:{T.SPACE[6]}px">'
        f"Derivation · {esc(m.id)}</h3>"
        f'<div class="tblwrap" style="margin-top:12px"><table><tbody>{body}'
        "</tbody></table></div>"
    )


# ── the page ────────────────────────────────────────────────────────────────

def render_page(
    report: Report,
    scope_key: str,
    *,
    prov: Provenance,
    title: str | None = None,
    faces: dict[str, bytes] | None = None,
    manifest_note: str = "",
) -> str:
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

    sections_html = []
    for name, families in SECTIONS:
        cards, note = _section_cards(scope, families)
        if not cards:
            continue
        sections_html.append(
            f'<section><div class="sechead"><h2 class="t-display2">{esc(name)}</h2>'
            f'</div>{note}{cards}</section>'
        )

    # Charts: a count series as columns, a rate series as a line with its gaps
    # left as gaps.
    chart_blocks = []
    for series_id, form, metric_id, note in (
        ("commits", "column", "velocity.commits_total",
         "Counts · observed intervals only"),
        ("review_coverage", "line", "process.review_coverage",
         "Rate · gaps are never bridged"),
        ("ai_share", "line", "ai.detected_commit_share",
         "A detectable floor · only tools that left a trace are counted"),
    ):
        s = scope.series_by_id(series_id)
        if not s or s.observed_count == 0:
            continue
        src = scope.metric(metric_id)
        tier = src.tier if src else T.Kind.MEASURED
        chart_blocks.append(
            f'<section><div class="sechead">'
            f'<h2 class="t-display2">{esc(s.label)}</h2>'
            f'<span class="t-meta">{esc(note)}</span></div>'
            f'<div class="chartblk">'
            f'{charts.interval_series(s, form=form, tier=tier)}</div></section>'
        )

    review = scope.metric("process.review_coverage")
    prop = ""
    if review and review.is_available:
        ins = review.inputs or {}
        num = float(ins.get("reviewed") or 0)
        den = float(ins.get("merged") or 0)
        prop = charts.proportion_bar(
            numerator=num, denominator=den,
            numerator_label="reviewed", remainder_label="no review record",
            tier=review.tier, is_floor=review.is_floor,
        )
    meter = ""
    if review and review.sample.population:
        meter = charts.completeness_meter(
            n=review.sample.n, population=review.sample.population,
        )
    proportion_section = ""
    if prop or meter:
        proportion_section = (
            f'<section><div class="sechead">'
            f'<h2 class="t-display2">Proportion and completeness</h2>'
            f'<span class="t-meta">Numerator and denominator always adjacent'
            f"</span></div>"
            f'<div class="cards wide">'
            f'<article class="card"><h3>Merged changes carrying a review</h3>{prop}</article>'
            f'<article class="card"><h3>Collection completeness</h3>{meter}</article>'
            f"</div></section>"
        )

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
</style>
{charts.svg_defs()}
<div class="wrap">
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

<section class="first">
  <div class="sechead">
    <h2 class="t-display2">What the evidence shows</h2>
    <span class="t-meta">{len(report.findings)} declared threshold(s) crossed</span>
  </div>
  <p class="t-body t-meta">Thresholds are declared data, not prose. Each finding
    names its metric and the value that crossed it. None asserts a cause.</p>
  {_findings(report)}
</section>

{"".join(sections_html)}
{"".join(chart_blocks)}
{proportion_section}

<section id="evidence">
  <div class="doublerule" role="presentation" style="margin-bottom:40px"></div>
  <div class="sechead">
    <h2 class="t-display2">Evidence and verification</h2>
    <span class="t-meta">{esc(census_line)}</span>
  </div>
  <p class="t-body t-meta">Each state is carried three times over: in words, in a
    pattern or stroke, and in placement. Any single channel can fail without
    losing the meaning: print, colour vision, or a high-contrast mode.</p>
  {_grammar_legend()}
  {_derivation(review)}
  <h3 class="t-heading" style="margin-top:{T.SPACE[6]}px">Coverage and limitations</h3>
  {_coverage_section(report)}
  <h3 class="t-heading" style="margin-top:{T.SPACE[6]}px">Every metric</h3>
  {_all_metrics_table(scope)}
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
