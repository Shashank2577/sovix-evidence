import { isFloorMetric } from "@/data";
import { cn } from "@/lib/utils";
import * as copy from "@/copy";
import "./integrity.css";

/**
 * SPEC §6.3 — the `≥` prefix, and the single place that decides who gets one.
 *
 * Three AI metrics are floors rather than measurements: git records who committed a
 * change, not who wrote each line, so `ai.detected_commit_share`,
 * `ai.detected_line_share` and `ai.adopter_share` count only the work that left a
 * suppressible trace. The true figure is higher by an unknown margin.
 *
 * Deliberately *not* floors, and the reason this component owns the decision rather
 * than the data: `ai.tool_concentration` is a share of the traced subset, and the
 * three `ai.*_delta` metrics are signed differences between two cohorts. `≥ −13.5%`
 * asserts nothing — a floor on a difference is not a claim, it is a category error.
 * The emitted data carries no `isFloor` field precisely so no producer can get this
 * wrong downstream of here.
 *
 * Every figure rendering routes through this component, including the ones that need
 * no prefix: a pass-through call site cannot forget the rule, an `if` at the call
 * site eventually will.
 */
export interface FloorFigureProps {
  /** The dataset's own `display` string. Never re-derived, never reformatted. */
  display: string;
  /** The metric's raw id, e.g. `ai.detected_line_share`. */
  metricId: string;
  className?: string;
}

export function FloorFigure({ display, metricId, className }: FloorFigureProps) {
  const isFloor = isFloorMetric(metricId);

  if (!isFloor) {
    return (
      <span className={cn("floor-figure", className)} data-floor="false">
        {display}
      </span>
    );
  }

  return (
    <span
      className={cn("floor-figure", className)}
      data-floor="true"
      /*
       * Convenience only. §0.1 forbids content that exists *only* on hover, and
       * nothing here does: the `≥` is visible at every size, and the sentence this
       * title repeats is also in the metric's own caveats and in its Working drawer,
       * which touch and keyboard both reach.
       */
      title={copy.floor.title}
    >
      {/*
       * Real text nodes, at the figure's own font and size. A `::before` would
       * vanish from a copy-paste and from most print stylesheets, and the prefix
       * carries the claim — losing it would leave a bare number that overstates
       * its own certainty. The non-breaking space keeps the two welded across a
       * line wrap.
       */}
      <span className="floor-figure__prefix">{copy.floor.prefix}</span>
      {"\u00a0"}
      {display}
    </span>
  );
}
