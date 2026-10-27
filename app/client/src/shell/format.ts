/**
 * Chrome-level formatting. Dates and counts only — no figure is computed here
 * or anywhere else in the client (SPEC §9.2, §9.8); every metric value on
 * screen comes from the dataset's own `display` string.
 */

const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const LONG_DAY = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * `"14 Sep 2026"` — the snapshot list and the refresh toast, whose copy SPEC
 * §3.2 quotes verbatim. `en-GB` abbreviates September as "Sept"; the spec's
 * three-letter form wins, so the abbreviation is clipped back.
 */
export function formatDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return DAY.format(date).replace("Sept", "Sep");
}

/** `"14 September 2026"` — the page eyebrow. */
export function formatLongDay(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : LONG_DAY.format(date);
}

const UNITS: [limitSeconds: number, perUnit: number, name: string][] = [
  [60, 1, "s"],
  [3600, 60, "m"],
  [86400, 3600, "h"],
  [2592000, 86400, "d"],
];

/** `"11m ago"`. Coarse on purpose: the sidebar has room for three characters. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 45) return "just now";
  for (const [limit, per, name] of UNITS) {
    if (seconds < limit) return `${Math.round(seconds / per)}${name} ago`;
  }
  return `on ${formatDay(iso)}`;
}

const COUNT = new Intl.NumberFormat("en-GB");

/** Counts of things (commits, records) — never a metric value. */
export function formatCount(value: number): string {
  return COUNT.format(value);
}
