# Implementation Tasks: Sovix Evidence

All tasks are planned and unchecked. This repository contains specifications and validation tooling; completion of those documents does not complete these application tasks.

Source of truth for machine-readable dependencies and requirement mapping: [traceability.json](traceability.json). Task generation: `python3 scripts/build_backlog.py`. Every task includes a concrete output path; these are future application paths unless already present.

## Delivery strategy

Deliver M0 foundations, then the M1 local scanner/import/evidence report MVP (US1+US2). M2 adds hosted identity and telemetry/cost association; M3 adds recurring workflows and operations; M4 adds production outcomes and guarded policy; M5 is optional public discovery. Do not delay the local MVP for public discovery or host actions.

Story tests use synthetic adapters for independent verification. Real cross-story integration must satisfy the dependencies below. A task marked [P] is eligible for parallel execution only after its listed dependencies pass and only with disjoint files. Sequential tasks within each story intentionally avoid same-module edit races.

Tests cover domain invariants, not implementation mirrors. Write the specified failing acceptance tests before corresponding business logic, then record passing results at the story checkpoint. Do not mark a task done based on document presence alone.

## M0

- [ ] T001 Create workspace manifests with pinned runtime targets and dependency lockfiles in `package.json`. Requirements: NFR-011. Depends on: none.
- [ ] T002 Create Python package, module boundaries and migration entrypoint in `services/platform/pyproject.toml`. Requirements: NFR-011. Depends on: T001.
- [ ] T003 [P] Create TypeScript scanner and console workspace configurations in `pnpm-workspace.yaml`. Requirements: NFR-006. Depends on: T001.
- [ ] T004 Implement validated local/hosted configuration with loopback secret and no automatic egress in `services/platform/src/sovix/config.py`. Requirements: FR-005, NFR-010. Depends on: T002.
- [ ] T005 [P] Implement shared value objects, UTC half-open windows and decimal serialization in `services/platform/src/sovix/domain/values.py`. Requirements: NFR-009, FR-007. Depends on: T002.
- [ ] T006 Implement SQLite and PostgreSQL unit-of-work adapters and scoped foreign keys in `services/platform/src/sovix/persistence/uow.py`. Requirements: FR-013, NFR-007. Depends on: T002, T005.
- [ ] T007 Implement authenticated request context, typed Problem responses, idempotency receipts and ETags in `services/platform/src/sovix/api/middleware.py`. Requirements: FR-004, FR-013, NFR-011. Depends on: T004, T006.
- [ ] T008 Implement transactional outbox, leased jobs, heartbeat and fencing primitives in `services/platform/src/sovix/workers/jobs.py`. Requirements: FR-004, FR-039. Depends on: T006.
- [ ] T009 [P] Generate API clients and shared schemas; add contract drift checks against committed OpenAPI in `packages/contracts/package.json`. Requirements: NFR-011. Depends on: T001.
- [ ] T010 Create synthetic fixtures, deterministic clock, isolated database harness and forbidden-network harness in `tests/conftest.py`. Requirements: SC-002, NFR-008. Depends on: T005, T006.
- [ ] T011 Implement metadata allowlist and structured content-free error logging in `services/platform/src/sovix/domain/privacy.py`. Requirements: FR-016, NFR-010. Depends on: T005.
- [ ] T012 Create accessible shared tokens, form primitives and data table keyboard behavior in `packages/ui/src/index.ts`. Requirements: NFR-005, NFR-006. Depends on: T003.
## US1 — Historical baseline (P1, M1)

Independent test: execute AC-US1 in [acceptance.md](acceptance.md) with frozen fixture adapters; end-to-end integration additionally requires the recorded prior story checkpoints.

