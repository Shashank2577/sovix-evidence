# Acceptance Specification

**Status**: planned; implementation and test execution have not started  
**Scope**: `001-sovix-evidence`  
**Source of truth**: [spec.md](spec.md), [domain.md](domain.md), [metrics.md](metrics.md),
[security.md](security.md), [policy.md](policy.md), and [ux-spec.md](ux-spec.md)

## Execution Contract

The commands and paths below define the intended acceptance suite. They are not records of
tests already run. Unless a case says otherwise, the clock is fixed at
`2026-03-10T12:00:00Z`, UUIDs and random secrets come from seeded providers, network access is
disabled, and JSON comparisons use RFC 8785 canonicalization. Money is represented as
six-decimal decimal strings. Windows are UTC half-open intervals `[start,end)`.

Planned suite commands:

```bash
uv run pytest tests/contract tests/integration
pnpm test
pnpm exec playwright test tests/e2e
uv run pytest tests/acceptance
```

Every fixture is synthetic and lives under `fixtures/acceptance/<case-id>/`. A case directory
contains `input/`, `expected/`, and, when relevant, `mutations/`. `expected/manifest.json`
contains the pinned source revision IDs, schema and calculator versions, scope/window,
availability, exclusions, coverage, and canonical digest. HTTP fixtures include principal,
workspace and project IDs. Git fixtures are bare repositories with an adjacent clock and
expected object-ID file. OTLP fixtures contain only allowlisted metadata plus deliberately
forbidden canaries in negative inputs. Browser assertions consume the same expected manifest
as API and export assertions.

## AC-US1 — Historical baseline (FR-001–FR-006)

**Planned paths**: `tests/acceptance/test_us1_baseline.py`,
`tests/contract/test_legacy_imports.py`, `tests/e2e/cli-baseline.spec.ts`  
**Planned command**: `uv run pytest tests/acceptance/test_us1_baseline.py tests/contract/test_legacy_imports.py && pnpm exec playwright test tests/e2e/cli-baseline.spec.ts`

Fixture `AC-US1/input/repo.git` has commits at `00:00:00Z`, `11:59:59Z`, and exactly
`12:00:00Z`; window `[00:00:00Z,12:00:00Z)` includes the first two only. A supported
Receipts report and Sovix report each declare source version and digest; a second file has
the same logical source ID and digest, while a third has the same ID and edited content.

- **AC-US1.1 / FR-001 — offline bounded scan**: With DNS and HTTP blocked, `sovix scan
  fixtures/acceptance/AC-US1/input/repo.git --start 2026-03-10T00:00:00Z --end
  2026-03-10T12:00:00Z --output out/report` exits `0`. The manifest names the canonical
  repository, exact window, two eligible commits and an `ai.signature_commit_floor` badge;
  the end-boundary commit is excluded. Negative: an omitted or reversed window exits `2`
  with `INVALID_WINDOW`, creates no snapshot, and makes no network request.
- **AC-US1.2 / FR-002 — validated legacy import**: The supported inputs create source
  revisions whose stored digests equal their canonical payload digests. Reimporting the
  byte-identical file returns the existing revision and `deduplicated=true`; edited content
  creates a new revision. Negative: unsupported major version and digest mismatch return
  `UNSUPPORTED_SOURCE_VERSION` and `DIGEST_MISMATCH`, respectively, with zero metric rows.
- **AC-US1.3 / FR-003 — explicit completeness**: A three-page source whose second page is
  denied publishes a partial collection result naming page 2, `SOURCE_FORBIDDEN`, successful
  subsets, exclusions, requested boundaries and last watermark. Negative: a response missing
  pagination proof cannot be labelled complete even when all returned records are eligible.
- **AC-US1.4 / FR-004 — checkpoint and revision semantics**: A worker stopped after page 1
  resumes at page 2 from its durable checkpoint. Replayed page 1 adds zero records; changed
  source content creates a new immutable revision. Negative: an expired worker fence cannot
  write a checkpoint or publish a duplicate snapshot.
- **AC-US1.5 / FR-005 — read-only collection**: The local Git scan succeeds with the fixture
  directory and objects mounted read-only; pre/post object IDs, refs, index status and mtimes
  match. The connector preview lists requested GitHub permissions before enablement. Negative:
  any adapter attempt to create a ref, lock, issue or comment fails the test.
- **AC-US1.6 / FR-006 — atomic rejection**: A non-Git path, malformed report, traversal entry,
  and decompressed input over 32 MiB each return a stable safe code plus remediation. The
  transaction contains a rejection receipt but no SourceRevision, MetricResult or Snapshot.
  Error output contains no input bytes or absolute local path.

## AC-US2 — Evidence and presentation (FR-007–FR-012)

