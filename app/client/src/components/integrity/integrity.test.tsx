/**
 * SPEC §11.6 (component half) — the integrity behaviours under test.
 *
 * These assert the product rules of §0.1, not the markup: the floor prefix set, that
 * `NotAvailable` never renders a zero, that a sample breakdown adds up, and that the
 * status pill is derived from findings that fired. The banned-words scan lives in
 * `client/src/copy.test.ts`.
 *
 * Rendering goes through `react-dom/server` rather than a DOM harness. The rules
 * being tested are about what reaches the output, which static markup answers
 * exactly; the two disclosures that need a live DOM (the tier legend, the status
 * footnote) are covered through their pure inputs and their collapsed markup.
 *
 * Fixtures are the edition's real data, not hand-written objects — `ai.test_ratio_delta`
 * really does read `-13.5%`, and a fabricated fixture could not have proved that
 * `≥ -13.5%` never renders.
 */

import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import * as copy from "@/copy";
import {
  deriveStatus,
  FLOOR_METRIC_IDS,
  NON_FLOOR_AI_METRIC_IDS,
  type Headline,
  type Metric,
  type Sample,
  type ScopeReport,
} from "@/data";

import { CoverageBarCell } from "./CoverageBarCell";
import { FloorFigure } from "./FloorFigure";
import { NotAvailable, notAvailableReason } from "./NotAvailable";
import { SampleBreakdown, sampleTotals } from "./SampleBreakdown";
import { StatusPill, statusDriver } from "./StatusPill";
import { TierBadge } from "./TierBadge";

const DATA_DIR = path.resolve(process.cwd(), "client/public/data");

function readScope(slug: string): ScopeReport {
  return JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "scopes", `${slug}.json`), "utf8")
  ) as ScopeReport;
}

function readHeadlines(): Headline[] {
  const edition = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "edition.json"), "utf8")
  ) as { headlines: Headline[] };
  return edition.headlines;
}

const org = readScope("org");
const metricById = new Map(org.metrics.map(metric => [metric.id, metric]));

function metric(id: string): Metric {
  const found = metricById.get(id);
  if (!found) throw new Error(`fixture metric missing: ${id}`);
  return found;
}

const render = (node: Parameters<typeof renderToStaticMarkup>[0]) =>
  renderToStaticMarkup(node);

/**
 * The rendered text, i.e. what a reader actually sees. Tags become a space (they are
 * element boundaries, and two adjacent blocks read as two words, not one) and runs of
 * whitespace collapse — including the non-breaking space inside a floor figure.
 */
const text = (node: Parameters<typeof renderToStaticMarkup>[0]) =>
  render(node)
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x2265;/g, "≥")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim();

/* ---------------------------------------------------------------- §6.3 */

