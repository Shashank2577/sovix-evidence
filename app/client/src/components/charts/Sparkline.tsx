/**
 * `Sparkline` (SPEC §5.1.4, §7.5, §8.5).
 *
 * Hand-drawn SVG rather than a charting library: at 34px tall a library's axes,
 * layers and animation machinery are all cost and no benefit, and drawing the path
 * ourselves is the only way to be certain a gap stays a gap.
 *
 * Three rules it keeps:
 *   - A month with no eligible records breaks the line. Never bridged, never
 *     interpolated, never zero (§0.1).
 *   - Geometry is final on the first frame; the reveal is a clip-path wipe (§8.5).
 *   - Below 56px of drawn width the sparkline is dropped entirely rather than
 *     squashed below legibility (§7.5) — the figure beside it is the real content.
 */

import { useId } from "react";

import type { SparklinePoint } from "@/data";
import { cn } from "@/lib/utils";

import { formatValue, monthShortWithYear } from "./format";
import { useElementWidth } from "./hooks";
import { ChartReveal } from "./reveal";
import { gapIndices, segmentsOf, yDomain } from "./scale";

/** §7.5: the width below which a sparkline is dropped rather than drawn. */
export const SPARKLINE_MIN_WIDTH = 56;

export interface SparklineProps {
  points: readonly SparklinePoint[];
  /** Series unit — decides the y anchor and the aria label's wording. */
  unit: string;
  /** Metric or series label, for the aria description. */
  label: string;
  height?: number;
  /** Any CSS colour; defaults to the accent token. */
  accent?: string;
  className?: string;
  /** Skip the wipe when the surrounding card has already revealed. */
  revealed?: boolean;
}

export function Sparkline({
  points,
  unit,
  label,
  height = 34,
  accent = "var(--accent)",
  className,
  revealed = false,
}: SparklineProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const gradientId = useId();

  const drawable = width !== null && width >= SPARKLINE_MIN_WIDTH;

  return (
    <div
      ref={ref}
      className={cn("sparkline", className)}
      style={{ height }}
      data-dropped={width !== null && !drawable ? "" : undefined}
    >
      {drawable ? (
        <ChartReveal disabled={revealed} className="sparkline-reveal">
          <SparklineSvg
            points={points}
            unit={unit}
            label={label}
            width={width}
            height={height}
            accent={accent}
            gradientId={gradientId}
          />
        </ChartReveal>
      ) : null}
    </div>
  );
}

interface SvgProps
  extends Required<Pick<SparklineProps, "unit" | "label" | "accent">> {
  points: readonly SparklinePoint[];
  width: number;
  height: number;
  gradientId: string;
}

function SparklineSvg({
  points,
  unit,
  label,
  width,
  height,
  accent,
  gradientId,
}: SvgProps) {
  /* Half the stroke, so the line's outer edge sits inside the box at the extremes. */
  const pad = 1.5;
  const [low, high] = yDomain(
    points.map(point => point.value),
    unit
  );
  const span = high - low || 1;

  const x = (index: number) =>
    points.length === 1
      ? width / 2
      : pad + (index / (points.length - 1)) * (width - pad * 2);
  const y = (value: number) =>
    height - pad - ((value - low) / span) * (height - pad * 2);

  const segments = segmentsOf(points);
  const gaps = gapIndices(points);

  const figures = points.filter(
    (point): point is { month: string; value: number } => point.value !== null
  );
  const describedRange =
    figures.length === 0
      ? "no months with records"
      : `${formatValue(Math.min(...figures.map(p => p.value)), unit)} to ${formatValue(
          Math.max(...figures.map(p => p.value)),
          unit
        )}`;
  const describedGaps =
    gaps.length === 0
      ? ""
      : `, ${gaps.length} ${gaps.length === 1 ? "month" : "months"} with no records`;
  const describedWindow =
    points.length === 0
      ? ""
      : ` from ${monthShortWithYear(points[0].month)} to ${monthShortWithYear(
          points[points.length - 1].month
        )}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${label}: ${describedRange}${describedWindow}${describedGaps}.`}
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity={0.08} />
          <stop offset="100%" stopColor={accent} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/*
        A gap reads as "no records", not as a rendering fault, only if something is
        drawn where the line is not. One faint hairline per absent month.
      */}
      {gaps.map(index => (
        <line
          key={`gap-${points[index].month}`}
          className="sparkline-gap"
          x1={x(index)}
          x2={x(index)}
          y1={pad}
          y2={height - pad}
        />
      ))}

      {segments.map(({ start, end }) => {
        const run = points.slice(start, end + 1) as {
          month: string;
          value: number;
        }[];
        const line = run
          .map((point, offset) => `${x(start + offset)},${y(point.value)}`)
          .join(" ");

        if (start === end) {
          /* A single observed month between two gaps: a point, not a line. */
          return (
            <circle
              key={`point-${points[start].month}`}
              cx={x(start)}
              cy={y(run[0].value)}
              r={1.8}
              fill={accent}
            />
          );
        }

        return (
          <g key={`segment-${points[start].month}`}>
            <polygon
              points={`${x(start)},${height - pad} ${line} ${x(end)},${height - pad}`}
              fill={`url(#${gradientId})`}
            />
            <polyline
              points={line}
              fill="none"
              stroke={accent}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </svg>
  );
}
