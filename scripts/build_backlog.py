"""Generate the implementation backlog and requirement traceability from explicit work items."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'specs/001-sovix-evidence'
T=[]
def add(description,path,requirements,story=None,deps=(),parallel=False,acceptance=(),phase=None):
 task={'id':f'T{len(T)+1:03}','description':description,'path':path,'requirements':requirements,'story':story,'depends_on':list(deps),'parallel':parallel,'acceptance':list(acceptance),'phase':phase or story or 'M0'};T.append(task);return task['id']
a=add('Create workspace manifests with pinned runtime targets and dependency lockfiles','package.json',['NFR-011'],acceptance=['AC-NFR011'])
b=add('Create Python package, module boundaries and migration entrypoint','services/platform/pyproject.toml',['NFR-011'],deps=[a],acceptance=['AC-NFR011'])
c=add('Create TypeScript scanner and console workspace configurations','pnpm-workspace.yaml',['NFR-006'],deps=[a],parallel=True,acceptance=['AC-NFR006'])
d=add('Implement validated local/hosted configuration with loopback secret and no automatic egress','services/platform/src/sovix/config.py',['FR-005','NFR-010'],deps=[b],acceptance=['AC-US1','AC-NFR010'])
e=add('Implement shared value objects, UTC half-open windows and decimal serialization','services/platform/src/sovix/domain/values.py',['NFR-009','FR-007'],deps=[b],parallel=True,acceptance=['AC-NFR009','AC-US2'])
f=add('Implement SQLite and PostgreSQL unit-of-work adapters and scoped foreign keys','services/platform/src/sovix/persistence/uow.py',['FR-013','NFR-007'],deps=[b,e],acceptance=['AC-US3','AC-NFR007'])
g=add('Implement authenticated request context, typed Problem responses, idempotency receipts and ETags','services/platform/src/sovix/api/middleware.py',['FR-004','FR-013','NFR-011'],deps=[d,f],acceptance=['AC-US1','AC-US3','AC-NFR011'])
h=add('Implement transactional outbox, leased jobs, heartbeat and fencing primitives','services/platform/src/sovix/workers/jobs.py',['FR-004','FR-039'],deps=[f],acceptance=['AC-US1','AC-US7'])
i=add('Generate API clients and shared schemas; add contract drift checks against committed OpenAPI','packages/contracts/package.json',['NFR-011'],deps=[a],parallel=True,acceptance=['AC-NFR011'])
j=add('Create synthetic fixtures, deterministic clock, isolated database harness and forbidden-network harness','tests/conftest.py',['SC-002','NFR-008'],deps=[e,f],acceptance=['AC-SC002','AC-NFR008'])
k=add('Implement metadata allowlist and structured content-free error logging','services/platform/src/sovix/domain/privacy.py',['FR-016','NFR-010'],deps=[e],acceptance=['AC-US3','AC-NFR010'])
l=add('Create accessible shared tokens, form primitives and data table keyboard behavior','packages/ui/src/index.ts',['NFR-005','NFR-006'],deps=[c],acceptance=['AC-NFR005','AC-NFR006'])
foundation=[g,h,i,j,k,l]
# Six concrete implementation work items per story, in FR order; supporting route/UI work follows.
STORIES={
1:('Historical baseline','M1','P1',[
('Implement read-only local Git scan with commit/line/signature-floor aggregates and JSON output','packages/scanner/src/scan.ts'),
('Implement explicit Sovix and Receipts version adapters, preserving original namespaced metrics and coverage','services/platform/src/sovix/adapters/legacy.py'),
('Implement source capability registry and pagination/window completeness watermarks','services/platform/src/sovix/domain/coverage.py'),
('Implement source natural-key dedupe, conflicting-payload quarantine and resumable collection checkpoints','services/platform/src/sovix/adapters/receipts/collection.py'),
('Enforce offline mode, read-only Git operations and opt-in connector egress at adapter boundary','packages/scanner/src/privacy.ts'),
('Implement import validation diagnostics, bad-record counts and retryable versus permanent failure reasons','services/platform/src/sovix/adapters/import_validation.py')],
'services/platform/src/sovix/api/imports.py','apps/console/app/import/page.tsx'),
2:('Evidence and reports','M1','P1',[
('Implement canonical MetricResult contract with formula, scope, coverage, lineage, versions and nullability','services/platform/src/sovix/analytics/result.py'),
('Implement evidence lookup and independent arithmetic/hash verification without model calls','services/platform/src/sovix/analytics/verify.py'),
('Implement versioned 27-metric registry and recompute cohort aggregates from eligible raw observations','services/platform/src/sovix/analytics/calculators.py'),
('Implement availability and measured/proxy/inferred labels, missing denominators and mature-window exclusions','services/platform/src/sovix/analytics/availability.py'),
('Implement leadership, investigation and coverage view models with evidence drilldown','services/platform/src/sovix/reporting/views.py'),
('Implement deterministic escaped HTML/JSON/CSV/Markdown exporters and content-hash manifests','services/platform/src/sovix/reporting/export.py')],
'services/platform/src/sovix/api/snapshots.py','apps/console/app/reports/[snapshotId]/page.tsx'),
3:('Private hosted workspaces','M2','P1',[
('Implement OIDC principal mapping, workspace membership and owner transfer invariant','services/platform/src/sovix/domain/identity.py'),
('Implement per-project role policy and forced RLS for API, workers and export queries','services/platform/src/sovix/persistence/authorization.py'),
('Implement GitHub App installation validation, raw HMAC webhook receipt, secret references and revocation','services/platform/src/sovix/adapters/github/installation.py'),
('Enforce aggregate-first ingestion and strip prompts, emails, arguments and exception text before persistence','services/platform/src/sovix/adapters/redaction.py'),
('Implement hosted k>=5 cohort suppression with complementary suppression and filter restrictions','services/platform/src/sovix/analytics/suppression.py'),
('Implement content-free append-only audit events for identity, access, source and action changes','services/platform/src/sovix/domain/audit.py')],
'services/platform/src/sovix/api/workspaces.py','apps/console/app/settings/workspace/page.tsx'),
4:('Agent telemetry','M2','P2',[
('Implement scoped collector credentials and runtime capability certification registry','services/platform/src/sovix/domain/collectors.py'),
('Implement Dash0/Codex OTLP normalization with strict allowlist and native response encoding','services/platform/src/sovix/adapters/otlp/receiver.py'),
('Implement source/session/span identities with credential-bound workspace/project context','services/platform/src/sovix/domain/sessions.py'),
('Implement usage owner normalization, session duration and tool-status projections','services/platform/src/sovix/analytics/telemetry.py'),
('Implement duplicate and late-span handling with parent/subagent accounting and conflict quarantine','services/platform/src/sovix/adapters/otlp/deduplication.py'),
('Implement unsupported runtime counters, ingestion lag and collector capability health','services/platform/src/sovix/adapters/otlp/health.py')],
'services/platform/src/sovix/api/collectors.py','apps/console/app/sessions/page.tsx'),
5:('Attribution and costs','M2','P2',[
('Implement evidence-based candidate/verified association rules with exact repository and revision identities','services/platform/src/sovix/domain/linking.py'),
('Implement append-only analyst link adjudication with reason, evidence and optimistic concurrency','services/platform/src/sovix/domain/adjudication.py'),
('Implement canonical usage cost estimation and separate billing/subscription allocation ledgers','services/platform/src/sovix/analytics/costs.py'),
('Implement integer-ppm allocation conservation, decimal rounding and explicit unallocated remainder','services/platform/src/sovix/analytics/allocation.py'),
('Implement immutable effective-dated rate catalogs and unknown-model/unpriced usage coverage','services/platform/src/sovix/domain/prices.py'),
('Implement pinned cost/link/allocation revisions and snapshot-safe correction workflows','services/platform/src/sovix/domain/corrections.py')],
'services/platform/src/sovix/api/costs.py','apps/console/app/costs/page.tsx'),
6:('Reporting workflow','M3','P2',[
('Implement saved report definitions with permitted scopes and explicit calendar window rules','services/platform/src/sovix/domain/report_definitions.py'),
('Implement timezone-aware scheduler with unique logical slots, DST policy and bounded catch-up','services/platform/src/sovix/workers/scheduler.py'),
('Implement atomic snapshot publication with pinned source/metric/privacy/allocation versions','services/platform/src/sovix/reporting/snapshot.py'),
('Implement investigation state transitions, ownership, comments and resolution reasons','services/platform/src/sovix/domain/investigations.py'),
('Implement per-principal in-product inbox with deduplicated report/action notifications','services/platform/src/sovix/domain/inbox.py'),
('Implement download-time authorization, export expiry and revoked-resource invalidation','services/platform/src/sovix/api/exports.py')],
'services/platform/src/sovix/api/reports.py','apps/console/app/investigations/page.tsx'),
7:('Lifecycle and operations','M3','P2',[
('Implement bounded retention policies and workspace-scoped scheduled purging','services/platform/src/sovix/domain/retention.py'),
('Implement project deletion fences, durable tombstones and all-store purge accounting','services/platform/src/sovix/workers/deletion.py'),
('Implement cancellation, dead-letter recovery and bounded retry/backoff over fenced jobs','services/platform/src/sovix/workers/recovery.py'),
('Implement payload-free health, freshness and SLO metrics with actionable alerts','services/platform/src/sovix/api/health.py'),
('Implement encrypted backup/restore procedure that reapplies tombstones before serving traffic','infra/restore.sh'),
('Implement entitlement limits, decompressed payload limits and tenant-fair queue admission','services/platform/src/sovix/domain/quotas.py')],
'services/platform/src/sovix/api/lifecycle.py','apps/console/app/settings/operations/page.tsx'),
8:('Production outcomes','M4','P3',[
('Implement deployment evidence adapter with environment/service/repository exact revision','services/platform/src/sovix/adapters/deployments.py'),
('Implement incident evidence with independent impact/detection/recovery clocks and verified links','services/platform/src/sovix/adapters/incidents.py'),
('Implement measured production frequency, lead time and recovery using eligible source populations','services/platform/src/sovix/analytics/production.py'),
('Implement equal-window cohort comparisons with maturity, denominator and data-source checks','services/platform/src/sovix/analytics/comparison.py'),
('Implement descriptive comparison language that prohibits causal ROI or individual productivity conclusions','services/platform/src/sovix/reporting/comparison_copy.py'),
('Implement production result provenance and unavailable/partial states when deployment/incident evidence is absent','services/platform/src/sovix/reporting/outcomes.py')],
'services/platform/src/sovix/api/outcomes.py','apps/console/app/outcomes/page.tsx'),
9:('Guarded policy actions','M4','P3',[
('Implement discriminated bounded rule schemas and deterministic exact-head tri-state evaluator','services/platform/src/sovix/policy/evaluator.py'),
('Implement immutable draft/shadow policy versions, shadow adjudication and qualification report','services/platform/src/sovix/policy/shadow.py'),
('Implement per-repository 100-head/14-day activation checks, admin confirmation and action allowlists','services/platform/src/sovix/policy/activation.py'),
('Implement exact-SHA host adapter with separate credentials, per-action approval and live-state revalidation','services/platform/src/sovix/policy/actions.py'),
('Enforce unknown-evidence refusal, trusted check producer IDs and provider-native protections','services/platform/src/sovix/policy/host_guards.py'),
('Implement workspace kill switch, epoch fences and uncertain host-effect reconciliation without duplicate writes','services/platform/src/sovix/policy/reconciliation.py')],
'services/platform/src/sovix/api/policies.py','apps/console/app/policies/page.tsx'),
10:('Public discovery','M5','P3',[
('Implement isolated public ingestion store with no access to private source tables or tokens','apps/radar/src/server/public-store.ts'),
('Implement profile field provenance, factual observations and separately labelled reconstruction/narrative','apps/radar/src/server/provenance.ts'),
('Implement public search filters and browser-local watchlist with explicit clear action','apps/radar/app/explore/page.tsx'),
('Implement server-bound preview and confirmation for authenticated GitHub issue requests with idempotency','apps/radar/src/server/requests.ts'),
('Implement public ranking presentation without unsupported code-quality or productivity claims','apps/radar/src/components/RankingExplanation.tsx'),
('Implement refresh/removal/private/archived lifecycle and invalidate obsolete public artifacts','apps/radar/src/server/lifecycle.ts')],
'services/platform/src/sovix/api/public.py','apps/radar/app/repository/[repositoryId]/page.tsx')}
ends={};story_tests={}
for n,(title,milestone,priority,items,route,ui) in STORIES.items():
 story=f'US{n}'; reqs=[f'FR-{x:03}' for x in range((n-1)*6+1,n*6+1)]
 dependencies=foundation.copy()
 # Recorded integration dependencies. Tests may use frozen adapters before dependent UI is complete.
 for previous in {1:[],2:[1],3:[],4:[3],5:[2,4],6:[2,3],7:[3,6],8:[5],9:[7,8],10:[]}[n]:dependencies.append(ends[previous])
 test=add(f'Write failing contract and adversarial acceptance fixtures for {story}; cover all six requirements',f'tests/integration/test_us{n}.py',reqs,story,dependencies,acceptance=[f'AC-US{n}']);story_tests[n]=test
 prev=test
 for ix,(description,path) in enumerate(items):prev=add(description,path,[reqs[ix]],story,[prev],acceptance=[f'AC-US{n}'])
 api=add(f'Implement every {story} REST operation in contracts/operations.md with typed errors and authorization',route,reqs,story,[prev],acceptance=[f'AC-US{n}'])
 frontend=add(f'Implement {title.lower()} UI including loading, empty, partial, error and permission states',ui,reqs,story,[api],acceptance=[f'AC-US{n}'])
 ends[n]=add(f'Run {story} independent fixture journey, reject adversarial cases, and record results',f'tests/e2e/us{n}.spec.ts',reqs,story,[frontend],acceptance=[f'AC-US{n}'])
# Explicit integration jobs not well represented by a six-item business split.
add('Implement browser OIDC PKCE callbacks, HttpOnly session, CSRF guards and BFF proxy','apps/console/app/api/auth/route.ts',['FR-013','NFR-007','NFR-010'],'US3',[ends[3]],acceptance=['AC-US3','AC-NFR007','AC-NFR010'],phase='Integration')
add('Build Docker Compose local/hosted profiles with migration readiness and private object storage','infra/compose.yaml',['NFR-004','FR-041'],'US7',[ends[7]],acceptance=['AC-NFR004','AC-US7'],phase='Integration')
add('Complete migrated adapter parity, source license inventory and staged legacy rollback runbook','docs/migration-results.md',['FR-002','SC-002'],'US1',[ends[1],ends[2]],acceptance=['AC-US1','AC-SC002'],phase='Integration')
NFR=[
('Load-test cached overview p95<=2s and evidence p95<=1s under declared concurrency','tests/performance/read_latency.py',[2]),
('Load-test 50 repositories, 100k source records and 1m spans/workspace/day with tenant-fair queues','tests/performance/capacity.py',[4,7]),
('Measure ingest-to-query p95<=60s with duplicate and burst traffic','tests/performance/ingestion.py',[4]),
('Exercise SLO monitoring and encrypted restore within RPO24h/RTO4h','tests/operations/test_restore.py',[7]),
('Audit applicable WCAG2.2AA with keyboard, screen reader and automated checks across app and exports','tests/e2e/accessibility.spec.ts',[2,3,10]),
('Verify 360px responsive layout and contained wide tables in app and offline reports','tests/e2e/responsive.spec.ts',[2,10]),
('Probe tenant/project isolation across APIs, RLS, queues, artifacts, caches and error responses','tests/security/test_isolation.py',[3,6,7]),
('Verify canonical hashes, offline assets and blocked-network export operation','tests/integration/test_determinism.py',[2]),
('Verify UTC half-open boundaries, named zones and DST schedule slots','tests/integration/test_temporal.py',[6]),
('Seed canary secrets/content and assert absence across all accepted stores, logs and exports','tests/security/test_redaction.py',[3,4,7]),
('Enforce schema compatibility, old-client fixture support and 90-day breaking-change migration plan','tests/contract/test_compatibility.py',[1,4,10]),
('Prove analytics/report generation perform zero model calls; gate optional narrative by separate budget','tests/integration/test_no_model_calls.py',[2,10])]
for n,(desc,path,stories) in enumerate(NFR,1):add(desc,path,[f'NFR-{n:03}'],deps=[ends[x] for x in stories],acceptance=[f'AC-NFR{n:03}'],phase='Release quality')
SC=[
('Measure first-run offline report under five minutes on the fixed reference repository','tests/e2e/first_run.spec.ts',[1,2]),
('Recompute reference metrics and canonical manifest hashes against hand-calculated oracle fixtures','tests/integration/test_golden_metrics.py',[1,2]),
('Run every adversarial tenant/project access probe and inspect denial uniformity','tests/security/test_boundary_acceptance.py',[3,7]),
('Property-test duplicate ingestion and many-to-many allocations for exact unit and money conservation','tests/property/test_conservation.py',[4,5]),
('Observe finding-to-arithmetic-to-source navigation within three interactions','tests/e2e/evidence_navigation.spec.ts',[2]),
('Compare missing/unsupported/partial/suppressed labels and numeric nulls across API/UI/exports','tests/integration/test_availability_parity.py',[2,3,4]),
('Race retries and DST scheduler instances to prove unique logical report slot','tests/integration/test_schedule_races.py',[6]),
('Perform governed-data deletion then restore drill and confirm no payload can be served or reingested','tests/operations/test_deletion_restore.py',[7]),
('Inject head changes, revoked permissions, unknown checks and response loss; prove no unauthorized/duplicate host effect','tests/integration/test_policy_races.py',[9]),
('Run opt-in three-team pilot, capture decision evidence, and assess two-team usefulness hypothesis','docs/pilot-evaluation.md',[2,5,6])]
for n,(desc,path,stories) in enumerate(SC,1):add(desc,path,[f'SC-{n:03}'],deps=[ends[x] for x in stories],acceptance=[f'AC-SC{n:03}'],phase='Release quality')
add('Verify release quickstart from clean machine and publish reproducible local release artifacts after release review','docs/release-checklist.md',['SC-001','NFR-011'],deps=[x['id'] for x in T if x['phase'] in ['Integration','Release quality']],acceptance=['AC-SC001','AC-NFR011'],phase='Release quality')
trace={'schema_version':'1.0','status':'planned','tasks':T,'requirements':{}}
for t in T:
 for r in t['requirements']:
  x=trace['requirements'].setdefault(r,{'tasks':[],'acceptance':[]});x['tasks'].append(t['id']);x['acceptance']=sorted(set(x['acceptance']+t['acceptance']))
(OUT/'traceability.json').write_text(json.dumps(trace,indent=2)+'\n')
lines=['# Implementation Tasks: Sovix Evidence','','All tasks are planned and unchecked. This repository contains specifications and validation tooling; completion of those documents does not complete these application tasks.','','Source of truth for machine-readable dependencies and requirement mapping: [traceability.json](traceability.json). Task generation: `python3 scripts/build_backlog.py`. Every task includes a concrete output path; these are future application paths unless already present.','','## Delivery strategy','','Deliver M0 foundations, then the M1 local scanner/import/evidence report MVP (US1+US2). M2 adds hosted identity and telemetry/cost association; M3 adds recurring workflows and operations; M4 adds production outcomes and guarded policy; M5 is optional public discovery. Do not delay the local MVP for public discovery or host actions.','','Story tests use synthetic adapters for independent verification. Real cross-story integration must satisfy the dependencies below. A task marked [P] is eligible for parallel execution only after its listed dependencies pass and only with disjoint files. Sequential tasks within each story intentionally avoid same-module edit races.','','Tests cover domain invariants, not implementation mirrors. Write the specified failing acceptance tests before corresponding business logic, then record passing results at the story checkpoint. Do not mark a task done based on document presence alone.','']
phase=None
for t in T:
 if t['phase']!=phase:
  phase=t['phase']
  if phase.startswith('US'):
   n=int(phase[2:]);title,mile,pri,*_=STORIES[n];lines += [f'## {phase} — {title} ({pri}, {mile})','',f'Independent test: execute AC-{phase} in [acceptance.md](acceptance.md) with frozen fixture adapters; end-to-end integration additionally requires the recorded prior story checkpoints.','']
  else:lines += [f'## {phase}','']
 flags=(' [P]' if t['parallel'] else '')+(f" [{t['story']}]" if t['story'] else '')
 deps=', '.join(t['depends_on']) or 'none';req=', '.join(t['requirements'])
 lines += [f"- [ ] {t['id']}{flags} {t['description']} in `{t['path']}`. Requirements: {req}. Depends on: {deps}."]
lines += ['','## Execution and checkpoints','','- Parallel setup example: after T001, T002 and T003 use different manifests; T009 may also proceed independently. T005 and T011 can proceed when their explicit prerequisites pass.','- US2 calculator fixtures can be prepared against frozen US1 adapter contracts; its integration checkpoint still waits for US1. Hosted US3 can proceed alongside M1 after M0.','- US4 and US6 can be implemented in parallel once their dependency sets are satisfied. US10 is isolated and optional; do not share its storage or credentials with private analytics.','- Before each milestone release, run its applicable NFR and SC gates; their location at the end of this file is for navigation, not permission to defer privacy or correctness.','- SC-010 is a post-use business hypothesis. Record outcomes honestly; it is not an automated pre-release pass/fail gate.','- For each task update, retain ID and requirement mapping. Add tasks through the generator; changing scope requires spec and contract revision first.','']
(OUT/'tasks.md').write_text('\n'.join(lines))
print(f'Generated {len(T)} planned tasks mapping {len(trace["requirements"])} requirements/criteria')
