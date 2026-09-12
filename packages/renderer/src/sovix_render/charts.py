"""Pure-SVG generators for the F-catalog (spec 003 sections 3 and 4).

Standard library only. Section 4.14 mandates bespoke generators rather than a
charting framework, and the reasons it gives are constraints on this module:

* **Deterministic.** The same input MUST produce byte-identical output. Every
  coordinate goes through :func:`_n`, so no platform-dependent float repr and
  no locale can reach the markup. Nothing here reads a dict in insertion-
  sensitive ways, measures text with a real font, or animates.
* **Complete without JavaScript.** Each generator returns a finished string.
  No file is written, nothing is printed, no DOM is assumed.
* **Absence is absence.** ``None`` is never substituted with zero, a gap is
  never bridged by a line, and a suppressed or unavailable interval gets no
  plotted position, no marker and no tooltip target. The only thing absence
  produces is a stated region and a sentence.
* **No judgment.** No colour outside :mod:`tokens` is reachable (see
  :func:`_fill`), so no red/green can enter, and no visual channel anywhere in
  this module derives from ``Metric.direction``.

Report text is untrusted input: everything interpolated into markup passes
through :func:`esc`.
"""

from __future__ import annotations

import html

from . import tokens as T
from .model import Series

__all__ = [
    "esc",
    "svg_defs",
    "sparkline",
    "interval_series",
    "proportion_bar",
    "distribution_strip",
    "completeness_meter",
    "composition_bar",
    "unavailable_block",
    "evidence_chip",
]

UNAVAILABLE_NO_RECORDS = f"Unavailable {T.EN_DASH} no eligible records"
NO_ELIGIBLE_RECORDS = "No eligible records"
SUMMARY_ONLY = f"summary-only import {T.EN_DASH} distribution unavailable"


# ── Primitives ──────────────────────────────────────────────────────────────

def esc(text: object) -> str:
    """Escape untrusted report text for both attribute and element context."""
    return html.escape(str(text), quote=True)


def _n(value: float) -> str:
    """Coordinate formatting: 2 decimals, no trailing zeros, no ``-0``.

    Determinism lives here. Nothing else in this module formats a coordinate.
    """
    r = round(float(value), 2) + 0.0
    if r == int(r):
        return str(int(r))
    return f"{r:.2f}".rstrip("0")


def _ty(name: str) -> str:
    """A ``style`` attribute body for one TYPE_SCALE entry.

    The font stacks in tokens.py contain double quotes, so every attribute
    built from this MUST be single-quoted. The stacks contain no single quote,
    so nothing here can break out of an attribute.
    """
    family, weight, size, _line, extra = T.TYPE_SCALE[name]
    css = f"font-family:{family};font-size:{size}px;font-weight:{weight}"
    if extra:
        # text-transform is applied in Python (see _label_text) because static
        # SVG consumers do not all honour it; the rest of the extras are safe.
        css += ";" + ";".join(
            part for part in extra.split(";") if not part.startswith("text-transform")
        )
    return css


def _label_text(text: str) -> str:
    """TYPE_SCALE['label'] declares uppercase; apply it to the string itself."""
    return str(text).upper()


def _text(x: float, y: float, body: str, scale: str = "meta",
          *, fill: str = T.INK_3, anchor: str = "start") -> str:
    """One escaped <text>. ``body`` MUST already be escaped by the caller."""
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    return (
        f'<text x="{_n(x)}" y="{_n(y)}" fill="{fill}"{a} '
        f"style='{_ty(scale)}'>{body}</text>"
    )


def _open(width: float, height: float, aria: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{_n(width)}" '
        f'height="{_n(height)}" viewBox="0 0 {_n(width)} {_n(height)}" '
        f'role="img" aria-label="{esc(aria)}">'
    )


# Every fill a generator may use, by token name. A colour that is not a token
# cannot be reached through this function, which is what makes the forbidden
# red/green/amber palette unrepresentable rather than merely discouraged.
_FILLS: dict[str, str] = {
    "accent": T.ACCENT,
    "accent-active": T.ACCENT_ACTIVE,
    "canvas": T.CANVAS,
    "surface": T.SURFACE,
    "recessed": T.RECESSED,
    "rule": T.RULE,
    "hairline": T.HAIRLINE,
    "ink": T.INK,
    "ink-2": T.INK_2,
    "ink-3": T.INK_3,
    **{f"data-{i + 1}": c for i, c in enumerate(T.DATA_RAMP)},
    **{f"seq-{i + 1}": c for i, c in enumerate(T.SEQ_RAMP)},
    # Patterns from svg_defs(). "outline" is the unpriced treatment: no fill.
    "p-proxy": "url(#p-proxy)",
    "p-inferred": "url(#p-inferred)",
    T.PARTIAL_PATTERN: f"url(#{T.PARTIAL_PATTERN})",
    "outline": "none",
}