- [ ] T013 [US1] Write failing contract and adversarial acceptance fixtures for US1; cover all six requirements in `tests/integration/test_us1.py`. Requirements: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006. Depends on: T007, T008, T009, T010, T011, T012.
- [ ] T014 [US1] Implement read-only local Git scan with commit/line/signature-floor aggregates and JSON output in `packages/scanner/src/scan.ts`. Requirements: FR-001. Depends on: T013.
- [ ] T015 [US1] Implement explicit Sovix and Receipts version adapters, preserving original namespaced metrics and coverage in `services/platform/src/sovix/adapters/legacy.py`. Requirements: FR-002. Depends on: T014.
- [ ] T016 [US1] Implement source capability registry and pagination/window completeness watermarks in `services/platform/src/sovix/domain/coverage.py`. Requirements: FR-003. Depends on: T015.
- [ ] T017 [US1] Implement source natural-key dedupe, conflicting-payload quarantine and resumable collection checkpoints in `services/platform/src/sovix/adapters/receipts/collection.py`. Requirements: FR-004. Depends on: T016.
- [ ] T018 [US1] Enforce offline mode, read-only Git operations and opt-in connector egress at adapter boundary in `packages/scanner/src/privacy.ts`. Requirements: FR-005. Depends on: T017.
- [ ] T019 [US1] Implement import validation diagnostics, bad-record counts and retryable versus permanent failure reasons in `services/platform/src/sovix/adapters/import_validation.py`. Requirements: FR-006. Depends on: T018.
- [ ] T020 [US1] Implement every US1 REST operation in contracts/operations.md with typed errors and authorization in `services/platform/src/sovix/api/imports.py`. Requirements: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006. Depends on: T019.
- [ ] T021 [US1] Implement historical baseline UI including loading, empty, partial, error and permission states in `apps/console/app/import/page.tsx`. Requirements: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006. Depends on: T020.
- [ ] T022 [US1] Run US1 independent fixture journey, reject adversarial cases, and record results in `tests/e2e/us1.spec.ts`. Requirements: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006. Depends on: T021.
## US2 — Evidence and reports (P1, M1)

Independent test: execute AC-US2 in [acceptance.md](acceptance.md) with frozen fixture adapters; end-to-end integration additionally requires the recorded prior story checkpoints.

- [ ] T023 [US2] Write failing contract and adversarial acceptance fixtures for US2; cover all six requirements in `tests/integration/test_us2.py`. Requirements: FR-007, FR-008, FR-009, FR-010, FR-011, FR-012. Depends on: T007, T008, T009, T010, T011, T012, T022.
- [ ] T024 [US2] Implement canonical MetricResult contract with formula, scope, coverage, lineage, versions and nullability in `services/platform/src/sovix/analytics/result.py`. Requirements: FR-007. Depends on: T023.
- [ ] T025 [US2] Implement evidence lookup and independent arithmetic/hash verification without model calls in `services/platform/src/sovix/analytics/verify.py`. Requirements: FR-008. Depends on: T024.
- [ ] T026 [US2] Implement versioned 27-metric registry and recompute cohort aggregates from eligible raw observations in `services/platform/src/sovix/analytics/calculators.py`. Requirements: FR-009. Depends on: T025.
- [ ] T027 [US2] Implement availability and measured/proxy/inferred labels, missing denominators and mature-window exclusions in `services/platform/src/sovix/analytics/availability.py`. Requirements: FR-010. Depends on: T026.
- [ ] T028 [US2] Implement leadership, investigation and coverage view models with evidence drilldown in `services/platform/src/sovix/reporting/views.py`. Requirements: FR-011. Depends on: T027.
- [ ] T029 [US2] Implement deterministic escaped HTML/JSON/CSV/Markdown exporters and content-hash manifests in `services/platform/src/sovix/reporting/export.py`. Requirements: FR-012. Depends on: T028.
- [ ] T030 [US2] Implement every US2 REST operation in contracts/operations.md with typed errors and authorization in `services/platform/src/sovix/api/snapshots.py`. Requirements: FR-007, FR-008, FR-009, FR-010, FR-011, FR-012. Depends on: T029.
- [ ] T031 [US2] Implement evidence and reports UI including loading, empty, partial, error and permission states in `apps/console/app/reports/[snapshotId]/page.tsx`. Requirements: FR-007, FR-008, FR-009, FR-010, FR-011, FR-012. Depends on: T030.
- [ ] T032 [US2] Run US2 independent fixture journey, reject adversarial cases, and record results in `tests/e2e/us2.spec.ts`. Requirements: FR-007, FR-008, FR-009, FR-010, FR-011, FR-012. Depends on: T031.
## US3 — Private hosted workspaces (P1, M2)

Independent test: execute AC-US3 in [acceptance.md](acceptance.md) with frozen fixture adapters; end-to-end integration additionally requires the recorded prior story checkpoints.

