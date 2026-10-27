/**
 * Sovix domain types — faithful to cohort schema 1.0 (SPEC §9.5).
 *
 * Two kinds of field live here:
 *   - fields read verbatim from `cohort.json` (the dataset's own words and numbers), and
 *   - fields DERIVED at build time by `scripts/build-data.mts`, marked `@derived`.
 *
 * The client never computes a figure (SPEC §9.2, §9.8). If a number is on screen it
 * either came from the dataset's `display` string or from a `@derived` field below.
 */

/* ------------------------------------------------------------------ enums */

export type Tier = "measured" | "proxy" | "inferred";
export type Confidence = "high" | "medium" | "low";
export type Direction = "lower_is_better" | "higher_is_better" | "neutral";
export type Severity = "critical" | "warning" | "info";

/** `contributor` is reserved by SOVIX-CONTEXT but deliberately unpublished (SPEC §1.4). */
export type ScopeLevel = "org" | "project" | "repo";

/** `"org:all"` | `"project:<label>"` | `"repo:<owner>/<name>"`. */
export type ScopeKey = string;

/** Build-time slug for a scope key (SPEC §1.2). Also the scope file's basename. */
export type ScopeSlug = string;

export type SourceKind =
  | "commit"
  | "pull_request"
  | "file"
  | "release"
  | "branch"
  | "dataset";

/** Derived status for the scope table's pill (SPEC §5.6). Never stored in the dataset. */
export type StatusLevel = "critical" | "watch" | "healthy";

/* ----------------------------------------------------------------- scopes */

export interface ScopeRef {
  level: ScopeLevel;
  key: ScopeKey;
  label: string;
  /** ISO timestamp of the first record in this scope's window. */
  since: string;
  /** ISO timestamp of the last record in this scope's window. */
  until: string;
  repos: string[];
}

/** `ScopeRef` plus the build-time routing derivations (SPEC §1.2, §9.2). */
export interface ScopeRefResolved extends ScopeRef {
  /** @derived slug from the label, lowercased, non-alphanumeric runs collapsed to `-`. */
  slug: ScopeSlug;
  /** @derived canonical route for this scope's Overview tab. */
  path: string;
  /** @derived owner/name split, repo scopes only. */
  owner: string | null;
  name: string | null;
}

export interface ScopeFacts {
  commits: number;
  merge_commits: number;
  pull_requests: number;
  merged_pull_requests: number;
  open_pull_requests: number;
  reviews: number;
  branches: number;
  workflow_runs: number;
  contributors: number;
  repos: string[];
  lines_added: number;
  lines_removed: number;
  first_commit: string | null;
  last_commit: string | null;
  span_weeks: number;
  rework_window_days: number;
  /* Repo scopes carry these extras; org/project scopes do not. */
  url?: string;
  description?: string | null;
  default_branch?: string;
  primary_language?: string | null;
  created_at?: string;
  pushed_at?: string;
  ai_config_files?: number;
  collection_notes?: string[];
  pr_truncated?: boolean;
  structure_files_scanned?: number;
}

/* ---------------------------------------------------------------- metrics */

export interface Sample {
  n: number;
  population: number;
  unit: string;
  coverage_pct: number;
  /** Verbatim from the dataset: reason → count. */
  excluded: Record<string, number>;
  /**
   * @derived `population - n - Σexcluded`.
   *
   * The dataset itemises most but not all of the shortfall between the eligible
   * sample and the population (20 of 570 metric readings leave a remainder). The
   * build records that remainder explicitly rather than letting the breakdown fail
   * to add up — absence is never silent (SPEC §0.1, §6.6). The invariant the
   * validator enforces is `n + Σexcluded + unaccounted === population`, and an
   * `unaccounted < 0` (an impossible over-count) fails the build.
   */
  unaccounted: number;
}

export interface SourceRecord {
  kind: SourceKind;
  ref: string;
  detail: string;
  repo: string;
  url: string;
  values: Record<string, string | number>;
  occurred_at: string | null;
  /**
   * @derived id of the matching record in `evidence.json`, or `null` when this
   * record is cited only as an exemplar and therefore has no evidence page.
   */
  evidenceId: string | null;
}

export interface Exemplar {
  rank: number;
  headline: string;
  why_this_proves_it: string;
  weight: number;
  weight_unit: string;
  share_of_total_pct: number | null;
  source: SourceRecord;
}

