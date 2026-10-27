/**
 * A small, valid cohort — the control the corrupted fixture is measured against.
 *
 * A validator that only ever runs on one 4 MB file proves very little: it could be
 * passing because the rules are right, or because they never fire. This fixture is
 * small enough to reason about line by line, and `corrupt-cohort.json` is this
 * object with one deliberate violation per rule.
 */

import type {
  Cohort,
  RawMetric,
  RawScope,
  ScopeKey,
} from "../../client/src/data/types.ts";

const WINDOW = {
  since: "2026-01-04T09:00:00+00:00",
  until: "2026-03-20T17:00:00+00:00",
};

interface MetricSeed {
  id: string;
  label: string;
  family: string;
  unit: string;
  value: number | null;
  display: string;
  n: number;
  population: number;
  excluded?: Record<string, number>;
  caveats?: string[];
}

const SEEDS: MetricSeed[] = [
  {
    id: "process.review_coverage",
    label: "Share of merged changes with a recorded review",
    family: "process",
    unit: "percent",
    value: 40,
    display: "40.0%",
    n: 20,
    population: 25,
    excluded: { "pull requests not merged": 5 },
  },
  {
    id: "ai.detected_commit_share",
    label: "Commits carrying an AI-tool trace (floor)",
    family: "ai",
    unit: "percent",
    value: 3.5,
    display: "3.5%",
    n: 200,
    population: 200,
  },
  {
    id: "ai.detected_line_share",
    label: "Lines arriving in AI-traced commits (floor)",
    family: "ai",
    unit: "percent",
    value: 2.1,
    display: "2.1%",
    n: 200,
    population: 200,
  },
  {
    id: "ai.adopter_share",
    label: "Contributors with any AI-traced commit",
    family: "ai",
    unit: "percent",
    value: 8,
    display: "8.0%",
    n: 25,
    population: 25,
  },
  {
    id: "ai.tool_concentration",
    label: "Share of AI traces from the single most-used tool",
    family: "ai",
    unit: "percent",
    value: 70,
    display: "70.0%",
    n: 7,
    population: 7,
  },
  {
    id: "ai.rework_delta",
    label: "Rework gap between AI-traced and untraced work",
    family: "ai",
    unit: "percent",
    value: -1.5,
    display: "-1.5%",
    n: 200,
    population: 200,
  },
  {
    id: "ai.test_ratio_delta",
    label: "Test-ratio gap between AI-traced and untraced work",
    family: "ai",
    unit: "percent",
    value: -4,
    display: "-4.0%",
    n: 200,
    population: 200,
  },
  {
    id: "ai.commit_size_delta",
    label: "Size gap between AI-traced and untraced commits",
    family: "ai",
    unit: "percent",
    value: 30,
    display: "30.0%",
    n: 180,
    population: 200,
    caveats: [
      "Computed over 180 of 200 commits (90% coverage) — see the exclusion list.",
    ],
  },
  {
    id: "ai.native_acceptance_rate",
    label: "Share of AI suggestions actually accepted",
    family: "ai",
    unit: "percent",
    value: null,
    display: "not available",
    n: 0,
    population: 0,
  },
];

