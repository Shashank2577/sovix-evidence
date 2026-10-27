/**
 * Reading a record out loud (SPEC §5.8, §5.9).
 *
 * Pure functions, no React: the row renders 1,104 times and the record screen once,
 * and both want the same answers to "what does this record call itself" and "when
 * did it happen". Keeping them here also keeps them testable without a DOM, which is
 * how this chunk's tests run.
 *
 * Nothing here computes a figure (§9.2). The only numbers it touches are counts of
 * things the dataset already stated, and the separators it puts in them.
 */

import type { EvidenceCitation, EvidenceRecord, SourceKind } from "@/data";
import { formatCount } from "@/shell/format";
import * as copy from "@/copy";

/** The lede's order (§5.8), and the chip strip's. Not alphabetical: it descends. */
export const KIND_ORDER: SourceKind[] = [
  "commit",
  "pull_request",
  "file",
  "release",
  "branch",
  "dataset",
];

export function kindLabel(kind: SourceKind, count: number): string {
  return count === 1 ? copy.evidence.kindOne[kind] : copy.evidence.kindMany[kind];
}

/** `"388 commits"`, `"1 pull request"` — the lede and the chip counts. */
export function kindCount(kind: SourceKind, count: number): string {
  return copy.fill(copy.evidence.kindCount, {
    count: formatCount(count),
    label: kindLabel(kind, count),
  });
}

/**
 * `1,104 records cited across this edition · 388 commits · …` (§5.8), built from
 * `edition.evidenceCounts` so the lede is right before `evidence.json` has loaded.
 */
export function indexLede(
  total: number,
  byKind: Record<SourceKind, number>
): string {
  const parts = KIND_ORDER.filter(kind => (byKind[kind] ?? 0) > 0).map(kind =>
    kindCount(kind, byKind[kind])
  );
  return [
    copy.fill(copy.evidence.indexLedeHead, { total: formatCount(total) }),
    ...parts,
  ].join(" · ");
}

/**
 * The two lines a record shows, and the same decision C5 makes for a source row
 * (`sourceLines`): the ten `dataset` records carry no repository and no URL, and
 * their `ref` is an internal handle (`"org:org:all"`) that means nothing to a
 * reader — so for them the `detail` sentence *is* the record and takes the top line,
 * rather than a heading assembled out of nulls.
 *
 * The runtime shape is wider than the type declares here too: `repo` and `url` are
 * typed `string` and are null on every dataset record. The guards are against the
 * data, not the type.
 */
export function recordLines(record: EvidenceRecord): {
  primary: string;
  secondary: string | null;
} {
  return record.repo
    ? { primary: `${record.repo} ${record.ref}`, secondary: record.detail }
    : { primary: record.detail, secondary: null };
}

/**
 * The distinct figures a record was counted in.
 *
 * `citedIn` is an occurrence list, not a set: a collection record cited by
 * `people.active_contributors` appears once per contributor row the metric counted,
 * so `e-e7b0fa0898` carries 161 entries naming 20 distinct (scope, metric) pairs.
 * Thirty-six records are affected.
 *
 * A chip reading "counted in 161 figures" would be false — this edition does not
 * publish 161 figures at that scope — and the card beneath it would repeat the same
 * row twenty-five times. Both surfaces count and list the distinct pairs, which is
 * what "every figure it was counted in" means. The multiplicity is not lost, it is
 * simply not a count of figures: how many times a figure counted a record is part of
 * that figure's sample, which is what the ⌗ on the row opens.
 */
export function distinctCitations(record: EvidenceRecord): EvidenceCitation[] {
  const seen = new Set<string>();
  const distinct: EvidenceCitation[] = [];
  for (const citation of record.citedIn) {
    const key = `${citation.scopeKey}|${citation.metricId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    distinct.push(citation);
  }
  return distinct;
}

/** `"counted in 4 figures"` / `"counted in 1 figure"` (§5.8). */
export function citedLabel(count: number): string {
  return copy.fill(
    count === 1 ? copy.evidence.citedCountOne : copy.evidence.citedCount,
    { count: formatCount(count) }
  );
}

/* ------------------------------------------------------------------ time */

const ABSOLUTE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  hour12: false,
});

/**
 * The `title` behind the relative time (§5.8).
 *
 * Rendered in UTC and labelled as such. The records carry their own offsets
 * (`+05:30` on some commits); resolving them into whatever timezone the reader's
 * laptop is set to would silently restate the dataset's timestamp, and two readers
 * comparing notes would see two different times for the same commit.
 */
export function absoluteTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${ABSOLUTE.format(date).replace("Sept", "Sep")} UTC`;
}

const RELATIVE = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });

const RELATIVE_STEPS: [limitSeconds: number, perUnit: number, unit: Intl.RelativeTimeFormatUnit][] =
  [
    [3600, 60, "minute"],
    [86400, 3600, "hour"],
    [2592000, 86400, "day"],
    [31536000, 2592000, "month"],
  ];

/**
 * `"4 days ago"`, `"3 months ago"`, `"last year"`.
 *
 * `shell/format.ts`'s `relativeTime` stops being relative after 30 days ("on 18 May
 * 2026") because the sidebar it was written for has room for three characters. This
 * list spans a 54-week window, where "3 months ago" is the useful reading and the
 * exact timestamp is one hover — or one record screen — away.
 */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const seconds = Math.round((now - then) / 1000);
  const past = Math.max(0, seconds);
  if (past < 60) return RELATIVE.format(-past, "second");
  for (const [limit, per, unit] of RELATIVE_STEPS) {
    if (past < limit) return RELATIVE.format(-Math.round(past / per), unit);
  }
  return RELATIVE.format(-Math.round(past / 31536000), "year");
}

/* ----------------------------------------------------------- the values */

/**
 * `snake_case` → spaced, as §5.9 asks: unknown keys render as-is rather than being
 * dropped, because a key this build has never seen is still something the collector
 * recorded and a reader may be looking for.
 */
export function humanKey(key: string): string {
  return key.replace(/_/g, " ");
}

/**
 * One `values` entry as text.
 *
 * Absence is stated, never blanked: an open pull request carries `merged: null`, and
 * an empty cell there would read as a rendering fault rather than as a fact about
 * the record (§0.1, §4.3).
 */
export function factValue(value: unknown): string {
  if (value === null || value === undefined) return copy.evidence.recordAbsent;
  if (Array.isArray(value))
    return value.length === 0
      ? copy.evidence.recordNone
      : value.map(item => factValue(item)).join(", ");
  if (typeof value === "boolean")
    return value ? copy.evidence.recordYes : copy.evidence.recordNo;
  if (typeof value === "number")
    return Number.isInteger(value) ? formatCount(value) : String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * The record's own title, when it has one (§5.9). Pull requests carry
 * `values.title`; a commit carries `values.subject`, which is the same thing under
 * the name git gives it.
 */
export function recordTitle(record: EvidenceRecord): string | null {
  const title = record.values?.title ?? record.values?.subject;
  return typeof title === "string" && title.length > 0 ? title : null;
}

/**
 * The `values` keys in render order, with the one already used as the page heading
 * left out — stating it twice would pad the list without adding a fact.
 */
export function factKeys(record: EvidenceRecord): string[] {
  const keys = Object.keys(record.values ?? {});
  const heading = recordTitle(record);
  if (heading === null) return keys;
  return keys.filter(
    key => !(
      (key === "title" || key === "subject") && record.values[key] === heading
    )
  );
}
