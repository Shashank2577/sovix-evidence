/**
 * `mini-cohort` with one deliberate violation per validator rule (SPEC §9.4).
 *
 * Each corruption is named, so a test can assert that the specific rule fired
 * rather than settling for "something failed". `corrupt-cohort.json` is the
 * serialised output of `corruptCohort()`; regenerate it with:
 *
 *   tsx scripts/__fixtures__/write-corrupt.mts
 */

import type { Cohort } from "../../client/src/data/types.ts";
import { miniCohort } from "./mini-cohort.ts";

export const CORRUPTIONS = [
  "sample-arithmetic: itemised exclusions over-count the population",
  "sample-coverage: coverage_pct no longer restates n/population",
  "unexplained-absence: a null value with neither a caveat nor a zero sample",
  "series-window: a monthly point outside the scope's own window",
  "series-metric: a series pointing at a metric the scope does not publish",
  "comparison-metric: a before/after row citing an unknown metric",
  "headline-scope: a finding targeting a scope this edition does not publish",
  "headline-metric: a finding citing a metric its scope does not publish",
  "floor-metric: a metric the dataset labels a floor that FLOOR_METRIC_IDS omits",
  "slug-collision: two scopes whose labels produce the same slug",
  "glossary-coverage: a metric that belongs to no glossary family",
] as const;

export function corruptCohort(): Cohort {
  const cohort = miniCohort();
  const org = cohort.scopes["org:all"];
  const repo = cohort.scopes["repo:acme/widget"];

  // sample-arithmetic — 20 + 10 exceeds a population of 25.
  org.metrics.find(
    metric => metric.id === "process.review_coverage"
  )!.sample.excluded = {
    "pull requests not merged": 10,
  };

  // sample-coverage — the stated coverage stops matching n/population.
  org.metrics.find(
    metric => metric.id === "ai.adopter_share"
  )!.sample.coverage_pct = 12.5;

  // unexplained-absence — a null value that explains nothing.
  const absent = org.metrics.find(
    metric => metric.id === "ai.native_acceptance_rate"
  )!;
  absent.caveats = [];
  absent.sample = {
    ...absent.sample,
    n: 10,
    population: 10,
    coverage_pct: 100,
  };

  // series-window — December sits before the scope's January start.
  org.series[0].points.unshift({
    month: "2025-12",
    value: 10,
    detail: { reviewed: 1 },
  });

  // series-metric + comparison-metric — both cite a metric nobody publishes.
  repo.series[0].metric_id = "process.does_not_exist";
  repo.comparison.rows[0].metric_id = "process.does_not_exist";

  // headline-scope and headline-metric.
  cohort.headlines.push({
    ...cohort.headlines[0],
    scope_key: "repo:acme/ghost",
    title: "A finding about a scope that is not in this edition",
  });
  cohort.headlines.push({
    ...cohort.headlines[0],
    metric_id: "process.does_not_exist",
    title: "A finding about a metric that is not in this edition",
  });

  // floor-metric — the dataset calls it a floor; the client's list does not.
  org.metrics.find(metric => metric.id === "ai.tool_concentration")!.label =
    "Share of AI traces from the single most-used tool (floor)";

  // slug-collision — "acme/widget" and "acme widget" both slugify to acme-widget.
  cohort.scopes["project:acme widget"] = {
    ...cohort.scopes["project:Widgets"],
    scope: {
      ...cohort.scopes["project:Widgets"].scope,
      key: "project:acme widget",
      label: "acme widget",
    },
  };

  // glossary-coverage — drop a metric out of every family.
  cohort.glossary.families.process.metric_ids = [];

  return cohort;
}
