# Design System: Sovix — Engineering Evidence

Paste this whole file into Google Stitch as the project's design system before
generating any screen. Every screen prompt in `PROMPTS.md` assumes these rules are
already in force.

---

## 1. Visual Theme & Atmosphere

A dark, high-contrast executive instrument. The atmosphere is a private-markets terminal
rather than a developer tool: near-monochrome, deep and quiet, with a single warm metal
accent that appears only where a person can act. Expensive through restraint and
precision, never through ornament.

The product's argument is that every figure can be defended, so the design has to feel
*certified*: generous negative space around a small number of very confident numerals,
hairline structure instead of boxes, and nothing decorative competing with the data.

- **Density: 5** — Daily App Balanced. Dense where figures cluster, generous between
  sections. Never a wall of tiles.
- **Variance: 6** — Offset asymmetric. Section heads sit left, figures sit at optical
  weight, never a centred column.
- **Motion: 6** — Fluid, weighted, spring-based. Motion confirms and orients. It never
  performs.

The single word to design against: **consequential**. A number on this screen may be
read aloud in a board meeting.

---

## 2. Color Palette & Roles

- **Obsidian Ground** (`#0A0B0D`) — the page. Never pure black.
- **Graphite Surface** (`#111316`) — cards, panels, raised regions.
- **Slate Recess** (`#16191D`) — inset regions: formulas, code, table headers.
- **Hairline** (`rgba(255,255,255,0.08)`) — all structural 1px lines and card borders.
- **Hairline Strong** (`rgba(255,255,255,0.16)`) — active borders, focused fields.
- **Bone** (`#EDEEF0`) — primary text and headline figures.
- **Ash** (`#9BA1A9`) — secondary text, definitions, labels.
- **Smoke** (`#6B7178`) — metadata, axis labels, disabled. Never below this for text.
- **Brass** (`#C9A961`) — **the single accent, saturation 52%.** Links, focus rings,
  active navigation, primary action, selected states. It marks where a human can act,
  and nothing else.
- **Brass Deep** (`#8A7238`) — pressed and visited states of the accent.
- **Alarm** (`#E5484D`) — reserved exclusively for a declared threshold that fired.

**Hard colour rules:**
- Maximum one accent. Brass is it. No second hue anywhere.
- **A metric value is never coloured.** Not red for low, not green for high. Figures are
  always Bone. Colour on a value encodes a verdict this product does not make, and the
  moment one number is red every other number reads as approval.
- **Severity is carried by weight and emphasis, not by more hues.** Critical = Alarm fill
  on a small badge plus an Alarm left rule. Warning = Alarm hairline rule, no fill,
  label in Ash. Info = Hairline rule only. One hue, three emphases.
- No green anywhere. There is no "good" in this product.
- No purple, no neon, no glow, no gradient on text, no coloured shadows.
- Charts draw in Bone and Ash. A single series may take Brass when it is the subject of
  the current view. Never a categorical rainbow.

---

## 3. Typography Rules

- **Display & UI:** `Geist` — fallbacks `Satoshi`, `Inter Tight`, system sans. Tracking
  tight on large sizes (`-0.02em` at 40px+). Hierarchy comes from weight and colour,
  never from size alone.
- **Body:** `Geist` at 400/450, relaxed leading (1.6), maximum 65 characters per line.
- **Numerals & apparatus:** `Geist Mono` — fallbacks `JetBrains Mono`, `IBM Plex Mono`.
  **Every figure, formula, count, identifier, timestamp and axis label is monospace with
  tabular figures.** This is a numbers product; the digits must align down a column.
- **Headline figures:** Geist Mono, 500 weight, 48–72px, `-0.03em`, Bone. Unit and
  percent sign at 40% of the figure size in Ash, baseline-aligned.
- **Labels:** 11px, 600 weight, `0.12em` tracking, uppercase, Smoke.

**Banned:** `Inter` as the primary face. All serif faces — this is software, not a
journal. System-default stacks as the design. Any font weight above 700.

---

## 4. Component Stylings