**Planned paths**: `tests/acceptance/test_us2_evidence.py`,
`tests/e2e/report-evidence.spec.ts`, `tests/contract/test_export_manifest.py`  
**Planned command**: `uv run pytest tests/acceptance/test_us2_evidence.py tests/contract/test_export_manifest.py && pnpm exec playwright test tests/e2e/report-evidence.spec.ts`

Fixture `AC-US2` contains 189 eligible merged PRs, 28 with formal review records, repository
subsets `A=18/90` and `B=10/99`, cycle-hour samples `[1,9]` and `[2,3,4]`, an absent
deployment source, one 0/0 cohort, and one summary-only legacy median.

- **AC-US2.1 / FR-007 — complete evidence contract**: Review coverage is numeric
  `14.814814...` and displayed `14.8%`; its result includes all common-contract fields,
  numerator 28, denominator 189, definition/version, evidence kind, availability, window,
  exclusions, three coverage dimensions, watermark, digests, references and limitations.
  Negative: schema validation rejects an otherwise valid result missing any required field.
- **AC-US2.2 / FR-008 — canonical verification**: Recomputing the pinned fixture produces
  the expected decimal value and canonical digest. Reordering object keys or evidence-reference
  sets leaves the digest unchanged; changing one eligible PR or calculator version changes it.
  Negative: a manifest/input hash mismatch makes verification fail without replacing the value.
- **AC-US2.3 / FR-009 — raw reaggregation**: The rollup recomputes `28/189`; it does not
  average repository percentages. The union cycle sample yields median `3`. Negative: a
  summary-only median requested at a new scope is `unavailable` with
  `INCOMPATIBLE_SUMMARY_SCOPE`, not an averaged or interpolated value.
- **AC-US2.4 / FR-010 — honest labels**: Signature metrics say “detectable metadata floor,”
  file rework and branch landing metrics say “proxy,” and absent deployments render null as
  unavailable. The 0/0 cohort says `Unavailable — no eligible records`. Negative: DOM, PDF/HTML
  text and manifest contain no “deployment,” “incident rate,” or exact authorship claim for a
  Git proxy.
- **AC-US2.5 / FR-011 — stable views and scope**: Leadership, investigation and coverage
  routes read the same snapshot value. Applying project/repository/window filters, opening a
  finding, then returning restores the URL, filters and invoking focus in at most three user
  interactions. Negative: a disallowed repository is absent from filter choices and direct URL
  access returns the scope-neutral not-found view.
- **AC-US2.6 / FR-012 — portable parity**: With networking disabled, exported HTML navigation,
  charts, accessible tables, evidence and verification manifest work. API, UI and export have
  identical values, null states and suppression markers. Negative: scanning the bundle finds
  no remote script, font, stylesheet, image URL, bearer token or forbidden evidence body.

## AC-US3 — Private workspace access (FR-013–FR-018)

**Planned paths**: `tests/integration/test_tenant_access.py`,
`tests/acceptance/test_us3_workspace.py`, `tests/e2e/workspace-roles.spec.ts`  
**Planned command**: `uv run pytest tests/integration/test_tenant_access.py tests/acceptance/test_us3_workspace.py && pnpm exec playwright test tests/e2e/workspace-roles.spec.ts`

Fixture `AC-US3` defines tenants `red` and `blue`, two projects per tenant, owner/admin/analyst/
viewer principals, a four-human cohort and a six-human cohort. Each resource kind has the same
predictable suffix in both tenants to expose missing namespace checks.

- **AC-US3.1 / FR-013 — workspace and session**: OIDC callback with valid state, nonce, PKCE,
  issuer and audience creates one owner membership and an HttpOnly Secure SameSite=Lax session.
  Sign-out invalidates it. Negative: replayed callback, bad audience or expired token creates
  neither session nor membership.
- **AC-US3.2 / FR-014 — role and project isolation**: The role matrix is exercised against
  record, search, job, cache, blob and export identifiers, including guessed cross-tenant IDs
  and background jobs. Every inaccessible resource returns the same 404 body and timing class.
  Negative: an analyst without a project grant and every cross-tenant principal retrieve zero
  bytes and learn no count, owner name or existence signal.
- **AC-US3.3 / FR-015 — connector scope and revocation**: Admin connects only repository `r1`,
  rotates its scoped credential, then revokes it. The next sync makes no source call and health
  becomes `revoked`; old snapshots remain immutable with revoked/freshness annotation. Negative:
  selecting an uninstalled repository or using the revoked credential cannot enqueue collection.
- **AC-US3.4 / FR-016 — aggregate output**: Standard report JSON, HTML, CSV and browser views
  contain aggregate people counts but no raw name, email, prompt, source body, tool arguments or
  tool output canaries. Negative: adding a forbidden field to an adapter object fails the output
  schema rather than silently exposing it.
