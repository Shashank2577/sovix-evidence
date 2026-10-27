/**
 * `MonthlySeries` (SPEC §6.8, §7.5, §8.5).
 *
 * A line + faint area over the scope's own window, built on recharts. Four things
 * here are load-bearing, and each is a rule the product would break without it:
 *
 *   1. **Gaps stay gaps.** The x domain spans the scope's `since`→`until` by month;
 *      a month with no eligible records carries `null`, `connectNulls` is false,
 *      and a dotted hairline marks the absence so it reads as "no records" rather
 *      than "chart glitch". Nothing is bridged, interpolated, or plotted at zero.
 *   2. **Per-scope axes.** helm starts 2025-08 with 13 months, fastapi 2025-09 with
 *      12. Sharing one axis would invent history for the shorter scope.
 *   3. **Nothing is hover-only.** Hover, tap, the ←/→ keys and the strip's own
 *      step buttons all reach the same selection, and the readout is a persistent
 *      strip under the chart — not a tooltip. Touch, keyboard and print lose
 *      nothing.
 *   4. **No animation from zero.** `isAnimationActive` is off on every recharts
 *      layer; the reveal is the §8.5 clip-path wipe over final geometry.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import type { Series } from "@/data";
import { cn } from "@/lib/utils";

import {
  formatAxisValue,
  formatNumber,
  formatValue,
  humaniseKey,
  monthLong,
  monthTick,
} from "./format";
import { useMediaQuery } from "./hooks";
import { ChartReveal } from "./reveal";
import {
  axisPoints,
  gapIndices,
  yDomain,
  yTicks,
  type AxisPoint,
} from "./scale";

/** recharts' y axis gutter and right margin, in px — the hit overlay needs both. */
const Y_AXIS_WIDTH = 44;
const PLOT_MARGIN_RIGHT = 8;

export interface MonthlySeriesProps {
  series: Series;
  /** The scope's own window. Axes are per-scope, never shared (§6.8). */
  since: string;
  until: string;
  height?: number;
  accent?: string;
  /** Caption under the strip; defaults to the dataset's own `series.note`. */
  caption?: string;
  className?: string;
  revealed?: boolean;
}

