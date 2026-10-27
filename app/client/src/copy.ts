/**
 * Every static string this application renders (SPEC §6.5).
 *
 * Two rules govern this file, and the test beside it enforces both.
 *
 * 1. **Everything we write lives here.** Prose that arrives from the dataset is the
 *    dataset's own words and is rendered verbatim at the call site; prose that we
 *    author is here, where it can be audited in one pass.
 * 2. **No causal or evaluative language about a measurement** (SPEC §0.1). A figure
 *    is a reading, not a verdict: our copy never says one is better or worse than
 *    another, never says a number was caused by anything, and never grades, ranks
 *    or scores a scope or a person. `copy.test.ts` walks every export in this module
 *    for the banned list and fails the build if one appears.
 *
 * Placeholders are `{name}` and are filled with `fill()`. Interpolation stays in the
 * templates rather than in string concatenation at call sites so the scanner sees
 * the whole sentence, including its joining words.
 */

/** Substitute `{name}` placeholders. The only function this module exports. */
export function fill(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole
  );
}

/* ------------------------------------------------------------- tier badge */

/**
 * §6.2. The badge is text plus colour, never colour alone, so the tier name is
 * spelled out at every size. `aria` is what a screen reader hears in place of the
 * dot-and-abbreviation visual.
 */
export const tier = {
  measured: "Measured",
  proxy: "Proxy",
  inferred: "Inferred",
  aria: "Evidence tier {tier}, confidence {confidence}",
  ariaCompact: "Evidence tier {tier}",
  legendToggle: "What does {tier} mean?",
  legendClose: "Hide",
} as const;

export const confidence = {
  high: "high",
  medium: "medium",
  low: "low",
} as const;

/* ---------------------------------------------------------- floor figures */

/**
 * §6.3. The `≥` is part of the figure. The title sentence states what the symbol
 * claims — that the true figure is at or above this one — without claiming to know
 * by how much.
 */
export const floor = {
  prefix: "≥",
  title:
    "A floor: only work that left a detectable trace is counted here, so the real figure is at least this high.",
  aria: "at least {display}",
} as const;

/* --------------------------------------------------------- not available */

/**
 * §6.4. Absence is never zero. The label reads as words, never as a figure, and the
 * stat size always states the reason the dataset gives.
 */
export const notAvailable = {
  label: "Not available",
  /** Fallback reason when no caveat explains the absence: the sample's own count. */
  sampleReason: "{n} of {population} {unit}",
  /** A summary row carries no caveats; its coverage is the only reason it holds. */
  summaryReason:
    "Sample coverage {pct}% in this scope — the working states why.",
  aria: "Not available. {reason}",
} as const;

/* ------------------------------------------------------ sample breakdown */

/**
 * §6.6. Three tiles, a coverage bar, then one line per exclusion reason. The
 * `unaccounted` tile exists so a breakdown that does not add up says so out loud
 * rather than quietly under-reporting.
 */
export const sample = {
  heading: "Sample & exclusions",
  eligibleLabel: "Counted",
  populationLabel: "Population",
  excludedLabel: "Excluded",
  unitLine: "{unit}",
  coverageLabel: "Coverage",
  coverageValue: "{pct}%",
  coverageAria: "{n} of {population} {unit} counted, {pct} percent",
  includedLegend: "Counted",
  excludedLegend: "Excluded",
  exclusionsHeading: "What was set aside, and why",
  noExclusions: "Nothing was set aside from this sample.",
  unaccountedReason:
    "Not itemised by the collector — the shortfall between the population and everything named above.",
  emptySample: "This scope recorded nothing to sample.",
} as const;

/* ----------------------------------------------------------- coverage bar */

export const coverage = {
  aria: "Sample coverage {pct} percent",
} as const;

/* ------------------------------------------------------------ status pill */

/**
 * §5.6, §6.15. The pill restates which rules fired, and its footnote names the rule
 * that put it where it is. It is not a rating of the repository and there is no
 * fourth, nicer level hiding behind "healthy" — the word means only "no rule fired".
 */