def _fill(token: str | None, default: str = "data-1") -> str:
    name = default if token is None else str(token)
    try:
        return _FILLS[name]
    except KeyError:
        raise ValueError(
            f"{name!r} is not a design token. Charts may only use the fills in "
            f"tokens.py: {', '.join(sorted(_FILLS))}."
        ) from None


def _kind_fill(tier: str) -> str:
    """Tier fill grammar (spec 3.2): pattern for proxy/inferred, solid else."""
    pattern = T.KIND_GRAMMAR.get(tier, T.KIND_GRAMMAR[T.Kind.MEASURED])[0]
    return _fill(pattern) if pattern else _fill("data-1")


def _kind_dash(tier: str) -> str:
    dash = T.KIND_GRAMMAR.get(tier, T.KIND_GRAMMAR[T.Kind.MEASURED])[1]
    return f' stroke-dasharray="{dash}"' if dash else ""


# ── Numbers ─────────────────────────────────────────────────────────────────

def _val(value: float | None, unit: str = "") -> str:
    """Spec 3.4 display of one value. Never called with None as a number."""
    if value is None:
        return T.EN_DASH
    v = float(value)
    if unit == "percent":
        return f"{v:.1f}%"
    if unit in ("usd", "currency"):
        return f"${v:,.2f}" if abs(v) >= 1 else f"${v:.4f}"
    if v == int(v) and abs(v) < 1e15:
        return f"{int(v):,}"
    return f"{round(v, 2):,.2f}".rstrip("0").rstrip(".")


def _pct(numerator: float, denominator: float) -> float:
    """Share as 0-100. Callers MUST have excluded a zero denominator."""
    return numerator / denominator * 100.0


def _nice_max(value: float, unit: str = "") -> float:
    """A rounded axis maximum at or above ``value``. Never below it."""
    if unit == "percent":
        return 100.0
    if value <= 0:
        return 1.0
    p = 1.0
    while p * 10 <= value:
        p *= 10
    while p > value:
        p /= 10
    frac = value / p
    for m in (1.0, 2.0, 2.5, 4.0, 5.0, 8.0, 10.0):
        if frac <= m + 1e-9:
            return round(m * p, 6)
    return round(10 * p, 6)


def _ticks(hi: float) -> list[float]:
    """0 plus at most 4 gridlines (spec 4.3)."""
    return [round(hi * i / 4, 6) for i in range(5)]


# ── Shared fragments ────────────────────────────────────────────────────────

def _runs(series: Series) -> list[list[int]]:
    """Index runs of observed points. A gap ends a run; nothing bridges it."""
    out: list[list[int]] = []
    current: list[int] = []
    for i, p in enumerate(series.points):
        if p.value is None:
            if current:
                out.append(current)
                current = []
        else:
            current.append(i)
    if current:
        out.append(current)
    return out


def _gap_phrases(series: Series) -> list[str]:
    """Human month ranges for each gap run, for footers and aria-labels."""
    phrases = []
    for start, end in series.gap_runs:
        a = series.points[start].month
        b = series.points[end].month
        phrases.append(a if start == end else f"{a} to {b}")
    return phrases


def _observed_range(series: Series) -> tuple[float, float]:
    values = [p.value for p in series.points if p.value is not None]
    return (min(values), max(values)) if values else (0.0, 0.0)


def _unavailable_svg(width: float, height: float, *, reason: str,
                     aria: str) -> str:
    """The in-slot absence treatment: stated reason, no frame, no zero axis.

    ``reason`` and ``aria`` are raw text and are escaped here.
    """
    return "".join([
        _open(width, height, aria),
        _text(0, height / 2 - 4, esc(UNAVAILABLE_NO_RECORDS), "data", fill=T.INK),
        _text(0, height / 2 + 16, esc(reason), "meta", fill=T.INK_3),
        "</svg>",
    ])


# ── Pattern defs ────────────────────────────────────────────────────────────

