/**
 * The Overview's own selections (SPEC §5.1), kept pure so they can be tested
 * against the real edition rather than asserted through markup.
 *
 * Nothing here computes a figure. Each function picks *which* of the edition's
 * published readings a slot shows; the reading itself is always the dataset's own
 * `display` string, rendered untouched at the call site (§9.2, §9.8).
 */

import type {
  Edition,
  Exemplar,
  Headline,
  Metric,
  ScopeLevel,
  ScopeReport,
  ScopeSummary,
  Severity,
} from "@/data";

/* --------------------------------------------------------------- greeting */

export type Greeting = "morning" | "afternoon" | "evening";

/** §5.1.1 — time of day from the client clock, not from the edition. */
export function greetingFor(date: Date): Greeting {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/* ---------------------------------------------------------- signal cards */

/**
 * §5.1.4 — the four fixed picks, chosen for audience value and because all four
 * publish a monthly series, so every sparkline on the screen is a real one.
 */
export const SIGNAL_METRIC_IDS = [
  "process.review_coverage",
  "delivery.lead_time_p50",
  "quality.rework_rate",
  "ai.detected_commit_share",
] as const;

/** §5.1.4 — what a repository shows in place of an AI share it cannot report. */
export const REPO_SIGNAL_FALLBACK = "people.active_contributors";

/**
 * The four metrics this scope's readout shows.
 *
 * A repository whose AI share is unavailable — or computed over no commits at all —
 * swaps that card for its active contributors. The point is not to avoid an empty
 * card: `NotAvailable` would render perfectly well there. It is that a repository's
 * reader has four slots and this one would spend a quarter of them on a reading the
 * edition has nothing to say about (§5.1.4).
 */
export function signalMetricIds(
  level: ScopeLevel,
  byId: Map<string, Metric>
): string[] {
  const ids: string[] = [...SIGNAL_METRIC_IDS];
  if (level === "repo") {
    const ai = byId.get("ai.detected_commit_share");
    if (!ai || ai.isNA || ai.sample.n === 0) {
      ids[ids.length - 1] = REPO_SIGNAL_FALLBACK;
    }
  }
  return ids.filter(id => byId.has(id));
}

/* ------------------------------------------------------------ finding hero */

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

/**
 * §5.1.3 — every finding in this scope's subtree, strongest first.
 *
 * The hero shows the first of these and the pager walks the rest. Ties keep the
 * order the edition published them in: the rulebook's order is data, and
 * re-sorting inside a severity would be this screen inventing a precedence the
 * ruleset never declared.
 */
export function heroFindings(
  edition: Edition,
  summary: ScopeSummary
): Headline[] {
  return summary.subtreeFindingIndices
    .map(index => ({ index, headline: edition.headlines[index] }))
    .filter(entry => entry.headline !== undefined)
    .sort(
      (a, b) =>
        SEVERITY_RANK[b.headline.severity] -
          SEVERITY_RANK[a.headline.severity] || a.index - b.index
    )
    .map(entry => entry.headline);
}

/* ---------------------------------------------- "Inside this repository" */

export interface WeightedExemplar {
  metricId: string;
  metricLabel: string;
  family: string;
  exemplar: Exemplar;
}

/**
 * §5.1.5 — the repository's heaviest single records, across all of its metrics.
 *
 * Two rules shape the selection. Only each metric's rank-1 exemplar is eligible,
 * because a metric's second-strongest record is evidence for the same reading and
 * would crowd out a different one. And at most one record per metric family
 * survives: weights are in different units, so a raw ordering will happily stack
 * two readings of the same underlying quantity — two `people.*` line counts, say —
 * one above the other, which starts to read as a ranking of the person named in
 * both. Three families is a wider read and keeps the panel about records (§0.1).
 */
export function topExemplars(
  report: ScopeReport,
  limit = 3
): WeightedExemplar[] {
  const candidates: WeightedExemplar[] = [];
  for (const metric of report.metrics) {
    const strongest = metric.exemplars.find(exemplar => exemplar.rank === 1);
    if (!strongest) continue;
    candidates.push({
      metricId: metric.id,
      metricLabel: metric.label,
      family: metric.family,
      exemplar: strongest,
    });
  }

  candidates.sort((a, b) => b.exemplar.weight - a.exemplar.weight);

  const chosen: WeightedExemplar[] = [];
  const families = new Set<string>();
  for (const candidate of candidates) {
    if (families.has(candidate.family)) continue;
    families.add(candidate.family);
    chosen.push(candidate);
    if (chosen.length === limit) break;
  }
  return chosen;
}