export const status = {
  critical: "Critical",
  watch: "Watch",
  healthy: "Healthy",
  ariaCritical: "A critical finding applies to this scope",
  ariaWatch: "A warning finding applies to this scope",
  ariaHealthy: "No finding applies to this scope",
  footnoteToggle: "Why?",
  footnoteClose: "Hide",
  footnoteDriver: "{severity} · {title}",
  footnoteRule: "Rule {comparison} {threshold} · ruleset {ruleset}",
  footnoteHealthy:
    "No rule in this edition's ruleset applies to this scope's readings.",
} as const;

export const severity = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
} as const;

/* --------------------------------------------------------- working drawer */

/**
 * §5.10, §10.4. The drawer is the product's one differentiator made reachable: it
 * shows how a figure was arrived at, over what sample, with what set aside, and
 * against which real commits and pull requests.
 *
 * The section names are deliberately flat descriptions of what is inside them. None
 * of them characterises the reading — the drawer's job is to let a reader judge the
 * figure, never to do the judging for them.
 */
export const working = {
  kicker: "The working",
  /** Dialog label for assistive tech; the visible h2 is the metric's own label. */
  aria: "The working behind {label}",
  close: "Close working",
  closeIcon: "Close the working drawer",
  openFullPage: "Open full page",
  openFullPageAria: "Open the full page for {label}",
  plainEnglishHeading: "In plain English",
  howToReadHeading: "How to read it",
  scopeLine: "{label} · {since} to {until}",

  /* The five numbered sections (§5.10.4–8). */
  formulaHeading: "Formula",
  formulaCaption:
    "The arithmetic as the edition recorded it, with its own values already substituted.",
  sampleHeading: "Sample & exclusions",
  assumptionsHeading: "Assumptions & caveats",
  assumptionLabel: "Assumption",
  caveatLabel: "Caveat",
  exemplarsHeading: "Exemplars",
  exemplarsCaption:
    "Individual records that carry the most weight in this figure.",
  exemplarsNone:
    "This edition ranks no exemplars for this reading. The source records below are the evidence it rests on.",
  sourcesHeading: "Source records",

  /* Exemplars (§6.10). */
  exemplarStrongest: "Strongest",
  exemplarRank: "#{rank}",
  exemplarExpand: "Show the full exemplar",
  exemplarCollapse: "Hide the full exemplar",
  exemplarShare: "{pct}% of the total",
  exemplarMoreToggle: "Show {count} more exemplars",
  exemplarMoreClose: "Hide the other exemplars",

  /* Source records (§6.11). */
  sourceOpenRecord: "Open the evidence record for {ref}",
  sourceOpenExternal: "Open {ref} on GitHub",
  sourceAllRecords: "All {count} source records",
  sourceMoreToggle: "Show {count} more source records",
  sourceMoreClose: "Hide the other source records",
  sourceNoneHeading: "No source records",

  /* States (§5.10 loading/error, §4.3). */
  loading: "Reading this scope's evidence…",
  errorTitle: "This scope's evidence did not load",
  errorRetry: "Try again",
  unknownTitle: "Not a metric in this edition",
  unknownBody:
    "The address asked for `{metricId}`, which this edition does not publish. Close this and use the metric index, or search with the command palette.",

  /* The ⌗ affordance every figure carries (§6.12, §7.6). */
  triggerAria: "Show the working behind {label}",
  triggerLabel: "Working",

  /* Mobile sheet (§10.4). */
  sheetGrabber: "Drag to resize, or swipe down to close",
} as const;

/* ---------------------------------------------------------------- findings */

/**
 * §5.2. The alarm surface. The severities are the rulebook's own words and the
 * card restates the rule that fired — the chip is a label for a threshold
 * crossing, never a verdict on the repository it names.
 *
 * `actionHeading` introduces the one place in the product that prescribes
 * anything, and even there the sentence rendered under it is the dataset's, not
 * ours (§5.2).
 */
