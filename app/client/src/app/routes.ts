/**
 * The route table (SPEC §1.3) as a pure function.
 *
 * Two things need to agree about "where am I": the thing that decides which
 * screen to render, and the shell that has to label it (breadcrumb, active nav
 * item, bottom tab, scope switcher check). Writing the table twice — once as
 * wouter `<Route path>` strings and once as a parser for the shell — is how the
 * breadcrumb ends up disagreeing with the page. So the table is written once,
 * here, as `parseAppPath`, and both sides read it.
 *
 * Everything in this module is pure: no React, no fetching, no edition data.
 * Whether the scope a URL asks for actually exists in this edition is a
 * separate question, answered in `scope.ts` against `edition.json`.
 */

import type { ScopeLevel } from "@/data";

/** The five tabs of the scope template (SPEC §1.1). Repo scopes omit the last. */
export type TabId =
  | "overview"
  | "findings"
  | "metrics"
  | "trends"
  | "repositories";

/**
 * A scope as a URL asks for it — a slug and nothing more. It is deliberately
 * *not* a `ScopeKey`: a URL can name a scope this edition has never heard of,
 * and that case has its own screen (SPEC §4.2).
 */
export interface ScopeTarget {
  level: ScopeLevel;
  /** Project slug; `null` at org level. */
  slug: string | null;
  /** Repo owner/name; `null` elsewhere. */
  owner: string | null;
  name: string | null;
}

export const ORG_TARGET: ScopeTarget = {
  level: "org",
  slug: null,
  owner: null,
  name: null,
};

export type RouteMatch =
  | { kind: "scope"; target: ScopeTarget; tab: TabId; metricId: string | null }
  | { kind: "compare" }
  | { kind: "evidence"; recordId: string | null }
  | { kind: "methodology" }
  /** `/org/*` is the canonical org home written the long way (SPEC §1.3). */
  | { kind: "redirect"; to: string }
  | { kind: "not-found" };

/** Tabs in template order. `repositories` exists only where a scope has children. */
export const TAB_ORDER: TabId[] = [
  "overview",
  "findings",
  "metrics",
  "trends",
  "repositories",
];

export const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  findings: "Findings",
  metrics: "Metrics",
  trends: "Trends",
  repositories: "Repositories",
};

/** Path segment for a tab; Overview is the scope root, so it contributes none. */
const TAB_SEGMENT: Record<TabId, string> = {
  overview: "",
  findings: "findings",
  metrics: "metrics",
  trends: "trends",
  repositories: "repositories",
};

/** A repo scope has no children, so it has no scope table (SPEC §1.3). */
export function tabsForLevel(level: ScopeLevel): TabId[] {
  return level === "repo"
    ? TAB_ORDER.filter(tab => tab !== "repositories")
    : TAB_ORDER;
}

export function tabExistsAt(level: ScopeLevel, tab: TabId): boolean {
  return tabsForLevel(level).includes(tab);
}

/* ------------------------------------------------------------- building */

/** The scope's Overview route — its base path. */
export function scopeBasePath(target: ScopeTarget): string {
  if (target.level === "org") return "/";
  if (target.level === "project")
    return `/project/${encodeURIComponent(target.slug ?? "")}`;
  return `/repo/${encodeURIComponent(target.owner ?? "")}/${encodeURIComponent(
    target.name ?? ""
  )}`;
}

/**
 * Route for a tab within a scope. A tab the scope doesn't have falls to
 * Overview rather than 404ing — the scope switcher relies on this (SPEC §3.1).
 */
export function scopeTabPath(
  target: ScopeTarget,
  tab: TabId,
  metricId?: string | null
): string {
  const resolved = tabExistsAt(target.level, tab) ? tab : "overview";
  const base = scopeBasePath(target);
  const segments = [TAB_SEGMENT[resolved]];
  if (resolved === "metrics" && metricId) segments.push(encodeURIComponent(metricId));
  const tail = segments.filter(Boolean).join("/");
  if (!tail) return base;
  return base === "/" ? `/${tail}` : `${base}/${tail}`;
}

export const COMPARE_PATH = "/compare";
export const EVIDENCE_PATH = "/evidence";
export const METHODOLOGY_PATH = "/methodology";

export function evidenceRecordPath(recordId: string): string {
  return `${EVIDENCE_PATH}/${encodeURIComponent(recordId)}`;
}

/**
 * The Evidence index's filter contract (SPEC §5.8).
 *
 * Lives here rather than at its call site because two screens have to agree
 * about it: the working drawer writes the link and the Evidence index reads
 * the params back. Both parameters are required — a metric's citations differ
 * by scope, and a link that dropped the scope would quietly widen the filter
 * to every repository, showing a reader more records than the figure was
 * computed over. That is the same class of error as showing them fewer.
 */
export const EVIDENCE_METRIC_PARAM = "metric";
export const EVIDENCE_SCOPE_PARAM = "scope";

export function evidenceFilterPath(
  metricId: string,
  scopeSlug: string
): string {
  const params = new URLSearchParams({
    [EVIDENCE_METRIC_PARAM]: metricId,
    [EVIDENCE_SCOPE_PARAM]: scopeSlug,
  });
  return `${EVIDENCE_PATH}?${params.toString()}`;
}

