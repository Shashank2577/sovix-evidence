/**
 * SPEC §5.1 — what the Overview must be true about, at every one of the ten scopes.
 *
 * The assertions are the chunk's definition of done rather than its markup: that
 * every slot on the screen is filled from the edition, that the retired mock's
 * hardcoded figures are gone and cannot creep back, and that the selections the
 * screen makes for itself — which four signals, which finding leads, which records
 * a repository shows — hold against the real data at every altitude.
 *
 * Fixtures are the emitted edition, not hand-written objects. A fabricated scope
 * could not have proved that Go and vite really do reach the hero's empty variant,
 * which is the variant most likely to be built and never seen.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import * as copy from "@/copy";
import type { Edition, EditionFile, Metric, ScopeReport } from "@/data";
import { hydrateEdition } from "@/data";

import {
  greetingFor,
  heroFindings,
  signalMetricIds,
  topExemplars,
  REPO_SIGNAL_FALLBACK,
  SIGNAL_METRIC_IDS,
} from "./derive";
import { firstSentence } from "./FindingHero";

const ROOT = process.cwd();
const DATA_DIR = path.resolve(ROOT, "client/public/data");
const SOURCE_DIR = path.resolve(ROOT, "client/src/pages/overview");

const edition: Edition = hydrateEdition(
  JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "edition.json"), "utf8")
  ) as EditionFile
);

function readScope(slug: string): ScopeReport {
  return JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "scopes", `${slug}.json`), "utf8")
  ) as ScopeReport;
}

const scopeKeys = edition.scopeOrder;
const reports = new Map<string, ScopeReport>(
  scopeKeys.map(key => [key, readScope(edition.slugByKey[key])])
);

const byId = (report: ScopeReport) =>
  new Map<string, Metric>(report.metrics.map(metric => [metric.id, metric]));

/* ------------------------------------------------- the mock, and its figures */

