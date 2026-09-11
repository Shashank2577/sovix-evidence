# Feature Specification: Sovix Evidence Platform

**Feature Branch**: `codex/001-sovix-evidence`  
**Created**: 2026-09-11  
**Status**: Specified; implementation not started  
**Input**: Create a complete repository specification combining Sovix CLI, Receipts,
RepoRadar and Dash0/Darkplane telemetry, including tasks, APIs and domain design.

## Product Definition

Sovix Evidence connects coding activity, repository changes, review, cost and observed
outcomes into project-level reports with inspectable evidence. The first buyer hypothesis
is engineering leaders managing multiple product or client repositories. Developers use
it to investigate workflow problems; client stakeholders use authorized project reports.

The product promise is: **Know what AI-assisted engineering delivers, with a verifiable
source behind every number.** It does not promise exact AI authorship, employee ranking,
causal productivity uplift or autonomous production delivery.

### Delivery scope

| Milestone | User value | Required stories | Shipping gate |
|---|---|---|---|
| M0 | Consistent contracts and secure foundations | Shared foundation | Valid contracts, fixture parity, isolation design |
| M1 | Offline historical engineering evidence | US1, US2 | Reproducible local report without network |
| M2 | Team workspace and agent workflow/cost evidence | US3, US4, US5 | Tenant isolation, redacted telemetry, allocation conservation |
| M3 | Repeatable client reporting and operational controls | US6, US7 | Scheduled reports, deletion/restore drill, access audit |
| M4 | Real production context and controlled review assistance | US8, US9 | Exact release links, shadow evaluation, narrow activation |
| M5 | Optional public discovery | US10 | Public/private isolation and explicit source provenance |

Every milestone is specified here. Optional means separately releasable and disabled by
default, not unspecified. No source repository is merged or deployed by this document.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Establish a historical baseline (Priority: P1)

An engineering lead scans a local repository or imports a saved report and receives an
honest baseline without installing coding-agent telemetry.

**Why this priority**: Existing Git and report data delivers immediate value.
**Independent Test**: A synthetic Git repository and saved legacy fixtures produce an
offline baseline with known counts and exclusions, without any hosted credentials.
**Acceptance Scenarios**:
1. **Given** valid local Git history, **when** a fixed-window scan runs offline, **then**
   output names the repository/window and detectable agent-signature floor.
2. **Given** the same legacy report twice, **when** imported, **then** one logical source
   revision exists and both requests identify the same import result.
3. **Given** truncated PR collection or one inaccessible repository, **when** collection
   completes, **then** the report is explicitly partial with actionable source errors.
4. **Given** an unsupported schema or invalid Git path, **when** submitted, **then** no
   partial metric set is published and the user receives a precise rejection reason.

### User Story 2 - Investigate and explain a number (Priority: P1)

A lead opens a finding, examines its arithmetic and source records, and exports the same
explanation for a stakeholder.

**Why this priority**: Trustworthy explanation is the core differentiator.
**Independent Test**: A fixture containing 28 reviewed of 189 merged PRs displays 14.8%,
its sample limits, source links and the same canonical calculation in the export.
**Acceptance Scenarios**:
1. **Given** collected evidence, **when** a metric is opened, **then** its definition,
   version, calculation, exclusions, coverage and limitations are visible.
2. **Given** repositories with unequal populations, **when** rolled up, **then** raw
   eligible records are recomputed; percentages and medians are not averaged.
3. **Given** no deployment or telemetry source, **when** the dashboard loads, **then**
   corresponding measures say unavailable rather than zero or a production claim.
4. **Given** an exported report, **when** opened without network, **then** its navigation,
   charts, evidence and verification manifest remain usable.

### User Story 3 - Operate a private team workspace (Priority: P1)

An owner connects selected repositories, assigns project access and gives clients a
restricted aggregate view.

**Why this priority**: Hosted evidence must not cross tenant or project boundaries.
**Independent Test**: Two tenants and a restricted client account demonstrate that every
query, export, guessed identifier and background job respects authorization.
**Acceptance Scenarios**:
1. **Given** a signed-in owner, **when** creating a workspace, **then** that owner receives
   explicit workspace membership and no access to other workspaces.
