/**
 * SPEC §12, C11 row — the chunk's definition of done, as tests:
 *
 *   1. 1,104 rows scroll at 60fps on mid-tier mobile emulation;
 *   2. a record shows its `citedIn` matching the reverse index;
 *   3. GitHub links open outward.
 *
 * (1) is a frame-rate claim and is measured in a real browser, not asserted here —
 * what this file can prove, and what the frame rate depends on, is that the list
 * never mounts more rows than a viewport holds. (2) and (3) are here in full, run
 * against the real `evidence.json`: all 1,104 records, not a fixture, because the
 * cases that break this screen are the ones a fixture author would not think to
 * write — the 255 records with no timestamp, the 10 with no repository and no URL,
 * the pull request whose `merged` is null, and the collection record cited in 161
 * figures.
 */

import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Router } from "wouter";

import { evidenceFilterPath } from "@/components/working";
import * as copy from "@/copy";
import { hydrateEdition } from "@/data";
import type {
  Edition,
  EditionFile,
  EvidenceIndex,
  EvidenceRecord,
} from "@/data";

import { EvidenceIndexScreen } from "./EvidenceIndexScreen";
import {
  EvidenceRecordScreen,
  EvidenceRecordUnknown,
} from "./EvidenceRecordScreen";
import {
  EMPTY_CONTROLS,
  filterRecords,
  kindCounts,
  parseCitationFilter,
  repoOptions,
  unattachedCount,
  KIND_ANY,
  REPO_NONE,
} from "./filters";
import {
  absoluteTime,
  citedLabel,
  distinctCitations,
  factKeys,
  factValue,
  humanKey,
  indexLede,
  recordLines,
  recordTitle,
  relativeTime,
} from "./format";
import { INITIAL_ROWS } from "./useWindowRows";

const DATA_DIR = path.resolve(process.cwd(), "client/public/data");

const edition: Edition = hydrateEdition(
  JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "edition.json"), "utf8")
  ) as EditionFile
);

const index: EvidenceIndex = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, "evidence.json"), "utf8")
);

function render(node: Parameters<typeof renderToStaticMarkup>[0], at = "/") {
  return renderToStaticMarkup(<Router ssrPath={at}>{node}</Router>);
}

