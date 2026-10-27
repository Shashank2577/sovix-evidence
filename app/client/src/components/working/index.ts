/**
 * The working drawer (SPEC §5.10, §10.4) — C5.
 *
 * The product's differentiator, and the only screen surface whose absence would
 * make the rest of the report an ordinary dashboard: from any figure, one
 * interaction to the formula that produced it, the sample it was computed over,
 * what was set aside and why, and the commits and pull requests underneath —
 * **without the figure leaving the screen**.
 *
 * Three things are exported for other chunks to build on:
 *   - `WorkingDrawerHost` — mount once in the shell; it takes no props and reads
 *     `?working=` for itself.
 *   - `useWorking` / `WorkingTrigger` — how a figure opens its own working. Every
 *     call site uses these rather than composing a URL, so the contract has one
 *     spelling (§1.3).
 *   - `WorkingSections` — the five numbered sections, which the metric detail page
 *     renders permanently expanded (§5.4). One implementation, two surfaces.
 */

import "./working.css";

export { WorkingDrawerHost } from "./WorkingDrawerHost";
export { WorkingTrigger, type WorkingTriggerProps } from "./WorkingTrigger";
export {
  useWorking,
  evidenceFilterPath,
  DEEP_LINK_DELAY_MS,
  type WorkingControls,
} from "./useWorking";
export {
  WorkingSections,
  type WorkingSectionsProps,
  type WorkingVariant,
} from "./WorkingSections";
export { WorkingBody, type WorkingBodyProps } from "./WorkingBody";
export {
  WorkingDrawer,
  SHEET_SNAP_POINTS,
  type WorkingDrawerProps,
} from "./WorkingDrawer";
export { ExemplarCard, type ExemplarCardProps } from "./ExemplarCard";
export { SourceRecordRow, type SourceRecordRowProps } from "./SourceRecordRow";
export { FormulaBlock, type FormulaBlockProps } from "./FormulaBlock";
export { CaveatBox, type CaveatBoxProps } from "./CaveatBox";
export { Disclosure, type DisclosureProps } from "./Disclosure";
export {
  WorkingSkeleton,
  WorkingError,
  WorkingUnknown,
  type WorkingSkeletonProps,
} from "./WorkingStates";
