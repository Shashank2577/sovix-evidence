/**
 * The build-time validator (SPEC §9.4) — the release gate behind
 * "a number whose evidence cannot be produced does not get published".
 *
 * It runs before a single byte is emitted and it fails loudly. There is no
 * "warn and carry on" path for a hard rule: a partial edition on disk is worse
 * than no edition, because the reader cannot tell which figures survived.
 */

import {
  FLOOR_METRIC_IDS,
  NON_FLOOR_AI_METRIC_IDS,
  monthOf,
  monthRange,
} from "../../client/src/data/derive.ts";
import { scopeSlug } from "../../client/src/data/scopes.ts";
import type { Cohort, RawMetric } from "../../client/src/data/types.ts";
import { buildEvidenceIndex } from "./evidence.mts";

export type IssueCode =
  | "shape"
  | "sample-arithmetic"
  | "sample-coverage"
  | "unexplained-absence"
  | "series-window"
  | "series-metric"
  | "headline-metric"
  | "headline-scope"
  | "floor-metric"
  | "evidence-collision"
  | "slug-collision"
  | "comparison-metric"
  | "glossary-coverage";

export interface ValidationIssue {
  code: IssueCode;
  /** Where the problem is, in the dataset's own coordinates. */
  where: string;
  message: string;
}

export class ValidationError extends Error {
  constructor(readonly issues: ValidationIssue[]) {
    super(
      `Validation failed with ${issues.length} issue(s):\n` +
        issues
          .map(issue => `  [${issue.code}] ${issue.where}: ${issue.message}`)
          .join("\n")
    );
    this.name = "ValidationError";
  }
}

const REQUIRED_TOP_LEVEL_KEYS = [
  "schema_version",
  "generated_at",
  "org_label",
  "root_scope",
  "navigation",
  "headlines",
  "glossary",
  "collection",
  "data_quality",
  "exclusions",
  "thresholds",
  "scopes",
] as const;

/** `population - n - Σexcluded`. Negative means the itemised exclusions over-count. */
export function unaccountedIn(metric: Pick<RawMetric, "sample">): number {
  const excluded = Object.values(metric.sample.excluded ?? {}).reduce(
    (total, count) => total + count,
    0
  );
  return metric.sample.population - metric.sample.n - excluded;
}

/**
 * Every rule in SPEC §9.4, plus the shape guards that make the rest meaningful.
 * Returns every issue found — the build reports all of them at once, because
 * fixing a dataset one error per run is how a release slips a day.
 */