- [ ] T033 [US3] Write failing contract and adversarial acceptance fixtures for US3; cover all six requirements in `tests/integration/test_us3.py`. Requirements: FR-013, FR-014, FR-015, FR-016, FR-017, FR-018. Depends on: T007, T008, T009, T010, T011, T012.
- [ ] T034 [US3] Implement OIDC principal mapping, workspace membership and owner transfer invariant in `services/platform/src/sovix/domain/identity.py`. Requirements: FR-013. Depends on: T033.
- [ ] T035 [US3] Implement per-project role policy and forced RLS for API, workers and export queries in `services/platform/src/sovix/persistence/authorization.py`. Requirements: FR-014. Depends on: T034.
- [ ] T036 [US3] Implement GitHub App installation validation, raw HMAC webhook receipt, secret references and revocation in `services/platform/src/sovix/adapters/github/installation.py`. Requirements: FR-015. Depends on: T035.
- [ ] T037 [US3] Enforce aggregate-first ingestion and strip prompts, emails, arguments and exception text before persistence in `services/platform/src/sovix/adapters/redaction.py`. Requirements: FR-016. Depends on: T036.
- [ ] T038 [US3] Implement hosted k>=5 cohort suppression with complementary suppression and filter restrictions in `services/platform/src/sovix/analytics/suppression.py`. Requirements: FR-017. Depends on: T037.
- [ ] T039 [US3] Implement content-free append-only audit events for identity, access, source and action changes in `services/platform/src/sovix/domain/audit.py`. Requirements: FR-018. Depends on: T038.
- [ ] T040 [US3] Implement every US3 REST operation in contracts/operations.md with typed errors and authorization in `services/platform/src/sovix/api/workspaces.py`. Requirements: FR-013, FR-014, FR-015, FR-016, FR-017, FR-018. Depends on: T039.
- [ ] T041 [US3] Implement private hosted workspaces UI including loading, empty, partial, error and permission states in `apps/console/app/settings/workspace/page.tsx`. Requirements: FR-013, FR-014, FR-015, FR-016, FR-017, FR-018. Depends on: T040.
- [ ] T042 [US3] Run US3 independent fixture journey, reject adversarial cases, and record results in `tests/e2e/us3.spec.ts`. Requirements: FR-013, FR-014, FR-015, FR-016, FR-017, FR-018. Depends on: T041.
## US4 — Agent telemetry (P2, M2)

Independent test: execute AC-US4 in [acceptance.md](acceptance.md) with frozen fixture adapters; end-to-end integration additionally requires the recorded prior story checkpoints.

- [ ] T043 [US4] Write failing contract and adversarial acceptance fixtures for US4; cover all six requirements in `tests/integration/test_us4.py`. Requirements: FR-019, FR-020, FR-021, FR-022, FR-023, FR-024. Depends on: T007, T008, T009, T010, T011, T012, T042.
- [ ] T044 [US4] Implement scoped collector credentials and runtime capability certification registry in `services/platform/src/sovix/domain/collectors.py`. Requirements: FR-019. Depends on: T043.
- [ ] T045 [US4] Implement Dash0/Codex OTLP normalization with strict allowlist and native response encoding in `services/platform/src/sovix/adapters/otlp/receiver.py`. Requirements: FR-020. Depends on: T044.
- [ ] T046 [US4] Implement source/session/span identities with credential-bound workspace/project context in `services/platform/src/sovix/domain/sessions.py`. Requirements: FR-021. Depends on: T045.
- [ ] T047 [US4] Implement usage owner normalization, session duration and tool-status projections in `services/platform/src/sovix/analytics/telemetry.py`. Requirements: FR-022. Depends on: T046.
- [ ] T048 [US4] Implement duplicate and late-span handling with parent/subagent accounting and conflict quarantine in `services/platform/src/sovix/adapters/otlp/deduplication.py`. Requirements: FR-023. Depends on: T047.
- [ ] T049 [US4] Implement unsupported runtime counters, ingestion lag and collector capability health in `services/platform/src/sovix/adapters/otlp/health.py`. Requirements: FR-024. Depends on: T048.
- [ ] T050 [US4] Implement every US4 REST operation in contracts/operations.md with typed errors and authorization in `services/platform/src/sovix/api/collectors.py`. Requirements: FR-019, FR-020, FR-021, FR-022, FR-023, FR-024. Depends on: T049.
- [ ] T051 [US4] Implement agent telemetry UI including loading, empty, partial, error and permission states in `apps/console/app/sessions/page.tsx`. Requirements: FR-019, FR-020, FR-021, FR-022, FR-023, FR-024. Depends on: T050.
- [ ] T052 [US4] Run US4 independent fixture journey, reject adversarial cases, and record results in `tests/e2e/us4.spec.ts`. Requirements: FR-019, FR-020, FR-021, FR-022, FR-023, FR-024. Depends on: T051.
## US5 — Attribution and costs (P2, M2)

