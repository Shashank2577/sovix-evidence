"""Tests for the F-catalog SVG generators.

The assertions here are the enforceable half of spec 003 sections 3 and 4:
determinism, absence never rendered as zero, no line across a gap, mandated
adjacent labels, token-only colour, and escaping of untrusted report text.
"""

from __future__ import annotations

import re
import sys

import pytest

from sovix_render import charts, tokens as T
from sovix_render.model import Series, SeriesPoint


# ── Fixtures ────────────────────────────────────────────────────────────────

def _series(values, *, label="Commits", unit="count", ident="git.commits"):
    months = [f"2026-{i + 1:02d}" for i in range(len(values))]
    return Series(
        id=ident,
        label=label,
        unit=unit,
        points=tuple(
            SeriesPoint(month=m, value=v) for m, v in zip(months, values)
        ),
    )


FULL = _series([12.0, 18.0, 9.0, 24.0, 20.0, 31.0])
LEADING_GAP = _series([None, None, 9.0, 24.0, 20.0, 31.0])
MIDDLE_GAP = _series([12.0, 18.0, None, None, 20.0, 31.0])
ALL_GAP = _series([None, None, None])
RATE = _series([41.2, 38.0, None, 52.5], label="Failure share", unit="percent")


def _cases():
    """Every generator, in every state a page assembler can reach."""
    return {
        "sparkline-full": lambda: charts.sparkline(FULL),
        "sparkline-gap": lambda: charts.sparkline(LEADING_GAP),
        "sparkline-empty": lambda: charts.sparkline(ALL_GAP),
        "sparkline-proxy": lambda: charts.sparkline(FULL, tier=T.Kind.PROXY),
        "series-column": lambda: charts.interval_series(
            LEADING_GAP, form="column"
        ),
        "series-line": lambda: charts.interval_series(RATE, form="line"),
        "series-empty": lambda: charts.interval_series(ALL_GAP, form="column"),
        "series-inferred": lambda: charts.interval_series(
            MIDDLE_GAP, form="line", tier=T.Kind.INFERRED
        ),
        "proportion": lambda: charts.proportion_bar(
            numerator=1214, denominator=1473,
            numerator_label="Recorded review coverage",
            remainder_label="merged PRs",
        ),
        "proportion-zero-den": lambda: charts.proportion_bar(
            numerator=0, denominator=0,
            numerator_label="Recorded review coverage",
            remainder_label="merged PRs",
        ),
        "proportion-floor": lambda: charts.proportion_bar(
            numerator=88, denominator=1204, numerator_label="Signature floor",
            remainder_label="commits", tier=T.Kind.INFERRED, is_floor=True,
        ),
        "distribution": lambda: charts.distribution_strip(
            p50=41.3, p90=190.0, n=214, unit="hours"
        ),
        "distribution-p50-only": lambda: charts.distribution_strip(
            p50=41.3, p90=None, n=214, unit="hours"
        ),
        "distribution-absent": lambda: charts.distribution_strip(
            p50=None, p90=None, n=0, unit="hours"
        ),
        "meter-partial": lambda: charts.completeness_meter(
            n=227, population=359
        ),
        "meter-complete": lambda: charts.completeness_meter(
            n=359, population=359
        ),
        "meter-no-population": lambda: charts.completeness_meter(
            n=0, population=0
        ),
        "composition": lambda: charts.composition_bar(
            segments=[
                ("attributed", 1022.402113, "data-1"),
                ("unallocated", 262.20987, T.PARTIAL_PATTERN),
                ("unpriced", 0.0, "outline"),
            ],
            total_label="$1,284.61",
        ),
        "composition-empty": lambda: charts.composition_bar(
            segments=[], total_label="$0.00"
        ),
        "defs": charts.svg_defs,
    }


SVG_CASES = _cases()


# ── Determinism ─────────────────────────────────────────────────────────────