/** One point of a metric's own sparkline (SPEC §9.2). `null` marks a gap month. */
export interface SparklinePoint {
  month: string;
  value: number | null;
}

/**
 * @derived Month-on-month restatement of the metric's last two published points
 * (SPEC §5.1.4). The only client-visible number that is not in the dataset, and it
 * is a difference of two figures that are.
 */
export interface MonthDelta {
  from: string;
  to: string;
  delta: number;
  /** e.g. `"+4.8 pts"`, `"-112 commits"`. The `m/m` label is added by the chip. */
  display: string;
  /** Colour rule: `neutral` whenever the metric's direction is neutral. */
  tone: "positive" | "negative" | "neutral";
}

export interface Metric {
  id: string;
  label: string;
  value: number | null;
  display: string;
  unit: string;
  scope: ScopeRef;
  formula: string;
  inputs: Record<string, number | string>;
  sample: Sample;
  plain_english: string;
  why_it_matters: string;
  how_to_read: string;
  family: string;
  tier: Tier;
  confidence: Confidence;
  direction: Direction;
  assumptions: string[];
  caveats: string[];
  sources: SourceRecord[];
  exemplars: Exemplar[];
  no_sources_reason: string | null;
  /** @derived this scope publishes a monthly series for this metric. */
  hasSeries: boolean;
  /** @derived `value === null` — render `NotAvailable`, never `0` (SPEC §6.4). */
  isNA: boolean;
  /** @derived last 12 months of the metric's series, gaps preserved as `null`. */
  sparkline: SparklinePoint[] | null;
  /** @derived last-month-vs-previous-month delta, or `null` without a series. */
  mom: MonthDelta | null;
}

/* ----------------------------------------------------------- series etc. */

export interface SeriesPoint {
  month: string;
  /**
   * `null` for a month the scope recorded nothing in — 180 of this edition's 1,134
   * points. The dataset states the month and withholds the figure rather than
   * writing a zero, so charts must render it as a gap: `connectNulls` stays false
   * and the point is omitted, never plotted at 0 (SPEC §0.1, §6.8).
   */
  value: number | null;
  detail: Record<string, number>;
}

export interface Series {
  id: string;
  label: string;
  unit: string;
  metric_id: string;
  note: string;
  points: SeriesPoint[];
}

export interface Heatmap {
  /** 7 rows (Mon–Sun) × 24 columns (hours), counts of commits. */
  grid: number[][];
  total: number;
  weekdays: string[];
  note: string;
}

export interface ComparisonRow {
  metric_id: string;
  label: string;
  direction: Direction;
  unit: string;
  before: number;
  before_display: string;
  after: number;
  after_display: string;
  change_pct: number | null;
  change_points: number | null;
  confidence: Confidence;
}

export interface Comparison {
  split_at: string;
  split_reason: string;
  before_label: string;
  after_label: string;
  before_commits: number;
  after_commits: number;
  rows: ComparisonRow[];
  caveat: string;
}

/* --------------------------------------------------------- scope reports */

export interface ScopeReport {
  scope: ScopeRefResolved;
  facts: ScopeFacts;
  metrics: Metric[];
  series: Series[];
  heatmap: Heatmap;
  comparison: Comparison;
  children: ScopeKey[];
}

/* ------------------------------------------------------------- headlines */

export interface Headline {
  severity: Severity;
  title: string;
  detail: string;
  action: string;
  metric_id: string;
  scope_key: ScopeKey;
  value_display: string;
  rule_comparison: string;
  rule_threshold: number;
  ruleset_version: string;
}

/**
 * @derived The rule that came closest to firing in a scope where none did, used by
 * the Finding hero's empty variant (SPEC §5.1.3). Rules are the distinct
 * `(metric_id, comparison, threshold)` triples the edition's headlines declare.
 */
export interface NearestThreshold {
  metricId: string;
  label: string;
  comparison: string;
  threshold: number;
  value: number;
  display: string;
  /** Absolute distance from the threshold in the metric's own units. */
  distance: number;
}

/* -------------------------------------------------------------- glossary */

export interface FamilyGloss {
  label: string;
  blurb: string;
  metric_ids: string[];
}

export interface MetricDefinition {
  id: string;
  label: string;
  unit: string;
  family: string;
  family_label: string;
  tier: Tier;
  direction: Direction;
  confidence: Confidence;
  plain_english: string;
  why_it_matters: string;
  how_to_read: string;
  formula: string;
  assumptions: string[];
  caveats: string[];
  also_known_as: string[];
}