- **AC-US3.5 / FR-017 — privacy suppression**: The four-human result is null with
  `suppressed/k_lt_5`; complementary slices that would reveal it are also null in UI, export and
  API. The six-human aggregate may display. Negative: URL parameters for arbitrary identity,
  one-person filters or leaderboards return `UNSUPPORTED_FILTER` and cannot reveal values via
  chart coordinates, tooltips, totals or downloads.
- **AC-US3.6 / FR-018 — content-free audit**: Successful and denied access-sensitive changes,
  connector rotation/revocation, policy changes and exports record actor, action, scope, time and
  result. Negative: audits contain no prompt, token, source description, credential, request body
  or report value canary.

## AC-US4 — Coding-agent telemetry (FR-019–FR-024)

**Planned paths**: `tests/contract/test_otlp_ingest.py`,
`tests/acceptance/test_us4_telemetry.py`, `tests/integration/test_collector_credentials.py`  
**Planned command**: `uv run pytest tests/contract/test_otlp_ingest.py tests/integration/test_collector_credentials.py tests/acceptance/test_us4_telemetry.py`

Fixture `AC-US4` has one completed Codex CLI session, canonical parent-owned input/output token
units, child-inclusive spans, duplicate and late spans, a conflicting duplicate, an unsupported
cache field, and forbidden canaries `PROMPT_CANARY`, `EMAIL_CANARY` and `SECRET_CANARY`.

- **AC-US4.1 / FR-019 — scoped collector**: Admin registration returns a once-visible,
  project-bound ingestion credential plus runtime, version and capability metadata. Rotation
  invalidates the old token; revocation stops acceptance. Negative: a valid token for project A
  cannot ingest a repository ID belonging to project B.
- **AC-US4.2 / FR-020 — allowlist at both boundaries**: Allowed identifiers, timestamps,
  normalized model/tool/error class and token categories persist. Prompt, email, secret, raw
  exception text, absolute CWD and unknown attributes do not appear in DB, quarantine, logs,
  audits, backups or exports. Negative: log capture across a rejected batch finds no canary.
- **AC-US4.3 / FR-021 — lineage identity**: Accepted records preserve sanitized session,
  trace, span, event-time, runtime/source version and revision identity sufficient to reproduce
  deduplication. Negative: a record missing required identity is partially rejected with a field
  path and reason code, not accepted under a generated identity.
- **AC-US4.4 / FR-022 — supported observations**: The session displays elapsed seconds,
  supported input/output tokens, tool count, normalized error count and instrumentation coverage;
  child-inclusive parent usage counts once. Negative: copy does not call elapsed time labor,
  token estimate billed spend, or instrumented sessions all AI activity.
- **AC-US4.5 / FR-023 — replay, conflict and lateness**: Identical replay has no numerical
  effect; a late authoritative completion creates a new projection while the prior snapshot is
  unchanged; conflicting same-identity content is quarantined safely. Negative: replaying a
  partially rejected whole batch does not duplicate its accepted subset.
- **AC-US4.6 / FR-024 — unsupported and outage states**: Missing cache semantics is
  `unsupported` and null; collector outage is a health interval with an observed-through
  watermark. Negative: neither becomes zero, complete coverage, or a healthy interval.

## AC-US5 — Linkage and cost allocation (FR-025–FR-030)

**Planned paths**: `tests/acceptance/test_us5_cost.py`,
`tests/property/test_allocation_conservation.py`, `tests/e2e/cost-evidence.spec.ts`  
**Planned command**: `uv run pytest tests/acceptance/test_us5_cost.py tests/property/test_allocation_conservation.py && pnpm exec playwright test tests/e2e/cost-evidence.spec.ts`

Fixture `AC-US5` defines canonical usage unit `u1=USD 10.000000`, verified PRs `p1` and `p2`,
weights `600000/400000`, candidate `p3`, unit `u2` with two verified PRs and no weights, unit
`u3` with unknown price, and a price correction. Parent/child and retry records point to `u1`.

- **AC-US5.1 / FR-025 — evidence-bearing links**: Each candidate or verified link records
  source-backed evidence, method version and immutable revision chain. The verified association
  is visible independently from money. Negative: changing status in place fails; superseding it
  requires a new link revision.
- **AC-US5.2 / FR-026 — adjudication**: Branch/time proximity creates candidate `p3`, excluded
  from verified totals. Analyst confirmation/rejection records actor, reason and new revision.
  Negative: missing reason, viewer adjudication, or source team label cannot verify a link.
- **AC-US5.3 / FR-027 — canonical cost ownership**: Parent, child and retry data resolve to one
  selected estimate of `10.000000`; billed/subscription allocations remain in separate ledgers.
  Negative: summing span rows directly would yield 20 and must fail the invariant assertion.