@pytest.mark.parametrize("name", sorted(SVG_CASES))
def test_output_is_deterministic(name):
    make = SVG_CASES[name]
    assert make() == make()


def _digest_script() -> str:
    return (
        "import hashlib, sys; sys.path.insert(0, 'src');\n"
        "sys.argv = []\n"
        "import test_charts as t\n"
        "h = hashlib.sha256()\n"
        "for k in sorted(t.SVG_CASES):\n"
        "    h.update(k.encode()); h.update(t.SVG_CASES[k]().encode())\n"
        "print(h.hexdigest())\n"
    )


def test_output_is_identical_across_processes_and_hash_seeds():
    """Determinism has to survive a fresh interpreter, not just a second call.

    A different PYTHONHASHSEED reorders set and dict iteration, which is the
    usual way a "deterministic" generator turns out not to be.
    """
    import subprocess
    from pathlib import Path

    root = Path(__file__).resolve().parents[1]
    env_base = {"PATH": "/usr/bin:/bin", "PYTHONPATH": f"{root / 'src'}:{root / 'tests'}"}
    digests = set()
    for seed in ("0", "1", "12345"):
        out = subprocess.run(
            [sys.executable, "-c", _digest_script()],
            cwd=root, env={**env_base, "PYTHONHASHSEED": seed},
            capture_output=True, text=True, check=True,
        )
        digests.add(out.stdout.strip())
    assert len(digests) == 1, f"output varied across hash seeds: {digests}"
    assert len(next(iter(digests))) == 64


def test_coordinate_formatting_is_stable_and_has_no_negative_zero():
    assert charts._n(0.1 + 0.2) == "0.3"
    assert charts._n(-0.001) == "0"
    assert charts._n(12.0) == "12"
    assert charts._n(12.5) == "12.5"          # trailing zero stripped
    assert charts._n(12.50001) == "12.5"      # rounded to 2dp, then stripped
    assert charts._n(1 / 3) == "0.33"
    assert charts._n(2 / 3) == "0.67"


# ── Accessibility contract ──────────────────────────────────────────────────

@pytest.mark.parametrize("name", sorted(n for n in SVG_CASES if n != "defs"))
def test_every_chart_is_a_labelled_img(name):
    svg = SVG_CASES[name]()
    assert 'role="img"' in svg
    label = re.search(r'aria-label="([^"]*)"', svg)
    assert label is not None, "chart has no aria-label"
    assert len(label.group(1).strip()) > 20, "aria-label is not a description"


@pytest.mark.parametrize("name", sorted(SVG_CASES))
def test_every_chart_is_well_formed_xml(name):
    """A published artifact must render offline and print; malformed SVG will not.

    This is also the guard on attribute quoting: the token font stacks contain
    double quotes, so every style attribute has to be single-quoted.
    """
    import xml.etree.ElementTree as ET

    ET.fromstring(SVG_CASES[name]())


@pytest.mark.parametrize("frag", [
    charts.unavailable_block(reason="no deployment source connected",
                             needs="a deployment source"),
    charts.evidence_chip(tier=T.Kind.PROXY, confidence="low"),
    charts.evidence_chip(tier=T.Kind.MEASURED, confidence="high"),
])
def test_html_fragments_are_well_formed(frag):
    import xml.etree.ElementTree as ET

    ET.fromstring(frag)


def test_aria_label_states_dimensions_and_names_the_gap():
    svg = charts.interval_series(LEADING_GAP, form="column")
    aria = re.search(r'aria-label="([^"]*)"', svg).group(1)
    assert "Vertical axis" in aria and "horizontal axis" in aria
    assert "4 of 6 intervals observed" in aria
    assert "No eligible records for 2026-01 to 2026-02" in aria