export const findings = {
  title: "Findings",
  kicker: "Rulebook {ruleset}",
  lede: "{count} rules crossed their declared thresholds in this edition. Thresholds are data, not judgement — every one is inspectable.",
  filterLegend: "Filter by severity",
  filterAll: "All",
  filterAria: "Show {label} findings",
  ruleLine: "{metric} {comparison} {threshold} · fired at {value}",
  ruleAria:
    "Rule: {metric} {comparison} {threshold}. This scope reads {value}.",
  actionHeading: "What to do",
  inspect: "Inspect the evidence",
  inspectAria: "Inspect the evidence behind {label}",
  openScope: "Open {label}",
  scopeChipAria: "Finding recorded at {label}",
  elsewhere: "{count} more findings in other scopes",
  elsewhereOne: "1 more finding in another scope",
  emptyTitle: "No rules fired in this scope.",
  emptyBody: "The rulebook still ran — see every threshold in Methodology.",
  emptyAction: "Read the methodology",
  emptyNearest:
    "The rule that came nearest is {label} {comparison} {threshold}; this scope reads {display}.",
  filteredEmptyTitle: "Nothing at that severity here.",
  filteredEmptyBody:
    "This scope has findings at other severities. Clear the filter to see them.",
  filteredEmptyAction: "Show every severity",
} as const;

/* ------------------------------------------------------------ repositories */

/**
 * §5.6. The scope table compares *scopes*. There is no contributor column, no
 * ranking of people, and the status column restates the rulebook rather than
 * summarising it into a judgement (§0.1, §1.4).
 *
 * `sortNote` exists so a reader who has sorted the table knows what they are
 * no longer looking at: the edition's own order groups repositories by project,
 * and a sorted table cannot keep those subheads honest.
 */
export const repositories = {
  title: "Repositories",
  ledeOrg:
    "{repos} repositories across {projects} projects, as this edition collected them. Each column is a reading; the status restates which rules fired.",
  ledeProject:
    "{repos} repositories in {label}, as this edition collected them. Each column is a reading; the status restates which rules fired.",
  compare: "Compare scopes",
  compareAria: "Compare these scopes side by side",
  colRepository: "Repository",
  colReview: "Review coverage",
  colLeadTime: "Lead time p50",
  colContributors: "Contributors",
  colOpenPrs: "Open PRs",
  colStatus: "Status",
  sortAscending: "Sort by {column}, lowest first",
  sortDescending: "Sort by {column}, highest first",
  sortClear: "Return {column} to the edition's order",
  sortNote: "Sorted by {column}.",
  resetOrder: "Reset order",
  resetOrderAria: "Return to the edition's own order, grouped by project",
  rowAria: "Open {label}",
  naSortNote: "Scopes that publish no figure stay at the end of every sort.",
  empty: "No repositories in this project's collection.",
  emptyBody:
    "Every repository this edition collected sits under another project.",
} as const;

/* ---------------------------------------------------------------- compare */

/**
 * §5.7. Two or three scopes, column by column.
 *
 * `mobileBody` is the one place the product says out loud that a screen is
 * missing on purpose. A three-column table of 57 metrics at 390px would have to
 * hide the columns the screen exists to put beside each other, so mobile gets
 * the sentence and the route back rather than a version that cannot keep the
 * promise (§1.5, §7.4).
 */
export const compare = {
  title: "Compare",
  lede: "Up to three scopes, column by column. Every cell is that scope's own reading, and ⌗ opens the working behind it.",
  slotLabel: "Column {index}",
  slotChoose: "Choose a scope",
  slotChange: "Change the scope in column {index}",
  slotRemove: "Remove column {index}",
  slotAdd: "Add a column",
  slotTaken: "Already a column",
  emptyTitle: "Pick two scopes to compare.",
  emptyBody:
    "A comparison needs at least two columns. Choose them above — up to three sit side by side.",
  mobileTitle: "Comparison is a desk screen.",
  mobileBody:
    "Three columns of 57 metrics cannot sit side by side at this width, and a version that folded them into a list would hide the thing this screen exists to show. Open it on a wider screen.",
  /* Sits above the links, naming what they are. Each scope's own metrics index
     carries every figure the comparison would have shown, one column at a time. */
  mobileLinks: "The same figures, one scope at a time",
  gapsHeading: "Largest gaps",
  gapsCaption:
    "The five metrics whose readings sit furthest apart across the selected columns. Both ends are the scopes' own figures.",
  gapsNone:
    "No metric is published by every selected scope, so nothing can be set end to end.",
  gapExtreme: "{label} · {display}",
  metricColumn: "Metric",
  naDisclosure: "Not available in these scopes ({count})",
  naDisclosureClose: "Hide the unavailable metrics",
  columnAria: "Readings for {label}",

  /* One column can fail while the others stand (§5.7). The column says so in its
     own header rather than the page going dark, and its cells stay empty — an
     empty cell under a stated failure is the only honest thing to put there. */
  columnErrorTitle: "This scope's readings did not load",
  columnRetry: "Try again",
  columnLoading: "Reading this scope…",
  cellPending: "No reading loaded for this column",
  unknownSlot: "Not in this edition",
  unknownSlotBody:
    "The address named {slug}, which this edition does not publish. Choose another scope for this column.",
} as const;

