# Integration Contracts and Source Boundaries

Status: proposed implementation contract; researched 2026-09-11. This document covers
FR-002–006, FR-015, FR-019–030 and FR-043–048. Nothing here installs a plugin, enables
telemetry, grants host permissions or claims a tested runtime integration.

## Adapter Contract

Every adapter declares `kind`, `adapter_version`, supported source schema/runtime versions,
capabilities, required permissions, pagination model, retry policy and last successful sync.
Collection yields sanitized `SourceRevision` records plus a completeness manifest; a missing
capability cannot be replaced with a zero. Preserve source time, observation time, external
identity and immutable source revision. Credentials determine workspace/project scope;
source labels, team names and URLs never authorize access.

Accepted adapters are `local_git`, `legacy_import`, `github`, `otlp`, `deployment` and
`incident`. Public discovery uses different credentials and storage. Legacy summaries remain
summary evidence: never manufacture PRs or sessions to make an unavailable drill-down work.
A compatible minor schema may add ignored fields; unknown major versions fail explicitly.

## GitHub Read Access

Use a GitHub App installed on selected repositories. The baseline installation is read-only:
metadata, contents (Git/commit metadata), pull requests (PRs/reviews), checks, commit statuses,
and Actions (workflow run outcomes). Request deployments read only when that adapter is
selected. Issues read is optional for explicitly enabled issue linkage. Request no issues
write, organization member enumeration, secrets access, workflow writes or administration
write. If a requested API cannot be called with the declared permissions, report the
capability unavailable; do not silently broaden permission or fall back to a broad PAT.

The application manifest and integration test must prove the exact endpoint/permission
matrix against the pinned GitHub API version. Pin that version in adapter configuration;
record it in collection provenance. PR enumeration requires pull-requests read according to
the [GitHub PR API](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests).