def test_defs_block_carries_the_three_patterns_at_fixed_pitch():
    defs = charts.svg_defs()
    for pattern_id in ("p-proxy", "p-inferred", T.PARTIAL_PATTERN):
        assert f'id="{pattern_id}"' in defs
    assert defs.count('patternUnits="userSpaceOnUse"') == 3
    assert "rotate(45)" in defs and "rotate(135)" in defs
    assert 'aria-hidden="true"' in defs
    assert 'width="0"' in defs and 'height="0"' in defs


# ── Absence is never zero ───────────────────────────────────────────────────

def test_leading_gap_hatches_the_region_and_plots_only_observed_points():
    svg = charts.interval_series(LEADING_GAP, form="line")
    assert f"url(#{T.PARTIAL_PATTERN})" in svg, "gap run is not marked"
    assert charts.NO_ELIGIBLE_RECORDS in svg

    polylines = re.findall(r'<polyline points="([^"]+)"', svg)
    assert len(polylines) == 1, "observed points form one unbroken run"
    plotted = len(polylines[0].split(" "))
    assert plotted == LEADING_GAP.observed_count == 4


def test_a_gap_is_never_bridged_by_a_line():
    svg = charts.interval_series(MIDDLE_GAP, form="line")
    polylines = re.findall(r'<polyline points="([^"]+)"', svg)
    assert len(polylines) == 2, "the line must break and resume at the gap"
    total_points = sum(len(p.split(" ")) for p in polylines)
    assert total_points == MIDDLE_GAP.observed_count == 4

    # The gap band lies strictly between the two runs, so no segment crosses it.
    left_end = float(polylines[0].split(" ")[-1].split(",")[0])
    right_start = float(polylines[1].split(" ")[0].split(",")[0])
    gap = re.search(
        rf'<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"[^/]*'
        rf'url\(#{T.PARTIAL_PATTERN}\)', svg
    )
    gap_x, gap_w = float(gap.group(1)), float(gap.group(2))
    assert left_end < gap_x < gap_x + gap_w < right_start


def test_columns_are_drawn_only_for_observed_intervals():
    svg = charts.interval_series(LEADING_GAP, form="column")
    bars = re.findall(r'<rect [^>]*stroke-width="1"/>', svg)
    # One rect per observed interval, plus the single hatched gap band.
    assert len(bars) == LEADING_GAP.observed_count
    assert svg.count(f'fill="url(#{T.PARTIAL_PATTERN})"') == 1


def test_series_with_no_observations_renders_absence_not_an_axis():
    svg = charts.interval_series(ALL_GAP, form="column")
    assert "Unavailable" in svg
    assert "<polyline" not in svg and "<rect" not in svg
    assert "0 of 3 intervals observed" in svg


def test_proportion_bar_with_zero_denominator_is_unavailable_not_zero_percent():
    svg = SVG_CASES["proportion-zero-den"]()
    assert "Unavailable" in svg
    assert "0%" not in svg
    assert "%" not in svg, "a 0/0 population has no percentage at all"
    assert "no eligible records" in svg


@pytest.mark.parametrize(
    "n,population", [(999, 1000), (9999, 10000), (999999, 1000000)]
)
def test_completeness_meter_never_rounds_up_to_complete(n, population):
    """99.99% is not complete. Naive rounding prints "100.0%" here."""
    svg = charts.completeness_meter(n=n, population=population)
    assert "100%" not in svg
    assert "100.0%" not in svg
    assert "99.9%" in svg


def test_completeness_meter_prints_its_counts_and_stops_short():
    svg = charts.completeness_meter(n=999, population=1000)
    assert "999 of 1,000 read" in svg

    fills = re.findall(
        rf'<rect x="0" y="[\d.]+" width="([\d.]+)" height="[\d.]+" '
        rf'fill="{T.SEQ_RAMP[4]}"', svg
    )
    assert len(fills) == 1
    assert float(fills[0]) <= 420 - 3, "the fill must stop visibly short"


def test_completeness_meter_prints_exact_completeness_when_earned():
    svg = charts.completeness_meter(n=359, population=359)
    assert "100.0%" in svg
    assert "359 of 359 read" in svg