- **AC-US5.4 / FR-028 — exact conservation**: Allocation rows are `p1=6.000000`,
  `p2=4.000000`, `unallocated=0.000000`, and sum exactly to `10.000000`. Unit `u2` remains
  100% unallocated until explicit weights exist; a non-divisible rounding remainder goes to the
  unallocated row. Candidate `p3` receives zero. Negative: missing remainder, negative amount,
  duplicate target or weights not summing to 1,000,000 rejects the allocation atomically.
- **AC-US5.5 / FR-029 — disclosure**: Cost view and manifest show USD currency, equivalent-cost
  basis, price version, selected cohort/denominator, unpriced `u3` quantities, unmatched sessions
  and unallocated amount. Negative: the total is labelled partial while `u3` is unpriced and is
  never named invoice, subscription spend, ROI or accounting reconciliation.
- **AC-US5.6 / FR-030 — immutable corrections**: Correcting the link, rate card or weights
  creates new versions and a new snapshot/digest. The old snapshot still renders its original
  `6/4` split and version references. Negative: an update statement targeting old allocation or
  snapshot rows affects zero rows and raises an immutable-record domain error.

## AC-US6 — Recurring reporting workflow (FR-031–FR-036)

**Planned paths**: `tests/acceptance/test_us6_reporting.py`,
`tests/integration/test_schedule_slots.py`, `tests/e2e/report-inbox.spec.ts`  
**Planned command**: `uv run pytest tests/acceptance/test_us6_reporting.py tests/integration/test_schedule_slots.py && pnpm exec playwright test tests/e2e/report-inbox.spec.ts`

Fixture `AC-US6` uses `America/New_York`: daily local time `02:30` across the 2026 spring gap
and `01:30` across the 2026 fall overlap. The declared rule is “gap: run at the first valid
instant after the gap; overlap: run on the earlier offset.” Slot identity derives from schedule,
intended local date/time and chosen offset, not worker attempt.

- **AC-US6.1 / FR-031 — saved scoped definition**: An analyst with a project grant saves and
  generates a definition containing exact scope, view and window rule. The 202 response names one
  job and repeated idempotent submission returns it. Negative: a repository outside the grant or
  a changed body under the same idempotency key returns 404 or 409 and publishes nothing.
- **AC-US6.2 / FR-032 — deterministic DST slots**: Spring gap creates one slot at the first
  valid instant; fall overlap creates one slot at the earlier offset. Two workers and a retry
  still create one execution/snapshot per logical slot. Disabled schedules create none. Negative:
  no silent skip, double report, or server-default-timezone interpretation is permitted.
- **AC-US6.3 / FR-033 — pinned snapshot**: Published manifest pins source revisions, metric,
  allocation, definition and authorization/redaction policy versions plus window. Late evidence
  creates a new snapshot and digest. Negative: rendering never reads latest mutable data in place
  of pinned versions.
- **AC-US6.4 / FR-034 — investigation history**: Finding follow-up stores assignee, status,
  reason, due date, comments and source finding/snapshot. Resolve and reopen transitions retain
  ordered history and reopen reason. Negative: illegal transition or viewer mutation is rejected.
- **AC-US6.5 / FR-035 — inbox without implicit messaging**: A completed snapshot appears once
  in the in-product inbox. No email/webhook is attempted without a separately enabled destination
  configuration. Negative: an email-like label inside source data cannot become a destination.
- **AC-US6.6 / FR-036 — authorization at delivery**: Membership revoked during rendering or
  before download causes the gateway to return the scope-neutral not-found response and zero blob
  bytes, even while link expiry remains future. Negative: no raw public presigned URL bypasses
  current authorization; browser back/cache cannot redisplay revoked content.

## AC-US7 — Lifecycle and reliable operation (FR-037–FR-042)

**Planned paths**: `tests/acceptance/test_us7_lifecycle.py`,
`tests/integration/test_jobs_and_restore.py`, `tests/e2e/admin-operations.spec.ts`  
**Planned command**: `uv run pytest tests/acceptance/test_us7_lifecycle.py tests/integration/test_jobs_and_restore.py && pnpm exec playwright test tests/e2e/admin-operations.spec.ts`

Fixture `AC-US7` includes retention boundary values, a worker that loses its lease after page 1,
project deletion during snapshot assembly, a seven-day-old backup containing deleted payload,
and workspace quotas one unit below/at/above their limits.

- **AC-US7.1 / FR-037 — bounded retention**: Admin can choose only documented ranges and sees
  the computed next purge instant in the selected timezone and UTC. Boundary values succeed.
  Negative: below/above-range values and analyst changes fail without altering the active policy.
- **AC-US7.2 / FR-038 — fenced deletion**: Deletion immediately fences writes, cancels or
  resolves scoped jobs, removes governed rows/blobs/index entries, revokes dependent snapshots
  and exports, and leaves only content-free tombstones. Multi-project snapshots are revoked in
  full. Negative: an old worker or late event cannot recreate any payload after the fence.