describe("the Home.tsx mock is retired", () => {
  it("no longer exists", () => {
    expect(fs.existsSync(path.resolve(ROOT, "client/src/pages/Home.tsx"))).toBe(
      false
    );
  });

  /**
   * The mock's numbers were typed in. Every one of them now has a source, so none
   * of them should appear as a literal in this screen's code — if one does, a slot
   * stopped reading from the edition and nobody noticed.
   */
  it("left none of its hardcoded figures behind", () => {
    const sources = fs
      .readdirSync(SOURCE_DIR)
      .filter(name => /\.(ts|tsx)$/.test(name) && !name.endsWith(".test.tsx"))
      .map(name => ({
        name,
        text: fs.readFileSync(path.join(SOURCE_DIR, name), "utf8"),
      }));

    const mockFigures = [
      "68.5%",
      "11.0 h",
      "7.1%",
      "7.8%",
      "99.3%",
      "82.4%",
      "87.8%",
      "76.1%",
      "41.2%",
      "12 min",
      "18.9 h",
      "4,974",
      "1,200",
      "#16210",
      "1,936",
      "+4.8 pts",
      "−8.6 pts",
      "643 contributors",
      "821 pull requests",
      "rccef86aa",
    ];

    const offenders: string[] = [];
    for (const source of sources) {
      for (const figure of mockFigures) {
        if (source.text.includes(figure))
          offenders.push(`${source.name}: ${figure}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  /**
   * §5.1.2, §5.1.4: one edition, one window. The period selector is cut rather than
   * hidden, and no chip claims a comparison against an edition that does not exist.
   * Scanned over the rendered copy, which is the only place these sentences could
   * reach a reader.
   */
  it("offers no period selector and claims no previous edition", () => {
    const rendered = Object.values(copy.overview).join("\n");

    for (const phrase of [
      "Last 12 months",
      "Last 6 months",
      "previous edition",
      "last edition",
      "Period",
    ]) {
      expect(rendered, phrase).not.toContain(phrase);
    }

    /* What replaces them: the metric's own two most recent months, labelled. */
    expect(copy.overview.deltaLabel).toBe("m/m");
  });
});

/* ------------------------------------------------------------- signals */

describe("signal cards (§5.1.4)", () => {
  it("picks the four fixed metrics at every scope", () => {
    for (const key of scopeKeys) {
      const report = reports.get(key)!;
      const ids = signalMetricIds(report.scope.level, byId(report));
      expect(ids, key).toHaveLength(4);
      for (const id of ids)
        expect(byId(report).has(id), `${key} ${id}`).toBe(true);
    }
  });

  it("keeps the AI share at org and project, floor-prefixed by its metric id", () => {
    for (const key of scopeKeys) {
      const report = reports.get(key)!;
      if (report.scope.level === "repo") continue;
      expect(signalMetricIds(report.scope.level, byId(report))).toEqual([
        ...SIGNAL_METRIC_IDS,
      ]);
    }
  });

  /**
   * No repository in this edition reports an unusable AI share, so the swap has no
   * natural fixture. It is still the branch a future edition will take, so it is
   * exercised against a report whose AI metric has been emptied — the emptying is
   * the fixture, the reading it is derived from is real.
   */
  it("swaps a repository's AI share for its contributors when there is no sample", () => {
    const report = reports.get("repo:axios/axios")!;
    const map = byId(report);
    expect(signalMetricIds("repo", map)).toEqual([...SIGNAL_METRIC_IDS]);

    const ai = map.get("ai.detected_commit_share")!;
    map.set("ai.detected_commit_share", {
      ...ai,
      isNA: true,
      value: null,
      sample: { ...ai.sample, n: 0 },
    });
    expect(signalMetricIds("repo", map)[3]).toBe(REPO_SIGNAL_FALLBACK);
  });

  /** §5.1.4: all four carry a monthly series, so every sparkline drawn is real. */
  it("gives every card a real series and a chip only where two months adjoin", () => {
    for (const key of scopeKeys) {
      const report = reports.get(key)!;
      const map = byId(report);
      for (const id of signalMetricIds(report.scope.level, map)) {
        const metric = map.get(id)!;
        expect(metric.hasSeries, `${key} ${id}`).toBe(true);
        expect(metric.sparkline, `${key} ${id}`).not.toBeNull();
        if (metric.mom) {
          expect(metric.mom.display, `${key} ${id}`).not.toMatch(
            /better|worse/i
          );
          if (metric.direction === "neutral")
            expect(metric.mom.tone, `${key} ${id}`).toBe("neutral");
        }
      }
    }
  });
});

/* ---------------------------------------------------------------- hero */

describe("finding hero (§5.1.3)", () => {
  it("leads with the strongest finding in the scope's subtree", () => {
    const org = heroFindings(edition, edition.scopeSummaries["org:all"]);
    expect(org).toHaveLength(8);
    expect(org[0].severity).toBe("critical");
    expect(org[0].scope_key).toBe("repo:fastapi/fastapi");

    const rank = { critical: 3, warning: 2, info: 1 } as const;
    for (let i = 1; i < org.length; i += 1) {
      expect(rank[org[i].severity]).toBeLessThanOrEqual(
        rank[org[i - 1].severity]
      );
    }
  });

  it("reaches the empty variant where the rulebook fired nothing", () => {
    for (const key of ["repo:vitejs/vite", "project:Go", "repo:helm/helm"]) {
      const summary = edition.scopeSummaries[key];
      expect(heroFindings(edition, summary), key).toHaveLength(0);
      /* The empty variant names the rule that came nearest; absence explains
         itself rather than showing a blank panel (§4.3). */
      expect(summary.nearestThreshold, key).not.toBeNull();
    }
  });

  it("takes the first sentence of the dataset's detail, whole", () => {
    for (const headline of edition.headlines) {
      const sentence = firstSentence(headline.detail);
      expect(headline.detail.startsWith(sentence)).toBe(true);
      expect(sentence.endsWith(".")).toBe(true);
      expect(sentence.length).toBeGreaterThan(20);
    }
    expect(firstSentence("No full stop here")).toBe("No full stop here");
  });
});

/* ------------------------------------------------- inside this repository */

describe('"Inside this repository" (§5.1.5)', () => {
  it("shows up to three rank-one exemplars, one per family, heaviest first", () => {
    for (const key of scopeKeys) {
      const report = reports.get(key)!;
      if (report.scope.level !== "repo") continue;
      const chosen = topExemplars(report);

      expect(chosen.length, key).toBeGreaterThan(0);
      expect(chosen.length, key).toBeLessThanOrEqual(3);

      const families = chosen.map(entry => entry.family);
      expect(new Set(families).size, key).toBe(families.length);

      for (const entry of chosen) expect(entry.exemplar.rank, key).toBe(1);
      for (let i = 1; i < chosen.length; i += 1) {
        expect(chosen[i].exemplar.weight).toBeLessThanOrEqual(
          chosen[i - 1].exemplar.weight
        );
      }
    }
  });

  it("carries a weight unit with every weight, so no figure is bare", () => {
    for (const key of scopeKeys) {
      const report = reports.get(key)!;
      if (report.scope.level !== "repo") continue;
      for (const entry of topExemplars(report)) {
        expect(entry.exemplar.weight_unit.length, key).toBeGreaterThan(0);
        /* A `dataset` exemplar is a fact derived across the whole repository and
           has no URL of its own; every other kind links out. */
        if (entry.exemplar.source.kind === "dataset") {
          expect(entry.exemplar.source.url, key).toBeFalsy();
        } else {
          expect(entry.exemplar.source.url, key).toMatch(/^https:\/\//);
        }
      }
    }
  });
});

/* ------------------------------------------------------------ greeting */

describe("the org greeting (§5.1.1)", () => {
  it("reads the client clock, not the edition", () => {
    expect(greetingFor(new Date("2026-09-14T08:00:00"))).toBe("morning");
    expect(greetingFor(new Date("2026-09-14T11:59:00"))).toBe("morning");
    expect(greetingFor(new Date("2026-09-14T12:00:00"))).toBe("afternoon");
    expect(greetingFor(new Date("2026-09-14T17:59:00"))).toBe("afternoon");
    expect(greetingFor(new Date("2026-09-14T18:00:00"))).toBe("evening");
    expect(greetingFor(new Date("2026-09-14T23:30:00"))).toBe("evening");
  });
});