def svg_defs() -> str:
    """The three pattern defs, once per page (spec 3.2, 3.3).

    ``userSpaceOnUse`` at a fixed 4px pitch, so density cannot vary with chart
    size or zoom. Proxy hatches at 45 degrees and partial at 135 degrees, which
    is what keeps a proxy metric and a partial interval from ever reading as
    the same thing on one plot.
    """
    a = _n(T.PATTERN_ALPHA)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" '
        'aria-hidden="true" focusable="false" '
        'style="position:absolute;width:0;height:0;overflow:hidden">'
        "<defs>"
        # proxy: 45 degree hatch, 1px lines, 4px pitch
        '<pattern id="p-proxy" patternUnits="userSpaceOnUse" width="4" '
        'height="4" patternTransform="rotate(45)">'
        f'<line x1="0" y1="0" x2="0" y2="4" stroke="{T.ACCENT}" '
        f'stroke-width="1" stroke-opacity="{a}"/>'
        "</pattern>"
        # inferred: stipple, 1.2px dots on a 4px grid
        '<pattern id="p-inferred" patternUnits="userSpaceOnUse" width="4" '
        'height="4">'
        f'<circle cx="1" cy="1" r="0.6" fill="{T.ACCENT}" fill-opacity="{a}"/>'
        "</pattern>"
        # partial: 135 degree ink hatch at 25% alpha
        f'<pattern id="{T.PARTIAL_PATTERN}" patternUnits="userSpaceOnUse" '
        'width="4" height="4" patternTransform="rotate(135)">'
        f'<line x1="0" y1="0" x2="0" y2="4" stroke="{T.INK}" '
        'stroke-width="1" stroke-opacity="0.25"/>'
        "</pattern>"
        "</defs></svg>"
    )


# ── F1 sparkline ────────────────────────────────────────────────────────────

def sparkline(series: Series, *, width: int = 240, height: int = 40,
              tier: str = T.Kind.MEASURED) -> str:
    """F1 sparkline with its scale printed (spec 4.2, 4.12).

    Min and max print at the left and right of the strip: an unscaled
    sparkline is a forbidden form, so the labels are part of the mark, not a
    configuration. Gaps break the line and are named in the aria-label; they
    receive no plotted position.
    """
    label = series.label or series.id
    total = len(series.points)
    observed = series.observed_count
    gaps = _gap_phrases(series)

    if observed == 0:
        aria = (
            f"Sparkline of {label}: no intervals observed of {total}. "
            f"{NO_ELIGIBLE_RECORDS} for {'; '.join(gaps) or 'the whole window'}."
        )
        return _unavailable_svg(
            width, height,
            reason=f"{NO_ELIGIBLE_RECORDS} in {total} intervals",
            aria=aria,
        )

    lo, hi = _observed_range(series)
    lo_s, hi_s = _val(lo, series.unit), _val(hi, series.unit)

    left = 8 + 7 * len(lo_s)
    right = width - (8 + 7 * len(hi_s))
    top, bottom = 8.0, height - 8.0
    span = max(right - left, 1.0)
    plot_h = max(bottom - top, 1.0)

    def px(i: int) -> float:
        return left if total <= 1 else left + span * i / (total - 1)

    def py(v: float) -> float:
        if hi == lo:
            return top + plot_h / 2
        return bottom - (v - lo) / (hi - lo) * plot_h

    runs = _runs(series)
    body: list[str] = []
    for run in runs:
        pts = " ".join(
            f"{_n(px(i))},{_n(py(series.points[i].value))}" for i in run
        )
        if len(run) == 1:
            i = run[0]
            body.append(
                f'<circle cx="{_n(px(i))}" cy="{_n(py(series.points[i].value))}"'
                f' r="1.5" fill="{_fill("data-1")}"/>'
            )
        else:
            body.append(
                f'<polyline points="{pts}" fill="none" '
                f'stroke="{_fill("data-1")}" stroke-width="2" '
                f'stroke-linecap="round"{_kind_dash(tier)}/>'
            )

    last = runs[-1][-1]
    body.append(
        f'<circle cx="{_n(px(last))}" cy="{_n(py(series.points[last].value))}"'
        f' r="1.5" fill="{_fill("accent-active")}"/>'
    )

    gap_sentence = (
        f"{NO_ELIGIBLE_RECORDS} for {'; '.join(gaps)}."
        if gaps else "All intervals observed."
    )
    aria = (
        f"Sparkline of {label}: horizontal axis {total} intervals from "
        f"{series.points[0].month} to {series.points[-1].month}, vertical axis "
        f"{lo_s} to {hi_s} {series.unit}. {observed} of {total} intervals "
        f"observed. {gap_sentence}"
    )

    mid = height / 2 + 4
    return "".join([
        _open(width, height, aria),
        _text(0, mid, esc(lo_s), "meta", fill=T.INK_3),
        *body,
        _text(width, mid, esc(hi_s), "meta", fill=T.INK_3, anchor="end"),
        "</svg>",
    ])


