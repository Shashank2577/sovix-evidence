#!/usr/bin/env tsx
/**
 * Split the cohort into the twelve static files the reader fetches (SPEC §9.1).
 *
 *   data/cohort.json  →  client/public/data/edition.json        shell + summaries
 *                        client/public/data/scopes/<slug>.json  ×10, full reports
 *                        client/public/data/evidence.json       1,104 cited records
 *
 * Runs on `predev` and `prebuild`. The validator (SPEC §9.4) runs first and a
 * failure aborts before anything is written — no half-written edition ever reaches
 * the output directory, because a reader cannot tell a stale figure from a fresh one.
 *
 * Usage:
 *   tsx scripts/build-data.mts [--input <cohort.json>] [--out <dir>] [--check] [--quiet]
 *     --check   validate only; emit nothing
 */

import { mkdir, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { Cohort } from "../client/src/data/types.ts";
import { buildEdition } from "./lib/transform.mts";
import { ValidationError, assertValid } from "./lib/validate.mts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_INPUT = path.join(ROOT, "data", "cohort.json");
const DEFAULT_OUT = path.join(ROOT, "client", "public", "data");

export interface BuildOptions {
  input?: string;
  out?: string;
  check?: boolean;
  quiet?: boolean;
}

export interface EmittedFile {
  path: string;
  bytes: number;
}

function readCohort(file: string): Cohort {
  let raw: string;
  try {
    raw = readFileSync(file, "utf-8");
  } catch (error) {
    throw new Error(
      `Cannot read cohort at ${file}: ${(error as Error).message}`
    );
  }
  try {
    return JSON.parse(raw) as Cohort;
  } catch (error) {
    throw new Error(
      `Cohort at ${file} is not valid JSON: ${(error as Error).message}`
    );
  }
}

async function writeJson(file: string, value: unknown): Promise<EmittedFile> {
  const body = JSON.stringify(value);
  await writeFile(file, body, "utf-8");
  return { path: file, bytes: Buffer.byteLength(body, "utf-8") };
}

/**
 * Validate, derive, split, emit. Returns the files written, largest first, so the
 * caller can check them against the §11.8 size budget.
 */
export async function buildData(
  options: BuildOptions = {}
): Promise<EmittedFile[]> {
  const input = options.input ?? DEFAULT_INPUT;
  const outDir = options.out ?? DEFAULT_OUT;
  const log = (message: string) => {
    if (!options.quiet) console.log(message);
  };

  const cohort = readCohort(input);
  assertValid(cohort);
  log(
    `✓ validator passed · schema ${cohort.schema_version} · ${Object.keys(cohort.scopes).length} scopes`
  );

  if (options.check) return [];

  const { edition, reports, evidence } = buildEdition(cohort);

  /* Rebuilt from scratch each run: a stale scope file from a previous edition
   * sitting next to a fresh one is exactly the silent staleness §4.2 forbids. */
  await rm(outDir, { recursive: true, force: true });
  await mkdir(path.join(outDir, "scopes"), { recursive: true });

  const emitted: EmittedFile[] = [];
  emitted.push(await writeJson(path.join(outDir, "edition.json"), edition));
  for (const [slug, report] of Array.from(reports.entries())) {
    emitted.push(
      await writeJson(path.join(outDir, "scopes", `${slug}.json`), report)
    );
  }
  emitted.push(await writeJson(path.join(outDir, "evidence.json"), evidence));

  for (const file of emitted) {
    log(
      `  ${path.relative(ROOT, file.path).padEnd(46)} ${(file.bytes / 1024).toFixed(1).padStart(8)} KB`
    );
  }
  log(
    `✓ ${emitted.length} files · ${evidence.total} evidence records · ${edition.headlines.length} findings · ` +
      `${edition.scopeSummaries[edition.root_scope].metrics.length} metrics per scope`
  );

  return emitted;
}

function parseArgs(argv: string[]): BuildOptions {
  const options: BuildOptions = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input" || arg === "-i")
      options.input = path.resolve(argv[++index]);
    else if (arg === "--out" || arg === "-o")
      options.out = path.resolve(argv[++index]);
    else if (arg === "--check") options.check = true;
    else if (arg === "--quiet" || arg === "-q") options.quiet = true;
    else throw new Error(`Unrecognised argument: ${arg}`);
  }
  return options;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  buildData(parseArgs(process.argv.slice(2))).catch((error: unknown) => {
    if (error instanceof ValidationError) {
      console.error(
        "\n✗ No evidence, no publish — the edition was not written.\n"
      );
      console.error(error.message);
    } else {
      console.error(`\n✗ build-data failed: ${(error as Error).message}`);
    }
    process.exitCode = 1;
  });
}