Independent test: execute AC-US5 in [acceptance.md](acceptance.md) with frozen fixture adapters; end-to-end integration additionally requires the recorded prior story checkpoints.

- [ ] T053 [US5] Write failing contract and adversarial acceptance fixtures for US5; cover all six requirements in `tests/integration/test_us5.py`. Requirements: FR-025, FR-026, FR-027, FR-028, FR-029, FR-030. Depends on: T007, T008, T009, T010, T011, T012, T032, T052.
- [ ] T054 [US5] Implement evidence-based candidate/verified association rules with exact repository and revision identities in `services/platform/src/sovix/domain/linking.py`. Requirements: FR-025. Depends on: T053.
- [ ] T055 [US5] Implement append-only analyst link adjudication with reason, evidence and optimistic concurrency in `services/platform/src/sovix/domain/adjudication.py`. Requirements: FR-026. Depends on: T054.
- [ ] T056 [US5] Implement canonical usage cost estimation and separate billing/subscription allocation ledgers in `services/platform/src/sovix/analytics/costs.py`. Requirements: FR-027. Depends on: T055.
- [ ] T057 [US5] Implement integer-ppm allocation conservation, decimal rounding and explicit unallocated remainder in `services/platform/src/sovix/analytics/allocation.py`. Requirements: FR-028. Depends on: T056.
- [ ] T058 [US5] Implement immutable effective-dated rate catalogs and unknown-model/unpriced usage coverage in `services/platform/src/sovix/domain/prices.py`. Requirements: FR-029. Depends on: T057.
- [ ] T059 [US5] Implement pinned cost/link/allocation revisions and snapshot-safe correction workflows in `services/platform/src/sovix/domain/corrections.py`. Requirements: FR-030. Depends on: T058.
- [ ] T060 [US5] Implement every US5 REST operation in contracts/operations.md with typed errors and authorization in `services/platform/src/sovix/api/costs.py`. Requirements: FR-025, FR-026, FR-027, FR-028, FR-029, FR-030. Depends on: T059.
- [ ] T061 [US5] Implement attribution and costs UI including loading, empty, partial, error and permission states in `apps/console/app/costs/page.tsx`. Requirements: FR-025, FR-026, FR-027, FR-028, FR-029, FR-030. Depends on: T060.
- [ ] T062 [US5] Run US5 independent fixture journey, reject adversarial cases, and record results in `tests/e2e/us5.spec.ts`. Requirements: FR-025, FR-026, FR-027, FR-028, FR-029, FR-030. Depends on: T061.
## US6 — Reporting workflow (P2, M3)

Independent test: execute AC-US6 in [acceptance.md](acceptance.md) with frozen fixture adapters; end-to-end integration additionally requires the recorded prior story checkpoints.

- [ ] T063 [US6] Write failing contract and adversarial acceptance fixtures for US6; cover all six requirements in `tests/integration/test_us6.py`. Requirements: FR-031, FR-032, FR-033, FR-034, FR-035, FR-036. Depends on: T007, T008, T009, T010, T011, T012, T032, T042.
- [ ] T064 [US6] Implement saved report definitions with permitted scopes and explicit calendar window rules in `services/platform/src/sovix/domain/report_definitions.py`. Requirements: FR-031. Depends on: T063.
- [ ] T065 [US6] Implement timezone-aware scheduler with unique logical slots, DST policy and bounded catch-up in `services/platform/src/sovix/workers/scheduler.py`. Requirements: FR-032. Depends on: T064.
- [ ] T066 [US6] Implement atomic snapshot publication with pinned source/metric/privacy/allocation versions in `services/platform/src/sovix/reporting/snapshot.py`. Requirements: FR-033. Depends on: T065.
- [ ] T067 [US6] Implement investigation state transitions, ownership, comments and resolution reasons in `services/platform/src/sovix/domain/investigations.py`. Requirements: FR-034. Depends on: T066.
- [ ] T068 [US6] Implement per-principal in-product inbox with deduplicated report/action notifications in `services/platform/src/sovix/domain/inbox.py`. Requirements: FR-035. Depends on: T067.
- [ ] T069 [US6] Implement download-time authorization, export expiry and revoked-resource invalidation in `services/platform/src/sovix/api/exports.py`. Requirements: FR-036. Depends on: T068.
- [ ] T070 [US6] Implement every US6 REST operation in contracts/operations.md with typed errors and authorization in `services/platform/src/sovix/api/reports.py`. Requirements: FR-031, FR-032, FR-033, FR-034, FR-035, FR-036. Depends on: T069.
- [ ] T071 [US6] Implement reporting workflow UI including loading, empty, partial, error and permission states in `apps/console/app/investigations/page.tsx`. Requirements: FR-031, FR-032, FR-033, FR-034, FR-035, FR-036. Depends on: T070.
- [ ] T072 [US6] Run US6 independent fixture journey, reject adversarial cases, and record results in `tests/e2e/us6.spec.ts`. Requirements: FR-031, FR-032, FR-033, FR-034, FR-035, FR-036. Depends on: T071.
## US7 — Lifecycle and operations (P2, M3)