# ── F2 interval series ──────────────────────────────────────────────────────

def interval_series(series: Series, *, form: str, width: int = 640,
                    height: int = 196, emphasise_max: bool = True,
                    tier: str = T.Kind.MEASURED) -> str:
    """F2 interval series (spec 4.3).

    ``form`` is ``"column"`` for countable events per interval or ``"line"``
    for rates and durations. Never both on one plot and never two scales, so
    the caller chooses one. Gap runs render as a hatched region labelled
    "No eligible records" with its month range; the line stops at the edge of a
    gap and resumes after it.
    """
    if form not in ("column", "line"):
        raise ValueError(
            f"form must be 'column' (counts) or 'line' (rates); got {form!r}. "
            "Mixing the two on one plot is forbidden by spec 4.3."
        )

    label = series.label or series.id
    total = len(series.points)
    observed = series.observed_count
    gaps = series.gap_runs
    gap_phrases = _gap_phrases(series)
    footer_count = f"{observed} of {total} intervals observed"

    if total == 0 or observed == 0:
        aria = (
            f"{label} per month: {observed} of {total} intervals observed. "
            f"{NO_ELIGIBLE_RECORDS} for "
            f"{'; '.join(gap_phrases) or 'the whole window'}."
        )
        return _unavailable_svg(
            width, height,
            reason=f"{NO_ELIGIBLE_RECORDS} {T.EN_DASH} {footer_count}",
            aria=aria,
        )

    m_left, m_right, m_top = 52.0, 14.0, 12.0
    plot_bottom = height - 58.0
    plot_w = max(width - m_left - m_right, 1.0)
    plot_h = max(plot_bottom - m_top, 1.0)

    _lo, hi_obs = _observed_range(series)
    hi = _nice_max(hi_obs, series.unit)
    band = plot_w / total

    def bx(i: int) -> float:
        return m_left + band * (i + 0.5)

    def by(v: float) -> float:
        return plot_bottom - (v / hi if hi else 0) * plot_h

    parts: list[str] = []

    # Gridlines and y labels first, so marks sit above them.
    for t in _ticks(hi):
        y = by(t)
        if t > 0:
            parts.append(
                f'<line x1="{_n(m_left)}" y1="{_n(y)}" '
                f'x2="{_n(m_left + plot_w)}" y2="{_n(y)}" '
                f'stroke="{_fill("hairline")}" stroke-width="1"/>'
            )
        parts.append(
            _text(m_left - 8, y + 4, esc(_val(t, series.unit)), "meta",
                  fill=T.INK_3, anchor="end")
        )

    # Frame: left and bottom only.
    parts.append(
        f'<path d="M{_n(m_left)} {_n(m_top)} V{_n(plot_bottom)} '
        f'H{_n(m_left + plot_w)}" fill="none" stroke="{_fill("rule")}" '
        'stroke-width="1"/>'
    )

    # Gap regions: a marked uncollected band, never a zero.
    for start, end in gaps:
        x = m_left + band * start
        w = band * (end - start + 1)
        parts.append(
            f'<rect x="{_n(x)}" y="{_n(m_top)}" width="{_n(w)}" '
            f'height="{_n(plot_h)}" fill="{_fill(T.PARTIAL_PATTERN)}"/>'
        )
        if w >= 96:
            parts.append(
                _text(x + w / 2, m_top + plot_h / 2, esc(NO_ELIGIBLE_RECORDS),
                      "label", fill=T.INK_2, anchor="middle")
            )

    # Marks.
    if form == "column":
        bar_w = band * 0.62
        for i, p in enumerate(series.points):
            if p.value is None:
                continue
            y = by(p.value)
            fill = (
                _fill("accent-active")
                if emphasise_max and p.value == hi_obs and tier == T.Kind.MEASURED
                else _kind_fill(tier)
            )
            parts.append(
                f'<rect x="{_n(bx(i) - bar_w / 2)}" y="{_n(y)}" '
                f'width="{_n(bar_w)}" height="{_n(plot_bottom - y)}" '
                f'fill="{fill}" stroke="{_fill("data-1")}" stroke-width="1"/>'
            )
    else:
        for run in _runs(series):
            pts = " ".join(
                f"{_n(bx(i))},{_n(by(series.points[i].value))}" for i in run
            )
            if len(run) == 1:
                i = run[0]
                parts.append(
                    f'<circle cx="{_n(bx(i))}" '
                    f'cy="{_n(by(series.points[i].value))}" r="2.5" '
                    f'fill="{_fill("data-1")}"/>'
                )
            else:
                parts.append(
                    f'<polyline points="{pts}" fill="none" '
                    f'stroke="{_fill("data-1")}" stroke-width="2" '
                    f'stroke-linejoin="round"{_kind_dash(tier)}/>'
                )

    if emphasise_max:
        i_max = next(
            i for i, p in enumerate(series.points) if p.value == hi_obs
        )
        parts.append(
            _text(bx(i_max), by(hi_obs) - 6, esc(_val(hi_obs, series.unit)),
                  "data", fill=T.INK, anchor="middle")
        )

    # X ticks, thinned so labels never collide.
    step = 1
    while total / step > 8:
        step += 1
    for i, p in enumerate(series.points):
        if i % step:
            continue
        parts.append(
            _text(bx(i), plot_bottom + 16, esc(p.month), "meta",
                  fill=T.INK_3, anchor="middle")
        )

    parts.append(
        _text(m_left, height - 22, esc(footer_count), "meta", fill=T.INK_2)
    )
    if gap_phrases:
        parts.append(
            _text(
                m_left, height - 6,
                esc(f"{NO_ELIGIBLE_RECORDS}: {'; '.join(gap_phrases)}"),
                "meta", fill=T.INK_2,
            )
        )

    gap_sentence = (
        f"{NO_ELIGIBLE_RECORDS} for {'; '.join(gap_phrases)}."
        if gap_phrases else "All intervals observed."
    )
    aria = (
        f"{'Column' if form == 'column' else 'Line'} chart of {label} per "
        f"month in {series.unit}. Vertical axis {_val(0, series.unit)} to "
        f"{_val(hi, series.unit)}, horizontal axis months "
        f"{series.points[0].month} to {series.points[-1].month}. "
        f"{footer_count}; values ranged {_val(_lo, series.unit)} to "
        f"{_val(hi_obs, series.unit)}. {gap_sentence}"
    )
    return _open(width, height, aria) + "".join(parts) + "</svg>"


