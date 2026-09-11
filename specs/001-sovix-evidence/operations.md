# Operations Specification

## Runtime Profiles

| Concern | Local profile | Hosted profile |
|---|---|---|
| Binding and identity | Loopback only; random owner-readable bearer secret; one workspace | TLS; OIDC/BFF for users; scoped service principals |
| Data | SQLite plus local blob directory | PostgreSQL 17 with forced RLS plus private S3-compatible object store |
| Work execution | Same-process worker, one active worker, durable SQLite jobs | Separate API/worker processes using PostgreSQL leases and transactional outbox |
| Required dependencies | None for scan/import/report/export | Database, object store, OIDC, secret manager; GitHub/OTLP only when enabled |
| Scheduling | Runs while the process is active; missed slots are surfaced for manual generation | Continuously claimed scheduler with durable logical slots |
| Backup | User-directed copy/export after a consistent SQLite checkpoint | Seven rolling encrypted daily backups, verified restore drill |

Local mode must refuse non-loopback binds. It performs no hosted login and makes no network
request for offline scan, import, calculation or self-contained export. Local and hosted
profiles execute the same domain fixtures and calculation code; persistence conformance is a
release gate.

## Leased Jobs and Checkpoints

Hosted workers claim jobs in a transaction using `FOR UPDATE SKIP LOCKED`, set a monotonically
increasing 64-bit fence, and receive a 60-second lease. A running worker renews every 20
seconds. Each checkpoint, output row, blob publication and terminal transition compares the
job ID and fence; zero affected rows means the worker lost ownership and must stop. Local mode
applies the same fence rules without concurrent claims.

Collection checkpoints are committed after each source page with connector cursor, boundary,
last stable external identity and safe accepted/rejected counts. Import checkpoints record
archive member index and sanitized digest. Snapshot jobs pin all input revision and definition
versions before calculation, stage artifacts under a temporary opaque key, then atomically
publish the manifest. Export jobs recheck authorization before rendering and before promoting
the blob. Deletion checks its project fence between every purge batch and wins over all other
jobs. A retry resumes only from a committed checkpoint; unfinished work is recomputed and
deduplicated by natural/revision keys.

Retryable failures use full-jitter exponential delay: random duration from zero through
`min(5 seconds × 2^(attempt-1), 15 minutes)`. Source sync and ingestion processing allow eight
attempts, snapshots five, and exports three. Validation, authorization, unsupported schema,
digest conflict and quota failures are terminal. Deletion allows 20 automatic attempts; if
exhausted it remains fenced in `failed`, pages an operator and can resume under the same
DeletionRequest after repair. Policy action retry/reconciliation is governed separately and
never repeats an `unknown` host mutation before reconciliation.

Cancellation sets `cancel_requested`; workers stop at the next checkpoint. A result already
committed may transition to its completed state with the cancellation time recorded. Terminal
jobs never restart; user retry creates a new job linked to the predecessor, except a fenced
deletion request, which resumes the same lifecycle aggregate.

## Scheduling and Daylight Saving Time

A schedule stores IANA timezone, frequency, local time and a logical slot key. Daily and weekly
slots use `(schedule_id, local_date)`; monthly v1 runs only on local day 1 and uses the same
key. The database unique constraint creates exactly one ScheduleRun per logical slot. Workers
may retry its job but cannot create a second snapshot for that slot.

For a DST overlap, choose the earlier UTC instant for the repeated local time. For a DST gap,
advance to the first valid local instant after the gap. The ScheduleRun retains requested local
time, timezone, chosen UTC instant and adjustment reason. Disabling a schedule prevents new
slots; it does not cancel an already created job. Hosted scheduler downtime catches up only the
most recent missed slot per schedule and marks older missed slots visible; an analyst may
generate those windows manually. This prevents an unbounded recovery burst while preserving
the audit trail.

## Limits and Quotas

Limits are checked before durable acceptance where possible, shown in workspace settings and
returned with a stable code, current use, limit, reset time and retry path.

| Limit | Default hosted value | Enforcement |
|---|---:|---|
| Import artifact | 32 MiB decompressed, 8 archive levels, 250,000 members/records | Reject entire import before extraction/publication; delete staged bytes |
| OTLP/trace request | 8 MiB request body, 10,000 spans | Reject entire request with 413 before receipt; no partial batch acceptance |
| Accepted telemetry | 1,000,000 spans/workspace/UTC day | Atomic reservation; crossing batch rejected with 429 and UTC reset time |
| Active repositories | 50/workspace | Reject additional activation; existing collection continues |
| Concurrent running jobs | 10/workspace, including at most 2 exports | Additional jobs remain queued; no data rejection |
| Export artifact | 512 MiB compressed | Fail before publication with safe size counts; snapshot remains available |
| API request body | 2 MiB except declared import/OTLP endpoints | Reject with 413 |

The 100,000 source revisions in the initial benchmark is a capacity target, not a silent data
cap. Operators may raise tenant quotas after capacity review; every override is versioned and
audited. Rate limiting or quota rejection reduces collection completeness until a successful
retry. Neither state may be reported as complete or converted to zero observations.

