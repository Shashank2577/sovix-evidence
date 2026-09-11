# CLI Contract

## Scope

The `sovix` CLI is the local, single-owner interface to the shared scanner, analytics and
reporting domain. Scan, legacy import, calculation, verification and export work without an
account or network. The CLI uses the local SQLite/blob profile and loopback API when serving a
browser; it never uploads data implicitly. A GitHub repository URL or `owner/repo` is an
explicit network source and must be requested as such.

## Commands

| Command | Contract |
|---|---|
| `sovix scan [PATH]` | Read a local Git repository and create normalized source revisions for an explicit window. `PATH` defaults to `.`. |
| `sovix import FILE` | Validate and import one supported Sovix or Receipts report; no arbitrary URL import. |
| `sovix report` | Build an immutable snapshot from collected/imported evidence. |
| `sovix verify METRIC_ID` | Print one pinned metric's definition, arithmetic, inputs, coverage, exclusions, limitations and evidence references. |
| `sovix export` | Render an existing snapshot as self-contained HTML, JSON, CSV bundle or Markdown. |
| `sovix serve` | Bind the local console to loopback and print its URL; refuse non-loopback addresses. |
| `sovix doctor` | Check versions, local database, repository readability and artifact integrity without changing data. |

Common selectors are `--project ID_OR_SLUG`, repeatable `--repository ID_OR_PATH`, `--start`
and `--end` RFC 3339 instants, and `--timezone IANA_NAME`. A window is required for `scan` and
`report`; `--since YYYY-MM-DD` remains a supported shorthand whose end is the invocation's
captured current instant. The resolved `[start,end)` instants and timezone are always written
to output. Non-interactive use should pass both `--start` and `--end`.

`scan` accepts `--format text|json` and `--output FILE`; JSON follows its declared legacy or
canonical schema. `import` requires `--format sovix_v1|receipts_1_0|auto`; auto-detection uses
only a recognized top-level schema/version marker and otherwise fails. `report` accepts
`--allow-partial` and `--output SNAPSHOT_MANIFEST`. `verify` accepts `--snapshot FILE_OR_ID`
and `--format text|json`. `export` requires `--snapshot FILE_OR_ID`,
`--format html|json|csv_bundle|markdown` and `--output PATH`. Existing files are not overwritten
unless `--force` is supplied; overwrite uses an atomic same-directory replacement.

The local project defaults to a stable project ID stored in its owner-readable state directory.
Repository paths in normalized records are represented by repository IDs; absolute paths,
credentials, contributor names/emails, prompts and source bodies are absent from standard
reports and exports.

## Output and Exit Status

Text is for people; JSON is the machine contract. With `--format json`, stdout contains exactly
one UTF-8 JSON value and a trailing newline. Progress and safe diagnostics go to stderr and are
disabled by `--quiet`. Deterministic report JSON excludes invocation time, local paths and run
IDs from canonical content; operational timestamps appear only in the manifest. Object keys,
evidence reference sets, decimal strings and hashing follow the canonical rules in metrics.md.

| Exit | Meaning |
|---:|---|
| 0 | Complete success |
| 2 | CLI syntax or usage error; no work accepted |
| 3 | Explicit partial result was produced; inspect coverage and safe warnings |
| 4 | Invalid input, unsupported schema/version or invariant failure; no metric set published |
| 5 | Source access, authentication, rate limit or temporary dependency failure |
| 6 | Integrity/verification mismatch |
| 7 | Local state lock, storage or unexpected internal failure |
| 130 | Interrupted by SIGINT; last committed checkpoint remains resumable |

Stable machine errors contain `code`, `message`, `request_id` or local `run_id`, safe field
paths and remediation. They never echo offending source content or credentials. `--allow-partial`
permits publication with exit 3; without it, incomplete required sources leave the job
checkpointed but publish no snapshot. A known zero still exits 0; unavailable/suppressed values
do not cause failure when they are valid metric outcomes.

## Offline and Resume Semantics

The following command families make no network request when all inputs are local: `scan PATH`,
`import FILE`, `report`, `verify`, `export`, `serve` and `doctor`. Remote fonts, scripts, price
lookups and model calls are prohibited from the offline path. Missing model prices remain
unpriced. An export opens with networking disabled and verifies every manifest file digest.

Each mutating command computes a local operation key from command kind, canonical options,
input digest and project. Repeating the same completed command returns the existing logical
import/snapshot when its inputs and versions match. Collection resumes from durable page or
repository checkpoints; SIGINT requests cooperative cancellation. Changed input creates a new
revision and never rewrites a published snapshot.

## Legacy Compatibility

The v1 CLI preserves the established Sovix forms:

```text
sovix scan [path-or-explicit-remote] [--since DATE] [--json]
sovix export [--json]
sovix verify <metric-id>
```

`--json` is an alias for `--format json`. When `export` or `verify` omits `--snapshot`, the CLI
uses the most recent compatible local snapshot for the current project and prints its ID to
stderr; it never silently scans or recalculates. Existing legacy metric IDs retain their
`legacy.sovix.*` meaning unless a canonical ID/version mapping has been approved.

Receipts remains a separate executable. Sovix does not clone its command grammar or claim
parity by renaming metrics. A Receipts `report.json` is consumed with
`sovix import FILE --format receipts_1_0`; it remains a legacy summary-only result when raw
records are absent. Such values can be rendered at their original scope/window but cannot be
reaggregated, filtered to invented detail, used as verified attribution or satisfy mandatory
policy evidence. Users may continue using `receipts render`, `receipts export` and
`receipts verify` against original reports during the minimum 90-day compatibility window.

Unsupported major versions exit 4 before any metric set is published. An identical artifact
digest maps to one logical import; an edited artifact creates a new source revision. Legacy
adapters and canonical calculators run parity fixtures, and an intentional semantic correction
uses a new metric ID or version rather than changing legacy output in place.

## CLI Acceptance

- A synthetic repository produces an offline snapshot and self-contained report in five
  minutes or less, with no account, model call or network access.
- The same inputs and versions produce the same canonical digest across repeated runs and local
  persistence adapters; interruption resumes without duplicate evidence.
- Legacy Sovix invocations remain valid and supported Receipts reports retain exact provenance,
  scope, limitations and summary-only restrictions.
- Invalid/unsupported inputs publish no partial metric set; explicit partial publication exits
  3 and identifies failed sources and coverage.
- JSON stdout validates against its declared schema and contains no progress text, local paths,
  secrets, contributor identity or excluded telemetry content.
