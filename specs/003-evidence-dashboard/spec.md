# Design Specification: Evidence Dashboard

**Spec**: 003-evidence-dashboard | **Status**: Draft for review | **Date**: 2026-09-12
**Governed by**: Constitution v1.1.0, `specs/001-sovix-evidence/ux-spec.md`,
`specs/001-sovix-evidence/metrics.md`, ADR-013, ADR-014.

This document defines the visual system of the product: tokens, typography, chart forms,
the evidence visual grammar, screen layouts, editorial voice and the pre-ship checklist.
It extends the UX specification; where both speak, the stricter rule wins. Design direction
is fixed: **editorial instrument** — light, dense, Swiss/financial-press rigor. The surface
must read as a measuring instrument, not a marketing page.

**One deviation from ux-spec.md is adopted here and MUST be back-ported to ux-spec.md:145**:
"Offline exports embed fonts only by using the system stack" is relaxed to "offline and
published artifacts MUST contain no remote asset of any kind"; embedded, subsetted,
open-licensed fonts are permitted (§2.8). ADR-014 rule 6 is unchanged and still satisfied.

**Reconciled incumbents.** This spec supersedes two shipping surfaces and preserves their
proven ideas deliberately: the Receipts self-contained dashboard (Python, single-file
`out/dashboard.html`, build-time-inlined assets — its architecture is retained, §4.14; its
metric-tile drawer, before/after split and Evidence & limits tab are adopted and improved,
§5.7, §5.9) and the Prompture console (Next.js + recharts — its route surface informs §5;
its charting stack is evaluated and replaced, §4.14). The exporter's evidence object
(tier, confidence, direction, formula, sample, sources, exemplars, caveats) is the data
contract this design renders; §3.5–3.7 and §4.11 cover the fields ux-spec.md does not.

---

## 1. Design Principles

1. Evidence before ornament. Every pixel that is not data, structure or required context
   MUST justify itself; the default answer is removal.
2. The chart is a claim; the claim carries its qualifiers. Unit, availability, evidence
   kind, window and an "Explain" link ride with every metric surface (ux-spec Visualization
   Rules). No visualization may exist without its qualifiers in the same visual unit.
3. Absence is rendered as absence. Missing, unavailable and suppressed values produce
   blank canvas plus text — never zero, never interpolation, never a filler graphic.
4. Meaning never depends on color or icon alone. Every state has a text form, a pattern
   form and a color form; any one may fail (print, colorblindness, high-contrast mode)
   without loss of meaning.
5. Judgment-free rendering. No red/green good/bad encoding of metric direction, no scores,
   no gauges implying targets, no causal or ROI visuals (Constitution II, metrics.md
   Findings). Direction is stated as fact; interpretation belongs to the reader.
6. One system everywhere. Console, offline export and published artifact share tokens,
   grammar and renderer (ADR-014 rule 6). Fixtures MUST render identically in all three.

---

## 2. Design Language

### 2.1 Color tokens