- **AC-US7.3 / FR-039 — observable leased jobs**: Queue, running, retrying, succeeded, partial,
  failed and canceled fixtures expose attempts, progress and safe codes. Expired lease resumes
  from page 2; stale fence writes fail. Negative: partial is never shown as success and terminal
  rows cannot restart; retry creates a new linked job where required by the state machine.
- **AC-US7.4 / FR-040 — content-free operations**: Operator telemetry shows lag, freshness,
  queue age, failure rates and CPU/storage counts. Negative: exhaustive event/log attributes
  contain no report values, prompts, source text, token payloads, names or credentials.
- **AC-US7.5 / FR-041 — tombstone-aware restore**: Restore is inaccessible to users until
  tombstones newer than the backup are reapplied. After reapplication, deleted payload remains
  absent while unaffected projects recover; drill records measured RPO/RTO against 24h/4h
  objectives. Negative: starting the web/API read path before tombstone replay fails closed.
- **AC-US7.6 / FR-042 — predictable quotas**: The at-limit request follows the documented
  boundary; an over-limit ingest/export receives a stable limit code, current limit, reset/retry
  path and no half-written result. Negative: rejected or unknown-loss data cannot increase
  completeness or move a watermark beyond the last accepted event.

## AC-US8 — Production outcomes and comparisons (FR-043–FR-048)

**Planned paths**: `tests/acceptance/test_us8_outcomes.py`,
`tests/contract/test_delivery_incident_events.py`, `tests/e2e/outcome-evidence.spec.ts`  
**Planned command**: `uv run pytest tests/acceptance/test_us8_outcomes.py tests/contract/test_delivery_incident_events.py && pnpm exec playwright test tests/e2e/outcome-evidence.spec.ts`

Fixture `AC-US8` has four deployment attempts (successful, failed, canceled, in-progress), one
successful production deployment at exact SHA containing two PRs, a verified incident link, a
time-proximate candidate incident, mature and 20-day-old rework observations, and unequal cohorts.

- **AC-US8.1 / FR-043 — exact deployment identity**: Each attempt retains repository,
  environment, exact revision and state; only the successful production ID enters successful
  deployment measures, and its two PRs trace to Git source records. Negative: branch name without
  exact resolvable revision is rejected for verified production linkage.
- **AC-US8.2 / FR-044 — incident chronology and link status**: Impact start, detection and
  recovery remain distinct timestamps. The source-backed association is verified; time proximity
  creates a candidate. Negative: reordered or missing required timestamps returns a stable
  validation/availability result and never fabricates recovery duration.
- **AC-US8.3 / FR-045 — actual-source metrics**: Change-failure share counts only the verified
  incident link and reports unknown linkage coverage. With deployment source removed, production
  metrics are unavailable. Negative: branch landings or remediation markers never fill the
  production metric slot or denominator.
- **AC-US8.4 / FR-046 — mature, disclosed cohorts**: A 21-day rework comparison excludes the
  20-day observation and counts it as immature. Both cohorts show window, task mix, sample size,
  exclusions, maturity and source coverage. Negative: hidden immature inclusion fails the
  expected numerator/denominator and manifest comparison.
- **AC-US8.5 / FR-047 — non-causal language**: Comparison output states observed association
  and visible instrumentation/task-mix changes. Negative: UI, narrative and export scans contain
  no generated causal uplift, productivity attribution or ROI claim.
- **AC-US8.6 / FR-048 — authorized outcome chain**: From metric to deployment to change/PR and
  incident takes authorized links preserving exact source revisions. Negative: revoking incident
  access removes its details and may change current drill-down availability without mutating the
  earlier snapshot calculation or leaking the record's existence.

## AC-US9 — Shadow policy and guarded actions (FR-049–FR-054)

**Planned paths**: `tests/acceptance/test_us9_policy.py`,
`tests/integration/test_exact_head_actions.py`, `tests/property/test_policy_rules.py`  
**Planned command**: `uv run pytest tests/acceptance/test_us9_policy.py tests/integration/test_exact_head_actions.py tests/property/test_policy_rules.py`

Fixture `AC-US9` contains exact heads `H1` then `H2`, trusted and spoofed checks, missing/skipped
checks, incomplete reviews, stale evidence, revoked permission, 99/100 distinct evaluations,
13/14-day windows, one unresolved false pass, provider timeout-after-success, and kill-switch epochs.

- **AC-US9.1 / FR-049 — bounded immutable evaluation**: A valid flat policy produces per-rule
  and aggregate pass/fail/unknown tied to H1, evidence, expiry and immutable version/digest.
  Negative: script, SQL, regex, prompt, URL, extra key, nested logic, empty check list or Sovix's
  own check is rejected before evaluation.
