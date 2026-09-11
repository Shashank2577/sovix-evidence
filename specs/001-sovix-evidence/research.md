# Research and Decisions

**Date**: 2026-09-11. Research is read-only. No telemetry was installed or transmitted.
Decisions below resolve the specification's implementation assumptions. Runtime certification
is an implementation acceptance task, not an unresolved product requirement.

## R1 — Official Spec Kit scaffold

**Decision**: Use GitHub Spec Kit v1.0.0, commit
`bca679051abb80d6cf0cd909f2539a28a10eb7eb`, initialized with Codex skills and bash scripts.
**Rationale**: Reproducible scaffold and native constitution/spec/plan/tasks workflow.
**Alternative**: Copying an older vendored template would lose current workflow semantics.
**Source**: [GitHub Spec Kit](https://github.com/github/spec-kit/tree/v1.0.0).

## R2 — Preserve existing engines through adapters

**Decision**: Receipts supplies the main analytics/reporting concepts; Sovix stays a local
scanner; RepoRadar is an isolated optional surface. No source code is copied in this spec task.
**Rationale**: Existing engines overlap but have different privacy and output promises.
**Alternative**: A wholesale rewrite would obscure numerical drift before parity is measured.
**Local evidence**: Sovix README at revision `9933cb9`; Receipts README and evidence contract,
repository HEAD `7ef037e`; RepoRadar README at `3c0400c54`. Later saved Receipts reports contain
62 metric rows across nine families despite stale README counts of 54/eight. Treat saved
artifacts as examples, not certification of HEAD. Private samples must be synthesized/redacted
before entering test fixtures. Input reports are not authoritative evidence of true AI authorship.

## R3 — Optional telemetry boundary

**Decision**: Accept redacted OTLP traces through a versioned adapter; do not depend on an
undocumented Darkplane export API. Configure a local/standard receiver and certify compatibility.
**Rationale**: The plugin is instrumentation; Darkplane is a separate hosted product.
**Alternative**: Scraping the hosted UI is brittle and not an API contract.
**Source**: [Dash0 plugin](https://github.com/dash0hq/dash0-agent-plugin).

## R4 — Certify Codex CLI before claiming other runtimes

**Decision**: Initial target is Codex CLI with a pinned Dash0 release; desktop/cloud are labelled
unverified until their own fixture runs pass. The setup includes explicit hook trust and scoped
credentials. Project configuration replacement is tested. Do not change user configuration as
part of baseline scanning.
**Rationale**: Codex-specific documentation names CLI; support cannot be extrapolated.
**Alternative**: Claiming universal Codex support from a marketplace listing is insufficient.
**Source**: [Codex integration](https://github.com/dash0hq/dash0-agent-plugin/blob/main/.codex-plugin/README.md).

## R5 — Metadata-only and canonical usage accounting

**Decision**: Allowlist metadata; discard identity/content/error text. Model missing fields as
unsupported. For Codex, parent turn owns reported subagent usage; do not add child totals again.
Use token-priced equivalent cost rather than calling it subscription spending.
**Rationale**: Runtime fields and accounting differ. Current matrix lacks Codex cache-creation
and emitted reasoning-token/effort fields. Fail-open hooks can lose telemetry.
**Alternative**: Summing all spans or treating absent usage as zero creates false precision.
**Source**: [Runtime matrix](https://github.com/dash0hq/dash0-agent-plugin/blob/main/FEATURE_MATRIX.md).

## R6 — Source context is a link candidate, not authorization or authorship

**Decision**: Normalize vendor VCS attributes, then verify Git/PR membership independently.
Source team labels never determine workspace access. Observed HEAD may precede final output.
**Rationale**: Runtime CWD and origin context are useful but incomplete associations.
**Sources**: [OTLP attribute implementation](https://github.com/dash0hq/dash0-agent-plugin/blob/main/internal/otlp/otlp.go),
[VCS extraction](https://github.com/dash0hq/dash0-agent-plugin/blob/main/internal/vcs/vcs.go).

## R7 — Separate OTLP protocol from job APIs

**Decision**: OTLP `/v1/traces` uses standard 200/full-or-partial success; REST import/report
operations use 202 jobs. Implement partial rejection, decompressed size limits, Retry-After and
replay fixtures. Partial-success clients must not retry rejected subsets as whole batches.
**Alternative**: A universal `202 {job_id}` wrapper would break OTLP clients.
**Source**: [OTLP specification](https://opentelemetry.io/docs/specs/otlp/).

## R8 — Durable webhook receipt and reconciliation

**Decision**: Verify HMAC-SHA256 over original bytes before parsing. Deduplicate installation +
delivery ID, persist durably and acknowledge within ten seconds. Process asynchronously and
reconcile missed events through incremental host collection.
**Alternative**: Synchronous API lookups before acknowledgement cause timeouts and lost work.
**Sources**: [GitHub signatures](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries),
[GitHub webhook practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks).

## R9 — PostgreSQL tenancy plus domain authorization

**Decision**: Hosted API/workers use non-owner roles without BYPASSRLS, transaction-scoped tenant
context, explicit project guards and private artifact downloads. SQLite local mode remains one
workspace; the same domain tests cover both adapters.
**Alternative**: UI-only authorization cannot protect direct IDs or asynchronous jobs.
**Source**: [PostgreSQL 17 row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html).

## R10 — Versioned contracts, no accidental auth alternatives

**Decision**: Use OpenAPI 3.1.1 and JSON Schema 2020-12. API JWT, collector token and GitHub HMAC
are separate schemes applied to their specific routes. Browser authentication is a BFF concern.
**Rationale**: Multiple security objects mean alternatives, not cumulative requirements.
**Source**: [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html).

## R11 — Measured outcomes before enforcement

**Decision**: Actual deployment/incident ingestion is required for production measures. Policy
mode starts shadow; enforce only bounded actions with current-head/host revalidation.
**Rationale**: The initial reports use release/failure proxies. Darkplane's product currently
advertises AutoMerge as coming soon; no hosted automation capability is assumed reusable.
**Source**: [Darkplane status](https://www.darkplane.ai/).

## R12 — Explicit commercial and product assumptions

**Decision**: Focus first on project/client reporting; entitlements are manually configured pilot
limits. Billing checkout and email integrations are separate future work.
**Rationale**: This allows a real reporting pilot without prematurely specifying a payment stack.
**Alternative**: Leading with generic AI cost analytics overlaps directly with Darkplane.
**Source**: [Darkplane product scope](https://www.dash0.com/darkplane-ai-coding-insights).

## Remaining validation work, not missing decisions

Dependency lock resolution; licensed upstream source migration; capture of redacted runtime
fixtures; end-to-end GitHub App permissions; capacity benchmarks; restore drill; pilot willingness
to pay. Each appears in tasks.md with a deliverable. None is claimed completed here.
