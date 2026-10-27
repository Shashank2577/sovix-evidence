#!/usr/bin/env node
/**
 * Turn a `receipts collect` report into the cohort file the app reads.
 *
 *   node scripts/trim-report.mjs ../out/report.json data/cohort.json
 *
 * A collected report is large — 117 MB on a six-repository cohort — because it
 * carries every scope and every source record. The app needs the publishable
 * scopes and a bounded number of records per metric, which is roughly 4 MB.
 *
 * Three things happen here, and the first two are privacy decisions rather than
 * size decisions:
 *
 *   1. **Contributor scopes are dropped.** A report contains one scope per
 *      person. The product has no contributor altitude and no ranking of
 *      people, so shipping per-person scopes to the browser would put the
 *      ingredients of a leaderboard in front of anyone with devtools, whether
 *      or not a screen renders them.
 *   2. **`top_contributors` is dropped from every scope's facts** for the same
 *      reason: it is an ordered list of people.
 *   3. Source records are capped per metric, and exemplars capped at five.
 *
 * What remains still contains real contributor names and email addresses in
 * source records, because a metric has to be able to cite the commit it
 * counted. That is fine behind authentication and is NOT fine on a public URL —
 * see RUNNING-ON-YOUR-REPOS.md, "Before anyone else can see it".
 */
import fs from "node:fs";
import path from "node:path";

const PUBLISHABLE_LEVELS = new Set(["org", "project", "repo"]);
const MAX_SOURCES_PER_METRIC = 25;
const MAX_EXEMPLARS_PER_METRIC = 5;

const [, , inputArg, outputArg] = process.argv;
if (!inputArg) {
  console.error(
    "usage: node scripts/trim-report.mjs <report.json> [out/cohort.json]"
  );
  process.exit(2);
}
const input = path.resolve(inputArg);
const output = path.resolve(outputArg ?? "data/cohort.json");

if (!fs.existsSync(input)) {
  console.error(`no such report: ${input}`);
  process.exit(2);
}

const report = JSON.parse(fs.readFileSync(input, "utf8"));
const scopes = report.scopes ?? {};

const kept = {};
let droppedPeople = 0;
for (const [key, scope] of Object.entries(scopes)) {
  if (!PUBLISHABLE_LEVELS.has(scope?.scope?.level)) {
    droppedPeople += 1;
    continue;
  }
  for (const metric of scope.metrics ?? []) {
    if (Array.isArray(metric.sources))
      metric.sources = metric.sources.slice(0, MAX_SOURCES_PER_METRIC);
    if (Array.isArray(metric.exemplars))
      metric.exemplars = metric.exemplars.slice(0, MAX_EXEMPLARS_PER_METRIC);
  }
  if (scope.facts) delete scope.facts.top_contributors;
  kept[key] = scope;
}

const cohort = { ...report, scopes: kept };
if (cohort.navigation) cohort.navigation = { projects: cohort.navigation.projects };

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(cohort));

const mb = n => (n / 1e6).toFixed(1) + " MB";
console.log(`read   ${input}  ${mb(fs.statSync(input).size)}`);
console.log(`kept   ${Object.keys(kept).length} publishable scope(s)`);
console.log(`opted out of ${droppedPeople} contributor scope(s)`);
console.log(`wrote  ${output}  ${mb(fs.statSync(output).size)}`);
console.log(`\nnext:  pnpm run data      # split into client/public/data/`);