- **AC-US9.2 / FR-050 — shadow has no mutation**: New policy is draft/shadow; 100 distinct
  heads across 14 consecutive days can qualify while evaluation produces zero GitHub write calls.
  Negative: 99 heads, 13 days, duplicate heads, or unresolved false pass remains shadow.
- **AC-US9.3 / FR-051 — explicit narrow activation**: Owner/admin activation with current ETag,
  completed qualification, repository/base/rule version and action allowlist plus human
  confirmation succeeds only for that scope. Negative: missing If-Match is 428, stale is 412,
  analyst/viewer is 403, wildcard future repositories and unqualified scope are rejected.
- **AC-US9.4 / FR-052 — immediate live revalidation**: Before outbound action the worker reloads
  epoch, policy, approval, membership, installation permissions, H1, checks, reviews, blockers and
  evidence age ≤30 seconds. Merge request includes `sha=H1`. Negative: H2 arriving before dispatch
  yields `head_changed`; H2 arriving between validation and merge yields provider SHA refusal.
- **AC-US9.5 / FR-053 — unknown/stale fail closed**: Missing, pending, skipped, untrusted or
  ambiguous check; incomplete reviews; stale evidence; revoked collector; unsupported action; or
  host protection produces unknown/refusal and no merge. Negative: no empty population, failed
  collector or time-proximate evidence can become pass, and host protection is never bypassed.
- **AC-US9.6 / FR-054 — idempotency, disable and reconciliation**: Duplicate action identity
  returns one action; changed idempotency body is 409. Timeout after provider success becomes
  unknown then reconciles by provider ID/external ID without a duplicate write. Disable cancels
  queued work and increments epoch; a lost-lease worker cannot set terminal state. Negative:
  unknown action cannot retry before reconciliation and already-started outcomes remain visible.

## AC-US10 — Isolated public discovery (FR-055–FR-060)

**Planned paths**: `tests/acceptance/test_us10_discovery.py`,
`tests/integration/test_public_private_isolation.py`, `tests/e2e/radar.spec.ts`  
**Planned command**: `uv run pytest tests/acceptance/test_us10_discovery.py tests/integration/test_public_private_isolation.py && pnpm exec playwright test tests/e2e/radar.spec.ts`

Fixture `AC-US10` contains two public repositories, an archived repository, one repository that
becomes private, reconstructed star samples, optional generated text and private canaries sharing
similar owner/repository slugs.

- **AC-US10.1 / FR-055 — physical and credential isolation**: Public collector, storage,
  indexes and app credentials can read only public fixtures and have no route/role to private
  workspace stores. Negative: private IDs/canaries do not appear in public search, logs, cache,
  profile HTML or exports, including deliberate slug collisions.
- **AC-US10.2 / FR-056 — provenance by field**: Observed source facts, scraped ranking,
  reconstructed star history and generated narrative each show distinct type, source and
  freshness. Negative: generated text cannot overwrite a fact or lose its generated label.
- **AC-US10.3 / FR-057 — anonymous discovery**: Search/filter works without a workspace account;
  add/remove watchlist persists in browser-local storage only. Negative: watchlist changes make
  no server identity or private-workspace request and are isolated between browser profiles.
- **AC-US10.4 / FR-058 — confirmed external request**: Repository request previews exact
  externally posted issue/message, destination and effect, then requires explicit confirmation.
  Negative: cancel makes zero outbound calls; private report content and source text are never
  attached automatically.
- **AC-US10.5 / FR-059 — attention, not certification**: Rankings label stars/popularity as
  attention signals and state that public populations do not represent private teams. Negative:
  copy and structured metadata contain no quality, security certification or private benchmark
  assertion derived from popularity.
- **AC-US10.6 / FR-060 — lifecycle changes**: Archived profile is labelled archived; removed or
  newly private profile becomes unavailable and stops refreshing at the first denied refresh.
  Negative: cached source data is not presented as current and future collection is not retried
  with private credentials.

## Non-functional acceptance

### AC-NFR001 — Interactive latency

**Path/command**: `tests/performance/test_report_latency.py`; planned
`uv run pytest tests/performance/test_report_latency.py --benchmark-json out/nfr001.json`. On the
versioned benchmark dataset and declared hardware profile, at least 95% of 1,000 cached overview
requests complete within 2,000 ms and evidence requests within 1,000 ms. Fixture output records
raw samples, p95 method, build and hardware. Negative: warm-up samples, errors and cache misses
cannot be dropped silently; a missed threshold fails the case.

### AC-NFR002 — Initial capacity envelope