/* ------------------------------------------------------- metrics index */

/**
 * §5.3. The index is a map, not a verdict: it lists what was measured, at what
 * evidence tier, over what sample. Nothing here ranks a family, a metric or a
 * scope, and there is no sort control — the order is the edition's own.
 */
export const metrics = {
  eyebrow: "Metrics",
  title: "All {count} metrics",
  lede: "Every measurement this edition publishes for {scope}, grouped into {families} families. Each row opens the figure's own working.",
  legendLabel: "Evidence tiers",
  legendToggle: "What does {tier} mean?",
  legendClose: "Hide",

  familyNavLabel: "Jump to a family",

  searchLabel: "Search",
  searchPlaceholder: "Name or id",
  searchClear: "Clear the search",

  tierFilterLabel: "Tier",
  tierFilterAria: "Show only {tier} metrics",

  columnMetric: "Metric",
  columnValue: "Value",
  columnTrend: "Trend",
  columnTier: "Tier",
  columnSample: "Sample",

  sampleLine: "{n} of {population} {unit}",
  coverageLine: "{pct}% of {unit}",

  matchCount: "{shown} of {total} metrics shown",
  emptyTitle: "Nothing matches",
  emptyBody:
    "No metric in this scope matches the current search and tier filter. The 57 are all still here — the filter is hiding them.",
  clearFilters: "Clear filters",

  loading: "Reading this scope's metrics…",
  errorTitle: "This scope's metrics did not load",
  errorBody:
    "The scope file did not arrive, so no figures are shown. Nothing is filled in from an earlier visit.",
  errorRetry: "Try again",
} as const;

/* ------------------------------------------------------- metric detail */

/**
 * §5.4. One figure, fully unpacked. The page states what the reading is, what it
 * is computed over, and what it cannot tell you — in the dataset's words wherever
 * the dataset has them. Direction is deliberately not rendered as an arrow or a
 * caption: `how_to_read` carries it with the nuance a bare arrow would strip.
 */
export const metricPage = {
  backToIndex: "All {count} metrics",
  backAria: "Back to the metrics index",

  plainEnglishHeading: "In plain English",
  whyHeading: "Why it matters",
  howHeading: "How to read it",

  seriesHeading: "Month by month",
  seriesStandingCaption:
    "First and last months may be partial. Missing months are gaps, not zeroes.",
  seriesNone:
    "This edition publishes no monthly series for this metric — the figure is a single reading over the whole window.",

  crossScopeHeading: "The same metric elsewhere",
  crossScopeCaptionOrg:
    "The projects beneath this scope, each with its own sample. Scopes, never people.",
  crossScopeCaptionPeers:
    "The other scopes at this altitude, each with its own sample. Scopes, never people.",
  crossScopeHere: "You are here",
  crossScopeOpen: "Open {label}",
  crossScopeAbsent: "Not published at this scope",

  workingHeading: "The working",
  workingCaption:
    "The same five sections the drawer shows, open in full: how the figure was arrived at, over what sample, with what set aside, and against which records.",

  naHeading: "Why there is no figure",
  naBody:
    "This reading is published as absent rather than as a zero. A zero would be a different claim — that the thing was measured and found to be none — and this edition cannot make it.",

  findingHeading: "A rule fired on this metric",
  findingRule: "{metric} {comparison} {threshold} · fired at {value}",
  findingOpenScope: "Open {label}",

  unknownTitle: "This metric isn't in the edition",
  unknownBody:
    "The address asked for {metricId}, which this edition does not publish. These are the ids in the {family} family:",
  unknownBodyNoFamily:
    "The address asked for {metricId}, and no family in this edition uses that prefix. The index lists all {count}.",
  unknownOpenIndex: "Open the metrics index",

  loading: "Reading this metric's working…",
  errorTitle: "This metric's working did not load",
  errorBody:
    "The scope file did not arrive. The figure above comes from the edition summary; the sample, the formula and the records behind it are in the file that failed.",
  errorRetry: "Try again",
} as const;

