/**
 * Compare's URL state (SPEC §5.7, §1.3).
 *
 * `/compare?scopes=org,axios-axios` is a link someone pastes into a meeting
 * invite, so every piece of this screen's state that matters lives in the query
 * string: which scopes are in which column, and which cell's working is open.
 *
 * The working parameters are Compare's own. `?working=` alone is the scoped
 * routes' contract and the shell's drawer reads it there (§1.3); on `/compare`
 * there is no single scope for it to mean, which is exactly why the shell's host
 * declines to open on this route. So a cell names both halves — the metric and
 * the column it was clicked in — and this screen opens its own drawer over the
 * scope file that column already has loaded. Nothing about the shell's contract
 * changes; Compare adds the one word the shell was missing.
 */

import { COMPARE_PATH } from "@/app/routes";
import type { ScopeSlug } from "@/data";

/** §5.7: two or three columns. Four would not fit a decision meeting's screen. */
export const MAX_SLOTS = 3;
export const MIN_SLOTS = 2;

export const SCOPES_PARAM = "scopes";
export const WORKING_PARAM = "working";
export const WORKING_SCOPE_PARAM = "workingScope";

function params(search: string): URLSearchParams {
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}

/**
 * Slugs from the query, de-duplicated and capped.
 *
 * Duplicates are dropped rather than rejected: a hand-edited or twice-shared URL
 * asking to compare a scope with itself is answered with the scope once, which
 * is the honest reading of the request. Whether each surviving slug names a
 * scope this edition publishes is a separate question, answered against
 * `keyBySlug` by the screen.
 */
export function readScopeSlugs(search: string): ScopeSlug[] {
  const raw = params(search).get(SCOPES_PARAM);
  if (!raw) return [];
  const seen = new Set<string>();
  const slugs: ScopeSlug[] = [];
  for (const part of raw.split(",")) {
    const slug = part.trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
    if (slugs.length === MAX_SLOTS) break;
  }
  return slugs;
}

export interface CompareWorking {
  metricId: string;
  scopeSlug: ScopeSlug;
}

/** Both halves or nothing — a metric without its column names no sample. */
export function readCompareWorking(search: string): CompareWorking | null {
  const query = params(search);
  const metricId = query.get(WORKING_PARAM);
  const scopeSlug = query.get(WORKING_SCOPE_PARAM);
  if (!metricId || !scopeSlug) return null;
  return { metricId, scopeSlug };
}

/**
 * The canonical Compare URL for a set of columns and an optional open working.
 *
 * The comma in `scopes=` is restored after `URLSearchParams` percent-encodes it,
 * for the same reason `withWorking` does it in `routes.ts`: one spelling of one
 * URL, so a link keeps matching the link that was shared.
 */
export function compareHref(
  slugs: ScopeSlug[],
  working: CompareWorking | null = null
): string {
  const query = new URLSearchParams();
  if (slugs.length > 0) query.set(SCOPES_PARAM, slugs.join(","));
  if (working) {
    query.set(WORKING_PARAM, working.metricId);
    query.set(WORKING_SCOPE_PARAM, working.scopeSlug);
  }
  const search = query.toString().replace(/%2C/g, ",");
  return search ? `${COMPARE_PATH}?${search}` : COMPARE_PATH;
}

/** Replace one column, keeping the rest in place and dropping any duplicate. */
export function withSlot(
  slugs: ScopeSlug[],
  index: number,
  slug: ScopeSlug
): ScopeSlug[] {
  const next = [...slugs];
  next[index] = slug;
  return next.filter((value, position) => next.indexOf(value) === position);
}

export function withoutSlot(slugs: ScopeSlug[], index: number): ScopeSlug[] {
  return slugs.filter((_, position) => position !== index);
}
