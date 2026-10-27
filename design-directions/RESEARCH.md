# Research — what dense analytics products look like right now

Date: 2026-09-13. Sources are linked inline. Short verdicts, then what each of the five
directions takes and rejects.

## 1. The visual languages actually in use

**The Linear school (neutral, layered, typographic).** Linear's redesign write-up is the
most explicit statement of the current mainstream: LCH-generated themes from three
variables (base, accent, contrast), "a more neutral and timeless appearance", brand
colour deliberately *reduced*, Inter Display for headings, and obsessive alignment that
users "feel after a few minutes" rather than see
([Linear: How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)).
Their 2025 marketing went further monochrome — black/white with even fewer bold colours
([LogRocket on "Linear design"](https://blog.logrocket.com/ux-design/linear-design/)).
The whole dev-tool mainstream (Vercel, Resend, WorkOS, Clerk) orbits this: muted
neutrals, one tuned accent, keyboard-first affordances, restraint as a status signal.
Risk: it is now so copied that unmodified it reads as template — LogRocket literally
calls it "the SaaS design trend that's boring".

**The observability instrument (dark, dense, functional colour).** Grafana, Datadog and
Honeycomb all ship dark themes as a first-class or default working environment —
Datadog's own launch post frames dark mode as the mode for long sessions and NOC/big
screen use ([Datadog dark mode](https://www.datadoghq.com/blog/introducing-datadog-darkmode/));
Grafana defaults dark and offers light/system for comfort over long monitoring sessions
([groundcover on Grafana dashboards](https://www.groundcover.com/learn/observability/grafana-dashboards)).
Dark works there because the *marks* carry the saturated colour and the ground recedes.
Honeycomb's BubbleUp is the counter-lesson: the most admired interaction in the space is
an analytical one (compare distributions), not a decorative one
([UX of observability systems](https://medium.com/@jjhayes100/the-art-of-observability-4e3fe1c2ab04)).

**The opinionated/brutalist reaction (PostHog, Raycast, terminal-core).** 2026's
documented counter-trend: 1px-solid-border "engineered" components, exposed grid logic,
monospace as a brand signal — "Vercel, Linear, Cursor, Raycast, Resend, and PostHog
leaning into monospace" ([Studio 2am on industrial type](https://studio2am.co/blogs/news/raw-by-design-why-brutalist-and-industrial-type-is-taking-over),
[Setproduct's 2026 field guide](https://www.setproduct.com/blog/retro-brutalist-ui-design-2026),
[Fireart 2026 trends](https://fireart.studio/blog/the-best-web-design-trends/)).
PostHog specifically pairs a playful brand with a developer-dark UI
([PostHog design analysis](https://getdesign.md/posthog/design-md)). This language
signals "built by engineers, has opinions" — and dates fastest if done as pastiche.

**What separates good from generic** (from the dashboard-pattern surveys:
[925 Studios' 2026 dashboard survey](https://www.925studios.co/blog/saas-dashboard-design-examples-2026),
[context.dev best practices](https://www.context.dev/blog/dashboard-design-best-practices)):
one dominant metric leading the view (Stripe, Mercury); progressive disclosure as "the
single most important pattern"; colour as status, never decoration ("red means broken,
not 'look here'"); and deliberate omission — "the dashboards people trust are rarely
the ones with the most features." The dated tells: density-as-capability widget walls,
one generic screen for every role, decorative gradients on data.

## 2. Dark-first or light-first?

Split by *session shape*. Monitoring tools you live inside (Grafana, Datadog, Warp,
Raycast) go dark-first: long sessions, saturated marks on receding ground, NOC screens.
Decision/reading tools (Stripe, Mercury, Hex documents, Metabase, most BI) stay
light-first: shorter sessions, print/report lineage, easier trust with finance and
board audiences. Linear's answer — neutral system that theme-flips losslessly — is the
engineering-heavy compromise.

**Consequence for us:** this product is read in twenty-minute sittings and quoted into
board packs — that argues light. But it must sit next to Grafana/Sentry in an
engineer's dock — that argues dark. It is a genuine axis, so the five directions split
on it deliberately (two dark-first, two light-first, one dual-neutral).

## 3. Typefaces available to us (Google Fonts / open licence, verified)

- **Geist + Geist Mono** (Vercel, SIL OFL, on Google Fonts) — the current dev-tool
  default; "Geist is the new Inter" is already a cliché headline
  ([Vercel Geist](https://vercel.com/font), [Sailop on Geist's ubiquity](https://sailop.com/blog/geist-the-new-inter-ai-font-fingerprint-2026)).
  Excellent tabular figures. Using it whole-hog reads Vercel-adjacent; fine for one
  direction, not all five.
- **Inter / Inter Display** — what Linear actually ships; the invisible-quality choice.
- **IBM Plex Sans / Mono / Serif** — the only open superfamily designed as a corporate
  *system*; "machine and human" ([IBM Plex Mono on Google Fonts](https://fonts.google.com/specimen/IBM+Plex+Mono)).
  Mono has generous x-height, works at citation sizes.
- **JetBrains Mono** — "versatile default" of coding monos, tall x-height, reads well
  small ([monospace survey](https://maxibestof.one/typefaces/jetbrains-mono),
  [MadeGood 2026 mono round-up](https://madegooddesigns.com/monospace-font/)).
- **Space Grotesk / Space Mono** — display personality, editorial-technical; the
  branded-direction candidates.
- **Newsreader / Source Serif 4** — open serifs good enough to carry a document/ledger
  register without looking like a blog.
- All of the above ship tabular lining figures (`font-variant-numeric: tabular-nums`),
  which this product needs everywhere numbers columnise.

Rejected: anything licensed (Berkeley Mono, Söhne, ABC Diatype — the faces the *actual*
premium tools use) and Roboto/Open Sans/Lato (template tells).

## 4. Where motion earns its place in a data product

The literature is thin and mostly seller-side ([UX in Motion](https://www.uxinmotion.com/),
[Django Stars on UX motion](https://djangostars.com/blog/animation-and-motion-in-ux-design/)),
but the defensible consensus from it plus the products themselves:

**Earns its place:** state confirmation (a disclosure opening from where you clicked);
continuity across a re-sort or filter (FLIP-style position moves — the *identity* of a
mark persists); orientation on entrance (staggered section reveals that establish
reading order once); focus response (hover/focus emphasising an already-labelled mark);
spatial transitions that mirror the information architecture (descend = move down).
Linear's inline diff motion and Honeycomb's BubbleUp are both *analytical* motion.

**Reads as cheap:** counters ticking up from zero; bars/lines "growing" on load
(draws values that were never observed — also our honesty rule); looping ambient
animation near data; parallax anywhere; skeleton shimmer used as decoration rather
than loading; easing longer than ~400ms on anything a user waits for.

**Rule adopted for all five demos:** motion moves *containers, emphasis and position* —
never the measurement. Marks fade/reveal whole; data never animates from zero; nothing
exists only on hover; every page respects `prefers-reduced-motion`.

## 5. Current template clichés (the "generic AI dashboard" tells)

Compiled from the surveys above plus the template economy itself
([AdminLTE round-up](https://adminlte.io/blog/saas-admin-dashboard-templates/),
[Colorlib](https://colorlib.com/wp/saas-admin-dashboard-templates/) — useful as a
*negative* reference: this is exactly the look to avoid):

1. KPI card row of four with sparkline + green delta arrows, purple-to-blue gradient.
2. Rounded-2xl cards with identical soft shadows floating on grey `#F9FAFB`.
3. Donut charts and radial gauges for rates; red/green as verdict colour.
4. Emoji-adjacent icon soup; illustration blobs; glassmorphism panels over gradients.
5. Roboto/Open Sans with default weights; centred hero numbers with no denominator.
6. Skeleton shimmer everywhere; counters animating up; "83%" with no n.
7. Everything the same density — no altitude, no hierarchy of authority.

Our content model is the structural antidote (every number carries its citation line),
but the *visual* antidote is: real typographic scale, one accent with a job,
denominator-drawing chart forms, and density that changes with altitude.

## 6. What the five directions take from this

| # | Direction | Takes | Rejects |
|---|---|---|---|
| 01 | **Instrument** — dark-first observability console | Grafana/Datadog dark-session logic; Warp/Axiom mono numerals; functional colour on marks only | Neon gradients, terminal pastiche, density-as-capability |
| 02 | **Ledger** — light editorial forensics | Stripe/Mercury light trust register; document lineage; serif authority; Honeycomb's "analysis is the star" | Blog softness; static-report vibe (motion makes it software) |
| 03 | **Console** — the Linear school, done properly | LCH-ish layered neutrals, Inter, one tuned accent, alignment-as-quality, progressive disclosure | The copied-template flatness that makes Linear-clones generic |
| 04 | **Signal** — branded, opinionated, PostHog/Raycast energy | Monospace-as-brand, 1px engineered borders, confident chroma, expressive motion | Brutalist pastiche, decoration on data, verdict colour |
| 05 | **Blueprint** — light technical-drawing instrument | Drafting/annotation language (the product literally shows its working); IBM Plex system; hatched exclusions as a signature | Skeuomorphic blueprint kitsch; dark-terminal cliché |

Axes covered: dark-first (01, 04) vs light-first (02, 05) vs dual-neutral (03);
dense instrument (01, 05) vs generous editorial (02) vs balanced (03, 04);
neutral-precise (01, 03, 05) vs branded-opinionated (02's serif voice, 04's chroma);
flat (05) vs layered (03) vs mixed; restrained motion (01, 05) vs calm-paper (02) vs
springy (03) vs expressive (04).