/* -------------------------------------------------------------- overview */

/**
 * §5.1. The Overview screen, in every variant.
 *
 * Two absences in this block are deliberate and worth stating, because both look
 * like omissions until you know why.
 *
 * There is no "vs last edition" wording anywhere: this edition has no predecessor,
 * so a delta against one cannot exist. What the signal cards carry instead is the
 * month-on-month move read off the metric's own published series, labelled `m/m`
 * so the reader knows which two months are being subtracted (§5.1.4).
 *
 * And there is no period selector copy, for the same class of reason: an edition
 * covers exactly one window, and offering "Last 6 months" would promise a
 * recomputation this product does not do (§5.1.2).
 */
export const overview = {
  /* --- heading (§5.1.1) */
  greetingMorning: "Good morning",
  greetingAfternoon: "Good afternoon",
  greetingEvening: "Good evening",
  /**
   * The account the shell's own chip names. It is chrome, not a reading — no
   * figure on this screen is attached to a person (§0.1).
   */
  viewerFirstName: "Rowan",
  ledeOrg:
    "A clear read on how your engineering organisation is working — and the evidence behind it.",
  ledeProject:
    "Every repository collected under this project, read at one altitude, with the working attached to each figure.",
  ledeRepo:
    "One repository on its own terms, with the working attached to each figure.",
  repoProjectChip: "in {project}",
  exportEdition: "Export edition",
  exportEditionAria: "Print this screen — the v1 edition export",
  viewWorking: "View the working",

  /* --- filter row (§5.1.2) */
  scopeLabel: "Scope",
  scopeTriggerAria: "Change scope",
  editionNote: "Immutable edition",
  editionCommits: "{commits} commits",
  editionPullRequests: "{pullRequests} pull requests",

  /* --- finding hero (§5.1.3) */
  heroSeverity: "{severity} finding",
  heroRule: "Rule {ruleset}",
  heroInspect: "Inspect the evidence",
  heroOpenScope: "Open {scope}",
  heroPagerAria: "Finding {index} of {total} in this scope",
  heroPrev: "Previous finding",
  heroNext: "Next finding",
  heroGroupAria: "Findings in this scope — use the left and right arrow keys",
  heroStatRule: "Threshold {comparison} {threshold} · ruleset {ruleset}",
  heroExemplarLabel: "Strongest exemplar",
  heroExemplarPending: "Reading this scope's evidence…",
  heroExemplarNone: "This edition ranks no exemplar for this reading.",
  heroEmptyTitle: "No thresholds fired in this scope.",
  heroEmptyLabel: "Rulebook ran · nothing fired",
  heroEmptyBody:
    "Every rule in ruleset {ruleset} was evaluated against this scope. The nearest is {label}, which fires at {comparison} {threshold}; the reading here is {display}.",
  heroEmptyBodyNone:
    "Every rule in ruleset {ruleset} was evaluated against this scope, and none of them applies to the readings published here.",
  heroEmptyOpenNearest: "Inspect the nearest rule",
  heroEmptyOpenMethodology: "See every threshold",
  heroFactCommits: "commits",
  heroFactPullRequests: "pull requests",
  heroFactContributors: "contributors",

  /* --- signal cards (§5.1.4) */
  signalsKicker: "The readout",
  signalsTitle: "Signals worth a conversation",
  signalsAll: "View all {count} metrics",
  deltaLabel: "m/m",
  deltaAria: "{display} from {from} to {to}",
  sampleLine: "{n} of {population} {unit}",

  /* --- children table (§5.1.5, columns §5.6) */
  childrenKicker: "Across the cohort",
  childrenTitle: "Repositories",
  childrenAll: "View all",
  childrenEmpty: "No repositories in this project's collection.",
  colRepository: "Repository",
  colReview: "Review coverage",
  colLead: "Lead time p50",
  colContributors: "Contributors",
  colOpenPrs: "Open PRs",
  colStatus: "Status",

  /* --- the repo variant of the same panel (§5.1.5) */
  insideKicker: "Inside this repository",
  insideTitle: "What this repository is made of",
  factCommits: "commits",
  factMergedPullRequests: "merged PRs",
  factReviews: "reviews",
  factBranches: "branches",
  factContributors: "contributors",
  factSpan: "weeks of records",
  exemplarsTitle: "Records carrying the most weight",
  exemplarsNone: "This edition ranks no exemplars in this repository.",
  exemplarWeight: "{weight} {unit}",

  /* --- evidence panel (§5.1.5) */
  evidenceKicker: "Trust, made inspectable",
  evidenceTitle: "What every number carries",
  evidenceFormula: "The formula",
  evidenceFormulaSub: "Real values substituted, not a black box.",
  evidenceSample: "The sample",
  evidenceSampleSub: "Counted records, plus every exclusion.",
  evidenceSources: "The source records",
  evidenceSourcesSub: "Actual commits and pull requests.",
  evidenceRowAria: "{section}, in the working behind {label}",
  evidenceQuote:
    "A number whose evidence cannot be produced does not get published.",
  evidenceAttribution: "Sovix product principle",

  /* --- footer (§5.1.6) */
  footerBrand: "Sovix · Engineering evidence",
  footerEdition: "Edition {day}",
  footerMethodology: "Read the methodology",

  /* --- states (§4.1, §4.2) */
  loadingLabel: "Loading this scope's report",
  errorTitle: "This scope's report didn't load.",
  errorBody:
    "The rest of the edition is unaffected and every other scope stays reachable. Nothing here is filled in from an earlier visit.",
  errorRetry: "Try again",
} as const;