Independent test: execute AC-US7 in [acceptance.md](acceptance.md) with frozen fixture adapters; end-to-end integration additionally requires the recorded prior story checkpoints.

- [ ] T073 [US7] Write failing contract and adversarial acceptance fixtures for US7; cover all six requirements in `tests/integration/test_us7.py`. Requirements: FR-037, FR-038, FR-039, FR-040, FR-041, FR-042. Depends on: T007, T008, T009, T010, T011, T012, T042, T072.
- [ ] T074 [US7] Implement bounded retention policies and workspace-scoped scheduled purging in `services/platform/src/sovix/domain/retention.py`. Requirements: FR-037. Depends on: T073.
- [ ] T075 [US7] Implement project deletion fences, durable tombstones and all-store purge accounting in `services/platform/src/sovix/workers/deletion.py`. Requirements: FR-038. Depends on: T074.
- [ ] T076 [US7] Implement cancellation, dead-letter recovery and bounded retry/backoff over fenced jobs in `services/platform/src/sovix/workers/recovery.py`. Requirements: FR-039. Depends on: T075.
- [ ] T077 [US7] Implement payload-free health, freshness and SLO metrics with actionable alerts in `services/platform/src/sovix/api/health.py`. Requirements: FR-040. Depends on: T076.
- [ ] T078 [US7] Implement encrypted backup/restore procedure that reapplies tombstones before serving traffic in `infra/restore.sh`. Requirements: FR-041. Depends on: T077.
- [ ] T079 [US7] Implement entitlement limits, decompressed payload limits and tenant-fair queue admission in `services/platform/src/sovix/domain/quotas.py`. Requirements: FR-042. Depends on: T078.
- [ ] T080 [US7] Implement every US7 REST operation in contracts/operations.md with typed errors and authorization in `services/platform/src/sovix/api/lifecycle.py`. Requirements: FR-037, FR-038, FR-039, FR-040, FR-041, FR-042. Depends on: T079.
- [ ] T081 [US7] Implement lifecycle and operations UI including loading, empty, partial, error and permission states in `apps/console/app/settings/operations/page.tsx`. Requirements: FR-037, FR-038, FR-039, FR-040, FR-041, FR-042. Depends on: T080.
- [ ] T082 [US7] Run US7 independent fixture journey, reject adversarial cases, and record results in `tests/e2e/us7.spec.ts`. Requirements: FR-037, FR-038, FR-039, FR-040, FR-041, FR-042. Depends on: T081.
## US8 — Production outcomes (P3, M4)

Independent test: execute AC-US8 in [acceptance.md](acceptance.md) with frozen fixture adapters; end-to-end integration additionally requires the recorded prior story checkpoints.

