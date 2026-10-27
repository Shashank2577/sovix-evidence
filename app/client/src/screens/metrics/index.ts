/**
 * The metrics screens (SPEC §5.3, §5.4) — C7.
 *
 * Two screens, one subject: the index is the map of all 57 readings at a scope,
 * the detail page is one of them with its working open beside it. Both are
 * composed from the primitives that own the product's rules — `FloorFigure`,
 * `NotAvailable`, `TierBadge`, the chart kit and the working sections — and
 * neither decides anything a primitive has already decided.
 */

export { MetricsIndex } from "./MetricsIndex";
export { MetricDetail } from "./MetricDetail";