Writes use a separately enabled action installation/credential profile and worker boundary:
`publish_check` needs checks write; `merge_pr` needs contents write for the merge endpoint.
PR read remains needed for live validation. Never grant write permissions to ordinary
collectors. No action profile has branch-protection bypass or administration write. GitHub
may reject a merge under its own restrictions; that rejection remains authoritative.
See [check runs](https://docs.github.com/en/rest/checks/runs#create-a-check-run) and
[merge endpoint](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request).

Page through complete populations using provider cursors/links, checkpoint each committed
page, honor rate-limit reset/retry headers, and expose incomplete pagination. A checkpoint
contains safe cursor/state metadata, never a token. Incremental sync overlaps the prior
watermark to capture edits and deduplicates source revisions. Periodic reconciliation covers
missed webhook events, force pushes and access changes. Access revoked or repository removed
stops future collection immediately upon detection and marks historical data freshness.

## Webhook Authenticity, Replay and Ordering

Verify HMAC-SHA256 over exact raw bytes against `X-Hub-Signature-256`, with constant-time
comparison, before parsing or persisting anything. Invalid/missing signatures return 403.
Only retain sanitized allowlisted payload fields. Do not write original bodies to logs,
object stores or dead-letter queues. See
[GitHub validation](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries).

Use `(workspace_id, connector_id, X-GitHub-Delivery)` as delivery identity. Verify that the
signed installation/repository belongs to the connector before accepting it. A receipt and
outbox job commit in one transaction; only then return 202 within ten seconds. A valid
duplicate with identical sanitized digest returns 202 and the existing receipt. A duplicate
identity with conflicting sanitized digest returns 409 and a content-free conflict record.
A failed worker can retry an existing receipt; receipt existence does not imply processing
success. Redelivery uses the original delivery ID, so it must not double-count. These choices
implement [GitHub webhook practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks).

Support subscribed event/action pairs only: PR lifecycle, review changes, check/workflow
completion, push, installation/repository access changes, and optional deployment statuses.
Unknown actions are acknowledged as ignored with safe counters. Events are hints to collect
current/versioned host facts, not an ordered transaction stream. Late events append evidence
without regressing current state. Resolve state by source revisions/current API reads, never
arrival order alone. Track delivery failure, dead-letter counts and reconciliation lag.

## Dash0 / Codex Compatibility

Dash0's [Codex README](https://github.com/dash0hq/dash0-agent-plugin/blob/main/.codex-plugin/README.md)
documents Codex CLI on macOS/Linux/Windows, amd64/arm64. Desktop, cloud and other versions
remain `unverified` until fixture/live certification. Record runtime, runtime version,
plugin version and adapter version. The installation guide is a separate operator action:
marketplace installs need credential configuration and hook trust; restart into a new
session. Project configuration replaces user configuration rather than merging. Runtime
credentials reside in owner-only local configuration, not a shell `DASH0_AUTH_TOKEN` fallback.
Pin and checksum-verify a release; never silently update the collector during an analysis.

Default `omit_io=true` strips prompt/tool content, but `omit_user_info=false` sends real
identity. Sovix's recommended collector configuration explicitly enables both omissions.
Ingestion must still enforce its own allowlist. Do not assume upstream defaults satisfy
Sovix privacy. Debug mode can serialize payloads; it is disabled in production.

The [feature matrix](https://github.com/dash0hq/dash0-agent-plugin/blob/main/FEATURE_MATRIX.md)
reports no emitted Codex reasoning-token, reasoning-effort or cache-creation fields.
Subagent usage folds into parent usage, tool duration is reconstructed, and real sessions
emit traces rather than standalone session-start/log/metric records. These are unsupported
capabilities, not zero usage. Upstream export is fail-open and bounded; absence of a span
cannot prove absence of activity. Maintain `complete/partial/unknown` instrumentation
coverage independently of Git collection coverage.

## Exact Metadata Allowlist

This is the full v1 Dash0 input allowlist. Values also pass type, length, format and source
scope validation. Unknown keys are dropped before persistence, quarantine and logs. OTLP
resource and scope metadata are not unrestricted passthrough dictionaries.

| Accepted input | Normalized meaning / validation |
|---|---|
| `traceId`, `spanId`, `parentSpanId` | Lowercase hex 32/16/16; nonzero IDs; absent parent allowed |
| `startTimeUnixNano`, `endTimeUnixNano` | Integer timestamp strings; invalid negative duration rejected |
| `status.code` | Unset/OK/Error normalized to status enum; discard status message |
| scope `name`, `version`; resource `service.name`, `service.version` | Registered runtime/plugin identifiers, max 128 characters; never authority |
| `gen_ai.conversation.id` | Opaque external session ID, max 256 characters |
| `gen_ai.harness.name`, `gen_ai.agent.name`, `gen_ai.agent.id` | Declared runtime/agent IDs; max 128/128/256 characters |
| `gen_ai.operation.name` | Enum `chat`, `execute_tool`, `invoke_agent`; other values unavailable/ignored |
| `gen_ai.request.model`, `gen_ai.provider.name` | Catalog-normalized model/provider, max 128 characters; unknown model unpriced |
| `gen_ai.tool.name`, `gen_ai.tool.call.id` | Validated tool identifier / opaque ID; max 128/256 characters |
| `dash0.gen_ai.tool.mcp_server` | Registered server identifier, max 128 characters; no endpoint URL |
| `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens` | Nonnegative integer counts; nullable when absent |
| `gen_ai.usage.cache_read.input_tokens`, `gen_ai.usage.cache_creation.input_tokens` | Nonnegative counts; adapter capability controls availability |
| `dash0.gen_ai.vcs.repository.url.full` | Canonical allowed-host remote; strip userinfo/query/fragment and `.git`; resolve registered repository |
| `dash0.gen_ai.vcs.repository.name`, `.owner.name`, `.provider.name` | Validation hints only; resolved repository identity is authoritative |
| `dash0.gen_ai.vcs.ref.head.name`, `.ref.head.type`, `.ref.head.revision` | Safe Git ref/type/full SHA; revision is observed checkout state |
| `dash0.gen_ai.vcs.pull_request.url`, `dash0.gen_ai.vcs.issue.url` | Canonical allowed-host source link resolved to registered repository |
| `dash0.gen_ai.vcs.commit.sha` | Full commit SHA extracted from activity; corroborate with Git source |
| `dash0.gen_ai.billing_mode`, `dash0.gen_ai.plan_type` | Bounded source billing classification; no inference from absence |

Dotted abbreviations in the VCS table retain the `dash0.gen_ai.vcs` prefix. Source mapping
is grounded in [Dash0's attribute implementation](https://github.com/dash0hq/dash0-agent-plugin/blob/main/internal/otlp/otlp.go).
Do not substitute unverified generic `vcs.*` names. A later adapter version may accept new
aliases only with fixtures proving equivalent semantics. Reject unknown attribute values
containing control characters; never echo rejected values. Repository/ref names can still
be sensitive metadata and remain private project evidence.

Drop raw span display names, `user.*`, `dash0.team.name`, CWD/paths, error/exception text,
messages, arguments/results, arbitrary span events/links, skill/file paths, rate-limit and
credit snapshots, and unrecognized fields. Reconstruct display names from validated
operation/model/tool fields. Convert error status to `tool_error` or `unknown_error`; never
classify by retaining arbitrary exception content. Registered connector/project assignment
supplies team scope. Redaction counters contain field categories and counts only.

Session identity is scoped by collector; span identity is collector+trace+span within the
workspace. Identical sanitized replay is a no-op. Conflicting duplicates are quarantined as
safe digests/IDs/reason codes, without replacing the original. Missing parents and late turns
produce partial sessions; a final snapshot pins the exact accepted revisions it used.

## Usage and Cost Normalization

Canonical usage belongs to one owner span. `included_in_parent` and `unknown` accounting
units never enter canonical cost totals. Never add cache-read counts on top of input totals
without checking the runtime's inclusive/exclusive semantics. A versioned adapter fixture
must prove count semantics before its price calculator is enabled. Parent/child overlap,
cumulative resets and mixed models require explicit owner/counter handling.

Token-based list-price calculations are `CostEstimate`; a subscription price or token
allowance is not actual per-turn expenditure. Unknown billing mode stays unknown; unknown
model price retains unpriced usage. Optional invoice/subscription `BillingAllocation` is a
separate ledger, cannot silently replace estimated cost, and cannot imply measured labor.
All costs use the model's decimal USD convention and pinned price versions.

Observed branch/HEAD or temporal proximity creates candidate associations only. Verified
links require corroborated PR membership or explicit analyst attestation labelled as such.
Squash/rebase relationships retain source SHAs and method history. Multiple repositories
in one session require evidence per link; do not attach the full cost to every repository.
Allocation rows plus unallocated remainder conserve each canonical cost unit exactly.

## OTLP Is a Separate Protocol Boundary

Expose standard `/v1/traces` through a conformant receiver/Collector. Support protobuf and
OTLP JSON with response content type matching the request. Authentication derives a scoped
collector identity. An 8 MiB decompressed trace-batch limit, safe attribute count/depth limits
and quota checks run before storage; invalid records have safe rejection diagnostics.

Full success is HTTP 200 with `ExportTraceServiceResponse`, not REST 202. Partial success is
HTTP 200 with `partial_success.rejected_spans` and a safe message. Clients must not retry a
partially accepted batch. Malformed payloads return 400 with protocol error representation;
unsupported media uses 415 and oversized requests 413. Retryable responses are 429, 502,
503 and 504; honor `Retry-After` or exponential backoff with jitter. A duplicate valid span
is accepted without a new accounting effect, not reported as a partial rejection. Count
actual invalid/conflicting rejected spans. ACK only after durable acceptance.
See [OTLP specification](https://opentelemetry.io/docs/specs/otlp/).

Platform REST jobs use 202 plus a job resource and stable application error codes. Do not
reuse that JSON response for OTLP. GitHub/webhook delivery semantics likewise remain
separate. No undocumented Darkplane read API is assumed; optional Collector forwarding must
preserve independent destination queues and must not make Sovix counts depend on a second
backend's acknowledgement.

## Deployment and Incident Adapters (M4)

Accept authenticated versioned REST event submissions or a configured provider adapter;
never arbitrary user-supplied fetch URLs. Both produce `SourceRevision` and durable receipts.
A request contains `schema_version`, `event_id`, `external_id`, `revision_key`, `occurred_at`
and the typed payload. Unique connector+event ID deduplicates delivery; external ID+revision
identifies source history. Conflicts return 409. Corrections append source revisions.

Deployment payload: registered repository ID, full `revision_sha`, `service_key`, canonical
environment, status (`pending/in_progress/success/failure/cancelled`), `started_at`, optional
`completed_at`, canonical source URL. GitHub deployment-status adapter maps provider statuses
to these values while retaining safe source state; `inactive` ends current activity and
must not erase a previously successful attempt. A deployment event with success means the
provider reports deployment success, not that software is bug-free. Environment mapping to
production is an explicit versioned admin configuration. Missing or unresolved SHA produces
partial evidence excluded from verified production change sets.

Incident payload: external incident ID/revision, `service_key`, normalized severity,
`impact_started_at` nullable, `detected_at`, `recovered_at` nullable, state
(`open/mitigated/resolved`), canonical source URL. Keep clocks distinct: detection cannot
stand in for impact onset. Bad timestamp order is rejected; later corrections append.
Provider severity normalization is versioned; do not compare provider severity labels
without it. Text descriptions/person identities are excluded.

An optional `deployment_external_ids` list supplies asserted relationships, resolved within
the same connector/project. It creates verified links only when the provider explicitly
records that relationship and referenced deployment identity resolves; otherwise candidate.
Temporal proximity alone never establishes incident causation. Human attestation is labelled
and versioned. No production claim is emitted when there is only a tag, release, merge or CI
success. GitHub deployment collection uses its
[deployment API](https://docs.github.com/en/rest/deployments/deployments#list-deployments).

## Integration Acceptance

- Duplicate, conflicting and out-of-order deliveries preserve counts and immutable revisions.
- Crash after receipt commit replays once; signature mutation/Unicode mismatch fails validation.
- Revocation removes live collection/action ability without turning historical coverage complete.
- Seeded secrets in every dropped field are absent from DB, logs, DLQ, artifacts and safe errors.
- Default Codex fixtures mark unsupported counters unavailable; parent/child cost remains conserved.
- OTLP full/partial/error responses follow their protocol independently of REST job responses.
- An unresolved deployment SHA cannot contribute verified deployed-PR counts.
- A time-near incident remains a candidate and cannot increase verified change-failure rate.
- A success followed by inactive deployment status retains the successful attempt history.
- Instrumentation or pagination gaps appear in UI/export denominators and completeness metadata.