- [ ] T083 [US8] Write failing contract and adversarial acceptance fixtures for US8; cover all six requirements in `tests/integration/test_us8.py`. Requirements: FR-043, FR-044, FR-045, FR-046, FR-047, FR-048. Depends on: T007, T008, T009, T010, T011, T012, T062.
- [ ] T084 [US8] Implement deployment evidence adapter with environment/service/repository exact revision in `services/platform/src/sovix/adapters/deployments.py`. Requirements: FR-043. Depends on: T083.
- [ ] T085 [US8] Implement incident evidence with independent impact/detection/recovery clocks and verified links in `services/platform/src/sovix/adapters/incidents.py`. Requirements: FR-044. Depends on: T084.
- [ ] T086 [US8] Implement measured production frequency, lead time and recovery using eligible source populations in `services/platform/src/sovix/analytics/production.py`. Requirements: FR-045. Depends on: T085.
- [ ] T087 [US8] Implement equal-window cohort comparisons with maturity, denominator and data-source checks in `services/platform/src/sovix/analytics/comparison.py`. Requirements: FR-046. Depends on: T086.
- [ ] T088 [US8] Implement descriptive comparison language that prohibits causal ROI or individual productivity conclusions in `services/platform/src/sovix/reporting/comparison_copy.py`. Requirements: FR-047. Depends on: T087.
- [ ] T089 [US8] Implement production result provenance and unavailable/partial states when deployment/incident evidence is absent in `services/platform/src/sovix/reporting/outcomes.py`. Requirements: FR-048. Depends on: T088.
- [ ] T090 [US8] Implement every US8 REST operation in contracts/operations.md with typed errors and authorization in `services/platform/src/sovix/api/outcomes.py`. Requirements: FR-043, FR-044, FR-045, FR-046, FR-047, FR-048. Depends on: T089.
- [ ] T091 [US8] Implement production outcomes UI including loading, empty, partial, error and permission states in `apps/console/app/outcomes/page.tsx`. Requirements: FR-043, FR-044, FR-045, FR-046, FR-047, FR-048. Depends on: T090.
- [ ] T092 [US8] Run US8 independent fixture journey, reject adversarial cases, and record results in `tests/e2e/us8.spec.ts`. Requirements: FR-043, FR-044, FR-045, FR-046, FR-047, FR-048. Depends on: T091.
## US9 — Guarded policy actions (P3, M4)

Independent test: execute AC-US9 in [acceptance.md](acceptance.md) with frozen fixture adapters; end-to-end integration additionally requires the recorded prior story checkpoints.

- [ ] T093 [US9] Write failing contract and adversarial acceptance fixtures for US9; cover all six requirements in `tests/integration/test_us9.py`. Requirements: FR-049, FR-050, FR-051, FR-052, FR-053, FR-054. Depends on: T007, T008, T009, T010, T011, T012, T082, T092.
- [ ] T094 [US9] Implement discriminated bounded rule schemas and deterministic exact-head tri-state evaluator in `services/platform/src/sovix/policy/evaluator.py`. Requirements: FR-049. Depends on: T093.
- [ ] T095 [US9] Implement immutable draft/shadow policy versions, shadow adjudication and qualification report in `services/platform/src/sovix/policy/shadow.py`. Requirements: FR-050. Depends on: T094.
- [ ] T096 [US9] Implement per-repository 100-head/14-day activation checks, admin confirmation and action allowlists in `services/platform/src/sovix/policy/activation.py`. Requirements: FR-051. Depends on: T095.
- [ ] T097 [US9] Implement exact-SHA host adapter with separate credentials, per-action approval and live-state revalidation in `services/platform/src/sovix/policy/actions.py`. Requirements: FR-052. Depends on: T096.
- [ ] T098 [US9] Enforce unknown-evidence refusal, trusted check producer IDs and provider-native protections in `services/platform/src/sovix/policy/host_guards.py`. Requirements: FR-053. Depends on: T097.
- [ ] T099 [US9] Implement workspace kill switch, epoch fences and uncertain host-effect reconciliation without duplicate writes in `services/platform/src/sovix/policy/reconciliation.py`. Requirements: FR-054. Depends on: T098.
- [ ] T100 [US9] Implement every US9 REST operation in contracts/operations.md with typed errors and authorization in `services/platform/src/sovix/api/policies.py`. Requirements: FR-049, FR-050, FR-051, FR-052, FR-053, FR-054. Depends on: T099.
- [ ] T101 [US9] Implement guarded policy actions UI including loading, empty, partial, error and permission states in `apps/console/app/policies/page.tsx`. Requirements: FR-049, FR-050, FR-051, FR-052, FR-053, FR-054. Depends on: T100.
- [ ] T102 [US9] Run US9 independent fixture journey, reject adversarial cases, and record results in `tests/e2e/us9.spec.ts`. Requirements: FR-049, FR-050, FR-051, FR-052, FR-053, FR-054. Depends on: T101.
## US10 — Public discovery (P3, M5)