/** The params `evidenceFilterPath` wrote, read back off a location's search. */
export function readEvidenceFilter(search: string): {
  metricId: string | null;
  scopeSlug: string | null;
} {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  return {
    metricId: params.get(EVIDENCE_METRIC_PARAM) || null,
    scopeSlug: params.get(EVIDENCE_SCOPE_PARAM) || null,
  };
}

export function comparePath(slugs: string[]): string {
  return slugs.length === 0
    ? COMPARE_PATH
    : `${COMPARE_PATH}?scopes=${slugs.map(encodeURIComponent).join(",")}`;
}

/* -------------------------------------------------------- working drawer */

/**
 * `?working=<metricId>` is valid on any scoped route (SPEC §1.3). C5 owns what
 * the drawer *does*; the URL contract lives here because routing owns the URL.
 */
export const WORKING_PARAM = "working";

export function readWorkingParam(search: string): string | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  const value = params.get(WORKING_PARAM);
  return value && value.length > 0 ? value : null;
}

/**
 * `path` may already carry a query string; the working param replaces its own
 * and every other param is passed through untouched.
 *
 * `URLSearchParams.toString()` percent-encodes the comma, which would rewrite
 * `?scopes=org,python` — spelled with a literal comma by `comparePath` — into
 * `?scopes=org%2Cpython` the moment this function touched a Compare URL. Both
 * forms parse identically, but two functions in this module disagreeing about
 * the canonical spelling of one URL is how a link stops matching the link
 * someone pasted into Slack. The comma is a legal sub-delimiter in a query
 * string, so it is restored.
 */
export function withWorking(
  path: string,
  metricId: string | null,
  search = ""
): string {
  const [pathname, inlineSearch = ""] = path.split("?");
  const params = new URLSearchParams(inlineSearch || search.replace(/^\?/, ""));
  if (metricId) params.set(WORKING_PARAM, metricId);
  else params.delete(WORKING_PARAM);
  const query = params.toString().replace(/%2C/g, ",");
  return query ? `${pathname}?${query}` : pathname;
}

/* -------------------------------------------------------------- parsing */

function decode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    /* A malformed escape is not a scope slug; hand it back verbatim so it
       fails the edition lookup and gets the not-found screen, not a throw. */
    return segment;
  }
}

/** The five-tab template, applied to whatever scope the prefix named. */
function parseScopeTail(target: ScopeTarget, rest: string[]): RouteMatch {
  if (rest.length === 0)
    return { kind: "scope", target, tab: "overview", metricId: null };

  const [head, ...tail] = rest;

  if (head === "metrics") {
    if (tail.length === 0)
      return { kind: "scope", target, tab: "metrics", metricId: null };
    if (tail.length === 1)
      return { kind: "scope", target, tab: "metrics", metricId: tail[0] };
    return { kind: "not-found" };
  }

  if (tail.length > 0) return { kind: "not-found" };

  if (head === "findings")
    return { kind: "scope", target, tab: "findings", metricId: null };
  if (head === "trends")
    return { kind: "scope", target, tab: "trends", metricId: null };
  if (head === "repositories") {
    if (!tabExistsAt(target.level, "repositories")) return { kind: "not-found" };
    return { kind: "scope", target, tab: "repositories", metricId: null };
  }

  return { kind: "not-found" };
}

/**
 * Resolve a pathname against SPEC §1.3. Query strings are not this function's
 * business — pass `location` from wouter, which excludes them.
 */
export function parseAppPath(pathname: string): RouteMatch {
  const segments = pathname.split("/").filter(Boolean).map(decode);

  /* `/org` and `/org/<anything>` are the org routes written the long way. */
  if (segments[0] === "org") {
    const rest = segments.slice(1).map(encodeURIComponent).join("/");
    return { kind: "redirect", to: rest ? `/${rest}` : "/" };
  }

  if (segments.length === 1) {
    if (segments[0] === "compare") return { kind: "compare" };
    if (segments[0] === "evidence") return { kind: "evidence", recordId: null };
    if (segments[0] === "methodology") return { kind: "methodology" };
  }
  if (segments.length === 2 && segments[0] === "evidence")
    return { kind: "evidence", recordId: segments[1] };

  if (segments[0] === "project") {
    if (segments.length < 2) return { kind: "not-found" };
    const target: ScopeTarget = {
      level: "project",
      slug: segments[1],
      owner: null,
      name: null,
    };
    return parseScopeTail(target, segments.slice(2));
  }

  if (segments[0] === "repo") {
    if (segments.length < 3) return { kind: "not-found" };
    const target: ScopeTarget = {
      level: "repo",
      slug: null,
      owner: segments[1],
      name: segments[2],
    };
    return parseScopeTail(target, segments.slice(3));
  }

  /* Anything left is an org-level tab, or nothing this edition publishes. */
  return parseScopeTail(ORG_TARGET, segments);
}

/** The tab a route is "on" for nav purposes; edition-level screens have none. */
export function activeTab(match: RouteMatch): TabId | null {
  return match.kind === "scope" ? match.tab : null;
}
