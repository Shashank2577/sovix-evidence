"""Design tokens for the evidence dashboard.

Single source of truth for specs/003-evidence-dashboard/spec.md section 2.
Every value here is normative. Contrast ratios in comments are computed
against CANVAS and are asserted by tests/test_tokens.py, so a token cannot
be changed to something inaccessible without failing the suite.

Nothing in this module may import anything from the rest of the package.
The dependency arrow points only outward.
"""

from __future__ import annotations

# ── Surfaces ────────────────────────────────────────────────────────────────
CANVAS = "#fbfbfc"
SURFACE = "#ffffff"
RECESSED = "#f4f5f7"

# ── Ink hierarchy ───────────────────────────────────────────────────────────
INK = "#16181d"          # 15.9:1  primary text
INK_2 = "#4a4f58"        #  8.0:1  secondary: definitions, denominators
INK_3 = "#5f6570"        #  5.7:1  metadata, axis labels. Floor for words.

# ── Accent: the instrument has exactly one ──────────────────────────────────
ACCENT = "#3d4fd7"       #  6.2:1
ACCENT_ACTIVE = "#2a379b"  # 10.2:1

# ── Structure ───────────────────────────────────────────────────────────────
RULE = "#6f7580"         #  4.5:1  functional borders, chart axes
HAIRLINE = "#dcdee3"     #  1.4:1  decorative only, never load-bearing

# ── System error. Forbidden on any metric value or direction. ───────────────
ERROR = "#a5231d"        #  7.1:1

# ── Categorical data ramp. Okabe-Ito derived, darkened for a light canvas.
# Assign in order, never skip. Six is the hard maximum; beyond that the
# chart becomes small multiples (form F8) instead.
# Luminance is deliberately spread: every adjacent pair differs by more than
# 0.008 relative luminance, so the ramp survives grayscale and monochrome
# print, not only colour-vision deficiency. The spec's first draft put blue,
# vermilion and slate within 0.001 of each other, which would have been three
# identical greys on the 600dpi print acceptance test. tokens tests assert the
# separation so it cannot silently regress.
DATA_RAMP = (
    "#3d4fd7",  # 1 blue      6.16:1  L=0.1149  (same as accent: one blue)
    "#0a544d",  # 2 teal      8.50:1  L=0.0694
    "#b8411d",  # 3 vermilion 5.33:1  L=0.1406
    "#58285c",  # 4 plum     10.84:1  L=0.0437
    "#8c7000",  # 5 olive     4.58:1  L=0.1716
    "#637182",  # 6 slate     4.82:1  L=0.1608
)

# ── Sequential ramp. Monotone lightness so order survives grayscale.
# Steps 1-3 fail 3:1 against canvas and MUST therefore be enclosed by a
# HAIRLINE cell boundary and accompanied by a printed value.
SEQ_RAMP = (
    "#eef0fb", "#d3d8f4", "#b0b9ec", "#8a96e1", "#6274d9", "#3d4fd7", "#1e2a68",
)
# Steps 1..4 fail 3:1 against the canvas (seq-4 is 2.70:1, not the 3.0:1 the
# spec's first draft assumed). Each of these MUST be enclosed by a HAIRLINE
# cell boundary and accompanied by a printed value.
SEQ_NEEDS_BOUNDARY = 4  # steps 1..4 (1-indexed)

# No diverging ramp exists in this product. A diverging ramp encodes a
# midpoint judgment ("good or bad relative to a target"), which the
# judgment-free rendering principle forbids.
DIVERGING_RAMP = None

# ── Typography ──────────────────────────────────────────────────────────────
# All three faces are SIL OFL 1.1. Published artifacts embed renamed,
# subsetted WOFF2 under a 220KB total budget and make zero remote requests.
SERIF = '"Source Serif 4", Georgia, "Times New Roman", serif'
SANS = '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
MONO = '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace'

FONT_BUDGET_BYTES = 220 * 1024

# name -> (family, weight, size_px, line_px, extra_css)
TYPE_SCALE: dict[str, tuple[str, int, int, int, str]] = {
    "display-1": (SERIF, 600, 40, 48, "letter-spacing:-.01em"),
    "display-2": (SERIF, 600, 28, 36, ""),
    "heading":   (SERIF, 600, 21, 28, ""),
    "title":     (SANS, 600, 16, 24, ""),
    "body":      (SANS, 400, 16, 24, ""),
    "meta":      (SANS, 400, 14, 20, ""),
    "label":     (SANS, 500, 12, 16, "letter-spacing:.04em;text-transform:uppercase"),
    "data-xl":   (SANS, 500, 32, 36, "font-variant-numeric:tabular-nums"),
    "data":      (SANS, 500, 16, 24, "font-variant-numeric:tabular-nums"),
    "mono":      (MONO, 400, 13, 20, ""),
}

