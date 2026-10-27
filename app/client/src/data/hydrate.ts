/**
 * `edition.json`'s wire format, and the one place that reads it.
 *
 * The edition file gates first paint (SPEC §4.1) and is budgeted at ~120 KB with a
 * 150 KB ceiling (SPEC §9.1, §11.8). Written naively it is 258 KB, and almost all
 * of the excess is repetition: the same 57 metric labels once per scope, and twelve
 * JSON key names repeated across 570 readings.
 *
 * So the file states each metric's identity once in `metricCatalog` and each
 * reading as a fixed-order row. `hydrateEdition` puts it back together at load, and
 * every screen sees the `Edition` shape SPEC §9.1 describes — nothing downstream
 * knows the file was packed. This moves bytes around; it computes no figures.
 */

import type {
  Edition,
  EditionFile,
  MetricCatalogEntry,
  MetricSummary,
  PackedMetricSummary,
  ScopeKey,
  ScopeSummary,
} from "./types";

/** The column order of a `PackedMetricSummary`. Changing it changes the file format. */
export const PACKED_SUMMARY_COLUMNS = [
  "id",
  "display",
  "value",
  "tier",
  "confidence",
  "coverage_pct",
  "hasSeries",
  "isNA",
] as const;

export function packMetricSummary(summary: MetricSummary): PackedMetricSummary {
  return [
    summary.id,
    summary.display,
    summary.value,
    summary.tier,
    summary.confidence,
    summary.coverage_pct,
    summary.hasSeries,
    summary.isNA,
  ];
}

export function unpackMetricSummary(
  row: PackedMetricSummary,
  catalog: Map<string, MetricCatalogEntry>
): MetricSummary {
  const [id, display, value, tier, confidence, coverage_pct, hasSeries, isNA] =
    row;
  const entry = catalog.get(id);
  if (!entry)
    throw new Error(`edition.json: metric \`${id}\` has no catalog entry`);
  return {
    id,
    label: entry.label,
    family: entry.family,
    unit: entry.unit,
    direction: entry.direction,
    display,
    value,
    tier,
    confidence,
    coverage_pct,
    hasSeries,
    isNA,
  };
}

/** Expand the on-disk edition into the shape every screen expects. */
export function hydrateEdition(file: EditionFile): Edition {
  const catalog = new Map(file.metricCatalog.map(entry => [entry.id, entry]));
  const scopeSummaries: Record<ScopeKey, ScopeSummary> = {};
  for (const [scopeKey, summary] of Object.entries(file.scopeSummaries)) {
    scopeSummaries[scopeKey] = {
      ...summary,
      metrics: summary.metrics.map(row => unpackMetricSummary(row, catalog)),
    };
  }
  return { ...file, scopeSummaries };
}