Independent test: execute AC-US10 in [acceptance.md](acceptance.md) with frozen fixture adapters; end-to-end integration additionally requires the recorded prior story checkpoints.

- [ ] T103 [US10] Write failing contract and adversarial acceptance fixtures for US10; cover all six requirements in `tests/integration/test_us10.py`. Requirements: FR-055, FR-056, FR-057, FR-058, FR-059, FR-060. Depends on: T007, T008, T009, T010, T011, T012.
- [ ] T104 [US10] Implement isolated public ingestion store with no access to private source tables or tokens in `apps/radar/src/server/public-store.ts`. Requirements: FR-055. Depends on: T103.
- [ ] T105 [US10] Implement profile field provenance, factual observations and separately labelled reconstruction/narrative in `apps/radar/src/server/provenance.ts`. Requirements: FR-056. Depends on: T104.
- [ ] T106 [US10] Implement public search filters and browser-local watchlist with explicit clear action in `apps/radar/app/explore/page.tsx`. Requirements: FR-057. Depends on: T105.
- [ ] T107 [US10] Implement server-bound preview and confirmation for authenticated GitHub issue requests with idempotency in `apps/radar/src/server/requests.ts`. Requirements: FR-058. Depends on: T106.
- [ ] T108 [US10] Implement public ranking presentation without unsupported code-quality or productivity claims in `apps/radar/src/components/RankingExplanation.tsx`. Requirements: FR-059. Depends on: T107.
- [ ] T109 [US10] Implement refresh/removal/private/archived lifecycle and invalidate obsolete public artifacts in `apps/radar/src/server/lifecycle.ts`. Requirements: FR-060. Depends on: T108.
- [ ] T110 [US10] Implement every US10 REST operation in contracts/operations.md with typed errors and authorization in `services/platform/src/sovix/api/public.py`. Requirements: FR-055, FR-056, FR-057, FR-058, FR-059, FR-060. Depends on: T109.
- [ ] T111 [US10] Implement public discovery UI including loading, empty, partial, error and permission states in `apps/radar/app/repository/[repositoryId]/page.tsx`. Requirements: FR-055, FR-056, FR-057, FR-058, FR-059, FR-060. Depends on: T110.
- [ ] T112 [US10] Run US10 independent fixture journey, reject adversarial cases, and record results in `tests/e2e/us10.spec.ts`. Requirements: FR-055, FR-056, FR-057, FR-058, FR-059, FR-060. Depends on: T111.
## Integration

- [ ] T113 [US3] Implement browser OIDC PKCE callbacks, HttpOnly session, CSRF guards and BFF proxy in `apps/console/app/api/auth/route.ts`. Requirements: FR-013, NFR-007, NFR-010. Depends on: T042.
- [ ] T114 [US7] Build Docker Compose local/hosted profiles with migration readiness and private object storage in `infra/compose.yaml`. Requirements: NFR-004, FR-041. Depends on: T082.
- [ ] T115 [US1] Complete migrated adapter parity, source license inventory and staged legacy rollback runbook in `docs/migration-results.md`. Requirements: FR-002, SC-002. Depends on: T022, T032.
## Release quality