**Path/command**: `tests/performance/test_workspace_capacity.py`; planned
`uv run pytest tests/performance/test_workspace_capacity.py --scale initial`. Fixture contains 50
repositories, 100,000 source revisions and 1,000,000 accepted spans in one workspace/day. All
integrity and queryability checks pass within declared resource ceilings. Negative: 51 repos or a
larger load returns `CAPACITY_REVIEW_REQUIRED` unless a measured profile explicitly approves it;
no silent truncation is accepted.

### AC-NFR003 — Telemetry freshness

**Path/command**: `tests/performance/test_ingest_freshness.py`; planned
`uv run pytest tests/performance/test_ingest_freshness.py --samples 1000`. Under AC-NFR002 load,
95% of valid accepted events are queryable within 60 seconds of acceptance. Output shows p95,
watermark, accepted/rejected/lost counts. Negative: rejected or missing events cannot advance the
watermark or be hidden from the loss/rejection presentation.

### AC-NFR004 — Availability and recovery objectives

**Path/command**: `tests/operations/test_slo_and_restore.py`; planned
`uv run pytest tests/operations/test_slo_and_restore.py`. A synthetic month classifies announced
maintenance separately and calculates ≥99.5% hosted availability; restore drill measures backup
age ≤24h and service recovery ≤4h. Negative: excluded unannounced downtime, an older recovery
point, or pre-tombstone access fails. This verifies calculation/drill evidence, not achieved
production history.

### AC-NFR005 — Accessibility

**Path/command**: `tests/e2e/accessibility.spec.ts`; planned
`pnpm exec playwright test tests/e2e/accessibility.spec.ts`. Keyboard-only journeys cover every
role/report state; axe checks the applicable WCAG 2.2 AA rules, visible focus, names, headings,
non-color status, chart tables and reduced motion. Negative fixtures remove one accessible name,
color-independent cue and focus return in turn; each mutation must be detected.

### AC-NFR006 — 360px responsive layout

**Path/command**: `tests/e2e/responsive.spec.ts`; planned
`pnpm exec playwright test tests/e2e/responsive.spec.ts --project=mobile-360`. All US1–US10
read journeys complete at 360×800 with `document.scrollWidth <= document.clientWidth`; wide tables
use labelled focusable inner scroll regions and stacked alternatives. Negative: injected 500px
uncontained content must trip overflow assertion.

### AC-NFR007 — Tenant non-disclosure

**Path/command**: `tests/security/test_tenant_non_disclosure.py`; planned
`uv run pytest tests/security/test_tenant_non_disclosure.py`. Substitute tenant/project/resource
IDs for every API, job, search, cache, blob and download path. Responses match the canonical 404
body and reveal zero bytes/counts/storage keys. Negative: a deliberately unscoped repository
implementation in the mutation harness must be caught by domain and RLS probes.

### AC-NFR008 — Deterministic offline report

**Path/command**: `tests/contract/test_report_determinism.py`; planned
`uv run pytest tests/contract/test_report_determinism.py`. Two clean builds from identical pinned
inputs and clock have byte-identical canonical content/manifests and work under blocked network.
Operational `created_at` may differ only in its excluded manifest field. Negative: source/version
change changes the digest; any remote URL/resource or nondeterministic ordering fails.

### AC-NFR009 — Time semantics

**Path/command**: `tests/property/test_time_windows.py`; planned
`uv run pytest tests/property/test_time_windows.py`. Generated instants around UTC boundaries,
DST gaps/overlaps and non-hour offsets prove storage in UTC, visible timezone labels and exactly
once membership in adjacent `[start,end)` windows. Negative: an event at `end` in the earlier
window or a timestamp without display timezone fails.

### AC-NFR010 — Secret/content exclusion

**Path/command**: `tests/security/test_sensitive_canaries.py`; planned
`uv run pytest tests/security/test_sensitive_canaries.py`. Unique canaries seeded in prompts,
exception messages, tool I/O, names, email, CWD, credentials and unknown fields are absent from
accepted storage, logs, dead letters, backup, audit and standard exports. Negative: each sink is
mutated once to retain a canary and the suite must identify the exact sink.

### AC-NFR011 — Contract compatibility

**Path/command**: `tests/contract/test_version_compatibility.py`; planned
`uv run pytest tests/contract/test_version_compatibility.py`. OpenAPI/JSON Schema fixtures accept
supported current and prior minor forms, reject unsupported majors with stable remediation, and
record migration plus a deprecation window of at least 90 days for breaking changes. Negative: a
breaking schema diff without migration, fixture and valid date interval fails.

### AC-NFR012 — Model-independent analytics

**Path/command**: `tests/acceptance/test_no_model_dependency.py`; planned
`uv run pytest tests/acceptance/test_no_model_dependency.py`. With all model endpoints replaced by
failing spies, every canonical metric and report value is produced and matches expected hashes.
Optional narrative may be unavailable without affecting values. Negative: a narrative attempt to
alter a metric, evidence kind, availability or suppression state fails schema/digest comparison.