function metric(
  seed: MetricSeed,
  scopeKey: ScopeKey,
  scopeLabel: string
): RawMetric {
  const excluded = seed.excluded ?? {};
  const coverage =
    seed.population === 0
      ? 0
      : Math.round((seed.n / seed.population) * 10000) / 100;
  return {
    id: seed.id,
    label: seed.label,
    value: seed.value,
    display: seed.display,
    unit: seed.unit,
    scope: {
      level: "org",
      key: scopeKey,
      label: scopeLabel,
      ...WINDOW,
      repos: ["acme/widget"],
    },
    formula: `${seed.n} of ${seed.population} = ${seed.display}`,
    inputs: { n: seed.n, population: seed.population },
    sample: {
      n: seed.n,
      population: seed.population,
      unit: "records",
      coverage_pct: coverage,
      excluded,
    },
    plain_english: "A short sentence.",
    why_it_matters: "A reason.",
    how_to_read: "A reading.",
    family: seed.family,
    tier: "measured",
    confidence: "high",
    direction: seed.family === "ai" ? "neutral" : "higher_is_better",
    assumptions: [],
    caveats: seed.caveats ?? ["A caveat."],
    sources: [
      {
        kind: "pull_request",
        ref: "#1",
        detail: "merged with no recorded review",
        repo: "acme/widget",
        url: "https://github.com/acme/widget/pull/1",
        values: { title: "Add widget", author: "ada", lines: 12 },
        occurred_at: "2026-02-01T10:00:00+00:00",
      },
      {
        kind: "commit",
        ref: "abc1234",
        detail: "touched three files",
        repo: "acme/widget",
        url: "https://github.com/acme/widget/commit/abc1234",
        values: { author: "grace", lines: 40 },
        occurred_at: "2026-02-08T11:00:00+00:00",
      },
    ],
    exemplars: [
      {
        rank: 1,
        headline: "acme/widget #1 — 12 lines merged with no review",
        why_this_proves_it:
          "Twelve lines entered the product with no second pair of eyes.",
        weight: 12,
        weight_unit: "lines merged unreviewed",
        share_of_total_pct: null,
        source: {
          kind: "pull_request",
          ref: "#1",
          detail: "merged 12 lines with no review recorded",
          repo: "acme/widget",
          url: "https://github.com/acme/widget/pull/1",
          values: {
            title: "Add widget",
            author: "ada",
            lines: 12,
            merged_by: "grace",
          },
          occurred_at: "2026-02-01T10:00:00+00:00",
        },
      },
    ],
    no_sources_reason: null,
  };
}

function scope(key: ScopeKey, label: string, children: ScopeKey[]): RawScope {
  return {
    scope: {
      level: key.startsWith("org:")
        ? "org"
        : key.startsWith("project:")
          ? "project"
          : "repo",
      key,
      label,
      ...WINDOW,
      repos: ["acme/widget"],
    },
    facts: {
      commits: 200,
      merge_commits: 10,
      pull_requests: 25,
      merged_pull_requests: 20,
      open_pull_requests: 3,
      reviews: 8,
      branches: 4,
      workflow_runs: 30,
      contributors: 25,
      repos: ["acme/widget"],
      lines_added: 5000,
      lines_removed: 1200,
      first_commit: WINDOW.since,
      last_commit: WINDOW.until,
      span_weeks: 11,
      rework_window_days: 21,
    },
    metrics: SEEDS.map(seed => metric(seed, key, label)),
    series: [
      {
        id: "review_coverage",
        label: "Review coverage per month",
        unit: "percent",
        metric_id: "process.review_coverage",
        note: "",
        points: [
          { month: "2026-01", value: 30, detail: { reviewed: 3 } },
          { month: "2026-02", value: 45, detail: { reviewed: 9 } },
          { month: "2026-03", value: 40, detail: { reviewed: 8 } },
        ],
      },
    ],
    heatmap: {
      grid: Array.from({ length: 7 }, () =>
        Array.from({ length: 24 }, () => 1)
      ),
      total: 168,
      weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      note: "Local time as recorded by each author's own machine.",
    },
    comparison: {
      split_at: "2026-02-10T00:00:00+00:00",
      split_reason: "Split at the median commit date.",
      before_label: "Before 10 Feb 2026",
      after_label: "From 10 Feb 2026",
      before_commits: 100,
      after_commits: 100,
      rows: [
        {
          metric_id: "process.review_coverage",
          label: "Share of merged changes with a recorded review",
          direction: "higher_is_better",
          unit: "percent",
          before: 35,
          before_display: "35.0%",
          after: 42,
          after_display: "42.0%",
          change_pct: null,
          change_points: 7,
          confidence: "high",
        },
      ],
      caveat:
        "A change here is a correlation across two time periods, not a cause.",
    },
    children,
  };
}

