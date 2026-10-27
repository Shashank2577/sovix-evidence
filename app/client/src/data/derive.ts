/**
 * Build-time derivations (SPEC §9.2) — pure, and shared with the client so the
 * same rule runs in both places.
 *
 * Nothing here invents a measurement. Each function either restates figures the
 * dataset already published (the m/m delta, the sparkline) or restates a rule
 * outcome the rulebook already produced (the status pill).
 */

import type {
  Direction,
  Headline,
  MonthDelta,
  NearestThreshold,
  ScopeKey,
  Series,
  SparklinePoint,
  StatusLevel,
  Tier,
} from "./types";

/* --------------------------------------------------------------- floors */

/**
 * The three AI figures that are floors, never measurements (SPEC §0.1, §6.3).
 *
 * Git records who committed a change, not who wrote each line; these three count
 * only the commits where a tool chose to leave a suppressible trace, so the true
 * figure is higher by an unknown margin and the client prefixes them with `≥`.
 *
 * Deliberately NOT floors: `ai.tool_concentration` is a share *of the traced work
 * only*, and the three `ai.*_delta` metrics are differences between the traced and
 * untraced cohorts. A `≥` on either would be a false claim about a different
 * quantity. The validator asserts this list against the dataset's ai family.
 */
export const FLOOR_METRIC_IDS = [
  "ai.detected_commit_share",
  "ai.detected_line_share",
  "ai.adopter_share",
] as const;

const FLOOR_SET: ReadonlySet<string> = new Set(FLOOR_METRIC_IDS);

/** Metric ids in the ai family that must never carry the `≥` prefix (SPEC §0.1). */
export const NON_FLOOR_AI_METRIC_IDS = [
  "ai.tool_concentration",
  "ai.rework_delta",
  "ai.test_ratio_delta",
  "ai.commit_size_delta",
] as const;

export function isFloorMetric(metricId: string): boolean {
  return FLOOR_SET.has(metricId);
}

/* --------------------------------------------------------------- status */

const SEVERITY_RANK = { critical: 3, warning: 2, info: 1 } as const;

/**
 * The scope table's status pill (SPEC §5.6): `critical` if any critical finding
 * targets the scope, `watch` if any warning does, `healthy` otherwise — info
 * findings alone stay healthy. Derived from the findings that fired; never stored,
 * never a score, never a grade.
 */
export function deriveStatus(headlines: Headline[]): StatusLevel {
  let worst = 0;
  for (const headline of headlines) {
    worst = Math.max(worst, SEVERITY_RANK[headline.severity] ?? 0);
  }
  if (worst === SEVERITY_RANK.critical) return "critical";
  if (worst === SEVERITY_RANK.warning) return "watch";
  return "healthy";
}

/* ------------------------------------------------------- months & series */

/** `"2026-09-12T07:51:27+02:00"` → `"2026-09"`. */
export function monthOf(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 7);
}