# ── F3 proportion bar ───────────────────────────────────────────────────────

def proportion_bar(*, numerator: float, denominator: float,
                   numerator_label: str, remainder_label: str,
                   fill_token: str | None = None, width: int = 420,
                   tier: str = T.Kind.MEASURED, is_floor: bool = False) -> str:
    """F3 proportion bar (spec 4.4).

    The numerator and denominator always print beside the percentage; that line
    is not removable. A zero denominator renders the absence treatment, never
    0%, because 0/0 is not an observed zero.
    """
    height = 76
    if denominator <= 0:
        aria = (
            f"{numerator_label} as a share of {remainder_label}: "
            f"{UNAVAILABLE_NO_RECORDS}. No percentage is computable from a "
            "zero population."
        )
        return _unavailable_svg(
            width, height,
            reason=f"{numerator_label} has no eligible population",
            aria=aria,
        )

    pct = _pct(numerator, denominator)
    prefix = "≥ " if is_floor else ""
    value_text = f"{prefix}{pct:.1f}%"
    nd_text = (
        f"{_val(numerator)} / {_val(denominator)} {remainder_label}"
    )

    track_y, track_h = 38.0, 8.0
    track_w = float(width)
    fill_w = max(min(track_w * pct / 100.0, track_w), 0.0)

    parts = [
        _text(0, 20, esc(value_text), "data-xl", fill=T.INK),
        _text(width, 20, esc(nd_text), "data", fill=T.INK_2, anchor="end"),
        # Remainder is blank surface: "not in numerator" carries no colour.
        f'<rect x="0" y="{_n(track_y)}" width="{_n(track_w)}" '
        f'height="{_n(track_h)}" fill="{_fill("surface")}" '
        f'stroke="{_fill("hairline")}" stroke-width="1"/>',
    ]
    if fill_w > 0:
        parts.append(
            f'<rect x="0" y="{_n(track_y)}" width="{_n(fill_w)}" '
            f'height="{_n(track_h)}" '
            f'fill="{_kind_fill(tier) if tier != T.Kind.MEASURED else _fill(fill_token)}"'
            f' stroke="{_fill("data-1")}" stroke-width="1"/>'
        )
    parts += [
        _text(0, track_y + track_h + 16, esc("0"), "meta", fill=T.INK_3),
        _text(width, track_y + track_h + 16, esc("100%"), "meta",
              fill=T.INK_3, anchor="end"),
        _text(0, height - 2, esc(_label_text(numerator_label)), "label",
              fill=T.INK_2),
    ]
    if is_floor:
        parts.append(
            _text(width, height - 2,
                  esc("detectable floor, true share may be higher"), "meta",
                  fill=T.INK_3, anchor="end")
        )

    aria = (
        f"Proportion bar. {numerator_label}: {value_text}, which is "
        f"{_val(numerator)} of {_val(denominator)} {remainder_label}. The "
        f"remainder is not in the numerator and carries no value. Horizontal "
        f"axis 0 to 100 percent."
    )
    if is_floor:
        aria += " This is a detectable floor; the true share may be higher."
    return _open(width, height, aria) + "".join(parts) + "</svg>"


