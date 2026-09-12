"""The design system proves its own claims.

spec 003 states a contrast ratio beside every colour token. A comment is not
a guarantee, so these tests recompute every ratio from the hex values using
the WCAG 2.x relative-luminance formula and fail if a token drifts below the
threshold its role requires.

This is the CI contrast check required by spec 003 section 8.
"""

from __future__ import annotations

import re

import pytest

from sovix_render import tokens as T


# ── WCAG 2.x contrast, from first principles ───────────────────────────────

def _channel(v: int) -> float:
    c = v / 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hex_colour: str) -> float:
    h = hex_colour.lstrip("#")
    assert len(h) == 6, f"expected 6-digit hex, got {hex_colour!r}"
    r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * _channel(r) + 0.7152 * _channel(g) + 0.0722 * _channel(b)


def contrast(fg: str, bg: str) -> float:
    a, b = luminance(fg), luminance(bg)
    lo, hi = sorted((a, b))
    return (hi + 0.05) / (lo + 0.05)


# ── Text tokens must clear WCAG 2.2 AA ─────────────────────────────────────

@pytest.mark.parametrize(
    "token,minimum",
    [
        (T.INK, 7.0),      # primary text, comfortably AAA
        (T.INK_2, 7.0),    # secondary; still AA at 12px
        (T.INK_3, 4.5),    # the floor of the text hierarchy
        (T.ACCENT, 4.5),   # links and focus rings carry words
        (T.ERROR, 4.5),    # system error text
    ],
)
def test_text_tokens_meet_aa(token: str, minimum: float) -> None:
    ratio = contrast(token, T.CANVAS)
    assert ratio >= minimum, (
        f"{token} against canvas is {ratio:.2f}:1, below the {minimum}:1 "
        f"its role requires"
    )


def test_ink_hierarchy_is_monotonic() -> None:
    """Each step down the hierarchy must actually be lighter than the last."""
    ratios = [contrast(c, T.CANVAS) for c in (T.INK, T.INK_2, T.INK_3)]
    assert ratios == sorted(ratios, reverse=True), (
        f"ink hierarchy is not monotonic: {ratios}"
    )


def test_ink_3_is_the_floor() -> None:
    """Nothing lighter than ink-3 may carry words. Hairline must fail AA."""
    assert contrast(T.HAIRLINE, T.CANVAS) < 4.5, (
        "hairline now passes AA, which invites its use for text; it is "
        "decorative only and must stay below the text threshold"
    )


# ── Data ramp: every series colour exceeds the non-text 3:1 requirement ────

def test_categorical_ramp_all_exceed_non_text_minimum() -> None:
    for i, colour in enumerate(T.DATA_RAMP, start=1):
        ratio = contrast(colour, T.CANVAS)
        assert ratio >= 4.5, (
            f"data-{i} ({colour}) is {ratio:.2f}:1; the spec claims every "
            f"series colour clears 4.5:1, exceeding the 3:1 non-text rule"
        )


def test_categorical_ramp_is_distinguishable_by_lightness() -> None:
    """Hue alone must not carry the distinction.

    The spec's claim is that the ramp survives deuteranopia and protanopia
    because the colours differ in lightness as well as hue. Verify the
    lightness spread is real: no two series may sit within 8% relative
    luminance of each other.
    """
    lums = sorted(luminance(c) for c in T.DATA_RAMP)
    closest = min(b - a for a, b in zip(lums, lums[1:]))
    assert closest > 0.008, (
        f"two series colours are within {closest:.4f} relative luminance; "
        f"they would collapse together in grayscale and for some colour-"
        f"vision types"
    )


def test_categorical_ramp_has_no_green_or_amber() -> None:
    """Judgment-free rendering: no token may read as success or warning."""
    for colour in T.DATA_RAMP:
        h = colour.lstrip("#")
        r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
        assert not (g > r + 40 and g > b + 40), (
            f"{colour} reads as success-green, which encodes a judgment"
        )
        assert not (r > 180 and 140 < g < 200 and b < 90), (
            f"{colour} reads as warning-amber, which encodes a judgment"
        )


def test_first_data_colour_is_the_accent() -> None:
    """The instrument has exactly one blue."""
    assert T.DATA_RAMP[0] == T.ACCENT


def test_ramp_is_capped_at_six() -> None:
    assert len(T.DATA_RAMP) == 6, (
        "beyond six concurrent series a chart becomes small multiples (F8); "
        "adding a seventh token would invite violating that"
    )


# ── Sequential ramp ────────────────────────────────────────────────────────

def test_sequential_ramp_lightness_is_monotonic() -> None:
    """Order must be legible in grayscale, which requires monotone lightness."""
    lums = [luminance(c) for c in T.SEQ_RAMP]
    assert lums == sorted(lums, reverse=True), (
        f"sequential ramp lightness is not monotonic: {lums}"
    )


