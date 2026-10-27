/**
 * Route state as hooks. Thin wrappers over wouter plus `routes.ts` — the shell
 * and the screens read the same parse of the same location.
 */

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useLocation, useSearch } from "wouter";

import { parseAppPath, readWorkingParam, type RouteMatch } from "./routes";

export function useAppRoute(): RouteMatch {
  const [location] = useLocation();
  return useMemo(() => parseAppPath(location), [location]);
}

/** The metric whose working drawer the URL asks for, if any (SPEC §1.3). */
export function useWorkingMetricId(): string | null {
  const search = useSearch();
  return useMemo(() => readWorkingParam(search), [search]);
}

/** Media query as state, via the store React already knows how to subscribe to. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  /* Server snapshot is `false`: desktop-first, so a shell rendered without a
     window never flashes the bottom tab bar. */
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** The shell's mobile swap: sidebar out, bottom tabs in (SPEC §3.4, §7.1). */
export const MOBILE_QUERY = "(max-width: 780px)";

export function useIsMobileShell(): boolean {
  return useMediaQuery(MOBILE_QUERY);
}
