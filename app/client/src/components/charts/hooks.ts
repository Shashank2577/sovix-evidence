/**
 * Measurement hooks the chart kit needs (SPEC §7.5).
 *
 * Two different questions, deliberately answered two different ways:
 *   - The heatmap's band collapse is a *viewport* rule (≤780 → two-hour bands,
 *     ≤430 → four-hour), so it reads media queries, matching the spec's wording
 *     and the rest of the responsive layer.
 *   - The sparkline's "drop below 56px drawn width" is an *element* rule — a
 *     sparkline in a narrow table cell is narrow whatever the viewport is — so it
 *     measures its own box.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** SSR-safe layout effect; this app is client-rendered but the guard costs nothing. */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/**
 * The element's content-box width, or `null` before the first measurement. Callers
 * distinguish "not measured yet" from "measured as zero" — a sparkline must not
 * flash in and out while the table it lives in is still laying out.
 */
export function useElementWidth<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  number | null,
] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    setWidth(node.getBoundingClientRect().width);
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