# ── F4 distribution strip ───────────────────────────────────────────────────

def distribution_strip(*, p50: float | None, p90: float | None, n: int,
                       unit: str, axis_max: float | None = None,
                       width: int = 420) -> str:
    """F4 distribution strip (spec 4.5).

    The population size always prints: a median without its population is
    forbidden. When only p50 is known the median tick renders alone with the
    summary-only caption, because inventing a band would draw values that were
    never observed.
    """
    height = 84
    pop_text = f"n = {_val(n)} {unit or 'records'}"

    if p50 is None:
        aria = (
            f"Distribution strip: {UNAVAILABLE_NO_RECORDS}. No median is "
            f"available for {pop_text}."
        )
        return _unavailable_svg(
            width, height, reason=f"no median observed for {pop_text}",
            aria=aria,
        )

    hi = axis_max if axis_max is not None else _nice_max(
        max(p50, p90) if p90 is not None else p50
    )
    hi = max(float(hi), 1e-9)
    strip_y, strip_h = 34.0, 16.0

    def sx(v: float) -> float:
        return max(min(v / hi, 1.0), 0.0) * width

    parts = [
        _text(0, 20, esc(_val(p50, unit)), "data-xl", fill=T.INK),
        _text(width, 20, esc(pop_text), "data", fill=T.INK_2, anchor="end"),
        f'<line x1="0" y1="{_n(strip_y + strip_h / 2)}" x2="{_n(width)}" '
        f'y2="{_n(strip_y + strip_h / 2)}" stroke="{_fill("hairline")}" '
        'stroke-width="1"/>',
    ]

    if p90 is not None:
        a, b = sorted((sx(p50), sx(p90)))
        parts.append(
            f'<rect x="{_n(a)}" y="{_n(strip_y)}" width="{_n(max(b - a, 1))}" '
            f'height="{_n(strip_h)}" fill="{_fill("seq-3")}" '
            f'stroke="{_fill("hairline")}" stroke-width="1"/>'
        )
    parts.append(
        f'<line x1="{_n(sx(p50))}" y1="{_n(strip_y - 4)}" '
        f'x2="{_n(sx(p50))}" y2="{_n(strip_y + strip_h + 4)}" '
        f'stroke="{_fill("ink")}" stroke-width="2"/>'
    )
    parts.append(
        _text(sx(p50), strip_y + strip_h + 18, esc(f"p50 {_val(p50, unit)}"),
              "meta", fill=T.INK, anchor="middle")
    )
    if p90 is not None:
        parts.append(
            _text(width, strip_y + strip_h + 18,
                  esc(f"p90 {_val(p90, unit)}"), "meta", fill=T.INK_3,
                  anchor="end")
        )
    parts.append(_text(0, strip_y - 6, esc(_val(0, unit)), "meta", fill=T.INK_3))
    parts.append(
        _text(width, strip_y - 6, esc(_val(hi, unit)), "meta", fill=T.INK_3,
              anchor="end")
    )
    if p90 is None:
        parts.append(
            _text(0, height - 2, esc(SUMMARY_ONLY), "meta", fill=T.INK_2)
        )

    if p90 is None:
        aria = (
            f"Distribution strip: median {_val(p50, unit)} across "
            f"{_val(n)} {unit or 'records'}. Only the median is known, so no "
            f"band is drawn: {SUMMARY_ONLY}. Horizontal axis "
            f"{_val(0, unit)} to {_val(hi, unit)}."
        )
    else:
        aria = (
            f"Distribution strip: median {_val(p50, unit)}, band to p90 "
            f"{_val(p90, unit)}, across {_val(n)} {unit or 'records'}. "
            f"Horizontal axis {_val(0, unit)} to {_val(hi, unit)}. "
            "Position encodes the value; no percentile below p50 is shown."
        )
    return _open(width, height, aria) + "".join(parts) + "</svg>"