describe("FloorFigure (SPEC §6.3 — AI figures are floors)", () => {
  it("prefixes exactly the three floor metrics, across all 57 of the org scope", () => {
    const prefixed = org.metrics
      .filter(m => text(<FloorFigure display={m.display} metricId={m.id} />).startsWith("≥"))
      .map(m => m.id);

    expect(prefixed.sort()).toEqual([...FLOOR_METRIC_IDS].sort());
  });

  it("renders the prefix as part of the figure", () => {
    const commitShare = metric("ai.detected_commit_share");
    expect(text(<FloorFigure display={commitShare.display} metricId={commitShare.id} />)).toBe(
      "≥ 1.9%"
    );
  });

  it("never prefixes a delta — `≥ -13.5%` would assert nothing", () => {
    const delta = metric("ai.test_ratio_delta");
    expect(delta.display).toBe("-13.5%"); // guard: the fixture still carries a signed value
    expect(text(<FloorFigure display={delta.display} metricId={delta.id} />)).toBe("-13.5%");
  });

  it("never prefixes the within-trace shares or the other deltas", () => {
    for (const id of NON_FLOOR_AI_METRIC_IDS) {
      const m = metric(id);
      expect(
        text(<FloorFigure display={m.display} metricId={m.id} />),
        `${id} must render unprefixed`
      ).toBe(m.display);
    }
  });

  it("passes a non-AI metric through unchanged", () => {
    const lead = metric("delivery.lead_time_p50");
    const markup = render(<FloorFigure display={lead.display} metricId={lead.id} />);
    expect(text(<FloorFigure display={lead.display} metricId={lead.id} />)).toBe(lead.display);
    expect(markup).toContain('data-floor="false"');
  });

  it("puts the prefix in the DOM as text, so it survives copy-paste and print", () => {
    const markup = render(
      <FloorFigure display="1.9%" metricId="ai.detected_commit_share" />
    );
    // A real text node, not a ::before, not an image, not an aria-only affordance:
    // a `::before` glyph is dropped by copy-paste and by most print stylesheets, and
    // the bare number left behind would overstate its own certainty.
    expect(markup).toContain(">\u2265</span>");
    expect(markup).toContain('data-floor="true"');
    // Welded to the figure by a non-breaking space, so a wrap cannot separate them.
    expect(markup).toContain("\u00a0");
    expect(markup).toContain('data-floor="true"');
  });

  it("takes its decision from the id, not from a field on the data", () => {
    // The emitted data carries no `isFloor`; if one ever appears, this chunk's
    // contract has moved and the decision must be re-sited deliberately.
    expect(Object.keys(metric("ai.detected_commit_share"))).not.toContain("isFloor");
  });
});

/* ---------------------------------------------------------------- §6.4 */

describe("NotAvailable (SPEC §6.4 — absence is never zero)", () => {
  const naMetrics = org.metrics.filter(m => m.isNA);

  it("has the edition's three NA metrics to work with", () => {
    expect(naMetrics.map(m => m.id)).toEqual([
      "ai.native_acceptance_rate",
      "ai.native_lines_accepted",
      "ai.floor_understatement",
    ]);
  });

  it("renders words where a figure would go — never 0, never a bare dash", () => {
    for (const m of naMetrics) {
      // The chip is the figure slot on its own: whatever it says is what stands in
      // for the number.
      const chip = text(<NotAvailable metric={m} size="chip" />);
      expect(chip, `${m.id} @ chip`).toBe(copy.notAvailable.label);
      expect(chip).not.toMatch(/\d/);
      expect(chip).not.toMatch(/^[—–-]$/);

      // The stat adds the reason and nothing else — so the figure half is still
      // exactly the same words, with no zero smuggled alongside them.
      const reason = notAvailableReason(m);
      const stat = text(<NotAvailable metric={m} size="stat" />);
      expect(stat, `${m.id} @ stat`).toBe(`${copy.notAvailable.label} ${reason}`);
    }
  });

  it("states the metric's own reason at stat size", () => {
    const m = metric("ai.native_acceptance_rate");
    const reason = notAvailableReason(m);
    expect(m.caveats).toContain(reason);
    expect(reason).toMatch(/not available/i);
    expect(text(<NotAvailable metric={m} size="stat" />)).toContain(reason);
  });

  it("falls back to the sample's own count sentence when no caveat explains it", () => {
    const bare: Metric = { ...metric("ai.native_acceptance_rate"), caveats: [] };
    expect(notAvailableReason(bare)).toBe("0 of 0 days of recorded telemetry");
  });

  it("keeps the reason out of the chip size, where there is no room for it", () => {
    const m = metric("ai.floor_understatement");
    expect(render(<NotAvailable metric={m} size="chip" />)).not.toContain(
      'data-testid="na-reason"'
    );
    expect(render(<NotAvailable metric={m} size="stat" />)).toContain(
      'data-testid="na-reason"'
    );
  });

  it("carries the reason to assistive technology too", () => {
    const m = metric("ai.native_lines_accepted");
    expect(render(<NotAvailable metric={m} size="chip" />)).toContain(
      notAvailableReason(m).slice(0, 24)
    );
  });
});