2. **Given** a project-scoped viewer, **when** opening another project's URL or export,
   **then** it is not found and its existence is not revealed.
3. **Given** revoked repository access, **when** the next sync runs, **then** collection
   stops for that source and the historical snapshot shows revoked/freshness status.
4. **Given** a cohort of fewer than five humans, **when** people breakdowns are requested,
   **then** the breakdown and complementary slices are suppressed across UI and exports.

### User Story 4 - Observe coding-agent workflows (Priority: P2)

A team installs an explicitly configured collector and investigates errors, token use and
elapsed session time without sending prompt or code content.

**Why this priority**: Git cannot recover activity that was never committed.
**Independent Test**: Redacted synthetic agent spans exercise ingestion, duplicate replay,
late arrival, unsupported attributes and missing instrumentation.
**Acceptance Scenarios**:
1. **Given** registered project-scoped ingestion credentials, **when** allowed metadata
   arrives, **then** sessions show model, tool errors, token units and collection coverage.
2. **Given** prompt text, email or a seeded secret in an unknown attribute, **when** data
   reaches the ingestion boundary, **then** it is stripped before storage and logs.
3. **Given** duplicate or conflicting span delivery, **when** replayed, **then** duplicates
   are ignored and conflicting revisions are quarantined without double counts.
4. **Given** an unsupported runtime field, **when** a report is rendered, **then** it is
   marked unsupported rather than interpreted as zero use.

### User Story 5 - Attribute cost to delivered changes (Priority: P2)

A lead follows a PR back to relevant sessions and understands allocated usage cost and
how much remains unknown or unallocated.

**Why this priority**: Raw token totals cannot explain the cost of delivered work.
**Independent Test**: One USD 10 cost unit linked to two PRs allocates USD 6 and USD 4;
retries, parent/child spans and revised mappings never turn it into USD 20.
**Acceptance Scenarios**:
1. **Given** a verified session/commit association, **when** mapped to a PR, **then** the
   link exposes its evidence and method separately from any monetary allocation.
2. **Given** only branch/time proximity, **when** a link is proposed, **then** it remains
   a candidate excluded from verified-attribution totals.
3. **Given** an unknown model price, **when** summarizing cost, **then** its usage remains
   in an unpriced bucket and the total is labelled partial.
4. **Given** a corrected association, **when** a new snapshot is created, **then** it uses
   the new allocation version while the earlier snapshot retains its original result.

### User Story 6 - Deliver recurring project evidence (Priority: P2)

A lead saves a report definition, schedules generation and records follow-up actions from
its findings. A client opens only the authorized project snapshot.

**Why this priority**: Repeated reporting is a concrete paid workflow.
**Independent Test**: A scheduled report generates once at a configured local time,
including a daylight-saving transition, and opens with an investigation history.
**Acceptance Scenarios**:
1. **Given** a saved project scope and timezone, **when** the scheduled slot arrives,
   **then** exactly one logical report is produced, even after worker retry.
2. **Given** newly ingested late evidence, **when** a report reruns, **then** a new snapshot
   is created and the older snapshot remains unchanged.
3. **Given** a finding, **when** a lead creates an investigation, **then** owner, reason,
   due date, status and source snapshot are retained through resolution.
4. **Given** an unauthorized or revoked viewer, **when** opening an export link,
   **then** access is denied even if the original link has not expired.

### User Story 7 - Control lifecycle and operate reliably (Priority: P2)

An administrator understands collector health, retention, data deletion, quota use and
recovery status without exposing report contents to operators.

**Why this priority**: A report is trustworthy only while its collection and storage are
understood and its access promises can be enforced.
**Independent Test**: A collector outage, worker crash, backup restore and deletion request
produce auditable states without data loss, duplication or resurrected deleted evidence.
**Acceptance Scenarios**:
1. **Given** a worker crash after a page commits, **when** the lease expires, **then** a
   retry resumes from its durable checkpoint without duplicate evidence.
2. **Given** a deletion request, **when** it completes, **then** governed records and
   server-held exports are removed and affected snapshots become unavailable.
3. **Given** a restored backup, **when** service resumes, **then** deletion tombstones
   are reapplied before users can access data.
