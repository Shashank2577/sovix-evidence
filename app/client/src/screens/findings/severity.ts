/**
 * Ordering and tallying the findings a scope shows (SPEC §5.2).
 *
 * Pure, and separate from the screen, so the two things that are easy to get
 * quietly wrong can be tested directly: that the critical finding is first, and
 * that a severity's count is the count of what the filter would actually show.
 *
 * Nothing here ranks scopes or people. A severity is the rulebook's own label on
 * a threshold crossing; sorting by it puts the loudest alarm at the top of the
 * alarm surface and does not claim anything about the repositories involved.
 */

import type { Headline, Severity } from "@/data";

/** Severity order as §5.2 renders it: critical cards first, info last. */
export const SEVERITY_ORDER: Severity[] = ["critical", "warning", "info"];

const RANK: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };

/**
 * Critical first, then warning, then info; within a severity the edition's own
 * order is preserved. `Array.prototype.sort` is stable in every engine this ships
 * to, so equal severities come out in the order the rulebook published them —
 * which is the only ordering the data licenses.
 */
export function orderBySeverity(headlines: Headline[]): Headline[] {
  return [...headlines].sort(
    (left, right) => RANK[left.severity] - RANK[right.severity]
  );
}

export type SeverityCounts = Record<Severity, number>;

export function countBySeverity(headlines: Headline[]): SeverityCounts {
  const counts: SeverityCounts = { critical: 0, warning: 0, info: 0 };
  for (const headline of headlines) counts[headline.severity] += 1;
  return counts;
}

/** `null` means "All" — the filter is off rather than set to a fourth value. */
export function filterBySeverity(
  headlines: Headline[],
  severity: Severity | null
): Headline[] {
  return severity === null
    ? headlines
    : headlines.filter(headline => headline.severity === severity);
}