## Health, SLOs and Alerts

Monthly hosted availability objective is 99.5%, excluding announced maintenance. Initial
recovery targets are RPO 24 hours and RTO four hours. Under the benchmark workspace of 50
repositories, 100,000 source revisions and one million accepted spans/day:

- cached project overview p95 is at most two seconds;
- evidence drill-down p95 is at most one second;
- accepted metadata is queryable p95 within 60 seconds;
- scheduler creates a due ScheduleRun within two minutes of effective UTC;
- 99% of non-rate-limited runnable jobs begin within five minutes;
- project deletion completes within 24 hours at initial scale.

Readiness fails when the database, required object store, migrations or tenant isolation probe
is unavailable. Liveness fails only when the process cannot make internal progress. Connector
health is healthy when its last successful run is within its configured cadence plus 10
minutes, delayed until twice the cadence, degraded beyond twice the cadence or after three
consecutive retryable failures, and revoked immediately on authorization loss.

Page the on-call operator for availability burn exceeding 2% over one hour, oldest runnable
job over 15 minutes, telemetry p95 lag over 120 seconds for 15 minutes, deletion deadline with
less than two hours remaining, restore/tombstone failure, cross-tenant denial-probe failure,
or any backup failure. Create a ticket, without paging, for storage above 75%, connector
degradation and daily error rate above 2%; page at 90% storage.

## Payload-free Observability

Metrics and traces may contain service, route template, deployment profile, region, operation,
job type, normalized connector/runtime, state, safe error code, duration, byte/record counts
and opaque nonreversible correlation IDs. Logs use structured events with timestamp, severity,
component, request/job correlation, workspace HMAC label, result and safe code. They must not
contain workspace/project names, repository URLs, external IDs, source text, prompts, code,
tool arguments/output, exception messages, credentials, email, contributor identity, raw
payloads, blob keys or user-supplied labels.

Cardinality budgets prohibit raw trace/span IDs and resource UUIDs as metric labels. Operator
dashboards show rates, lag, saturation and counts only. Rejected/dead-letter records contain
field paths, normalized reasons and counts; raw rejected content is discarded. A seeded-secret
probe runs in CI and staging and must find no match in logs, traces, artifacts or backups.

## Deployment, Backup and Restore

Build API, worker and web from one immutable revision with locked dependencies and signed OCI
artifacts. Run additive database migrations using the separate migration role before shifting
traffic. The application declares the minimum and maximum compatible schema versions and
refuses readiness outside that range. Deploy API/worker versions that read old and new shapes,
backfill through fenced jobs, then remove old reads only after the documented 90-day contract
window. Roll back application images only while their declared schema remains compatible;
schema rollback requires a tested forward repair migration.

Take one encrypted database backup and object inventory daily, retain seven rolling days and
record digest, completion and restore-test status. Quarterly, restore into an isolated account,
deny all user access, validate schema and object digests, load every live deletion tombstone
from the independently retained tombstone ledger, reapply purges/revocations, then run tenant
isolation and deletion probes. Only after those pass may the restored environment become
eligible for service. A drill is successful when measured data loss is within 24 hours, user
access resumes within four hours, and no governed deleted payload is reachable.

## Retention and Deletion

Defaults and configurable ranges are: normalized spans 30 days (7–90), source evidence and
snapshots 365 days (30–730), exports 30 days (1–90), audits 365 days (90–730), and safe job
errors 30 days (7–90). Purge jobs run hourly in batches of 1,000 records or 100 objects and
publish safe counts. Expired evidence makes dependent drill-down unavailable; retained
summary values disclose that their evidence expired.

Project deletion immediately records a durable fence, rejects new writes, cancels scoped
jobs, revokes downloads and snapshots, then purges source, telemetry, cost, metric, search and
object payloads. Multi-project snapshots containing deleted evidence are revoked in full.
Content-free tombstones retain project ID, fence, cutoff revision, completion and safe counts
until the oldest possible backup expires plus 24 hours. Tombstones are stored separately from
ordinary backup rotation and reapplied during every restore. Previously downloaded exports
cannot be erased remotely and the confirmation flow states that limit.

## Operational Acceptance

- Kill a worker after a page checkpoint; a successor resumes with a higher fence and produces
  no duplicate source revision, metric or export.
- Hold an expired worker open; all later checkpoint and publication writes fail their fence.
- Replay identical and conflicting deliveries; identical records deduplicate and conflicts
  quarantine using payload-free diagnostics without changing totals.
- Exercise DST gap, overlap, worker retry and scheduler restart; each logical slot has exactly
  one ScheduleRun and at most one published snapshot.
- Exceed every limit; the rejected request is atomic, use/reset details are visible and report
  completeness becomes partial where evidence is missing.
- Meet p95 response/ingestion targets at benchmark scale and validate alerts by fault injection.
- Complete backup restore inside RPO/RTO and prove deletion tombstones are applied before access.
- Search telemetry and restored artifacts for seeded content; no prohibited payload is present.
