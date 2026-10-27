import { cn } from "@/lib/utils";
import * as copy from "@/copy";
import "./integrity.css";

/**
 * SPEC §6.7 — the mini coverage bar used in tables.
 *
 * Two call shapes, both from §5: the Repositories table pairs the bar with the
 * metric's own `display` string (§5.6), and the Metrics index uses a bare 64px bar
 * in the Trend column for metrics without a series — never an empty cell, since
 * coverage is always meaningful (§5.3).
 *
 * `coveragePct` is the dataset's `sample.coverage_pct`. The bar's width is the only
 * thing computed from it, and the clamp guards the geometry, not the figure.
 */
export interface CoverageBarCellProps {
  coveragePct: number;
  /** The dataset's `display` string, when this cell carries a figure too. */
  display?: string;
  /** Bar width in px. 64 matches the sparkline it stands in for (§5.3). */
  width?: number;
  className?: string;
}

export function CoverageBarCell({
  coveragePct,
  display,
  width = 64,
  className,
}: CoverageBarCellProps) {
  const pct = Math.max(0, Math.min(100, coveragePct));

  return (
    <span className={cn("coverage-cell", className)} data-coverage-pct={coveragePct}>
      <span
        className="coverage-bar coverage-cell__bar"
        style={{ width }}
        role="img"
        aria-label={copy.fill(copy.coverage.aria, { pct: coveragePct })}
      >
        <span className="coverage-bar__fill" style={{ width: `${pct}%` }} />
      </span>
      {display !== undefined && (
        <span className="coverage-cell__display">{display}</span>
      )}
    </span>
  );
}