# ── F7 completeness meter ───────────────────────────────────────────────────

def completeness_meter(*, n: int, population: int,
                       caption: str = "target: none",
                       width: int = 420) -> str:
    """F7 completeness meter (spec 4.8).

    The value never rounds up to complete: if ``n < population`` the printed
    percentage is truncated below 100 and the fill stops visibly short of the
    end of the track. Uncovered is absence, not danger, so there is no warning
    colour anywhere in this mark.
    """
    height = 76
    if population <= 0:
        aria = (
            f"Completeness meter: {UNAVAILABLE_NO_RECORDS}. "
            f"{_val(n)} read of an unknown population."
        )
        return _unavailable_svg(
            width, height,
            reason=f"population is not known, {_val(n)} read",
            aria=aria,
        )

    pct = _pct(n, population)
    complete = n >= population
    if not complete:
        # Truncate, never round: 99.96% prints 99.9%, not 100.0%.
        shown = min(int(pct * 10) / 10, 99.9)
    else:
        shown = 100.0
    pct_text = f"{shown:.1f}%"
    nd_text = f"{_val(n)} of {_val(population)} read"

    track_y, track_h = 38.0, 12.0
    track_w = float(width)
    fill_w = track_w * pct / 100.0
    if not complete:
        # Visibly short: a hairline gap the eye can resolve at 100% zoom.
        fill_w = min(fill_w, track_w - 3)
    fill_w = max(fill_w, 0.0)

    parts = [
        _text(0, 20, esc(pct_text), "data-xl", fill=T.INK),
        _text(width, 20, esc(nd_text), "data", fill=T.INK_2, anchor="end"),
        f'<rect x="0" y="{_n(track_y)}" width="{_n(track_w)}" '
        f'height="{_n(track_h)}" fill="{_fill("surface")}" '
        f'stroke="{_fill("hairline")}" stroke-width="1"/>',
    ]
    if fill_w > 0:
        parts.append(
            f'<rect x="0" y="{_n(track_y)}" width="{_n(fill_w)}" '
            f'height="{_n(track_h)}" fill="{_fill("seq-5")}"/>'
        )
    parts += [
        _text(0, height - 4, esc(f"covered · uncovered · {caption}"), "meta",
              fill=T.INK_3),
    ]

    aria = (
        f"Completeness meter: {pct_text}, {nd_text}. Length encodes the share "
        f"read; the remaining track is unread population, not a target and "
        f"not a failure. {caption}."
    )
    return _open(width, height, aria) + "".join(parts) + "</svg>"


# ── F6 composition bar ──────────────────────────────────────────────────────

