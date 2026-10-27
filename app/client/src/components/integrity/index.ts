/**
 * The integrity primitives (SPEC §6.2–§6.7, §6.15).
 *
 * Every component here carries one of the five product rules (§0.1). They exist so
 * a rule lives in one place rather than at every call site: a screen renders a
 * figure by handing it to `FloorFigure`, a null reading by handing it to
 * `NotAvailable`, and a scope's findings to `StatusPill` — none of them decide.
 */

export { TierBadge, type TierBadgeProps } from "./TierBadge";
export { FloorFigure, type FloorFigureProps } from "./FloorFigure";
export {
  NotAvailable,
  notAvailableReason,
  type NotAvailableProps,
} from "./NotAvailable";
export {
  SampleBreakdown,
  sampleTotals,
  type SampleBreakdownProps,
  type SampleTotals,
} from "./SampleBreakdown";
export { CoverageBarCell, type CoverageBarCellProps } from "./CoverageBarCell";
export { StatusPill, statusDriver, type StatusPillProps } from "./StatusPill";
