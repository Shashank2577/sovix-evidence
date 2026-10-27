/**
 * The scope table's rows and their ordering (SPEC §5.6).
 *
 * Pure and separate from the screen, because two of the decisions here are
 * product rules rather than presentation:
 *
 *   1. **A row carries the scope's findings, not a status.** `StatusPill` derives
 *      the level from them (§6.15). Nothing in this module computes, stores or
 *      passes a status, so no call site can slip a judgement in.
 *   2. **A scope that publishes no figure sinks to the bottom of every sort, in
 *      both directions.** Absence is not a low reading (§0.1, §6.4). Sorting
 *      ascending by review coverage must not put "not available" at the top as
 *      if it were the smallest number in the column.
 *
 * Ordering compares *scopes*. There is no person in this table and no column
 * that could be made into one (§1.4).
 */

import { scopeTabPath, type ScopeTarget } from "@/app/routes";
import { targetForKey } from "@/app/scope";
import type {
  Edition,
  Headline,
  MetricSummary,
  NavProject,
  ScopeKey,
} from "@/data";

/** The three metric columns §5.6 makes sortable, and the ids behind them. */
export const SORT_COLUMNS = {
  review: "process.review_coverage",
  lead: "delivery.lead_time_p50",
  contributors: "people.active_contributors",
} as const;

export type SortColumn = keyof typeof SORT_COLUMNS;
export type SortDirection = "asc" | "desc";

/** `null` is the edition's own order — the third state of the tri-state header. */
export interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

export interface RepoRow {
  key: ScopeKey;
  label: string;
  /** The project the repository sits under — the row's sublabel (§5.6). */
  projectKey: ScopeKey;
  projectLabel: string;
  target: ScopeTarget;
  path: string;
  /** The three sortable readings, `undefined` where the scope omits the metric. */
  metrics: Record<SortColumn, MetricSummary | undefined>;
  openPullRequests: number;
  /** The findings that fired for this scope. `StatusPill`'s only input. */
  headlines: Headline[];
}

function metricsFor(
  summaryMetrics: MetricSummary[]
): Record<SortColumn, MetricSummary | undefined> {
  const byId = new Map(summaryMetrics.map(metric => [metric.id, metric]));
  return {
    review: byId.get(SORT_COLUMNS.review),
    lead: byId.get(SORT_COLUMNS.lead),
    contributors: byId.get(SORT_COLUMNS.contributors),
  };
}

/**
 * Rows in the edition's own order: every repository beneath `scopeKey`, grouped
 * by project exactly as `navigation` lists them.
 *
 * A project scope yields its own repositories; the org yields all of them. A repo
 * scope has no scope table at all — the route table refuses `/repositories`
 * there (§1.3) — so it is not a case this function has to answer for.
 */
export function repoRows(edition: Edition, scopeKey: ScopeKey): RepoRow[] {
  const projects: NavProject[] =
    scopeKey === edition.root_scope
      ? edition.navigation.projects
      : edition.navigation.projects.filter(project => project.key === scopeKey);

  const rows: RepoRow[] = [];
  for (const project of projects) {
    for (const repo of project.repos) {
      const summary = edition.scopeSummaries[repo.key];
      if (!summary) continue;
      rows.push({
        key: repo.key,
        label: repo.label,
        projectKey: project.key,
        projectLabel: project.label,
        target: targetForKey(edition, repo.key),
        path: scopeTabPath(targetForKey(edition, repo.key), "overview"),
        metrics: metricsFor(summary.metrics),
        openPullRequests: summary.facts.open_pull_requests,
        headlines: summary.findingIndices.map(index => edition.headlines[index]),
      });
    }
  }
  return rows;
}

/**
 * Sort, keeping unpublished readings at the end in both directions.
 *
 * The comparison is on the metric's `value`, never on its `display` string: a
 * lexical sort of `"12 min"`, `"4.1 days"` and `"7.8%"` would look like an order
 * and be nonsense. `display` is what the cell renders; `value` is what it means.
 */
export function sortRows(rows: RepoRow[], sort: SortState | null): RepoRow[] {
  if (sort === null) return rows;
  const sign = sort.direction === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    const a = left.metrics[sort.column]?.value ?? null;
    const b = right.metrics[sort.column]?.value ?? null;
    if (a === null && b === null) return 0;
    /* Absence sorts last whichever way the column is pointing. */
    if (a === null) return 1;
    if (b === null) return -1;
    if (a === b) return 0;
    return (a < b ? -1 : 1) * sign;
  });
}

/**
 * The tri-state header cycle: unsorted → ascending → descending → unsorted.
 *
 * Returning to unsorted is what restores the edition's own order, and with it
 * the project subheads the sorted view has to drop (§5.6).
 */
export function nextSort(
  current: SortState | null,
  column: SortColumn
): SortState | null {
  if (current === null || current.column !== column)
    return { column, direction: "asc" };
  if (current.direction === "asc") return { column, direction: "desc" };
  return null;
}

export function ariaSort(
  current: SortState | null,
  column: SortColumn
): "ascending" | "descending" | "none" {
  if (current === null || current.column !== column) return "none";
  return current.direction === "asc" ? "ascending" : "descending";
}

/** Rows grouped under their project, in navigation order. */
export function groupByProject(
  rows: RepoRow[]
): { key: ScopeKey; label: string; rows: RepoRow[] }[] {
  const groups: { key: ScopeKey; label: string; rows: RepoRow[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.key === row.projectKey) last.rows.push(row);
    else
      groups.push({ key: row.projectKey, label: row.projectLabel, rows: [row] });
  }
  return groups;
}
