/**
 * SPEC §12, C12 row — the chunk's definition of done, as tests:
 *
 *   1. every section renders from the edition file, with nothing hardcoded;
 *   2. the governance note is printed verbatim;
 *   3. the `llm_calls: 0` statistic is present, as a figure.
 *
 * The screen publishes no figure of its own, so most of what is asserted below is
 * an identity: what is on the page is what is in `edition.json`, character for
 * character. The tests read the fixture and compare against it rather than against
 * a copy of its values, so a changed edition changes the expectation with it.
 */

import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it } from "vitest";
import { Router } from "wouter";

import { METHODOLOGY_PATH } from "@/app/routes";
import { clearDataCache, loadEdition, type Edition } from "@/data";
import * as copy from "@/copy";

import { MethodologyScreen } from "./Methodology";

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

let edition: Edition;
let markup: string;

beforeAll(async () => {
  clearDataCache();
  serveDataFromDisk();
  edition = await loadEdition();
  markup = renderToStaticMarkup(
    <Router ssrPath={METHODOLOGY_PATH}>
      <MethodologyScreen edition={edition} />
    </Router>
  );
});

/* --------------------------------------------------------- the two anchors */

describe("methodology anchors (SPEC §5.11)", () => {
  /**
   * §1.4: the absence of a contributor altitude is a position, and the dataset's
   * own note is what makes it read as one. Verbatim means verbatim — a trimmed or
   * softened version would be us editing someone else's warning.
   */
  it("prints the governance note verbatim", () => {
    const note = edition.data_quality.governance_note;
    expect(note.length).toBeGreaterThan(0);
    expect(markup).toContain(escapeHtml(note));
    /* And the stance it is printed beside. */
    expect(markup).toContain(copy.methodology.governanceStance);
  });

  it("states llm_calls as its own figure, with the standing line", () => {
    expect(edition.collection.llm_calls).toBe(0);
    expect(markup).toContain('data-testid="llm-calls"');
    expect(markup).toMatch(
      /<div class="mt-llm-figure"><strong>0<\/strong><span>Language-model calls<\/span>/
    );
    expect(markup).toContain(copy.methodology.llmStanding);
  });
});

/* ------------------------------------------------------------ the sections */

describe("how this edition was made (SPEC §5.11.1)", () => {
  it("reports the collection's own counts", () => {
    const { collection } = edition;
    for (const value of [
      collection.repos_collected,
      collection.repos_failed,
      collection.graphql_calls,
      collection.rest_calls,
    ]) {
      expect(markup).toContain(`<strong>${value}</strong>`);
    }
    expect(markup).toContain(`${collection.duration_seconds}s`);
  });

  it("reports identity resolution, with the merges reachable", () => {
    const identity = edition.collection.identity_resolution;
    expect(markup).toContain(`<strong>${identity.people}</strong>`);
    expect(markup).toContain(`<strong>${identity.bots_excluded}</strong>`);
    expect(markup).toContain(`<strong>${identity.identities_merged}</strong>`);
    /* The examples live behind a real button — a disclosure, never a hover. */
    expect(markup).toContain(
      copy.fill(copy.methodology.identityMergesToggle, {
        count: identity.merge_examples.length,
      })
    );
  });
});

describe("tiers and confidence (SPEC §5.11.2)", () => {
  it("renders both legends in the dataset's own words", () => {
    const { tier_legend, confidence_legend } = edition.data_quality;
    for (const sentence of Object.values(tier_legend)) {
      expect(markup).toContain(escapeHtml(sentence));
    }
    for (const sentence of Object.values(confidence_legend)) {
      expect(markup).toContain(escapeHtml(sentence));
    }
  });

  it("uses the product's own tier chip rather than a drawing of one", () => {
    for (const tier of ["measured", "proxy", "inferred"]) {
      expect(markup).toContain(`data-tier="${tier}"`);
    }
  });
});

describe("structural limits (SPEC §5.11.3)", () => {
  it("renders every limit the edition states, title and detail", () => {
    const limits = edition.data_quality.structural_limits;
    expect(limits.length).toBeGreaterThan(0);
    for (const limit of limits) {
      expect(markup).toContain(escapeHtml(limit.title));
      expect(markup).toContain(escapeHtml(limit.detail));
    }
  });

  it("counts them from the data rather than in the copy", () => {
    const limits = edition.data_quality.structural_limits;
    expect(markup).toContain(
      copy.fill(copy.methodology.limitsLead, { count: limits.length })
    );
  });
});

describe("what was excluded (SPEC §5.11.4)", () => {
  it("accounts for every reason, in the open or behind the disclosure", () => {
    const reasons = Object.keys(edition.exclusions.by_reason);
    const shown = reasons.filter(reason =>
      markup.includes(escapeHtml(reason))
    ).length;
    expect(shown).toBeGreaterThan(0);
    expect(markup).toContain(
      copy.fill(copy.methodology.exclusionsMoreToggle, {
        count: reasons.length - shown,
      })
    );
  });

  it("states the total and the largest single files", () => {
    const { total_lines_excluded, top_paths } = edition.exclusions;
    expect(markup).toContain(total_lines_excluded.toLocaleString("en-GB"));
    expect(markup).toContain(escapeHtml(top_paths[0].path));
    expect(markup).toContain(copy.methodology.exclusionsCaption);
  });
});

describe("the rulebook (SPEC §5.11.5)", () => {
  it("renders every threshold with its value and a sentence", () => {
    const names = Object.keys(edition.thresholds);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(markup).toContain(`<code>${name}</code>`);
      expect(markup).toContain(
        `<td class="mt-figure">${edition.thresholds[name].toLocaleString("en-GB")}</td>`
      );
      /* A threshold with no gloss is a number a reader cannot check. */
      expect(copy.thresholdGloss[name]).toBeTruthy();
      expect(markup).toContain(escapeHtml(copy.thresholdGloss[name]));
    }
  });

  it("names the ruleset the findings were run under", () => {
    const rulesets = edition.headlines.map(headline => headline.ruleset_version);
    expect(rulesets.length).toBeGreaterThan(0);
    expect(markup).toContain(
      copy.fill(copy.methodology.rulebookRuleset, { id: rulesets[0] })
    );
  });
});

describe("coverage notes (SPEC §5.11.7)", () => {
  it("raises a caveat for each list the edition fills, and none for the empty ones", () => {
    const { coverage } = edition.data_quality;
    expect(coverage.pull_requests_truncated_in.length).toBeGreaterThan(0);
    expect(markup).toContain(
      copy.fill(copy.methodology.coverageTruncated, {
        list: coverage.pull_requests_truncated_in.join(", "),
      })
    );
    /* This edition's other lists are empty; an empty list raises nothing. */
    expect(coverage.no_ci_data_in).toHaveLength(0);
    expect(markup).not.toContain("No CI records were collected in .");
  });

  it("says so when the edition carries no tool-native analytics", () => {
    expect(edition.data_quality.native_analytics).toBeNull();
    expect(markup).toContain(copy.methodology.coverageNativeAnalytics);
  });
});

/** React escapes these on the way out; the edition's prose contains several. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