def test_distribution_strip_without_p90_draws_no_invented_band():
    svg = SVG_CASES["distribution-p50-only"]()
    assert T.SEQ_RAMP[2] not in svg, "a band was invented from one percentile"
    assert charts.SUMMARY_ONLY in svg
    assert "n = 214 hours" in svg


def test_distribution_strip_always_prints_its_population():
    svg = SVG_CASES["distribution"]()
    assert "n = 214 hours" in svg
    assert T.SEQ_RAMP[2] in svg
    assert "p50" in svg and "p90" in svg


def test_numerator_and_denominator_print_beside_the_percentage():
    svg = SVG_CASES["proportion"]()
    assert "82.4%" in svg
    assert "1,214 / 1,473 merged PRs" in svg


def test_floor_metrics_render_as_open_values():
    svg = SVG_CASES["proportion-floor"]()
    assert "≥ 7.3%" in svg
    assert "detectable floor" in svg


def test_sparkline_prints_its_scale():
    svg = charts.sparkline(FULL)
    assert ">9<" in svg and ">31<" in svg, "min and max must be printed"
    assert "<polyline" in svg


def test_sparkline_breaks_at_gaps():
    svg = charts.sparkline(MIDDLE_GAP)
    polylines = re.findall(r'<polyline points="([^"]+)"', svg)
    assert sum(len(p.split(" ")) for p in polylines) == MIDDLE_GAP.observed_count


def test_composition_keeps_zero_width_residual_segments_labelled():
    svg = SVG_CASES["composition"]()
    assert "unpriced" in svg
    assert "unallocated" in svg
    aria = re.search(r'aria-label="([^"]*)"', svg).group(1)
    assert "zero width: unpriced" in aria
    assert "not billed expenditure" in svg


# ── Colour discipline ───────────────────────────────────────────────────────

ALLOWED_HEX = {
    h.lower() for h in (
        T.CANVAS, T.SURFACE, T.RECESSED, T.INK, T.INK_2, T.INK_3,
        T.ACCENT, T.ACCENT_ACTIVE, T.RULE, T.HAIRLINE,
        *T.DATA_RAMP, *T.SEQ_RAMP,
    )
}

FORBIDDEN_HEX = (
    # Traffic-light greens
    "#22c55e", "#16a34a", "#15803d", "#4caf50", "#2ecc71", "#0f9d58",
    # Warning ambers and yellows
    "#f59e0b", "#fbbf24", "#ffbf00", "#ffc107", "#ff9800", "#eab308",
    # Alarm reds
    "#ef4444", "#dc2626", "#d32f2f", "#ff0000", "#e53935",
    # The system error token, which no metric mark may ever use
    T.ERROR,
)


@pytest.mark.parametrize("name", sorted(SVG_CASES))
def test_no_forbidden_colour_appears(name):
    out = SVG_CASES[name]().lower()
    for bad in FORBIDDEN_HEX:
        assert bad.lower() not in out, f"{name} uses forbidden colour {bad}"


@pytest.mark.parametrize("name", sorted(SVG_CASES))
def test_only_design_tokens_reach_the_markup(name):
    found = re.findall(r"#[0-9a-fA-F]{3,8}\b", SVG_CASES[name]())
    assert found, f"{name} emitted no colour at all; the regex is not working"
    for colour in found:
        assert colour.lower() in ALLOWED_HEX, (
            f"{name} emitted non-token colour {colour}"
        )


def test_a_non_token_fill_is_rejected_rather_than_rendered():
    with pytest.raises(ValueError, match="not a design token"):
        charts._fill("#22c55e")
    with pytest.raises(ValueError, match="not a design token"):
        charts.composition_bar(
            segments=[("attributed", 1.0, "#22c55e")], total_label="$1.00"
        )


def test_chart_output_carries_no_banned_character():
    for name, make in SVG_CASES.items():
        out = make()
        for char in T.BANNED_CHARS:
            assert char not in out, f"{name} contains banned character {char!r}"


