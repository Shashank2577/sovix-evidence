/**
 * Resolving a URL's scope against the edition (SPEC §1.2, §4.2).
 *
 * `routes.ts` answers "what does this URL ask for". This answers "does this
 * edition publish it" — and the two answers are deliberately separate, because
 * "we have no such route" and "this scope isn't in the 14 Sep 2026 edition" are
 * different sentences on screen.
 */

import type {
  Edition,
  NavProject,
  NavRepo,
  ScopeKey,
  ScopeSlug,
  ScopeSummary,
} from "@/data";

import {
  ORG_TARGET,
  scopeBasePath,
  type ScopeTarget,
} from "./routes";

export interface ResolvedScope {
  target: ScopeTarget;
  key: ScopeKey;
  slug: ScopeSlug;
  label: string;
  summary: ScopeSummary;
  /** The project a repo belongs to, for breadcrumbs. `null` above repo level. */
  parent: { key: ScopeKey; label: string; target: ScopeTarget } | null;
  path: string;
}

export function targetForKey(edition: Edition, key: ScopeKey): ScopeTarget {
  if (key === edition.root_scope) return ORG_TARGET;
  if (key.startsWith("repo:")) {
    const [owner, ...rest] = key.slice("repo:".length).split("/");
    return { level: "repo", slug: null, owner, name: rest.join("/") };
  }
  return {
    level: "project",
    slug: edition.slugByKey[key] ?? null,
    owner: null,
    name: null,
  };
}

/** Scope key a target names, without asking whether the edition publishes it. */
export function keyForTarget(
  edition: Edition,
  target: ScopeTarget
): ScopeKey | null {
  if (target.level === "org") return edition.root_scope;
  if (target.level === "repo") {
    if (!target.owner || !target.name) return null;
    /* Repo routes are path-shaped, so the key is reconstructible exactly —
       no slug round-trip, no ambiguity between `a/b-c` and `a-b/c`. */
    return `repo:${target.owner}/${target.name}`;
  }
  if (!target.slug) return null;
  return edition.keyBySlug[target.slug] ?? null;
}

function projectOf(edition: Edition, repoKey: ScopeKey): NavProject | null {
  for (const project of edition.navigation.projects) {
    if (project.repos.some(repo => repo.key === repoKey)) return project;
  }
  return null;
}

/** `null` when this edition does not publish the scope the URL named. */
export function resolveScope(
  edition: Edition,
  target: ScopeTarget
): ResolvedScope | null {
  const key = keyForTarget(edition, target);
  if (!key) return null;
  const summary = edition.scopeSummaries[key];
  if (!summary) return null;

  /* Level mismatch — `/project/axios-axios` names a real scope by the wrong
     route shape. Treat it as absent rather than quietly redirecting. */
  if (summary.scope.level !== target.level) return null;

  const parentProject =
    target.level === "repo" ? projectOf(edition, key) : null;

  return {
    target,
    key,
    slug: summary.scope.slug,
    label: summary.scope.label,
    summary,
    parent: parentProject
      ? {
          key: parentProject.key,
          label: parentProject.label,
          target: targetForKey(edition, parentProject.key),
        }
      : null,
    path: scopeBasePath(target),
  };
}

/** Every scope in navigation order, flattened — the switcher's row list. */
export interface ScopeRow {
  key: ScopeKey;
  label: string;
  level: "org" | "project" | "repo";
  target: ScopeTarget;
  /** Repo count for a project, `null` otherwise — the switcher's sublabel. */
  repoCount: number | null;
}

export function scopeRows(edition: Edition): ScopeRow[] {
  const rows: ScopeRow[] = [
    {
      key: edition.navigation.org.key,
      label: edition.navigation.org.label,
      level: "org",
      target: ORG_TARGET,
      repoCount: edition.navigation.projects.reduce(
        (total, project) => total + project.repos.length,
        0
      ),
    },
  ];
  for (const project of edition.navigation.projects) {
    rows.push({
      key: project.key,
      label: project.label,
      level: "project",
      target: {
        level: "project",
        slug: project.slug,
        owner: null,
        name: null,
      },
      repoCount: project.repos.length,
    });
    for (const repo of project.repos) {
      rows.push({
        key: repo.key,
        label: repo.label,
        level: "repo",
        target: { level: "repo", slug: null, owner: repo.owner, name: repo.name },
        repoCount: null,
      });
    }
  }
  return rows;
}

/** Deterministic avatar tint for a repo, so the same repo is the same colour. */
export function repoTint(label: string): string {
  const palette = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];
  let hash = 0;
  for (let i = 0; i < label.length; i += 1)
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

export function initialsFor(label: string): string {
  const name = label.includes("/") ? label.split("/")[1] : label;
  return name.slice(0, 2).toUpperCase();
}

export type { NavRepo };
