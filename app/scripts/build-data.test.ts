/**
 * C1's definition of done (SPEC §12): the script emits 12 files, the validator
 * passes on `cohort.json` and fails on a deliberately corrupted fixture, and the
 * slug, evidence-id, reverse-index and status derivations are covered.
 *
 * These run against the real 4 MB cohort, not a mock. The reverse-index count is
 * the product's own published figure — if it moves, a screen's lede is wrong.
 */

import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import {
  FLOOR_METRIC_IDS,
  NON_FLOOR_AI_METRIC_IDS,
  deriveStatus,
  isFloorMetric,
  monthDelta,
  monthRange,
  nearestThreshold,
  rulesFromHeadlines,
  sparklineFrom,
} from "../client/src/data/derive.ts";
import {
  hydrateEdition,
  packMetricSummary,
  unpackMetricSummary,
} from "../client/src/data/hydrate.ts";
import {
  repoParts,
  scopePath,
  scopeSlug,
  slugify,
} from "../client/src/data/scopes.ts";
import type {
  Cohort,
  EditionFile,
  EvidenceIndex,
  Headline,
  MetricCatalogEntry,
  ScopeReport,
  Series,
} from "../client/src/data/types.ts";
import { buildData } from "./build-data.mts";
import { buildEvidenceIndex, evidenceId } from "./lib/evidence.mts";
import { buildEdition } from "./lib/transform.mts";
import { validateCohort } from "./lib/validate.mts";
import { CORRUPTIONS, corruptCohort } from "./__fixtures__/corrupt.ts";
import { miniCohort } from "./__fixtures__/mini-cohort.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let cohort: Cohort;

beforeAll(async () => {
  cohort = JSON.parse(
    await readFile(path.join(ROOT, "data", "cohort.json"), "utf-8")
  ) as Cohort;
});

/* ------------------------------------------------------- slugs (§1.2) */

describe("scope slugs", () => {
  it("lowercases the label and collapses non-alphanumeric runs", () => {
    expect(slugify("JavaScript and TypeScript")).toBe(
      "javascript-and-typescript"
    );
    expect(slugify("Python")).toBe("python");
    expect(slugify("axios/axios")).toBe("axios-axios");
    expect(slugify("fastapi/fastapi")).toBe("fastapi-fastapi");
  });

  it("trims leading and trailing separators rather than leaving bare dashes", () => {
    expect(slugify("  Go  ")).toBe("go");
    expect(slugify("@scope/pkg!")).toBe("scope-pkg");
    expect(slugify("a---b")).toBe("a-b");
  });

  it("gives the org scope the fixed `org` slug, not one made from its label", () => {
    expect(scopeSlug("org:all", "All repositories")).toBe("org");
  });

  it("keeps repo routes path-shaped so a pasted link survives (§1.2)", () => {
    expect(scopePath("org:all", "org")).toBe("/");
    expect(scopePath("project:Go", "go")).toBe("/project/go");
    expect(scopePath("repo:fastapi/fastapi", "fastapi-fastapi")).toBe(
      "/repo/fastapi/fastapi"
    );
    expect(repoParts("repo:fastapi/fastapi")).toEqual({
      owner: "fastapi",
      name: "fastapi",
    });
    expect(repoParts("project:Go")).toBeNull();
  });

  it("produces the ten slugs in the route table, all distinct", () => {
    const slugs = Object.entries(cohort.scopes).map(([key, scope]) =>
      scopeSlug(key, scope.scope.label)
    );
    expect(slugs).toEqual([
      "org",
      "javascript-and-typescript",
      "axios-axios",
      "eslint-eslint",
      "vitejs-vite",
      "python",
      "fastapi-fastapi",
      "mitmproxy-mitmproxy",
      "go",
      "helm-helm",
    ]);
    expect(new Set(slugs).size).toBe(10);
  });
});

/* ------------------------------------------- evidence ids (§9.3, §9.2) */