export function MonthlySeries({
  series,
  since,
  until,
  height,
  accent = "var(--chart-1)",
  caption,
  className,
  revealed = false,
}: MonthlySeriesProps) {
  const narrow = useMediaQuery("(max-width: 780px)");
  const verySmall = useMediaQuery("(max-width: 510px)");
  const plotHeight = height ?? (narrow ? 180 : 220);

  const points = useMemo(
    () => axisPoints(series, since, until),
    [series, since, until]
  );
  const gaps = useMemo(() => gapIndices(points), [points]);
  const observedCount = points.length - gaps.length;

  const lastObserved = useMemo(() => {
    for (let index = points.length - 1; index >= 0; index -= 1) {
      if (points[index].value !== null) return index;
    }
    return 0;
  }, [points]);

  const [selected, setSelected] = useState(lastObserved);
  /* A scope change swaps the whole series; the old month index means nothing now. */
  useEffect(() => setSelected(lastObserved), [lastObserved, series.id]);

  const clamp = useCallback(
    (index: number) => Math.max(0, Math.min(points.length - 1, index)),
    [points.length]
  );
  const step = useCallback(
    (delta: number) => setSelected(current => clamp(current + delta)),
    [clamp]
  );

  const values = useMemo(() => points.map(point => point.value), [points]);
  const domain = useMemo(
    () => yDomain(values, series.unit),
    [values, series.unit]
  );
  const ticks = useMemo(
    () => yTicks(values, series.unit),
    [values, series.unit]
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowLeft":
        step(-1);
        break;
      case "ArrowRight":
        step(1);
        break;
      case "Home":
        setSelected(0);
        break;
      case "End":
        setSelected(points.length - 1);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  /*
    Pointer selection is done here rather than through recharts' tooltip machinery:
    the month under the pointer is a function of the plot box and the point count,
    and computing it ourselves is the only version that behaves identically for a
    mouse, a finger and a stylus. `Y_AXIS_WIDTH` and the chart's right margin are
    the only two numbers it needs, and both are set below.
  */
  const selectFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const left = Y_AXIS_WIDTH;
    const right = rect.width - PLOT_MARGIN_RIGHT;
    if (right <= left) return;
    const ratio = (event.clientX - rect.left - left) / (right - left);
    setSelected(clamp(Math.round(ratio * (points.length - 1))));
  };

  const point = points[selected];
  const sparse = observedCount < 2;

  return (
    <figure className={cn("monthly-series", className)}>
      <div
        className="ms-plot"
        style={{ height: plotHeight }}
        tabIndex={0}
        role="group"
        aria-label={`${series.label}, ${points.length} months from ${monthLong(
          points[0].month
        )} to ${monthLong(points[points.length - 1].month)}. ${
          gaps.length === 0
            ? "Every month carries a figure."
            : `${gaps.length} ${gaps.length === 1 ? "month has" : "months have"} no eligible records.`
        } Use the left and right arrow keys to select a month; the selection is read out below the chart.`}
        onKeyDown={onKeyDown}
      >
        <ChartReveal disabled={revealed} className="ms-reveal">
          <ResponsiveContainer width="100%" height={plotHeight}>
            <ComposedChart
              data={points}
              margin={{ top: 8, right: PLOT_MARGIN_RIGHT, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tickFormatter={monthTick}
                interval={verySmall ? 2 : "preserveStartEnd"}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                tick={{
                  fill: "var(--text-3)",
                  fontSize: 9,
                  fontFamily: '"DM Mono", monospace',
                }}
                tickMargin={8}
              />
              <YAxis
                domain={domain}
                ticks={ticks}
                width={Y_AXIS_WIDTH}
                tickFormatter={value =>
                  formatAxisValue(value as number, series.unit)
                }
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "var(--text-3)",
                  fontSize: 9,
                  fontFamily: '"DM Mono", monospace',
                }}
              />

              {/*
                One hairline per month with no eligible records. Drawn before the
                data so the line and its dots stay on top.
              */}
              {gaps.map(index => (
                <ReferenceLine
                  key={`gap-${points[index].month}`}
                  x={points[index].month}
                  stroke="var(--ornament)"
                  strokeDasharray="2 3"
                  strokeWidth={1}
                />
              ))}

              {/*
                The selected month's guide. Faint and 1px, where the data line is
                solid and 2px: at the edge of the plot a strong vertical reads as a
                spike, and the one thing this chart may not do is draw a value.
              */}
              <ReferenceLine
                x={point.month}
                stroke={accent}
                strokeOpacity={0.3}
                strokeWidth={1}
              />

              <Area
                dataKey="value"
                type="linear"
                fill={accent}
                fillOpacity={0.08}
                stroke="none"
                connectNulls={false}
                isAnimationActive={false}
                activeDot={false}
              />
              <Line
                dataKey="value"
                type="linear"
                stroke={accent}
                strokeWidth={2}
                connectNulls={false}
                isAnimationActive={false}
                activeDot={false}
                dot={dotProps => {
                  /* recharts puts `key` inside the props object; React wants it out. */
                  const { key: _key, ...rest } = dotProps as SeriesDotProps & {
                    key?: string;
                  };
                  return (
                    <SeriesDot
                      key={`dot-${rest.payload.month}`}
                      cx={rest.cx}
                      cy={rest.cy}
                      payload={rest.payload}
                      accent={accent}
                      selectedMonth={point.month}
                      lonely={isLonely(points, rest.payload.month)}
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartReveal>

        {/*
          Hover emphasises; it is never the only route in. Tap and drag select on
          touch, the arrow keys select with the plot focused, and the strip below
          carries step buttons — four ways to the same selection (§0.1).
        */}
        <div
          className="ms-hit"
          onPointerDown={selectFromPointer}
          onPointerMove={event => {
            if (event.pointerType === "mouse" || event.buttons > 0) {
              selectFromPointer(event);
            }
          }}
        />

        {sparse ? (
          <p className="ms-sparse">Only one month of records in this scope</p>
        ) : null}
      </div>

      <div className="ms-strip">
        <button
          type="button"
          className="ms-step"
          onClick={() => step(-1)}
          disabled={selected === 0}
          aria-label="Previous month"
        >
          <ChevronLeft />
        </button>

        <p className="ms-readout" aria-live="polite">
          <strong>{monthLong(point.month)}</strong>
          {point.value === null ? (
            <span className="ms-readout-gap">
              No eligible records this month
            </span>
          ) : (
            <>
              <span className="ms-readout-value">
                {formatValue(point.value, series.unit)}
              </span>
              {detailEntries(point, series.unit).map(([key, value]) => (
                <span key={key} className="ms-readout-detail">
                  {humaniseKey(key)} {value}
                </span>
              ))}
            </>
          )}
        </p>

        <button
          type="button"
          className="ms-step"
          onClick={() => step(1)}
          disabled={selected === points.length - 1}
          aria-label="Next month"
        >
          <ChevronRight />
        </button>
      </div>

      {(caption ?? series.note) ? (
        <figcaption className="ms-caption">{caption ?? series.note}</figcaption>
      ) : null}
    </figure>
  );
}

/**
 * The readout's supporting fields, formatted.
 *
 * Two things the dataset does that need handling here. It repeats the series' own
 * quantity inside `detail` (a commits series carries `detail.commits`), and showing
 * the same figure twice reads as two different figures — so the duplicate is
 * dropped. And some fields are lists of names, not counts (`tools`, `names`); those
 * are named, up to three of them, with the remainder counted rather than truncated
 * silently. An empty list is omitted: it has nothing to report.
 */
function detailEntries(point: AxisPoint, unit: string): [string, string][] {
  if (point.detail === null) return [];
  const entries: [string, string][] = [];
  for (const [key, value] of Object.entries(
    point.detail as Record<string, number | string[]>
  )) {
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      const shown = value.slice(0, 3).join(", ");
      entries.push([
        key,
        value.length > 3 ? `${shown} +${value.length - 3} more` : shown,
      ]);
      continue;
    }
    if (key === unit && value === point.value) continue;
    entries.push([key, formatNumber(value)]);
  }
  return entries;
}

/** A month whose neighbours are both absent: it has no line, so it needs a dot. */
function isLonely(points: AxisPoint[], month: string): boolean {
  const index = points.findIndex(candidate => candidate.month === month);
  if (index === -1 || points[index].value === null) return false;
  const before = index === 0 ? null : points[index - 1].value;
  const after = index === points.length - 1 ? null : points[index + 1].value;
  return before === null && after === null;
}

interface SeriesDotProps {
  cx?: number;
  cy?: number;
  payload: AxisPoint;
}

function SeriesDot({
  cx,
  cy,
  payload,
  accent,
  selectedMonth,
  lonely,
}: SeriesDotProps & {
  accent: string;
  selectedMonth: string;
  lonely: boolean;
}) {
  if (payload.value === null || cx === undefined || cy === undefined) {
    /* recharts requires an element; an absent month contributes nothing to draw. */
    return <g />;
  }
  const isSelected = payload.month === selectedMonth;
  if (!isSelected && !lonely) return <g />;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isSelected ? 4 : 2.5}
      fill={isSelected ? accent : "var(--surface)"}
      stroke={accent}
      strokeWidth={isSelected ? 2 : 1.5}
    />
  );
}

function ChevronLeft() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m15 18-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m9 18 6-6-6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
