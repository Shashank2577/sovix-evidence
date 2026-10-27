/**
 * SPEC §12, C10 row — the chunk's definition of done, as tests:
 *
 *   1. nine monthly series render per scope, against that scope's own axis;
 *   2. the before/after table carries all fourteen rows, and a row whose earlier
 *      half has no figure says so rather than printing a zero;
 *   3. `split_reason` is printed verbatim;
 *   4. the no-causality footer is on the screen where it is most needed.
 *
 * The 390px band collapse and the card reflow are viewport facts — they are media
 * queries, and a string render has no viewport — so those are checked in a real
 * browser. What this file pins is everything a refactor could silently lose.
 *
 * Fixtures are the edition's real files, read through the app's own loader.
 */

import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { Router } from "wouter";

import { ORG_TARGET, type ScopeTarget } from "@/app/routes";
import { resolveScope, type ResolvedScope } from "@/app/scope";
import {
  clearDataCache,
  isFloorMetric,
  loadEdition,
  loadScope,
  type Edition,
  type ScopeReport,
} from "@/data";
import * as copy from "@/copy";

import { TrendsScreen } from "./Trends";

const DATA_DIR = path.resolve(process.cwd(), "client/public/data");

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

const HELM: ScopeTarget = {
  level: "repo",
  slug: null,
  owner: "helm",
  name: "helm",
};
const FASTAPI: ScopeTarget = {
  level: "repo",
  slug: null,
  owner: "fastapi",
  name: "fastapi",
};

let edition: Edition;
const reports: Record<string, ScopeReport> = {};

beforeAll(async () => {
  clearDataCache();
  serveDataFromDisk();
  edition = await loadEdition();
  /* Warm every scope the tests render, so the first paint is the ready state. */
  for (const slug of ["org", "helm-helm", "fastapi-fastapi"]) {
    reports[slug] = await loadScope(slug);
  }
});

function scopeAt(target: ScopeTarget): ResolvedScope {
  const scope = resolveScope(edition, target);
  if (!scope) throw new Error("the fixture edition does not publish that scope");
  return scope;
}

function renderTrends(target: ScopeTarget = ORG_TARGET): string {
  const scope = scopeAt(target);
  return renderToStaticMarkup(
    <Router ssrPath={`${scope.path}/trends`.replace("//", "/")}>
      <TrendsScreen edition={edition} scope={scope} />
    </Router>
  );
}

/* ------------------------------------------------------------ the series */

describe("trends series (SPEC §5.5.1)", () => {
  it.each([
    ["org", ORG_TARGET],
    ["helm/helm", HELM],
    ["fastapi/fastapi", FASTAPI],
  ])("renders nine series at %s", (_label, target) => {
    const markup = renderTrends(target);
    const cards = markup.match(/class="tr-card"/g) ?? [];
    expect(cards).toHaveLength(9);
  });

  it("labels every series the scope file publishes, and invents none", () => {
    const markup = renderTrends(HELM);
    for (const series of reports["helm-helm"].series) {
      expect(markup).toContain(series.label);
    }
  });

  /**
   * The axis edge the cohort actually contains: helm's window opens a month
   * earlier than fastapi's. A shared axis would give fastapi a thirteenth month it
   * never had, so each scope's charts must state their own span.
   */
  it("spans each scope's own window, never a shared one", () => {
    const helm = renderTrends(HELM);
    const fastapi = renderTrends(FASTAPI);

    expect(helm).toContain("13 months from August 2025 to August 2026");
    expect(fastapi).toContain("12 months from September 2025 to August 2026");
    expect(helm).not.toContain("12 months from September 2025");
    expect(fastapi).not.toContain("13 months from August 2025");
  });

  /**
   * One of the nine reads a floor. A bare "0%" on that card would be the exact
   * understatement the `≥` exists to prevent — the traces it counts can be switched
   * off, so the true figure is higher by an unknown margin (§6.3).
   */
  it("keeps the floor prefix on the AI series, and puts it on no other", () => {
    const markup = renderTrends(ORG_TARGET);
    const floors = markup.split('data-floor="true"').length - 1;
    const floorSeries = reports.org.series.filter(series =>
      isFloorMetric(series.metric_id)
    );
    expect(floorSeries).toHaveLength(1);
    /* One card, plus the two halves of that metric's comparison row. */
    expect(floors).toBe(3);
    expect(markup).toContain(copy.floor.prefix);
  });

  it("offers the working behind each series' own metric", () => {
    const markup = renderTrends(ORG_TARGET);
    for (const series of reports.org.series) {
      expect(markup).toContain(`working=${encodeURIComponent(series.metric_id)}`);
    }
  });
});

