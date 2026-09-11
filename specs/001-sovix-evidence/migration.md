# Migration and Legacy Compatibility

## Objective and Guardrails

Migration preserves useful behavior from the existing Sovix Node scanner, Receipts Python
analytics/reporting and RepoRadar Next.js application behind versioned adapters. It does not
copy repositories wholesale, combine their dependency graphs, rename legacy metrics into new
semantics, or import private production datasets. The target monorepo owns new contracts and
domain rules; legacy repositories remain readable reference implementations until parity and
license gates permit retirement.

Only synthetic, generated or explicitly redacted fixtures may enter the target repository.
Existing local reports are research inputs and are never approved demos by default. No commit
history, credential, `.env`, user database, analytics export, prompt, source body, contributor
identity or customer artifact is copied. A fixture derived from real structure must contain no
real values and must pass secret, email, path and identity scans before review.

## Component Strategy

| Legacy component | Initial treatment | Exit condition |
|---|---|---|
| Sovix Node Git scanner | Wrap as `packages/scanner` adapter with a versioned JSON contract; keep Git access read-only and offline | Canonical scanner matches structural/parity fixtures across merges, rebases, renames, worktrees and exclusions |
| Receipts Python analytics | Invoke through a Python legacy adapter and preserve original metric IDs/definitions | Each adopted calculation has a reviewed canonical mapping, golden arithmetic/hash fixtures and explicit limitation parity |
| Receipts report UI/tokens | Reuse only provenance-cleared design tokens and interaction behavior; implement against new snapshot contracts | Console and offline report meet UX, accessibility and suppression acceptance |
| RepoRadar Next.js app | Isolate as the optional public `apps/radar` surface with public-only storage and credentials | Public lifecycle/provenance fixtures pass and no private workspace import or dependency exists |
| Saved Sovix/Receipts artifacts | Import through schema-versioned, digest-deduplicated adapters | Supported versions have round-trip fixtures; unsupported major versions fail before publishing metrics |

Adapters translate legacy output into explicit normalized records or legacy summary results.
They cannot write directly to analytics tables, bypass the metadata allowlist, infer tenant
scope, or manufacture raw evidence. Adapter output records source product/version, adapter
version, sanitized input digest, capability manifest, warnings and completeness.

## Inventory and Provenance Gate

Before any source or asset moves, create an inventory containing original repository and
revision, path, purpose, SPDX license expression, copyright notice, dependency license and
decision: wrap, reimplement, copy with attribution, or exclude. Keep original notices for any
copied licensed material. Code with absent, incompatible, ambiguous or non-redistributable
license remains an external behavioral reference and is reimplemented from published
contracts and fixtures; it is not copied. Generated assets and fonts require the same review.

Every migrated package includes a provenance manifest mapping target paths to inventory
records. CI fails when a migrated path lacks provenance, an excluded license appears in an
artifact, or a dependency's license is outside the approved allowlist. License approval does
not authorize copying private data or secrets.

## Parity Fixture Suite

Fixtures are deterministic, small and synthetic. Each stores input schema/version, expected
normalized records, metric contract, exact decimal values, exclusions, coverage, availability,
canonical digest and expected safe errors. Required families cover:

- Git: empty history, merge commits, first-parent landings, rename, squash/rebase/cherry-pick,
  generated/vendor/binary exclusions, multiple remotes and incomplete windows;
- review/delivery: 28 reviewed of 189 eligible merged PRs = 14.8% display, non-author approval,
  missing reviews, truncated pagination and unequal repository populations;
- Receipts: 21-day repeat-file-touch maturity, test-path ratios, summary-only medians and
  legacy limitations;
- imports: duplicate digest, changed revision, unsupported major version, 32 MiB boundary,
  archive traversal and formula-prefixed CSV text;
- reporting: available, known zero, 0/0 unavailable, partial, suppressed `k<5`, complementary
  suppression, stale/revoked evidence and offline rendering;
- public discovery: source fact versus reconstructed trend/narrative provenance, archived,
  removed and newly private lifecycle states, with no private identifiers.

Parity is semantic, not byte-for-byte presentation equality. Counts, eligibility, boundaries,
decimals, availability, exclusions and digests must match the declared legacy method. A known
legacy defect is captured as a legacy fixture and limitation; the corrected canonical metric
receives a new ID or version and a separate expected result. Hidden fallbacks and tolerance
rounding are prohibited.

