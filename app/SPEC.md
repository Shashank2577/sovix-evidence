# Sovix — Product Specification (web + mobile web)

Version 1.0 · 14 September 2026 · Source of truth for the build.
Behavioural source: `SOVIX-CONTEXT.md`. Data source: `cohort.json` (schema 1.0).
Design source: `client/src/pages/Home.tsx` + `client/src/index.css` + `DESIGN-REFERENCE.png`.

This document is written to be built from in parallel. Every screen has its empty,
loading and error states. Every choice is made; where a choice was between options,
the one-line reason is given. If an implementer finds themselves guessing, that is a
defect in this document — raise it, don't improvise.

---

## 0. What we are building

A read-only evidence report reader. One immutable edition of engineering measurements
(57 metrics × 10 scopes) with, attached to every figure, the working that justifies it:
formula with real values, sample and exclusions, assumptions and caveats, ranked
exemplars, and links to the actual commits and pull requests. Four audiences enter the
same body of evidence at four heights (CTO, engineering manager, project manager,
engineer). The product's single differentiator — *why you should believe the number* —
must be at most one interaction away from every figure on every screen.

### 0.1 The five product rules, and what they mean for the interface

These are not guidelines. Violating any of them is a release blocker.

| Rule | Interface consequence |
|---|---|
| **Never rank people** | No table, list or chart is ever sorted by a per-person value. Contributor names appear only inside source records and exemplar prose. There is no per-contributor screen in this edition (see §1.4). The `people.*` metrics render as scope-level aggregates only. |
| **No score, grade or index** | No composite number anywhere. No "health score", no letter grades, no gauge charts. The status pill (§5.6) is derived strictly from *findings that fired* — it restates rule outcomes, it does not invent a judgement. |
| **No causal claims** | Rendered copy never says "because", "caused", "led to", "improved", "better", "worse" about a measurement. The before/after comparison is labelled "what changed", never "what AI did". A `copy.ts` lint test enforces the banned-word list (§6.5). |
| **Absence is never zero** | `value: null` renders the `NotAvailable` component (§6.4) with the reason — never `0`, never `—` alone, never an empty cell. Missing months in a series render as a gap in the line, never bridged, never zeroed (`connectNulls` stays false, forever). |
| **AI figures are floors** | `ai.detected_commit_share`, `ai.detected_line_share`, `ai.adopter_share` always render with a `≥` prefix via `FloorFigure` (§6.3). The data's `display` field does **not** carry the prefix — the client adds it from `FLOOR_METRIC_IDS`. `ai.tool_concentration` and the `ai.*_delta` metrics are *not* floors (they are shares/comparisons within the traced subset) and never get the prefix. |

Additional standing rule from the brief, repeated here because it kills features late:
**a chart never animates its data up from zero**, and **nothing may exist only on
hover** (touch, keyboard and print must all reach it).

---

## 1. Information architecture

### 1.1 The altitude ladder and the evidence axis

Two orthogonal movements, and the IA serves both:

- **Vertical (altitude):** organisation → project → repository. Every scope gets the
  same five-tab template, so moving down never changes the mental model, only the data.
- **Lateral (evidence):** any figure → its working. This is the Working drawer (§5.10),
  reachable from every rendering of every figure via one tap/click/Enter, addressable
  by URL (`?working=<metricId>`), and expandable to the full metric page.

### 1.2 Scope slugs

Built at build time from `navigation` (§9.2). Slug = lowercase label, non-alphanumeric
runs → `-`:

| Scope key | Slug | Route prefix |
|---|---|---|
| `org:all` | `org` | `/` |
| `project:JavaScript and TypeScript` | `javascript-and-typescript` | `/project/javascript-and-typescript` |
| `project:Python` | `python` | `/project/python` |
| `project:Go` | `go` | `/project/go` |
| `repo:axios/axios` | `axios-axios` | `/repo/axios/axios` |
| …and the other five repos | `owner-name` | `/repo/:owner/:name` |

Reason for path-shaped repo routes: `repo:fastapi/fastapi` must survive being pasted
into Slack and a board deck; encoded colons don't.

### 1.3 Route table (web)

Wouter. `<ScopeRoutes>` is one component mounted three ways; scope resolution comes
from the route params.

| Route | Screen | Notes |
|---|---|---|
| `/` | Overview @ org | Canonical org home. `/org/*` 301-style client redirect → `/*`. |
| `/metrics` | Metrics index @ org | |
| `/metrics/:metricId` | Metric detail @ org | `:metricId` is the raw id, e.g. `delivery.lead_time_p50`. |
| `/findings` | Findings @ org | All 8 headlines. |
| `/trends` | Trends @ org | 9 series + heatmap + before/after. |
| `/repositories` | Scope table @ org | Repos grouped by project. |
| `/project/:slug` (+ same five sub-tabs) | Project scope | `/repositories` here lists only that project's repos. |
| `/repo/:owner/:name` (+ `/metrics`, `/metrics/:metricId`, `/findings`, `/trends`) | Repo scope | No `/repositories` tab at repo level (no children). |
| `/compare?scopes=a,b,c` | Compare | Edition-level, up to 3 scope slugs. **Desktop-only screen** (§7.6). |
| `/evidence` | Evidence index | Edition-level, 1,104 records. |
| `/evidence/:recordId` | Evidence record | `recordId` from §9.3. |
| `/methodology` | Methodology & data quality | Edition-level. |
| anything else | Not found | Distinguishes "route unknown" from "scope not in this edition". |

**Query params, valid on any scoped route:**
- `?working=<metricId>` — opens the Working drawer for that metric in the current
  scope. Shareable; on load with this param, the drawer opens after first paint
  (150 ms delay so the page settles first).
- Compare's `?scopes=` — comma-separated slugs.

State that lives in the URL and nowhere else: current scope, current tab, open
working drawer, compare selection. Reason: every view a CTO might quote must be a
link.

### 1.4 The contributor altitude — deliberately not published

`SOVIX-CONTEXT.md` names contributor as the fourth altitude; this edition's data
publishes 10 scopes and no contributor scopes, and the dataset's own
`data_quality.governance_note` explains why (per-person metrics change behaviour;
HR/legal sign-off required). Decision: **no contributor routes exist in this build.**
The scope template is written so a future `contributor:` scope key renders without
new screens. The governance note is surfaced verbatim on the Methodology screen so
the absence reads as a stance, not a gap.

### 1.5 Screen inventory: web vs mobile

| Screen | Web | Mobile (≤780px) |
|---|---|---|
| Overview (per scope) | ✅ | ✅ reflowed (§7) |
| Findings | ✅ | ✅ |
| Metrics index | ✅ table | ✅ family-grouped list (§7.4) |
| Metric detail | ✅ two-column | ✅ single column |
| Working drawer | ✅ right drawer | ✅ bottom sheet (§10.4) |
| Trends | ✅ | ✅ with chart substitutions (§7.5) |
| Repositories (scope table) | ✅ | ✅ as cards |
| Compare | ✅ | ❌ **deliberately absent** — three numeric columns at 390 px is below legibility, and each scope's overview already carries the same figures. Route renders an explanation card with links to the selected scopes. |
| Evidence index | ✅ | ✅ (search + chips + cards) |
| Evidence record | ✅ | ✅ |
| Methodology | ✅ | ✅ |
| Command palette | ✅ ⌘K | ✅ via search icon, full-screen |

### 1.6 Audience → entry mapping (informs defaults, not gates)

- **CTO/VP:** `/` (org overview) → Repositories → Compare. The hero finding and the
  scope table are theirs.
- **Engineering manager:** project/repo overview → Trends → Findings.
- **Project manager:** Findings → the working drawer's plain-English sections
  (`plain_english`, `how_to_read` lead the drawer; formula follows — §5.10).
- **Engineer:** Evidence index → record → every figure that counted it; metric detail
  for arithmetic checking.

---

## 2. Design language (inherited, then extended)

The Home.tsx screen is the constitution. Everything below either restates what it
already establishes or extends it in its idiom.

### 2.1 Type

- **Fraunces** (opsz axis, weights 500–700): display only — h1, h2, section h3,
  drawer titles, finding headlines, the evidence quote. Letter-spacing −0.03 to
  −0.05 em. Never for body or UI chrome.