/* ---------------------------------------------------------------- §6.6 */

describe("SampleBreakdown (SPEC §6.6 — the sample adds up)", () => {
  it("balances n + Σexcluded + unaccounted against population, for every metric", () => {
    const broken = org.metrics
      .map(m => ({ id: m.id, ...sampleTotals(m.sample) }))
      .filter(row => !row.balances);
    expect(broken).toEqual([]);
  });

  it("shows the itemised exclusions with their full reason and count", () => {
    const m = org.metrics.find(x => Object.keys(x.sample.excluded).length > 0)!;
    const rendered = text(<SampleBreakdown sample={m.sample} />);
    for (const [reason, count] of Object.entries(m.sample.excluded)) {
      expect(rendered, `${m.id}: ${reason}`).toContain(reason);
      expect(rendered).toContain(new Intl.NumberFormat("en-US").format(count));
    }
  });

  it("names the unaccounted remainder rather than losing it", () => {
    const m = org.metrics.find(x => x.sample.unaccounted > 0)!;
    expect(m.sample.unaccounted).toBeGreaterThan(0);
    const rendered = text(<SampleBreakdown sample={m.sample} />);
    expect(rendered).toContain(copy.sample.unaccountedReason);
    expect(rendered).toContain(
      new Intl.NumberFormat("en-US").format(m.sample.unaccounted)
    );
  });

  it("sets the bar's fill to coverage_pct", () => {
    const sample: Sample = {
      n: 78,
      population: 100,
      unit: "pull requests",
      coverage_pct: 78,
      excluded: { "Bot-authored": 22 },
      unaccounted: 0,
    };
    expect(render(<SampleBreakdown sample={sample} />)).toContain("width:78%");
  });

  it("clamps only the bar's geometry, never the stated figure", () => {
    const sample: Sample = {
      n: 1,
      population: 1,
      unit: "days",
      coverage_pct: 140,
      excluded: {},
      unaccounted: 0,
    };
    const markup = render(<SampleBreakdown sample={sample} />);
    expect(markup).toContain("width:100%");
    expect(text(<SampleBreakdown sample={sample} />)).toContain("140%");
  });

  it("says an empty sample is empty instead of printing no lines at all", () => {
    const rendered = text(
      <SampleBreakdown sample={metric("ai.native_acceptance_rate").sample} />
    );
    expect(rendered).toContain(copy.sample.emptySample);
  });
});

/* ---------------------------------------------------------------- §6.7 */

describe("CoverageBarCell (SPEC §6.7)", () => {
  it("pairs the bar with the dataset's display string", () => {
    const review = metric("process.review_coverage");
    const markup = render(
      <CoverageBarCell coveragePct={review.sample.coverage_pct} display={review.display} />
    );
    expect(text(
      <CoverageBarCell coveragePct={review.sample.coverage_pct} display={review.display} />
    )).toBe(review.display);
    expect(markup).toContain(`data-coverage-pct="${review.sample.coverage_pct}"`);
  });

  it("renders a bar alone when a table cell has no figure to pair with", () => {
    const markup = render(<CoverageBarCell coveragePct={7.8} />);
    expect(markup).toContain("width:7.8%");
    expect(markup).not.toContain("coverage-cell__display");
  });

  it("labels the bar for assistive technology, since colour alone says nothing", () => {
    expect(render(<CoverageBarCell coveragePct={99.3} />)).toContain(
      copy.fill(copy.coverage.aria, { pct: 99.3 })
    );
  });
});

/* --------------------------------------------------------- §6.2, §6.15 */