- **Statement block** (the product's atom — a value and everything defending it):
  no card, no fill. A hairline rule above, generous vertical padding, and four stacked
  parts: label in Ash, figure in Bone mono, a qualifier line in Smoke mono
  (`MEASURED · HIGH · 90 OF 200 PULL REQUESTS (45%)`), then a plain-language sentence in
  Ash. A Brass text button reading "Show the working" sits at the bottom.
- **The working** (the disclosure under a statement): expands in place, pushing content
  down, never a modal or a drawer. Slate Recess ground, Brass left rule, numbered rows.
  The formula sits in Geist Mono on Slate Recess with 14px padding.
- **Buttons:** flat. Primary is Brass fill with Obsidian text; secondary is a Hairline
  outline with Bone text. Active state translates down 1px. No glow, ever.
- **Cards:** used only where elevation means something. Graphite Surface, 1px Hairline,
  radius 10px, no shadow — depth comes from the surface step, not from a blur.
  In dense regions replace cards entirely with hairline dividers.
- **Finding banner:** full-width Graphite Surface, 3px Alarm left rule, a small Alarm
  badge reading CRITICAL, headline in Bone, and the rule that fired shown as mono chips
  on Slate Recess (`process.review_coverage < 50`).
- **Tables:** no zebra striping, no vertical rules. Hairline row separators only, header
  row in Slate Recess with Label type, figures right-aligned and mono.
- **Charts:** hairline axes, no gridlines heavier than Hairline, direct end-of-line
  labels rather than a detached legend, marks in Bone with the focal mark in Brass.
- **Empty states:** a composed statement of what is absent and the one action that would
  fix it. Never "No data".
- **Loading:** skeleton blocks matching the exact final geometry. Never a spinner.

---

## 5. Layout Principles

- CSS Grid throughout. A 1400px maximum content width, centred, with 32px gutters.
- Left-aligned and asymmetric. **No centred hero, no centred page column.**
- Persistent left rail on the application screens carrying scope navigation; the rail
  shows each repository with its current headline figure, so altitude is always one
  click away and always visible.
- No element ever overlaps another. Every item owns its spatial zone.
- **The three-equal-cards feature row is banned.** Use a 2-column asymmetric split, or a
  full-width statement stack.
- Section rhythm: 64px between sections, 24px between statements, 8px inside a statement.
- Wide content — tables, formulas, charts — scrolls inside its own container. The page
  body never scrolls sideways.

---

## 6. Responsive Rules

- Below 768px every multi-column layout collapses to one column, no exceptions.
- Horizontal page overflow is a critical failure. Long unbreakable strings — file paths,
  formulas, refs — either wrap or scroll inside their own container.
- Headlines scale with `clamp()`. Body never below 15px.
- All interactive targets at least 44px.
- The left rail becomes a labelled top sheet on mobile.
- Full-height regions use `min-h-[100dvh]`, never `h-screen`.

---

## 7. Motion & Interaction

- Spring physics on everything interactive: `stiffness 100, damping 20`. No linear
  easing anywhere.
- Section content enters with a staggered cascade, 40ms apart, opacity and a 6px rise.
- The working disclosure expands on a height-and-opacity spring; the page reflows under
  it rather than the panel covering anything.
- Hovering a repository in the rail emphasises its mark in the charts, and hovering a
  mark emphasises its row. Emphasis only — every value is already printed.
- Focus rings are 2px Brass at 2px offset, on every focusable element.
- Animate `transform` and `opacity` only.
- Honour `prefers-reduced-motion: reduce` by removing all of it.

**Two motion rules specific to this product, and they are absolute:**
1. **A chart's data never animates from zero.** A bar growing out of nothing draws a
   sequence of values that were never observed. Reveal the finished mark by opacity.
2. **Nothing exists only on hover.** Hover may emphasise; it may never be the only way to
   reach a value, because keyboard, touch and print must all get there.
3. No perpetual loops, no pulsing, no shimmer on live regions. A number that throbs reads
   as a number that is changing, and these are immutable snapshots.

---

## 8. Voice

- Sentence case everywhere except Labels.
- State the observation, then its boundary. Never lead with reassurance.
- Verbs of observation only: observed, collected, recorded, computed, linked.
- Uncertainty is written, not implied: "in the collected sample", "a detectable floor".
- No causal claims. Two things moving together is two things moving together.
- A metric name is a noun without an adjective: "Recorded review coverage", never
  "Review health".

---

## 9. Anti-Patterns (Banned)

- No emojis anywhere.
- No `Inter`. No serif faces. No system-default stack as the design.
- No pure black `#000000`.
- No green. No second accent. No categorical rainbow in charts.
- **No coloured metric values**, no delta arrows tinted red or green, no letter grades,
  no score badges, no gauges, no donuts, no pie charts, no radar, no treemaps.
- No neon, no outer glow, no coloured shadow, no gradient text.
- No KPI row of four equal cards with percentage deltas.
- No three equal cards in a row.
- No centred hero.
- No skeleton shimmer loops, no pulsing dots, no bouncing chevrons, no "Scroll to
  explore".
- No custom cursors.
- No generic placeholder names, no invented round numbers. Every figure on every screen
  is real data from the supplied snapshot.
- No AI copywriting: "elevate", "seamless", "unleash", "insights", "actionable",
  "supercharge", "next-gen", "10x".
- No value words on a measurement: "better", "worse", "good", "bad", "improve".