4. **Given** a quota limit, **when** an ingestion or export exceeds it, **then** the
   user sees the specific limit and a retry/reset path without partial silent loss.

### User Story 8 - Connect changes to observed outcomes (Priority: P3)

A lead distinguishes merged changes from deployed changes and compares mature cohorts
using actual release and incident records.

**Why this priority**: This closes a gap that repository history alone cannot fill.
**Independent Test**: A synthetic deployment includes two PRs; a verified incident link
changes only the production measures whose denominators contain that deployment.
**Acceptance Scenarios**:
1. **Given** a deployment with repository, environment and exact revision, **when**
   imported, **then** its change set is traceable to verified Git records.
2. **Given** only incident/deployment time proximity, **when** correlated, **then** the
   relationship is a candidate and cannot count as proven change failure.
3. **Given** a 21-day rework comparison, **when** some changes are younger than 21 days,
   **then** immature observations are excluded from the mature result and counted.
4. **Given** two unequal cohorts, **when** compared, **then** task mix, sample size,
   coverage and limitations accompany differences; no causal uplift claim is generated.

### User Story 9 - Assist reviews with explicit policies (Priority: P3)

A maintainer tests a policy in shadow mode, reviews its performance and explicitly enables
narrow check publication or merge actions on selected repositories.

**Why this priority**: Automation depends on evidence quality established earlier.
**Independent Test**: A policy passes on one revision but a new commit or missing required
check makes the old evaluation unusable for action.
**Acceptance Scenarios**:
1. **Given** a new policy, **when** evaluated, **then** it records pass/fail/unknown and
   recommendations without changing host state.
2. **Given** an authorized maintainer and completed shadow report, **when** activation
   is requested, **then** repository scope, action allowlist and current version are explicit.
3. **Given** a changed head, revoked permission or stale evidence, **when** an action
   runs, **then** it is refused and a reason is recorded.
4. **Given** unknown required evidence, **when** evaluated, **then** no merge is authorized;
   disabling enforcement is a separate logged administrative action.

### User Story 10 - Discover public repositories (Priority: P3)

A developer discovers public tools using RepoRadar-style profiles and inspects maintenance
and process evidence independently from private workspace reports.

**Why this priority**: It is an optional acquisition/discovery product with a distinct audience.
**Independent Test**: Public-only fixtures render searchable profiles and a local watchlist;
a private project identifier never appears in public indexes, logs or exported content.
**Acceptance Scenarios**:
1. **Given** a public repository profile, **when** opened, **then** observed facts,
   reconstructed star history and generated narrative have separate provenance labels.
2. **Given** a repository request, **when** submitted, **then** the user previews any
   external issue/message and explicitly confirms that publication.
3. **Given** an archived, removed or newly private repository, **when** refreshed,
   **then** the profile is marked unavailable and source data stops refreshing.
4. **Given** popular repositories, **when** ranked, **then** stars are labelled attention
   signals and never presented as security certification or engineering quality scores.

### Edge Cases

- Empty history, 0/0 ratios, all-bot repositories and unsigned AI activity.
- Merge-heavy histories, renamed repositories, forks, multiple remotes, worktrees,
  force pushes, rebases, squashes, cherry-picks and deleted source records.
- Partial GitHub permissions, expired credentials, rate limiting, truncated pagination
  and source clock skew. Unknown collection completeness cannot be inferred from eligibility.
- Overlapping sessions, mixed models, research-only sessions, multi-repository sessions,
  cumulative counters, duplicate parent/child token totals and unknown prices.
- Daylight-saving gaps/overlaps, late events, unfinished sessions and immature cohorts.
- Malicious repository text, HTML in commit subjects, CSV formula injection, archive
  traversal, oversized traces and source URLs resolving to internal network addresses.
- Membership revocation during export, cross-tenant job IDs, stale policy versions,
  replayed webhooks, deletion during snapshot generation and lost worker leases.

## Requirements *(mandatory)*

### Functional Requirements

#### US1 — Historical baseline
- **FR-001**: Users MUST scan local Git history offline over an explicit time window.
- **FR-002**: Users MUST import supported Sovix and Receipts reports with source version,
  digest and schema validation; unsupported major versions MUST be rejected.
