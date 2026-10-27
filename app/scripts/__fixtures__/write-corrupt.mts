#!/usr/bin/env tsx
/** Regenerate `corrupt-cohort.json` from `corrupt.ts`. Run after changing either. */

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CORRUPTIONS, corruptCohort } from "./corrupt.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(here, "corrupt-cohort.json");
writeFileSync(
  file,
  JSON.stringify({ __corruptions__: CORRUPTIONS, ...corruptCohort() }, null, 2),
  "utf-8"
);
console.log(`wrote ${file} with ${CORRUPTIONS.length} deliberate violations`);
