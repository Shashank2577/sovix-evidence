/**
 * The chart kit's honesty rules, as assertions (SPEC §0.1, §6.8, §6.9, §7.5).
 *
 * These cover the pure functions — the places where a gap could quietly become a
 * zero, a band could sample instead of sum, or an axis could stop being round. The
 * rendered behaviour (wipe, keyboard, band reflow) is verified in a real browser
 * against the fixture page at `/charts.html`.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  axisPoints,
  gapIndices,
  niceTicks,
  segmentsOf,
  yDomain,
  yTicks,
} from "./scale";
import { bandRows, colourStep, stepRanges } from "./WorkHeatmap";
import { formatValue, hourRangeLabel, monthLong, monthTick } from "./format";

const SCOPES = path.resolve(import.meta.dirname, "../../../public/data/scopes");
const readScope = (file: string) =>
  JSON.parse(readFileSync(path.join(SCOPES, file), "utf8"));

describe("gaps stay gaps", () => {
  it("keeps a month with no records as null, never as zero", () => {
    const mitmproxy = readScope("mitmproxy-mitmproxy.json");
    const series = mitmproxy.series.find(
      (candidate: { id: string }) => candidate.id === "ai_share"
    );
    const points = axisPoints(
      series,
      mitmproxy.scope.since,
      mitmproxy.scope.until
    );

    const december = points.find(point => point.month === "2025-12");
    expect(december?.value).toBeNull();
    /* The neighbouring zeros are observed measurements and must survive as zeros. */
    expect(points.find(point => point.month === "2025-11")?.value).toBe(4.8);
    expect(points.find(point => point.month === "2026-01")?.value).toBe(0);
  });

  it("carries no detail for a gap month — there is nothing to report", () => {
    const mitmproxy = readScope("mitmproxy-mitmproxy.json");
    const series = mitmproxy.series.find(
      (candidate: { id: string }) => candidate.id === "ai_share"
    );
    const points = axisPoints(
      series,
      mitmproxy.scope.since,
      mitmproxy.scope.until
    );
    expect(points.find(point => point.month === "2025-12")?.detail).toBeNull();
  });

  it("breaks the line at a gap rather than bridging it", () => {
    const points = [
      { month: "2025-09", value: 1 },
      { month: "2025-10", value: 2 },
      { month: "2025-11", value: null },
      { month: "2025-12", value: 4 },
      { month: "2026-01", value: 5 },
    ];
    expect(segmentsOf(points)).toEqual([
      { start: 0, end: 1 },
      { start: 3, end: 4 },
    ]);
    expect(gapIndices(points)).toEqual([2]);
  });

  it("leaves a gap out of the axis domain entirely", () => {
    /* If null were read as 0, a duration axis would be dragged to the floor. */
    const withGap = [
      { month: "a", value: 12 },
      { month: "b", value: null },
      { month: "c", value: 14 },
    ];
    expect(
      yDomain(
        withGap.map(p => p.value),
        "hours"
      )[0]
    ).toBeGreaterThan(0);
  });

  it("spans the scope's own window, so axes are never shared", () => {
    const helm = readScope("helm-helm.json");
    const fastapi = readScope("fastapi-fastapi.json");
    const months = (report: {
      series: { id: string }[];
      scope: { since: string; until: string };
    }) =>
      axisPoints(
        report.series.find(s => s.id === "commits") as never,
        report.scope.since,
        report.scope.until
      );
    expect(months(helm)).toHaveLength(13);
    expect(months(helm)[0].month).toBe("2025-08");
    expect(months(fastapi)).toHaveLength(12);
    expect(months(fastapi)[0].month).toBe("2025-09");
  });
});