- **DM Sans** (400–700): all body and UI copy.
- **DM Mono** (400–700): every numeral that is data, all kickers/eyebrows
  (uppercase, tracked +0.10 to +0.16 em), formula text, rule ids, table figures,
  kbd. If a number came from the dataset, it is DM Mono. Section labels stay tiny
  (8–9 px) — they are texture, not reading matter.
- Scale: h1 `clamp(30px, 3vw, 42px)`; h2 25–31 px; h3 20 px; body 13 px; small
  11–12 px; micro-labels 8–9 px (uppercase mono only, never sentences).

### 2.2 Accessibility correction to the reference (binding)

The reference uses grays like `#a2a8b6` on white for 9–11 px text (≈2.4:1 — fails
AA). Decision: three text tiers, enforced as tokens:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--text` | `#1b202c` | `#e8e9f0` | Headings, values |
| `--text-2` | `#50576b` | `#aab0c4` | Body, labels (≥4.5:1) |
| `--text-3` | `#5f6880` | `#8f96ac` | Captions, kickers, sublabels — **darkened from the reference** to pass 4.5:1 at small sizes |

Ultra-light grays (`#a2a8b6`-class) survive only as borders, rules and disabled
ornament — never as text. This shifts the reference's captions slightly darker;
accepted, because the alternative fails the stated quality bar.

### 2.3 Colour tokens

Semantic tokens replace the hardcoded hex in `index.css` (build chunk C0). Light
values are the reference's exact values; dark is designed, not inverted: same hue
map, backgrounds go deep ink-violet rather than black, chart hues lift ~12% in
lightness, shadows are replaced by 1px borders + subtle inner light.

| Token | Light | Dark |
|---|---|---|
| `--background` | `#f7f8fb` | `#14151d` |
| `--surface` (card) | `#ffffff` | `#1b1d28` |
| `--surface-2` (sidebar, inset) | `#f3f4f8` | `#171822` |
| `--surface-3` (inset chips, coverage card) | `#e9eaf1` | `#232534` |
| `--border` | `#e5e8ef` | `#2a2d3c` |
| `--accent` (violet) | `#8068dd` | `#9d8cf0` |
| `--accent-ink` (primary button) | `#4d4e72` | `#8d82d9` (text `#14151d`) |
| `--hero` (periwinkle finding hero) | `#6f6a9f` | `#4d4970` |
| `--chart-1..5` | `#8068dd #5285df #db8c51 #42a992 #cf6f97` | `#9d8cf0 #7ba3ef #e5a26f #5fc0a8 #de8fb2` |
| `--tier-measured` | `#3f8a72` on `#e9f4f0` | `#6fd0ae` on `#1d2f2a` |
| `--tier-proxy` | `#9a6f3f` on `#faf0e5` | `#e0b06f` on `#332a1e` |
| `--tier-inferred` | `#8d5c89` on `#f6ebf5` | `#d495cf` on `#312130` |
| `--sev-critical` | `#b16169` on `#faebed` | `#e59aa1` on `#331f22` |
| `--sev-warning` | `#a57951` on `#faf0e5` | `#e0b06f` on `#332a1e` |
| `--sev-info` | `#5b7ba6` on `#e9f0f8` | `#93b6e0` on `#1e2735` |

All pairs are chosen to pass 4.5:1 for their text sizes; C15 verifies with axe.
Light and dark are both first-class: the finding hero in dark keeps its radial
highlight but drops shadow blur to 0 (borders carry depth in dark).

### 2.4 Surfaces, radius, shadow

Radius 7–11 px as in the reference (cards 9, hero 11, chips 5–7). Light-mode
shadows exactly as reference (`0 5px 12px rgba(65,69,100,.025)` resting,
`0 10px 20px rgba(65,65,100,.08)` hover). Dark mode: no drop shadows on resting
cards; hover = border-color shift to `--accent` at 40% + `translateY(-2px)`.

---

## 3. App shell

### 3.1 Sidebar (≥781px)

Fixed 248 px, exactly as built: brand lockup; workspace/scope switcher; primary
nav; snapshot list; coverage card; user menu. Changes from the mock:

- **Primary nav** becomes real routes: Overview, Findings (count badge =
  `headlines.length` from data), Metrics, Trends, Repositories, Evidence,
  Methodology. Active state carries the 3 px left bar via framer `layoutId`
  (slides between items, 220 ms, ease-out-quint).
- **Scope switcher** (replaces the fake workspace toggle): a Radix Popover listing
  the scope tree from `navigation` — org row, then projects with their repos
  indented. Selecting navigates to the same tab in the new scope (if the tab
  doesn't exist there — e.g. Repositories at repo level — fall to Overview).
  Current scope shows a check. Keyboard: full arrow-key tree.
- **Snapshot list** renders real editions. This edition ships exactly one
  (`generated_at`). Show it as "14 Sep 2026 · Current edition ✓" plus a muted,
  non-interactive line: "Earlier editions appear here after your next run." Honest
  empty state; no fake history rows.
- **Coverage card** from data: `span_weeks` (54), repo count (6), and refreshed
  time = relative `generated_at`. Bar width = `repos_collected /
  (repos_collected + repos_failed)` (here 100%; the mock's 86% was decorative).

### 3.2 Top bar

Breadcrumb from route: `{org_label} › {scope label} › {tab}` — each ancestor is a
link. Right: search button (opens palette), theme toggle (sun/moon, next-themes,
`class` strategy), refresh icon (re-fetches `edition.json`; if `generated_at`
unchanged → toast "Edition 14 Sep 2026 is current — snapshots are immutable").
Avatar stays decorative.

### 3.3 Command palette (cmdk in Radix Dialog)

⌘K / Ctrl-K anywhere. Groups: **Metrics** (57 — label, id, family; fuzzy on all
three), **Scopes** (10), **Findings** (8), **Screens** (static). Selecting a metric
goes to metric detail in the *current* scope; ⌘-Enter opens its working drawer in
place instead. Empty query shows 5 recent selections (localStorage) then screens.
No results: "Nothing matches '<q>'. Try a metric id like process.review_coverage."

### 3.4 Mobile shell (≤780px)

Sidebar is **removed**, not hidden behind a hamburger. Replaced by (§10 has full
detail):
- **Top bar:** scope switcher (compact: scope label + chevron → full-screen sheet
  with the scope tree), search icon, theme toggle.
- **Bottom tab bar:** 5 items — Overview, Findings (badge), Metrics, Trends, More.
  "More" opens a sheet: Repositories, Evidence, Methodology, snapshot info,
  coverage card. 56 px tall + `env(safe-area-inset-bottom)`; icons + 9 px labels;
  active tab tinted `--accent` with a 3 px top indicator (layoutId slide).

Reason over hamburger: the four audiences' primary movements (glance → findings →
figure → working) must be one thumb-tap, not two.

---

## 4. Global states

### 4.1 Loading

Two-stage: `edition.json` (small, ~100 KB) gates the shell's data (nav counts,
snapshot, coverage); each scope file gates its screen. Skeletons mirror real
layout (never spinners for layout-level loads): hero block 242 px, 4 signal-card
rects, 6 table rows. Skeleton animation: opacity pulse 0.55→1→0.55, 1.4 s
ease-in-out infinite (reduced motion: static 0.7). Minimum skeleton display 0 ms —
if cached, render data immediately (no artificial delay). Spinner (`ui/spinner`)
only for sub-second inline actions (palette search, refresh button).

### 4.2 Error

- `edition.json` fails → full-page error card (shell chrome without data):
  Fraunces h2 "The edition didn't load.", the HTTP/parse reason in DM Mono, Retry
  button (re-fetch), and a note that no cached figures are shown — *we do not show
  possibly-stale numbers silently*.
- A scope file fails → shell + tabs stay; content area shows an inline error panel
  with Retry. Other scopes remain navigable.
- Unknown scope slug → Not-found variant: "This scope isn't in the 14 Sep 2026
  edition." with the scope tree listed as links.
- Malformed data (fails the build-time validator §9.4) can't ship; runtime trusts
  the files.

### 4.3 Empty

Every list's empty state is specified with its screen below. General rule: empty
states state *why* empty (data reason), in body type, never an illustration-only
shrug.

---

## 5. Screens

Layout figures assume desktop ≥1081 px; §7 and §10 give the reflows.

### 5.1 Overview (per scope) — `/`, `/project/:slug`, `/repo/:owner/:name`