function text(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function recordOf(id: string): EvidenceRecord {
  const record = index.records.find(candidate => candidate.id === id);
  if (!record) throw new Error(`No record ${id} in evidence.json`);
  return record;
}

/** A pull request with a title, an author, reviews and two citations. */
const PULL_REQUEST = index.records.find(
  record => record.kind === "pull_request" && record.citedIn.length > 1
)!;
/** The collection record for the org scope: no repo, no URL, 161 citation entries
    naming 20 distinct figures. */
const COLLECTION = index.records
  .filter(record => !record.url)
  .sort((a, b) => b.citedIn.length - a.citedIn.length)[0];

/* ------------------------------------------------------------------------ */

describe("the index lists 1,104 records without mounting them (SPEC §5.8)", () => {
  it("carries every record this edition cites", () => {
    expect(index.records).toHaveLength(1104);
    expect(index.total).toBe(1104);
    expect(edition.evidenceCounts.total).toBe(1104);
  });

  it("mounts a viewport's worth of rows, not the list", () => {
    const markup = render(
      <EvidenceIndexScreen edition={edition} index={index} search="" />
    );
    const rows = markup.match(/class="ev-row-slot"/g) ?? [];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(INITIAL_ROWS);
  });

  it("gives the spacer the full height of the list, so the scrollbar is honest", () => {
    const markup = render(
      <EvidenceIndexScreen edition={edition} index={index} search="" />
    );
    /* 1,104 rows × the wide row height, which is what a server render assumes. */
    expect(markup).toContain("height:61824px");
  });

  it("tells assistive tech the real size of the list", () => {
    const markup = render(
      <EvidenceIndexScreen edition={edition} index={index} search="" />
    );
    expect(markup).toContain('aria-setsize="1104"');
    expect(markup).toContain('aria-posinset="1"');
  });

  it("states the counts §5.8 asks for in the lede", () => {
    const lede = indexLede(
      edition.evidenceCounts.total,
      edition.evidenceCounts.byKind
    );
    expect(lede).toBe(
      "1,104 records cited across this edition · 388 commits · 287 pull requests · 245 files · 102 releases · 72 branches · 10 datasets"
    );
  });

  it("renders every one of the 1,104 rows without throwing", () => {
    /* Row count, not row rendering, is what virtualization changes — so the rows
       themselves are still exercised across the whole file, in slices. */
    for (let start = 0; start < index.records.length; start += 120) {
      const slice = {
        ...index,
        records: index.records.slice(start, start + 120),
      };
      expect(() =>
        render(<EvidenceIndexScreen edition={edition} index={slice} search="" />)
      ).not.toThrow();
    }
  });
});

describe("the reader's controls narrow, and never rank (SPEC §5.8)", () => {
  it("searches reference, title and repository", () => {
    const byRef = filterRecords(index.records, {
      ...EMPTY_CONTROLS,
      search: PULL_REQUEST.ref,
    });
    expect(byRef.some(record => record.id === PULL_REQUEST.id)).toBe(true);

    const byRepo = filterRecords(index.records, {
      ...EMPTY_CONTROLS,
      search: "fastapi",
    });
    expect(byRepo.length).toBeGreaterThan(0);
    expect(
      byRepo.every(
        record =>
          record.repo?.includes("fastapi") ||
          record.ref.includes("fastapi") ||
          (recordTitle(record) ?? "").toLowerCase().includes("fastapi")
      )
    ).toBe(true);

    const title = recordTitle(PULL_REQUEST)!;
    const byTitle = filterRecords(index.records, {
      ...EMPTY_CONTROLS,
      search: title,
    });
    expect(byTitle.some(record => record.id === PULL_REQUEST.id)).toBe(true);
  });

  it("filters by kind, and the chip counts equal what the chip would show", () => {
    for (const [kind, expected] of Object.entries(
      edition.evidenceCounts.byKind
    )) {
      const rows = filterRecords(index.records, {
        ...EMPTY_CONTROLS,
        kind: kind as EvidenceRecord["kind"],
      });
      expect(rows).toHaveLength(expected);
    }
    const facets = kindCounts(index.records, EMPTY_CONTROLS);
    expect(facets.total).toBe(1104);
    expect(facets.byKind).toEqual(edition.evidenceCounts.byKind);
  });

  it("facets the chip counts against the other controls", () => {
    const controls = { ...EMPTY_CONTROLS, repo: "helm/helm" };
    const facets = kindCounts(index.records, controls);
    const rows = filterRecords(index.records, controls);
    expect(facets.total).toBe(rows.length);
    expect(facets.total).toBeLessThan(1104);
    for (const [kind, count] of Object.entries(facets.byKind)) {
      expect(
        filterRecords(index.records, {
          ...controls,
          kind: kind as EvidenceRecord["kind"],
        })
      ).toHaveLength(count);
    }
  });

  it("offers the repositories the records name, plus the collection records", () => {
    const options = repoOptions(index.records, edition);
    expect(options.map(option => option.value)).toEqual([
      "axios/axios",
      "eslint/eslint",
      "vitejs/vite",
      "fastapi/fastapi",
      "mitmproxy/mitmproxy",
      "helm/helm",
    ]);
    expect(
      options.reduce((total, option) => total + option.count, 0) +
        unattachedCount(index.records)
    ).toBe(1104);

    const collection = filterRecords(index.records, {
      ...EMPTY_CONTROLS,
      repo: REPO_NONE,
    });
    expect(collection).toHaveLength(10);
    expect(collection.every(record => !record.repo)).toBe(true);
  });

  it("says so when nothing matches, rather than showing an empty list", () => {
    const markup = render(
      <EvidenceIndexScreen
        edition={edition}
        index={{ ...index, records: [] }}
        search=""
      />
    );
    expect(text(markup)).toContain("No records match.");
  });

  it("offers no sort control — a list ordered by weight ranks its authors", () => {
    const markup = render(
      <EvidenceIndexScreen edition={edition} index={index} search="" />
    );
    expect(markup).not.toContain("aria-sort");
    expect(text(markup).toLowerCase()).not.toContain("sort");
    /* And the order on screen is the edition's own. */
    const first = index.records[0];
    expect(markup).toContain(`${first.repo} ${first.ref}`);
  });
});

describe("the working drawer's pre-filtered link lands here (SPEC §5.10.8)", () => {
  const citation = PULL_REQUEST.citedIn[0];
  const scopeSlug = edition.slugByKey[citation.scopeKey];

  it("round-trips the link C5 writes", () => {
    const href = evidenceFilterPath(citation.metricId, scopeSlug);
    const filter = parseCitationFilter(href.slice(href.indexOf("?")), edition);
    expect(filter.kind).toBe("citation");
    if (filter.kind !== "citation") return;
    expect(filter.metricId).toBe(citation.metricId);
    expect(filter.scopeKey).toBe(citation.scopeKey);
    expect(filter.scopeLabel).toBe(
      edition.scopeSummaries[citation.scopeKey].scope.label
    );
  });

  it("shows exactly the records that metric counted at that scope", () => {
    const href = evidenceFilterPath(citation.metricId, scopeSlug);
    const filter = parseCitationFilter(href.slice(href.indexOf("?")), edition);
    const rows = filterRecords(index.records, EMPTY_CONTROLS, filter);

    const expected = index.records.filter(record =>
      record.citedIn.some(
        entry =>
          entry.metricId === citation.metricId &&
          entry.scopeKey === citation.scopeKey
      )
    );
    expect(rows).toHaveLength(expected.length);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.map(row => row.id)).toEqual(expected.map(row => row.id));
  });

  it("names both halves of the filter on screen", () => {
    const href = evidenceFilterPath(citation.metricId, scopeSlug);
    const markup = render(
      <EvidenceIndexScreen
        edition={edition}
        index={index}
        search={href.slice(href.indexOf("?"))}
      />
    );
    const rendered = text(markup);
    const label = edition.metricCatalog.find(
      entry => entry.id === citation.metricId
    )!.label;
    expect(rendered).toContain(label);
    expect(rendered).toContain(
      edition.scopeSummaries[citation.scopeKey].scope.label
    );
  });

  it("states the reason when the URL names something this edition lacks", () => {
    const unknownMetric = parseCitationFilter(
      "?metric=delivery.not_a_metric&scope=org",
      edition
    );
    expect(unknownMetric.kind).toBe("unknown-metric");

    const unknownScope = parseCitationFilter(
      `?metric=${PULL_REQUEST.citedIn[0].metricId}&scope=not-a-scope`,
      edition
    );
    expect(unknownScope.kind).toBe("unknown-scope");

    const markup = render(
      <EvidenceIndexScreen
        edition={edition}
        index={index}
        search="?metric=delivery.not_a_metric&scope=org"
      />
    );
    expect(text(markup)).toContain("which this edition does not publish");
  });

  it("treats a half-written filter as no filter", () => {
    expect(parseCitationFilter("?metric=delivery.lead_time_p50", edition).kind).toBe(
      "none"
    );
    expect(parseCitationFilter("", edition).kind).toBe("none");
  });
});

