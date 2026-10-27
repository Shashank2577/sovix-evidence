# UI decisions — record, not a request for approval

Built 2026-09-13. One direction, executed hard. No earlier prototype was opened.

## The direction: an evidence ledger, not a dashboard

The product's claim is that every number shows its working. So the interface is designed
as a **typeset audit report that behaves like modern software** — closer to a beautifully
set financial ledger than to a KPI wall. Research across current B2B products (Linear,
Vercel/Geist, Stripe's reporting surfaces, and 2026 trend surveys) converged on the same
signals of "expensive and credible" in 2026: near-monochrome calm surfaces, hairline rules
instead of boxes-in-boxes, tabular/monospace numerals, one accent doing very little, the
table as the truth and the chart as its summary, and dark mode designed first-class rather
than inverted. That is exactly what an evidence product should look like, so it was
adopted and pushed further in an editorial direction that the Geist-clones don't occupy.

## A semantic type system (the core idea)

Three voices, three typefaces, used by meaning rather than by size:

- **Newsreader (serif, optical sizing)** — interpretation and narrative: mastheads,
  findings, plain-English readings. The voice of the report's author.
- **Geist (sans)** — the instrument: labels, navigation, controls, table scaffolding.
- **Geist Mono** — the facts: every numeral, formula, ref, and date. If it was counted,
  it is set in mono with tabular figures.

A reader can tell at a glance whether they are reading evidence or interpretation. That
is the four-altitudes problem solved typographically.

## Palette

- **Light "paper"**: warm off-white ground (#FAF9F6), white panels, near-black ink.
- **Dark "ink"**: blue-black ground (#0E1014), graphite panels, off-white text.
  Designed separately: different hairline strengths, different chart alphas, lifted
  severity hues for AA contrast.
- **One accent — ultramarine ink** (#3B4FD8 light / #93A5FF dark): interaction and
  brand only. It never encodes judgment.
- Severity (critical/warning/info) exists only on Findings, as badges, per the data's
  own `severity` field. Metric direction is stated in words, never as colour or rank
  (a product fact).

## Screens — four altitudes

1. `index.html` — **The report** (CTO): findings, key signals with sparklines,
   repo comparison, before/after split (with its stated split reason — no causal
   claims), commit-hour heatmap, and a full provenance section: how the report was
   made, structural limits, exclusions, thresholds, identity resolution.
2. `scope.html?scope=…` — **The ledger** (EM/PM): all 57 metrics at any of the 10
   scopes, grouped by family with the family blurbs, filterable, every row opening
   its evidence.
3. `metric.html?metric=…&scope=…` — **The evidence** (everyone, PM included): the
   formula with real numbers verbatim, sample and coverage, exclusions with counts,
   assumptions and caveats, ranked exemplars with "why this proves it", the full
   source table linking to real commits and PRs, the monthly series, and the same
   metric across all ten scopes. Plain-English / why-it-matters / how-to-read set
   in serif for the non-technical reader.
4. `work.html` — **Your work** (engineer): every record cited anywhere in the report,
   searchable; select your PR and see every figure it appears in, and as what.
   Record-centric, never person-ranked; no sort by person exists.

## Product facts honoured in the implementation

- No ranking of people; `work.html` sorts by date only; contributors never ordered
  by a metric anywhere.
- No composite score or grade exists on any screen.
- Absence renders as "Not available" with the data's own reasons; series gaps are
  drawn as gaps (segments split, missing months labelled), never bridged.
- AI floor metrics print with `≥`, detected from the data's own floor caveat/label,
  and carry a floor note where charted.
- Comparison sections reproduce the data's `split_reason` and correlation caveats;
  no causal language added.

## Data

`assets/data.js` is the entire `cohort.json`, byte-faithful, wrapped as
`window.COHORT` by a script — nothing trimmed, nothing retyped by hand, so no number
in the UI can be invented. All rendering reads from it at runtime; pages work from
`file://` by double-click (data as a script tag, not fetch).

## Motion

Entrance choreography (staggered rise on IntersectionObserver), numeral count-up on
first view, sparkline/chart draw-in, hairline-accent row hovers, animated disclosures,
and a sun/moon theme toggle. All of it collapses to instant under
`prefers-reduced-motion`.

## Verification

Checked in headless Chrome (puppeteer-core), not assumed:

- All 57 metric evidence pages at 3 scopes (171 pages) at 360 px: zero horizontal
  overflow, zero console/page errors.
- All 10 scope pages plus index and work at 360 px and 1440 px: zero overflow, zero
  errors.
- Interaction suite: finding → evidence navigation with scope carried; theme toggle
  flips and persists across reload; visible focus ring on tab; record disclosure
  opens and its evidence links resolve; search filters on work and ledger; reveals
  render instantly under emulated `prefers-reduced-motion`.
- Screenshots reviewed at 360/1440 in both themes for every screen.

---

# Re-theme 2026-09-13 — the Apple direction

The evidence-ledger structure and behaviour were kept in full; the visual layer was
rebuilt in Apple's current design language (the iOS 26 / macOS 26, Liquid Glass
generation), researched from Apple's own Human Interface Guidelines (Materials —
updated for Liquid Glass Sep 2025 — Typography, Color, Motion, Accessibility), not
from blog summaries. `assets/data.js` is byte-identical
(md5 c8e90fe73f8f35a352d48d265fe093e1); `app.js` is untouched, so the five product
facts (no ranking, no score, absence ≠ zero, floors print ≥, `ai.*_delta` metrics
never print ≥, no causal claims) are carried forward unchanged.

## The Liquid Glass call (the judgement that was delegated)

The HIG is explicit: Liquid Glass is *a functional layer for controls and navigation
that floats above the content layer*; "Don't use Liquid Glass in the content layer"
and "Use Liquid Glass effects sparingly." This product is almost entirely content —
tables, formulas, figures — so the material is used exactly twice:

- **Used — the top bar.** The one true navigation surface. Translucent
  `saturate(1.8) blur(22px)` material with a specular top edge and a hairline scroll
  edge; the primary nav inside it is drawn as a real segmented control (capsule
  track, elevated thumb).
- **Used — the chart tooltip.** A transient popover floating above content; popovers
  are one of the HIG's named regular-variant cases.
- **Refused — everything else.** Findings, signal tiles, the ledger, evidence
  panels, formula wells, comparison tables, the heatmap, records and the sidebar are
  opaque standard-material surfaces (white / `#2C2C2E` cards on grouped
  backgrounds). Reasons: (1) the HIG's content-layer prohibition; (2) legibility —
  57 metrics, dense numerals and 4.5:1 AA targets don't survive translucency;
  (3) glass-on-glass stacking is the failure mode Apple itself warns about. The
  sidebar would carry sidebar material in a real Mac window, but on the web there is
  no desktop behind it to refract, so translucency there would be a lie; it gets the
  flat grouped treatment with a macOS-style selection fill instead.
- The **clear** variant is used nowhere — it is only for media-rich backgrounds,
  which this product does not have.

## Typography

San Francisco via `-apple-system`/`BlinkMacSystemFont` (real SF Pro on Apple
devices, with dynamic optical sizing handling the Display/Text crossover ~20pt);
Inter (variable, opsz) loaded from Google Fonts as the metric-compatible fallback
elsewhere; SF Mono via `ui-monospace` (Menlo/Consolas fallback, no webfont needed).
The Newsreader serif voice is retired — Apple's guidance is to minimise typefaces
and build hierarchy from weight and size, so: large-title masthead (700, −0.021em),
Title-scale section heads (600), body 14px, uppercase grouped-section headers in
secondary colour standing in for the old overlines. Big figures switched from mono
to SF semibold with `font-variant-numeric: tabular-nums` (the Screen Time / Stocks
treatment); SF Mono remains only where content is genuinely code-like: formulas,
refs, dates, IDs.

## Colour

Apple's semantic system, resolved separately per theme (dark is not an inversion):
light = systemGroupedBackground `#F2F2F7` with white cards; dark = elevated grouped
`#1C1C1E` with `#2C2C2E` cards. Label hierarchy: `#1D1D1F` / `rgba(60,60,67,.78)` /
`#6E6E73` light, `#F5F5F7` / `rgba(235,235,245,.68)` / `#98989F` dark — the
tertiary steps deliberately stronger than Apple's own tertiaryLabel, which fails AA
and is reserved by Apple for disabled states. Separators from the
`rgba(60,60,67,x)` / `rgba(84,84,88,x)` families. Accent is system blue, split into
three jobs: `--accent` (graphics), `--accent-fill` (filled controls carrying white
text — deepened to `#0669D8` in dark because white on `#0A84FF` is 3.3:1),
`--accent-ink` (text links — `#005FC2` light so links survive tinted capsule
fills). Severity uses Apple's increased-contrast palette (`#D70015`/`#C93400`
light; `#FF7A72`/`#FFB340` dark) and severity is always paired with a text label —
colour never stands alone. Every pair listed here was audited programmatically in
the rendered pages, both themes: all sampled text ≥ 4.5:1.

## Geometry, controls, motion

16px cards / 10px nested wells / capsule controls, with `corner-shape: squircle`
applied behind `@supports` for engines that draw continuous curvature. Controls
redrawn to their macOS equivalents: segmented control (nav), quaternary-fill search
field, filter capsules that fill with accent when active, macOS sidebar selection,
tinted-capsule badges and chips (the floor chip is accent-tinted so "≥ floor, not a
share" reads as a first-class annotation). Motion: entrance reveals use Apple's
ease-out (`cubic-bezier(0.32,0.72,0,1)`, no overshoot); interactive elements
(toggle, chevrons, dots, presses) use a CSS `linear()` spring with a small settle.
The old hover paraphernalia that read as web (severity bar wipe, dashed borders,
hover borders) was removed as gratuitous. `prefers-reduced-motion` now follows the
HIG's actual instruction — movement is replaced by crossfades (theme change and
tooltips still fade) rather than feedback being deleted.

## Verification (headless Chrome, not assumed)

All four screens × both themes × 1440 and 360, plus a floor metric
(`ai.detected_commit_share` → "≥ 1.9%") and a delta metric (`ai.rework_delta` →
"−2.8%", no ≥): zero horizontal overflow, zero console/page errors, theme persisted
and pre-paint intact. Contrast audit of ~50 computed foreground/background pairs
per theme: all pass AA. Keyboard: skip link is first tab stop; visible 3px accent
focus ring confirmed. Screenshots reviewed for every screen in both themes at both
widths. `data.js` checksum re-verified after the work.

---

# Re-theme 2026-09-13 (second pass) — a macOS application window, not an iOS surface

The first Apple pass came out iOS: grouped `#F2F2F7` ground, floating rounded
cards, capsule pills, a segmented control as primary navigation, 16–17px body.
That is the iOS grouped-list idiom on a desktop viewport, and it was rejected for
exactly that reason. This pass rebuilds the shell as a Mac application window,
studied against what is actually on screen in Finder, Mail, Xcode, System
Settings, Notes and Numbers. `assets/data.js` is byte-identical (md5
`c8e90fe73f8f35a352d48d265fe093e1`, verified before and after); every number,
formula, caveat, exemplar and source link is carried forward; the five product
facts and the `ai.*_delta` no-≥ rule in `app.js` are untouched.

## The window

The page never scrolls. `body` is `overflow: hidden`; the viewport is the
window: full-height source-list **sidebar** on the left, then a **unified
toolbar**, an internal **scroll pane**, and a **status bar** stacked in the
content column (Finder's arrangement — sidebar full height, toolbar and status
bar spanning content only). The old web footer became the status bar: page
counts on the left ("57 metrics · All repositories", "1,106 records…"),
generation/collection metadata and the no-score line on the right, 11px.

## Sidebar — the altitude ladder as a source list

Primary navigation moved entirely out of the segmented control and into a
232px source list: app identity at top, then **The report**, a **Scopes**
section carrying the ladder (organisation → three projects as disclosure
groups → six repositories nested inside), and a **Reference** section (Your
work, How it was made → the provenance section on the report). The ledger
needs no separate reference row: every ladder row *is* the ledger at that
scope. Rows are 28px/26px, 13px/12.5px text, accent-tinted SF-style symbols,
selection as an accent-tinted rounded row, real disclosure triangles that
collapse a project's repositories. Below 900px the sidebar becomes an
off-canvas drawer with a scrim; the toolbar's leading sidebar button toggles
collapse on wide windows and the drawer on narrow ones; Escape closes it.

## Judgement call: window chrome

**No fake traffic lights and no drawn window frame.** A browser tab is not a
window and pretending otherwise is set dressing; what makes the build read as
macOS is the *structure* — toolbar / sidebar / content / status bar — plus Mac
density and Mac controls, so those were made unmistakable and the cosplay was
refused. The page owning its own scroll (content moving under the toolbar,
chrome fixed) is the one piece of window behaviour a browser can honestly
reproduce, so it is implemented for real rather than implied.

## Judgement call: sidebar vibrancy

On a real Mac the sidebar refracts the desktop behind the window. In a browser
there is nothing behind the page, so translucency there would be synthesising
a refraction of something that does not exist. The honest equivalent is what
macOS itself renders when it cannot or will not do vibrancy — the **Reduce
Transparency** appearance: a flat opaque near-window gray (`#F4F4F4` light,
`#29292C` dark). The **toolbar is the one translucent surface kept**, because
content genuinely scrolls beneath it — the blur has something real to show
(`rgba` at 0.8+ alpha so the contrast audit holds at worst case). The chart
tooltip keeps popover material for the same reason: it floats over real
content.

## Content at Mac density

13px body, 11px labels, 22px page titles, tighter row heights throughout.

- **The ledger is a real table view**: column headers (Metric, Value, Sample,
  Tier, Confidence, Trend · 12 mo), thin separators, alternating row tint
  (restriped by JS after filtering), family group-header rows carrying the
  family blurbs, rows clickable with the metric name remaining a true link
  for the keyboard. Column headers are not sortable — the ledger's fixed
  family order is part of the report's argument, and a sort affordance that
  reorders evidence invites exactly the ranking reading the product forbids.
  Columns drop progressively below 960/820/560px so 360px fits with zero
  horizontal overflow (the long metric ids are allowed to break only there).
- **Findings are list rows**, not a card grid: severity badge + title, detail,
  action, scope and value columns, chevron.
- **The metric screen gained an inspector**: 280px right panel behind a
  hairline, sticky and independently scrollable, carrying the sample and
  coverage (with exclusions), the same-metric-across-scopes dot plot, the
  window, and tier/confidence. The formula stays in the content column — the
  working is the document, not metadata about it.
- **Controls redrawn as Mac controls**: bordered push buttons ("Show all N
  records", "Show N more"), a pop-up button (a real `<select>` drawn with the
  macOS chevron capsule) for viewing a metric at another scope, scope-bar
  toggle buttons for record kinds on Your work, disclosure triangles on the
  outline-view record rows, a toolbar search field (the ledger filter and the
  work search both moved into the toolbar, where a Mac search field lives).
- Toolbar carries a two-line centered window title (title + small subtitle,
  Mail-style) set per page, icon-only buttons with tooltips.
- Entrance motion cut to a quiet 0.3s fade — Mac apps do not choreograph.
  Reveal now triggers on first visible pixel (tall list containers at 360
  otherwise never crossed the old 12% threshold). Reduce Motion still
  converts movement to crossfades.

## Verification (headless Chrome, not assumed)

All four screens × both themes × 1440 and 360: zero console/page errors, zero
horizontal overflow at document level and inside the internal scroll pane.
Contrast audited programmatically on rendered pages with correct alpha
compositing (fg and every rgba background layer composited down to the opaque
base before computing ratios — two real failures this caught and fixed: the
breadcrumb separator drawn in hairline colour, and the dark floor tag at 4.49:1
over a striped row; dark accent-ink lifted to `#55A7FF`). Floor metric renders
"≥ 1.9%", delta metric renders "−2.8%" with no ≥; the word "better" appears
nowhere in rendered text on any audited page ("Higher/Lower is generally
preferred" retained). Theme toggle persists across reload with the pre-paint
script intact; sidebar navigation, ledger filter + row click, scope pop-up,
record disclosure and kind toggles, 360 drawer + Escape, skip link as first
tab stop, and instant reveals under emulated `prefers-reduced-motion` all
exercised and passing. Screenshots reviewed for every screen, both themes,
both widths. `data.js` md5 re-verified after the work.

---

# Rebuild 2026-09-14 — the page is seen first, read second

The verdict on the metric screen from a cold first look: *"No feel on the page at all.
All just text, full of text, no visualisation of any kind. And look at the white
space."* That outranked everything: a data product whose pages were prose. This pass
keeps the macOS frame (toolbar, source-list sidebar, Mac density, Mac controls —
confirmed right) and rebuilds what lives inside it. `assets/data.js` is byte-identical
(md5 `c8e90fe73f8f35a352d48d265fe093e1`, verified before and after); every number,
formula, caveat, exemplar and source link is carried forward; the five product facts
hold.

## Visualisation is now the primary object (problem A)

Three figures on the metric page had shape and showed none of it. Each now has a
purpose-built form, large and above the fold:

- **The sample is a part-of-whole segment band** (`segBar` in `app.js`): counted in
  accent, each stated exclusion in greys, and — where the exclusion list does not sum
  to the population — a hatched segment labelled *"In scope but not counted — no
  exclusion recorded."* That remainder exists in the data (e.g. lead time: 640 counted
  + 258 excluded of 1,200) and hiding it would have been the exact dishonesty the
  product exists to prevent. Pie/donut/gauge/radar/treemap were refused per the brief:
  none keeps an excluded portion visible; a segmented band does. Percent labels render
  inside segments wide enough to carry them; a full legend with counts and shares
  repeats everything, so nothing is hover-only.
- **The monthly series is a real chart, not a footnote**: moved from the bottom of the
  page into the hero-adjacent chart band, ~340px tall, with a numeric y-axis
  (round-number gridlines, unit-suffixed ticks for %, h, min) it never had. Gaps stay
  gaps — dashed hatches with a "no data" label per run of missing months.
- **The cross-scope comparison is a distribution plot** (`distPlot`): the 250px
  inspector rail became a full-width dot plot on a shared numeric axis with tick
  gridlines — the axis always includes zero, integer metrics get integer ticks, tick
  density follows the rendered track width, negative deltas get a strengthened zero
  line. This scope's row is tinted and its dot ringed: position-within-distribution,
  visible at a glance. Metrics whose values aren't numeric (busiest hour) drop the
  track and compare as text; absence renders "Not available", never zero and never a
  dot (the old rail's "n/a" shorthand is gone).

## The other eight

- **B — width.** The container cap went 1080 → 1560px with band layouts (hero
  460px/1fr, chart band 3fr/2fr, prose band 1.4/1/1) so a desktop window is filled.
  Everything stacks below 1100px.
- **C — the value is the hero.** `clamp(44px, 4.7vw, 76px)` semibold tabular SF, in
  its own card, vertically weighted; unit set small beside it. Long non-unit displays
  ("15:00–16:00 local") stay whole at a reduced scale instead of being split into a
  fake number+unit.
- **D — one title.** The toolbar says what the window is ("The evidence" · family ·
  scope); the page h1 is the metric's name, once. Same on the ledger: toolbar carries
  the role, the h1 carries the scope.
- **E — weight where the argument is.** The Working is the one accent-tinted,
  accent-bordered card on the page, full width under the charts. Prose reading,
  caveats, window and provenance are standard cards in a three-column band; caveats
  are an aside, not a peer of the working.
- **F — one surface system.** The flush-hairline inspector is deleted; its content
  moved into the hero (sample), the chart band (cross-scope), and the aside column
  (window, tier/confidence). Every content object is now the same elevated card.
- **G — depth.** New `--ground`/`--surface`/`--card-shadow` tokens: cards float on a
  sunken content ground in both themes (light `#f4f5f7`/white, dark
  `#161619`/`#26262a`), soft layered shadows, dark designed separately.
- **H — short cold start.** Toolbar → one breadcrumb line → hero. The eyebrow, the
  standalone disclaimer band and the scope-dropdown band are gone; chips and the
  direction note live inside the hero card, and the scope pop-up moved into the
  cross-scope chart's header, which is where changing scope has meaning.
- **I — sidebar on arrival.** A first load on a wide window always shows the sidebar;
  collapse is a within-session choice and is deliberately not persisted
  (`header()` clears `sb-collapsed` on wide load).

## Motion honesty

The brief's rule — a chart never animates its data up from zero — was being violated
three ways: bars grew from the baseline, coverage bars scaled from zero, and count-up
animated every figure from 0. All three are removed (`countUp` now renders final text
immediately; the sparkline draw-in went with them). What remains is the quiet 0.3s
fade, which moves opacity, never data.

## Carried to the other three screens

index, scope and work inherit the ground/card system, the 1560px container and the
motion rules unchanged in behaviour; the ledger's alternating-row table, the findings
list and the record outline all sit as cards on the ground. The gap-month "no data"
label ink was darkened in both themes — it is text and previously failed AA in light
(#86868b → #6e6e73; dark lifted to #a2a2a7).

## Verification (headless Chrome, not assumed)

40-combination matrix — index, ledger (org + repo), work, and six metric variants
(series, floor, delta, not-available, non-numeric, repo scope) × light and dark × 1440
and 360: zero console/page errors, zero horizontal overflow measured on **both** the
document and the internal `#scrollpane` (the body-overflow-hidden trap the brief named
— and it caught a real one: the three-column prose band out-specified the narrow-width
stack rule and overflowed the pane by 208px at 360 until fixed). Alpha-composited
contrast audit over every rendered text node on all 40 combinations: zero failures at
AA (the auditor itself was validated by injecting a known 2.3:1 failure and confirming
it is flagged). Floor metric renders "≥ 1.9%"; delta renders "−2.8%" with no ≥; the
word "better" appears in no rendered copy on any audited page. Interaction suite:
theme toggle persists across reload; scope pop-up navigates carrying the metric;
show-all-records toggles; the current dist row links and reads its exact value; skip
link is the first tab stop; chart bars are keyboard-focusable and raise the tooltip
(nothing hover-only); sidebar collapse followed by reload still shows the sidebar;
reveals are instant under emulated `prefers-reduced-motion`; ledger filter and work
kind-toggles function. `data.js` md5 re-verified after the work.