All values are final, not ranges. Contrast ratios below are computed against `--canvas`
(#fbfbfc, relative luminance 0.966) unless noted. Text tokens meet WCAG 2.2 AA at their
assigned sizes; data-series tokens meet ≥4.5:1, exceeding the 3:1 non-text requirement.

| Token | Value | Contrast | Justification |
|---|---|---|---|
| `--canvas` | `#fbfbfc` | — | Inherited Receipts canvas; warm off-white keeps hairlines and white surfaces distinguishable. |
| `--surface` | `#ffffff` | — | Card/table surface; 1 step above canvas so cards read without shadows. |
| `--surface-recessed` | `#f4f5f7` | — | Table header rows, code/digest blocks; recess without borders. |
| `--ink` | `#16181d` | 15.9:1 | Inherited primary text; near-black with a cool cast, not pure #000. |
| `--ink-2` | `#4a4f58` | 8.0:1 | Secondary text (definitions, denominators); clearly subordinate, still AA at 12px. |
| `--ink-3` | `#5f6570` | 5.7:1 | Metadata, axis labels, footnotes; the floor of the text hierarchy — nothing lighter carries words. |
| `--accent` | `#3d4fd7` | 6.2:1 | Inherited single accent: links, focus rings, primary actions, series 1. The only saturated UI color. |
| `--accent-active` | `#2a379b` | 10.2:1 | Hover/pressed accent; darkening, never glow. |
| `--rule` | `#6f7580` | 4.5:1 | Functional borders (inputs, focusable scroll regions, chart axes); satisfies ux-spec ≥3:1 border rule. |
| `--hairline` | `#dcdee3` | 1.4:1 | Decorative typographic rules and gridlines only; MUST NOT be the sole carrier of a boundary that changes meaning. |
| `--error` | `#a5231d` | 7.1:1 | System error text and safe codes ONLY. MUST NOT encode any metric value or direction. |

**Categorical data ramp** (series colors; assign in order, never skip):

| Token | Value | Contrast | Hue |
|---|---|---|---|
| `--data-1` | `#3d4fd7` | 6.2:1 | blue (same as accent — the instrument has one blue) |
| `--data-2` | `#0e7a6e` | 5.1:1 | teal |
| `--data-3` | `#a63d1b` | 6.2:1 | vermilion |
| `--data-4` | `#7d4396` | 6.5:1 | plum |
| `--data-5` | `#8a6d00` | 4.8:1 | olive |
| `--data-6` | `#55606e` | 6.2:1 | slate |

Rules: hues chosen from the Okabe–Ito colorblind-safe family, darkened for the light
canvas; all six remain pairwise distinguishable under deuteranopia and protanopia because
they differ in lightness as well as hue. Regardless: **series MUST also be distinguished
by direct label, line dash or marker shape** (Principle 4) — the palette is redundancy,
not the primary channel. More than six concurrent series on one chart is forbidden; split
into small multiples (F8) instead.

**Sequential ramp** (single-hue, monotone lightness; completeness meters, density cells):

`--seq-1 #eef0fb` · `--seq-2 #d3d8f4` · `--seq-3 #b0b9ec` · `--seq-4 #8a96e1` ·
`--seq-5 #6274d9` · `--seq-6 #3d4fd7` · `--seq-7 #1e2a68`

Rules: monotone lightness makes order legible to all color-vision types and in grayscale.
Steps 1–3 fail 3:1 against canvas and therefore MUST be enclosed by a `--hairline` cell
boundary and accompanied by a printed value. No diverging ramp exists in this product:
a diverging ramp encodes a midpoint judgment ("good/bad around a target"), which
Principle 5 forbids.

**Explicitly absent**: success-green, warning-amber, "AI purple" gradients, dark-mode
palette (v1 is single-theme by design; the artifact commits to one printed look),
translucent glass surfaces, colored shadows.

### 2.2 Typography

Three faces, all SIL OFL 1.1 (§2.8 for embedding and licensing):

- **Source Serif 4** — display and editorial voice: report titles, section heads, finding
  headlines. Chosen for its transitional, financial-press character and screen-hinted
  optical sizes.
- **IBM Plex Sans** — UI, labels and all data. A rational grotesque with true tabular
  figures; reads as engineering, not marketing.
- **IBM Plex Mono** — digests, IDs, canonical hashes, code, safe error codes.

| Token | Face / weight | Size / line | Use |
|---|---|---|---|
| `type-display-1` | Source Serif 4 · 600 | 40 / 48 | Report title, one per document |
| `type-display-2` | Source Serif 4 · 600 | 28 / 36 | Screen titles, finding headlines |
| `type-heading` | Source Serif 4 · 600 | 21 / 28 | Section heads |
| `type-title` | IBM Plex Sans · 600 | 16 / 24 | Card titles, table column heads |
| `type-body` | IBM Plex Sans · 400 | 16 / 24 | Prose, definitions, explanations |
| `type-meta` | IBM Plex Sans · 400 | 14 / 20 | Qualifiers, footnotes, axis titles |
| `type-label` | IBM Plex Sans · 500 | 12 / 16, tracking +0.04em, uppercase | Evidence chips, axis tick labels, table micro-heads |
| `type-data-xl` | IBM Plex Sans · 500, `tabular-nums` | 32 / 36 | Metric card primary value |
| `type-data` | IBM Plex Sans · 500, `tabular-nums` | 16 / 24 | Table numerals, inline values |
| `type-mono` | IBM Plex Mono · 400 | 13 / 20 | Digests, metric IDs, safe codes |

Rules:
- All numerals everywhere set `font-variant-numeric: tabular-nums` (ux-spec).
- Body measure MUST NOT exceed 72ch. Justification: ragged-right always; never justified
  text (rivers destroy the instrument read).
- Minus sign is U+2212, ranges use en-dash, half-open windows print as `[start, end)`.
- No font-weight above 600 anywhere; emphasis comes from size, face and rules, not bolding.
- No italic in UI chrome; italic is reserved for Source Serif limitation notes
  ("volume, not value") where the registry mandates a caveat.
- Fallback stacks: serif → `Georgia, 'Times New Roman', serif`; grotesque → the ux-spec
  system stack; mono → `ui-monospace, 'SF Mono', Menlo, monospace`.

### 2.3 Spacing and layout

- Base unit 4px. Permitted gaps: 4, 8, 12, 16, 24, 32, 48, 64. No other values.
- Card padding 24 (16 below 768px). Section vertical rhythm 48. Page gutter by breakpoint:
  48 (≥1200), 32 (768–1199), 16 (<768).
- Grid: 12 columns ≥1200px, gutter 24, max readable content width 1440 (ux-spec);
  2-column report grid 768–1199; single column <768. No page-level horizontal overflow
  at 360px (ux-spec).
- Density: metric cards are 280×168 minimum at ≥1200; the instrument is dense, but a card
  never truncates its qualifiers — qualifiers wrap, values do not.

### 2.4 Rules, borders, elevation, radius

- The horizontal hairline (`--hairline`, 1px) is the primary structural device — this is
  the signature of the financial-press register. Sections separate by hairline + 48px, not
  by boxes.
- The **double rule** (two 1px `--ink` lines, 2px apart) appears exactly twice per report:
  under the report header block and above the Evidence & verification section. It marks
  the boundaries of the instrument's certified surface. It MUST NOT be reused elsewhere.
- Functional borders (`--rule`, 1px): inputs, focusable scroll regions, chart plot frames.
- Elevation: level 0 (flat, hairline-bounded) for everything static. Level 1 only for
  popovers/dialogs: `0 1px 2px rgba(22,24,29,.08), 0 12px 32px rgba(22,24,29,.10)`.
  Cards never cast shadows; a shadowed card is a marketing card.
- Radius: 0 on tables, rules, plot frames; 2px on chips and inputs; 4px on cards and
  dialogs. No pill shapes.

### 2.5 Motion

- One duration (120ms) and one easing (`cubic-bezier(0.2, 0, 0, 1)`) for opacity and
  ≤4px transform transitions; within the ux-spec 150ms cap.
- Charts render complete. No draw-on, count-up, stagger or entrance animation: an
  instrument shows its reading, it does not perform it. Count-up animation additionally
  displays false intermediate values, violating "a loading value is never shown as zero".
- `prefers-reduced-motion` removes all transitions. No parallax, no scroll-driven effects,
  no hover-scale.

### 2.6 Iconography

- No decorative icons. The permitted glyph set is: external-link ↗, chevron (disclosure),
  close ×, sort arrows, drag handle, search. Rendered as 1.5px-stroke line glyphs in
  current text color at 16×16.
- Every glyph has an adjacent or programmatic text label. No icon-only meaning.
- No emoji anywhere in product UI, exports or published artifacts.

### 2.7 Focus and interaction states

- Focus: 2px `--accent` ring, 2px offset (ux-spec). Links underline on default (1px,
  `text-underline-offset: 3px`), not only on hover.
- Hover states darken (`--accent-active`) or add `--surface-recessed`; nothing glows,
  scales or lifts.

### 2.8 Fonts: embedding and licensing

- Faces and licenses: Source Serif 4 © Adobe (OFL 1.1), IBM Plex Sans and IBM Plex Mono
  © IBM (OFL 1.1). All permit embedding and subsetting.
- Offline exports and published artifacts embed WOFF2 subsets as `data:` URIs — no remote
  request of any kind (ADR-014 rule 6). Hosted console serves the same WOFF2 files
  first-party; no font CDN.
- Subsets cover: Latin, Latin-1 punctuation, U+2212, U+2013–2014, U+2026, U+25B2/U+25BC,
  arrows U+2197, and tabular figures with the `tnum` feature retained. Budget: total
  embedded font payload ≤ 220KB per artifact.
- OFL compliance: subsetted binaries are Modified Versions and MUST be renamed to avoid
  the Reserved Font Names ("Source", "Plex"): internal names `SE Serif`, `SE Grot`,
  `SE Mono`. The full OFL text and copyright notices ship inside every artifact's
  manifest section.

---

## 3. Evidence Visual Grammar

One consistent system renders the eight evidence states everywhere: charts, tables, cards,
exports, print. This grammar is the product's signature and MUST NOT be locally reinvented.
Every treatment is triply redundant — **text + pattern + placement** — so it survives
grayscale print, colorblindness and screen readers.

### 3.1 The evidence chip

The chip is the atomic label. Anatomy:

```
 ┃ PROXY · LOW       ← type-label, small caps, --ink
 └ left rule: 3px wide, 12px tall, style = stroke grammar of the tier
```

- 1px `--hairline` border, 2px radius, `--surface` fill, 4px 8px padding.
- The left rule's *line style* — not its color — carries the tier: solid (measured),
  dashed (proxy), dotted (inferred). All chips are ink-on-surface; no colored chips.
- One chip carries tier **and** confidence (§3.5) as a single composite label; tier and
  confidence MUST NOT be split into two chips.
- Chips for availability states (`PARTIAL`, `UNAVAILABLE`, `SUPPRESSED`, `STALE`) use the
  same anatomy with the treatments in 3.3. A card shows at most two chips — the evidence
  chip and one availability chip ("a metric can be measured but partial", metrics.md).
  A third chip on any surface is a defect.

### 3.2 Stroke and fill grammar (evidence tier)

"Tier" and "evidence kind" are the same dimension: the exporter's
`tier ∈ {measured, proxy, inferred}` maps 1:1 onto the registry's kind.

| Tier | Line stroke | Area/bar fill | Chip rule |
|---|---|---|---|
| Measured | solid, 2px | solid series color | solid |
| Proxy | dashed 6-3, 2px | 45° hatch: 1px series-color lines, 4px pitch, on transparent | dashed |
| Inferred | dotted 1.5-3, 2px | stipple: 1.2px series-color dots on a 4px grid | dotted |

Rules:
- The kind treatment applies to the whole series; it is a property of the metric, not of
  a point.
- Hatch and stipple patterns are defined once as SVG `<pattern>` defs at exactly these
  dimensions; density MUST NOT vary with zoom or chart size (pattern is `userSpaceOnUse`).
- In print/grayscale the three kinds remain distinct by pattern alone. Acceptance: a
  600dpi monochrome print of the fixture sheet shows all three unambiguously.

### 3.3 Availability and freshness states

| State | Chart treatment | Table/card treatment |
|---|---|---|
| Available | Normal rendering per 3.2. | Value + unit. |
| Partial | Affected interval overlaid with a 135° ink hatch (1px `--ink` at 25% alpha, 4px pitch — opposite orientation to proxy hatch, so the two never read as one) **plus** inline text at the interval: "partial — {n} of {m} sources". Badge alone is forbidden (ux-spec). | Value + `PARTIAL` chip + "missing: {sources}, observed through {watermark}". |
| Unavailable | No mark, no position. The interval is blank canvas; the chart footer lists it: "Unavailable {interval}: {reason}". | "—" (U+2014) + reason in `type-meta`: "Unavailable — {reason}". Never 0, never a skeleton. |
| Suppressed | Nothing plotted, no reserved gap that reveals magnitude, no tooltip target, no downloadable cell. Footer line: "{k} interval(s) suppressed (k<5)". | Text "Suppressed (k<5)" or "(complementary)". The cell exports as that literal string, never a number. |
| Stale | Vertical `--rule` line at the observed-through instant with flag label "observed through {time} {tz}". Beyond it: blank canvas — not grayed, which would imply observed-but-empty. | `STALE` chip + "Observed through {time} {tz}; refresh creates a new snapshot". |
| Empty (no records) | No chart is rendered at all. The chart slot shows the empty-state text block (§6) naming scope, window and the permitted next action. Never a zeroed axis frame. | Same text block. |
| Error | No chart. Safe code in `type-mono --error`, affected source/step, whether a prior snapshot remains usable, retry action. | Same. |

Global rules:
- A gap in a time series is never bridged by a line segment (ux-spec); the line breaks and
  resumes. DST offset changes are labeled on the axis at the transition tick: "UTC+2→+1".
- A zero on any axis or in any cell asserts an observed complete eligible population with
  zero events. The renderer MUST distinguish input `0` from input `null` at the type level;
  there is no code path that coerces absence to zero.
- Suppression leak test: given any published chart+table+summary, the suppressed value
  MUST NOT be recoverable from complements, axis extents, bar remainders or file size.
  Complementary suppression extends to visual extents: if one of two categories is
  suppressed, the other's bar is also replaced by text.

### 3.4 Numbers

- Counts: thousands separator per display locale; no abbreviation ("12,480", never "12.5K")
  on cards ≥768px; below 768px "12.5K" is permitted only with the exact value in the
  accessible table.
- Percentages: numeric 0–100, one decimal by default, always with `{num}/{den}` visible
  beside them (ux-spec). A 0/0 population renders "Unavailable — no eligible records".
- Money: USD six-decimal strings are truth (metrics.md); cards display 2 decimals (≥$1)
  or 4 decimals (<$1); drilldown and every table cell show the full six-decimal string.
  Rounding is display-only and stated as such in the drilldown.
- Durations: cards show two units ("41 h 20 m"); tables show exact decimal hours.
- Deltas vs a prior window: rendered in `--ink` (never red/green) as
  "▲ 12.4% vs [2026-08-01, 2026-09-01)". Shown only when cohorts are comparable under
  metrics.md window rules; otherwise the delta slot shows "not comparable — {reason}".

### 3.5 Confidence

Confidence (`high | medium | low`) is a separate dimension from tier and from
availability, and gets a separate channel. The three dimensions and their three channels:

| Dimension | Question it answers | Channel |
|---|---|---|
| Tier | How was the number obtained? | Pattern/stroke grammar (§3.2) |
| Confidence | How much is the estimator trusted? | Text in the evidence chip |
| Availability | How much of the population was observed? | State treatments (§3.3) |

Rules:
- Confidence MUST NOT alter the value's rendering, pattern, color, size or opacity.
  A low-confidence number is not a faded number; it is a number with a stated caveat.
- On cards, `high` is the unmarked default: the chip shows tier alone (`MEASURED`).
  `medium` and `low` print in the composite chip (`PROXY · MED`, `INFERRED · LOW`).
  Marked-state economy keeps dense screens quiet (§3.7).
- In the drawer and drilldown, confidence always prints in full
  ("Confidence: low — {caveat texts resolved from catalog IDs}"), with every caveat ID
  rendered as its catalog string, never as a bare ID.
- `low` confidence additionally emits one `type-meta` footnote line on the card, drawn
  from the first caveat. Multiple caveats collapse to "+{n} caveats" linking to drilldown.
- Confidence is never conflated with availability: a measured/high metric can be partial;
  an inferred/low metric can be available. The renderer treats the fields independently.

### 3.6 Direction

The exporter declares `direction ∈ {higher_is_better, lower_is_better, neutral}` per
metric. Direction is a definitional convention, not a judgment the renderer may amplify.

- Direction MUST NOT be encoded in any visual channel: no color, no arrow styling, no
  glyph variation, no sort order derived from it. Deltas render in `--ink` per §3.4
  regardless of direction.
- When direction is non-neutral, the delta line appends a `type-meta` parenthetical:
  "▼ 18.0% vs [2026-07-01, 2026-08-01) (lower is generally preferred)". The word
  "better" MUST NOT appear; "generally preferred" states the convention without scoring
  the team.
- Neutral metrics carry no direction text anywhere. Rendering "neutral" as a label is
  itself a valence claim and is forbidden.
- Drilldown states direction once, in full: "Direction: lower values are generally
  preferred. This is a reading convention, not a target."
- Deriving any good/bad styling, sorting, badge or summary from direction is forbidden;
  the field exists so prose and summaries can orient the reader, nothing more.

### 3.7 Density rule: screens where most tiles are non-measured

On real data, 9 of 11 `ai.*` metrics are inferred and most `quality.*` are proxy — so on
those screens the tier marker is the majority case, not an exception. The grammar MUST
stay calm at that density:

- The grammar never changes per-screen. Constancy is the system; a tier treatment that
  softens when frequent would make the marker meaningless.
- Quietness is built into the tokens instead: hatch and stipple strokes render at 55%
  alpha of the series color (patterns are texture, not alarm); chips are ink-on-surface
  `type-label` in a fixed top-right position, forming one scannable column per card grid.
- When ≥ half the tiles in a section share one tier, the section header appends a
  normalizing summary in `type-meta`: "9 of 11 metrics in this section are inferred."
  Per-card chips remain (the per-card qualifier is non-negotiable, ux-spec) but may
  render the compact form (tier word only, confidence per §3.5 marking rules).
- Any warning ornament on proxy/inferred tiles — amber tint, warning glyph, ⚠, colored
  chip — is forbidden. Honest labeling rendered as alarm is a form of slop.
- Acceptance: the AI-family fixture screen (9/11 inferred) is reviewed in grayscale and
  at 1440px; the pass criterion is that tier is legible per tile within 2 seconds of
  looking, and the screen reads as typeset, not stickered.

---

## 4. Chart Catalog

### 4.1 Metric type → form mapping (normative)

| Metric type | Form |
|---|---|
| Scalar with trend | F1 Metric card with scaled sparkline |
| Time series (per-interval counts/rates) | F2 Interval series |
| Ratio / rate | F3 Proportion bar |
| Percentile / duration | F4 Distribution strip |
| Categorical breakdown | F5 Category bar |
| Cost composition | F6 Composition bar |
| Coverage / completeness | F7 Completeness meter |
| Cohort comparison | F8 Comparison pair |
| Evidence references | F9 Evidence ledger |
| Strongest evidence (exemplars) | F10 Exemplar |
| Text-valued metric (`unit: text`) | F1 text variant (§4.2) |

Any metric enters the catalog through its **type**; its **family** (§5.0) determines
placement, never its form. No other chart form may be introduced without amending this
spec.

### 4.2 F1 — Metric card with sparkline

**Use**: scalar value whose per-interval history exists at the same definition version.
**Anatomy** (280×168 minimum):

```
┌──────────────────────────────────────┐
│ git.commits            ┃ MEASURED    │  ← title (type-title) + evidence chip (§3.1)
│ Commits                              │  ← human name (type-meta)
│                                      │
│ 1,284                    commits     │  ← type-data-xl + unit (type-meta)
│ ▲ 6.1% vs [Aug 1, Sep 1)             │  ← delta line, --ink, optional
│ 96 ┈╱╲__╱▔╲  ╱╲ 132                  │  ← sparkline, 48px tall, min/max labels
│ [2026-08-01, 2026-09-01) · UTC       │  ← window + tz (type-meta)
│ Available · weekly     Explain ↗     │  ← availability · grain · Explain link
└──────────────────────────────────────┘
```

- Sparkline rules: 2px stroke in the metric's kind grammar; **min and max values printed
  at the left and right of the strip** (a sparkline without scale is forbidden, §4.12);
  gaps break the line; partial intervals carry a 3px 135°-hatch tick under the strip;
  suppressed intervals render nothing and add the footer count. Endpoint dot 3px.
- The five mandatory qualifiers — unit, availability, evidence kind, window, Explain —
  are part of the card component and cannot be omitted by configuration (ux-spec).
- Empty: card body is replaced by the empty-state block; the frame and title remain.
- Card footnotes mandated by the registry render in Source Serif italic `type-meta`
  (e.g. "volume, not value").
- **Text variant** (`unit: text`): the value slot renders the string in Source Serif
  600 21/28; no sparkline, no delta, no unit label. Qualifiers unchanged. The accessible
  equivalent is a statement row (metric, value string, availability, note).

**Accessible table**: one row per interval — interval, value, unit, availability, note.
**Text summary template**: "{Name}, {unit}, {kind}. {value} for [{start}, {end}) in {tz}.
{Trend sentence: 'Weekly values ranged {min}–{max} across {n} observed of {m} intervals'}.
{p} partial, {s} suppressed, {u} unavailable intervals." No interpretive sentence.

### 4.3 F2 — Interval series

**Use**: values per time interval. Columns for countable events per interval
(deployments, landings); a line for rates and durations sampled per interval. Never both
on one plot; never two scales.

```
  count/wk
  8 ┤                        ┊obs. through
  6 ┤   ██        ██    ▒▒   ┊
  4 ┤   ██  ██    ██    ▒▒   ┊
  2 ┤   ██  ██    ██    ▒▒   ┊
  0 ┼───┴───┴──·──┴─────┴────┊────
     W31  W32  W33  W34  W35
              └ "Unavailable W33: collector failure S-1041" (footer)
     ▒▒ = partial interval (135° hatch + "partial — 2 of 3 sources")
```

- Plot frame: 1px `--rule` left and bottom only. Gridlines: horizontal `--hairline`,
  at most 4. Y axis starts at 0 for counts; duration/rate lines may baseline at 0 only —
  truncated baselines are forbidden.
- X axis: interval boundaries in snapshot timezone; DST transitions labeled; week ticks
  as ISO "W34" with a full date range in the axis title.
- Max 6 series (then F8). Direct end-of-line labels, not a detached legend, when space
  allows; otherwise a top legend with kind-styled swatches.
- Empty/partial/suppressed/stale: per §3.3 exactly.

**Accessible table**: interval, per-series value, availability, note; one row per interval.
**Text summary**: "{Name} per {grain} from {start} to {end} ({tz}). {n} of {m} intervals
observed; values ranged {min}–{max} {unit}. {p} partial ({list}), {s} suppressed,
{u} unavailable. Observed through {watermark}."

### 4.4 F3 — Proportion bar

**Use**: any rate with numerator and denominator. Never a donut, never a lone percentage.

```
 Recorded review coverage        ┃ MEASURED
 82.4%   1,214 / 1,473 merged PRs
 ████████████████████████░░░░░░  |
 0                              100%
 Excluded: 41 PRs (bot-authored) · Explain ↗
```

- Track: 8px tall, full width, `--hairline` outline; filled portion in series color with
  the metric's kind fill grammar (hatch for proxy, stipple for inferred); remainder is
  blank surface — the remainder is "not in numerator", it carries no color.
- The numerator/denominator line is not removable (ux-spec). 0/0 renders the bar frame
  replaced by "Unavailable — no eligible records".
- Floors (ai.signature_commit_floor): a right-open tick "≥" prefix on the value and the
  fixed caption "detectable floor — true share may be higher". Rendering a floor as a
  closed value is forbidden.
- Exclusion counts print under the bar whenever the registry defines exclusions.

**Accessible table**: numerator, denominator, percentage, exclusions with reasons,
availability. **Text summary**: "{Name}: {pct}% — {num} of {den} {population noun},
[{start}, {end}) in {tz}. Excluded: {list with counts}. {kind statement}."

### 4.5 F4 — Distribution strip

**Use**: percentile metrics (p50 durations). Population always visible; a median without
its population size is forbidden.

```
 PR cycle time (p50)             ┃ MEASURED
 41 h 20 m        n = 214 merged PRs
 ├────────▓▓▓▓▓▓▓█▓▓▓▓──────────┤
 0h      p10=9h   ▲p50    p90=190h    240h
 Excluded: 12 PRs still open at window end
```

- Horizontal strip, 16px tall, linear scale in the metric's unit from 0 to a labeled
  maximum. p10–p90 band in `--seq-3`; median tick 2px `--ink` with a printed label.
  Whiskers to observed min/max as `--hairline`.
- If only the summary p50 exists (imported summary-only data, metrics.md): render the
  median tick alone with the caption "summary-only import — distribution unavailable";
  drawing an invented band is forbidden.
- Log scales are permitted only when p90/p10 > 100, and then the axis prints "log scale"
  in `type-label` on the axis itself, not in a tooltip.

**Accessible table**: p10, p50, p90, min, max, n, excluded counts with reasons.
**Text summary**: "{Name}: median {value} across {n} {population}. p10 {v}, p90 {v}.
{excl} records excluded ({reasons}). Percentiles computed from the union distribution."

### 4.6 F5 — Category bar

**Use**: breakdown of one total across named categories (token categories, source mix).
Horizontal bars, one per category, sorted by a **stable declared order** — never sorted by
value when categories are contributors (ADR-013 rule 1 makes value-ordering across people
an unimplementable query; the renderer MUST NOT provide it).

```
 Input tokens by category              ┃ MEASURED
 input (uncached)  ████████████████  8,214,022
 cache read        ████████          4,102,551
 cache write       ██                  912,004
 unknown fields    — unavailable under runtime semantics
```

- Bar height 16px, 8px gap, kind fill grammar, value printed at bar end in `type-data`
  (never inside the bar).
- A category with no data prints "— unavailable — {reason}" in the value slot with no bar;
  a zero-length bar is reserved for observed zero.
- Category count > 9: show 8 + an explicit "other ({n} categories, {value})" row that
  expands in drilldown; silently dropping categories is forbidden.

**Accessible table**: category, value, unit, share of known total, availability.
**Text summary**: "{Name} across {k} categories, [{window}). Largest: {cat} at {value}
{unit}. {list of unavailable categories with reasons}."

### 4.7 F6 — Composition bar

**Use**: cost composition only. A single 24px stacked horizontal bar whose segments MUST
include the residual categories; a composition that hides unpriced or unallocated amounts
is forbidden (ux-spec, metrics.md).

```
 Estimated equivalent cost (USD)       ┃ MEASURED
 $1,284.61  estimated equivalent — not billed expenditure
 ┃ attributed ██████████████ ┊ unallocated ▒▒▒▒ ┊ unpriced ┄┄ ┃
   $1,022.402113               $262.209870        3.1M tokens
 Price version pv-2026-08 · allocation v3 · Explain ↗
```

- Segment order fixed: attributed (solid, `--data-1`), unallocated (135° ink hatch — it is
  a known amount awaiting allocation, not an error), unpriced (no fill, dotted `--rule`
  outline; its width is proportional to token quantity share and its label carries the
  quantity, never a dollar figure — pricing an unpriced quantity, even visually, is
  forbidden).
- Segment boundaries are 1px `--surface` gaps. Each segment's exact six-decimal amount
  (or token quantity) prints below its span; cramped labels move to a leader-line list,
  they never truncate.
- "Estimated equivalent — not billed expenditure" is a fixed caption, `type-meta`,
  non-removable. Billed/subscription figures, when present, render as a **separate**
  composition bar with its own caption; the two bars MUST NOT stack or sum (metrics.md).
- Price version and allocation version always print in the footer.

**Accessible table**: segment, amount (six-decimal string) or token quantity, share of
priced total, price version, allocation version. **Text summary**: "{Name}:
{total} USD estimated equivalent for [{window}). Attributed {a}, unallocated {u},
unpriced usage {q} tokens across {k} units. Price version {pv}; allocation {av}."

### 4.8 F7 — Completeness meter

**Use**: coverage metrics (collection, instrumentation, linkage, maturity).

```
 Session link coverage                ┃ MEASURED
 63.2%    227 / 359 observed sessions
 ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░ 1px-cell track
 covered ▓ · uncovered ░ · target: none
```

- 12px track of `--seq-5` (covered) against `--surface` with `--hairline` outline
  (uncovered). Uncovered is absence, not danger: no amber, no red.
- Value never rounds to 100%: 99.6% prints "99.6%"; "100%" requires exact completeness.
- The literal caption "target: none" is fixed: coverage meters state fact; they do not
  imply a goal (Principle 5). If a workspace policy threshold exists it renders as a
  labeled tick "policy: 80% (workspace convention)" — never as a red/green split.

**Accessible table**: covered count, total, percentage, uncovered breakdown by reason.
**Text summary**: "{Name}: {pct}% — {num} of {den} {noun} covered, [{window}).
Uncovered: {reason: count, …}."

### 4.9 F8 — Comparison pair

**Use**: two cohorts (windows, repositories, task mixes). Small-multiple panels with
identical scales — never overlaid dual encodings, never a delta-only view.

- Two panels of the same form (F2–F7) side by side (stacked <768px), sharing one axis
  scale computed over both cohorts.
- A mandatory header strip prints both cohorts' n, task mix, coverage and maturity
  (ux-spec). If either cohort is partial, the comparison carries a `PARTIAL` chip.
- The between-panel gutter contains the factual delta line only. Arrows between panels,
  "improvement" language and any causal connective are forbidden (Constitution II).
- Cohorts with unlabeled different denominators MUST NOT share a panel row (metrics.md).

**Text summary**: "Comparison of {name} between {cohort A: n, window} and
{cohort B: n, window}. A: {value}; B: {value}; difference {delta}. Coverage A {…}, B {…}.
Cohort selection: {rule}." — and nothing more.

### 4.10 F9 — Evidence ledger

**Use**: paginated evidence references on drilldown pages. A table, specified here because
it is the terminal chart of every drill path.

- Columns: reference ID (`type-mono`), source, event time (UTC + snapshot tz), allowlisted
  fields, link state. Verified links and candidate links render in **separate tables under
  separate headings** — a shared table with a column flag is forbidden (ux-spec).
- Revoked/expired sources stay as rows with "unavailable — {reason code}", never removed.
- Wide tables live in a focusable, labeled scroll region with a stacked-row alternative;
  identity, value and status columns remain visible (ux-spec).
- Pagination prints "rows {a}–{b} of {n}"; infinite scroll is forbidden.

### 4.11 F10 — Exemplar

**Use**: the exporter's ranked `exemplars[]` — the single strongest pieces of evidence
behind a number, each with prose explaining why it proves it and its share of the total.
This is the surface that makes a number feel settled in a meeting; it gets editorial
weight.

```
 STRONGEST EVIDENCE · 1 OF 3                    ← type-label
 "feat: migrate billing to usage-based plans"   ← headline, Source Serif 600 21/28
 This single PR contributed 4,102 of 13,208
 added lines — 31.1% of the total.              ← why_this_proves_it + share, type-body
 ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░  31.1% of total         ← share strip: F3 micro, 6px track
 PR #482 · acme/api · merged 2026-08-14 ↗       ← source ref, type-meta
```

- Renders in drilldown and drawer only, after the primary chart, before eligibility.
  At most 3 exemplars render; more collapse behind "all {k} exemplars" in the ledger.
- Rank order is the exporter's order and MUST be preserved; the rank prints
  ("{rank} of {k}"). `share_of_total_pct` always prints beside the share strip;
  `weight` appears in the accessible table.
- The headline is real source data (commit/PR title) in quotation marks — never a
  generated paraphrase. `why_this_proves_it` prose is exporter data and is subject to
  the §6 voice lint at export time, not rewritten at render time.
- In published artifacts, source refs follow ADR-014 rule 2a (private repository names
  and paths redacted under `pseudonymous`); an exemplar whose ref is fully redacted
  keeps its share and prose with "source redacted for publication".
- An exemplar supplements the evidence ledger; it never substitutes for it, and it is
  excluded from any position where it could read as a contributor highlight: exemplars
  name work items, never people.

**Accessible table**: rank, headline, share_of_total_pct, weight, source ref,
occurred_at. **Text summary**: "Strongest evidence for {metric}: {headline} — {share}%
of the total {unit}. {k−1} further exemplars listed."

### 4.12 Forbidden forms

The following MUST NOT appear anywhere (console, export, published artifact, marketing
screenshots of the product):

| Forbidden | Reason |
|---|---|
| Pie/donut charts | Cannot represent partial/unavailable/suppressed segments honestly; angle encoding hides missing data as if the whole were known. |
| Dual-axis charts | Manufacture correlation; violate Constitution II. |
| 3D of any kind | Distorts every encoded value. |
| Gauges, dials, speedometers | Imply a target and a judgment; Principle 5. |
| Radar/spider charts | Imply commensurable axes and a composite score. |
| Sparklines without printed min/max | A line without scale is decoration posing as data. |
| Smoothed/spline interpolation | Draws values that were never observed. |
| Stacked areas of rates | Sums non-summable quantities. |
| Treemaps | Area normalizes to a whole, hiding unpriced/unallocated/suppressed remainders. |
| Calendar heat-grids in any people scope | Contribution-graph idiom is ranking-adjacent surveillance aesthetics; conflicts with ADR-013's intent. |
| Red/green direction coloring, score badges, letter grades | Judgment-free rendering; Principle 5. |
| Any "productivity score", composite index or percentile-rank visual | Constitution III; ADR-013 rule 1 — the primitive must not exist. |

### 4.13 Per-metric assignment (all registry metrics)

| Metric | Form(s) | Binding notes |
|---|---|---|
| git.commits | F1; drilldown F2 columns | Merge commits as a separate F1 card, never summed in. |
| git.lines_added | F1; drilldown F2 | Fixed footnote "volume, not value"; exclusion versions in Explain. |
| ai.signature_commit_floor | F3 | Inferred grammar; "≥" prefix; caption "detectable floor — true share may be higher". |
| ai.instrumented_sessions | F1; drilldown F2 | Caption "observed sessions only — no claim about all AI activity". |
| process.recorded_review_coverage | F3 | Footnote "reviewed is not necessarily approved". |
| process.approval_coverage | F3 | Dismissed-approval handling named in Explain. |
| delivery.pr_cycle_hours_p50 | F4 | Caption "PR cycle, not deployment lead time". |
| delivery.first_review_hours_p50 | F4 | Absent-review exclusions printed with count. |
| quality.file_rework_21d | F3 | Proxy grammar; immature-addition count printed; "no line survival claim". |
| quality.test_line_ratio | F3 | Proxy grammar; caption "changed lines on test paths, not executed coverage". |
| ci.failure_share | F3 card; F2 line in drilldown | Canceled/running exclusion counts printed. |
| delivery.branch_landings_week | F2 columns | Proxy grammar; MUST NOT occupy the deployment slot (ux-spec Report Structure); caption "default-branch landings, not deployments". |
| delivery.remediation_marker_share | F3 | Proxy grammar; caption "marker matches, not incident rate". |
| agent.tool_error_share | F3 | Caption "complete observed tool spans; no error text stored". |
| agent.elapsed_seconds_p50 | F4 | Interrupted-session exclusion count; caption "elapsed time, not labor". |
| agent.tokens_input | F1 + F5 breakdown | Categories per runtime cache semantics; unknown fields listed unavailable, never zero. |
| agent.tokens_output | F1 + F5 breakdown | Child-inclusive parents counted once — stated in Explain. |
| cost.estimated_equivalent_usd | F6 | Full residual disclosure; fixed "not billed expenditure" caption. |
| cost.attributed_pr_usd | F6 | One allocation version pinned and printed. |
| cost.estimated_per_merged_pr_usd | F1 | n/d line mandatory; unpriced/unallocated disclosure lines under the value. |
| cost.unallocated_usd | F1 | Fixed footnote "research is not automatically wasted work". |
| evidence.session_link_coverage | F7 | Declared cohort named on the meter. |
| production.deployments_week | F2 columns | Measured only; if no deployment source, the slot is Unavailable — a git proxy MUST NOT substitute. |
| production.change_failure_share | F3 | Partial when linkage unknown; linkage coverage printed beside n/d. |
| production.recovery_hours_p50 | F4 | Detection-based duration is a separately named strip, never merged. |
| people.active_contributors | F1 | Aggregate count only; suppression per ADR-013; no per-person expansion outside §5.5 views. |
| specs.valid_spec_count | F1 | Proxy grammar; fixed footnote "quantity is not quality". |
| legacy.receipts.* / legacy.sovix.* | Form per matching type; `LEGACY` chip | Original version/meaning preserved; no reaggregation beyond original scope (metrics.md). |

The exporter's wider surface (57 metrics across delivery 8, velocity 9, quality 9,
ai 11, people 6, process 7, temporal 4, ci 3) enters through the §4.1 type mapping;
family determines §5.0 placement. A metric without a canonical registry row renders
under its `legacy.*` ID and grammar until mapped (metrics.md).