/* ------------------------------------------------------------------------ */

describe("a record shows its citedIn, matching the reverse index (SPEC §5.9)", () => {
  it("renders one row per citation, with the metric and the scope named", () => {
    const markup = render(
      <EvidenceRecordScreen edition={edition} record={PULL_REQUEST} />,
      `/evidence/${PULL_REQUEST.id}`
    );
    const rows = markup.match(/class="ev-cite"/g) ?? [];
    expect(rows).toHaveLength(distinctCitations(PULL_REQUEST).length);

    const rendered = text(markup);
    for (const citation of PULL_REQUEST.citedIn) {
      const label = edition.metricCatalog.find(
        entry => entry.id === citation.metricId
      )!.label;
      expect(rendered).toContain(label);
      expect(rendered).toContain(
        edition.scopeSummaries[citation.scopeKey].scope.label
      );
    }
    /* The card's kicker and heading together: "Counted in" + "2 figures". */
    expect(rendered).toContain(
      `${copy.evidence.citedHeading} ${copy.fill(copy.evidence.citedFigures, {
        count: distinctCitations(PULL_REQUEST).length,
      })}`
    );
    /* The index row says the same thing in one phrase. */
    expect(citedLabel(distinctCitations(PULL_REQUEST).length)).toBe(
      "counted in 2 figures"
    );
  });

  it("shows that scope's own reading for the metric, verbatim", () => {
    const markup = render(
      <EvidenceRecordScreen edition={edition} record={PULL_REQUEST} />,
      `/evidence/${PULL_REQUEST.id}`
    );
    for (const citation of PULL_REQUEST.citedIn) {
      const summary = edition.scopeSummaries[citation.scopeKey].metrics.find(
        metric => metric.id === citation.metricId
      )!;
      expect(text(markup)).toContain(summary.display);
    }
  });

  it("opens the working at the citation's own scope, not the current route", () => {
    const markup = render(
      <EvidenceRecordScreen edition={edition} record={PULL_REQUEST} />,
      `/evidence/${PULL_REQUEST.id}`
    );
    for (const citation of PULL_REQUEST.citedIn) {
      const summary = edition.scopeSummaries[citation.scopeKey];
      const base =
        summary.scope.level === "org"
          ? "/"
          : summary.scope.level === "project"
            ? `/project/${summary.scope.slug}`
            : `/repo/${citation.scopeKey.slice("repo:".length)}`;
      expect(markup).toContain(
        `href="${base}?working=${encodeURIComponent(citation.metricId).replace(/%2E/g, ".")}"`
      );
    }
  });

  it("holds the reverse index open against every record in the edition", () => {
    /* The promise is "each record knows every figure it was counted in", so it is
       checked over all 1,104 rather than on one: every citation must name a scope
       this edition publishes and a metric that scope actually reads. */
    let citations = 0;
    for (const record of index.records) {
      expect(record.citedIn.length).toBeGreaterThan(0);
      for (const citation of record.citedIn) {
        const summary = edition.scopeSummaries[citation.scopeKey];
        expect(summary, `${record.id} cites unknown scope`).toBeDefined();
        expect(
          summary.metrics.some(metric => metric.id === citation.metricId),
          `${record.id} cites ${citation.metricId} at ${citation.scopeKey}`
        ).toBe(true);
        citations += 1;
      }
    }
    expect(citations).toBe(4385);
    /* De-duplicated, those 4,385 entries name 3,074 distinct figures. */
    expect(
      index.records.reduce(
        (total, record) => total + distinctCitations(record).length,
        0
      )
    ).toBe(
      index.records.reduce(
        (total, record) =>
          total +
          new Set(
            record.citedIn.map(c => `${c.scopeKey}|${c.metricId}`)
          ).size,
        0
      )
    );
  });

  /**
   * `citedIn` is an occurrence list, not a set: 36 records carry the same
   * (scope, metric) pair more than once — the org collection record has 161 entries
   * naming 20 figures, because `people.active_contributors` cites it once per
   * contributor it counted. Counting entries would tell a reader this edition
   * publishes 161 figures at the org scope, which it does not, and the card would
   * repeat one row twenty-five times.
   */
  it("counts and lists the distinct figures, not the citation entries", () => {
    expect(COLLECTION.citedIn.length).toBe(161);
    const distinct = distinctCitations(COLLECTION);
    expect(distinct).toHaveLength(20);

    const markup = render(
      <EvidenceRecordScreen edition={edition} record={COLLECTION} />,
      `/evidence/${COLLECTION.id}`
    );
    const rows = markup.match(/class="ev-cite"/g) ?? [];
    expect(rows).toHaveLength(distinct.length);
    expect(text(markup)).toContain(
      `${copy.evidence.citedHeading} ${copy.fill(copy.evidence.citedFigures, {
        count: distinct.length,
      })}`
    );

    /* Every figure it was counted in is still listed — de-duplicating drops
       repeats, never a pair. */
    for (const citation of distinct) {
      const label = edition.metricCatalog.find(
        entry => entry.id === citation.metricId
      )!.label;
      expect(text(markup)).toContain(label);
    }
  });

  it("leaves the whole edition free of duplicate rows", () => {
    for (const record of index.records) {
      const distinct = distinctCitations(record);
      const keys = new Set(
        distinct.map(citation => `${citation.scopeKey}|${citation.metricId}`)
      );
      expect(keys.size).toBe(distinct.length);
      expect(distinct.length).toBeLessThanOrEqual(record.citedIn.length);
      expect(distinct.length).toBeGreaterThan(0);
    }
  });

  it("renders every record in the edition without throwing", () => {
    for (const record of index.records) {
      expect(() =>
        render(
          <EvidenceRecordScreen edition={edition} record={record} />,
          `/evidence/${record.id}`
        )
      ).not.toThrow();
    }
  });

  it("names an unknown id rather than pretending it is empty", () => {
    const markup = render(<EvidenceRecordUnknown recordId="e-000000decaf" />);
    expect(text(markup)).toContain("No record answers to that id");
    expect(markup).toContain("e-000000decaf");
  });
});