/* ------------------------------------------------------- before and after */

describe("before and after (SPEC §5.5.3)", () => {
  it("prints the dataset's split reason verbatim, with the split date", () => {
    for (const [slug, target] of [
      ["org", ORG_TARGET],
      ["helm-helm", HELM],
      ["fastapi-fastapi", FASTAPI],
    ] as const) {
      const markup = renderTrends(target);
      const { split_reason } = reports[slug].comparison;
      /* Verbatim: the whole sentence, not a prefix of it. */
      expect(markup).toContain(escapeHtml(split_reason));
    }
  });

  it("renders every comparison row the scope carries", () => {
    const markup = renderTrends(ORG_TARGET);
    const rows = reports.org.comparison.rows;
    expect(rows).toHaveLength(14);
    for (const row of rows) {
      expect(markup).toContain(escapeHtml(row.label));
    }
  });

  it("uses the dataset's own half labels as the column heads", () => {
    const markup = renderTrends(ORG_TARGET);
    const { before_label, after_label } = reports.org.comparison;
    expect(markup).toContain(before_label);
    expect(markup).toContain(after_label);
  });

  /**
   * Three rows at org scope have no figure in the earlier half. The dataset says
   * "not available" and leaves the number null; the screen has to repeat that and
   * state why there is no change, because a `0` there would be a claim the data
   * never made (§0.1, §6.4).
   */
  it("states the absence where a half has no figure, and never a zero", () => {
    const markup = renderTrends(ORG_TARGET);
    const absent = reports.org.comparison.rows.filter(
      row => row.change_pct === null && row.change_points === null
    );
    expect(absent.length).toBeGreaterThan(0);

    const occurrences =
      markup.split(copy.trends.comparisonNoChange).length - 1;
    expect(occurrences).toBe(absent.length);

    /* No change chip anywhere reads as a bare zero. */
    expect(markup).not.toMatch(/class="tr-change[^"]*">0</);
  });

  /** §5.1.4 — a metric with no stated direction is never tinted. */
  it("tints only the rows whose metric states a direction", () => {
    const markup = renderTrends(ORG_TARGET);
    const neutral = reports.org.comparison.rows.filter(
      row =>
        row.direction === "neutral" &&
        (row.change_pct !== null || row.change_points !== null)
    );
    expect(neutral.length).toBeGreaterThan(0);
    const grey = markup.split('tr-change tr-change--neutral').length - 1;
    expect(grey).toBe(neutral.length);
    /* And no neutral-direction row picked up a tint from either side. */
    expect(markup).not.toMatch(
      /tr-change--(?:with|against)"[^>]*data-direction="neutral"/
    );
  });

  it("writes the sign on every change it shows", () => {
    const markup = renderTrends(ORG_TARGET);
    const chips = Array.from(
      markup.matchAll(
        /class="tr-change tr-change--(?:with|against|neutral)"[^>]*>([^<]+)</g
      ),
      match => match[1]
    );
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) {
      expect(chip).toMatch(/^[+-]/);
    }
  });

  it("carries the no-causality footer", () => {
    const markup = renderTrends(ORG_TARGET);
    expect(markup).toContain(copy.trends.comparisonFooter);
    /* And the dataset's own caveat beside it. */
    expect(markup).toContain(escapeHtml(reports.org.comparison.caveat));
  });
});

/* ------------------------------------------------------------ the heatmap */

describe("the work heatmap (SPEC §5.5.2)", () => {
  it("captions the grid with the dataset's own note", () => {
    const markup = renderTrends(ORG_TARGET);
    expect(markup).toContain(escapeHtml(reports.org.heatmap.note));
  });

  it("links the two temporal readings rather than judging the hours", () => {
    const markup = renderTrends(ORG_TARGET);
    for (const id of ["temporal.after_hours_share", "temporal.weekend_share"]) {
      const metric = reports.org.metrics.find(entry => entry.id === id)!;
      expect(markup).toContain(metric.display);
      expect(markup).toContain(`/metrics/${encodeURIComponent(id)}`);
    }
  });
});

/** React escapes these on the way out; the fixtures' prose contains several. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