export interface Glossary {
  families: Record<string, FamilyGloss>;
  definitions: MetricDefinition[];
}

/**
 * The glossary definition as `edition.json` carries it.
 *
 * The four prose fields and the assumption/caveat lists are dropped from the
 * edition file because every scope report already carries them verbatim on the
 * metric itself, with real values substituted — reading the generic version would
 * be reading a worse copy. What survives is what the command palette and the
 * family grouping need before any scope file has loaded (SPEC §3.3, §5.3).
 */
export type MetricDefinitionBrief = Pick<
  MetricDefinition,
  | "id"
  | "label"
  | "unit"
  | "family"
  | "family_label"
  | "tier"
  | "direction"
  | "confidence"
  | "also_known_as"
>;

export interface EditionGlossary {
  families: Record<string, FamilyGloss>;
  definitions: MetricDefinitionBrief[];
}

/* ------------------------------------------------ collection / integrity */

export interface MergeExample {
  person: string;
  emails: string[];
}

export interface IdentityResolution {
  people: number;
  bots_excluded: number;
  identities_merged: number;
  merge_examples: MergeExample[];
}

export interface Collection {
  started_at: string;
  finished_at: string;
  duration_seconds: number;
  repos_collected: number;
  repos_failed: number;
  graphql_calls: number;
  rest_calls: number;
  llm_calls: number;
  llm_cost_usd: number;
  identity_resolution: IdentityResolution;
}

export interface StructuralLimit {
  title: string;
  detail: string;
}

export interface CoverageNotes {
  repos_collected: number;
  repos_failed: number;
  pull_requests_truncated_in: string[];
  structure_scan_missing_in: string[];
  no_ci_data_in: string[];
  no_review_records_in: string[];
  total_lines_excluded_as_generated: number;
}

export interface DataQuality {
  confidence_legend: Record<Confidence, string>;
  tier_legend: Record<Tier, string>;
  structural_limits: StructuralLimit[];
  coverage: CoverageNotes;
  native_analytics: Record<string, unknown> | null;
  governance_note: string;
}

export interface ExclusionPath {
  path: string;
  lines: number;
}

export interface Exclusions {
  by_reason: Record<string, number>;
  lines_by_reason: Record<string, number>;
  total_lines_excluded: number;
  top_paths: ExclusionPath[];
}

/** The rulebook's declared parameters (SPEC §5.11.5). */
export type Thresholds = Record<string, number>;

/* ------------------------------------------------------------ navigation */

export interface NavRepo {
  key: ScopeKey;
  label: string;
  slug: ScopeSlug;
  owner: string;
  name: string;
  path: string;
}

export interface NavProject {
  key: ScopeKey;
  label: string;
  slug: ScopeSlug;
  path: string;
  repos: NavRepo[];
}

export interface NavOrg {
  key: ScopeKey;
  label: string;
  slug: ScopeSlug;
  path: string;
}

export interface Navigation {
  org: NavOrg;
  projects: NavProject[];
}

/* --------------------------------------------------------------- edition */

/** The lean per-metric row that powers every table and card (SPEC §9.1). */
export interface MetricSummary {
  id: string;
  label: string;
  family: string;
  unit: string;
  display: string;
  value: number | null;
  tier: Tier;
  confidence: Confidence;
  direction: Direction;
  coverage_pct: number;
  hasSeries: boolean;
  isNA: boolean;
}

export interface ScopeSummary {
  scope: ScopeRefResolved;
  facts: ScopeFacts;
  children: ScopeKey[];
  metrics: MetricSummary[];
  /** @derived SPEC §5.6 — restates the rulebook, invents no judgement. */
  status: StatusLevel;
  /** @derived indices into `Edition.headlines` whose `scope_key` is this scope. */
  findingIndices: number[];
  /** @derived indices for this scope and everything beneath it. */
  subtreeFindingIndices: number[];
  /** @derived non-null only when `subtreeFindingIndices` is empty (SPEC §5.1.3). */
  nearestThreshold: NearestThreshold | null;
  /** @derived tier legend counts for the Metrics index lede (SPEC §5.3). */
  tierCounts: Record<Tier, number>;
}

export interface EvidenceCounts {
  total: number;
  byKind: Record<SourceKind, number>;
}

/**
 * The fields of a metric that are identical in every scope — its identity rather
 * than its reading. Hoisted out of the per-scope summaries so `edition.json` states
 * them once instead of ten times (SPEC §9.1's ~120 KB budget, §11.8's 150 KB gate).
 */