**Purpose:** the height-appropriate read in under a minute, with the strongest
finding impossible to miss. **Primary audience:** CTO at org, EM at project/repo.

Top to bottom:

1. **Page heading.** Eyebrow: `Snapshot · 14 September 2026` with live dot. H1: at
   org, the greeting ("Good morning, Rowan." — time-of-day from client clock:
   morning <12h, afternoon <18h, evening otherwise); at project/repo, the scope
   label ("fastapi/fastapi."), violet full stop retained. Lede: one sentence; at
   repo scope it appends the project chip. Actions: "Export edition" (quiet;
   triggers `window.print()` of the current screen — v1 export is print) and
   "View the working" (primary; opens drawer on the hero finding's metric).
2. **Filter row.** Scope select (same popover as sidebar switcher — duplicated
   here because the page must be self-sufficient in a screenshot) and the edition
   note: `Immutable edition · 4,974 commits · 1,200 pull requests` from `facts`.
   The mock's period selector is **cut**: an edition has exactly one window;
   offering "Last 6 months" would imply recomputation the product refuses.
3. **Finding hero.** The highest-severity finding whose `scope_key` is this scope
   or inside its subtree, else — if none — the hero renders its **empty variant**:
   same periwinkle panel, h2 "No thresholds fired in this scope.", body naming the
   nearest-to-threshold rule (from `thresholds` vs metric values, computed at
   build), aside shows the scope's facts (commits, PRs, contributors). Populated
   variant exactly as built: label with rule id, Fraunces h2 = `title`, body =
   first sentence of `detail` with scope bolded, aside = `value_display` big stat
   + strongest exemplar stat + pager (`01 / 08` cycles through this scope's
   findings; ← → buttons and keyboard arrows when hero focused; crossfade 200 ms,
   no slide). CTAs: "Inspect the evidence" (drawer, that metric+scope) and "Open
   <scope>" (navigates).
4. **Signal cards** ("The readout"). Four `MetricCard`s. Fixed picks per scope
   level (chosen for audience value, all four carry monthly series so sparklines
   are real): org & project → `process.review_coverage`,
   `delivery.lead_time_p50`, `quality.rework_rate`, `ai.detected_commit_share`
   (floor-prefixed); repo → swap `ai.detected_commit_share` for
   `people.active_contributors` when the repo's AI share is NA/0-sample.
   **Delta chip decision:** this edition has no predecessor, so "vs last edition"
   deltas cannot exist. The chip shows last-month-vs-previous-month from the
   metric's own series, labelled `m/m`; metrics without a series show no chip.
   Colour: green/orange only when `direction` isn't `neutral` and the move is
   with/against it; neutral direction renders gray always. Copy never says
   better/worse — the chip is `+4.8 pts m/m`.
   Sparkline = the real monthly series (final geometry, wipe-reveal §8.5).
   "View all 57 metrics →" links to Metrics.
5. **Split section.** Left: **children table** — at org: 6 repos grouped under
   project subheads; at project: its repos; at repo scope this panel becomes
   **"Inside this repository"**: facts strip (commits, merged PRs, reviews,
   branches, contributors, span) + the repo's top 3 exemplars across all metrics
   by weight, each linking to its metric drawer. Children table columns §5.6.
   Right: **evidence panel** exactly as built (formula / sample / source records
   rows each opening the drawer on the hero metric at the matching section,
   plus the product-principle quote). This panel is the product's thesis; it
   appears at every scope.
6. **Footer** as built; "Read the methodology" → `/methodology`.

**Loading:** heading renders immediately (route-derived), hero + cards + table
skeletons. **Error:** §4.2 inline panel replacing 3–5. **Empty:** impossible below
the hero (57 metrics always exist); hero empty variant covered above.

### 5.2 Findings — `/findings` (scoped)

**Purpose:** every threshold that fired, with enough context to act. **Audience:**
PM first (they'll be asked "how do you know"), EM second.

Header: kicker "Rulebook rccef86aa" (from `ruleset_version`) + h1 "Findings" +
lede "8 rules crossed their declared thresholds in this edition. Thresholds are
data, not judgement — every one is inspectable." Severity filter chips (All ·
Critical 1 · Warning 5 · Info 2) — chips, not tabs, because counts matter more
than separation.

**Finding card** (full-width, stacked, critical first): left severity rail (3 px,
sev colour); severity chip + scope link chip; Fraunces h3 `title`; DM Mono rule
line ``process.review_coverage < 50 · fired at 7.8%``; body `detail`; **action
box** — tinted `--surface-3` inset titled "What to do" containing `action` (the
one place the product prescribes, because the data does); footer buttons:
"Inspect the evidence" (drawer for `metric_id` @ `scope_key`) and "Open scope".
Cards collapse below the fold? No — 8 cards is one page; no pagination, no
accordion. Reason: findings are the product's alarm surface; hiding any behind a
click undercuts it.

**Scoped behaviour:** at project/repo scope, show only findings in the subtree,
with a muted line "6 more findings in other scopes → All repositories".
**Empty:** "No rules fired in this scope. The rulebook still ran — see every
threshold in Methodology." **Loading:** 3 card skeletons. **Error:** §4.2.

### 5.3 Metrics index — `/metrics` (scoped)

**Purpose:** all 57, scannable, grouped by family; the engineer's and EM's map.

Header: h1 "All 57 metrics", lede with tier legend chips (Measured 33 · Proxy 17 ·
Inferred 7 — counts computed from data). Controls: family jump-nav (8 pills,
sticky under top bar on scroll, active pill tracks scroll position), tier filter
(multi-select chips), search input (filters by label/id, instant).

Body: 8 family sections. Each: family label (Fraunces h3) + `glossary.families`
blurb + **metric table** (shadcn `table`):

| Column | Content |
|---|---|
| Metric | label (body) + id (DM Mono 9px, `--text-3`) |
| Value | `display`, DM Mono; `FloorFigure` where applicable; `NotAvailable` chip when null |
| Trend | 64×24 sparkline if the metric has a series; else the coverage bar (§6.7) at 64px — decision: never an empty cell, coverage is always meaningful |
| Tier | `TierBadge` (tier + confidence) |
| Sample | `n of population unit` DM Mono (e.g. `639 of 1,200 PRs`) |

Row is a button → metric detail. Secondary affordance on the Value cell: an
always-visible (not hover-only) miniature "working" glyph (⌗, 14 px) that opens
the drawer without leaving the page — Enter follows the row, ⌗ has its own tab
stop. Rows 48 px.

**Empty:** filter/search yielding nothing → inline "Nothing matches — clear
filters" with a clear button. Families are never empty unfiltered.
**Loading:** two family sections of 4 skeleton rows. **Error:** §4.2.

### 5.4 Metric detail — `/metrics/:metricId` (scoped)

**Purpose:** one figure, fully unpacked; the page the drawer expands into; the
engineer's audit bench and the PM's script.

Header block: breadcrumb tab context; family kicker; h1 = metric label
(Fraunces); the value huge (DM Mono 44 px, floor prefix if applicable, or
`NotAvailable` treatment §6.4); `TierBadge`; direction note when not neutral
(DM Mono micro: "lower is the direction this scope aims" — no, plainer:
`direction: lower_is_better` renders as caption "Read low." / "Read high." —
**decision:** render nothing for direction; `how_to_read` prose already carries
it with nuance and a bare arrow invites ranking-think. Direction is used only
for delta chip colour).

Two columns ≥1081 px (7:5):

**Left — the reading:**
- "In plain English" — `plain_english` (body 15 px, this is the PM's answer).
- "Why it matters" — `why_it_matters`.
- "How to read it" — `how_to_read` in the tinted quote treatment.
- **Monthly series chart** (if one of the 9): §6.8 MonthlySeries, 260 px tall,
  with caption from `series.note` plus the standing caption "First and last
  months may be partial. Missing months are gaps, not zeroes."
- Cross-scope strip: the same metric's `display` at each sibling scope (small
  cards: scope label + value + tier dot), linking to that scope's metric detail.
  This is scope comparison, which is allowed; it is never people.

**Right — the working (sticky at ≥1081):** the five numbered sections exactly as
the drawer (§5.10) renders them, permanently expanded: 01 Formula · 02 Sample &
exclusions · 03 Assumptions & caveats · 04 Exemplars · 05 Source records.

**Findings touching this metric:** if any headline references it, an inline
finding card (compact) sits above the columns.

**Loading:** header + two-column skeleton. **Error:** §4.2. **Unknown metricId:**
not-found variant listing the family's metric ids. **NA metric:** left column
renders in full (the prose exists and matters — it explains what *would* be
measured); right column's formula section shows the zero-input formula from data,
sample section shows `0 of 0 days of recorded telemetry`, and an explanation
panel renders the relevant caveat (e.g. telemetry export not connected). This
page is the proof that absence is a stance, not a bug.

### 5.5 Trends — `/trends` (scoped)

**Purpose:** movement over the 54-week window; the EM's screen.

1. **Nine monthly series**, 2-up grid (§6.8 charts, 220 px). Each card: metric
   label, latest month value (DM Mono), the chart, ⌗ working affordance.
2. **Working-hours heatmap** (§6.9): full-width card, 7 rows × 24 columns, with
   the dataset's own `heatmap.note` as caption (author-local time caveat) and
   total commits. No judgement copy — after-hours framing belongs to the two
   `temporal.*` metrics, which are linked beneath it.
3. **Before / after** ("What changed at the median commit date"): intro card
   quoting `comparison.split_reason` verbatim + the split date; then the 14-row
   table: Metric · Before (with `before_label`) · After · Change (`change_pct`
   or `change_points`, signed, DM Mono; colour only via direction rule §5.1.4) ·
   Confidence chip. Footer caption: "Two things moving together are reported as
   two things moving together." — the no-causality rule, stated where it is most
   tempting to break.

**Loading:** 4 chart-card skeletons + table skeleton. **Error:** §4.2.
**Empty:** series with <2 points render the chart frame with "Only one month of
records in this scope" (occurs at no current scope, but repos with 12 vs 13
months differ — the axis always spans the scope's own `since`→`until`).

### 5.6 Repositories (scope table) — `/repositories` (org, project)

**Purpose:** the CTO's twenty-at-once scan. Compares *scopes*, never people.

Header: h1 "Repositories", lede with counts; "Compare scopes →" button (opens
Compare pre-seeded with the first two repos; hidden ≤780).

Table (org: project-grouped subheads; project: flat):

| Column | Source |
|---|---|
| Repository | avatar (deterministic colour hash of name → the 6 reference colours), name, project sublabel |
| Review coverage | `CoverageBarCell`: mini bar + `display` |
| Lead time p50 | `display` |
| Contributors | `people.active_contributors` display |
| Open PRs | `facts.open_pull_requests` |
| Status | `StatusPill` — **derived, not stored**: `critical` if any critical finding targets the scope; `watch` if any warning; `healthy` otherwise (info alone stays healthy). The pill restates the rulebook; tooltip-and-inline (tap/click expands a one-line footnote naming the finding — not hover-only). |

Row → repo overview. Sortable by the metric columns (aria-sort, tri-state); the
default order is `navigation` order, and a "reset order" affordance appears once
sorted. Sorting scopes is fine; there is no contributor column to sort.

**Empty:** a project with no repos cannot occur in this data; guard renders
"No repositories in this project's collection." **Loading:** 6 row skeletons.

### 5.7 Compare — `/compare?scopes=a,b,c` (desktop only)

**Purpose:** side-by-side scope columns for a decision meeting.

Scope pickers: 2–3 slots (add/remove; popover tree per slot; duplicates
prevented). Body: the metrics-index table structure with one Value column per
scope, family-sectioned, metric label column sticky-left. Each value cell: 
`display` + tier dot + ⌗ (drawer opens scoped to that column's scope). Rows where
all selected scopes are NA collapse under a "Not available in these scopes (n)"
disclosure per family. A "largest gaps" strip on top: the 5 metrics with the
widest relative spread between selected scopes (computed client-side from
values, shown as label + the two extreme displays — no invented units).

**Empty:** <2 scopes selected → instruction card. **Mobile (≤780):** explanation
card (§1.5). **Loading/error:** as usual per scope file; a failed scope column
shows an inline column error with retry, other columns render.

### 5.8 Evidence index — `/evidence` (edition-level)

**Purpose:** the 1,104 cited records; the engineer's ground truth. "Each record
knows every figure it was counted in."

Header: h1 "Evidence index", lede: `1,104 records cited across this edition ·
388 commits · 287 pull requests · 245 files · 102 releases · 72 branches · 10
datasets` (counts from build §9.3). Controls: search (ref, title, repo), kind
chips, repo select.

List (virtualized ≥50 rows, `@tanstack/react-virtual` — the one allowed new dep;
reason: 1,104 DOM rows × card markup jank on mobile): each row = kind icon,
`repo ref` in DM Mono bold, `detail` sentence, `occurred_at` (relative + title
absolute), citation count chip ("counted in 4 figures"). Row → record screen.

**Empty:** filters yield nothing → "No records match." + clear. **Loading:**
list-row skeletons ×10 (evidence/index.json is a separate ~500 KB fetch, only on
first entry to this route). **Error:** inline retry panel.

### 5.9 Evidence record — `/evidence/:recordId`

**Purpose:** one commit/PR/file/release/branch, and everything it proves.

Card 1 — the record: kind chip, `repo ref`, title (from `values.title` when
present), the `values` object rendered as a definition list (author, opened,
merged, lines, reviews — whatever keys exist; unknown keys render as-is,
snake_case → spaced), `detail` sentence, and the **GitHub link** as a primary
"Open on GitHub ↗" button (every source record links out — that's the product's
spine). Author names appear here as facts of the record; they are never links to
anything (no contributor pages — §1.4).

Card 2 — "Counted in": one row per citation (from the reverse index): metric
label, scope label, that scope's `display` for the metric, ⌗ opens the drawer
scoped accordingly. This list is the reverse-evidence promise made real.

**Loading:** two card skeletons. **Unknown id:** not-found variant with search
link. **Error:** retry panel.

### 5.10 The Working drawer (cross-screen; the product's core component)

Opens over any scoped screen via `?working=<metricId>`. Desktop: right drawer
`min(470px, 100%)`, backdrop `rgba(34,35,52,.27)` + 2px blur, spring entrance
(§8.4). Mobile: bottom sheet (§10.4). Radix Dialog underneath (focus trap, Esc,
scroll lock, `aria-labelledby` the metric label).

Structure (order is an audience decision: plain English before formula, because
the PM outnumbers the engineer at this surface; the engineer's sections follow
immediately):

1. **Header:** kicker "The working" + live dot; Fraunces h2 = label; close.
2. **Value row:** `display` 35 px DM Mono (floor prefix per §6.3) + `TierBadge`.
   NA metrics: `NotAvailable` treatment + reason line.
3. **Plain English** — `plain_english` (unnumbered, body).
4. **01 Formula** — `FormulaBlock`: `formula` string verbatim from data in the
   tinted box (code line = the formula with substituted values; the data's
   formula strings already contain real numbers — render them untouched; the
   client never re-derives arithmetic).
5. **02 Sample & exclusions** — `SampleBreakdown` (§6.6): three stat tiles
   (eligible n / population / excluded total), the coverage bar, then one
   `ExclusionLine` per `sample.excluded` entry (reason + count). The lines plus
   n visually sum to population — the build validator guarantees the arithmetic.
6. **03 Assumptions & caveats** — each `assumptions[]` entry as a caveat box
   with help icon; `caveats[]` beneath in the same treatment with an "i" icon.
7. **04 Exemplars** — up to 5 `ExemplarCard`s (§6.10), rank-ordered, first
   expanded, rest collapsed to headline (tap to expand, §8.7).
8. **05 Source records** — first 6 `SourceRecordRow`s (GitHub-linked), then
   "All {n} source records →" → Evidence index pre-filtered to this metric's
   citations. `no_sources_reason`, when present and sources empty, renders as a
   caveat box — absence explained, per the rule.
9. **Footer:** "Close working" (quiet) + "Open full page ↗" (primary → metric
   detail, drawer closes, route changes — the drawer-to-page promotion).

Drawer state survives scope: it is bound to the URL's scope + metricId; changing
scope in the switcher while open closes it (different sample = different
working; silently swapping evidence under the reader is forbidden).

**Loading** (scope file not yet cached when deep-linked): drawer skeleton with
value row + 3 section rects. **Error:** inline retry within drawer.

### 5.11 Methodology — `/methodology` (edition-level)

**Purpose:** the trust document. PM's "how do you know" answer, sales-demo
closer. All content verbatim from data; this screen invents nothing.

Sections (single column, 720 px measure, Fraunces h2s):
1. **How this edition was made** — `collection`: duration, repos collected/
   failed, API call counts, `llm_calls: 0` rendered as its own highlighted stat
   with the standing line "No language model touches a calculation." ·
   identity resolution stats (people, bots excluded, merges, with
   `merge_examples` in a disclosure).
2. **Tiers and confidence** — `data_quality.tier_legend` + `confidence_legend`
   rendered as the definitive chip legend (the same chips used product-wide).
3. **Structural limits** — the 5 `structural_limits` as cards (title + detail).
   These are the floor/backfill/LOC honesty statements — display prominently.
4. **What was excluded** — edition-level `exclusions`: by-reason table (reason,
   files, lines) + `top_paths` (path + lines, DM Mono) + total. Caption: "Every
   exclusion adds up; there is never an unexplained gap."
5. **The rulebook** — `thresholds` as a definition table (12 rows: threshold
   name in DM Mono, value, one-line gloss hardcoded in copy.ts) + ruleset id.
6. **Governance** — `governance_note` verbatim in the quote treatment + the §1.4
   stance ("This edition publishes no per-person figures.").
7. **Coverage notes** — `data_quality.coverage`: truncation list
   (`pull_requests_truncated_in`) etc., as caveat boxes.

Static content, loads with edition.json. **Error:** §4.2 full-page only.

### 5.12 Not found

Fraunces h1 "This page isn't in the edition." Variants per §4.2. Links: org
overview + palette hint. No motion beyond page entrance.

---

## 6. Component inventory

Legend: **[shadcn]** existing `ui/*` used as-is or styled · **[compose]** built
from shadcn parts · **[build]** built from scratch · 🛡 carries an integrity rule
(gets unit tests in its build chunk; §12).

### 6.1 Shell
- `AppShell` [build] — sidebar/topbar/content grid; mobile swap at 780.
- `Sidebar`, `TopBar`, `BottomTabBar` [build].
- `ScopeSwitcher` [compose: Popover + custom tree] — props `{ value: ScopeKey,
  onNavigate }`; renders `navigation`; mobile variant full-screen Sheet.
- `CommandPalette` [compose: command.tsx + Dialog].
- `ThemeToggle` [compose] — next-themes, class strategy, `.dark` on `<html>`.
- `Breadcrumbs` [compose: breadcrumb.tsx].

### 6.2 🛡 `TierBadge` [build]
`{ tier: 'measured'|'proxy'|'inferred', confidence: 'high'|'medium'|'low',
boxed?: boolean }`. Dot + uppercase tier + `· confidence`. Colours §2.3. It is
text + colour, never colour alone. Appears on **every** figure rendering except
micro-contexts (sparkline cards may shorten to dot + tier only, but the
confidence must appear in that figure's drawer). Tooltip (and tap) reveals the
legend sentence from `tier_legend` — same content also lives on Methodology, so
nothing is hover-only.

### 6.3 🛡 `FloorFigure` [build]
`{ display: string, metricId: string }`. Renders `≥ {display}` when `metricId ∈
FLOOR_METRIC_IDS` (`ai.detected_commit_share`, `ai.detected_line_share`,
`ai.adopter_share` — the shares understated by suppressible traces; deltas and
tool_concentration are within-trace figures and excluded). The `≥` is part of
the figure (same font/size, `--text-2`), not decoration, and must survive
copy-paste and print. Every figure rendering routes through `FloorFigure` (it
passes non-floor ids through unchanged) so the rule cannot be forgotten at a
call site.

### 6.4 🛡 `NotAvailable` [build]
`{ metric: Metric, size: 'chip'|'stat' }`. Renders "Not available" in DM Sans
italic `--text-3` with a small slash-circle icon — visually distinct from any
number, unmistakably not zero. `stat` size adds the reason line: derived as the
first caveat mentioning availability, else the sample unit sentence ("0 of 0
days of recorded telemetry"). Never renders `0`, `—`, or an empty cell; charts
must omit (not zero) these points.

### 6.5 🛡 `copy.ts` + banned-words test [build]
All rendered static strings live in `client/src/copy.ts`. A vitest test walks
every exported string for the banned list in measurement contexts: `better`,
`worse`, `improved`, `caused`, `because of`, `top performer`, `leaderboard`,
`score`, `grade`. (Data-provided prose is the dataset's responsibility; the test
covers what *we* write.)

### 6.6 🛡 `SampleBreakdown` [build]
`{ sample: Sample }`. Stat tiles + coverage bar + exclusion lines. Bar: included
segment `--tier-measured` fill, excluded remainder `--surface-3`; width =
`coverage_pct`. Lines: legend dot, reason (full text, wraps — reasons are
sentences and truncating them destroys the point), count DM Mono. Dev-mode
assertion `n + Σexcluded === population` (build validator enforces in prod).

### 6.7 `CoverageBarCell` [build] — mini progress + display, used in tables.

### 6.8 🛡 `MonthlySeries` [build on recharts]
`{ series: Series, height?: number, accent?: string }`. LineChart + faint area
(8% opacity). **Data honesty:** x-domain spans scope `since`→`until` by month;
months absent from `points` map to `null`; `connectNulls={false}` — gaps stay
gaps, with a dotted vertical hairline marking each gap month (so a gap reads as
"no records", not "chart glitch"; caption reinforces). Y domain: nice-rounded
from data, **never forced to zero-based** when the series' min ≫ 0? — decision:
y starts at 0 for counts/lines/percent (magnitude matters), but starts at data
min for hour/duration metrics where zero is not a meaningful anchor; the axis is
always labelled either way. Interaction: hovering **or** tapping **or** ←/→ with
chart focused selects a month; the readout (month, value, `detail` fields like
contributors) renders in a fixed strip under the chart — persistent, not a
hover tooltip. Entrance: §8.5 wipe — geometry always final.

### 6.9 `WorkHeatmap` [build]
`{ heatmap: Heatmap }`. CSS grid 24×7, cells rounded 3px, colour = 5-step
violet scale by value/max (steps, not continuous, for legibility), 0 renders
`--surface-3` (a true zero of commits *is* an observed zero here — the grid is
counts over the whole window, absence of commits at 3am is a real measurement).
Legend row with the 5 steps + min/max values. Cell focus/tap → readout strip
("Tuesdays 14:00–15:00 · 62 commits"). Keyboard: arrow-key grid navigation.
Reflow §7.5.

### 6.10 `ExemplarCard` [build]
`{ exemplar: Exemplar, defaultOpen?: boolean }`. Amber-tinted card as built:
repo+ref line with external link, headline (h4), `why_this_proves_it` prose,
meta row (`weight` + `weight_unit`, `share_of_total_pct` when non-null). Rank
badge "Strongest" for rank 1, else `#rank`. Collapsible (§8.7).

### 6.11 `SourceRecordRow` [build] — icon by `kind`, ref, detail, external link;
`{ source: SourceRecord, onOpenRecord }` — click body → evidence record screen,
click ↗ → GitHub (separate tab stops).

### 6.12 `MetricCard` (signal card) [build] — as Home.tsx, fed by `Metric` +
optional series; delta rule §5.1.4; whole card is a link to metric detail, the
⌗ corner affordance opens the drawer (two tab stops).

### 6.13 `FindingCard` [build] `{ headline: Headline, compact?: boolean }`.
### 6.14 `FindingHero` [build] — populated + empty variants (§5.1.3).
### 6.15 `StatusPill` 🛡 [build] — derived per §5.6; never accepts a free-form
status prop; its input is `Headline[]` for the scope, computing severity itself
so no call site can invent a judgement.
### 6.16 `ScopeTable` / `MetricTable` [compose: table.tsx] — column defs per
screen; sorting tri-state with aria-sort.
### 6.17 `WorkingDrawer` 🛡 [compose: Dialog + build] — §5.10; owns the
`?working=` URL contract.
### 6.18 `BeforeAfterTable` [compose] — §5.5.3; renders `split_reason` verbatim.
### 6.19 `EmptyState`, `ErrorPanel`, `Skeleton*` set [compose: skeleton.tsx].
### 6.20 `PullToRefresh` [build] — §10.5. `Toaster` [shadcn sonner] for refresh
result.

Anything else (chips, kickers, stat tiles) is Tailwind classes on the token
set — do not componentize below the level of reuse.

---

## 7. Responsive behaviour

### 7.1 Breakpoints (as already established by the reference CSS, kept)

| Name | Range | Shell |
|---|---|---|
| Wide | ≥1441 | content max 1390, centered |
| Desktop | 1081–1440 | as built |
| Compact | 781–1080 | paddings 30px; metric grid 2-up; hero 1.4fr/1fr |
| Mobile | 511–780 | **sidebar removed → bottom tabs (§3.4)**; single column |
| Small | ≤510 | 390px is the design target; 320px must not overflow |

No horizontal page scroll at any width — the only permitted inner x-scroll is
none: every wide element has a stated reflow below.

### 7.2 Shell reflow
- 781–1080: sidebar persists (it is 248px; content min 533px holds).
- ≤780: bottom tab bar + compact top bar (§3.4). Coverage card and snapshot info
  move into the "More" sheet.

### 7.3 Finding hero
- ≤1080: 1.4fr/1fr. ≤780: stacked; aside becomes the 2-stat grid (as reference).
- ≤510: paddings 23px; h2 25px; pager buttons grow to 44px targets.

### 7.4 Tables at 390px — the real answers
- **Metrics index (57 rows × 5 cols):** ≤780 drop Trend and Sample columns
  (both remain in the drawer/detail one tap away); ≤510 the table becomes a
  **two-line list row**: line 1 = label (truncating) + value right-aligned
  (DM Mono, floor prefix kept); line 2 = tier dot+word, confidence, coverage %
  (`53% of PRs`). Row height 56px, full-bleed dividers, family sections become
  sticky-header groups with the jump-nav converted to a horizontal chip strip
  pinned under the top bar. Search and tier filters persist. Nothing scrolls
  sideways; nothing is lost — dropped columns exist in metric detail.
- **Repositories:** ≤780 keep Repository · Review · Status; ≤510 **cards**: repo
  avatar+name header, status pill right; body = review coverage full-width bar
  with value, then a 2-col DM Mono fact row (lead time, contributors, open PRs).
  Card tap → repo overview.
- **Before/after (14 rows):** ≤510 per-metric cards: label; `before → after` on
  one DM Mono line; change chip + confidence chip on the second.
- **Evidence index:** already list-shaped; at ≤510 the meta collapses to
  `repo ref · relative time`, citation chip stays.
- **Compare:** absent ≤780 (§1.5).

### 7.5 Charts at each width — reflow or replacement
- **Sparklines (signal cards, metric rows):** keep at all widths (they are
  resolution-independent); minimum drawn width 56px, else drop the sparkline
  entirely (never squash below legibility) — occurs only in the 320px guard.
- **MonthlySeries:** ≥781 two-up grid, 220px tall; ≤780 one-up full-width,
  180px; x ticks thin to every 3rd month ≤510 (all months remain tappable /
  arrow-navigable via the selection strip — ticks are labels, not data).
  Tooltip is already a persistent readout strip (§6.8) so touch loses nothing.
- **WorkHeatmap:** ≥781 full 24×7 grid. ≤780 the 24 columns become **12
  two-hour columns** (cells sum adjacent hours — an honest aggregation of
  counts; caption changes to "two-hour bands"). ≤430 it becomes **6 four-hour
  bands**. The full-resolution grid is reachable on mobile via the readout
  strip's band tap → expands that band's hours as a 7-row detail beneath.
  Reason over rotation/scroll: a scrolling heatmap hides half the picture; a
  summed band is still a true count.
- **Coverage bars:** full-width at all sizes; value text never inside the bar.
- **Cross-scope strip (metric detail):** horizontal card row ≥781; ≤780 becomes
  a vertical list (scope label left, value right per row).
- **Comparison "largest gaps" strip:** wraps to column ≤780.

### 7.6 Density and touch
≤780: all interactive targets ≥44×44 (rows ≥48px); table row secondary
affordances (⌗) get 44px hit areas via padding; hover styles are joined by
`:active` states so touch gets feedback (§8.6).

---

## 8. Motion

Framer Motion throughout; a single `motion.ts` exports the tokens. Every
duration/easing below is normative.

### 8.1 Tokens
```
duration.fast = 0.12s      // press, colour shifts
duration.base = 0.18s      // hovers, chips, backdrop
duration.enter = 0.24s     // element entrances
duration.slow = 0.32s      // section reveals, sheet snap
duration.chart = 0.48s     // chart wipe
ease.out    = [0.23, 1, 0.32, 1]    // quint-out — the house curve (from the reference drawer)
ease.inOut  = [0.45, 0, 0.2, 1]
spring.drawer = { type:'spring', stiffness: 380, damping: 34, mass: 0.9 }
spring.sheet  = { type:'spring', stiffness: 320, damping: 32 }
stagger.section = 0.06s, stagger.card = 0.04s, stagger.row = 0.03s (cap: first 8 items, remainder share the 8th delay)
```

### 8.2 Page entrance (first load of a route)
Heading: opacity 0→1 + y 8→0, `enter`, `ease.out`. Then sections as a stagger
container (`stagger.section`): each section opacity 0→1 + y 12→0, `slow`.
Within the signal-card grid, cards stagger `stagger.card`. Total choreography
must complete ≤ 600ms.

### 8.3 Route transitions
`AnimatePresence mode="popLayout"` on the content area only (shell never
animates). Exit: opacity→0, `fast`. Enter: opacity 0→1 + y 6→0, 0.2s, `ease.out`,
delay 0.04s. Scope changes within the same tab use the same transition. Reason
for crossfade over slide: slides imply spatial hierarchy the five flat tabs
don't have.

### 8.4 Working drawer / sheet
Desktop: x 24→0 + opacity 0.7→1 with `spring.drawer`; backdrop opacity `base`.
Exit: x→16 + opacity→0, 0.16s (exits are always faster than entrances). Mobile
sheet: y 100%→snap with `spring.sheet`; §10.4. Drawer sections do **not**
stagger (the reader came for content, not theatre) — single fade 0.2s.

### 8.5 Chart reveal — the fixed rule, operationalised
Charts render with **final geometry immediately**; reveal is purely
presentational:
- Line/area (MonthlySeries, sparklines): `clip-path: inset(0 100% 0 0)` →
  `inset(0 0 0 0)`, `duration.chart`, `ease.out`, triggered `whileInView`
  (once, `margin: -10%`). A wipe uncovers a truth that already exists; it never
  draws values that were never observed.
- Bars (coverage, before/after change bars if any): opacity 0→1 at full height,
  `enter`, staggered `stagger.row` left→right. **Never height/width from 0.**
- Heatmap: cells opacity 0→1, column-sweep stagger 8ms, total ≤ 400ms.
- **No count-up number tickers anywhere** — animating 0→68.5% displays ~sixty
  false values on the way; figures appear at their true value (fade only).

### 8.6 Micro-interactions
- Card hover: translateY(−2px) + border→accent + shadow step, `base`. Press
  (and touch `:active`): scale 0.985, `fast`.
- Nav/tab active indicator: `layoutId` slide, 0.22s, `ease.out`.
- Buttons: as reference (transform+colour `base`); focus ring: instant, no
  transition ever.
- Chips/filters: background `base`; selected chip gets a 0.18s tick draw
  (opacity, not path-draw).
- Toast: y 16→0 + opacity, `enter`.

### 8.7 Disclosures (accordion, exemplar cards, exclusion groups)
Height auto-animate 0.26s `ease.out` + content opacity 0→1 0.14s delayed 0.08s.
Chevron rotate 0.2s. Collapse: 0.2s, content fades first.

### 8.8 Scroll reveals
Sections below the fold: `whileInView` once, y 12→0 + opacity, `slow`,
viewport margin −10%. Applied to section blocks only — never to individual
table rows (row-level scroll animation reads as jank at 57 rows).

### 8.9 Pull-to-refresh (≤780, touch only) — §10.5 for mechanics; motion:
indicator is the brand mark's three bars filling bottom-up proportional to
drag (0→64px threshold); past threshold the mark rotates −5°→0° and the label
flips to "Release to check for a newer edition". Release: spinner 0.6s min;
spring-back `spring.sheet`.

### 8.10 `prefers-reduced-motion`
`MotionConfig reducedMotion="user"` at the app root, plus explicit collapses:
every transform-based animation above becomes opacity-only at 0.16s; chart wipe
→ plain fade; layoutId indicators jump-cut; pull-to-refresh gesture is disabled
and a refresh button appears in the top bar instead; skeleton pulse freezes at
0.7 opacity. The reference CSS's global `@media (prefers-reduced-motion)`
clamp stays as the backstop for CSS transitions.

---

## 9. Data layer

### 9.1 Source and pipeline
`cohort.json` (4.0 MB) is checked in at `app/data/cohort.json`. A build script
`scripts/build-data.mts` (run via `predev` and `prebuild`) validates, derives,
splits and emits static JSON into `client/public/data/`. Decision: **static
files fetched at runtime, split per scope** — not a bundle import (4 MB in the
JS bundle punishes first paint; per-scope files mean the org reader never pays
for helm's sources) and not a server (the product is an immutable artifact;
static hosting is the deployment story).

Emitted files:
```
data/edition.json          (~120 KB)  shell + summaries; gates first paint
data/scopes/<slug>.json    (×10, ~250–450 KB)  full ScopeReport
data/evidence.json         (~500 KB)  1,104 records + reverse citations; lazy
```

`edition.json` contains: `schema_version`, `generated_at`, `org_label`,
`navigation` (+ computed slugs), `headlines`, `glossary`, `thresholds`,
`collection`, `data_quality`, `exclusions`, and `scopeSummaries` — per scope:
`facts` + 57 `MetricSummary` (id, label, family, unit, display, value, tier,
confidence, direction, coverage_pct, hasSeries, isNA). Summaries power every
table/card; full metrics (formula, sample, exemplars, sources, series, heatmap,
comparison) come from the scope file.

### 9.2 Derivations (build time — the client computes no figures)
- Scope slugs (§1.2) and the slug↔key maps.
- Evidence reverse index: for every distinct `(kind, repo, ref)` — id (§9.3),
  merged `values`, `occurred_at`, and `citedIn: {scopeKey, metricId}[]`.
- Status severity per scope from headlines (§5.6 rule).
- Hero "nearest-to-threshold" fallback data (§5.1.3).
- Compare "largest gaps" needs live selection → computed client-side from
  summaries (display-only comparison; no new figures invented — it selects,
  it does not calculate).
- Sparkline point arrays (from series values, last 12 points).
- m/m delta per series-carrying metric: last two points' delta formatted per
  unit (pts for percent, unit otherwise) — this is the *only* client-visible
  number not in the dataset, and it is a restatement of two published points;
  it renders with the `m/m` label always.

### 9.3 Evidence record ids
`e-` + first 10 hex chars of SHA-1 of `kind|repo|ref`. Stable across builds,
short enough for URLs, collision-checked by the validator (fails the build on
clash).

### 9.4 Build-time validator (release gate)
Fails the build if: any metric's `n + Σexcluded ≠ population`; any `value:
null` lacking both a caveat and a zero-sample; any series point with a month
outside scope window; any headline referencing an unknown metric/scope; any
floor-metric absent from `FLOOR_METRIC_IDS` map (list is asserted against the
dataset's ai family); evidence id collision; slug collision. This is where
"a number whose evidence cannot be produced does not get published" is
enforced mechanically.

### 9.5 TypeScript domain types (`client/src/data/types.ts`)
Faithful to schema 1.0; abridged here to the load-bearing shapes — the
implementation writes them in full:

```ts
type Tier = 'measured' | 'proxy' | 'inferred';
type Confidence = 'high' | 'medium' | 'low';
type Direction = 'lower_is_better' | 'higher_is_better' | 'neutral';
type Severity = 'critical' | 'warning' | 'info';
type ScopeLevel = 'org' | 'project' | 'repo';   // 'contributor' reserved, unpublished
type ScopeKey = string;                          // "org:all" | "project:…" | "repo:owner/name"

interface ScopeRef { level: ScopeLevel; key: ScopeKey; label: string;
  since: string; until: string; repos: string[]; }

interface Sample { n: number; population: number; unit: string;
  coverage_pct: number; excluded: Record<string, number>; }

interface SourceRecord { kind: 'commit'|'pull_request'|'file'|'release'|'branch'|'dataset';
  ref: string; detail: string; repo: string; url: string;
  values: Record<string, string | number>; occurred_at: string | null; }

interface Exemplar { rank: number; headline: string; why_this_proves_it: string;
  weight: number; weight_unit: string; share_of_total_pct: number | null;
  source: SourceRecord; }

interface Metric {
  id: string; label: string; value: number | null; display: string; unit: string;
  scope: ScopeRef; formula: string; inputs: Record<string, number | string>;
  sample: Sample; plain_english: string; why_it_matters: string; how_to_read: string;
  family: string; tier: Tier; confidence: Confidence; direction: Direction;
  assumptions: string[]; caveats: string[]; sources: SourceRecord[];
  exemplars: Exemplar[]; no_sources_reason: string | null; }

interface SeriesPoint { month: string; value: number;
  detail: Record<string, number>; }
interface Series { id: string; label: string; unit: string; metric_id: string;
  note: string; points: SeriesPoint[]; }

interface Heatmap { grid: number[][] /* 7×24 */; total: number;
  weekdays: string[]; note: string; }

interface ComparisonRow { metric_id: string; label: string; direction: Direction;
  unit: string; before: number; before_display: string; after: number;
  after_display: string; change_pct: number | null;
  change_points: number | null; confidence: Confidence; }
interface Comparison { split_at: string; split_reason: string;
  before_label: string; after_label: string; before_commits: number;
  after_commits: number; rows: ComparisonRow[]; }

interface ScopeReport { scope: ScopeRef; facts: ScopeFacts; metrics: Metric[];
  series: Series[]; heatmap: Heatmap; comparison: Comparison;
  children: ScopeKey[]; }

interface Headline { severity: Severity; title: string; detail: string;
  action: string; metric_id: string; scope_key: ScopeKey; value_display: string;
  rule_comparison: string; rule_threshold: number; ruleset_version: string; }

interface EvidenceRecord { id: string; kind: SourceRecord['kind']; repo: string;
  ref: string; detail: string; values: Record<string, string | number>;
  occurred_at: string | null; url: string;
  citedIn: { scopeKey: ScopeKey; metricId: string }[]; }
```
Plus `Edition`, `MetricSummary`, `Glossary`, `Collection`, `DataQuality`,
`Exclusions`, `Thresholds` mirroring the file.

### 9.6 Loading in the client
`client/src/data/edition.ts`: plain fetch + module-level cache (Map keyed by
path), no new dependencies. Hooks:
```ts
useEdition(): { status: 'loading'|'error'|'ready', data?: Edition, error?, retry() }
useScope(slug): same, resolving slug→file, cached
useEvidence(): same, lazy on first Evidence route
```
Reads are idempotent and cacheable forever (the edition is immutable —
`Cache-Control: immutable` friendly). Refresh (§3.2) re-fetches `edition.json`
with `cache: 'reload'` and compares `generated_at`.

### 9.7 Propagation
Scope and drawer state live in the URL (§1.3); components derive everything
from route params through the hooks. A scope change is a navigation: content
transition (§8.3), scope file fetch (cache-hit after first visit), drawer
closes (§5.10). A future snapshot change would swap the data root path — the
hooks take the edition base path from one constant, so the mechanism is one
line, but no snapshot switcher UI ships with a single edition.

### 9.8 Displays are law
The client renders `display` strings verbatim (plus `≥` per §6.3) and never
reformats `value`. The only client-formatted figures: month labels, relative
times, the m/m delta (§9.2), and count summaries explicitly listed there.

---

## 10. Mobile, specifically

Responsive web at ≤780px, designed as a product, not a squeeze.

### 10.1 Who it is for
**The project manager first, the CTO second.** The PM opens it from a Slack
link mid-meeting to answer "how do you know"; the CTO glances between meetings.
The engineer's audit work (Compare, dense tables, arithmetic checking) is a
desk activity — mobile keeps the evidence *reachable* (drawer, evidence index)
but optimises reading over auditing. This is why the drawer leads with plain
English, why Compare is absent, and why Findings sits in the bottom tab bar.

### 10.2 Navigation pattern
Bottom tab bar (§3.4) + full-screen scope sheet from the top bar. Back is the
browser's; every screen works as an entry point (deep links land with full
context because scope is in the path).

### 10.3 Gestures and affordances
- **Pull-to-refresh** (§10.5) on scrollable screens.
- **Bottom sheet drag** on the working sheet (§10.4).
- **Horizontal swipe on the finding hero** cycles findings (mirrors the pager
  buttons, which remain — gesture is never the only path).
- No other custom gestures. Long-press does nothing (nothing may exist only
  under a hidden gesture, same principle as hover).
- Touch targets §7.6; type floors: body never below 13px on mobile, micro
  labels reserved for uppercase mono kickers.

### 10.4 The working sheet (evidence disclosure at 390px)
The desktop drawer becomes a bottom sheet (`ui/drawer.tsx` / vaul): grabber
handle, snap points **[62%, 100%]**, opens at 62% showing header + value +
plain English + the start of the formula (the "trust preview"); drag or tap
the grabber for full height; swipe-down or ✕ closes. Header (kicker, label,
value+tier) is sticky within the sheet. Sections 01–05 render as §5.10;
exemplars beyond the first and sources beyond three collapse behind
disclosures to keep the sheet scannable. URL contract identical
(`?working=`), so a PM can send exactly what they're looking at.

### 10.5 Pull-to-refresh mechanics
Touch-only, active when the scroll container is at top. Drag resistance
`y = Δ·0.45`, cap 96px, threshold 64px. Outcome: re-fetch `edition.json`;
same `generated_at` → toast "Edition 14 Sep 2026 is current — snapshots are
immutable."; newer → full data reload + page entrance choreography. Reduced
motion: gesture off, refresh button shown (§8.10).

### 10.6 What mobile deliberately does not have
Compare (§1.5); table sorting (cards have a fixed, navigation order — sorting
is a desk task); the m/m sparkline on metric list rows (value + tier suffice
at 390); hover tooltips (all tooltip content has tap/inline equivalents by
construction).

---

## 11. Quality bar (release gate, tested in C15)

1. **WCAG AA in both themes** — automated axe pass + manual contrast spot-check
   of chips, pills, chart text; §2.2 token discipline.
2. **Keyboard-complete**: every action reachable; visible focus (3px ring token)
   everywhere; drawer/sheet focus-trapped with Esc; charts and heatmap
   arrow-navigable; skip-to-content link first in DOM.
3. **No horizontal page overflow at 390px** (and no layout break at 320px);
   verified on every route.
4. **No console errors or warnings** on any route, either theme, including
   hydration/act warnings.
5. **Light and dark both designed** — §2.3 table implemented; no `filter:
   invert`, no unreviewed auto colours.
6. **Integrity behaviours under test** (vitest): floor prefix set; NotAvailable
   never renders 0; sample sums; gap months render as gaps; status pill
   derivation; banned-words scan; drawer URL contract.
7. **Motion rules honoured**: no zero-up chart animation, no count-up numbers,
   nothing hover-only, reduced-motion collapse verified with emulation.
8. `tsc --noEmit` clean; production build succeeds; edition.json ≤ 150 KB,
   largest scope file ≤ 500 KB.

---

## 12. Build order

Chunks are independently verifiable; the dependency graph enables three
parallel lanes after C1. "Verify" lines are the chunk's definition of done.

| # | Chunk | Depends on | Verify |
|---|---|---|---|
| **C0** | **Tokens & theme.** Extract §2.3 tokens into `index.css`, refactor existing classes onto them, add `.dark` values, wire next-themes toggle, §2.2 text-tier corrections, motion token module. | — | Home renders pixel-equivalent in light; dark renders designed palette; toggle persists; axe contrast pass on Home. |
| **C1** | **Data pipeline.** `scripts/build-data.mts` (split, derive, validate §9.4), types §9.5, hooks §9.6. | — | Script emits 12 files; validator passes on cohort.json and fails on a deliberately corrupted fixture; unit tests for slugs, evidence ids, reverse index counts (1,104), status derivation. |
| **C2** | **Shell & routing.** Route table §1.3, AppShell, Sidebar, TopBar, ScopeSwitcher, Breadcrumbs, BottomTabBar, palette, route transitions. | C1 | Every route renders a placeholder with correct scope label; switcher navigates; ⌘K finds metrics; deep links + 404 variants work; bottom bar at 390px. |
| **C3** | **Integrity primitives.** TierBadge, FloorFigure, NotAvailable, SampleBreakdown, CoverageBarCell, StatusPill, copy.ts + banned-words test. | C1 | Vitest suite from §11.6 (component half) green. |
| **C4** | **Chart kit.** Sparkline, MonthlySeries (gaps, selection strip, keyboard), WorkHeatmap (+ band reflow), reveal animations §8.5. | C1 | Storybook-style fixture page: gap month renders as gap; wipe reveal; reduced-motion fade; heatmap keyboard nav. |
| **C5** | **Working drawer/sheet.** §5.10 + §10.4, `?working=` contract, exemplar/source components. | C1, C3 | Deep link opens correct metric/scope; Esc/swipe close; NA metric renders reason; URL round-trips. |
| **C6** | **Overview.** §5.1 all variants (org greeting, project, repo "Inside this repository", hero empty variant). | C2, C3, C4, C5 | All 10 scopes render from data with zero hardcoded figures; Home.tsx mock retired. |
| **C7** | **Metrics index + detail.** §5.3, §5.4 incl. 390px list rows and cross-scope strip. | C2–C5 | 57 rows at 390 with no x-overflow; NA metric detail page reads as designed; ⌗ vs row navigation both keyboardable. |
| **C8** | **Findings.** §5.2. | C2, C3, C5 | 8 cards match data; scoped filtering; empty state at a finding-less scope (e.g. vite). |
| **C9** | **Repositories + Compare.** §5.6, §5.7. | C2, C3 | Derived status pills match headline data; sort + reset; Compare 3-scope with NA collapse; mobile explanation card. |
| **C10** | **Trends.** §5.5. | C2, C4 | 9 series per scope; heatmap bands at 390; before/after cards at 390; split_reason verbatim. |
| **C11** | **Evidence index + record.** §5.8, §5.9, virtualization. | C1, C2 | 1,104 rows scroll at 60fps on mid-tier mobile emulation; record shows citedIn matching reverse index; GitHub links out. |
| **C12** | **Methodology.** §5.11. | C1, C2 | All sections render from data; governance note verbatim; llm_calls: 0 stat present. |
| **C13** | **Mobile pass.** Pull-to-refresh, hero swipe, sheet polish, target audit, More sheet. | C6–C12 | §10 behaviours on 390px emulation; reduced-motion swaps refresh button. |
| **C14** | **Motion pass.** §8 choreography app-wide, entrance/route/scroll/stagger, reduced-motion audit. | C6–C12 | Timings match tokens (spot-check with slow-mo); no zero-up animation anywhere; ≤600ms entrance budget. |
| **C15** | **QA hardening.** §11 full gate. | all | The eight-point checklist, with evidence (axe output, screenshots at 320/390/780/1080/1440 both themes, console capture). |

Parallel lanes after C0+C1: **Lane A** C2→C6→C13 · **Lane B** C3+C5→C7/C8 ·
**Lane C** C4→C10, C9/C11/C12 fit either. C14 and C15 are serial finishers.

---

## Appendix A — real content anchors (for fixtures and review)

- Critical finding: review_coverage 7.8% @ fastapi/fastapi, rule `< 50`,
  ruleset `rccef86aa`; strongest exemplar PR #16210, 1,936 lines, no review.
- The telling pairing: fastapi lead time p50 **12 min** beside **7.8%** review
  coverage — Overview's hero + signal cards must let a reader see both at once.
- Range proof for coverage bars: 7.8% (fastapi) to 99.3% (eslint).
- Org facts: 4,974 commits · 1,200 PRs · 1,483 reviews · 643 contributors ·
  304 branches · 53.7 weeks.
- Floors: `≥ 1.9%` commits with AI trace; three `ai.native_*` /
  `ai.floor_understatement` metrics are the canonical NotAvailable fixtures.
- Bus factor 2 at org — a two-character value that must still open a full
  working (smallest-value case for layout).
- Series axis edge: helm starts 2025-08 (13 points), fastapi 2025-09 (12) —
  per-scope axes, not a shared one.