/* ------------------------------------------------------------------ trends */

/**
 * §5.5. Three sections, and each one is a place the product could slip into a
 * claim it cannot support.
 *
 * The series cards state a month and a figure and stop. The heatmap carries no
 * judgement copy at all — an hour of the day is not a verdict, and the two
 * `temporal.*` metrics linked beneath it are where that reading belongs. And the
 * before/after table's footer is the no-causality rule written out at the one place
 * on the site where breaking it would be easiest: two columns either side of a date
 * invite a "so that is what did it", and this says plainly that they do not.
 */
export const trends = {
  title: "Trends",
  lede: "Nine monthly series over this scope's own window, the hours its commits were saved in, and what each half of the window recorded.",

  seriesHeading: "Month by month",
  seriesCaption:
    "Each series spans this scope's own window. A month with no eligible records is drawn as a gap, never as a zero.",
  seriesLatest: "Latest month",
  seriesLatestMonth: "{month}",
  seriesNoMonths:
    "No month in this scope's window carries a figure for this series.",

  /* The grid's own caption carries the note and the total, so neither is
     restated here: the same figure twice reads as two figures (§6.9). */
  heatmapHeading: "When the work was saved",
  heatmapTemporalIntro: "Two metrics read these hours:",

  comparisonHeading: "What changed at the median commit date",
  comparisonSplitLabel: "Split at",
  comparisonBeforeCommits: "{count} commits before",
  comparisonAfterCommits: "{count} commits after",
  comparisonColumnMetric: "Metric",
  comparisonColumnChange: "Change",
  comparisonColumnConfidence: "Confidence",
  /* A row whose earlier half has no figure. It states the absence, never a zero. */
  comparisonNoChange: "No figure before the split",
  comparisonChangePoints: "{value} pts",
  comparisonArrow: "→",
  comparisonFooter:
    "Two things moving together are reported as two things moving together.",
} as const;

/* ------------------------------------------------------------ methodology */

/**
 * §5.11. The trust document. Every figure on that screen comes from the edition
 * file; what lives here is the furniture around them — section names, column heads,
 * and the one-line gloss for each threshold in the rulebook, which the dataset
 * states as a bare number and a name.
 *
 * Two sentences here are the screen's spine. `llmStanding` is what the zero in
 * `llm_calls` means, and `governanceStance` is §1.4's decision: this edition's
 * silence about individuals is a position, not an omission. The dataset's own
 * `governance_note` sits beside it, verbatim.
 */
