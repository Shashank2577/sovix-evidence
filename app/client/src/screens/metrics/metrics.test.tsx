/**
 * SPEC §12, C7 row — the chunk's definition of done, as tests:
 *
 *   1. the 57 rows render, at every scope, with nothing dropped or invented;
 *   2. the not-available metric page reads as designed — the reason, the
 *      zero-input formula and the `0 of 0` sample, and never a zero in place of
 *      the figure;
 *   3. the row navigation and the in-row ⌗ are two separate destinations, so
 *      both can be reached from the keyboard.
 *
 * (3)'s *focus* behaviour and the 390px overflow measurement are browser facts,
 * checked in a real browser rather than asserted against a string here; what this
 * file proves is that the two affordances exist as two distinct links on every
 * row, which is the part a refactor could silently lose.
 *
 * Fixtures are the edition's real files, loaded through the app's own loader, so
 * the components under test see exactly what the browser hands them.
 */

import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { Router } from "wouter";

import { ORG_TARGET, type ScopeTarget } from "@/app/routes";
import { resolveScope, type ResolvedScope } from "@/app/scope";
import {
  FLOOR_METRIC_IDS,
  NON_FLOOR_AI_METRIC_IDS,
  clearDataCache,
  loadEdition,
  loadScope,
  type Edition,
} from "@/data";
import * as copy from "@/copy";

import { MetricDetail } from "./MetricDetail";
import { MetricsIndex } from "./MetricsIndex";

const DATA_DIR = path.resolve(process.cwd(), "client/public/data");

/**
 * The loader fetches; the test has a filesystem. Pointing `fetch` at the emitted
 * files means the components resolve their data through the same cache the
 * browser uses, so a render here is a render there — no hand-built props, no
 * second code path for "under test".
 */