describe("evidence ids", () => {
  it("is `e-` plus the first 10 hex of SHA-1 over kind|repo|ref", () => {
    const expected = `e-${createHash("sha1").update("pull_request|fastapi/fastapi|#16210").digest("hex").slice(0, 10)}`;
    expect(evidenceId("pull_request", "fastapi/fastapi", "#16210")).toBe(
      expected
    );
    expect(expected).toMatch(/^e-[0-9a-f]{10}$/);
  });

  it("is stable across calls and sensitive to every component", () => {
    const id = evidenceId("commit", "helm/helm", "abc1234");
    expect(evidenceId("commit", "helm/helm", "abc1234")).toBe(id);
    expect(evidenceId("file", "helm/helm", "abc1234")).not.toBe(id);
    expect(evidenceId("commit", "axios/axios", "abc1234")).not.toBe(id);
    expect(evidenceId("commit", "helm/helm", "abc1235")).not.toBe(id);
  });
});

describe("the evidence reverse index", () => {
  let evidence: EvidenceIndex;

  beforeAll(() => {
    evidence = buildEvidenceIndex(cohort).index;
  });

  it("holds the 1,104 distinct records the edition cites (§5.8)", () => {
    expect(evidence.total).toBe(1104);
    expect(evidence.records).toHaveLength(1104);
  });

  it("breaks down exactly as the Evidence index lede states", () => {
    expect(evidence.byKind).toEqual({
      commit: 388,
      pull_request: 287,
      file: 245,
      release: 102,
      branch: 72,
      dataset: 10,
    });
    const summed = Object.values(evidence.byKind).reduce(
      (total, count) => total + count,
      0
    );
    expect(summed).toBe(1104);
  });

  it("assigns every record a unique id — no collisions to fail the build on", () => {
    expect(new Set(evidence.records.map(record => record.id)).size).toBe(1104);
    expect(buildEvidenceIndex(cohort).collisions).toEqual([]);
  });

  it("indexes cited sources only, not exemplar-only records", () => {
    const cited = new Set<string>();
    const exemplarOnly = new Set<string>();
    for (const scope of Object.values(cohort.scopes)) {
      for (const metric of scope.metrics) {
        for (const source of metric.sources)
          cited.add(`${source.kind}|${source.repo}|${source.ref}`);
        for (const exemplar of metric.exemplars) {
          exemplarOnly.add(
            `${exemplar.source.kind}|${exemplar.source.repo}|${exemplar.source.ref}`
          );
        }
      }
    }
    for (const key of cited) exemplarOnly.delete(key);
    expect(cited.size).toBe(1104);
    expect(exemplarOnly.size).toBeGreaterThan(0);
  });

  it("records every (scope, metric) that counted a record", () => {
    const record = evidence.records.find(
      candidate =>
        candidate.kind === "pull_request" &&
        candidate.repo === "fastapi/fastapi" &&
        candidate.ref === "#16210"
    );
    expect(record).toBeDefined();
    expect(record!.citedIn.length).toBeGreaterThan(0);
    expect(record!.citedIn).toContainEqual({
      scopeKey: "repo:fastapi/fastapi",
      metricId: "process.review_coverage",
    });
    expect(record!.url).toBe("https://github.com/fastapi/fastapi/pull/16210");
  });

  it("accounts for every citation in the cohort, none dropped or duplicated", () => {
    let citations = 0;
    for (const scope of Object.values(cohort.scopes)) {
      for (const metric of scope.metrics) citations += metric.sources.length;
    }
    const indexed = evidence.records.reduce(
      (total, record) => total + record.citedIn.length,
      0
    );
    expect(indexed).toBe(citations);
  });
});

/* --------------------------------------------- status pill (§5.6, §6.15) */