## Summary-only Legacy Reports

Imported reports that contain only aggregates retain the original product, schema, metric ID,
method version, scope, window, timezone, value, unit, sample fields, stated exclusions and
source digest. They are labelled `legacy summary-only` and may be displayed or re-exported at
that exact scope. They cannot be filtered into smaller windows, joined to evidence rows,
recomputed into workspace unions, averaged into percentages/medians, used for people slices,
treated as verified attribution, or used as mandatory evidence for policy actions.

Where a legacy field cannot satisfy the complete evidence contract, the missing dimension is
explicitly unavailable. Collection completeness is unknown unless the artifact proves it.
Import never substitutes zero for a missing field. A later raw-source collection creates new
canonical results; it does not enrich or rewrite the imported snapshot. UI and exports keep
both provenance paths distinct.

## Incremental Delivery

1. **Freeze contracts and inventory**: record supported legacy versions, licenses and fixture
   digests; make no production-data copy. Publish adapter input/output schemas.
2. **Shadow adapters**: run the wrapped Node scanner and Receipts adapter on fixtures and
   approved local synthetic repositories. Compare normalized records and canonical outputs;
   do not serve new results as authoritative.
3. **Local opt-in**: make the new local pipeline available behind `legacy_adapter_v1`; retain
   the prior executable/read path. Each report records which path produced it.
4. **Local default**: switch only after 100% of required parity fixtures pass for two release
   candidates and no unexplained digest difference remains. Keep explicit legacy fallback for
   one minor release, then remove it through a documented deprecation.
5. **Hosted historical import**: enable for internal workspaces, then 10%, 25%, 50% and 100%
   of opted-in pilot workspaces. Hold each stage for at least seven days and review errors,
   latency, partial rates, cross-tenant probes and support feedback.
6. **Public discovery**: deploy RepoRadar-derived behavior with physically separate storage,
   service credentials and hostname. It receives no private adapter or database connection.
7. **Retire legacy implementations**: only after contract deprecation is at least 90 days,
   supported artifacts have replacement paths and rollback no longer depends on their code.

No stage advances if required fixture parity is below 100%, any cross-tenant or privacy probe
fails, suppressed values leak, seeded secrets appear, digest differences are unexplained, or
error/latency objectives regress by more than 10% versus the preceding stage. Business metric
differences are reviewed by definition and input; matching a legacy number is not grounds to
weaken a corrected evidence rule.

## Rollback and Data Compatibility

Each rollout is controlled by workspace-scoped, audited configuration and can stop new work
without mutating published snapshots. Rollback routes new scans/imports to the last compatible
adapter, drains or cancels unstarted new-version jobs, and leaves completed outputs immutable.
Snapshots always pin adapter, calculator, schema, allocation and privacy versions, so an older
reader either renders them correctly or reports the version unsupported; it never silently
recalculates them.

Database changes follow expand/backfill/contract. Deploy readers for both shapes, add nullable
or additive fields, backfill with leased fenced jobs and verify safe counts/digests before
switching writes. On rollback, use the old write path while the additive schema remains. Do
not reverse a destructive migration; repair forward. Removal of old fields waits until the
90-day compatibility window and backup horizon have passed.

If a stage triggers rollback, preserve receipts, checkpoints, quarantine records, safe errors
and published snapshots. Deduplication keys prevent replay from double counting after return
to the earlier adapter. Imports accepted under a newer unsupported major version remain
unpublished and retryable only after compatible software is deployed.

## Migration Acceptance

- Every copied or reimplemented component has reviewed provenance and an allowed license;
  target history and release artifacts contain no private dataset, credential or identity.
- Required parity fixtures pass in Node/Python legacy adapters and the canonical platform;
  intentional differences have distinct versions and documented limitations.
- Reimporting an identical report creates one logical source revision; a changed artifact
  appends a revision; unsupported major versions publish no metric set.
- Summary-only reports cannot be reaggregated, drilled into invented evidence or authorize a
  policy action, and their unknown coverage never appears complete.
- At each hosted rollout stage, isolation, suppression, deterministic hashes, offline export,
  latency and safe-error acceptance remain green.
- Rollback during collection, backfill and snapshot publication creates no duplicate evidence,
  changes no published snapshot and retains a working path for all declared supported formats.
