/**
 * SPEC §12, C5 row — the chunk's definition of done, as tests:
 *
 *   1. a deep link opens the correct metric at the correct scope;
 *   2. Escape and swipe close it;
 *   3. a metric with no eligible records renders its stated reason rather than a
 *      zero or a blank;
 *   4. the URL round-trips.
 *
 * (2) is Radix's and vaul's Dialog behaviour, exercised in a real browser rather
 * than asserted against a static string — a test that stubbed a key event would be
 * testing the stub. Everything else is here, against the edition's own data.
 *
 * Fixtures are the real scope files for the same reason C3's tests use them:
 * `ai.native_acceptance_rate` genuinely has no records and genuinely carries the
 * sentence explaining why, and a hand-written fixture could not have proved that
 * the drawer shows that sentence instead of a zero.
 */

import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";

import {
  evidenceFilterPath as evidenceFilterPathFromRoutes,
  readWorkingParam,
  withWorking,
  WORKING_PARAM,
} from "@/app/routes";
import type { Metric, ScopeReport } from "@/data";

import { WorkingBody } from "./WorkingBody";
import { WorkingSections } from "./WorkingSections";
import { sourceLines } from "./SourceRecordRow";
import { WorkingSkeleton, WorkingUnknown } from "./WorkingStates";
import { WorkingTrigger } from "./WorkingTrigger";
import { evidenceFilterPath } from "./useWorking";

const DATA_DIR = path.resolve(process.cwd(), "client/public/data");

function readScope(slug: string): ScopeReport {
  return JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "scopes", `${slug}.json`), "utf8")
  ) as ScopeReport;
}

const org = readScope("org");
const fastapi = readScope("fastapi-fastapi");

function metricFrom(scope: ScopeReport, id: string): Metric {
  const found = scope.metrics.find(m => m.id === id);
  if (!found) throw new Error(`fixture is missing ${id}`);
  return found;
}

/**
 * Static markup inside a router, so `Link` has a location to resolve against.
 * `ssrPath` is wouter's own server mode — a memory hook would subscribe to a store
 * that `renderToStaticMarkup` has no snapshot for.
 */
function render(node: Parameters<typeof renderToStaticMarkup>[0], at = "/") {
  return renderToStaticMarkup(<Router ssrPath={at}>{node}</Router>);
}

function body(
  metric: Metric,
  scopeSlug: string,
  variant: "drawer" | "sheet" = "drawer"
) {
  return render(
    <WorkingBody
      metric={metric}
      scopeSlug={scopeSlug}
      variant={variant}
      fullPagePath={`/metrics/${metric.id}`}
      onClose={() => {}}
    />
  );
}