describe("status derivation", () => {
  const headline = (severity: Headline["severity"]): Headline => ({
    severity,
    title: "t",
    detail: "d",
    action: "a",
    metric_id: "process.review_coverage",
    scope_key: "repo:acme/widget",
    value_display: "40.0%",
    rule_comparison: "<",
    rule_threshold: 50,
    ruleset_version: "r1",
  });

  it("is healthy when nothing fired", () => {
    expect(deriveStatus([])).toBe("healthy");
  });

  it("stays healthy on info alone — info is not a judgement", () => {
    expect(deriveStatus([headline("info"), headline("info")])).toBe("healthy");
  });

  it("is watch on any warning and critical on any critical", () => {
    expect(deriveStatus([headline("info"), headline("warning")])).toBe("watch");
    expect(deriveStatus([headline("warning"), headline("critical")])).toBe(
      "critical"
    );
    expect(deriveStatus([headline("critical")])).toBe("critical");
  });

  it("takes the worst severity regardless of order", () => {
    expect(deriveStatus([headline("critical"), headline("info")])).toBe(
      "critical"
    );
    expect(deriveStatus([headline("info"), headline("critical")])).toBe(
      "critical"
    );
  });

  it("restates the real rulebook across the six repositories", () => {
    const { edition } = buildEdition(cohort);
    const statuses = Object.fromEntries(
      Object.entries(edition.scopeSummaries)
        .filter(([key]) => key.startsWith("repo:"))
        .map(([key, summary]) => [key, summary.status])
    );
    expect(statuses).toEqual({
      "repo:axios/axios": "watch",
      "repo:eslint/eslint": "healthy",
      "repo:vitejs/vite": "healthy",
      "repo:fastapi/fastapi": "critical",
      "repo:mitmproxy/mitmproxy": "watch",
      "repo:helm/helm": "healthy",
    });
  });
});

/* --------------------------------------------- floors (§0.1, §6.3, §9.4) */

describe("the floor prefix set", () => {
  it("covers the three understated shares and nothing else", () => {
    expect([...FLOOR_METRIC_IDS]).toEqual([
      "ai.detected_commit_share",
      "ai.detected_line_share",
      "ai.adopter_share",
    ]);
    for (const id of FLOOR_METRIC_IDS) expect(isFloorMetric(id)).toBe(true);
  });

  it("excludes the within-trace share and the three cohort deltas", () => {
    for (const id of NON_FLOOR_AI_METRIC_IDS)
      expect(isFloorMetric(id)).toBe(false);
    expect(isFloorMetric("ai.tool_concentration")).toBe(false);
    expect(isFloorMetric("ai.commit_size_delta")).toBe(false);
    expect(isFloorMetric("process.review_coverage")).toBe(false);
  });

  it("names metrics this edition actually publishes, all in the ai family", () => {
    const byId = new Map(
      cohort.scopes[cohort.root_scope].metrics.map(metric => [
        metric.id,
        metric,
      ])
    );
    for (const id of [...FLOOR_METRIC_IDS, ...NON_FLOOR_AI_METRIC_IDS]) {
      expect(byId.get(id)?.family, id).toBe("ai");
    }
  });
});

/* ---------------------------------------------- other derivations (§9.2) */

