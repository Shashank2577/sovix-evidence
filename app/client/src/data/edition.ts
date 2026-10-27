/**
 * Loading the edition (SPEC §9.6).
 *
 * Plain `fetch` plus a module-level cache, no new dependencies. The edition is an
 * immutable artifact: once a file has been read successfully it can be held
 * forever, so the cache never expires and a second visit to a scope costs nothing.
 *
 * Two rules the loader exists to keep:
 *   - A failed fetch is an error state, never a fallback to older numbers. We do
 *     not show possibly-stale figures silently (SPEC §4.2).
 *   - Nothing here derives a figure. It fetches, caches, and hands over (SPEC §9.2).
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { hydrateEdition } from "./hydrate";
import { scopeFileName } from "./scopes";
import type {
  Edition,
  EditionFile,
  EvidenceIndex,
  ScopeReport,
  ScopeSlug,
} from "./types";

/**
 * One constant so a future snapshot switcher changes the data root in one place
 * (SPEC §9.7). No such switcher ships with a single edition.
 */
export const DATA_BASE = "/data";

export const editionPath = () => `${DATA_BASE}/edition.json`;
export const scopePathFor = (slug: ScopeSlug) =>
  `${DATA_BASE}/scopes/${scopeFileName(slug)}`;
export const evidencePath = () => `${DATA_BASE}/evidence.json`;

/* ---------------------------------------------------------------- cache */

const cache = new Map<string, unknown>();
const inFlight = new Map<string, Promise<unknown>>();

export class DataFetchError extends Error {
  constructor(
    readonly path: string,
    readonly reason: string
  ) {
    super(reason);
    this.name = "DataFetchError";
  }
}

async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch (error) {
    throw new DataFetchError(
      path,
      `Network request failed: ${(error as Error).message}`
    );
  }
  if (!response.ok) {
    throw new DataFetchError(
      path,
      `HTTP ${response.status} ${response.statusText}`
    );
  }
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new DataFetchError(
      path,
      `Response was not valid JSON: ${(error as Error).message}`
    );
  }
}

/**
 * Fetch once per path, share the promise while it is in flight, keep the result.
 * `transform` runs once, on the freshly fetched body.
 */
export function loadJson<T>(
  path: string,
  transform: (raw: unknown) => T = raw => raw as T
): Promise<T> {
  const cached = cache.get(path);
  if (cached !== undefined) return Promise.resolve(cached as T);

  const pending = inFlight.get(path);
  if (pending) return pending as Promise<T>;

  const promise = readJson<unknown>(path)
    .then(raw => {
      const value = transform(raw);
      cache.set(path, value);
      return value;
    })
    .finally(() => {
      inFlight.delete(path);
    });

  inFlight.set(path, promise);
  return promise;
}

/** Drop everything held in memory. Used by the refresh action and by tests. */
export function clearDataCache(): void {
  cache.clear();
  inFlight.clear();
}

export const loadEdition = () =>
  loadJson<Edition>(editionPath(), raw => hydrateEdition(raw as EditionFile));
export const loadScope = (slug: ScopeSlug) =>
  loadJson<ScopeReport>(scopePathFor(slug));
export const loadEvidence = () => loadJson<EvidenceIndex>(evidencePath());

/* --------------------------------------------------------------- hooks */

export type AsyncStatus = "loading" | "error" | "ready";

export interface AsyncResource<T> {
  status: AsyncStatus;
  data?: T;
  error?: DataFetchError | Error;
  retry: () => void;
}

/**
 * The shared body of the three hooks. `key` may be null when there is nothing to
 * load yet (an unknown scope slug), which leaves the resource in `loading` for the
 * caller to render as a not-found variant instead.
 */
function useAsyncResource<T>(
  key: string | null,
  load: () => Promise<T>
): AsyncResource<T> {
  const [state, setState] = useState<{
    status: AsyncStatus;
    data?: T;
    error?: Error;
  }>(() => {
    const cached = key === null ? undefined : (cache.get(key) as T | undefined);
    return cached !== undefined
      ? { status: "ready", data: cached }
      : { status: "loading" };
  });
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (key === null) return;

    /* Cached editions render immediately — no artificial skeleton delay (SPEC §4.1). */
    const cached = cache.get(key) as T | undefined;
    if (cached !== undefined) {
      setState({ status: "ready", data: cached });
      return;
    }

    let live = true;
    setState({ status: "loading" });
    loadRef
      .current()
      .then(data => {
        if (live) setState({ status: "ready", data });
      })
      .catch((error: Error) => {
        if (live) setState({ status: "error", error });
      });
    return () => {
      live = false;
    };
  }, [key, attempt]);

  const retry = useCallback(() => {
    if (key !== null) cache.delete(key);
    setAttempt(value => value + 1);
  }, [key]);

  return { status: state.status, data: state.data, error: state.error, retry };
}

/** The shell's data: navigation, findings count, snapshot, coverage (SPEC §4.1). */
export function useEdition(): AsyncResource<Edition> {
  return useAsyncResource(editionPath(), loadEdition);
}

/** One scope's full report. `slug` may be null while the route is still resolving. */
export function useScope(slug: ScopeSlug | null): AsyncResource<ScopeReport> {
  const path = slug === null ? null : scopePathFor(slug);
  return useAsyncResource(path, () => loadScope(slug!));
}

/** The 1,104 cited records — lazy, fetched on first entry to an Evidence route. */
export function useEvidence(): AsyncResource<EvidenceIndex> {
  return useAsyncResource(evidencePath(), loadEvidence);
}

/* ------------------------------------------------------------- refresh */

export interface RefreshResult {
  /** False when `generated_at` is unchanged — snapshots are immutable (SPEC §3.2). */
  changed: boolean;
  edition: Edition;
}

/**
 * Re-fetch `edition.json` past the HTTP cache and compare `generated_at`
 * (SPEC §3.2, §10.5). On an unchanged edition the cache is left alone so nothing
 * on screen flickers; on a newer one every cached file is dropped, because mixing
 * two editions' figures in one view is the one thing this product must not do.
 */
export async function refreshEdition(): Promise<RefreshResult> {
  const previous = cache.get(editionPath()) as Edition | undefined;
  const file = await readJson<EditionFile>(editionPath(), { cache: "reload" });
  const edition = hydrateEdition(file);
  const changed =
    previous === undefined || previous.generated_at !== edition.generated_at;
  if (changed) clearDataCache();
  cache.set(editionPath(), edition);
  return { changed, edition };
}
