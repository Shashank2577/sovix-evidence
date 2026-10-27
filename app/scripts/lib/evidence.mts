/**
 * The evidence reverse index (SPEC §9.2, §9.3).
 *
 * "Each record knows every figure it was counted in." The dataset states the
 * relationship one way round — every metric lists its source records — so the build
 * inverts it once, here, and ships the result as `evidence.json`.
 */

import { createHash } from "node:crypto";

import type {
  Cohort,
  EvidenceIndex,
  EvidenceRecord,
  SourceKind,
} from "../../client/src/data/types.ts";

/** The identity of an evidence record: one real commit / PR / file / release / branch / dataset. */
export function evidenceKey(kind: string, repo: string, ref: string): string {
  return `${kind}|${repo}|${ref}`;
}

/**
 * `e-` + the first 10 hex characters of SHA-1 over `kind|repo|ref` (SPEC §9.3).
 * Stable across builds, short enough for a URL; the validator fails the build on a
 * collision rather than letting two records share a page.
 */
export function evidenceId(kind: string, repo: string, ref: string): string {
  return `e-${createHash("sha1")
    .update(evidenceKey(kind, repo, ref))
    .digest("hex")
    .slice(0, 10)}`;
}

/**
 * Merge two `values` objects. Later occurrences of the same record sometimes carry
 * extra keys (an exemplar's copy of a PR knows `merged_by`, the plain source record
 * does not), so the union is kept and a non-empty value never loses to an empty one.
 */
function mergeValues(
  into: Record<string, string | number>,
  from: Record<string, string | number>
): Record<string, string | number> {
  for (const [key, value] of Object.entries(from)) {
    const existing = into[key];
    if (existing === undefined || existing === "" || existing === null)
      into[key] = value;
  }
  return into;
}

export interface BuiltEvidence {
  index: EvidenceIndex;
  /** `kind|repo|ref` → record id, for stamping `evidenceId` onto source records. */
  idByKey: Map<string, string>;
  /** Two distinct keys that hashed to the same id, if any — a build failure. */
  collisions: { id: string; keys: string[] }[];
}

/**
 * Build the index from every `metric.sources` entry in every scope.
 *
 * Exemplar sources are deliberately NOT indexed: an exemplar is an argument about a
 * record, not a citation of it, and the edition's published count (1,104) is the
 * count of *cited* records. Exemplar sources that also appear as citations resolve
 * to the same id and link through; ones that do not carry `evidenceId: null` so no
 * call site can link to a page that does not exist.
 */
export function buildEvidenceIndex(cohort: Cohort): BuiltEvidence {
  const byKey = new Map<string, EvidenceRecord>();
  const keysById = new Map<string, Set<string>>();

  for (const [scopeKey, scope] of Object.entries(cohort.scopes)) {
    for (const metric of scope.metrics) {
      for (const source of metric.sources) {
        const key = evidenceKey(source.kind, source.repo, source.ref);
        let record = byKey.get(key);
        if (!record) {
          const id = evidenceId(source.kind, source.repo, source.ref);
          record = {
            id,
            kind: source.kind,
            repo: source.repo,
            ref: source.ref,
            detail: source.detail,
            values: { ...source.values },
            occurred_at: source.occurred_at,
            url: source.url,
            citedIn: [],
          };
          byKey.set(key, record);
          const keys = keysById.get(id) ?? new Set<string>();
          keys.add(key);
          keysById.set(id, keys);
        } else {
          mergeValues(record.values, source.values);
          if (!record.detail && source.detail) record.detail = source.detail;
          if (record.occurred_at === null && source.occurred_at !== null)
            record.occurred_at = source.occurred_at;
        }
        record.citedIn.push({ scopeKey, metricId: metric.id });
      }
    }
  }

  const collisions = Array.from(keysById.entries())
    .filter(([, keys]) => keys.size > 1)
    .map(([id, keys]) => ({ id, keys: Array.from(keys) }));

  const records = Array.from(byKey.values()).sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    if (a.repo !== b.repo) return a.repo.localeCompare(b.repo);
    return a.ref.localeCompare(b.ref, undefined, { numeric: true });
  });

  const byKind = records.reduce<Record<string, number>>((counts, record) => {
    counts[record.kind] = (counts[record.kind] ?? 0) + 1;
    return counts;
  }, {});

  return {
    index: {
      generated_at: cohort.generated_at,
      total: records.length,
      byKind: byKind as Record<SourceKind, number>,
      records,
    },
    idByKey: new Map(
      Array.from(byKey.entries()).map(
        ([key, record]) => [key, record.id] as const
      )
    ),
    collisions,
  };
}