describe("series derivations", () => {
  const series: Series = {
    id: "review_coverage",
    label: "Review coverage",
    unit: "percent",
    metric_id: "process.review_coverage",
    note: "",
    points: [
      { month: "2026-01", value: 30, detail: {} },
      { month: "2026-03", value: 40, detail: {} },
    ],
  };

  it("enumerates months inclusively across a year boundary", () => {
    expect(monthRange("2025-11", "2026-02")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
    expect(monthRange("2026-03", "2026-03")).toEqual(["2026-03"]);
  });

  it("leaves a month with no records as a gap, never a zero (§0.1)", () => {
    const points = sparklineFrom(
      series,
      "2026-01-01T00:00:00Z",
      "2026-03-31T00:00:00Z"
    );
    expect(points).toEqual([
      { month: "2026-01", value: 30 },
      { month: "2026-02", value: null },
      { month: "2026-03", value: 40 },
    ]);
  });

  it("refuses an m/m delta across a gap — the two months must be adjacent", () => {
    expect(monthDelta(series, "higher_is_better")).toBeNull();
  });

  it("treats a month the dataset recorded nothing in as a gap, not a zero", () => {
    /* The cohort states the month and withholds the figure; 180 of its 1,134
     * points look like this, and every one must survive as a gap. */
    const withHole: Series = {
      ...series,
      points: [
        { month: "2026-01", value: null, detail: {} },
        { month: "2026-02", value: null, detail: {} },
        { month: "2026-03", value: 40, detail: {} },
      ],
    };
    const points = sparklineFrom(
      withHole,
      "2026-01-01T00:00:00Z",
      "2026-03-31T00:00:00Z"
    );
    expect(points.map(point => point.value)).toEqual([null, null, 40]);
    expect(points.some(point => point.value === 0)).toBe(false);
    expect(monthDelta(withHole, "higher_is_better")).toBeNull();
  });

  it("carries the real cohort's null months through to the sparkline untouched", () => {
    const { reports } = buildEdition(cohort);
    const report = reports.get("fastapi-fastapi")!;
    const sparkline = report.metrics.find(
      metric => metric.id === "process.review_coverage"
    )!.sparkline!;
    const rawPoints = report.series.find(
      candidate => candidate.id === "review_coverage"
    )!.points;
    expect(sparkline).toHaveLength(12);
    for (const point of sparkline) {
      const raw = rawPoints.find(candidate => candidate.month === point.month);
      expect(point.value, point.month).toBe(raw?.value ?? null);
    }
    expect(sparkline.filter(point => point.value === null)).toHaveLength(10);
  });

  it("formats the delta in points for percents and in the unit otherwise", () => {
    const adjacent: Series = {
      ...series,
      points: [
        { month: "2026-02", value: 30 },
        { month: "2026-03", value: 34.8 },
      ].map(point => ({ ...point, detail: {} })),
    };
    expect(monthDelta(adjacent, "higher_is_better")).toMatchObject({
      display: "+4.8 pts",
      tone: "positive",
    });
    expect(monthDelta(adjacent, "lower_is_better")).toMatchObject({
      tone: "negative",
    });
    expect(monthDelta(adjacent, "neutral")).toMatchObject({ tone: "neutral" });
    expect(
      monthDelta({ ...adjacent, unit: "commits" }, "neutral")
    ).toMatchObject({ display: "+4.8 commits" });
  });
});

describe("the hero's nearest-to-threshold fallback (§5.1.3)", () => {
  it("picks the closest rule that did not fire", () => {
    const rules = rulesFromHeadlines(cohort.headlines);
    expect(rules).toHaveLength(8);
    const nearest = nearestThreshold(rules, [
      {
        id: "process.review_coverage",
        label: "Review coverage",
        value: 52,
        display: "52.0%",
      },
      { id: "people.bus_factor", label: "Bus factor", value: 9, display: "9" },
    ]);
    expect(nearest).toMatchObject({
      metricId: "process.review_coverage",
      threshold: 50,
      distance: 2,
    });
  });

  it("is computed for every scope where nothing fired in the subtree, and only those", () => {
    const { edition } = buildEdition(cohort);
    for (const summary of Object.values(edition.scopeSummaries)) {
      if (summary.subtreeFindingIndices.length === 0)
        expect(summary.nearestThreshold).not.toBeNull();
      else expect(summary.nearestThreshold).toBeNull();
    }
    expect(edition.scopeSummaries["project:Go"].subtreeFindingIndices).toEqual(
      []
    );
    expect(
      edition.scopeSummaries["project:Go"].nearestThreshold
    ).not.toBeNull();
    /* The org sees everything beneath it, so its hero is always populated. */
    expect(
      edition.scopeSummaries["org:all"].subtreeFindingIndices
    ).toHaveLength(8);
  });
});

/* -------------------------------------------------- the validator (§9.4) */

describe("the validator", () => {
  it("passes on the real cohort", () => {
    expect(validateCohort(cohort)).toEqual([]);
  });

  it("passes on the small control fixture", () => {
    expect(validateCohort(miniCohort())).toEqual([]);
  });

  it("fails on the corrupted fixture, once per rule", () => {
    const issues = validateCohort(corruptCohort());
    expect(issues).toHaveLength(CORRUPTIONS.length);
    expect(issues.map(issue => issue.code).sort()).toEqual(
      [
        "comparison-metric",
        "floor-metric",
        "glossary-coverage",
        "headline-metric",
        "headline-scope",
        "sample-arithmetic",
        "sample-coverage",
        "series-metric",
        "series-window",
        "slug-collision",
        "unexplained-absence",
      ].sort()
    );
  });

  it("catches an impossible over-count in the sample breakdown", () => {
    const broken = miniCohort();
    broken.scopes["org:all"].metrics[0].sample.excluded = {
      "pull requests not merged": 99,
    };
    const issues = validateCohort(broken);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code: "sample-arithmetic" });
  });

  it("refuses a null value with no explanation at all", () => {
    const broken = miniCohort();
    const metric = broken.scopes["org:all"].metrics.find(
      candidate => candidate.value === null
    )!;
    metric.caveats = [];
    metric.sample = {
      ...metric.sample,
      n: 4,
      population: 4,
      coverage_pct: 100,
    };
    expect(validateCohort(broken).map(issue => issue.code)).toEqual([
      "unexplained-absence",
    ]);
  });

  it("refuses a missing top-level key before looking at anything else", () => {
    const broken = miniCohort() as Partial<Cohort>;
    delete broken.headlines;
    expect(validateCohort(broken as Cohort)).toEqual([
      {
        code: "shape",
        where: "cohort",
        message: "missing required top-level key `headlines`",
      },
    ]);
  });
});