- **FR-003**: Collection MUST expose source successes, failures, exclusions, pagination
  completeness, start/end boundaries and resulting partial status.
- **FR-004**: Repeated collection MUST resume from durable checkpoints and deduplicate
  source revisions while preserving edits as new revisions.
- **FR-005**: Collection MUST be read-only against source repositories and disclose
  required access before a connection is enabled.
- **FR-006**: Invalid inputs MUST fail with stable error codes and remediation without
  publishing fabricated or half-written measurements.

#### US2 — Evidence and presentation
- **FR-007**: Every metric MUST conform to the constitution's complete evidence contract.
- **FR-008**: Users MUST verify canonical calculations against pinned input and version hashes.
- **FR-009**: Cross-repository rollups MUST recompute eligible raw populations or remain
  unavailable when only incompatible summaries exist.
- **FR-010**: AI floors, rework proxies, release proxies and unavailable signals MUST be
  labelled accurately in findings, charts, explanations and exports.
- **FR-011**: Users MUST switch between leadership, investigation and coverage views,
  filter permitted project/repository/window scopes and open evidence without losing scope.
- **FR-012**: Users MUST export a self-contained report and machine-readable manifest
  with the same authorized/suppressed values as the interactive view.

#### US3 — Workspace access
- **FR-013**: Users MUST authenticate, create a workspace and manage their current session.
- **FR-014**: Owner, admin, analyst and viewer roles MUST enforce project-scoped access
  across records, jobs, searches, downloads and background work.
- **FR-015**: Admins MUST connect selected GitHub repositories and revoke or rotate source
  credentials; revoked connections MUST stop further collection.
- **FR-016**: Standard report outputs MUST contain aggregate people signals and omit raw
  contributor identity, prompts, source bodies and tool I/O.
- **FR-017**: Hosted people breakdowns MUST suppress cohorts under five and complementary
  slices; arbitrary identity filters and individual leaderboards MUST be unavailable.
- **FR-018**: Access, connection changes, policy changes and exports MUST emit content-free
  audit records with actor, action, scope, time and result.

#### US4 — Telemetry
- **FR-019**: Admins MUST register scoped collectors with runtime/capability metadata and
  revocable ingestion credentials.
- **FR-020**: Telemetry MUST use a metadata allowlist and strip sensitive/unknown content
  before persistence, quarantine, operational logs and report generation.
- **FR-021**: Ingestion MUST retain session, trace, span, source/runtime version and
  event-time identity sufficient for duplicate detection and lineage.
- **FR-022**: Sessions MUST expose elapsed duration, supported token categories, tool/error
  counts and instrumentation coverage without implying labor or exact billed spend.
- **FR-023**: Delivery MUST tolerate duplicate/late events; conflicting duplicates MUST
  be quarantined with a safe, content-free diagnostic.
- **FR-024**: Unsupported fields and collector outages MUST have explicit availability
  and health states rather than zero-valued observations.

#### US5 — Linkage and cost
- **FR-025**: Session/change/PR relationships MUST record verified or candidate status,
  supporting evidence, method version and revision history.
- **FR-026**: Analysts MUST confirm or reject candidates with a reason; time proximity
  alone MUST NOT create a verified relationship.
- **FR-027**: Every canonical usage cost unit MUST be counted once; price estimates and
  billed allocations MUST remain distinct measures.
- **FR-028**: Allocations per cost unit MUST conserve its amount across eligible PRs and
  an explicit unallocated bucket, including rounding remainder.
- **FR-029**: Cost views MUST disclose price version, currency, cost basis, unpriced usage,
  unmatched sessions and denominator/cohort definition.
- **FR-030**: Corrections to links, prices or allocations MUST create new versions and
  snapshots without rewriting previously issued results.

#### US6 — Reporting workflow
- **FR-031**: Analysts MUST save project-scoped report definitions and request generation.
- **FR-032**: Schedules MUST have a timezone, frequency, explicit daylight-saving behavior,
  enabled state and a deduplicated execution record for each scheduled slot.
- **FR-033**: Published snapshots MUST pin inputs, metric versions, allocation version,
  definition, time window and authorization/redaction policy version.
- **FR-034**: Investigations MUST support assignee, status, reason, due date, comments
  and a source finding/snapshot, with state-change history.
