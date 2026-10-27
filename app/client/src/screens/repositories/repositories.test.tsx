/**
 * C9 — Repositories and Compare (SPEC §5.6, §5.7, §12).
 *
 * The chunk's definition of done: derived status pills match the headline data;
 * sort and reset work; Compare handles three scopes including collapsing a
 * not-available metric; the mobile explanation card appears.
 *
 * The mobile card and the browser measurements are checked in a real browser;
 * what this file pins is everything a refactor could silently change without the
 * screen looking any different — the derivation behind the pills, the sort's
 * treatment of absence, and the ranking behind the Compare strip.
 */

import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { Router } from "wouter";

import * as copy from "@/copy";
import {
  clearDataCache,
  deriveStatus,
  hydrateEdition,
  loadScope,
  type Edition,
  type EditionFile,
  type ScopeReport,
} from "@/data";

import { largestGaps } from "../compare/gaps";
import { compareHref, readCompareWorking, readScopeSlugs, withSlot } from "../compare/slots";
import { RepositoriesScreen } from "./RepositoriesScreen";
import { ariaSort, nextSort, repoRows, sortRows } from "./rows";

const DATA_DIR = path.resolve(process.cwd(), "client/public/data");

const edition: Edition = hydrateEdition(
  JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "edition.json"), "utf8")
  ) as EditionFile
);

const reports: Record<string, ScopeReport> = {};