### 4.14 Rendering architecture and charting stack

**Decision: no charting framework. The F-catalog is rendered by bespoke, pure SVG
generator functions — one per form — using headless D3 modules (`d3-scale`, `d3-shape`,
`d3-array`, `d3-time-format`) as math only, never for DOM manipulation. Generators emit
deterministic static SVG at build/render time. The console wraps the same generators in
thin React components; interactivity (drawer invocation, focus, table toggle) is a
progressive-enhancement layer over an SVG that is already complete and correct without
JavaScript.**

Why this and not a library:

1. **The artifact constraint decides it.** ADR-014 rule 6 / NFR-008 require a
   self-contained page that renders identically offline and prints to PDF. A hydrating
   runtime chart library cannot produce a JavaScript-free correct render; static SVG can.
   The incumbent Receipts dashboard (single-file `out/dashboard.html`, assets inlined at
   build time via `bundle.py`) has already validated build-time static inlining in
   production — this spec retains that architecture and makes the F-catalog generators
   the one shared renderer for console, offline export and published artifact
   (ADR-014's "only one rendering path to test").
2. **The catalog is closed.** Ten precisely specified forms, not arbitrary charts. A
   general-purpose library's flexibility is unneeded, and its abstractions sit exactly
   where this spec's hard requirements live: per-interval pattern fills (§3.3 partial),
   suppressed points with no node and no reserved position, unbridged gaps, printed
   sparkline min/max, numerator/denominator adjacency, DST tick labels, watermark rules,
   135° overlay hatches, complementary visual suppression.
3. **Determinism.** Same normalized inputs MUST yield byte-identical SVG (this product's
   verification culture extends to its renders; golden-SVG fixtures per form × state are
   the test vehicle, §8). Libraries with client-side measurement, responsive containers
   or animation passes cannot promise that.
4. **Typography.** Every tick, label and annotation is set in the §2.2 tokens with
   tabular numerals; libraries own their text layout and fight this.

Rejected options and what each could not express:

| Option | Rejection |
|---|---|
| recharts ^3.8.1 (incumbent in Prompture) | Requires React runtime + client measurement (ResponsiveContainer); no JS-free static output, so publication would need a second renderer — forbidden by the one-path rule. Gap handling is line-level `connectNulls`, not interval-level state; per-segment pattern fills, suppression-without-position and mandated label adjacency all require escaping the API. Tick/annotation control too coarse for §2.2 typography. |
| visx | Closest runner-up: low-level enough for the grammar and SSR-capable. Rejected because it couples chart definition to the React component tree and adds a large package family for what reduces to scales + paths; the publication path needs generators callable as pure functions outside React. The chosen design keeps visx's virtue (thin primitives) without the coupling. |
| D3 full (DOM selections) | D3's selection/transition model manipulates a live DOM; server/build rendering then needs a DOM shim and output is order-dependent, breaking determinism. The headless d3-* math modules are kept; the DOM half is not. |
| Observable Plot | Can emit SVG server-side, but its grammar cannot express suppression-without-position, complementary visual suppression, dual-orientation hatch overlays or fixed label adjacency without dropping to raw SVG for most of every chart — at which point Plot is overhead. It also injects its own stylesheet, fighting the token system. |

Migration cost from the incumbent: no recharts view migrates 1:1 — this product's chart
surface is the closed F-catalog, which is new work under any library, bounded at ten
generator functions plus shared scale/axis/pattern/chip utilities. The d3-* packages
already present in Prompture are retained (headless use only); `recharts` and
`react-force-graph-2d` are not carried into this product, and the deprecated
force-directed graph view is not reproduced (it has no place in the F-catalog).

Renderer rules:

- SVG pattern defs (§3.2) are emitted once per document and referenced by ID;
  `userSpaceOnUse` keeps density fixed.
- Charts are sized at render time from declared layout slots (§2.3 grids), not measured
  from the client; the four breakpoints each get a declared plot width. No
  resize-observer relayout in artifacts; the console may re-render on breakpoint change.
- The accessible table and text summary (§4 per-form) are emitted in the same pass as
  the SVG from the same data structure; they can never disagree.
- The published artifact bundle MUST contain no charting library, no framework runtime
  and no hydration payload; CI greps the bundle for `recharts`, `react-dom`, and
  `__NEXT_DATA__` — all must be absent.

Common to all screens: persistent header per ux-spec Report Structure (scope, half-open
window, timezone, observed-through watermark, snapshot state, generation time); double
rule beneath it; skip links; focus management per ux-spec. Layout figures give content
grid at 1440 / 1200 / 768 / 360 (page gutters per §2.3). "Above the fold" assumes 900px
viewport height at ≥1200px.

### 5.0 Family spine

The exporter's metric families are the organizing spine within screens and drilldown
grouping. They map onto the ux-spec report sections; a family never spawns a section of
its own outside this mapping:

| Family (count) | Report section / surface |
|---|---|
| delivery (8), velocity (9), temporal (4), process (7) | Delivery and process |
| ai (11) | Agent and cost (with cost.*) |
| quality (9), ci (3) | Quality signals |
| people (6) | People surfaces (§5.3, §5.5) + aggregate cards in overviews, under ADR-013 suppression |

Within a section, cards group by family under `type-label` micro-heads in the family
order above; card order within a family is the registry order, never value order.
Section tier summaries (§3.7) attach at the family group level.

### 5.1 Organization overview (`/w/{workspace}/projects`)

- **Purpose**: answer "what projects exist, is their evidence healthy, what changed" in
  one screen. It is a table of instruments, not a wall of tiles.
- **Hierarchy**: workspace name (display-2) → source-health line → project ledger →
  latest-snapshot inbox.
- **Above the fold**: the project ledger — one row per authorized project: name (link),
  repository count, latest snapshot date + state, collection coverage (inline F7,
  micro 80px), open findings count, freshness ("observed through …"). Sorted by project
  name; sortable by snapshot date; never by any metric value.
- **Layout**: 1440/1200 — full-width ledger table, 12-col; right rail (3 cols) with
  source-health summary list. 768 — rail stacks below ledger; ledger drops the coverage
  column into the stacked-row detail. 360 — stacked project cards (name, snapshot state,
  observed-through), one column; ledger's full data via each project page.
- **Empty**: "No projects are visible to this account in {workspace}." + permitted action.

### 5.2 Project overview (`/w/{workspace}/projects/{project}`)

- **Purpose**: leadership view — findings first, compact metric set, coverage callouts
  (ux-spec Report Structure 1). The view switcher (leadership / investigation / coverage)
  sits directly under the header and is a labeled tab set, same snapshot, same filters.
- **Hierarchy**: header → findings (max 3) → metric set → coverage callouts → section
  index of the full report.
- **Above the fold**: all findings and the first metric card row. A finding card:
  serif headline (display-2 at 21px scale on this screen), one-sentence factual body with
  uncertainty ("in the collected sample"), linked metric chip, "Propose investigation"
  action. No severity colors; findings are numbered F1–F3 in reading order, and the
  numbering restarts each snapshot — order is rule priority, and the card says so.
- **Thresholds are inspectable data, never buried prose** (preserved from the incumbent's
  rule catalog). Every finding card prints its triggering rule verbatim:
  "Rule: process.recorded_review_coverage < 50 (critical) · rules v{n} ↗", linking to
  the full rule catalog, where all rules render as a table (rule, predicate, severity,
  version) whether or not they fired. The findings block carries the fixed caption
  "Thresholds are configurable policy conventions, not universal performance standards"
  (metrics.md) exactly once.
- **Metric set**: F1 cards in a 4-col grid (1440), 3-col (1200), 2-col (768), 1-col (360),
  card order fixed by report section, never by value or "interestingness".
- **Coverage callouts**: a hairline-bounded strip of F7 micro-meters (collection,
  instrumentation, linkage, maturity) linking to §5.8.

### 5.3 Team view (aggregate; analyst+; k≥5 per ADR-013)

- **Purpose**: team-scoped aggregates of the same report sections. It exists to answer
  "how does the work flow here", never "who is best".
- **Hierarchy**: team scope line (team name, member count as "n = {k} contributors") →
  delivery/process cards → agent & cost cards → quality cards.
- **Structural rule**: there is **no multi-person table with metric columns anywhere on
  this screen** — that surface is the ranking primitive ADR-013 forbids, and it is absent
  by construction, not hidden by role. The contributor list (names pseudonymous per
  ADR-011) shows identity-free membership only, ordered lexicographically by handle.
- If the team cohort drops below 5 distinct humans for the window, the entire people-
  derived section renders the suppression state; complementary suppression applies across
  sibling teams (§3.3).
- **Layout**: as §5.2 grids. **Above the fold**: scope line + first card row.

### 5.4 Repository view (`/w/{workspace}/projects/{project}` filtered; sources at `/sources`)

- **Purpose**: one repository's delivery, quality and collection story.
- **Hierarchy**: repo identity (name, default branch, visibility) → freshness/source
  health (healthy/delayed/degraded/revoked/disabled as text labels with kind-styled left
  rules) → delivery F2 series (landings; deployments only if a deployment source exists)
  → process F3 pair → quality F3 pair → evidence ledger preview.
- **Above the fold**: identity, health, and the primary F2 series.
- **Layout**: 1440/1200 — main column (8–9 cols) charts, right rail (3 cols) source health
  and collection boundaries. 768/360 — single column, health strip first.

### 5.5 Individual / self profile (self view per ADR-013; named-person operational view)

- **Purpose**: a contributor's full-fidelity view of their own linked identities; and,
  separately, the audited named-person operational view for owner/admin where enabled.
- **Structural rules** (both variants):
  - Exactly **one subject per screen**. No side-by-side person comparison exists; no
    navigation "next contributor" affordance exists.
  - No percentile-vs-peers, no team-relative positioning, no rank of any kind (ADR-013
    rule 1). The subject's own history is the only comparison axis: every card's delta
    compares the subject to the subject's prior window.
  - Coaching output renders only in the self view (ADR-013 rule 6).
- **Self view hierarchy**: identity-link status ("verified via {method}") → work summary
  cards (commits, PRs, sessions, tokens — F1) → durations (F4) → cost cards (F6/F1) →
  "who viewed my data" audit panel listing named-person queries about them (ADR-013
  rule 4), reverse-chronological, with actor, window and timestamp.
- **Named-person operational view additionally**: a persistent, non-dismissable banner
  above the header: "Named-person view. This access is audited and visible to
  {handle}." in `type-meta` on `--surface-recessed`. Every render writes the audit event
  before data is returned; the banner and the audit are one feature, not two.
- **Retrospective mode** (supersedes the incumbent `/wrapped/[handle]` surface): the
  same self view over a fixed annual or quarterly window, laid out editorially — the one
  surface where `type-display-1` sequences across sections. It remains judgment-free:
  it narrates observed facts ("214 PRs merged; median cycle 41 h 20 m"), compares only
  against the subject's own prior periods, and superlatives, percentile-vs-peers and
  "top {n}%" framings are forbidden — the ranking primitive does not exist to feed them
  (ADR-013 rule 1). Sharing a retrospective is an explicit publish act producing a
  pseudonymous `PublishedArtifact` through the full redaction pipeline (ADR-014); there
  is no share shortcut that bypasses it.
- **Public profile** (supersedes the incumbent `/u/[handle]`): a public individual page
  is a `PublishedArtifact`-class surface at the isolated `/radar` origin (ux-spec
  routes): pseudonymous-or-stricter, provenance block, no private workspace navigation,
  no ranking, withdrawal semantics per ADR-014 rule 5. A plaintext-identity public
  profile does not exist in this product.
- **Above the fold**: identity status + first card row (self); banner + scope line
  (operational). **Layout**: card grids as §5.2.

### 5.6 Report / snapshot view (`/w/{workspace}/reports/{snapshot}`)

- **Purpose**: the immutable instrument — the screen the product is named for, and (via
  the shared renderer) the offline export and published artifact body (ADR-014 rule 6).
- **Hierarchy**: exactly the seven ux-spec sections in order: Overview; Delivery and
  process; Agent and cost; Quality signals; Coverage and limitations; Evidence and
  verification; Investigations. A left-hand section index (sticky at ≥1200px) mirrors it.
- **Above the fold**: full header block (all six header facts), double rule, and the
  Overview findings.
- **Print/publish deltas**: the published artifact prepends the ADR-014 provenance block —
  snapshot digest, definition versions, window, timezone, coverage summary, redaction
  version — set in `type-mono` inside a hairline frame, before any finding. Pseudonymous
  handles only; repository names per ADR-014 rule 2a. A withdrawn artifact's location
  serves the fixed withdrawal notice text (§6).
- **Layout**: 1440/1200 — 9-col content + 3-col index; 768/360 — single column, index
  becomes an in-page table of contents after the header. Report content max width honours
  the 72ch prose measure inside the 1440 cap.

### 5.7 Metric drilldown (`/w/{workspace}/reports/{snapshot}/metrics/{metric}`)

- **Purpose**: the arithmetic. Reached in ≤3 interactions from any finding (ux-spec).
- **Drawer decision — adopt and improve the incumbent.** The Receipts dashboard's
  metric-tile → right slide-out drawer is adopted as the console's fast path to
  evidence: every metric tile is a button; activating it opens a 480px right drawer
  (level-1 elevation, focus-trapped, Escape closes, focus returns to the tile). Three
  improvements over the incumbent: (1) opening the drawer updates the URL to the
  drilldown route, so the state is bookmarkable and back-button-safe (ux-spec IA rule
  the incumbent drawer lacks); (2) drawer and full page render the same hierarchy from
  the same payload — the drawer is the drilldown's compact form through "coverage
  meters", then "Full evidence ↗" continues to the ledger; they can never disagree;
  (3) below 1200px the same route renders as a full page, not a drawer. In offline
  exports and published artifacts there is no drawer: each metric's evidence body
  renders inline under its tile section using native `<details>` disclosure —
  print-safe, JS-free.
- **Hierarchy** (fixed by ux-spec Evidence Drill-down, rendered in this order):
  definition + version → displayed value + unit (type-data-xl) → evidence chip
  (tier · confidence, §3.5) → availability → direction statement (§3.6, non-neutral
  only) → scope/window/timezone → **formula with real numbers substituted** — the
  exporter's rendered string (e.g. `count(commits) = 21`) set verbatim in `type-mono`
  on `--surface-recessed`, with named inputs listed beneath as label: value pairs; the
  renderer MUST NOT recompute or reformat the numbers inside the formula string → the
  metric's primary form at full width (F2–F8) → F10 exemplars (≤3, §4.11) →
  numerator/denominator or ordered percentile population → eligibility and exclusions →
  source/sample counts (`sample{n, population, coverage_pct, excluded{reason: count}}`
  maps 1:1 onto this block) → coverage meters (F7 ×3) → observed-through watermark →
  plain-language block (`plain_english`, `why_it_matters`, `how_to_read` as three
  labeled `type-body` paragraphs, subject to §6 lint) → assumptions and caveats
  (catalog strings, never bare IDs) → limitations (serif italic block) → F9 evidence
  ledger (verified, then candidates under a separate heading).
- **Verification panel**: collapsed `<details>` region: normalized inputs, calculator and
  config digests in `type-mono`, canonicalization note (RFC 8785). Never credentials,
  bodies, prompts, names, emails, tool I/O or paths (ux-spec).
- **Above the fold**: definition through the primary chart.
- **Layout**: single 8-col centered column at ≥1200 (drilldown is linear reading);
  full width tables in labeled scroll regions below 768.

### 5.8 Coverage view (`/w/{workspace}/projects/{project}/coverage`)

- **Purpose**: what was and was not observed — the honesty surface.
- **Hierarchy**: coverage summary sentence ("Evidence covers {n} of {m} sources over
  [{window})") → four F7 meters (collection, instrumentation, linkage, maturity) at full
  size with uncovered-reason breakdowns → per-source table (source, state label,
  success/failure counts, pagination completeness, last event time, watermark) → unsupported
  fields and immature records lists → unavailable-measures list with required capability
  per measure.
- **Above the fold**: summary sentence + all four meters.
- **Layout**: 1440/1200 — meters in a 4-across strip, table full width; 768 — meters
  2×2; 360 — meters stacked, per-source table in stacked-row form.

### 5.9 Comparison view (before / after)

- **Purpose**: preserved and hardened from the incumbent's "Before / after" tab — a
  two-cohort comparison split at a declared point, built so a velocity-only
  AI-productivity claim cannot stand unchallenged.
- **Split point**: an explicit `--split-at` instant, or the median commit date as the
  default. The split's provenance prints in the header: "Split at median commit date
  2026-04-14 — a declared convention, not a detected change point." A split presented
  as statistically meaningful is forbidden.
- **The counterweight rule (normative)**: whenever any velocity or delivery metric
  appears in this view, the quality counterweights (quality.file_rework_21d,
  quality.test_line_ratio) and the process counterweight
  (process.recorded_review_coverage) MUST render in the same viewport section, in the
  same F8 form, at the same visual weight. A configuration that shows velocity without
  its counterweights does not exist; the renderer has no option to remove them.
- **Form**: F8 comparison pairs throughout (shared scales, both cohorts' n, task mix,
  coverage, maturity in the header strip; factual delta only; no causal connective —
  the fixed caption "A change across the split is an observation, not an attribution"
  renders once per view).
- **Hierarchy**: split declaration → delivery/velocity pairs → counterweight pairs
  (same section, no page break between them in print) → coverage comparison (F7 pair).
- **Above the fold**: split declaration + first pair row including at least one
  counterweight. **Layout**: pairs side-by-side ≥768px, stacked at 360px.

---

## 6. Editorial Voice

The product writes like a careful analyst: declarative, specific, unhurried. Every
sentence must survive the question "would this hold up read aloud in a dispute".

### 6.1 Rules

1. State the observation, its boundary, then the action. Never lead with reassurance.
2. Name the scope and window in any sentence that states a value out of card context.
3. Verbs of observation only: "observed", "collected", "recorded", "computed", "linked".
   MUST NOT: "achieved", "delivered", "unlocked", "powered", "boosted".
4. No exclamation marks. No emoji. No first-person product ("we crunched the numbers").
   The imperative addresses the user only in actions ("Connect a deployment source").
5. Uncertainty is written, not implied: "in the collected sample", "detectable floor",
   "proxy for", "not comparable because …".
6. Empty and error states name what is absent, why, and one permitted next step —
   in ≤2 sentences, no apology, no mascot, no humor.
7. Metric display names are nouns without adjectives: "Recorded review coverage", not
   "Review health". A name MUST NOT promise more than the definition computes.
8. Findings follow metrics.md: bounded claim + metric link + uncertainty + proposed
   investigation. The finding template is "Adjective-free observation in named scope".
9. Sentence case everywhere except `type-label` small-caps chips. No Title Case Headers.
10. Numbers in copy follow §3.4; a sentence never rounds differently than its chart.

### 6.2 Good / bad phrasings

| Context | Wrong | Right |
|---|---|---|
| Finding | "Most code reached production unreviewed!" | "Low recorded review coverage in the collected sample." |
| Empty state | "Nothing to see here yet! 🎉 Let's get you set up." | "No sessions observed for acme/api in [2026-08-01, 2026-09-01). Connect a session source or widen the window." |
| Zero vs absence | "0 deployments" (no source connected) | "Unavailable — no deployment source is connected for this repository." |
| 0/0 rate | "0%" | "Unavailable — no eligible records." |
| AI share | "38% of your code is AI-written" | "Signature floor: ≥38.2% of eligible commits carry agent signatures (312/816). True share may be higher." |
| Cost | "You spent $1,284 on AI" | "$1,284.61 estimated equivalent cost of observed usage — not billed expenditure. Unpriced: 3.1M tokens." |
| Delta | "Cycle time improved 18%! Great work!" | "Median PR cycle time: 41 h 20 m, ▼ 18.0% vs [2026-07-01, 2026-08-01). Cohorts comparable (same repositories, merged_at windows)." |
| Stale | "Data may be out of date" | "Observed through 2026-09-10 14:00 UTC. Refresh creates a new snapshot." |
| Suppressed | "Hidden for privacy 🔒" | "Suppressed (k<5). Cohorts under five people are not shown." |
| Error | "Oops! Something went wrong." | "Collection failed for github:acme/api (S-1041). The 2026-09-08 snapshot remains available. Retry collection." |
| Partial job | "Import complete ✓" | "Import partially succeeded: 4 of 6 sources collected. Failed: dash0 (S-2210), otlp (S-2214)." |
| Explanation | "This powerful metric gives you insight into team velocity" | "Counts unique eligible non-merge commit SHAs in the window. Merge commits are counted separately." |
| Withdrawal | "This report has been deleted" | "This artifact was withdrawn on {date}. Copies distributed before withdrawal cannot be recalled." |

### 6.3 Banned phrasings

The following MUST NOT appear in any UI string, export, artifact, tooltip or generated
narrative. CI greps for them case-insensitively:

`unlock` · `unleash` · `empower` · `supercharge` · `seamless(ly)` · `effortless(ly)` ·
`leverage` (verb) · `delve` · `robust` · `cutting-edge` · `game-chang` · `revolutioniz` ·
`at a glance` · `insights` (as a section or product noun) · `actionable` ·
`productivity score` · `velocity` (as a metric name) · `10x` · `AI-powered` ·
`smart` (as a feature adjective) · `magic` · `blazing` · `crushed it` · `oops` ·
`uh oh` · `whoops` · `let's` (in system copy) · `journey` (non-navigation) ·
`elevate` · `streamline` · `best-in-class` · `world-class` · `simply` · `just` (minimizer)
· any emoji · any exclamation mark.

Generated narratives (Constitution VII: outside the calculation path) are subject to this
entire section, may only paraphrase findings with citations, and MUST pass the same lint.

---

## 7. Anti-Slop Checklist

A screen, export or artifact MUST pass every line before ship. Reviewer initials each
group. "Screen" includes all eight §5 screens at all four widths.

**Truthfulness**
- [ ] Every zero on screen traces to an observed complete eligible population.
- [ ] Every absent value renders as absence (—, reason) — grep the DOM for `>0<` cells
      backed by null inputs; count must be zero.
- [ ] No time-series line crosses a missing interval.
- [ ] Every rate shows numerator/denominator; every 0/0 shows the unavailable string.
- [ ] Every percentile shows n; every comparison shows both n's, mix, coverage, maturity.
- [ ] Cost surfaces show unpriced and unallocated; "estimated equivalent" caption present;
      billed and equivalent never share a bar.
- [ ] Suppressed values are unrecoverable from complements, extents or exports.
- [ ] No forbidden form (§4.12) appears, including in empty-state illustrations (there
      are no illustrations).

**Grammar and tokens**
- [ ] Only tokens from §2 appear (no ad-hoc hex, sizes, weights, radii, shadows, gaps).
- [ ] Evidence chips present on every metric surface; tier stroke/fill matches registry;
      at most two chips per card; MED/LOW confidence printed in the composite chip and
      never restyles the value.
- [ ] Majority-non-measured screens (§3.7) carry the section tier summary and no
      warning ornament; grayscale review passes the 2-second tier-legibility test.
- [ ] Partial intervals carry hatch + text; a badge alone fails.
- [ ] Exemplars ≤3, rank and share_of_total printed, headlines verbatim in quotes.
- [ ] Grayscale print of the screen keeps all states distinguishable.
- [ ] All numerals tabular; minus is U+2212; windows print half-open.
- [ ] The double rule appears exactly at its two sanctioned positions.

**Judgment-free**
- [ ] No red/green direction coloring, no score, grade, rank, gauge or target implication.
- [ ] `direction` is never encoded visually; non-neutral deltas say "generally
      preferred", never "better"; neutral metrics carry no direction text at all.
- [ ] No causal, ROI or productivity language (run the §6.3 lint; zero hits).
- [ ] People surfaces: no multi-person metric table, no value-ordering of contributors,
      one subject per individual screen, audit banner on named-person views; exemplars
      name work items, never people.
- [ ] Comparison views satisfy the §5.9 counterweight rule; split provenance printed.
- [ ] Findings print rule predicate, severity and rule version; the rule catalog is
      reachable and complete.

**Craft**
- [ ] Card qualifiers (unit, availability, kind, window, Explain) intact on every card.
- [ ] Copy passes §6: sentence case, no banned strings, empty/error states ≤2 sentences
      with a permitted action.
- [ ] Type hierarchy: exactly one display-1 or display-2 per screen; prose measure ≤72ch;
      no weight >600.
- [ ] Alignment: numerals right-aligned in tables; decimal alignment in money columns;
      baseline grid holds across a card row.
- [ ] No orphaned qualifier wraps that separate a value from its unit.
- [ ] Charts render complete on load (no entrance animation); reduced-motion clean.

**Accessibility and portability**
- [ ] Every chart has its table and text summary; summaries name encoded dimensions and
      missing/partial/suppressed regions without conclusions.
- [ ] axe run clean at all four widths; keyboard-only pass; focus order documented.
- [ ] 360px: no page-level horizontal overflow; wide tables in labeled scroll regions.
- [ ] Export/artifact: zero remote requests with networking disabled; fonts embedded,
      subset, renamed per OFL; payload budgets met (§2.8); provenance block present
      (published artifacts).
- [ ] Fixture sheet (available / partial / unavailable / suppressed / stale / empty /
      error / legacy) renders identical semantics in console, offline HTML and manifest.

---

## 8. Acceptance

- A pixel-reviewed fixture sheet exists rendering every chart form (F1–F10) in every
  availability state and every evidence tier, in the console and the published-artifact
  renderer, plus a 600dpi monochrome print; all states distinguishable (§3). The sheet
  includes the §3.7 density fixture (a family section with 9 of 11 tiles inferred).
- Golden-SVG fixture tests per form × state: the same normalized inputs produce
  byte-identical SVG across two independent render runs (§4.14 determinism).
- The published-artifact fixture renders identically with JavaScript disabled, and CI
  greps its bundle for `recharts`, `react-dom` and `__NEXT_DATA__` — all absent.
- Contrast of every §2.1 token pair verified programmatically in CI against the surfaces
  it may appear on.
- The §6.3 lint runs in CI over UI strings, fixtures, exporter prose fields
  (`plain_english`, `why_it_matters`, `how_to_read`, exemplar prose) and generated
  narratives.
- The §5.9 counterweight rule has a rendering test: a comparison view configured with
  velocity metrics fails to build unless the counterweight metrics are present.
- The §7 checklist is a PR template item for any change touching a §5 screen.
- The relaxation of ux-spec.md:145 is back-ported to specs/001-sovix-evidence/ux-spec.md
  in the same change series that implements §2.8.