- [ ] T116 Load-test cached overview p95<=2s and evidence p95<=1s under declared concurrency in `tests/performance/read_latency.py`. Requirements: NFR-001. Depends on: T032.
- [ ] T117 Load-test 50 repositories, 100k source records and 1m spans/workspace/day with tenant-fair queues in `tests/performance/capacity.py`. Requirements: NFR-002. Depends on: T052, T082.
- [ ] T118 Measure ingest-to-query p95<=60s with duplicate and burst traffic in `tests/performance/ingestion.py`. Requirements: NFR-003. Depends on: T052.
- [ ] T119 Exercise SLO monitoring and encrypted restore within RPO24h/RTO4h in `tests/operations/test_restore.py`. Requirements: NFR-004. Depends on: T082.
- [ ] T120 Audit applicable WCAG2.2AA with keyboard, screen reader and automated checks across app and exports in `tests/e2e/accessibility.spec.ts`. Requirements: NFR-005. Depends on: T032, T042, T112.
- [ ] T121 Verify 360px responsive layout and contained wide tables in app and offline reports in `tests/e2e/responsive.spec.ts`. Requirements: NFR-006. Depends on: T032, T112.
- [ ] T122 Probe tenant/project isolation across APIs, RLS, queues, artifacts, caches and error responses in `tests/security/test_isolation.py`. Requirements: NFR-007. Depends on: T042, T072, T082.
- [ ] T123 Verify canonical hashes, offline assets and blocked-network export operation in `tests/integration/test_determinism.py`. Requirements: NFR-008. Depends on: T032.
- [ ] T124 Verify UTC half-open boundaries, named zones and DST schedule slots in `tests/integration/test_temporal.py`. Requirements: NFR-009. Depends on: T072.
- [ ] T125 Seed canary secrets/content and assert absence across all accepted stores, logs and exports in `tests/security/test_redaction.py`. Requirements: NFR-010. Depends on: T042, T052, T082.
- [ ] T126 Enforce schema compatibility, old-client fixture support and 90-day breaking-change migration plan in `tests/contract/test_compatibility.py`. Requirements: NFR-011. Depends on: T022, T052, T112.
- [ ] T127 Prove analytics/report generation perform zero model calls; gate optional narrative by separate budget in `tests/integration/test_no_model_calls.py`. Requirements: NFR-012. Depends on: T032, T112.
- [ ] T128 Measure first-run offline report under five minutes on the fixed reference repository in `tests/e2e/first_run.spec.ts`. Requirements: SC-001. Depends on: T022, T032.
- [ ] T129 Recompute reference metrics and canonical manifest hashes against hand-calculated oracle fixtures in `tests/integration/test_golden_metrics.py`. Requirements: SC-002. Depends on: T022, T032.
- [ ] T130 Run every adversarial tenant/project access probe and inspect denial uniformity in `tests/security/test_boundary_acceptance.py`. Requirements: SC-003. Depends on: T042, T082.
- [ ] T131 Property-test duplicate ingestion and many-to-many allocations for exact unit and money conservation in `tests/property/test_conservation.py`. Requirements: SC-004. Depends on: T052, T062.
- [ ] T132 Observe finding-to-arithmetic-to-source navigation within three interactions in `tests/e2e/evidence_navigation.spec.ts`. Requirements: SC-005. Depends on: T032.
- [ ] T133 Compare missing/unsupported/partial/suppressed labels and numeric nulls across API/UI/exports in `tests/integration/test_availability_parity.py`. Requirements: SC-006. Depends on: T032, T042, T052.
- [ ] T134 Race retries and DST scheduler instances to prove unique logical report slot in `tests/integration/test_schedule_races.py`. Requirements: SC-007. Depends on: T072.
- [ ] T135 Perform governed-data deletion then restore drill and confirm no payload can be served or reingested in `tests/operations/test_deletion_restore.py`. Requirements: SC-008. Depends on: T082.
- [ ] T136 Inject head changes, revoked permissions, unknown checks and response loss; prove no unauthorized/duplicate host effect in `tests/integration/test_policy_races.py`. Requirements: SC-009. Depends on: T102.
- [ ] T137 Run opt-in three-team pilot, capture decision evidence, and assess two-team usefulness hypothesis in `docs/pilot-evaluation.md`. Requirements: SC-010. Depends on: T032, T062, T072.
- [ ] T138 Verify release quickstart from clean machine and publish reproducible local release artifacts after release review in `docs/release-checklist.md`. Requirements: SC-001, NFR-011. Depends on: T113, T114, T115, T116, T117, T118, T119, T120, T121, T122, T123, T124, T125, T126, T127, T128, T129, T130, T131, T132, T133, T134, T135, T136, T137.

## Execution and checkpoints

- Parallel setup example: after T001, T002 and T003 use different manifests; T009 may also proceed independently. T005 and T011 can proceed when their explicit prerequisites pass.
- US2 calculator fixtures can be prepared against frozen US1 adapter contracts; its integration checkpoint still waits for US1. Hosted US3 can proceed alongside M1 after M0.
- US4 and US6 can be implemented in parallel once their dependency sets are satisfied. US10 is isolated and optional; do not share its storage or credentials with private analytics.
- Before each milestone release, run its applicable NFR and SC gates; their location at the end of this file is for navigation, not permission to defer privacy or correctness.
- SC-010 is a post-use business hypothesis. Record outcomes honestly; it is not an automated pre-release pass/fail gate.
- For each task update, retain ID and requirement mapping. Add tasks through the generator; changing scope requires spec and contract revision first.