/** Inclusive list of `YYYY-MM` months from `from` to `to`. */
export function monthRange(from: string, to: string): string[] {
  const [fromYear, fromMonth] = from.split("-").map(Number);
  const [toYear, toMonth] = to.split("-").map(Number);
  const months: string[] = [];
  let year = fromYear;
  let month = fromMonth;
  while (year < toYear || (year === toYear && month <= toMonth)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

/**
 * The last `count` months of a series as sparkline points. Months the scope's
 * window covers but the series never recorded stay `null` — a gap is a gap, never
 * a zero (SPEC §0.1, §6.8).
 */
export function sparklineFrom(
  series: Series,
  since: string,
  until: string,
  count = 12
): SparklinePoint[] {
  const byMonth = new Map(
    series.points.map(point => [point.month, point.value])
  );
  const months = monthRange(monthOf(since), monthOf(until));
  return months
    .slice(-count)
    .map(month => ({ month, value: byMonth.get(month) ?? null }));
}

/* ------------------------------------------------------------ m/m deltas */

function formatDelta(delta: number, unit: string): string {
  /* ASCII hyphen, matching the sign the dataset's own display strings use. */
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
  const magnitude = Math.abs(delta);
  const rounded =
    magnitude >= 100 ? Math.round(magnitude) : Math.round(magnitude * 10) / 10;
  const noun = unit === "percent" ? "pts" : unit;
  return `${sign}${rounded.toLocaleString("en-GB")} ${noun}`;
}

/**
 * Last month against the month before it, from the metric's own published points
 * (SPEC §5.1.4, §9.2). The only client-visible number absent from the dataset, and
 * it is a subtraction of two numbers that are in it.
 *
 * Returns `null` when the series has fewer than two points, when the last two
 * points are not consecutive months, or when either carries no figure — a delta
 * across a gap would compare figures the reader cannot see side by side, and a gap
 * month is not a zero.
 *
 * `tone` is `neutral` whenever the metric's direction is neutral; the copy never
 * says better or worse either way (SPEC §0.1).
 */
export function monthDelta(
  series: Series,
  direction: Direction
): MonthDelta | null {
  const points = series.points;
  if (points.length < 2) return null;
  const previous = points[points.length - 2];
  const latest = points[points.length - 1];
  const expected = monthRange(previous.month, latest.month);
  if (expected.length !== 2) return null;
  /* A month the scope recorded nothing in has no figure to subtract. */
  if (previous.value === null || latest.value === null) return null;

  const delta = Math.round((latest.value - previous.value) * 100) / 100;
  let tone: MonthDelta["tone"] = "neutral";
  if (direction !== "neutral" && delta !== 0) {
    const withDirection =
      direction === "higher_is_better" ? delta > 0 : delta < 0;
    tone = withDirection ? "positive" : "negative";
  }
  return {
    from: previous.month,
    to: latest.month,
    delta,
    display: formatDelta(delta, series.unit),
    tone,
  };
}

/* ------------------------------------------------- nearest-to-threshold */

export interface Rule {
  metricId: string;
  comparison: string;
  threshold: number;
}

/** The distinct rules this edition's headlines declare (SPEC §5.1.3). */
export function rulesFromHeadlines(headlines: Headline[]): Rule[] {
  const seen = new Map<string, Rule>();
  for (const headline of headlines) {
    const rule: Rule = {
      metricId: headline.metric_id,
      comparison: headline.rule_comparison,
      threshold: headline.rule_threshold,
    };
    seen.set(`${rule.metricId}|${rule.comparison}|${rule.threshold}`, rule);
  }
  return Array.from(seen.values());
}

function fires(rule: Rule, value: number): boolean {
  switch (rule.comparison) {
    case "<":
      return value < rule.threshold;
    case "<=":
      return value <= rule.threshold;
    case ">":
      return value > rule.threshold;
    case ">=":
      return value >= rule.threshold;
    default:
      throw new Error(`Unrecognised rule comparison: ${rule.comparison}`);
  }
}

/**
 * The rule that came closest to firing without firing, for the Finding hero's
 * empty variant (SPEC §5.1.3). Distances are normalised by the threshold so rules
 * in different units can be ranked against each other; the reported `distance`
 * stays in the metric's own units.
 */
export function nearestThreshold(
  rules: Rule[],
  metrics: {
    id: string;
    label: string;
    value: number | null;
    display: string;
  }[]
): NearestThreshold | null {
  const byId = new Map(metrics.map(metric => [metric.id, metric]));
  let best: NearestThreshold | null = null;
  let bestNormalised = Number.POSITIVE_INFINITY;

  for (const rule of rules) {
    const metric = byId.get(rule.metricId);
    if (!metric || metric.value === null) continue;
    if (fires(rule, metric.value)) continue;

    const distance = Math.abs(metric.value - rule.threshold);
    const normalised =
      rule.threshold === 0 ? distance : distance / Math.abs(rule.threshold);
    if (normalised < bestNormalised) {
      bestNormalised = normalised;
      best = {
        metricId: metric.id,
        label: metric.label,
        comparison: rule.comparison,
        threshold: rule.threshold,
        value: metric.value,
        display: metric.display,
        distance: Math.round(distance * 100) / 100,
      };
    }
  }
  return best;
}

/* ------------------------------------------------------------ tier tally */

export function tierCounts(metrics: { tier: Tier }[]): Record<Tier, number> {
  const counts: Record<Tier, number> = { measured: 0, proxy: 0, inferred: 0 };
  for (const metric of metrics) counts[metric.tier] += 1;
  return counts;
}

/* ---------------------------------------------------- headline indexing */

/** Indices into `headlines` whose `scope_key` matches exactly. */
export function findingIndicesFor(
  headlines: Headline[],
  scopeKey: ScopeKey
): number[] {
  const indices: number[] = [];
  headlines.forEach((headline, index) => {
    if (headline.scope_key === scopeKey) indices.push(index);
  });
  return indices;
}