export function miniCohort(): Cohort {
  return {
    schema_version: "1.0",
    generated_at: "2026-03-21T00:00:00+00:00",
    org_label: "All repositories",
    root_scope: "org:all",
    navigation: {
      projects: [
        {
          key: "project:Widgets",
          label: "Widgets",
          repos: [{ key: "repo:acme/widget", label: "acme/widget" }],
        },
      ],
    },
    headlines: [
      {
        severity: "critical",
        title: "Most changes reach production without a review",
        detail: "Here it is 40.0%.",
        action: "Turn on branch protection requiring one approving review.",
        metric_id: "process.review_coverage",
        scope_key: "repo:acme/widget",
        value_display: "40.0%",
        rule_comparison: "<",
        rule_threshold: 50,
        ruleset_version: "rtest0001",
      },
    ],
    glossary: {
      families: {
        process: {
          label: "Process",
          blurb: "How change moves.",
          metric_ids: ["process.review_coverage"],
        },
        ai: {
          label: "AI involvement",
          blurb: "Floors, never measurements.",
          metric_ids: SEEDS.filter(seed => seed.family === "ai").map(
            seed => seed.id
          ),
        },
      },
      definitions: SEEDS.map(seed => ({
        id: seed.id,
        label: seed.label,
        unit: seed.unit,
        family: seed.family,
        family_label: seed.family === "ai" ? "AI involvement" : "Process",
        tier: "measured",
        direction: seed.family === "ai" ? "neutral" : "higher_is_better",
        confidence: "high",
        plain_english: "A short sentence.",
        why_it_matters: "A reason.",
        how_to_read: "A reading.",
        formula: "{n} of {population}",
        assumptions: [],
        caveats: ["A caveat."],
        also_known_as: [],
      })),
    },
    collection: {
      started_at: "2026-03-20T23:55:00+00:00",
      finished_at: "2026-03-21T00:00:00+00:00",
      duration_seconds: 300,
      repos_collected: 1,
      repos_failed: 0,
      graphql_calls: 9,
      rest_calls: 2,
      llm_calls: 0,
      llm_cost_usd: 0,
      identity_resolution: {
        people: 25,
        bots_excluded: 1,
        identities_merged: 0,
        merge_examples: [],
      },
    },
    data_quality: {
      confidence_legend: {
        high: "Directly counted.",
        medium: "Counted, resting on a convention.",
        low: "A proxy.",
      },
      tier_legend: {
        measured: "Counted directly.",
        proxy: "Derived from a convention.",
        inferred: "Read from optional signals.",
      },
      structural_limits: [
        {
          title: "AI involvement is a floor",
          detail: "Traces can be switched off.",
        },
      ],
      coverage: {
        repos_collected: 1,
        repos_failed: 0,
        pull_requests_truncated_in: [],
        structure_scan_missing_in: [],
        no_ci_data_in: [],
        no_review_records_in: [],
        total_lines_excluded_as_generated: 1000,
      },
      native_analytics: null,
      governance_note:
        "Per-person metrics change behaviour; this edition publishes none.",
    },
    exclusions: {
      by_reason: { "dependency lock file": 3 },
      lines_by_reason: { "dependency lock file": 900 },
      total_lines_excluded: 900,
      top_paths: [{ path: "package-lock.json", lines: 900 }],
    },
    thresholds: { large_pr_lines: 400, stale_pr_days: 30 },
    scopes: {
      "org:all": scope("org:all", "All repositories", ["project:Widgets"]),
      "project:Widgets": scope("project:Widgets", "Widgets", [
        "repo:acme/widget",
      ]),
      "repo:acme/widget": scope("repo:acme/widget", "acme/widget", []),
    },
  };
}