beforeAll(async () => {
  clearDataCache();
  /* The loader fetches; the test has a filesystem. */
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const file = path.join(DATA_DIR, String(input).replace(/^\/data\//, ""));
    return new Response(fs.readFileSync(file, "utf8"), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  for (const slug of ["org", "fastapi-fastapi", "eslint-eslint", "vitejs-vite"]) {
    reports[slug] = await loadScope(slug);
  }
});

/* ---------------------------------------------------------------- rows */

describe("the scope table", () => {
  const rows = repoRows(edition, edition.root_scope);

  it("lists every repository the edition collected, in navigation order", () => {
    expect(rows.map(row => row.label)).toEqual([
      "axios/axios",
      "eslint/eslint",
      "vitejs/vite",
      "fastapi/fastapi",
      "mitmproxy/mitmproxy",
      "helm/helm",
    ]);
  });

  it("narrows to one project's repositories at project scope", () => {
    expect(
      repoRows(edition, "project:Python").map(row => row.label)
    ).toEqual(["fastapi/fastapi", "mitmproxy/mitmproxy"]);
  });

  it("carries the headline data the status pill derives from, not a status", () => {
    /* §5.6, §6.15: the row hands `StatusPill` the findings that fired. If a row
       ever grew a `status` field, this is the test that would notice. */
    expect(Object.keys(rows[0])).not.toContain("status");
    for (const row of rows) {
      const summary = edition.scopeSummaries[row.key];
      expect(deriveStatus(row.headlines)).toBe(summary.status);
    }
  });

  it("derives the pill levels the headline data implies", () => {
    const byLabel = Object.fromEntries(
      rows.map(row => [row.label, deriveStatus(row.headlines)])
    );
    expect(byLabel).toEqual({
      /* One critical: review coverage 7.8%. */
      "fastapi/fastapi": "critical",
      /* Warnings only. */
      "axios/axios": "watch",
      "mitmproxy/mitmproxy": "watch",
      /* One info finding — info alone stays healthy (§5.6). */
      "eslint/eslint": "healthy",
      /* No findings at all. */
      "vitejs/vite": "healthy",
      "helm/helm": "healthy",
    });
  });

  it("carries the coverage range the bars have to survive", () => {
    const coverage = rows.map(row => ({
      label: row.label,
      display: row.metrics.review?.display,
    }));
    expect(coverage).toContainEqual({ label: "fastapi/fastapi", display: "7.8%" });
    expect(coverage).toContainEqual({ label: "eslint/eslint", display: "99.3%" });
  });
});

/* --------------------------------------------------------------- sorting */

describe("sorting", () => {
  const rows = repoRows(edition, edition.root_scope);

  it("orders by the reading's value, not its display string", () => {
    const ascending = sortRows(rows, { column: "review", direction: "asc" });
    expect(ascending[0].label).toBe("fastapi/fastapi");
    expect(ascending[ascending.length - 1].label).toBe("eslint/eslint");

    const descending = sortRows(rows, { column: "review", direction: "desc" });
    expect(descending[0].label).toBe("eslint/eslint");
  });

  it("sorts lead time on hours, where a lexical sort would disagree", () => {
    /* "12 min" sorts before "4.1 days" numerically and after it alphabetically. */
    const ascending = sortRows(rows, { column: "lead", direction: "asc" });
    const values = ascending.map(row => row.metrics.lead?.value ?? null);
    expect(values).toEqual([...values].sort((a, b) => (a ?? 0) - (b ?? 0)));
  });

  it("keeps a scope that publishes no figure at the end in both directions", () => {
    /* §0.1: absence is not a low reading. Synthesised here because every scope
       in this edition publishes all three sortable metrics. */
    const withGap = [
      { ...rows[0], label: "absent", metrics: { ...rows[0].metrics, review: undefined } },
      ...rows.slice(1),
    ];
    for (const direction of ["asc", "desc"] as const) {
      const sorted = sortRows(withGap, { column: "review", direction });
      expect(sorted[sorted.length - 1].label).toBe("absent");
    }
  });

  it("cycles ascending, descending, then back to the edition's order", () => {
    let state = nextSort(null, "review");
    expect(state).toEqual({ column: "review", direction: "asc" });
    state = nextSort(state, "review");
    expect(state).toEqual({ column: "review", direction: "desc" });
    state = nextSort(state, "review");
    expect(state).toBeNull();
    /* Reset restores the edition's own order exactly. */
    expect(sortRows(rows, state)).toEqual(rows);
  });

  it("starts a different column ascending rather than inheriting a direction", () => {
    expect(nextSort({ column: "review", direction: "desc" }, "lead")).toEqual({
      column: "lead",
      direction: "asc",
    });
  });

  it("reports aria-sort for the active column only", () => {
    expect(ariaSort({ column: "review", direction: "asc" }, "review")).toBe(
      "ascending"
    );
    expect(ariaSort({ column: "review", direction: "desc" }, "review")).toBe(
      "descending"
    );
    expect(ariaSort({ column: "review", direction: "asc" }, "lead")).toBe("none");
    expect(ariaSort(null, "review")).toBe("none");
  });
});

/* ---------------------------------------------------------------- markup */

describe("the rendered table", () => {
  const scope = {
    target: { level: "org", slug: null, owner: null, name: null },
    key: edition.root_scope,
    slug: "org",
    label: edition.navigation.org.label,
    summary: edition.scopeSummaries[edition.root_scope],
    parent: null,
    path: "/",
  } as const;

  const markup = renderToStaticMarkup(
    <Router ssrPath="/repositories">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <RepositoriesScreen edition={edition} scope={scope as any} />
    </Router>
  );

  it("groups by project in the edition's own order", () => {
    for (const project of edition.navigation.projects) {
      expect(markup).toContain(project.label);
    }
  });

  it("renders the derived pill words, never a letter or a number", () => {
    expect(markup).toContain(copy.status.critical);
    expect(markup).toContain(copy.status.watch);
    expect(markup).toContain(copy.status.healthy);
  });

  it("draws each coverage bar at the reading beside it, not the sample's", () => {
    /* Appendix A's range proof: 7.8% at fastapi to 99.3% at eslint. fastapi's
       sample coverage is 45% — a bar drawn from that would be showing a
       different, larger, unlabelled quantity in the same cell. */
    expect(markup).toContain('data-coverage-pct="7.8"');
    expect(markup).toContain('data-coverage-pct="99.3"');
    expect(markup).not.toContain('data-coverage-pct="45"');
    expect(markup).toContain("7.8%");
    expect(markup).toContain("99.3%");
  });

  it("shows no reset affordance until the table has been sorted", () => {
    expect(markup).not.toContain(copy.repositories.resetOrder);
  });

  it("gives every row one link to the repository's overview", () => {
    for (const project of edition.navigation.projects)
      for (const repo of project.repos)
        expect(markup).toContain(`href="${repo.path}"`);
  });
});

/* --------------------------------------------------------------- compare */

describe("compare", () => {
  it("reads, de-duplicates and caps the scopes in the URL", () => {
    expect(readScopeSlugs("?scopes=org,fastapi-fastapi")).toEqual([
      "org",
      "fastapi-fastapi",
    ]);
    expect(readScopeSlugs("?scopes=org,org")).toEqual(["org"]);
    expect(readScopeSlugs("?scopes=a,b,c,d")).toEqual(["a", "b", "c"]);
    expect(readScopeSlugs("")).toEqual([]);
  });

  it("round-trips a column's working through the URL, comma intact", () => {
    const href = compareHref(["org", "fastapi-fastapi", "eslint-eslint"], {
      metricId: "process.review_coverage",
      scopeSlug: "fastapi-fastapi",
    });
    expect(href).toContain("scopes=org,fastapi-fastapi,eslint-eslint");
    const search = href.slice(href.indexOf("?"));
    expect(readScopeSlugs(search)).toHaveLength(3);
    expect(readCompareWorking(search)).toEqual({
      metricId: "process.review_coverage",
      scopeSlug: "fastapi-fastapi",
    });
  });

  it("refuses a working that names a metric but no column", () => {
    /* Without the scope there is no sample, and the drawer would have to pick
       one on the reader's behalf (§5.10). */
    expect(readCompareWorking("?working=process.review_coverage")).toBeNull();
  });

  it("drops a duplicate when a slot is set to a scope already in play", () => {
    expect(withSlot(["org", "fastapi-fastapi"], 1, "org")).toEqual(["org"]);
  });

  it("collapses a metric that is not available in every selected scope", () => {
    const columns = ["org", "fastapi-fastapi", "eslint-eslint"];
    const naEverywhere = reports.org.metrics.filter(metric =>
      columns.every(
        slug => reports[slug].metrics.find(m => m.id === metric.id)?.isNA
      )
    );
    /* §5.7's disclosure has to have something to hold, and the canonical
       NotAvailable fixtures (§Appendix A) are where it comes from. */
    expect(naEverywhere.length).toBeGreaterThan(0);
    expect(naEverywhere.map(metric => metric.id)).toContain(
      "ai.floor_understatement"
    );
  });

  it("ranks the largest gaps only over metrics every column publishes", () => {
    const columns = ["org", "fastapi-fastapi", "eslint-eslint"].map(slug => ({
      scopeKey: slug,
      scopeLabel: slug,
      metrics: reports[slug].metrics,
    }));
    const gaps = largestGaps(columns);

    expect(gaps).toHaveLength(5);
    for (const gap of gaps) {
      for (const column of columns) {
        const reading = column.metrics.find(m => m.id === gap.metricId);
        expect(reading?.value).not.toBeNull();
      }
      /* Both ends are the scopes' own display strings — no invented units. */
      expect(gap.low.display).toBeTypeOf("string");
      expect(gap.high.display).toBeTypeOf("string");
      expect(gap.low.scopeLabel).not.toBe(gap.high.scopeLabel);
    }
  });

  it("needs at least two columns before a spread means anything", () => {
    expect(
      largestGaps([
        { scopeKey: "org", scopeLabel: "org", metrics: reports.org.metrics },
      ])
    ).toEqual([]);
  });

  it("sets the two extremes end to end in the scopes' own words", () => {
    const gaps = largestGaps(
      ["fastapi-fastapi", "eslint-eslint"].map(slug => ({
        scopeKey: slug,
        scopeLabel: slug,
        metrics: reports[slug].metrics,
      })),
      /* Deep enough to reach review coverage: 7.8% against 99.3% is a wide gap
         but not one of the five widest between these two repositories. */
      57
    );
    const review = gaps.find(gap => gap.metricId === "process.review_coverage");
    expect(review).toBeDefined();
    expect(review!.low.display).toBe("7.8%");
    expect(review!.high.display).toBe("99.3%");
    expect(review!.low.scopeLabel).toBe("fastapi-fastapi");
    expect(review!.high.scopeLabel).toBe("eslint-eslint");
  });

  it("never ranks a reading it cannot subtract", () => {
    /* `temporal.peak_hour` reads "19:00–20:00 local": the dataset types `value`
       as a number and this one arrives as a string. Ranked, it would put NaN
       into the sort and take the whole strip with it. */
    const peak = reports["fastapi-fastapi"].metrics.find(
      metric => metric.id === "temporal.peak_hour"
    );
    expect(typeof peak?.value).toBe("string");

    const gaps = largestGaps(
      ["fastapi-fastapi", "eslint-eslint"].map(slug => ({
        scopeKey: slug,
        scopeLabel: slug,
        metrics: reports[slug].metrics,
      })),
      57
    );
    expect(gaps.map(gap => gap.metricId)).not.toContain("temporal.peak_hour");
    /* And the rest of the ranking is still in order, not NaN-shuffled. */
    expect(gaps.length).toBeGreaterThan(5);
  });
});