export const methodology = {
  title: "Methodology",
  lede: "How every figure in this edition was produced, over what, and what it cannot tell you.",

  madeHeading: "How this edition was made",
  madeDuration: "Collection time",
  madeDurationValue: "{seconds}s",
  madeReposCollected: "Repositories collected",
  madeReposFailed: "Repositories that failed",
  madeGraphql: "GraphQL calls",
  madeRest: "REST calls",
  madeGeneratedAt: "Snapshot taken {day}",
  llmLabel: "Language-model calls",
  llmStanding: "No language model touches a calculation.",
  llmCost: "{amount} spent on language models",

  identityHeading: "Who the records were attributed to",
  identityPeople: "People",
  identityBots: "Bot accounts set aside",
  identityMerged: "Identities merged",
  /* The dataset names {count} of the merges as examples, not all of them — the
     toggle says "example" so the list cannot be read as the whole set. */
  identityMergesToggle: "Show {count} example merges",
  identityMergesClose: "Hide the example merges",
  identityMergeAria: "Email addresses merged into one person",

  legendHeading: "Tiers and confidence",
  legendTierLead:
    "Every figure in this edition carries one of these three tiers. The chip below a figure is the same chip as here.",
  legendConfidenceLead:
    "Confidence is stated beside the tier, and says how directly the figure was counted.",

  limitsHeading: "Structural limits",
  /* The count comes from the data — the client hardcodes no quantity (§9.8). */
  limitsLead:
    "{count} things this data cannot do, stated by the collector rather than discovered by a reader.",

  exclusionsHeading: "What was excluded",
  exclusionsColumnReason: "Reason",
  exclusionsColumnFiles: "Files",
  exclusionsColumnLines: "Lines",
  /* At 390px the three columns stack, so each figure carries its own noun
     instead of relying on a column head that is no longer beside it (§7.4). */
  exclusionsUnitFiles: "files",
  exclusionsUnitLines: "lines",
  exclusionsMoreToggle: "Show the other {count} reasons",
  exclusionsMoreClose: "Hide the other reasons",
  exclusionsTotal: "{lines} lines excluded in total",
  exclusionsPathsHeading: "The largest single files",
  exclusionsCaption:
    "Every exclusion adds up; there is never an unexplained gap.",

  rulebookHeading: "The rulebook",
  rulebookLead:
    "The thresholds this edition's rules were run with. A figure that depends on one of these says so on its own working.",
  rulebookColumnName: "Threshold",
  rulebookColumnValue: "Value",
  rulebookColumnMeaning: "What it sets",
  rulebookRuleset: "Ruleset {id}",

  governanceHeading: "Governance",
  governanceAttribution: "The dataset's own note",
  governanceStance: "This edition publishes no per-person figures.",
  governanceStanceDetail:
    "SOVIX names contributor as a fourth altitude. This build publishes ten scopes and no contributor scopes, and the note above is why.",

  coverageHeading: "Coverage notes",
  coverageRepos: "{collected} repositories collected, {failed} failed.",
  coverageTruncated:
    "Pull-request collection stopped at the page limit in {list}. Pull-request metrics describe that window only.",
  coverageStructure: "The structure scan is missing in {list}.",
  coverageNoCi: "No CI records were collected in {list}.",
  coverageNoReviews: "No review records were collected in {list}.",
  coverageGenerated:
    "{lines} lines were set aside as generated, across every repository.",
  coverageNativeAnalytics:
    "This edition carries no tool-native analytics. Cursor and Copilot report usage only from the date their telemetry was switched on, and this collection had none to read.",
} as const;

/* The 12 rulebook thresholds (§5.11.5), each in one line. The dataset states a
   name and a number; the sentence that says what the number sets is ours. */
export const thresholdGloss: Record<string, string> = {
  rework_window_days:
    "A line added and then rewritten within this many days counts as rework.",
  large_pr_lines:
    "A pull request changing at least this many lines counts as large.",
  trivial_commit_lines:
    "A commit changing at most this many lines counts as trivial.",
  long_function_lines: "A function of at least this many lines counts as long.",
  duplicate_window_lines:
    "A run of at least this many identical lines counts as a duplicated block.",
  stale_branch_days:
    "A branch with no commit for this many days counts as stale.",
  stale_pr_days:
    "A pull request open this many days without merging counts as stale.",
  newcomer_days:
    "A contributor whose first commit landed within this many days counts as a newcomer.",
  recent_activity_days:
    "Activity within this many days of the snapshot counts as recent.",
  work_day_start_hour:
    "The hour the working day is taken to start, in each author's own local time.",
  work_day_end_hour:
    "The hour the working day is taken to end, in each author's own local time.",
  hotspot_top_n: "How many files a hotspot list carries.",
};