describe("GitHub links open outward (SPEC §5.9)", () => {
  it("gives every record with an address a primary button to it", () => {
    const markup = render(
      <EvidenceRecordScreen edition={edition} record={PULL_REQUEST} />,
      `/evidence/${PULL_REQUEST.id}`
    );
    expect(markup).toContain(`href="${PULL_REQUEST.url}"`);
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noreferrer noopener"');
    expect(text(markup)).toContain("Open on GitHub");
  });

  it("carries the real URL for every one of the 1,094 linkable records", () => {
    const linkable = index.records.filter(record => record.url);
    expect(linkable).toHaveLength(1094);
    for (const record of linkable) {
      expect(record.url.startsWith("https://github.com/")).toBe(true);
    }
    /* Spot-check the rendering across kinds rather than 1,094 renders. */
    const byKind = new Map<string, EvidenceRecord>();
    for (const record of linkable) if (!byKind.has(record.kind)) byKind.set(record.kind, record);
    byKind.forEach(record => {
      const markup = render(
        <EvidenceRecordScreen edition={edition} record={record} />,
        `/evidence/${record.id}`
      );
      expect(markup).toContain(`href="${record.url}"`);
    });
  });

  it("states the reason instead of offering a link that goes nowhere", () => {
    const markup = render(
      <EvidenceRecordScreen edition={edition} record={COLLECTION} />,
      `/evidence/${COLLECTION.id}`
    );
    expect(text(markup)).toContain("It has no address on GitHub.");
    expect(markup).not.toContain('target="_blank"');
    expect(text(markup)).not.toContain("Open on GitHub");
  });
});