export type MetricCatalogEntry = Pick<
  MetricSummary,
  "id" | "label" | "family" | "unit" | "direction"
>;

export interface EditionCommon {
  schema_version: string;
  generated_at: string;
  org_label: string;
  root_scope: ScopeKey;
  navigation: Navigation;
  /** @derived navigation order: org, then each project followed by its repos. */
  scopeOrder: ScopeKey[];
  /** @derived scope key → slug. */
  slugByKey: Record<ScopeKey, ScopeSlug>;
  /** @derived slug → scope key. */
  keyBySlug: Record<ScopeSlug, ScopeKey>;
  headlines: Headline[];
  glossary: EditionGlossary;
  thresholds: Thresholds;
  collection: Collection;
  data_quality: DataQuality;
  exclusions: Exclusions;
  /** @derived the 57 metrics' scope-invariant identity fields, stated once. */
  metricCatalog: MetricCatalogEntry[];
  /** @derived headline counts for the Evidence index lede, before evidence.json loads. */
  evidenceCounts: EvidenceCounts;
}

/**
 * The edition as every screen consumes it: `useEdition()` returns this, with the
 * per-scope metric summaries already rehydrated from the catalog.
 */
export interface Edition extends EditionCommon {
  /** @derived per-scope summaries (SPEC §9.1). */
  scopeSummaries: Record<ScopeKey, ScopeSummary>;
}

/**
 * One metric reading as `edition.json` stores it: a fixed-order row rather than an
 * object, because the twelve repeated key names cost more bytes than the values do
 * across 570 readings. `PACKED_SUMMARY_COLUMNS` is the column order and
 * `unpackMetricSummary` is the only thing that should ever read it.
 */
export type PackedMetricSummary = [
  id: string,
  display: string,
  value: number | null,
  tier: Tier,
  confidence: Confidence,
  coverage_pct: number,
  hasSeries: boolean,
  isNA: boolean,
];

export interface ScopeSummaryPacked extends Omit<ScopeSummary, "metrics"> {
  metrics: PackedMetricSummary[];
}

/** The literal shape of `data/edition.json` on disk. */
export interface EditionFile extends EditionCommon {
  scopeSummaries: Record<ScopeKey, ScopeSummaryPacked>;
}

/* -------------------------------------------------------------- evidence */

export interface EvidenceCitation {
  scopeKey: ScopeKey;
  metricId: string;
}

export interface EvidenceRecord {
  id: string;
  kind: SourceKind;
  repo: string;
  ref: string;
  detail: string;
  values: Record<string, string | number>;
  occurred_at: string | null;
  url: string;
  /** @derived every (scope, metric) that counted this record. */
  citedIn: EvidenceCitation[];
}

export interface EvidenceIndex {
  generated_at: string;
  total: number;
  byKind: Record<SourceKind, number>;
  records: EvidenceRecord[];
}

/* ------------------------------------------------------- the source file */

/** The shape of `data/cohort.json` as read by the build — pre-derivation. */
export interface RawSourceRecord extends Omit<SourceRecord, "evidenceId"> {}
export interface RawExemplar extends Omit<Exemplar, "source"> {
  source: RawSourceRecord;
}
export interface RawSample extends Omit<Sample, "unaccounted"> {}
export interface RawMetric
  extends Omit<
    Metric,
    | "sample"
    | "sources"
    | "exemplars"
    | "hasSeries"
    | "isNA"
    | "sparkline"
    | "mom"
  > {
  sample: RawSample;
  sources: RawSourceRecord[];
  exemplars: RawExemplar[];
}
export interface RawScope {
  scope: ScopeRef;
  facts: ScopeFacts;
  metrics: RawMetric[];
  series: Series[];
  heatmap: Heatmap;
  comparison: Comparison;
  children: ScopeKey[];
}
export interface RawNavigation {
  projects: {
    key: ScopeKey;
    label: string;
    repos: { key: ScopeKey; label: string }[];
  }[];
}
export interface Cohort {
  schema_version: string;
  generated_at: string;
  org_label: string;
  root_scope: ScopeKey;
  navigation: RawNavigation;
  headlines: Headline[];
  glossary: Glossary;
  collection: Collection;
  data_quality: DataQuality;
  exclusions: Exclusions;
  thresholds: Thresholds;
  scopes: Record<ScopeKey, RawScope>;
}
