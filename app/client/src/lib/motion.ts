/**
 * Motion tokens — SPEC.md §8.1.
 *
 * A single source of truth for every duration/easing/spring/stagger value
 * used by Framer Motion across the app. Values are normative: chunks that
 * add animation (route transitions, chart reveals, disclosures, etc.) import
 * from here rather than hardcoding their own numbers.
 */

export const duration = {
  /** press, colour shifts */
  fast: 0.12,
  /** hovers, chips, backdrop */
  base: 0.18,
  /** element entrances */
  enter: 0.24,
  /** section reveals, sheet snap */
  slow: 0.32,
  /** chart wipe */
  chart: 0.48,
} as const;

export const ease = {
  /** quint-out — the house curve (from the reference drawer) */
  out: [0.23, 1, 0.32, 1],
  inOut: [0.45, 0, 0.2, 1],
} as const;

export const spring = {
  drawer: { type: "spring", stiffness: 380, damping: 34, mass: 0.9 },
  sheet: { type: "spring", stiffness: 320, damping: 32 },
} as const;

export const stagger = {
  section: 0.06,
  card: 0.04,
  row: 0.03,
  /** cap: first 8 items, remainder share the 8th delay */
  cap: 8,
} as const;

/**
 * Delay for the nth item (0-indexed) in a staggered list, respecting the
 * §8.1 cap: items beyond the 8th share the 8th item's delay rather than
 * pushing the animation out indefinitely.
 */
export function staggerDelay(index: number, step: number): number {
  return Math.min(index, stagger.cap - 1) * step;
}
