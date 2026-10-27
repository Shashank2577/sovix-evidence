/**
 * Axis domains and gap-aware segmentation (SPEC §6.8).
 *
 * The y-domain decision, restated from the spec so the reasoning travels with the
 * code: counts, lines, percentages and headcounts are anchored at zero, because
 * for those the distance from nothing is the magnitude the reader is judging. Hour
 * and duration metrics are anchored at the data, because zero hours to merge is
 * not a meaningful floor and pinning the axis there flattens every real movement
 * into a line along the top. Either way the axis is labelled, so nothing is
 * implied that the ticks do not state.
 */

import { monthOf, monthRange, type SparklinePoint } from "@/data";

/** Units whose axis starts at zero. Everything else anchors to its own data. */
const ZERO_ANCHORED = new Set(["percent", "commits", "lines", "people"]);

export function isZeroAnchored(unit: string): boolean {
  return ZERO_ANCHORED.has(unit);
}

const STEPS = [1, 2, 2.5, 5, 10];

/** Round `value` down to the previous 1/2/2.5/5/10 × 10ⁿ. */
function niceFloor(value: number): number {
  if (value <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  let best = 0;
  for (const step of STEPS) {
    const candidate = step * magnitude;
    if (candidate <= value) best = candidate;
  }
  return best;
}

/** The smallest 1/2/2.5/5/10 × 10ⁿ at or above `raw`. */
function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  for (const step of STEPS) {
    if (step * magnitude >= raw) return step * magnitude;
  }
  return 10 * magnitude;
}

/** The next step below `step` on the same 1/2/2.5/5/10 ladder. */
function stepDown(step: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(step));
  const ladder = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10].map(
    rung => rung * magnitude
  );
  const below = ladder.filter(candidate => candidate < step - 1e-12);
  return below.length === 0 ? step / 2 : below[below.length - 1];
}

/** Kill the float noise repeated addition of 2.5 or 0.1 leaves behind. */
function tidy(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/**
 * Evenly spaced ticks on a round step, covering `[low, high]`.
 *
 * Recharts' own tick picker, handed a domain and a count, will happily produce
 * `0 · 7 · 13 · 20`. The axis is the reader's only defence against a misleading
 * shape, so it gets round numbers or it is not doing its job.
 */
export function niceTicks(low: number, high: number, target = 4): number[] {
  if (high <= low) return [low, low + 1];
  const span = high - low;
  let step = niceStep(span / target);
  /*
    Rounding the step up can leave two intervals where four were asked for, and an
    axis whose top tick is a third above the highest figure reads as headroom that
    means something. One step down when that happens.
  */
  if (span / step < 2.5) step = stepDown(step);
  const start = tidy(Math.floor(low / step) * step);
  const ticks: number[] = [];
  for (let value = start; value <= high + step * 1e-9; value += step) {
    ticks.push(tidy(value));
  }
  if (ticks[ticks.length - 1] < high) {
    ticks.push(tidy(ticks[ticks.length - 1] + step));
  }
  return ticks;
}

/**
 * The axis' ticks. Months with no records contribute nothing — they are absences,
 * not zeros, and must not drag a duration axis down to the floor.
 */
export function yTicks(
  values: readonly (number | null)[],
  unit: string
): number[] {
  const figures = values.filter((value): value is number => value !== null);
  if (figures.length === 0) return [0, 1];

  const low = Math.min(...figures);
  const high = Math.max(...figures);

  if (isZeroAnchored(unit)) {
    return niceTicks(0, high === 0 ? 1 : high);
  }

  /* A flat duration series: give it air on both sides, not a zero-height plot. */
  const pad =
    high === low ? (high === 0 ? 1 : Math.abs(high) * 0.1) : (high - low) * 0.1;
  return niceTicks(niceFloor(low - pad), high + pad);
}

/**
 * `[min, max]` for a series' y axis — whatever its ticks span, so the top of the
 * plot is always a labelled round number rather than a bare maximum.
 */
export function yDomain(
  values: readonly (number | null)[],
  unit: string
): [number, number] {
  const ticks = yTicks(values, unit);
  return [ticks[0], ticks[ticks.length - 1]];
}

/**
 * Runs of consecutive months that carry a figure, as index ranges into `points`.
 * A month with no eligible records ends the run: the line stops, and the next run
 * starts after the gap. Nothing bridges it, nothing interpolates across it, and it
 * is never plotted at zero (SPEC §0.1, §6.8).
 */
export function segmentsOf(
  points: readonly SparklinePoint[]
): { start: number; end: number }[] {
  const segments: { start: number; end: number }[] = [];
  let start = -1;
  points.forEach((point, index) => {
    if (point.value === null) {
      if (start !== -1) segments.push({ start, end: index - 1 });
      start = -1;
    } else if (start === -1) {
      start = index;
    }
  });
  if (start !== -1) segments.push({ start, end: points.length - 1 });
  return segments;
}

/** Indices of the months with no records — where the gap hairlines go. */
export function gapIndices(points: readonly SparklinePoint[]): number[] {
  return points.reduce<number[]>((indices, point, index) => {
    if (point.value === null) indices.push(index);
    return indices;
  }, []);
}

/* ------------------------------------------------------------------ axis */

export interface AxisPoint {
  month: string;
  value: number | null;
  /** `null` for a month the series never recorded — there is no detail to show. */
  detail: Record<string, number> | null;
}

/**
 * The series laid out across the scope's own window, `since` → `until`, one entry
 * per month (SPEC §6.8). Axes are per-scope and never shared: helm starts 2025-08
 * with 13 months, fastapi 2025-09 with 12, and putting them on one axis would
 * invent two months of helm history for fastapi.
 *
 * Months the series does not carry — and months it carries as `null` — come out as
 * `value: null`, which every renderer here draws as a gap.
 */
export function axisPoints(
  series: {
    points: readonly {
      month: string;
      value: number | null;
      detail: Record<string, number>;
    }[];
  },
  since: string,
  until: string
): AxisPoint[] {
  const byMonth = new Map(series.points.map(point => [point.month, point]));
  return monthRange(monthOf(since), monthOf(until)).map(month => {
    const point = byMonth.get(month);
    return point === undefined || point.value === null
      ? { month, value: null, detail: null }
      : { month, value: point.value, detail: point.detail };
  });
}
