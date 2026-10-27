/**
 * The build-time split (SPEC §9.1, §9.2).
 *
 * One 4 MB cohort in, twelve static files out: `edition.json` (shell + summaries,
 * gates first paint), ten per-scope reports, and the evidence index. Pure
 * functions — `build-data.mts` owns reading and writing.
 */

import {
  findingIndicesFor,
  monthDelta,
  nearestThreshold,
  rulesFromHeadlines,
  sparklineFrom,
  tierCounts,
  deriveStatus,
} from "../../client/src/data/derive.ts";
import { packMetricSummary } from "../../client/src/data/hydrate.ts";
import {
  repoParts,
  scopePath,
  scopeSlug,
} from "../../client/src/data/scopes.ts";
import type {
  Cohort,
  EditionFile,
  EditionGlossary,
  EvidenceIndex,
  Metric,
  MetricCatalogEntry,
  MetricSummary,
  Navigation,
  RawMetric,
  RawScope,
  ScopeKey,
  ScopeRefResolved,
  ScopeReport,
  ScopeSlug,
  ScopeSummaryPacked,
  SourceRecord,
} from "../../client/src/data/types.ts";
import { buildEvidenceIndex, evidenceKey } from "./evidence.mts";
import { unaccountedIn } from "./validate.mts";

export interface BuiltNavigation {
  navigation: Navigation;
  scopeOrder: ScopeKey[];
  slugByKey: Record<ScopeKey, ScopeSlug>;
  keyBySlug: Record<ScopeSlug, ScopeKey>;
}

/** Navigation with the routing derivations folded in, in the order the sidebar shows. */
export function buildNavigation(cohort: Cohort): BuiltNavigation {
  const slugByKey: Record<ScopeKey, ScopeSlug> = {};
  const keyBySlug: Record<ScopeSlug, ScopeKey> = {};
  const scopeOrder: ScopeKey[] = [];

  const register = (key: ScopeKey, label: string): ScopeSlug => {
    const slug = scopeSlug(key, label);
    slugByKey[key] = slug;
    keyBySlug[slug] = key;
    scopeOrder.push(key);
    return slug;
  };

  const orgKey = cohort.root_scope;
  const orgLabel = cohort.scopes[orgKey].scope.label;
  const orgSlug = register(orgKey, orgLabel);

  const projects = cohort.navigation.projects.map(project => {
    const projectSlug = register(project.key, project.label);
    const repos = project.repos.map(repo => {
      const repoSlug = register(repo.key, repo.label);
      const parts = repoParts(repo.key)!;
      return {
        key: repo.key,
        label: repo.label,
        slug: repoSlug,
        owner: parts.owner,
        name: parts.name,
        path: scopePath(repo.key, repoSlug),
      };
    });
    return {
      key: project.key,
      label: project.label,
      slug: projectSlug,
      path: scopePath(project.key, projectSlug),
      repos,
    };
  });

  return {
    navigation: {
      org: {
        key: orgKey,
        label: orgLabel,
        slug: orgSlug,
        path: scopePath(orgKey, orgSlug),
      },
      projects,
    },
    scopeOrder,
    slugByKey,
    keyBySlug,
  };
}

function resolveScopeRef(scope: RawScope, slug: ScopeSlug): ScopeRefResolved {
  const parts = repoParts(scope.scope.key);
  return {
    ...scope.scope,
    slug,
    path: scopePath(scope.scope.key, slug),
    owner: parts?.owner ?? null,
    name: parts?.name ?? null,
  };
}

function withEvidenceId(
  source: Omit<SourceRecord, "evidenceId">,
  idByKey: Map<string, string>
): SourceRecord {
  return {
    ...source,
    evidenceId:
      idByKey.get(evidenceKey(source.kind, source.repo, source.ref)) ?? null,
  };
}

/** Fold every derived field onto one metric. Verbatim data is copied, never rewritten. */
function deriveMetric(
  metric: RawMetric,
  scope: RawScope,
  idByKey: Map<string, string>
): Metric {
  const series =
    scope.series.find(candidate => candidate.metric_id === metric.id) ?? null;
  return {
    ...metric,
    sample: { ...metric.sample, unaccounted: unaccountedIn(metric) },
    sources: metric.sources.map(source => withEvidenceId(source, idByKey)),
    exemplars: metric.exemplars.map(exemplar => ({
      ...exemplar,
      source: withEvidenceId(exemplar.source, idByKey),
    })),
    hasSeries: series !== null,
    isNA: metric.value === null,
    sparkline: series
      ? sparklineFrom(series, scope.scope.since, scope.scope.until)
      : null,
    mom: series ? monthDelta(series, metric.direction) : null,
  };
}

export function buildScopeReport(
  scope: RawScope,
  slug: ScopeSlug,
  idByKey: Map<string, string>
): ScopeReport {
  return {
    scope: resolveScopeRef(scope, slug),
    facts: scope.facts,
    metrics: scope.metrics.map(metric => deriveMetric(metric, scope, idByKey)),
    series: scope.series,
    heatmap: scope.heatmap,
    comparison: scope.comparison,
    children: scope.children,
  };
}

