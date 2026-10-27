/**
 * Scope slugs and routes (SPEC §1.2, §1.3).
 *
 * Shared by the build script and the client so a slug can never be spelled two
 * ways. Pure functions only — no fetching, no React.
 */

import type { ScopeKey, ScopeLevel, ScopeSlug } from "./types";

/** The org scope's slug is fixed; its label ("All repositories") is not a route. */
export const ORG_SLUG: ScopeSlug = "org";

/**
 * Slug = lowercase label with every run of non-alphanumeric characters collapsed
 * to a single `-`, trimmed. `"JavaScript and TypeScript"` → `javascript-and-typescript`,
 * `"axios/axios"` → `axios-axios`.
 */
export function slugify(label: string): ScopeSlug {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function scopeLevel(key: ScopeKey): ScopeLevel {
  if (key.startsWith("org:")) return "org";
  if (key.startsWith("project:")) return "project";
  if (key.startsWith("repo:")) return "repo";
  throw new Error(`Unrecognised scope key: ${key}`);
}

/** `"repo:fastapi/fastapi"` → `{ owner: "fastapi", name: "fastapi" }`; null elsewhere. */
export function repoParts(
  key: ScopeKey
): { owner: string; name: string } | null {
  if (!key.startsWith("repo:")) return null;
  const [owner, ...rest] = key.slice("repo:".length).split("/");
  const name = rest.join("/");
  if (!owner || !name) throw new Error(`Malformed repo scope key: ${key}`);
  return { owner, name };
}

export function scopeSlug(key: ScopeKey, label: string): ScopeSlug {
  return scopeLevel(key) === "org" ? ORG_SLUG : slugify(label);
}

/**
 * The scope's Overview route. Repo routes stay path-shaped so
 * `repo:fastapi/fastapi` survives being pasted into Slack (SPEC §1.2).
 */
export function scopePath(key: ScopeKey, slug: ScopeSlug): string {
  const level = scopeLevel(key);
  if (level === "org") return "/";
  if (level === "project") return `/project/${slug}`;
  const parts = repoParts(key)!;
  return `/repo/${parts.owner}/${parts.name}`;
}

/** File that carries this scope's full `ScopeReport`. */
export function scopeFileName(slug: ScopeSlug): string {
  return `${slug}.json`;
}

/** True when `candidate` is `scope` itself or lives beneath it. */
export function isInSubtree(
  scope: ScopeKey,
  candidate: ScopeKey,
  children: Record<ScopeKey, ScopeKey[]>
): boolean {
  if (scope === candidate) return true;
  const queue = [...(children[scope] ?? [])];
  while (queue.length > 0) {
    const next = queue.shift()!;
    if (next === candidate) return true;
    queue.push(...(children[next] ?? []));
  }
  return false;
}