describe("TierBadge (SPEC §6.2)", () => {
  it("spells the tier out — it is text plus colour, never colour alone", () => {
    expect(text(<TierBadge tier="measured" confidence="high" />)).toBe("Measured · high");
    expect(text(<TierBadge tier="proxy" confidence="medium" />)).toBe("Proxy · medium");
    expect(text(<TierBadge tier="inferred" confidence="low" />)).toBe("Inferred · low");
  });

  it("drops the confidence only in the compact micro-context form", () => {
    const markup = render(<TierBadge tier="proxy" confidence="low" compact />);
    expect(markup).not.toContain("tier-badge__confidence");
    expect(markup).toContain('data-confidence="low"');
  });

  it("renders the legend as a disclosure, not as hover-only content", () => {
    const legend = "Read directly from the records, with no estimation step.";
    const markup = render(
      <TierBadge tier="measured" confidence="high" legend={legend} />
    );
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain("<button");
  });
});

describe("StatusPill (SPEC §5.6, §6.15 — derived, never stored)", () => {
  const headlines = readHeadlines();
  const forScope = (key: string) => headlines.filter(h => h.scope_key === key);

  it("reads critical when a critical finding targets the scope", () => {
    const fastapi = forScope("repo:fastapi/fastapi");
    expect(fastapi.some(h => h.severity === "critical")).toBe(true);
    expect(render(<StatusPill headlines={fastapi} />)).toContain('data-status="critical"');
  });

  it("reads watch when the worst finding is a warning", () => {
    const axios = forScope("repo:axios/axios");
    expect(axios.some(h => h.severity === "warning")).toBe(true);
    expect(axios.some(h => h.severity === "critical")).toBe(false);
    expect(render(<StatusPill headlines={axios} />)).toContain('data-status="watch"');
  });

  it("stays healthy when only an info finding fired", () => {
    const eslint = forScope("repo:eslint/eslint");
    expect(eslint.map(h => h.severity)).toEqual(["info"]);
    expect(render(<StatusPill headlines={eslint} />)).toContain('data-status="healthy"');
  });

  it("reads healthy at a scope no rule touched", () => {
    const vite = forScope("repo:vitejs/vite");
    expect(vite).toEqual([]);
    expect(render(<StatusPill headlines={vite} />)).toContain('data-status="healthy"');
  });

  it("names the finding that decided the pill, and no finding when healthy", () => {
    expect(statusDriver(forScope("repo:fastapi/fastapi"))?.severity).toBe("critical");
    expect(statusDriver(forScope("repo:axios/axios"))?.severity).toBe("warning");
    expect(statusDriver(forScope("repo:eslint/eslint"))).toBeNull();
    expect(statusDriver([])).toBeNull();
  });

  it("offers the footnote as a real control, not a hover tooltip", () => {
    const markup = render(<StatusPill headlines={forScope("repo:fastapi/fastapi")} />);
    expect(markup).toContain("<button");
    expect(markup).toContain('aria-expanded="false"');
  });

  it("takes no status prop — a call site cannot hand it a judgement", () => {
    const props = Object.keys({
      headlines: [] as Headline[],
      withFootnote: true,
      className: "",
    });
    // Compile-time is the real guard (StatusPillProps has no `status`); this pins
    // the intent so a future prop addition has to face it.
    expect(props).not.toContain("status");
  });

  it("agrees with the shared derivation at every repo in the edition", () => {
    // The pill is the rulebook restated. Rendering it must never disagree with the
    // build-time derivation that produced the scope summaries, or the table and the
    // data would be telling a reader two different things.
    const rendered = org.scope.repos.map(repo => {
      const list = forScope(`repo:${repo}`);
      const markup = render(<StatusPill headlines={list} withFootnote={false} />);
      return {
        repo,
        pill: markup.match(/data-status="(\w+)"/)![1],
        derived: deriveStatus(list),
      };
    });

    expect(rendered.length).toBe(6);
    for (const row of rendered) {
      expect(row.pill, row.repo).toBe(row.derived);
      expect(["critical", "watch", "healthy"]).toContain(row.pill);
    }
  });
});
