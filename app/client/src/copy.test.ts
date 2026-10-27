/**
 * SPEC §6.5 / §11.6 — the banned-words scan.
 *
 * Rule §0.1: rendered copy never makes a causal or evaluative claim about a
 * measurement. This walks every export of `copy.ts` and fails on the banned list.
 * It covers what *we* write; prose supplied by the dataset is the dataset's
 * responsibility and is rendered verbatim.
 */

import { describe, expect, it } from "vitest";
import * as copy from "./copy";

/**
 * The §6.5 list, with the inflections that would otherwise walk straight through it:
 * banning `improved` while allowing `improvement` would be a spelling test, not an
 * integrity one. `because of` is widened to bare `because` — §0.1 bans the causal
 * claim, and the preposition does not change what is being claimed.
 *
 * Matched at word boundaries, so `upgrade`, `underscore` and `regrade` survive as the
 * ordinary words they are.
 */
const BANNED: { pattern: RegExp; term: string }[] = [
  { term: "better", pattern: /\bbetter\b/i },
  { term: "worse", pattern: /\bwors(e|en|ened|ening)\b/i },
  { term: "improved", pattern: /\bimprov(e|es|ed|ing|ement|ements)\b/i },
  { term: "caused", pattern: /\bcaus(e|es|ed|ing)\b/i },
  { term: "because of", pattern: /\bbecause\b/i },
  { term: "top performer", pattern: /\btop[\s-]performers?\b/i },
  { term: "leaderboard", pattern: /\bleaderboards?\b/i },
  { term: "score", pattern: /\bscores?\b/i },
  { term: "grade", pattern: /\bgrad(e|es|ed|ing)\b/i },
];

/** Every string reachable from the module's exports, with the path that found it. */
function collectStrings(
  value: unknown,
  path: string,
  found: { path: string; text: string }[]
): void {
  if (typeof value === "string") {
    found.push({ path, text: value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectStrings(item, `${path}[${i}]`, found));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      collectStrings(item, `${path}.${key}`, found);
    }
  }
}

const strings: { path: string; text: string }[] = [];
collectStrings(copy, "copy", strings);

describe("copy.ts", () => {
  it("exports strings the scan can actually reach", () => {
    // A regression guard on the walker itself: if copy.ts is emptied or renamed,
    // a scan over nothing would otherwise pass silently.
    expect(strings.length).toBeGreaterThan(30);
  });

  /**
   * The walker skips functions, so prose hidden inside one would escape the scan.
   * Pinning the function exports closes that door: adding a second one fails here
   * and forces a decision about how its output gets covered.
   */
  it("hides no prose inside a function export", () => {
    const functionExports = Object.entries(copy)
      .filter(([, value]) => typeof value === "function")
      .map(([name]) => name);
    expect(functionExports).toEqual(["fill"]);
  });

  it.each(BANNED)(
    "never says $term about a measurement",
    ({ pattern, term }) => {
      const offenders = strings
        .filter(entry => pattern.test(entry.text))
        .map(entry => `${entry.path}: ${JSON.stringify(entry.text)}`);
      expect(
        offenders,
        `banned word "${term}" in rendered copy (SPEC §0.1, §6.5)`
      ).toEqual([]);
    }
  );

  it("catches a banned word if one is introduced", () => {
    // The scan's own test: a deliberately offending string must be caught, so a
    // green suite means "nothing matched", not "the matcher is broken".
    const offending = { tone: { note: "Lead time improved this month." } };
    const probe: { path: string; text: string }[] = [];
    collectStrings(offending, "probe", probe);
    const caught = BANNED.filter(({ pattern }) =>
      probe.some(entry => pattern.test(entry.text))
    ).map(({ term }) => term);
    expect(caught).toContain("improved");
  });
});

describe("fill", () => {
  it("substitutes named placeholders", () => {
    expect(
      copy.fill(copy.notAvailable.sampleReason, {
        n: 0,
        population: 0,
        unit: "days of recorded telemetry",
      })
    ).toBe("0 of 0 days of recorded telemetry");
  });

  it("leaves an unknown placeholder in place rather than printing undefined", () => {
    expect(copy.fill("{a} and {b}", { a: "one" })).toBe("one and {b}");
  });
});