/** Markup with the tags removed — what a reader actually sees. */
function text(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------ (4) the URL round-trips */

describe("the ?working= contract (SPEC §1.3, §5.10)", () => {
  it("round-trips a metric id through the query string", () => {
    const url = withWorking(
      "/project/python/metrics",
      "process.review_coverage"
    );
    expect(url).toBe("/project/python/metrics?working=process.review_coverage");
    expect(readWorkingParam("?working=process.review_coverage")).toBe(
      "process.review_coverage"
    );
  });

  it("round-trips every metric id the edition publishes", () => {
    for (const metric of org.metrics) {
      const url = withWorking("/repo/fastapi/fastapi", metric.id);
      const search = url.slice(url.indexOf("?"));
      expect(readWorkingParam(search)).toBe(metric.id);
    }
  });

  it("closing removes only the working parameter", () => {
    const opened = withWorking(
      "/compare?scopes=org,python",
      "quality.rework_rate"
    );
    expect(readWorkingParam(opened.slice(opened.indexOf("?")))).toBe(
      "quality.rework_rate"
    );

    const closed = withWorking(opened, null);
    /* The comma comes back percent-encoded — `withWorking` rebuilds the query
       through URLSearchParams — so the assertion is on what the next reader
       parses, not on the byte-for-byte string. */
    expect(readWorkingParam(closed.slice(closed.indexOf("?")))).toBeNull();
    expect(
      new URLSearchParams(closed.slice(closed.indexOf("?"))).get("scopes")
    ).toBe("org,python");
    expect(readWorkingParam("")).toBeNull();
  });

  it("replaces rather than appends when the drawer is already open", () => {
    const first = withWorking("/metrics", "ai.adopter_share");
    const second = withWorking(first, "process.review_coverage");
    const params = new URLSearchParams(second.slice(second.indexOf("?")));
    expect(params.getAll(WORKING_PARAM)).toEqual(["process.review_coverage"]);
  });

  it("treats an empty parameter as closed, not as a metric named ''", () => {
    expect(readWorkingParam("?working=")).toBeNull();
  });

  it("defines the evidence filter URL in exactly one place", () => {
    /*
     * Identity, not equality. Two separate functions that build the same string
     * pass every behavioural test in this file and every check in the browser —
     * which is precisely how a duplicate survives until someone renames a param in
     * one of them. This fails if `useWorking` ever grows its own copy again.
     */
    expect(evidenceFilterPath).toBe(evidenceFilterPathFromRoutes);
  });

  it("carries the scope into the pre-filtered evidence link (§5.10.8)", () => {
    /* A metric's citations differ by scope; a link without the scope would show
       the reader more records than the figure was computed over. */
    expect(
      evidenceFilterPath("process.review_coverage", "fastapi-fastapi")
    ).toBe("/evidence?metric=process.review_coverage&scope=fastapi-fastapi");
  });
});

/* ------------------------- (1) the correct metric at the correct scope */

describe("a deep link opens the right metric at the right scope (SPEC §12 C5)", () => {
  it("renders the scope's own reading, not the organisation's", () => {
    const atOrg = metricFrom(org, "process.review_coverage");
    const atRepo = metricFrom(fastapi, "process.review_coverage");

    /* The fixture that makes this test meaningful: the same metric reads 68.5% at
       the org and 7.8% at fastapi (SPEC Appendix A). */
    expect(atOrg.display).not.toBe(atRepo.display);

    const markup = text(body(atRepo, "fastapi-fastapi"));
    expect(markup).toContain(atRepo.display);
    expect(markup).not.toContain(atOrg.display);
  });

  it("names the scope the working belongs to", () => {
    const markup = text(
      body(metricFrom(fastapi, "process.review_coverage"), "fastapi-fastapi")
    );
    expect(markup).toContain(fastapi.scope.label);
  });

  it("renders the dataset's formula verbatim and derives nothing", () => {
    const metric = metricFrom(fastapi, "process.review_coverage");
    expect(text(body(metric, "fastapi-fastapi"))).toContain(metric.formula);
  });

  it("renders every metric of every scope without throwing", () => {
    for (const slug of ["org", "fastapi-fastapi", "vitejs-vite"]) {
      const scope = readScope(slug);
      for (const metric of scope.metrics) {
        expect(() => body(metric, slug)).not.toThrow();
      }
    }
  });
});

/* ---------------------------- (3) no eligible records → the stated reason */

describe("absence renders its reason, never a zero (SPEC §0.1, §12 C5)", () => {
  const na = metricFrom(org, "ai.native_acceptance_rate");

  it("is a fixture that really has nothing behind it", () => {
    expect(na.value).toBeNull();
    expect(na.sources).toHaveLength(0);
    expect(na.exemplars).toHaveLength(0);
    expect(na.no_sources_reason).toBeTruthy();
  });

  it("renders 'Not available' where the figure would be", () => {
    const markup = body(na, "org");
    expect(text(markup)).toContain("Not available");
  });

  it("never renders the value as a zero or a bare dash", () => {
    const valueRow =
      body(na, "org").split('data-testid="working-value"')[1] ?? "";
    const figure = text(valueRow.slice(0, valueRow.indexOf("</div>")));
    expect(figure).not.toMatch(/(^|\s)0(\s|$)/);
    expect(figure).not.toMatch(/(^|\s)[—–-](\s|$)/);
  });

  it("states why there are no source records instead of leaving 05 blank", () => {
    const markup = text(body(na, "org"));
    expect(markup).toContain(na.no_sources_reason!);
  });

  it("says so when a figure ranks no exemplars, rather than dropping section 04", () => {
    const markup = body(na, "org");
    expect(markup).toContain('data-section="04"');
    expect(markup).toContain('data-testid="working-no-exemplars"');
  });

  it("keeps all five numbered sections for a metric with nothing behind it", () => {
    const markup = body(na, "org");
    for (const number of ["01", "02", "03", "04", "05"]) {
      expect(markup).toContain(`data-section="${number}"`);
    }
  });
});

/* -------------------------------------------- the integrity rules, in place */

describe("the drawer keeps the figure's own rules (SPEC §6.3, §6.6)", () => {
  it("prefixes a floor metric with ≥ in the value row", () => {
    const floor = metricFrom(org, "ai.detected_commit_share");
    const markup = text(body(floor, "org"));
    expect(markup).toContain(`≥ ${floor.display}`);
  });

  it("leaves a within-trace AI figure unprefixed", () => {
    const delta = metricFrom(org, "ai.test_ratio_delta");
    const markup = text(body(delta, "org"));
    expect(markup).toContain(delta.display);
    expect(markup).not.toContain(`≥ ${delta.display}`);
  });

  it("carries the sample breakdown, not just the coverage number", () => {
    const markup = body(metricFrom(org, "process.review_coverage"), "org");
    expect(markup).toContain('data-testid="sample-breakdown"');
  });
});

/* --------------------------------------------- exemplars and source records */

describe("exemplars (SPEC §5.10.7, §6.10)", () => {
  const metric = metricFrom(fastapi, "process.review_coverage");

  it("opens rank 1 and leaves the rest collapsed to their headline", () => {
    const markup = render(
      <WorkingSections
        metric={metric}
        scopeSlug="fastapi-fastapi"
        variant="drawer"
      />
    );
    const ranked = [...metric.exemplars].sort((a, b) => a.rank - b.rank);
    const shown = text(markup);

    expect(shown).toContain(ranked[0].why_this_proves_it);
    /* The second card's headline is on screen; its prose is not, until asked for. */
    expect(shown).toContain(ranked[1].headline);
    expect(shown).not.toContain(ranked[1].why_this_proves_it);
  });

  it("labels rank 1 'Strongest' and the rest by number", () => {
    const markup = text(
      render(
        <WorkingSections
          metric={metric}
          scopeSlug="fastapi-fastapi"
          variant="drawer"
        />
      )
    );
    expect(markup).toContain("Strongest");
    expect(markup).toContain("#2");
  });

  it("caps the list at five (§5.10.7)", () => {
    const markup = render(
      <WorkingSections
        metric={metric}
        scopeSlug="fastapi-fastapi"
        variant="drawer"
      />
    );
    const cards = markup.match(/data-testid="working-exemplar"/g) ?? [];
    expect(cards.length).toBeLessThanOrEqual(5);
  });
});

describe("source records (SPEC §5.10.8, §10.4)", () => {
  const metric = metricFrom(fastapi, "process.review_coverage");

  it("is a fixture with more records than either variant shows", () => {
    expect(metric.sources.length).toBeGreaterThan(6);
  });

  it("shows six rows in the drawer and three on the sheet", () => {
    const count = (markup: string) =>
      (markup.match(/data-testid="working-source"/g) ?? []).length;

    const drawer = render(
      <WorkingSections
        metric={metric}
        scopeSlug="fastapi-fastapi"
        variant="drawer"
      />
    );
    const sheet = render(
      <WorkingSections
        metric={metric}
        scopeSlug="fastapi-fastapi"
        variant="sheet"
      />
    );

    expect(count(drawer)).toBe(6);
    /* The sheet shows three and folds the rest behind a disclosure that names how
       many it is holding — collapsed, so its rows are not in the tree yet (§10.4). */
    expect(count(sheet)).toBe(3);
    expect(text(sheet)).toContain(
      `Show ${metric.sources.length - 3} more source records`
    );
  });

  it("links out to the evidence index filtered to this metric and scope", () => {
    const markup = render(
      <WorkingSections
        metric={metric}
        scopeSlug="fastapi-fastapi"
        variant="drawer"
      />
    );
    /* `&` is escaped in an attribute; the link is the same URL. */
    const href = evidenceFilterPath(metric.id, "fastapi-fastapi").replace(
      /&/g,
      "&amp;"
    );
    expect(markup).toContain(`href="${href}"`);
    expect(text(markup)).toContain(
      `All ${metric.sources.length} source records`
    );
  });

  it("gives the record page and GitHub separate tab stops (§6.11)", () => {
    const markup = render(
      <WorkingSections
        metric={metric}
        scopeSlug="fastapi-fastapi"
        variant="drawer"
      />
    );
    const first = metric.sources[0];
    expect(markup).toContain(`href="/evidence/${first.evidenceId}"`);
    expect(markup).toContain(`href="${first.url}"`);
  });
});

/* ------------------------------------------------------- the waiting states */

describe("what shows before the working does (SPEC §5.10)", () => {
  it("shows the figure it already has rather than greying it out", () => {
    const summary = {
      id: "process.review_coverage",
      label: "Share of merged changes with a recorded review",
      family: "process",
      unit: "percent",
      display: "68.5%",
      value: 68.5,
      tier: "measured" as const,
      confidence: "high" as const,
      direction: "higher_is_better" as const,
      coverage_pct: 53.25,
      hasSeries: true,
      isNA: false,
    };
    const markup = text(
      render(
        <WorkingSkeleton
          summary={summary}
          metricId={summary.id}
          variant="drawer"
          onClose={() => {}}
        />
      )
    );
    expect(markup).toContain("68.5%");
    expect(markup).toContain(summary.label);
  });

  it("names the id it could not find instead of rendering an empty drawer", () => {
    const markup = text(
      render(
        <WorkingUnknown
          metricId="delivery.not_a_metric"
          variant="drawer"
          onClose={() => {}}
        />
      )
    );
    expect(markup).toContain("delivery.not_a_metric");
  });
});

/* ---------------------------------------------------- the ⌗ affordance (§6.12) */

describe("WorkingTrigger (SPEC §1.1, §6.12)", () => {
  it("is a link to the current route with the working parameter added", () => {
    const markup = render(
      <WorkingTrigger
        metricId="process.review_coverage"
        label="Review coverage"
      />,
      "/repo/fastapi/fastapi/metrics"
    );
    expect(markup).toContain(
      'href="/repo/fastapi/fastapi/metrics?working=process.review_coverage"'
    );
  });

  it("names the metric it opens, so the ⌗ is never the whole label", () => {
    const markup = render(
      <WorkingTrigger metricId="people.bus_factor" label="Bus factor" />
    );
    expect(markup).toContain('aria-label="Show the working behind Bus factor"');
  });

  it("keeps the working reachable from a scope that is not the org", () => {
    /* The parameter is relative to wherever the reader already is: the trigger
       never names a scope, so it cannot send them to another scope's sample. */
    const markup = render(
      <WorkingTrigger metricId="quality.rework_rate" label="Rework rate" />,
      "/project/python/findings"
    );
    expect(markup).toContain(
      'href="/project/python/findings?working=quality.rework_rate"'
    );
  });
});

/* -------------------------------- aggregates, and the records that are not links */

describe("dataset records (a third of this edition's sources)", () => {
  /*
   * `people.bus_factor` at fastapi is the hard fixture: fifteen `dataset` records
   * that share their kind, their repo, their ref AND their evidence id, carrying no
   * URL, differing only in the contributor named in `detail`.
   */
  const busFactor = metricFrom(fastapi, "people.bus_factor");

  it("is a fixture whose records really are indistinguishable by field", () => {
    const datasets = busFactor.sources.filter(s => s.kind === "dataset");
    expect(datasets.length).toBeGreaterThan(1);
    const tuples = new Set(datasets.map(s => `${s.kind}:${s.repo}:${s.ref}`));
    const ids = new Set(datasets.map(s => s.evidenceId));
    expect(tuples.size).toBe(1);
    expect(ids.size).toBe(1);
  });

  it("never prints a null repo into the row", () => {
    const markup = text(
      render(
        <WorkingSections
          metric={busFactor}
          scopeSlug="fastapi-fastapi"
          variant="drawer"
        />
      )
    );
    expect(markup).not.toContain("null");
  });

  it("leads an aggregate with its detail, not with an unusable internal ref", () => {
    const aggregate = busFactor.sources.find(s => !s.url)!;
    expect(sourceLines(aggregate)).toEqual({
      primary: aggregate.detail,
      secondary: null,
    });

    const artefact = metricFrom(fastapi, "process.review_coverage").sources[0];
    expect(sourceLines(artefact)).toEqual({
      primary: `${artefact.repo} ${artefact.ref}`,
      secondary: artefact.detail,
    });
  });

  it("offers no ↗ on a record that has nowhere to go", () => {
    const markup = render(
      <WorkingSections
        metric={busFactor}
        scopeSlug="fastapi-fastapi"
        variant="drawer"
      />
    );
    expect(markup).not.toContain("wk-source__external");
    /* href={null} is React's way of rendering an anchor with no destination. */
    expect(markup).not.toContain('href=""');
  });

  it("still keeps every row distinct on screen", () => {
    const markup = render(
      <WorkingSections
        metric={busFactor}
        scopeSlug="fastapi-fastapi"
        variant="drawer"
      />
    );
    const rows = markup.split('data-testid="working-source"').slice(1);
    const lines = rows.map(r => text(r.slice(0, r.indexOf("</li>"))));
    expect(new Set(lines).size).toBe(lines.length);
  });
});

/* ------------------------------------- §0.1: never rank people (release blocker) */

describe("the people family is never ranked (SPEC §0.1)", () => {
  it("is a fixture whose exemplars really are named contributors", () => {
    const busFactor = metricFrom(fastapi, "people.bus_factor");
    expect(busFactor.family).toBe("people");
    expect(busFactor.exemplars.length).toBeGreaterThan(0);
  });

  it("renders no rank badge on any people metric, in any scope", () => {
    for (const slug of [
      "org",
      "fastapi-fastapi",
      "javascript-and-typescript",
    ]) {
      const scope = readScope(slug);
      for (const metric of scope.metrics.filter(m => m.family === "people")) {
        const markup = render(
          <WorkingSections metric={metric} scopeSlug={slug} variant="drawer" />
        );
        expect(markup).not.toContain("wk-exemplar__rank");
        expect(text(markup)).not.toContain("Strongest");
        expect(text(markup)).not.toMatch(/#[1-5]\b/);
      }
    }
  });

  it("keeps the exemplars themselves — the figure has to stay auditable", () => {
    const busFactor = metricFrom(fastapi, "people.bus_factor");
    const markup = render(
      <WorkingSections
        metric={busFactor}
        scopeSlug="fastapi-fastapi"
        variant="drawer"
      />
    );
    expect(markup).toContain('data-testid="working-exemplar"');
    expect(text(markup)).toContain(busFactor.exemplars[0].headline);
  });

  it("still ranks everywhere the rank is about an artefact, not a person", () => {
    const reviewCoverage = metricFrom(fastapi, "process.review_coverage");
    const markup = render(
      <WorkingSections
        metric={reviewCoverage}
        scopeSlug="fastapi-fastapi"
        variant="drawer"
      />
    );
    expect(text(markup)).toContain("Strongest");
    expect(text(markup)).toContain("#2");
  });
});
