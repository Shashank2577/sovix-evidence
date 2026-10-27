/**
 * The "largest gaps" strip (SPEC §5.7).
 *
 * §5.7 is explicit that this one ranking is computed client-side from values.
 * That is the single exception to §9.2, and it is narrow on purpose:
 *
 *   - The spread is used **only to order the strip**. It is never rendered. What
 *     the strip shows is the two extreme scopes' own `display` strings, exactly
 *     as the dataset wrote them — "no invented units" (§5.7).
 *   - A metric is eligible only when **every selected scope publishes a figure**
 *     for it. A spread measured across a subset of the columns would be a gap
 *     between two scopes presented as a gap between three, and a scope that
 *     publishes nothing is not a scope sitting at the low end (§0.1, §6.4).
 *   - Metrics whose selected readings are all identical are dropped: a gap of
 *     nothing is not one of the largest gaps.
 *   - Metrics whose reading is **not a quantity** are dropped. `temporal.peak_hour`
 *     reads `"19:00–20:00 local"` — the dataset types `value` as a number, and for
 *     this one metric it is a string. Subtracting two clock bands is not a spread,
 *     and the arithmetic would produce `NaN` and take the sort with it. A reading
 *     you cannot subtract has no gap, so it is not ranked.
 *
 * The normalisation divides by the larger magnitude of the two extremes so that
 * a 4-hour spread in lead time and a 40-point spread in a percentage can be
 * ranked against each other at all. It is a sort key, not a figure.
 */

import type { Metric, ScopeKey } from "@/data";

export interface GapEnd {
  scopeKey: ScopeKey;
  scopeLabel: string;
  display: string;
}

export interface GapEntry {
  metricId: string;
  label: string;
  low: GapEnd;
  high: GapEnd;
}

export interface GapColumn {
  scopeKey: ScopeKey;
  scopeLabel: string;
  metrics: Metric[];
}

/**
 * `Metric.value` is typed `number | null`, and `temporal.peak_hour` is the one
 * reading in this edition that arrives as a string anyway. Everything downstream
 * of here does arithmetic, so the check is on the value in hand rather than on
 * what the type promises.
 */
function quantity(value: Metric["value"]): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** The five widest, or fewer when fewer qualify. */
export function largestGaps(columns: GapColumn[], limit = 5): GapEntry[] {
  if (columns.length < 2) return [];

  const byColumn = columns.map(column => ({
    column,
    metrics: new Map(column.metrics.map(metric => [metric.id, metric])),
  }));

  const ranked: { entry: GapEntry; normalised: number }[] = [];

  for (const metric of columns[0].metrics) {
    const first = quantity(metric.value);
    if (first === null) continue;

    let low = { column: columns[0], value: first, display: metric.display };
    let high = low;
    let complete = true;

    for (const { column, metrics } of byColumn.slice(1)) {
      const reading = metrics.get(metric.id);
      const value = reading ? quantity(reading.value) : null;
      if (reading === undefined || value === null) {
        complete = false;
        break;
      }
      if (value < low.value)
        low = { column, value, display: reading.display };
      if (value > high.value)
        high = { column, value, display: reading.display };
    }
    if (!complete) continue;

    const spread = high.value - low.value;
    if (spread === 0) continue;

    const scale = Math.max(Math.abs(high.value), Math.abs(low.value));
    const normalised = scale === 0 ? spread : spread / scale;

    ranked.push({
      normalised,
      entry: {
        metricId: metric.id,
        label: metric.label,
        low: {
          scopeKey: low.column.scopeKey,
          scopeLabel: low.column.scopeLabel,
          display: low.display,
        },
        high: {
          scopeKey: high.column.scopeKey,
          scopeLabel: high.column.scopeLabel,
          display: high.display,
        },
      },
    });
  }

  /* Ties break on metric id so the strip is stable across renders rather than
     depending on whatever order the sort happened to leave equal keys in. */
  ranked.sort(
    (a, b) =>
      b.normalised - a.normalised ||
      a.entry.metricId.localeCompare(b.entry.metricId)
  );

  return ranked.slice(0, limit).map(item => item.entry);
}