/* ------------------------------------- the sample-breakdown invariant */

describe("sample arithmetic in the emitted files (§6.6)", () => {
  it("reconciles n + Σexcluded + unaccounted to the population, every metric, every scope", () => {
    const { reports } = buildEdition(cohort);
    let checked = 0;
    let withRemainder = 0;
    for (const report of reports.values()) {
      for (const metric of report.metrics) {
        const excluded = Object.values(metric.sample.excluded).reduce(
          (total, count) => total + count,
          0
        );
        expect(
          metric.sample.n + excluded + metric.sample.unaccounted,
          `${report.scope.key} · ${metric.id}`
        ).toBe(metric.sample.population);
        expect(metric.sample.unaccounted).toBeGreaterThanOrEqual(0);
        checked += 1;
        if (metric.sample.unaccounted > 0) withRemainder += 1;
      }
    }
    expect(checked).toBe(570);
    /* The dataset leaves a remainder on 20 readings; the build names it rather
     * than letting the breakdown quietly fail to add up. */
    expect(withRemainder).toBe(20);
  });
});

/* ------------------------------------------- the packed wire format */

describe("the edition wire format", () => {
  it("round-trips a summary through pack and unpack unchanged", () => {
    const { edition } = buildEdition(cohort);
    const catalog = new Map<string, MetricCatalogEntry>(
      edition.metricCatalog.map(entry => [entry.id, entry])
    );
    const hydrated = hydrateEdition(edition);
    const summary = hydrated.scopeSummaries[
      "repo:fastapi/fastapi"
    ].metrics.find(metric => metric.id === "process.review_coverage")!;
    expect(summary).toMatchObject({
      id: "process.review_coverage",
      display: "7.8%",
      value: 7.8,
      direction: "higher_is_better",
      family: "process",
      isNA: false,
    });
    expect(unpackMetricSummary(packMetricSummary(summary), catalog)).toEqual(
      summary
    );
  });

  it("rehydrates all 57 metrics for all 10 scopes", () => {
    const { edition } = buildEdition(cohort);
    const hydrated = hydrateEdition(edition);
    expect(Object.keys(hydrated.scopeSummaries)).toHaveLength(10);
    for (const summary of Object.values(hydrated.scopeSummaries)) {
      expect(summary.metrics).toHaveLength(57);
      expect(summary.metrics.every(metric => metric.label.length > 0)).toBe(
        true
      );
    }
  });

  it("throws rather than inventing a label for a metric with no catalog entry", () => {
    expect(() =>
      unpackMetricSummary(
        ["nope", "1", 1, "measured", "high", 100, false, false],
        new Map()
      )
    ).toThrow(/no catalog entry/);
  });
});

/* ------------------------------------------------ the emitted files */