- **FR-035**: Generated reports MUST appear in an in-product inbox; external notifications
  MUST remain disabled unless a separate explicit destination configuration exists.
- **FR-036**: Downloading or sharing a report MUST recheck current project authorization;
  revocation/deletion MUST override link expiry.

#### US7 — Lifecycle and operations
- **FR-037**: Admins MUST configure retention within allowed bounds and inspect next purge times.
- **FR-038**: Deletion MUST purge selected project data and server-held derivatives, revoke
  snapshots/exports, and leave content-free tombstones for restore enforcement.
- **FR-039**: Jobs MUST expose queued/running/retrying/succeeded/partially_succeeded/failed/
  canceled states, attempts, progress, safe errors, cancellation and lease recovery.
- **FR-040**: Operators MUST observe ingestion lag, freshness, queue age, failure rates and
  resource use without collecting customer payloads into platform telemetry.
- **FR-041**: Restore procedures MUST reapply deletion tombstones before access and demonstrate
  documented recovery objectives through a drill.
- **FR-042**: Workspaces MUST see configured usage limits and predictable rejection/reset
  behavior; unknown ingestion loss MUST never appear as complete collection.

#### US8 — Production and comparisons
- **FR-043**: Authorized sources MUST submit deployments with environment and exact revision,
  distinguishing successful, failed, canceled and in-progress attempts.
- **FR-044**: Incident records MUST preserve impact start, detection and recovery timestamps
  separately, and explicitly identify verified versus candidate deployment associations.
- **FR-045**: Production metrics MUST use actual deployment/incident records and expose
  unknown linkage coverage instead of silently substituting Git proxies.
- **FR-046**: Comparisons MUST retain cohort/window definitions, sample sizes, exclusions,
  observation maturity and missing-source coverage.
- **FR-047**: Historical comparisons MUST prohibit causal productivity/ROI claims from
  correlations alone and keep task mix and instrumentation changes visible.
- **FR-048**: Outcome evidence MUST link back to change, deployment and incident source records
  with current authorization applied during drill-down.

#### US9 — Policy controls
- **FR-049**: Maintainers MUST create immutable policy versions using a bounded rule vocabulary
  and record pass/fail/unknown evaluations tied to evidence and exact PR head.
- **FR-050**: Every new policy MUST start disabled or in shadow mode; shadow MUST have no
  Git-host mutation effects.
- **FR-051**: Activation MUST require an admin, repository allowlist, action allowlist and
  completed shadow evaluation record, with an explicit human confirmation.
- **FR-052**: Check publication and merge actions MUST revalidate head, permissions, required
  checks, approvals and evidence freshness immediately before execution.
- **FR-053**: Unknown or stale mandatory evidence MUST require review; the system MUST never
  bypass host branch protections or treat a failed collector as a passing policy.
- **FR-054**: Actions MUST be idempotent and auditable; disabling a policy MUST prevent queued
  unstarted actions and expose already-started outcomes for reconciliation.

#### US10 — Public discovery
- **FR-055**: Public repository ingestion, storage, search and publication MUST be isolated
  from private workspaces and use public-only source credentials.
- **FR-056**: Profiles MUST label source facts, scraped rankings, reconstructed star history
  and optional generated text separately with freshness and provenance.
- **FR-057**: Users MUST search/filter public repositories and maintain a browser-local
  watchlist without a private workspace account.
- **FR-058**: Repository requests MUST disclose and explicitly confirm any externally posted
  issue/message; private report content MUST never be attached automatically.
- **FR-059**: Popularity MUST not be presented as quality or security certification; public
  benchmarks MUST state that their population is not representative of private teams.
- **FR-060**: Removed/private/archived repositories MUST receive explicit lifecycle labels;
  future collection MUST honor access changes and source failures.

### Non-Functional Requirements

- **NFR-001**: A user can open a cached project overview within two seconds at the 95th
  percentile on the agreed benchmark dataset; evidence drill-down within one second.
- **NFR-002**: Initial hosted target is 50 repositories, 100,000 source records and 1 million
  accepted spans per workspace per day; larger tenants require measured capacity review.