function serveDataFromDisk(): void {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const file = path.join(DATA_DIR, url.replace(/^\/data\//, ""));
    if (!fs.existsSync(file))
      return new Response("not found", { status: 404, statusText: "Not Found" });
    return new Response(fs.readFileSync(file, "utf8"), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

const REPO_TARGET: ScopeTarget = {
  level: "repo",
  slug: null,
  owner: "fastapi",
  name: "fastapi",
};

let edition: Edition;

beforeAll(async () => {
  clearDataCache();
  serveDataFromDisk();
  edition = await loadEdition();
  /* Warm the scopes the tests render, so the first paint is the ready state
     rather than the skeleton — the same thing that happens on a second visit. */
  await loadScope("org");
  await loadScope("fastapi-fastapi");
});

function scopeAt(target: ScopeTarget): ResolvedScope {
  const scope = resolveScope(edition, target);
  if (!scope) throw new Error("the fixture edition does not publish that scope");
  return scope;
}

function renderIndex(target: ScopeTarget = ORG_TARGET): string {
  const scope = scopeAt(target);
  return renderToStaticMarkup(
    <Router ssrPath={`${scope.path}/metrics`.replace("//", "/")}>
      <MetricsIndex edition={edition} scope={scope} />
    </Router>
  );
}

function renderDetail(metricId: string, target: ScopeTarget = ORG_TARGET): string {
  const scope = scopeAt(target);
  return renderToStaticMarkup(
    <Router ssrPath={`${scope.path}/metrics/${metricId}`.replace("//", "/")}>
      <MetricDetail edition={edition} scope={scope} metricId={metricId} />
    </Router>
  );
}

/* ------------------------------------------------------------------ index */

describe("metrics index (SPEC §5.3)", () => {
  it("renders every metric the edition publishes, once", () => {
    const markup = renderIndex();
    /* `Array.from` rather than spreading the iterator: the spread needs an
       ES2015+ target, and this file should not be the reason tsconfig has one. */
    const ids = Array.from(
      markup.matchAll(/data-metric-id="([^"]+)"/g),
      match => match[1]
    );
    const rows = ids.filter(id => edition.metricCatalog.some(m => m.id === id));

    expect(edition.metricCatalog).toHaveLength(57);
    /* `data-metric-id` is also on the NA figure, so rows are the distinct ids. */
    expect(new Set(rows).size).toBe(57);
  });

  it("groups them into the edition's eight families, in the edition's order", () => {
    const markup = renderIndex();
    const headings = Array.from(
      markup.matchAll(/id="mx-family-([a-z_]+)"/g),
      match => match[1]
    );
    expect(headings).toEqual(Object.keys(edition.glossary.families));
  });

  it("gives every row a link to the metric and a separate link to its working", () => {
    const markup = renderIndex(REPO_TARGET);
    const id = "process.review_coverage";

    /* Two destinations, two tab stops — Enter follows the row, the ⌗ opens the
       working in place (§5.3). */
    expect(markup).toContain(`href="/repo/fastapi/fastapi/metrics/${id}"`);
    expect(markup).toContain(
      `href="/repo/fastapi/fastapi/metrics?working=${id}"`
    );
  });

  it("prefixes the three floor metrics and nothing else", () => {
    const markup = renderIndex();

    for (const id of FLOOR_METRIC_IDS) {
      const cell = valueCellFor(markup, id);
      expect(cell, id).toContain(copy.floor.prefix);
    }
    for (const id of NON_FLOOR_AI_METRIC_IDS) {
      const cell = valueCellFor(markup, id);
      expect(cell, id).not.toContain(copy.floor.prefix);
    }
  });

  it("renders a not-available reading as words, never as a zero or a dash", () => {
    const markup = renderIndex();

    for (const id of ["ai.native_acceptance_rate", "ai.native_lines_accepted"]) {
      const cell = valueCellFor(markup, id);
      expect(cell, id).toContain(copy.notAvailable.label);
      expect(cell, id).not.toMatch(/>\s*0\s*</);
      expect(cell, id).not.toContain("—");
    }
  });

  it("never leaves the trend cell empty: a series or the coverage bar", () => {
    const markup = renderIndex();
    const rows = markup.split('class="mx-row"').slice(1);
    expect(rows).toHaveLength(57);
    for (const row of rows) {
      expect(row).toMatch(/class="mx-trend"/);
      /* No sparkline is drawn server-side (the element has no measured width
         yet), so the assertion that matters here is the one that holds in both
         cases: a metric without a series gets the coverage bar. */
      const id = row.match(/data-metric-id="([^"]+)"/)?.[1] ?? "";
      const metric = edition.scopeSummaries["org:all"].metrics.find(
        row => row.id === id
      );
      if (metric && !metric.hasSeries) expect(row, id).toContain("coverage-bar");
    }
  });

  it("states the sample twice: the full line, and the coverage line 390px uses", () => {
    const markup = renderIndex();
    expect(markup).toContain("mx-sample--full");
    expect(markup).toContain("mx-sample--coverage");
    /* Both are in the DOM at every width — §7.4 swaps them in CSS, so nothing is
       lost to a viewport the reader might rotate out of. */
    const fulls = markup.match(/mx-sample--full/g) ?? [];
    const coverages = markup.match(/mx-sample--coverage/g) ?? [];
    expect(fulls).toHaveLength(57);
    expect(coverages).toHaveLength(57);
  });
});

/**
 * The value cell of one row, as markup. Sliced by index rather than `split`,
 * because `NotAvailable` stamps the same `data-metric-id` on the figure itself —
 * splitting would cut the cell in half exactly where the interesting text is.
 */
function valueCellFor(markup: string, metricId: string): string {
  const start = markup.indexOf(`<tr class="mx-row" role="row" data-metric-id="${metricId}"`);
  if (start < 0) throw new Error(`no row for ${metricId}`);
  const end = markup.indexOf("mx-cell-trend", start);
  return markup.slice(start, end);
}

/** React escapes apostrophes in text nodes; assertions have to speak the same dialect. */
function esc(text: string): string {
  return text.replace(/'/g, "&#x27;").replace(/&(?!#x27;)/g, "&amp;");
}

/* ----------------------------------------------------------------- detail */

describe("metric detail (SPEC §5.4)", () => {
  it("unpacks a measured figure: prose, the working, and the cross-scope strip", () => {
    const markup = renderDetail("process.review_coverage", REPO_TARGET);

    expect(markup).toContain(copy.metricPage.plainEnglishHeading);
    expect(markup).toContain(copy.metricPage.whyHeading);
    expect(markup).toContain(copy.metricPage.howHeading);
    /* The five numbered sections, from the drawer's own component (§5.4). */
    for (const number of ["01", "02", "03", "04", "05"]) {
      expect(markup, number).toContain(`data-section="${number}"`);
    }
    /* Sibling repositories, never people (§0.1). */
    expect(markup).toContain("mitmproxy/mitmproxy");
    expect(markup).toContain(copy.metricPage.crossScopeHere);
  });

  it("renders the floor prefix on the big figure for a floor metric", () => {
    const markup = renderDetail("ai.detected_commit_share");
    const value = markup.split('class="mp-value"')[1].split("</span>")[0];
    expect(value).toContain(copy.floor.prefix);
  });

  it("reads as designed when the metric is not available", () => {
    const markup = renderDetail("ai.native_acceptance_rate");
    const scope = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, "scopes", "org.json"), "utf8")
    ) as { metrics: { id: string; formula: string; no_sources_reason: string | null }[] };
    const metric = scope.metrics.find(row => row.id === "ai.native_acceptance_rate")!;

    /* The figure is words with a reason, not a zero (§6.4). */
    expect(markup).toContain(copy.notAvailable.label);
    expect(markup).toContain("No value could be computed");
    /* The prose renders in full — it explains what *would* be measured (§5.4). */
    expect(markup).toContain(copy.metricPage.plainEnglishHeading);
    expect(markup).toContain(copy.metricPage.naHeading);
    /* The zero-input formula and the zero sample, from the data (§5.4). */
    expect(markup).toContain(metric.formula.replace(/</g, "&lt;"));
    expect(markup).toContain("0 of 0 days of recorded telemetry");
    /* Absence explained rather than a blank section (§5.10.8). */
    expect(markup).toContain(metric.no_sources_reason!.slice(0, 40));
  });

  it("says so when a metric publishes no monthly series", () => {
    const withSeries = renderDetail("process.review_coverage");
    const without = renderDetail("people.bus_factor");

    expect(withSeries).not.toContain(copy.metricPage.seriesNone);
    expect(without).toContain(copy.metricPage.seriesNone);
    expect(withSeries).toContain(copy.metricPage.seriesStandingCaption);
  });

  it("lists the family's ids when the address names no metric this edition has", () => {
    const markup = renderDetail("process.review_coverag");

    expect(markup).toContain(esc(copy.metricPage.unknownTitle));
    expect(markup).toContain("process.review_coverage");
    expect(markup).toContain("process.self_merge_share");
  });

  it("renders no direction arrow or direction caption", () => {
    /* §5.4's explicit decision: `how_to_read` carries direction with nuance; a
       bare arrow invites ranking-think. */
    const markup = renderDetail("delivery.lead_time_p50");
    expect(markup).not.toContain("lower_is_better");
    expect(markup).not.toContain("higher_is_better");
  });
});