describe("build-data emits the edition", () => {
  let outDir: string;
  let emitted: { path: string; bytes: number }[];

  beforeAll(async () => {
    outDir = await mkdtemp(path.join(os.tmpdir(), "sovix-data-"));
    emitted = await buildData({ out: outDir, quiet: true });
  });

  it("writes exactly 12 files: the edition, ten scopes, the evidence index", async () => {
    expect(emitted).toHaveLength(12);
    expect(await readdir(outDir)).toEqual(
      expect.arrayContaining(["edition.json", "evidence.json", "scopes"])
    );
    expect(await readdir(path.join(outDir, "scopes"))).toHaveLength(10);
  });

  it("stays inside the §11.8 size budget", () => {
    const edition = emitted.find(file => file.path.endsWith("edition.json"))!;
    const largestScope = Math.max(
      ...emitted
        .filter(file => file.path.includes(`${path.sep}scopes${path.sep}`))
        .map(file => file.bytes)
    );
    expect(edition.bytes).toBeLessThanOrEqual(150 * 1024);
    expect(largestScope).toBeLessThanOrEqual(500 * 1024);
  });

  it("names each scope file by its slug and round-trips the route", async () => {
    const file = JSON.parse(
      await readFile(
        path.join(outDir, "scopes", "fastapi-fastapi.json"),
        "utf-8"
      )
    ) as ScopeReport;
    expect(file.scope).toMatchObject({
      key: "repo:fastapi/fastapi",
      slug: "fastapi-fastapi",
      path: "/repo/fastapi/fastapi",
      owner: "fastapi",
      name: "fastapi",
    });
    expect(file.metrics).toHaveLength(57);
    expect(file.series).toHaveLength(9);
    expect(file.heatmap.grid).toHaveLength(7);
    expect(file.heatmap.grid[0]).toHaveLength(24);
  });

  it("stamps every cited source record with the evidence id it resolves to", async () => {
    const file = JSON.parse(
      await readFile(path.join(outDir, "scopes", "org.json"), "utf-8")
    ) as ScopeReport;
    const evidence = JSON.parse(
      await readFile(path.join(outDir, "evidence.json"), "utf-8")
    ) as EvidenceIndex;
    const ids = new Set(evidence.records.map(record => record.id));
    for (const metric of file.metrics) {
      for (const source of metric.sources) {
        expect(source.evidenceId, `${metric.id} ${source.ref}`).not.toBeNull();
        expect(ids.has(source.evidenceId!)).toBe(true);
      }
    }
  });

  it("keeps the dataset's display strings verbatim — no reformatting (§9.8)", async () => {
    const file = JSON.parse(
      await readFile(path.join(outDir, "scopes", "org.json"), "utf-8")
    ) as ScopeReport;
    const floor = file.metrics.find(
      metric => metric.id === "ai.detected_commit_share"
    )!;
    /* The `≥` is the client's job via FloorFigure; the data must not carry it (§0.1). */
    expect(floor.display).toBe("1.9%");
    expect(floor.display).not.toContain("≥");
    const na = file.metrics.find(
      metric => metric.id === "ai.floor_understatement"
    )!;
    expect(na.isNA).toBe(true);
    expect(na.value).toBeNull();
    expect(na.display).toBe("not available");
  });

  it("refuses to write anything when validation fails", async () => {
    const failDir = await mkdtemp(path.join(os.tmpdir(), "sovix-fail-"));
    await expect(
      buildData({
        input: path.join(
          ROOT,
          "scripts",
          "__fixtures__",
          "corrupt-cohort.json"
        ),
        out: failDir,
        quiet: true,
      })
    ).rejects.toThrow(/Validation failed with 11 issue/);
    expect(await readdir(failDir)).toEqual([]);
    await rm(failDir, { recursive: true, force: true });
  });

  it("hydrates the written edition into the shape the screens expect", async () => {
    const file = JSON.parse(
      await readFile(path.join(outDir, "edition.json"), "utf-8")
    ) as EditionFile;
    const edition = hydrateEdition(file);
    expect(edition.headlines).toHaveLength(8);
    expect(edition.scopeOrder).toHaveLength(10);
    expect(edition.evidenceCounts.total).toBe(1104);
    expect(
      edition.navigation.projects.flatMap(project => project.repos)
    ).toHaveLength(6);
    expect(edition.keyBySlug["fastapi-fastapi"]).toBe("repo:fastapi/fastapi");
    expect(edition.slugByKey["org:all"]).toBe("org");
    expect(edition.scopeSummaries["org:all"].tierCounts).toEqual({
      measured: 33,
      proxy: 17,
      inferred: 7,
    });
  });
});
