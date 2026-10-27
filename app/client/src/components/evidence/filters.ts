/**
 * What the index is showing, and why (SPEC §5.8, §5.10.8).
 *
 * Two kinds of narrowing meet on this screen and they are deliberately different
 * things:
 *
 *   - **The reader's controls** — search, kind, repository. Local state; they change
 *     what is listed, not what the list *is*.
 *   - **The citation filter** — `?metric=…&scope=…`, the link the working drawer's
 *     "All {n} source records" carries (§5.10.8). That one is in the URL because it
 *     is a claim: *these are the records that figure counted*. It has to survive
 *     being pasted to someone else, and it has to name the scope as well as the
 *     metric, since a metric's citations differ by scope and a link that dropped the
 *     scope would quietly widen the filter past the sample the figure was computed
 *     over.
 *
 * Pure functions over plain data — no React, no fetching, so the tests can run the
 * real 1,104 records through them.
 */

import type {
  Edition,
  EvidenceRecord,
  ScopeKey,
  SourceKind,
} from "@/data";

import { recordTitle } from "./format";

export const KIND_ANY = "all";
export const REPO_ANY = "all";
/** The ten collection records carry no repository; this selects exactly those. */
export const REPO_NONE = "none";

export interface EvidenceControls {
  search: string;
  kind: SourceKind | typeof KIND_ANY;
  repo: string;
}

export const EMPTY_CONTROLS: EvidenceControls = {
  search: "",
  kind: KIND_ANY,
  repo: REPO_ANY,
};

export function controlsAreEmpty(controls: EvidenceControls): boolean {
  return (
    controls.search.trim() === "" &&
    controls.kind === KIND_ANY &&
    controls.repo === REPO_ANY
  );
}

/* --------------------------------------------------------- citation filter */

export type CitationFilter =
  | { kind: "none" }
  | {
      kind: "citation";
      metricId: string;
      metricLabel: string;
      scopeKey: ScopeKey;
      scopeLabel: string;
      scopeSlug: string;
    }
  /** The URL named a metric or a scope this edition does not publish (§4.2). */
  | { kind: "unknown-metric"; metricId: string }
  | { kind: "unknown-scope"; scopeSlug: string };

/**
 * Read `?metric=` and `?scope=` and resolve both against the edition.
 *
 * A half-stated filter (a metric with no scope) is treated as no filter rather than
 * as an error: the parameter pair is written in exactly one place (`evidenceFilterPath`)
 * and a partial one means someone hand-edited the URL, where the useful answer is
 * the whole index rather than a scolding.
 */
export function parseCitationFilter(
  search: string,
  edition: Edition
): CitationFilter {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  const metricId = params.get("metric");
  const scopeSlug = params.get("scope");
  if (!metricId || !scopeSlug) return { kind: "none" };

  const entry = edition.metricCatalog.find(metric => metric.id === metricId);
  if (!entry) return { kind: "unknown-metric", metricId };

  const scopeKey = edition.keyBySlug[scopeSlug];
  const summary = scopeKey ? edition.scopeSummaries[scopeKey] : undefined;
  if (!scopeKey || !summary) return { kind: "unknown-scope", scopeSlug };

  return {
    kind: "citation",
    metricId,
    metricLabel: entry.label,
    scopeKey,
    scopeLabel: summary.scope.label,
    scopeSlug,
  };
}

export function citesFilter(
  record: EvidenceRecord,
  filter: CitationFilter
): boolean {
  if (filter.kind === "none") return true;
  if (filter.kind !== "citation") return false;
  return record.citedIn.some(
    citation =>
      citation.metricId === filter.metricId &&
      citation.scopeKey === filter.scopeKey
  );
}

/* ---------------------------------------------------------------- search */

/**
 * Reference, title, repository (§5.8) — the three things an engineer arriving at
 * this screen already knows. `detail` is not searched: it is the collector's
 * sentence about the record, and matching against it would return records whose
 * only connection to the query is a shared adjective.
 */
export function matchesSearch(record: EvidenceRecord, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  if (record.ref.toLowerCase().includes(needle)) return true;
  if (record.repo && record.repo.toLowerCase().includes(needle)) return true;
  const title = recordTitle(record);
  return title !== null && title.toLowerCase().includes(needle);
}

export function matchesRepo(record: EvidenceRecord, repo: string): boolean {
  if (repo === REPO_ANY) return true;
  if (repo === REPO_NONE) return !record.repo;
  return record.repo === repo;
}

export function filterRecords(
  records: EvidenceRecord[],
  controls: EvidenceControls,
  filter: CitationFilter = { kind: "none" }
): EvidenceRecord[] {
  return records.filter(
    record =>
      citesFilter(record, filter) &&
      (controls.kind === KIND_ANY || record.kind === controls.kind) &&
      matchesRepo(record, controls.repo) &&
      matchesSearch(record, controls.search)
  );
}

/**
 * Chip counts, computed with every control applied *except* the kind chips
 * themselves.
 *
 * Faceting the counts against the other filters is the honest arithmetic: a chip
 * reading "12 releases" while a repository is selected means twelve in that
 * repository, and a chip that would list nothing says 0 rather than inviting a tap
 * into an empty screen.
 */
export function kindCounts(
  records: EvidenceRecord[],
  controls: EvidenceControls,
  filter: CitationFilter = { kind: "none" }
): { total: number; byKind: Record<SourceKind, number> } {
  const byKind = {} as Record<SourceKind, number>;
  let total = 0;
  for (const record of records) {
    if (!citesFilter(record, filter)) continue;
    if (!matchesRepo(record, controls.repo)) continue;
    if (!matchesSearch(record, controls.search)) continue;
    byKind[record.kind] = (byKind[record.kind] ?? 0) + 1;
    total += 1;
  }
  return { total, byKind };
}

/** The repositories the records name, in the edition's navigation order. */
export function repoOptions(
  records: EvidenceRecord[],
  edition: Edition
): { value: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  let unattached = 0;
  for (const record of records) {
    if (!record.repo) {
      unattached += 1;
      continue;
    }
    counts.set(record.repo, (counts.get(record.repo) ?? 0) + 1);
  }

  const ordered: { value: string; label: string; count: number }[] = [];
  for (const project of edition.navigation.projects) {
    for (const repo of project.repos) {
      const count = counts.get(repo.label);
      if (count === undefined) continue;
      ordered.push({ value: repo.label, label: repo.label, count });
      counts.delete(repo.label);
    }
  }
  /* A repository in the records that navigation does not carry still gets an
     option — the records are the ground truth on this screen, not the sidebar. */
  counts.forEach((count, repo) =>
    ordered.push({ value: repo, label: repo, count })
  );

  return ordered;
}

/** How many records carry no repository — the `REPO_NONE` option's count. */
export function unattachedCount(records: EvidenceRecord[]): number {
  return records.reduce((total, record) => total + (record.repo ? 0 : 1), 0);
}