describe("what the edition recorded (SPEC §5.9)", () => {
  it("renders the values as a definition list, snake_case spaced", () => {
    const markup = render(
      <EvidenceRecordScreen edition={edition} record={PULL_REQUEST} />,
      `/evidence/${PULL_REQUEST.id}`
    );
    const rendered = text(markup);
    for (const key of factKeys(PULL_REQUEST)) {
      expect(rendered).toContain(humanKey(key));
    }
    expect(humanKey("lines_added")).toBe("lines added");
  });

  it("does not state the title twice", () => {
    const title = recordTitle(PULL_REQUEST)!;
    expect(factKeys(PULL_REQUEST)).not.toContain("title");
    const markup = render(
      <EvidenceRecordScreen edition={edition} record={PULL_REQUEST} />,
      `/evidence/${PULL_REQUEST.id}`
    );
    /* The heading is in the page frame above this card, not in it. */
    expect(text(markup)).not.toContain(title);
  });

  it("states absence rather than leaving a cell blank", () => {
    expect(factValue(null)).toBe("not recorded");
    expect(factValue([])).toBe("none recorded");
    expect(factValue(false)).toBe("no");
    expect(factValue(0)).toBe("0");

    const open = index.records.find(
      record => record.values && record.values.merged === null
    );
    expect(open, "an unmerged pull request should exist").toBeDefined();
    const markup = render(
      <EvidenceRecordScreen edition={edition} record={open!} />,
      `/evidence/${open!.id}`
    );
    expect(text(markup)).toContain("merged not recorded");
  });

  it("never renders a person as a link or a standing (§1.4)", () => {
    const markup = render(
      <EvidenceRecordScreen edition={edition} record={PULL_REQUEST} />,
      `/evidence/${PULL_REQUEST.id}`
    );
    const author = String(PULL_REQUEST.values.author);
    expect(text(markup)).toContain(author);
    /* The author appears inside a `<dd>`, never inside an anchor. */
    const anchors = markup.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) ?? [];
    expect(anchors.some(anchor => anchor.includes(author))).toBe(false);
    expect(text(markup).toLowerCase()).not.toContain("contributor page");
  });

  it("keeps the record's own display strings, reformatting no figure (§9.8)", () => {
    for (const citation of PULL_REQUEST.citedIn) {
      const summary = edition.scopeSummaries[citation.scopeKey].metrics.find(
        metric => metric.id === citation.metricId
      )!;
      const markup = render(
        <EvidenceRecordScreen edition={edition} record={PULL_REQUEST} />,
        `/evidence/${PULL_REQUEST.id}`
      );
      expect(markup).toContain(summary.display);
    }
  });
});