def composition_bar(*, segments: list[tuple[str, float, str]],
                    total_label: str, width: int = 560,
                    caption: str = "estimated equivalent, not billed "
                                   "expenditure") -> str:
    """F6 cost composition (spec 4.7).

    Every residual segment stays in the bar and keeps its label even at zero
    width, because a composition that hides unpriced or unallocated amounts is
    forbidden. Billed and equivalent figures never share a bar: call this twice
    with two captions and do not sum the results.
    """
    height = 104
    bar_y, bar_h = 40.0, 24.0
    total = sum(max(float(v), 0.0) for _lbl, v, _tok in segments)

    if not segments or total <= 0:
        aria = (
            f"Composition bar for {total_label}: {UNAVAILABLE_NO_RECORDS}. "
            f"{len(segments)} segments declared, none with an observed amount."
        )
        return _unavailable_svg(
            width, height,
            reason=f"{total_label} has no priced amount to compose",
            aria=aria,
        )

    parts = [
        _text(0, 20, esc(total_label), "data-xl", fill=T.INK),
        _text(width, 20, esc(caption), "meta", fill=T.INK_2, anchor="end"),
    ]

    x = 0.0
    described: list[str] = []
    zero_width: list[str] = []
    label_y = bar_y + bar_h + 16
    row = 0
    for label, value, token in segments:
        v = max(float(value), 0.0)
        w = width * v / total
        share = v / total * 100.0
        if w > 0:
            fill = _fill(token)
            rect = (
                f'<rect x="{_n(x)}" y="{_n(bar_y)}" width="{_n(w)}" '
                f'height="{_n(bar_h)}" fill="{fill}"'
            )
            if fill == "none":
                rect += (
                    f' stroke="{_fill("rule")}" stroke-width="1" '
                    'stroke-dasharray="2 2"'
                )
            parts.append(rect + "/>")
            # 1px surface gap between segments.
            parts.append(
                f'<line x1="{_n(x + w)}" y1="{_n(bar_y)}" '
                f'x2="{_n(x + w)}" y2="{_n(bar_y + bar_h)}" '
                f'stroke="{_fill("surface")}" stroke-width="1"/>'
            )
        else:
            _fill(token)  # validate the token even when nothing is drawn
            zero_width.append(label)
        # Every segment is labelled, zero-width included.
        parts.append(
            _text(0 if row % 2 == 0 else width / 2,
                  label_y + 16 * (row // 2),
                  esc(f"{label} {_val(v)} ({share:.1f}%)"), "meta",
                  fill=T.INK_2)
        )
        described.append(f"{label} {_val(v)} at {share:.1f} percent")
        row += 1
        x += w

    aria = (
        f"Composition bar for {total_label}. Segment length encodes share of "
        f"the stated total: {'; '.join(described)}. {caption}."
    )
    if zero_width:
        aria += (
            f" Present with no observed amount and therefore zero width: "
            f"{', '.join(zero_width)}."
        )
    return _open(width, height, aria) + "".join(parts) + "</svg>"


# ── Absence and labelling (HTML) ────────────────────────────────────────────

def unavailable_block(*, reason: str, needs: str = "") -> str:
    """The absence treatment as HTML (spec 3.3): a reason and what it needs.

    Never a zero, never a skeleton, never a retry spinner. The reader learns
    why the value is missing and which capability would produce it.
    """
    pad = T.SPACE[3]
    css = (
        f"border:1px solid {T.HAIRLINE};border-radius:{T.RADIUS[1]}px;"
        f"background:{T.RECESSED};padding:{pad}px;color:{T.INK};"
        f"{_ty('body')}"
    )
    out = [
        f"<div class=\"sx-unavailable\" style='{css}'>",
        f"<span style='{_ty('label')};color:{T.INK_2}'>"
        f"{esc(_label_text('unavailable'))}</span>",
        f"<p style='{_ty('body')};color:{T.INK};margin:{T.SPACE[0]}px 0 0'>"
        f"{esc(reason)}</p>",
    ]
    if needs:
        out.append(
            f"<p style='{_ty('meta')};color:{T.INK_3};"
            f"margin:{T.SPACE[0]}px 0 0'>{esc('Requires: ' + needs)}</p>"
        )
    out.append("</div>")
    return "".join(out)


_CONFIDENCE_WORD = {"medium": "MED", "low": "LOW"}


def evidence_chip(*, tier: str, confidence: str) -> str:
    """One composite chip carrying tier and confidence (spec 3.1, 3.5).

    Tier is the left rule's line *style*, never its colour, so the chip is
    ink-on-surface and survives grayscale. ``high`` confidence is the unmarked
    default and prints the tier alone; medium and low print as one composite
    label. Tier and confidence MUST NOT be split into two chips, which is why
    this function takes both and returns one element.
    """
    rule_style = T.KIND_GRAMMAR.get(
        tier, T.KIND_GRAMMAR[T.Kind.MEASURED]
    )[2]
    text = _label_text(tier)
    conf = str(confidence).lower()
    if conf != T.UNMARKED_CONFIDENCE:
        text = f"{text} · {_CONFIDENCE_WORD.get(conf, _label_text(conf))}"

    chip_css = (
        f"display:inline-flex;align-items:center;gap:{T.SPACE[1]}px;"
        f"border:1px solid {T.HAIRLINE};border-radius:{T.RADIUS[1]}px;"
        f"background:{T.SURFACE};padding:{T.SPACE[0]}px {T.SPACE[1]}px;"
        f"color:{T.INK};{_ty('label')}"
    )
    rule_css = (
        f"display:inline-block;width:0;height:12px;"
        f"border-left:3px {rule_style} {T.INK};"
    )
    return (
        f"<span class=\"sx-chip\" style='{chip_css}'>"
        f"<span aria-hidden=\"true\" style='{rule_css}'></span>"
        f"{esc(text)}</span>"
    )