function summariseMetric(metric: Metric): MetricSummary {
  return {
    id: metric.id,
    label: metric.label,
    family: metric.family,
    unit: metric.unit,
    display: metric.display,
    value: metric.value,
    tier: metric.tier,
    confidence: metric.confidence,
    direction: metric.direction,
    coverage_pct: metric.sample.coverage_pct,
    hasSeries: metric.hasSeries,
    isNA: metric.isNA,
  };
}

/** Every scope key at or beneath `root`, walked through the `children` graph. */
function subtreeOf(
  root: ScopeKey,
  childrenByKey: Record<ScopeKey, ScopeKey[]>
): Set<ScopeKey> {
  const seen = new Set<ScopeKey>([root]);
  const queue = [...(childrenByKey[root] ?? [])];
  while (queue.length > 0) {
    const next = queue.shift()!;
    if (seen.has(next)) continue;
    seen.add(next);
    queue.push(...(childrenByKey[next] ?? []));
  }
  return seen;
}

/**
 * The glossary minus the prose every scope report already carries verbatim with
 * real values substituted. What stays is what the command palette and the family
 * grouping need before a scope file has loaded (SPEC §3.3, §5.3).
 */
function briefGlossary(cohort: Cohort): EditionGlossary {
  return {
    families: cohort.glossary.families,
    definitions: cohort.glossary.definitions.map(definition => ({
      id: definition.id,
      label: definition.label,
      unit: definition.unit,
      family: definition.family,
      family_label: definition.family_label,
      tier: definition.tier,
      direction: definition.direction,
      confidence: definition.confidence,
      also_known_as: definition.also_known_as,
    })),
  };
}

export interface BuiltEdition {
  edition: EditionFile;
  /** slug → the full report that becomes `data/scopes/<slug>.json`. */
  reports: Map<ScopeSlug, ScopeReport>;
  evidence: EvidenceIndex;
}

export function buildEdition(cohort: Cohort): BuiltEdition {
  const { navigation, scopeOrder, slugByKey, keyBySlug } =
    buildNavigation(cohort);
  const { index: evidence, idByKey } = buildEvidenceIndex(cohort);

  const childrenByKey: Record<ScopeKey, ScopeKey[]> = {};
  for (const [key, scope] of Object.entries(cohort.scopes))
    childrenByKey[key] = scope.children ?? [];

  const rules = rulesFromHeadlines(cohort.headlines);
  const reports = new Map<ScopeSlug, ScopeReport>();
  const scopeSummaries: Record<ScopeKey, ScopeSummaryPacked> = {};

  for (const scopeKey of scopeOrder) {
    const scope = cohort.scopes[scopeKey];
    if (!scope)
      throw new Error(
        `Navigation lists scope \`${scopeKey}\`, which the cohort does not publish`
      );

    const slug = slugByKey[scopeKey];
    const report = buildScopeReport(scope, slug, idByKey);
    reports.set(slug, report);

    const subtree = subtreeOf(scopeKey, childrenByKey);
    const subtreeFindingIndices: number[] = [];
    cohort.headlines.forEach((headline, index) => {
      if (subtree.has(headline.scope_key)) subtreeFindingIndices.push(index);
    });
    const findingIndices = findingIndicesFor(cohort.headlines, scopeKey);

    scopeSummaries[scopeKey] = {
      scope: report.scope,
      facts: report.facts,
      children: report.children,
      metrics: report.metrics.map(metric =>
        packMetricSummary(summariseMetric(metric))
      ),
      status: deriveStatus(
        findingIndices.map(index => cohort.headlines[index])
      ),
      findingIndices,
      subtreeFindingIndices,
      /* The hero's empty variant only appears when nothing fired anywhere in the
       * subtree, so the fallback is only computed where it can be shown. */
      nearestThreshold:
        subtreeFindingIndices.length === 0
          ? nearestThreshold(rules, report.metrics)
          : null,
      tierCounts: tierCounts(report.metrics),
    };
  }

  const rootMetrics = reports.get(slugByKey[cohort.root_scope])!.metrics;
  const metricCatalog: MetricCatalogEntry[] = rootMetrics.map(metric => ({
    id: metric.id,
    label: metric.label,
    family: metric.family,
    unit: metric.unit,
    direction: metric.direction,
  }));

  const edition: EditionFile = {
    schema_version: cohort.schema_version,
    generated_at: cohort.generated_at,
    org_label: cohort.org_label,
    root_scope: cohort.root_scope,
    navigation,
    scopeOrder,
    slugByKey,
    keyBySlug,
    headlines: cohort.headlines,
    glossary: briefGlossary(cohort),
    thresholds: cohort.thresholds,
    collection: cohort.collection,
    data_quality: cohort.data_quality,
    exclusions: cohort.exclusions,
    metricCatalog,
    scopeSummaries,
    evidenceCounts: { total: evidence.total, byKind: evidence.byKind },
  };

  return { edition, reports, evidence };
}