MAX_MEASURE_CH = 72        # body text never wider
MAX_FONT_WEIGHT = 600      # emphasis comes from size, face and rules
MINUS = "−"           # U+2212, never a hyphen
EN_DASH = "–"

# ── Spacing. Base 4px. No value outside this set is permitted. ─────────────
SPACE = (4, 8, 12, 16, 24, 32, 48, 64)
SECTION_RHYTHM = 48
CARD_PADDING = 24
CARD_PADDING_NARROW = 16

# breakpoint_px -> page gutter
GUTTERS = {1200: 48, 768: 32, 0: 16}
MAX_CONTENT_WIDTH = 1440
BREAKPOINTS = (1440, 1200, 768, 360)

# ── Motion: one token, removed entirely under prefers-reduced-motion. ──────
MOTION_MS = 120
CHART_ENTRANCE_ANIMATION = False  # a chart never animates in

# ── Radius and elevation ───────────────────────────────────────────────────
RADIUS = (0, 2, 4)
# Level 0 (flat, hairline-bounded) for everything static.
# Level 1 exists only for popovers and drawers.


# ── Evidence grammar ───────────────────────────────────────────────────────
# Evidence kind is a property of the mark, carried by pattern and stroke.
# Confidence is text in one composite chip. Availability is a state
# treatment. Three dimensions, three channels, so no badge matrix forms.

class Kind:
    MEASURED = "measured"
    PROXY = "proxy"
    INFERRED = "inferred"


class Availability:
    AVAILABLE = "available"
    PARTIAL = "partial"
    UNAVAILABLE = "unavailable"
    SUPPRESSED = "suppressed"


# kind -> (svg pattern id or None, stroke-dasharray, chip left-rule style)
KIND_GRAMMAR = {
    Kind.MEASURED: (None, None, "solid"),
    Kind.PROXY: ("p-proxy", "4 3", "dashed"),
    Kind.INFERRED: ("p-inferred", "1 3", "dotted"),
}

# Partial uses 135deg — deliberately the opposite orientation to proxy's
# 45deg, so a partial interval and a proxy metric can never read as the
# same thing on one chart.
PARTIAL_PATTERN = "p-partial"
PATTERN_ALPHA = 0.55  # quietness lives in alpha, never in a changed grammar

MAX_CHIPS_PER_CARD = 2
UNMARKED_CONFIDENCE = "high"  # high is the default and prints no qualifier

# Direction is never encoded visually: no colour, arrow styling, glyph or
# sort may derive from it. Non-neutral metrics append this parenthetical.
DIRECTION_TEXT = {
    "higher_is_better": "(higher is generally preferred)",
    "lower_is_better": "(lower is generally preferred)",
    "neutral": "",  # naming something neutral is itself a valence claim
}
BANNED_DIRECTION_WORD = "better"  # never appears in rendered copy


# ── Copy lint. Applied to hand-written and generated text alike. ───────────
BANNED_PHRASES = (
    "insights", "actionable", "AI-powered", "seamless", "robust",
    "leverage", "unlock", "supercharge", "game-changing", "best-in-class",
    "productivity score", "ROI", "10x", "velocity" ,  # as a metric name
    "better", "worse", "good", "bad", "improve",       # valence on a value
)
BANNED_CHARS = ("!", "—")  # no exclamation marks; no em-dash as connector

# Chart forms whose use is forbidden, with the reason each is refused.
FORBIDDEN_FORMS = {
    "pie": "cannot represent missing or suppressed slices honestly",
    "donut": "same as pie; the hole adds no information",
    "dual_axis": "invites a correlation the data does not establish",
    "3d": "distorts magnitude by perspective",
    "gauge": "implies a target where none is declared",
    "radar": "area encodes nothing and axis order changes the shape",
    "unscaled_sparkline": "a trend without a scale is not readable",
    "spline": "interpolates values that were never observed",
    "stacked_rate_area": "stacked percentages do not sum to a real quantity",
    "treemap": "area comparison is unreliable and labels are unstable",
    "calendar_heatgrid_people": "renders an individual's working pattern",
    "red_green_direction": "encodes a judgment the evidence cannot support",
    "score": "no score, rank or index exists in this product",
}