- **NFR-003**: Valid metadata becomes queryable within 60 seconds at the 95th percentile
  under that load; current watermark and any loss/rejection counts remain visible.
- **NFR-004**: The hosted monthly availability objective is 99.5%, excluding announced
  maintenance; recovery point is 24 hours and recovery time four hours for initial release.
- **NFR-005**: Interactive and exported reports MUST meet WCAG 2.2 AA criteria applicable
  to them, keyboard operation, meaningful labels, reduced motion and non-color status cues.
- **NFR-006**: Reports MUST work at 360px viewport width with contained wide tables and
  readable labels; no page-level horizontal overflow.
- **NFR-007**: No application path may disclose another tenant's existence or contents through
  identifiers, counts, storage keys, caches, errors, downloads or background jobs.
- **NFR-008**: Canonical report content MUST be deterministic; external URLs, remote fonts
  or scripts MUST NOT be required for offline report rendering.
- **NFR-009**: User-facing timestamps MUST identify timezone; stored event instants use UTC
  and all reporting windows are half-open, start inclusive and end exclusive.
- **NFR-010**: Secrets and content excluded by policy MUST be absent from accepted data,
  diagnostic logs, dead-letter records, backups and standard exported evidence.
- **NFR-011**: All public contracts MUST be versioned; breaking changes require migration,
  compatibility fixtures and a documented deprecation window of at least 90 days.
- **NFR-012**: Initial deterministic analytics MUST require zero model calls; optional
  narrative generation cannot alter metric values or bypass evidence restrictions.

### Key Entities

Workspace, Membership, Project, Repository, Connector, Collector, ImportBatch, SourceRevision,
Job, Session, Span, UsageUnit, PriceVersion, EvidenceLink, AllocationVersion, MetricDefinition,
MetricResult, Snapshot, ReportDefinition, Schedule, Export, Investigation, AuditEvent,
RetentionPolicy, DeletionRequest, Deployment, Incident, PolicyVersion, PolicyEvaluation,
ActionRequest and PublicRepositoryProfile. Detailed fields/invariants are in [data-model.md](data-model.md).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user obtains an offline report from the reference repository in five
  minutes or less without network, telemetry or account setup after installing the CLI.
- **SC-002**: All reference metrics reproduce their expected arithmetic and hashes; a
  changed source or definition creates a different versioned result.
- **SC-003**: All cross-tenant and project-boundary acceptance probes deny access consistently.
- **SC-004**: Duplicate delivery and many-to-many allocation fixtures conserve exactly
  100% of each canonical cost unit, including the unallocated remainder.
- **SC-005**: A reviewer can move from finding to arithmetic and source evidence within
  three interactions in the reference report.
- **SC-006**: Every missing, unsupported, partial and suppressed fixture is labelled
  consistently across the report, download and machine-readable interface.
- **SC-007**: Retry and daylight-saving fixtures create one report per logical schedule slot.
- **SC-008**: A completed deletion and restore drill leaves no governed payload accessible
  through server-held snapshots, jobs, search or exports.
- **SC-009**: No stale-head, revoked-access or unknown-required-evidence policy fixture
  authorizes a merge action.
- **SC-010**: In a proposed pilot of three willing teams, at least two can document a
  concrete review-process or tool-spend decision informed by the report. This is a business
  validation target, not a claim of customer demand or a prerequisite for writing code.

## Assumptions

- The working product name is Sovix Evidence; the requested repository folder is `Git ai`.
- GitHub is the initial hosted source; other Git hosts use future adapters.
- Existing local report artifacts are research inputs, not approved public demo data.
- The initial local profile is single-user; the hosted profile uses explicit memberships.
- Raw prompts, source bodies and individual productivity rankings are outside initial scope.
- Token estimates and externally supplied billing allocations are separate measures; no
  accounting-grade ROI or invoice reconciliation is claimed without provider billing data.
- Production integration begins with explicit deployment/incident ingestion, not automatic
  incident causation inference. GitHub merge automation is optional; production deployment
  automation is excluded.
- Commercial subscription checkout, email delivery, native mobile apps and arbitrary
  plug-in execution are excluded. Entitlements are administrator-configured pilot limits.
- Tests for the risk-bearing invariants and story acceptance scenarios are required.