## Success-criterion acceptance

### AC-SC001 — Five-minute offline first report

**Path/command**: `tests/e2e/offline-first-report.spec.ts`; planned timed run
`pnpm exec playwright test tests/e2e/offline-first-report.spec.ts`. From an installed CLI and the
reference repository, a new-user script completes scan and opens the report in ≤300 seconds with
network blocked, no account and no telemetry. Output captures monotonic start/end and artifact
digest. Negative: any credential prompt, network dependency or duration over 300 seconds fails.

### AC-SC002 — Reproducible arithmetic and versioning

**Path/command**: `tests/golden/test_reference_metrics.py`; planned
`uv run pytest tests/golden/test_reference_metrics.py`. Every reference metric equals its expected
decimal/null state and hash; key/reference reordering preserves hashes, while one source or
definition change creates a new result/version hash. Negative: changed input with unchanged digest
or unchanged normalized input with drifted value fails.

### AC-SC003 — Boundary denial

**Path/command**: `tests/security/test_all_resource_boundaries.py`; planned
`uv run pytest tests/security/test_all_resource_boundaries.py`. The generated principal × tenant ×
project × resource-kind matrix denies all cross-boundary probes with the same non-disclosing
response, including jobs and exports. Negative: the suite includes one seeded missing-scope query
and must fail until it is removed.

### AC-SC004 — Duplicate-safe cost conservation

**Path/command**: `tests/property/test_allocation_conservation.py`; planned
`uv run pytest tests/property/test_allocation_conservation.py --hypothesis-seed=20260911`. For
generated duplicate/retry/parent-child and many-to-many fixtures, each canonical cost unit equals
the exact sum of PR allocations plus unallocated remainder. Negative weights, duplicated owners,
unknown price and rounding edge cases never create or destroy money.

### AC-SC005 — Three-interaction evidence path

**Path/command**: `tests/e2e/evidence-navigation.spec.ts`; planned
`pnpm exec playwright test tests/e2e/evidence-navigation.spec.ts`. From the reference overview,
a keyboard and pointer user can reach finding → arithmetic → source evidence in ≤3 activation
events while retaining scope. Negative: hidden menus, lost filters, inaccessible source or a
fourth required activation fails.

### AC-SC006 — Cross-surface state parity

**Path/command**: `tests/acceptance/test_availability_parity.py`; planned
`uv run pytest tests/acceptance/test_availability_parity.py`. Available, known-zero, partial,
unavailable, unsupported and suppressed fixtures have identical semantic state/reason/value across
API, console, HTML and manifest. Negative: suppressed chart coordinates, complementary totals,
download cells or zero substitution fail.

### AC-SC007 — One report per schedule slot

**Path/command**: `tests/integration/test_schedule_slots.py`; planned
`uv run pytest tests/integration/test_schedule_slots.py`. Worker retries plus spring-gap and
fall-overlap fixtures create exactly one execution and one snapshot per declared logical slot.
Negative: attempt-derived identities, server-local timezone, duplicated overlap or skipped gap
behavior fail expected slot IDs.

### AC-SC008 — Deletion survives restore

**Path/command**: `tests/operations/test_deletion_restore.py`; planned
`uv run pytest tests/operations/test_deletion_restore.py`. After completed deletion and restore
from a pre-deletion backup, governed payload is absent from records, blobs, indexes, jobs,
snapshots and exports before access opens; tombstone remains content-free. Negative: any readable
canary or early service access fails the drill.

### AC-SC009 — Policy refusal safety set

**Path/command**: `tests/integration/test_policy_refusals.py`; planned
`uv run pytest tests/integration/test_policy_refusals.py`. Stale H1 after H2, revoked membership or
host permission, missing/stale/unknown mandatory evidence, kill-switch epoch change and host
protection refusal each produce zero merge calls or an expected-SHA provider refusal. Negative:
any authorized merge result in this fixture set fails immediately.

### AC-SC010 — Pilot decision outcome

**Path/command**: `tests/pilot/validate_outcomes.py`; planned after pilot use
`uv run python tests/pilot/validate_outcomes.py --input out/pilot/outcomes.json`. The input schema
contains exactly three consenting team pseudonyms, pilot dates, report snapshot references, and
for each claimed outcome a concrete decision category (`review_process` or `tool_spend`), decision
description, evidence viewed, decision date and participant confirmation. Pass requires at least
two distinct teams with one confirmed, report-informed concrete decision; duplicate teams or
multiple decisions from one team count once. Negative: intent, satisfaction, dashboard viewing,
unconfirmed notes, hypothetical decisions or missing snapshot linkage do not qualify. This case
is measured only after real pilot use and is not an automated implementation gate or a claim of
customer demand.