describe("times are relative, with the exact moment behind them (SPEC §5.8)", () => {
  const now = Date.parse("2026-09-14T12:00:00Z");

  it("reads relatively across the edition's 54-week window", () => {
    expect(relativeTime("2026-09-14T11:30:00Z", now)).toBe("30 minutes ago");
    expect(relativeTime("2026-09-10T12:00:00Z", now)).toBe("4 days ago");
    expect(relativeTime("2026-06-14T12:00:00Z", now)).toBe("3 months ago");
    expect(relativeTime("2025-09-14T12:00:00Z", now)).toBe("last year");
  });

  it("states the absolute moment in UTC, so two readers see one timestamp", () => {
    expect(absoluteTime("2026-02-23T23:59:55+05:30")).toBe(
      "23 Feb 2026, 18:29 UTC"
    );
  });

  it("says so for the 255 records with no timestamp", () => {
    const undated = index.records.filter(record => !record.occurred_at);
    expect(undated).toHaveLength(255);
    const markup = render(
      <EvidenceIndexScreen
        edition={edition}
        index={{ ...index, records: undated }}
        search=""
      />
    );
    expect(text(markup)).toContain("No timestamp recorded");
    expect(text(markup)).not.toContain("Invalid Date");
  });
});

describe("the row says what §5.8 asks it to say", () => {
  it("carries kind, reference, detail, time and the citation count", () => {
    const record = recordOf(index.records[0].id);
    const markup = render(
      <EvidenceIndexScreen
        edition={edition}
        index={{ ...index, records: [record] }}
        search=""
      />
    );
    const rendered = text(markup);
    const { primary, secondary } = recordLines(record);
    expect(rendered).toContain(primary);
    if (secondary) expect(rendered).toContain(secondary);
    expect(rendered).toContain(citedLabel(record.citedIn.length));
    expect(markup).toContain(`href="/evidence/${record.id}"`);
  });

  it("gives a collection record its sentence rather than a heading of nulls", () => {
    const { primary, secondary } = recordLines(COLLECTION);
    expect(primary).toBe(COLLECTION.detail);
    expect(secondary).toBeNull();
    expect(primary).not.toContain("null");
  });
});
