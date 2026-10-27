/**
 * C8 — Findings (SPEC §5.2, §12).
 *
 * The chunk's definition of done is "8 cards match the data; scoped filtering;
 * empty state at a finding-less scope (e.g. vite)", so that is what is asserted
 * here, against the real `edition.json` rather than hand-written fixtures. A
 * fabricated headline could not have proved that the critical card really does
 * read `process.review_coverage < 50 · fired at 7.8%`.
 *
 * Rendering is `react-dom/server`, matching the integrity suite: everything under
 * test is about what reaches the output.
 */

import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";

import { targetForKey } from "@/app/scope";
import * as copy from "@/copy";
import { hydrateEdition, type Edition, type EditionFile } from "@/data";

import { FindingCard } from "./FindingCard";
import {
  countBySeverity,
  filterBySeverity,
  orderBySeverity,
} from "./severity";

const edition: Edition = hydrateEdition(
  JSON.parse(
    fs.readFileSync(
      path.resolve(
        import.meta.dirname,
        "../../../public/data/edition.json"
      ),
      "utf8"
    )
  ) as EditionFile
);

const headlinesFor = (scopeKey: string) =>
  edition.scopeSummaries[scopeKey].subtreeFindingIndices.map(
    index => edition.headlines[index]
  );

describe("findings ordering", () => {
  it("puts the critical finding first at org scope", () => {
    const ordered = orderBySeverity(headlinesFor(edition.root_scope));
    expect(ordered).toHaveLength(8);
    expect(ordered[0].severity).toBe("critical");
    expect(ordered[0].metric_id).toBe("process.review_coverage");
    expect(ordered[0].scope_key).toBe("repo:fastapi/fastapi");
    expect(ordered.map(h => h.severity)).toEqual([
      "critical",
      "warning",
      "warning",
      "warning",
      "warning",
      "warning",
      "info",
      "info",
    ]);
  });

  it("keeps the edition's own order within a severity", () => {
    const warnings = headlinesFor(edition.root_scope).filter(
      headline => headline.severity === "warning"
    );
    const sorted = orderBySeverity(headlinesFor(edition.root_scope)).filter(
      headline => headline.severity === "warning"
    );
    expect(sorted).toEqual(warnings);
  });

  it("counts each severity as the filter would show it", () => {
    const all = headlinesFor(edition.root_scope);
    const counts = countBySeverity(all);
    expect(counts).toEqual({ critical: 1, warning: 5, info: 2 });
    for (const severity of ["critical", "warning", "info"] as const) {
      expect(filterBySeverity(all, severity)).toHaveLength(counts[severity]);
    }
    /* `null` is "All", not a fourth severity. */
    expect(filterBySeverity(all, null)).toHaveLength(8);
  });
});

describe("scoped filtering", () => {
  it("shows only the subtree's findings at each scope", () => {
    expect(headlinesFor("repo:fastapi/fastapi")).toHaveLength(1);
    expect(headlinesFor("project:Python")).toHaveLength(2);
    expect(headlinesFor("project:JavaScript and TypeScript")).toHaveLength(6);
    expect(headlinesFor("repo:axios/axios")).toHaveLength(5);
  });

  it("leaves vite with nothing, which is the empty-state fixture", () => {
    expect(headlinesFor("repo:vitejs/vite")).toEqual([]);
    /* §5.2's empty state claims the rulebook still ran; the nearest-threshold
       derivation is the evidence for that claim, so it must exist here. */
    expect(
      edition.scopeSummaries["repo:vitejs/vite"].nearestThreshold
    ).not.toBeNull();
  });

  it("every scope's findings sum to the edition's eight", () => {
    const perRepo = Object.values(edition.scopeSummaries)
      .filter(summary => summary.scope.level === "repo")
      .reduce((total, summary) => total + summary.findingIndices.length, 0);
    expect(perRepo).toBe(edition.headlines.length);
  });
});

describe("the finding card", () => {
  const critical = edition.headlines[0];
  /* Rendered as it appears on the org page, so the link assertions below are
     about a reader standing one altitude above the finding. */
  const markup = renderToStaticMarkup(
    <Router ssrPath="/findings">
      <FindingCard
        headline={critical}
        scopeTarget={targetForKey(edition, critical.scope_key)}
        scopeLabel={edition.scopeSummaries[critical.scope_key].scope.label}
      />
    </Router>
  );

  it("states the rule and the reading it fired at", () => {
    expect(markup).toContain("process.review_coverage &lt; 50 · fired at 7.8%");
  });

  it("renders the dataset's own detail and action verbatim", () => {
    expect(markup).toContain("1,936 lines merged with no review");
    expect(markup).toContain("Turn on branch protection");
    expect(markup).toContain(copy.findings.actionHeading);
  });

  it("links the evidence at the finding's own scope, not the reader's", () => {
    /* §5.10: the drawer is bound to the route's scope, so a finding read from
       the org page has to carry its own repository in the link or the working
       would be computed over a different sample. */
    expect(markup).toContain(
      'href="/repo/fastapi/fastapi/findings?working=process.review_coverage"'
    );
  });

  it("spells the severity out rather than relying on the rail's colour", () => {
    expect(markup).toContain(copy.severity.critical);
    expect(markup).toContain("fx-card__rail");
  });

  it("never renders a zero in place of the reading", () => {
    expect(markup).toContain(critical.value_display);
  });
});