describe("axes", () => {
  it("anchors counts, percentages and headcounts at zero", () => {
    for (const unit of ["percent", "commits", "lines", "people"]) {
      expect(yDomain([4, 61, 12], unit)[0]).toBe(0);
    }
  });

  it("anchors durations at the data, where zero is not a meaningful floor", () => {
    expect(yDomain([120, 140, 131], "hours")[0]).toBeGreaterThan(0);
  });

  it("produces round ticks, not whatever the extremes happen to be", () => {
    expect(niceTicks(0, 11.1)).toEqual([0, 2.5, 5, 7.5, 10, 12.5]);
    expect(niceTicks(0, 82)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(0, 61)).toEqual([0, 20, 40, 60, 80]);
    expect(niceTicks(0, 4974)).toEqual([0, 1000, 2000, 3000, 4000, 5000]);
    expect(yTicks([0, 4.8, 11.1], "percent").every(Number.isFinite)).toBe(true);
  });

  it("covers the whole range: no observed value falls outside the ticks", () => {
    for (const file of ["org.json", "helm-helm.json", "axios-axios.json"]) {
      const report = readScope(file);
      for (const series of report.series) {
        const values = series.points.map(
          (p: { value: number | null }) => p.value
        );
        const [low, high] = yDomain(values, series.unit);
        for (const value of values) {
          if (value === null) continue;
          expect(value).toBeGreaterThanOrEqual(low);
          expect(value).toBeLessThanOrEqual(high);
        }
      }
    }
  });
});

describe("heatmap bands sum, never sample", () => {
  const org = readScope("org.json");

  it("preserves the total at every band size", () => {
    const total = org.heatmap.grid
      .flat()
      .reduce((a: number, b: number) => a + b, 0);
    for (const span of [1, 2, 4] as const) {
      const summed = bandRows(org.heatmap.grid, span)
        .flat()
        .reduce((a, cell) => a + cell.value, 0);
      expect(summed).toBe(total);
    }
    expect(total).toBe(org.heatmap.total);
  });

  it("gives the expected column count at each width band", () => {
    expect(bandRows(org.heatmap.grid, 1)[0]).toHaveLength(24);
    expect(bandRows(org.heatmap.grid, 2)[0]).toHaveLength(12);
    expect(bandRows(org.heatmap.grid, 4)[0]).toHaveLength(6);
  });

  it("sums adjacent hours, in order", () => {
    const row = org.heatmap.grid[0];
    const banded = bandRows([row], 4)[0];
    expect(banded[0]).toEqual({
      hour: 0,
      value: row.slice(0, 4).reduce((a: number, b: number) => a + b, 0),
    });
    expect(banded[5].hour).toBe(20);
  });
});

describe("heatmap colour steps", () => {
  it("reserves step 0 for a true zero", () => {
    expect(colourStep(0, 82)).toBe(0);
    expect(colourStep(1, 82)).toBe(1);
  });

  it("labels the legend with the ranges the steps actually hold", () => {
    for (const max of [1, 3, 5, 7, 82, 600]) {
      const label = stepRanges(max);
      expect(label.split(" · ")).toHaveLength(5);
      for (let value = 1; value <= max; value += 1) {
        const step = colourStep(value, max);
        const band = label.split(" · ")[step];
        const [from, to] = band.includes("–")
          ? band.split("–").map(part => Number(part.replace(/,/g, "")))
          : [Number(band), Number(band)];
        expect(value).toBeGreaterThanOrEqual(from);
        expect(value).toBeLessThanOrEqual(to);
      }
    }
  });
});

describe("formatting", () => {
  it("attaches the unit without rounding the figure away", () => {
    expect(formatValue(4.8, "percent")).toBe("4.8%");
    expect(formatValue(15.1, "hours")).toBe("15.1 h");
    expect(formatValue(4974, "commits")).toBe("4,974 commits");
  });

  it("names months, the one label §9.8 lets the client form", () => {
    expect(monthLong("2025-12")).toBe("December 2025");
    expect(monthTick("2025-12")).toBe("Dec");
    expect(monthTick("2026-01")).toBe("Jan 26");
  });

  it("wraps an hour band across midnight without producing 24:00", () => {
    expect(hourRangeLabel(20, 4)).toBe("20:00–00:00");
    expect(hourRangeLabel(14, 2)).toBe("14:00–16:00");
  });
});