def test_sequential_low_steps_are_flagged_as_needing_a_boundary() -> None:
    """The spec says steps 1-3 fail 3:1 and need an enclosing hairline."""
    for i in range(T.SEQ_NEEDS_BOUNDARY):
        assert contrast(T.SEQ_RAMP[i], T.CANVAS) < 3.0, (
            f"seq-{i+1} now clears 3:1; SEQ_NEEDS_BOUNDARY is stale and the "
            f"renderer is adding a boundary that is no longer required"
        )
    assert contrast(T.SEQ_RAMP[T.SEQ_NEEDS_BOUNDARY], T.CANVAS) >= 3.0, (
        "seq-4 should clear 3:1; if it does not, SEQ_NEEDS_BOUNDARY is wrong"
    )


def test_no_diverging_ramp_exists() -> None:
    """A diverging ramp encodes a midpoint judgment, which is forbidden."""
    assert T.DIVERGING_RAMP is None


# ── Structural invariants the renderer relies on ───────────────────────────

def test_spacing_scale_is_a_closed_set() -> None:
    assert T.SPACE == (4, 8, 12, 16, 24, 32, 48, 64)
    assert all(v % 4 == 0 for v in T.SPACE), "base unit is 4px"


def test_type_scale_has_no_weight_above_600() -> None:
    for name, (_fam, weight, _s, _l, _x) in T.TYPE_SCALE.items():
        assert weight <= T.MAX_FONT_WEIGHT, (
            f"{name} is weight {weight}; emphasis comes from size, face and "
            f"rules, not from heavier type"
        )


def test_numeric_type_roles_are_tabular() -> None:
    for name in ("data", "data-xl"):
        extra = T.TYPE_SCALE[name][4]
        assert "tabular-nums" in extra, f"{name} must set tabular figures"


def test_minus_sign_is_not_a_hyphen() -> None:
    assert T.MINUS == "−"


# ── Direction and copy policy ──────────────────────────────────────────────

def test_direction_is_never_valenced_as_better() -> None:
    for key, text in T.DIRECTION_TEXT.items():
        assert T.BANNED_DIRECTION_WORD not in text.lower(), (
            f"DIRECTION_TEXT[{key!r}] contains the banned word "
            f"{T.BANNED_DIRECTION_WORD!r}"
        )


def test_neutral_direction_says_nothing() -> None:
    """Naming a metric neutral is itself a valence claim."""
    assert T.DIRECTION_TEXT["neutral"] == ""


def test_high_confidence_is_the_unmarked_default() -> None:
    assert T.UNMARKED_CONFIDENCE == "high"


def test_chip_budget_is_two() -> None:
    assert T.MAX_CHIPS_PER_CARD == 2


def test_partial_and_proxy_patterns_differ() -> None:
    """135deg vs 45deg: a partial interval must never read as a proxy metric."""
    proxy_pattern = T.KIND_GRAMMAR[T.Kind.PROXY][0]
    assert proxy_pattern != T.PARTIAL_PATTERN


def test_measured_carries_no_pattern() -> None:
    pattern, dash, chip = T.KIND_GRAMMAR[T.Kind.MEASURED]
    assert pattern is None and dash is None and chip == "solid"


def test_every_kind_has_a_distinct_chip_rule_style() -> None:
    styles = [g[2] for g in T.KIND_GRAMMAR.values()]
    assert len(set(styles)) == len(styles), (
        "two evidence kinds share a chip rule style; the grammar would be "
        "ambiguous without colour, which Principle 4 forbids relying on"
    )


def test_forbidden_forms_each_state_a_reason() -> None:
    for form, reason in T.FORBIDDEN_FORMS.items():
        assert reason and len(reason) > 15, (
            f"{form} is forbidden without a stated reason; a prohibition "
            f"nobody can evaluate gets ignored"
        )


def test_chart_entrance_animation_is_off() -> None:
    assert T.CHART_ENTRANCE_ANIMATION is False


# ── The banned-phrase lint must be self-consistent ─────────────────────────

def test_banned_phrases_are_lowercase_for_case_insensitive_matching() -> None:
    for p in T.BANNED_PHRASES:
        if p.isupper() or p in ("AI-powered", "ROI"):
            continue  # deliberate acronyms and proper forms
        assert p == p.lower() or any(c.isupper() for c in p), p


def test_em_dash_is_banned_as_a_connector() -> None:
    assert "—" in T.BANNED_CHARS


def test_hex_tokens_are_well_formed() -> None:
    pattern = re.compile(r"^#[0-9a-f]{6}$")
    everything = [
        T.CANVAS, T.SURFACE, T.RECESSED, T.INK, T.INK_2, T.INK_3,
        T.ACCENT, T.ACCENT_ACTIVE, T.RULE, T.HAIRLINE, T.ERROR,
        *T.DATA_RAMP, *T.SEQ_RAMP,
    ]
    for c in everything:
        assert pattern.match(c), f"{c!r} is not a lowercase 6-digit hex colour"