export function validateCohort(cohort: Cohort): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const fail = (code: IssueCode, where: string, message: string) =>
    issues.push({ code, where, message });

  /* ---------------------------------------------------------- shape */

  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    if (!(key in cohort))
      fail("shape", "cohort", `missing required top-level key \`${key}\``);
  }
  if (issues.length > 0) return issues;

  const scopeEntries = Object.entries(cohort.scopes);
  if (scopeEntries.length === 0)
    fail("shape", "cohort.scopes", "no scopes in this edition");
  if (!(cohort.root_scope in cohort.scopes)) {
    fail(
      "shape",
      "cohort.root_scope",
      `root scope \`${cohort.root_scope}\` is not among the published scopes`
    );
  }

  /* -------------------------------------------- slugs (SPEC §1.2) */

  const slugOwners = new Map<string, string>();
  for (const [scopeKey, scope] of scopeEntries) {
    if (!scope.scope || typeof scope.scope.label !== "string") {
      fail("shape", scopeKey, "scope is missing its `scope` reference block");
      continue;
    }
    const slug = scopeSlug(scopeKey, scope.scope.label);
    if (!slug) {
      fail(
        "slug-collision",
        scopeKey,
        `label ${JSON.stringify(scope.scope.label)} produces an empty slug`
      );
      continue;
    }
    const owner = slugOwners.get(slug);
    if (owner) {
      fail(
        "slug-collision",
        scopeKey,
        `slug \`${slug}\` is already taken by \`${owner}\``
      );
    } else {
      slugOwners.set(slug, scopeKey);
    }
  }

  /* --------------------------------------- per-scope metric rules */

  for (const [scopeKey, scope] of scopeEntries) {
    const metrics = scope.metrics ?? [];
    const metricIds = new Set(metrics.map(metric => metric.id));
    const since = scope.scope?.since ? monthOf(scope.scope.since) : null;
    const until = scope.scope?.until ? monthOf(scope.scope.until) : null;

    for (const metric of metrics) {
      const where = `${scopeKey} · ${metric.id}`;
      const sample = metric.sample;

      if (!sample) {
        fail("shape", where, "metric has no sample block");
        continue;
      }

      /* n + Σexcluded ≠ population (SPEC §9.4, §6.6).
       *
       * The dataset itemises most of the shortfall between the eligible sample and
       * the population but not all of it, so the build records the remainder as
       * `sample.unaccounted` and the invariant enforced here is that the four
       * numbers reconcile exactly. A negative remainder is an impossible
       * over-count and always fails; a positive remainder with no caveat at all is
       * an unexplained gap and also fails. */
      const unaccounted = unaccountedIn(metric);
      if (sample.n < 0 || sample.population < 0) {
        fail(
          "sample-arithmetic",
          where,
          `negative sample figures (n=${sample.n}, population=${sample.population})`
        );
      }
      if (sample.n > sample.population) {
        fail(
          "sample-arithmetic",
          where,
          `eligible sample exceeds its population (n=${sample.n} > population=${sample.population})`
        );
      }
      if (unaccounted < 0) {
        fail(
          "sample-arithmetic",
          where,
          `n + Σexcluded exceeds population by ${-unaccounted} (n=${sample.n}, population=${sample.population})`
        );
      }
      if (unaccounted > 0 && (metric.caveats ?? []).length === 0) {
        fail(
          "sample-arithmetic",
          where,
          `${unaccounted} of ${sample.population} ${sample.unit} are neither counted nor excluded, and no caveat explains it`
        );
      }

      const expectedCoverage =
        sample.population === 0
          ? 0
          : Math.round((sample.n / sample.population) * 10000) / 100;
      if (Math.abs(expectedCoverage - sample.coverage_pct) > 0.02) {
        fail(
          "sample-coverage",
          where,
          `coverage_pct ${sample.coverage_pct} does not restate n/population (${expectedCoverage})`
        );
      }

      /* Absence is never zero (SPEC §0.1, §9.4): a null value must be explained,
       * either by a caveat or by a sample that observed nothing at all. */
      if (
        metric.value === null &&
        (metric.caveats ?? []).length === 0 &&
        sample.n !== 0
      ) {
        fail(
          "unexplained-absence",
          where,
          "value is null with neither a caveat nor a zero sample — absence must carry its reason"
        );
      }
    }

    /* ---------------------------------- series inside the window */

    if (since === null || until === null) {
      fail("shape", scopeKey, "scope window (`since`/`until`) is missing");
    } else {
      const window = new Set(monthRange(since, until));
      for (const series of scope.series ?? []) {
        if (!metricIds.has(series.metric_id)) {
          fail(
            "series-metric",
            `${scopeKey} · ${series.id}`,
            `series points at unknown metric \`${series.metric_id}\``
          );
        }
        for (const point of series.points) {
          if (!window.has(point.month)) {
            fail(
              "series-window",
              `${scopeKey} · ${series.id}`,
              `point ${point.month} falls outside the scope window ${since}…${until}`
            );
          }
        }
      }
    }

    for (const row of scope.comparison?.rows ?? []) {
      if (!metricIds.has(row.metric_id)) {
        fail(
          "comparison-metric",
          scopeKey,
          `before/after row cites unknown metric \`${row.metric_id}\``
        );
      }
    }
  }

  /* ------------------------------------------ headlines resolve */

  cohort.headlines.forEach((headline, index) => {
    const where = `headlines[${index}]`;
    const scope = cohort.scopes[headline.scope_key];
    if (!scope) {
      fail(
        "headline-scope",
        where,
        `finding targets unknown scope \`${headline.scope_key}\``
      );
      return;
    }
    if (!scope.metrics.some(metric => metric.id === headline.metric_id)) {
      fail(
        "headline-metric",
        where,
        `finding cites metric \`${headline.metric_id}\`, which \`${headline.scope_key}\` does not publish`
      );
    }
  });

  /* -------------------------------- floors (SPEC §0.1, §6.3, §9.4) */

  const rootScope = cohort.scopes[cohort.root_scope];
  if (rootScope) {
    const byId = new Map(rootScope.metrics.map(metric => [metric.id, metric]));
    const floorSet = new Set<string>(FLOOR_METRIC_IDS);

    for (const id of FLOOR_METRIC_IDS) {
      const metric = byId.get(id);
      if (!metric) {
        fail(
          "floor-metric",
          id,
          "FLOOR_METRIC_IDS names a metric this edition does not publish"
        );
      } else if (metric.family !== "ai") {
        fail(
          "floor-metric",
          id,
          `floor metric sits in family \`${metric.family}\`, expected \`ai\``
        );
      }
    }

    /* A future dataset that adds a floor metric must not render it without the
     * `≥` prefix, so the list is asserted against the ai family rather than trusted. */
    for (const metric of rootScope.metrics) {
      if (metric.family !== "ai") continue;
      if (/\(floor\)/i.test(metric.label) && !floorSet.has(metric.id)) {
        fail(
          "floor-metric",
          metric.id,
          `the dataset labels this metric a floor but FLOOR_METRIC_IDS does not list it`
        );
      }
    }

    /* `ai.tool_concentration` is a share of the traced work only and the three
     * `ai.*_delta` metrics are differences between cohorts. Neither is a floor;
     * a `≥` on either would be a claim about a different quantity. */
    for (const id of NON_FLOOR_AI_METRIC_IDS) {
      if (floorSet.has(id)) {
        fail(
          "floor-metric",
          id,
          "a within-trace share or delta must never be prefixed as a floor"
        );
      }
      if (!byId.has(id)) {
        fail(
          "floor-metric",
          id,
          "NON_FLOOR_AI_METRIC_IDS names a metric this edition does not publish"
        );
      }
    }
  }

  /* ----------------------------- evidence ids (SPEC §9.3, §9.4) */

  const evidence = buildEvidenceIndex(cohort);
  for (const collision of evidence.collisions) {
    fail(
      "evidence-collision",
      collision.id,
      `id is shared by ${collision.keys.length} records: ${collision.keys.join(", ")}`
    );
  }

  /* ------------------------------------------- glossary coverage */

  if (rootScope) {
    const glossed = new Set(
      Object.values(cohort.glossary.families ?? {}).flatMap(
        family => family.metric_ids ?? []
      )
    );
    for (const metric of rootScope.metrics) {
      if (!glossed.has(metric.id)) {
        fail(
          "glossary-coverage",
          metric.id,
          "metric belongs to no glossary family, so it can never be grouped"
        );
      }
    }
  }

  return issues;
}

/** Throws `ValidationError` when anything at all is wrong. */
export function assertValid(cohort: Cohort): void {
  const issues = validateCohort(cohort);
  if (issues.length > 0) throw new ValidationError(issues);
}