/* ------------------------------------------------------------- evidence */

/**
 * §5.8, §5.9. The bottom rung of the ladder: 1,104 records, and for each one every
 * figure in the edition that counted it.
 *
 * The inversion is the point. Elsewhere a figure produces its records; here a record
 * names its figures, which is what lets an engineer start from their own pull request
 * and find out what it was counted in. So the copy on this surface describes what was
 * counted and in what capacity, and never characterises the work or its author — a
 * record names work, never a person's standing (§0.1, §1.4).
 */
export const evidence = {
  indexTitle: "Evidence index",
  indexLedeHead: "{total} records cited across this edition",
  recordTitle: "Evidence record",

  /* Kind names. Singular is the chip and the record header; plural is the lede. */
  kindOne: {
    commit: "commit",
    pull_request: "pull request",
    file: "file",
    release: "release",
    branch: "branch",
    dataset: "dataset",
  },
  kindMany: {
    commit: "commits",
    pull_request: "pull requests",
    file: "files",
    release: "releases",
    branch: "branches",
    dataset: "datasets",
  },
  kindCount: "{count} {label}",

  /* Controls (§5.8). */
  searchLabel: "Search the records",
  searchPlaceholder: "Reference, title or repository",
  searchClear: "Clear the search",
  kindLegend: "Filter by kind",
  kindAll: "All kinds",
  repoLabel: "Repository",
  repoAll: "All repositories",
  /* The ten collection records carry no repository: they are the edition's own
     aggregates, counted at a scope rather than fetched from one repository. */
  repoNone: "Collection records",
  resultCount: "Showing {shown} of {total} records",
  resultCountAll: "All {total} records",

  /* Rows (§5.8, §7.4). */
  citedCount: "counted in {count} figures",
  citedCountOne: "counted in {count} figure",
  rowAria: "{ref} — {when}, {cited}",
  undated: "No timestamp recorded",
  occurredTitle: "{absolute}",

  /* The pre-filtered entry the working drawer links to (§5.10.8). The kicker is
     the drawer section the reader came from, so the trip is legible in both
     directions. */
  filterKicker: "Source records",
  filterHeading: "Counted in {metric}",
  filterScope: "at {scope}",
  filterClear: "Show all records",
  filterUnknownMetric:
    "The address asked for records counted in {metricId}, which this edition does not publish.",
  filterUnknownScope:
    "The address asked for records counted at {scope}, which this edition does not publish.",

  /* Empty and error (§5.8). */
  emptyTitle: "No records match.",
  emptyBody:
    "Every record in this edition is reachable — widen the search or clear the filters to see them.",
  emptyClear: "Clear the filters",
  errorTitle: "The evidence index did not load",
  errorBody:
    "The record list is a separate file, fetched the first time you open this screen. Nothing else on the page depends on it.",
  errorRetry: "Try again",
  loading: "Reading the edition's records…",

  /* The record screen (§5.9). */
  recordKicker: "The record",
  recordOpen: "Open on GitHub",
  recordOpenAria: "Open {ref} on GitHub, in a new tab",
  /* Absence, with its reason stated — the ten collection records have no address
     outside this edition, and a link-shaped thing that goes nowhere is worse than
     no link at all. */
  recordNoLink:
    "This record is the edition's own collection at this scope. It has no address on GitHub.",
  recordFactsHeading: "What the edition recorded",
  recordAbsent: "not recorded",
  recordNone: "none recorded",
  recordYes: "yes",
  recordNo: "no",

  /* Card 2 — the reverse index made visible (§5.9). */
  citedHeading: "Counted in",
  /* The kicker above already says "Counted in", so the heading is the count. */
  citedFigures: "{count} figures",
  citedFiguresOne: "{count} figure",
  citedLede:
    "Every figure in this edition that counted this record, and the reading it was counted into.",
  citedLedeOne: "The one figure in this edition that counted this record.",
  citedWorkingAria: "Show the working behind {metric} at {scope}",
  citedMetricAria: "Open {metric} at {scope}",

  /* Unknown id (§5.9). */
  unknownTitle: "No record answers to that id",
  unknownBody:
    "Record ids are derived from the artefact itself, so an id absent from this edition will stay absent from it. Search the index for the reference instead.",
  unknownSearch: "Open the evidence index",
} as const;