def test_chart_copy_uses_no_banned_phrase():
    banned = tuple(p.strip().lower() for p in T.BANNED_PHRASES)
    for name, make in SVG_CASES.items():
        out = make().lower()
        # Strip token font stacks so a family name cannot trip the lint.
        out = re.sub(r"font-family:[^;\"']*", "", out)
        for phrase in banned:
            if phrase == "better":
                assert "generally preferred" in out or "better" not in out
                continue
            assert phrase not in out, f"{name} contains banned phrase {phrase!r}"


def test_interval_series_rejects_a_mixed_form():
    with pytest.raises(ValueError, match="forbidden"):
        charts.interval_series(FULL, form="area")


# ── Escaping ────────────────────────────────────────────────────────────────

HOSTILE = '<script>alert("x")</script>'


def test_series_label_is_escaped_in_the_aria_label():
    svg = charts.sparkline(_series([1.0, 2.0], label=HOSTILE))
    assert "<script>" not in svg
    assert "&lt;script&gt;" in svg


def test_month_labels_are_escaped():
    hostile = Series(
        id="s", label="Commits", unit="count",
        points=(SeriesPoint(month='"><script>', value=1.0),
                SeriesPoint(month="2026-02", value=2.0)),
    )
    svg = charts.interval_series(hostile, form="column")
    assert "<script>" not in svg
    assert "&quot;&gt;&lt;script&gt;" in svg


def test_proportion_labels_are_escaped():
    svg = charts.proportion_bar(
        numerator=1, denominator=2, numerator_label=HOSTILE,
        remainder_label=HOSTILE,
    )
    assert "<script>" not in svg
    assert svg.count("&lt;script&gt;") >= 2


def test_unavailable_block_escapes_reason_and_needs():
    html_out = charts.unavailable_block(reason=HOSTILE, needs=HOSTILE)
    assert html_out.startswith("<div")
    assert "<script>" not in html_out
    assert "Requires:" in html_out
    assert "UNAVAILABLE" in html_out


def test_unavailable_block_omits_the_requirement_line_when_unknown():
    html_out = charts.unavailable_block(reason="no deployment source connected")
    assert "Requires:" not in html_out
    assert "no deployment source connected" in html_out


# ── Evidence chip ───────────────────────────────────────────────────────────

def test_high_confidence_chip_prints_the_tier_alone():
    chip = charts.evidence_chip(tier=T.Kind.MEASURED, confidence="high")
    assert chip.startswith("<span")
    assert "MEASURED" in chip
    assert "·" not in chip
    assert "HIGH" not in chip
    assert "border-left:3px solid" in chip


def test_low_confidence_chip_is_one_composite_label():
    chip = charts.evidence_chip(tier=T.Kind.PROXY, confidence="low")
    assert "PROXY · LOW" in chip
    assert chip.count("<span") == 2, "tier and confidence must be one chip"
    assert "border-left:3px dashed" in chip


def test_inferred_chip_uses_the_dotted_rule_from_tokens():
    chip = charts.evidence_chip(tier=T.Kind.INFERRED, confidence="medium")
    assert "INFERRED · MED" in chip
    expected = T.KIND_GRAMMAR[T.Kind.INFERRED][2]
    assert f"border-left:3px {expected}" in chip


def test_chip_carries_no_colour_beyond_ink_on_surface():
    for tier in (T.Kind.MEASURED, T.Kind.PROXY, T.Kind.INFERRED):
        chip = charts.evidence_chip(tier=tier, confidence="low")
        for found in re.findall(r"#[0-9a-fA-F]{3,8}\b", chip):
            assert found.lower() in ALLOWED_HEX


def test_unknown_tier_is_printed_verbatim_rather_than_relabelled():
    chip = charts.evidence_chip(tier="legacy", confidence="high")
    assert "LEGACY" in chip
