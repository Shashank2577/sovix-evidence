/**
 * The chart kit (SPEC §6.8, §6.9, §8.5) — C4.
 *
 * Two rules hold across everything exported here, and they are why the kit is one
 * module rather than three loose components:
 *
 *   - **No chart animates its data up from zero.** Geometry is final on the first
 *     painted frame; reveals are a clip-path wipe or an opacity fade over that
 *     geometry, and there are no count-up number tickers anywhere (§8.5).
 *   - **Nothing exists only on hover.** Every value a chart can show is reachable
 *     by touch, by keyboard, and in print. Hover may emphasise; it is never the
 *     only way in (§0.1, §6.8, §6.9).
 */

import "./charts.css";

export {
  Sparkline,
  SPARKLINE_MIN_WIDTH,
  type SparklineProps,
} from "./Sparkline";
export { MonthlySeries, type MonthlySeriesProps } from "./MonthlySeries";
export {
  WorkHeatmap,
  bandRows,
  colourStep,
  type BandSize,
  type WorkHeatmapProps,
} from "./WorkHeatmap";
export {
  ChartReveal,
  REVEAL_VIEWPORT,
  easeOut,
  type ChartRevealProps,
} from "./reveal";
export {
  axisPoints,
  gapIndices,
  isZeroAnchored,
  segmentsOf,
  yDomain,
  type AxisPoint,
} from "./scale";
export {
  formatAxisValue,
  formatNumber,
  formatValue,
  hourLabel,
  hourRangeLabel,
  humaniseKey,
  monthLong,
  monthShortWithYear,
  monthTick,
} from "./format";
export { useElementWidth, useMediaQuery } from "./hooks";
