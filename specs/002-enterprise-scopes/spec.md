# Feature Specification: Enterprise Scopes, Teams and Person-Scope Gating

**Feature Branch**: `002-enterprise-scopes`  
**Created**: 2026-09-12  
**Status**: Draft  
**Input**: Specify the enterprise multi-entity model required by ADR-011, ADR-012 and ADR-013:
a uniform scope descriptor across repository/team/project/organization, pseudonymous
contributor entities, organization aggregation arithmetic, team-scoped RBAC, person-scope
access gating, and enterprise-tier capacity targets.

## Product Definition

Spec 001 reports at one aggregation level: the project. This specification adds the levels an
enterprise buyer asks for first (organization and team), adds the pseudonymous contributor as
an orthogonal filter dimension, and states the arithmetic and access rules that keep those
levels honest.

This specification adds no new tenancy boundary. The workspace remains the only isolation
boundary (NFR-007). Organization is the workspace viewed as a reporting scope; team is a
reporting and access dimension inside it.

This specification supersedes parts of spec 001. Superseded text is named explicitly in
[Supersessions](#supersessions). Requirements already covered by spec 001 are referenced by ID
and not restated.

### Delivery scope

| Milestone | User value | Required stories | Shipping gate |
|---|---|---|---|
| E0 | Scope descriptor and contributor pseudonymization | Shared foundation | Uniform scope resolution, HMAC key isolation, no ranking primitive in any contract |
| E1 | Organization overview with honest arithmetic | US11 | Recomputed org values, per-level coverage, disclosed project-sum discrepancy |
| E2 | Team reporting and team-scoped grants | US12 | As-of-window team composition, team grant isolation probes |
| E3 | Self view and subject rights | US13 | Verified identity link, self view at full fidelity, view-of-me audit readable by subject |
| E4 | Audited named-person operational view | US14 | Flag off by default, per-query audit, subject notification |
| E5 | External client delivery | US15 | External viewer cannot reach contributor dimension at any k |

## User Scenarios & Testing *(mandatory)*

### User Story 11 - See the whole organization (Priority: P1)

An engineering leader with organization-level access opens one view covering every repository
in the workspace, sees which of them actually reported, and understands why the projects inside
it do not sum to it.

**Why this priority**: It is the first question an enterprise buyer asks, and the level at which
naive aggregation produces numbers that are not any real quantity.

**Independent Test**: A fixture of 12 repositories across 4 projects, with 3 repositories shared
between 2 projects each and 2 repositories reporting nothing, produces an organization overview
whose ratio and percentile values equal a direct recomputation over the deduplicated union, and
whose coverage states 10 of 12 repositories reporting.

**Acceptance Scenarios**:

1. **Given** projects with unequal populations, **when** an organization overview is computed,
   **then** every ratio and percentile is recomputed from the deduplicated union population and
   no value equals the mean or median of the per-project values.
2. **Given** a repository mapped to two projects, **when** an organization count is computed,
   **then** the repository's records are counted once at organization level, remain whole in each
   project, and the view states that project values may sum to more than the organization value.
3. **Given** a scope whose eligible population is empty, **when** its metric is computed,
   **then** availability is `unavailable` with a reason and the value is null.
4. **Given** 2 of 12 repositories with no collected evidence in the window, **when** the overview
   loads, **then** it states the reporting repository count, the total repository count and the
   resulting partial status before any headline value.

---

### User Story 12 - Report on a team (Priority: P1)

A team lead reports on their own team over a window during which two people joined and one left,
and the numbers reflect who was on the team during the window rather than who is on it today.

**Why this priority**: Team rollup is the enterprise requirement that the spec 001 model cannot
express at all, and as-of-window composition is the property most implementations get wrong.

**Independent Test**: A team with a joiner at window day 10 and a leaver at window day 20
produces a population that includes the joiner's records only from day 10 and the leaver's only
until day 20, and changing today's membership does not change the historical result.

**Acceptance Scenarios**:

1. **Given** a team whose composition changed inside the window, **when** a team metric is
   computed, **then** composition is resolved per record against the record's event time, not
   against query time.
2. **Given** records that cannot be attributed to a resolved contributor, **when** a team metric
   is computed, **then** those records are excluded and their count appears in exclusions.
3. **Given** a team of fewer than five distinct human contributors, **when** a hosted team
   breakdown is requested, **then** the breakdown and its complementary slices are suppressed.
4. **Given** an analyst holding only a team-scoped grant, **when** they request a project or
   organization scope containing repositories outside that grant, **then** the request is denied
   and the existence of the excluded repositories is not revealed.

---

### User Story 13 - See my own work (Priority: P2)

A contributor links their identity, opens a view of their own activity at full fidelity with no
suppression, and can see every named-person view another actor took of them.

**Why this priority**: Self-knowledge is the requirement FR-017 forbade by accident, and it is
the requirement that makes the person scope defensible to the person.

**Independent Test**: A user with one verified identity link and a second merged alias sees the
union of both identities' records with no `k<5` suppression, sees nothing about any other
contributor, and reads an audit list containing exactly the named-person queries whose subject
was them.

**Acceptance Scenarios**:

1. **Given** an authenticated user with a verified contributor link, **when** they open their own
   view, **then** all their records are shown at full fidelity with no suppression applied.
2. **Given** the same user, **when** they request a contributor filter for any contributor they
   are not linked to, **then** the request is denied regardless of their role.
3. **Given** two contributor identities merged into one by an audited alias action, **when** the
   subject opens their own view, **then** both identities' records appear as one population.
4. **Given** an owner who ran a named-person query about the subject, **when** the subject opens
   their view-of-me record, **then** the actor, window, scope and time of that query are listed.

---

### User Story 14 - Attribute cost to a named person under audit (Priority: P3)

An owner enables individual attribution for the workspace as a recorded configuration change,
inspects one contributor inside a project they administer, and the contributor learns it happened.

**Why this priority**: It is a genuine leadership requirement, it is the highest-risk capability
in this specification, and it is safe only because ranking does not exist.

**Independent Test**: With the flag off, every named-person request is denied for every role.
With the flag on, an owner's request succeeds inside an administered project, writes one audit
event and one subject inbox entry, and still cannot order contributors by any metric.

**Acceptance Scenarios**:

1. **Given** `individual_attribution_enabled` is false, **when** an owner requests a named-person
   view, **then** it is denied and the denial reason names the disabled workspace flag.
2. **Given** the flag is true and an admin administers the project, **when** they open a
   named-person view, **then** one `AuditEvent` records actor, subject handle, scope and window,
   and one notification is delivered to the subject's in-product inbox.
3. **Given** the flag is true, **when** any principal requests contributors ordered by a metric,
   a contributor percentile rank against peers, or a top-N or bottom-N contributor list, **then**
   no such request shape is accepted by any interface.
4. **Given** an analyst and the flag is true, **when** they request a named-person view, **then**
   it is denied because analyst is not an eligible role.

---

### User Story 15 - Give an external client a scoped view (Priority: P3)

An owner grants an external client access to one project's published evidence without exposing
the contributor dimension, other projects, or the organization level.

**Why this priority**: Spec 001 promises this workflow (spec.md:74-75) but defines no principal
that implements it.

**Independent Test**: An external viewer opens an authorized project snapshot, and every
contributor-dimension request, organization-scope request and other-project request returns not
found without revealing existence.

**Acceptance Scenarios**:

1. **Given** an external viewer with one project grant, **when** they request organization scope,
   **then** it is not found and the workspace repository count is not disclosed.
2. **Given** an external viewer, **when** they open any authorized report, **then** no contributor
   handle, contributor count breakdown or team breakdown appears in the view or its export.
3. **Given** an external viewer whose grant is revoked, **when** they open a previously issued
   export link, **then** access is denied before expiry per FR-036.

---

### Edge Cases

- A team with zero effective members in the window, a team whose only members are bots, and a
  team whose parent chain reaches the depth limit.
- A team-to-project mapping that opens or closes inside the window, and a repository whose
  project mapping closes inside the window.
- A contributor whose alias merge occurs after a snapshot was published.
- A contributor observed only through telemetry with no Git records, and one observed only
  through Git with no telemetry.
- Two users claiming the same contributor identity, and one user linked to twenty identities.
- A user whose membership is revoked while a self view is open, and a subject whose contributor
  row is retired while a view-of-me record still names them.
- Rotation of the per-workspace contributor HMAC key while historical digests exist.
- An organization scope in which every repository is unavailable, and one in which exactly one
  repository is available.
- A project containing a repository that no longer exists in any project after a mapping closes.
- An external viewer in a workspace where `individual_attribution_enabled` is true.
- An AIBOM document whose `scope` is `team` but whose `repository` member is populated, and one
  whose `scope` is `project` but whose `repository` member is absent.
- An AIBOM import whose `author_email` digests to a contributor already merged into an alias, and
  one whose `author_email` is empty.
- A push webhook arriving for a repository whose project mapping has closed, and a webhook replayed
  after the source repository was renamed.
- A window that begins before installation for some repositories in an organization scope and after
  installation for others.
- An AIBOM document whose signature algorithm is the HMAC fallback rather than Ed25519.

## Requirements *(mandatory)*

### Functional Requirements

#### Scope model

- **FR-061**: Every metric request, report definition and metric result MUST carry a scope
  descriptor consisting of `level`, `ids` and an optional `contributor_id`. `level` MUST be one
  of `repository`, `team`, `project`, `organization`. No other level may exist.
- **FR-062**: Scope resolution MUST produce an explicit population of source records before any
  metric is computed, and that population MUST be reported as a named input per FR-007.
  Resolution per level is exactly:

  | Level | `ids` | Resolved population |
  |---|---|---|
  | `repository` | Repository IDs | Eligible records whose repository is in `ids` and readable by the principal |
  | `team` | Team IDs | Eligible records in the team's effective repository domain that are attributed to a contributor in the team's effective contributor domain |
  | `project` | Project IDs | Eligible records in repositories effective-mapped to a project in `ids` during the record's event time |
  | `organization` | Empty; the workspace is implied | Eligible records in every repository in the workspace readable by the principal |

- **FR-063**: A team's effective repository domain MUST be the repositories effective-mapped to
  the projects effective-mapped to that team and its descendant teams at the record's event time.
  A team's effective contributor domain MUST be the contributors linked to memberships whose
  `TeamMembership` interval contains the record's event time, for that team and its descendant
  teams. Decision: team scope is the intersection of the two domains, because a team member's
  work in a repository the team does not own is not the team's delivery and a non-member's work
  in the team's repository is not the team's labor.
- **FR-064**: Records that cannot be attributed to a resolved contributor MUST be excluded from
  any `team` scope or contributor-filtered population, and their count MUST appear in the metric
  result's exclusions. They MUST NOT be silently attributed to any contributor.
- **FR-065**: `contributor_id` MUST be an orthogonal filter applied after level resolution, MUST
  be permitted at every level, and MUST be subject to FR-089 through FR-096 without exception.
- **FR-066**: Scope resolution MUST use effective-dated membership, team membership, team-project
  and project-repository intervals evaluated against the record's event time, never against query
  time. A composition change after a window MUST NOT change that window's computed result.

#### Entities

- **FR-067**: The system MUST provide a `Team` entity per ADR-011, with unique
  `workspace_id`+`slug`, a `parent_team_id` in the same workspace, a nesting depth of at most 5,
  and write-time rejection of cycles. A team MUST NOT be an isolation boundary.
- **FR-068**: The system MUST provide effective-dated `TeamMembership` and `TeamProject` join
  records following the `ProjectRepository` pattern (data-model.md:26). Decision: `TeamProject` is
  added beyond ADR-011's field list because team-scoped grants and FR-063 both require a team to
  project association and no other entity expresses one.
- **FR-069**: The system MUST provide a `Contributor` entity whose only identity representation is
  `identity_digest` (HMAC-SHA256 over the normalized lowercase author email, keyed per workspace)
  and a `handle` derived from that digest. Plaintext name and email MUST NOT appear in any column,
  index, log, audit record, job payload, cache, backup or export.
- **FR-070**: The per-workspace contributor HMAC key MUST be held in the secret manager, MUST NOT
  be returned by any API, MUST NOT be written into any snapshot, export or published artifact, and
  MUST NOT be derivable from any artifact's contents.
- **FR-071**: The system MUST provide `ContributorAlias` so that multiple identity digests resolve
  to one contributor. Merging MUST be an explicit audited act by an admin or owner, MUST NOT be
  inferred from display names or digest similarity, and MUST be reversible only by a further
  audited act that creates a new record rather than deleting the original.
- **FR-072**: The system MUST provide a `ContributorLink` binding a `User` to a `Contributor` by
  verified control of the email address, or by an audited admin action. Decision: this entity is
  added beyond ADR-011 because ADR-013 rule 3 requires the binding and no spec 001 entity holds
  it. A display name MUST NOT imply a link.
- **FR-073**: `ReportDefinition` MUST carry `scope_level` and `scope_ids` as its canonical scope
  representation. `project_ids` and `repository_ids` MUST become derived projections of that pair
  and MUST NOT be independently writable after migration. This supersedes FR-031's restriction to
  project scope.
- **FR-074**: `Membership` MUST carry `team_grant_ids` and an `is_external` flag in addition to
  its existing `role` and `project_ids`. `Workspace` MUST carry `individual_attribution_enabled`,
  defaulting to false, changeable only by an owner, and recorded as an audited configuration
  change.

#### Aggregation semantics

- **FR-075**: A `MetricResult` at any level MUST be computed from the union of eligible raw
  records at that level. Combining previously computed child `MetricResult` values MUST NOT be
  used for any ratio, percentage, percentile, or any metric whose definition carries a
  denominator. This extends FR-009 to the team and organization levels.
- **FR-076**: Counts and sums MAY be computed additively from child populations only when the
  contributing records are provably disjoint by unique source ID. Deduplication by unique
  repository ID and unique source revision ID MUST be applied before any additive combination.
- **FR-077**: A percentile at any level MUST be recomputed from the exact union distribution of
  per-record values. A median of medians, a mean of percentiles, or an approximate sketch whose
  output depends on insertion order MUST NOT be produced.
- **FR-078**: A scope whose eligible population is empty MUST yield availability `unavailable`
  with a null value and a reason. It MUST NOT yield zero. A zero requires an observed complete
  eligible population per metrics.md.
- **FR-079**: Coverage MUST be computed and displayed per level. An organization or team overview
  MUST state the number of repositories that reported evidence in the window, the number of
  repositories in scope, and the resulting availability, before any headline value is shown.
- **FR-080**: A repository belonging to several projects MUST contribute once to an organization
  value and wholly to each project value. The interface and the export MUST both state that
  project values may sum to more than the organization value, and MUST identify the count of
  repositories shared across projects in the window.
- **FR-081**: A metric result MUST record which levels it was computed at and MUST NOT be reused
  as an input to a result at a different level. A snapshot MUST pin the scope descriptor it was
  computed for.
- **FR-082**: Organization-level metric computation MUST be served from per-repository, per-day
  partial aggregates that carry raw numerator counts, raw denominator counts, deduplication keys
  and, for percentile metrics, the exact multiset of per-record values. Partial aggregates MUST
  NOT carry precomputed ratios or percentiles, because a precomputed ratio cannot be recombined
  without violating FR-075.
- **FR-083**: A partial aggregate MUST be invalidated and recomputed when its repository's source
  records change, when a metric definition version changes, or when a project or team mapping
  affecting it changes. A stale partial aggregate MUST NOT serve a query; its scope MUST report
  partial availability until recomputation completes.

#### Access control

- **FR-084**: Roles MUST remain owner, admin, analyst and viewer. Decision: no distinct `client`
  role is added. A client is a `viewer` whose membership carries `is_external` true, because every
  capability a client needs is a strict subset of viewer and a fifth role would multiply the
  authorization matrix by scope level without adding a distinct capability set.
- **FR-085**: `is_external` MUST additionally deny, for that principal, every organization-scope
  request, every team-scope request, every contributor-dimension value at any cohort size, and
  every scope containing a project not explicitly granted. These denials MUST NOT be relaxable by
  any workspace setting.
- **FR-086**: A grant MUST be expressible as an all-projects flag, an explicit project list, or an
  explicit team list. A team grant MUST resolve to the projects effective-mapped to that team and
  its descendants, evaluated at request time for authorization and at record event time for
  population resolution.
- **FR-087**: Read access by role and scope level MUST be exactly:

  | Scope level | Owner | Admin | Analyst | Viewer (internal) | Viewer (external) |
  |---|---|---|---|---|---|
  | `repository` | All | All | Granted projects' repositories | Granted projects' repositories, aggregate only | Granted project's repositories, aggregate only |
  | `team` | All | All | Granted teams and granted projects' teams | Granted teams, aggregate only, `k<5` enforced | Denied |
  | `project` | All | All | Granted projects | Granted projects, aggregate only | Granted project only |
  | `organization` | Yes | Yes | Only if the grant is all-projects | Only if the grant is all-projects, aggregate only | Denied |
  | `contributor` filter, self | Yes | Yes | Yes | Yes | Denied |
  | `contributor` filter, another person, hosted | Only with `individual_attribution_enabled` and within an administered project | Same as owner | Denied | Denied | Denied |
  | `contributor` filter, another person, local | Yes | Yes | Yes | Yes | Not applicable |

- **FR-088**: An analyst or viewer holding partial grants MUST receive a scope-resolution result
  restricted to their grant, and the response MUST state that the scope was restricted. It MUST
  NOT silently compute over a smaller population while presenting an organization label.
- **FR-089**: Inaccessible scopes MUST return not found rather than forbidden, MUST NOT disclose
  team names, project names, repository counts or contributor counts, and MUST apply the same rule
  to jobs, caches, exports, search and background work per NFR-007.

#### Person scope

- **FR-090**: A ranking primitive MUST NOT exist. No interface may accept or produce ordering of
  contributors by a metric value, a percentile rank of one contributor against peers, or a top-N
  or bottom-N contributor selection. This MUST be enforced by the absence of the capability in the
  schema and the query surface, not by a policy setting, so that no configuration can enable it.
- **FR-091**: Self view MUST be a right rather than a grant. An authenticated user MUST always see
  data for every contributor identity linked to them, at full fidelity, with no `k<5` suppression,
  in local and hosted mode, at every scope level their grant permits.
- **FR-092**: A contributor filter naming an identity the requesting user is not linked to MUST be
  denied in hosted mode unless the request satisfies every condition of the named-person row of
  FR-087: the actor is owner or admin, `individual_attribution_enabled` is true, and the scope is
  inside a project that actor administers.
- **FR-093**: Every named-person query MUST write one `AuditEvent` recording actor, subject
  contributor handle, scope descriptor, window and time, and MUST deliver one notification to the
  subject's in-product inbox per FR-035. The audit write MUST succeed before the result is
  returned; a failed audit write MUST fail the query.
- **FR-094**: A subject MUST be able to list every named-person query whose subject was them,
  including actor, scope and window, for the audit retention period.
- **FR-095**: A person-scoped artifact leaving the system MUST carry only the pseudonymous handle.
  No export, snapshot, published artifact or machine-readable manifest may carry a plaintext
  identity, regardless of the requesting role or the workspace flag.
- **FR-096**: Individual coaching output MUST be generated for and visible to its subject and MUST
  NOT appear in any other principal's view of that subject, including an owner's named-person view.
- **FR-097**: Local mode MUST permit individual views of the local machine's repositories without
  suppression and without an identity link, and MUST resolve display names live from the local Git
  repository at render time rather than from the platform database.
- **FR-098**: Hosted team and project breakdowns of at least five distinct human contributors MUST
  continue to apply `k<5` and complementary suppression per FR-017 as amended. Bot contributors
  MUST NOT count toward the threshold of five.

#### Migration and compatibility

- **FR-099**: Existing report definitions MUST migrate to `scope_level` `project` with `scope_ids`
  equal to their `project_ids`, or to `scope_level` `repository` when `project_ids` is empty and
  `repository_ids` is not. A definition specifying both MUST migrate to `project` level with the
  repository list retained as an eligibility filter, and the migration MUST record which rule it
  applied per definition.
- **FR-100**: Snapshots published before this feature MUST remain readable with their original
  scope interpretation and MUST NOT be recomputed at a new level.
- **FR-101**: Contributor rows MUST be derivable for historical source revisions without
  re-collecting them, and a workspace that has never resolved contributors MUST report
  contributor-dimension metrics as unavailable rather than as zero contributors.
- **FR-102**: Rotating the per-workspace contributor HMAC key MUST create new digests, MUST
  preserve existing contributor rows and their aliases by rewriting digests inside the trusted
  process, and MUST NOT orphan historical attribution. A rotation MUST be an audited act.

#### Reconciliation with the existing AIBOM scope enum

The sibling product Prompture ships an HMAC or Ed25519 signed AIBOM document whose `Scope` enum
is `personal | project | team | enterprise` (`packages/aibom/aibom.go:50-63`). Its declared
semantics differ from its names.

- **FR-103**: The canonical scope vocabulary MUST be the four levels of FR-061. The AIBOM enum
  MUST be treated as an external contract translated by a versioned adapter per Principle IV, and
  MUST NOT be adopted as the internal vocabulary. Decision: the AIBOM enum is canonical for the
  AIBOM document format only, because it is already signed into issued artifacts that cannot be
  rewritten, and FR-061 is canonical everywhere else.
- **FR-104**: The adapter MUST apply exactly this mapping, which is derived from the enum's
  declared population rather than from its member names:

  | AIBOM value | Declared population (aibom.go:53-56) | Canonical level | Note |
  |---|---|---|---|
  | `personal` | Commits whose author email is in the caller's own identities | `contributor` filter, self | Maps to the self-view row of FR-087, not to a level |
  | `project` | All commits to a single `repo_id`, an `owner/repo` string | `repository` | Named project, is actually repository scope |
  | `team` | All commits and prompts across the org, filtered by `org_id` | `organization` | Named team, is actually organization scope |
  | `enterprise` | Identical to `team`, plus `policy_violations` | `organization` | Not a level; a content variant of the same population |

- **FR-105**: The adapter MUST record that the AIBOM enum expresses only three distinct
  populations (self, one repository, whole organization) and no team-level or multi-repository
  project-level population at all. An AIBOM import MUST NOT be presented as evidence at
  `team` or `project` level, and a request to do so MUST return unavailable with that reason
  rather than a value computed over a different population.
- **FR-106**: An AIBOM document whose scope is `personal` MUST be gated on import and on export by
  FR-091 and FR-092. Importing a `personal` AIBOM about a contributor the requesting user is not
  linked to MUST be denied even though the source system permits generating it.
- **FR-107**: Emitting an AIBOM document from a canonical `team` or `project` scope MUST be
  refused, because the format has no value that denotes those populations and reusing `team` for a
  team would produce a signed artifact whose scope label contradicts its contents. Extending the
  AIBOM format is out of scope here and requires a versioned format change under NFR-011.

#### Plaintext identity at the ingestion boundary

Prompture stores contributor identity in plaintext. `ExternalIdentity.ExternalID` holds a raw
email or username (`packages/identity/identity.go:16-23`), `AutoBridge` matches a Git email to a
user by plaintext comparison (identity.go:33-35), `UserDataExport.Email` is plaintext
(`packages/privacy/privacy.go:23`), and the GitHub push webhook forwards `author_email` and
`author_name` verbatim into ingest (`connectors/source/github/webhook.go:115-124`). Two further
leaks sit inside the signed AIBOM document itself: `CommitEntry.AuthorEmail` and
`CommitEntry.PromptPreview`, the latter documented as "first 100 chars of matched prompt"
(aibom.go:52-63).

- **FR-108**: Any adapter importing from a source that carries plaintext contributor identity
  MUST compute the keyed `identity_digest` of FR-069 at the ingestion boundary, in the same
  process that first parses the payload, before the record is written to any table, queue,
  cache, log, metric label, error message or dead-letter record.
- **FR-109**: Plaintext contributor name and email MUST NOT be persisted even transiently. A
  staging table, raw-payload column, quarantine row, replay buffer or job argument containing a
  plaintext identity MUST NOT exist. Where spec 001 retains a sanitized source payload
  (data-model.md:31), the identity fields MUST already be replaced by the digest at the point of
  sanitization, not redacted at read time.
- **FR-110**: An imported record carrying a prompt, prompt preview, prompt excerpt or any
  substring of a prompt MUST have that content discarded at the ingestion boundary and MUST NOT be
  stored, counted as evidence or re-exported. A truncated prompt is prompt content, and FR-020
  applies to it in full.
- **FR-111**: Import from a plaintext-identity source MUST NOT create a path by which that
  plaintext re-enters an artifact. An artifact generated from imported records MUST carry only
  pseudonymous handles per FR-095, regardless of what the source artifact carried.
- **FR-112**: A leak test MUST exist as an acceptance gate. It MUST seed a known corpus of
  plaintext identities and prompt fragments into every supported import path, then assert their
  total absence from the database, every index, every log stream, every job payload, every
  quarantine and dead-letter record, every backup artifact, every export and every published
  artifact. The test MUST fail on any single occurrence.

#### Artifact signing and verification

- **FR-113**: An artifact published at `organization` scope MUST carry a detached signature
  recording signer identity, signing time, algorithm, verification location and value, following
  the precedent of the AIBOM `Signature` struct (aibom.go:107-115).
- **FR-114**: The signature MUST be computed over a canonical serialization of the document with
  the signature member removed, following the `BodyWithoutSignature` precedent (aibom.go:183-185)
  and the RFC 8785 canonicalization that metrics.md already requires. The signed body MUST be
  byte-identical to the body a verifier reconstructs from the artifact.
- **FR-115**: Signing MUST use an asymmetric algorithm. Decision: Ed25519, matching the preferred
  branch of the Prompture signer (`packages/aibom/signing.go:104-124`), and its HMAC-SHA256
  fallback MUST NOT be used for externally verifiable artifacts, because HMAC verification
  requires the verifier to hold the signing secret, which makes independent verification
  impossible and turns every verifier into a party that can forge artifacts.
- **FR-116**: Signature verification MUST NOT require the contributor HMAC key of FR-070, and a
  verifier in possession of the signing public key MUST NOT thereby gain any ability to
  de-pseudonymize the artifact.

#### Source coverage completeness

Prompture's commit ingestion is GitHub push-webhook based (webhook.go:56-135) and carries only
sha, repository full name, author, message, changed file lists, branch and timestamp. It has no
diffs and no pull request, review or check records.

- **FR-117**: Every repository MUST record its ingestion mode and its observation start instant,
  distinguishing webhook-delivered, backfilled and imported evidence. A repository whose evidence
  began at app installation MUST record that instant as the start of observation.
- **FR-118**: A scope whose window begins before a repository's observation start MUST report that
  repository as partially covered for that window, MUST state the uncovered interval, and MUST NOT
  treat the pre-installation interval as an observed zero. At `organization` scope this MUST be
  aggregated into a statement of how many repositories have an uncovered interval in the window,
  displayed alongside the reporting-repository count of FR-079.
- **FR-119**: Work that was never pushed to the configured host is unobservable through webhook
  ingestion. Metrics derived solely from webhook evidence MUST be labelled as covering pushed work
  only, consistent with the detectable-floor treatment of FR-010, and MUST NOT be described as a
  complete population.
- **FR-120**: A source providing commits without pull request, review or check records MUST render
  every metric requiring those inputs as unavailable with a missing-capability reason, and MUST NOT
  substitute a commit-derived proxy without the proxy labelling of FR-010.

### Non-Functional Requirements

- **NFR-013**: The enterprise tier capacity targets supersede NFR-002 for workspaces provisioned
  at that tier. NFR-002's figures are retained as the pilot tier. Targets per workspace are:

  | Dimension | Pilot tier (NFR-002) | Enterprise tier | Basis |
  |---|---|---|---|
  | Repositories | 50 | 2,000 | 2,000 engineers at roughly one active repository per engineer, allowing for archived repositories still in scope |
  | Projects | Not stated | 300 | Client or product groupings at an organization of this size |
  | Teams | Not applicable | 500, depth at most 5 | Roughly 2,000 engineers in teams of 6 to 10, plus grouping tiers |
  | Distinct contributors | Not stated | 5,000 | 2,000 current engineers plus departed contributors retained in history plus bots |
  | Source revisions ingested | 100,000 per day | 500,000 per day steady state; 5,000,000 per day during backfill | Commits, PRs, reviews, review comments and checks at roughly 250 revisions per engineer-week |
  | Source revisions resident | Not stated | 250,000,000 | 500,000 per day at the 730-day evidence retention ceiling, plus historical backfill |
  | Accepted spans | 1,000,000 per day | 20,000,000 per day | 2,000 engineers at 10 instrumented sessions per day at roughly 1,000 spans per session |
  | Spans resident | Not stated | 600,000,000 | 20,000,000 per day at the 30-day default span retention |
  | Concurrent interactive principals | Not stated | 200 | 10% of engineers plus leadership during a reporting peak |

- **NFR-014**: Interactive latency targets by scope level supersede NFR-001 for the organization
  level only. Repository, team and project overviews retain the 2-second p95 and 1-second evidence
  drill-down of NFR-001. An organization overview MUST load within 5 seconds at the 95th
  percentile from current partial aggregates at enterprise-tier volume, and evidence drill-down
  from it within 2 seconds. Decision: the organization bound is relaxed rather than met by
  approximation, because FR-077 forbids approximate percentiles and a false 2-second promise would
  be met by violating the arithmetic this specification exists to protect.
- **NFR-015**: An organization-level query MUST NOT scan raw source revisions or spans. It MUST
  read at most one partial-aggregate row per repository per day per metric in the window. At the
  enterprise tier with a 90-day window this bounds a single organization metric at 180,000
  partial-aggregate rows, which MUST be stated in capacity planning as the dominant cost.
- **NFR-016**: Partial-aggregate recomputation MUST keep an organization overview no more than 15
  minutes behind the accepted-evidence watermark at the 95th percentile at enterprise-tier ingest
  rates, and the overview MUST display that watermark. Staleness MUST be visible rather than
  silently tolerated.
- **NFR-017**: Percentile computation at organization level MUST be exact and reproducible. The
  same pinned inputs and calculator version MUST produce the identical canonical value regardless
  of partition order, worker count or recomputation order.
- **NFR-018**: Team composition resolution MUST be a bounded operation. Resolving the effective
  membership and project mapping of a team and its descendants MUST complete within 100
  milliseconds at the 95th percentile at 500 teams and depth 5, and MUST NOT issue a query per
  descendant team.
- **NFR-019**: Scope resolution MUST be isolation-preserving under NFR-007 at every level. A team
  ID, project ID, contributor handle or repository ID supplied by a client MUST never widen the
  resolved population beyond the principal's server-derived grant, and a guessed identifier MUST
  NOT change any response in a way that reveals existence.
- **NFR-020**: Named-person audit writes MUST sustain 100 events per second without blocking
  interactive queries beyond the FR-093 ordering requirement, and audit volume MUST NOT be reduced
  by sampling.
- **NFR-021**: Contributor digest computation MUST occur only inside the trusted process boundary.
  Plaintext email MUST NOT cross a process, queue, log or storage boundary, and a leaked partial
  aggregate, snapshot or export MUST NOT permit re-identification without the workspace key.
- **NFR-022**: Digesting at the ingestion boundary MUST NOT become the ingestion bottleneck. At the
  NFR-013 enterprise rate of 500,000 source revisions per day it MUST add no more than 1
  millisecond per record at the 95th percentile, and MUST NOT require a network call, because a
  remote key fetch per record would make FR-108 impractical and invite a caching workaround that
  keeps plaintext resident.
- **NFR-023**: Signature verification MUST work offline, without contacting the issuing system and
  without any shared secret, consistent with NFR-008's offline rendering requirement.
- **NFR-024**: Backfilling an enterprise-tier organization MUST reach a stated coverage floor
  within a bounded time, and progress MUST be observable per repository. At the NFR-013 backfill
  rate of 5,000,000 source revisions per day, a 2,000-repository organization with 250,000,000
  resident revisions requires approximately 50 days of continuous backfill. Decision: an
  organization overview MUST therefore be usable while backfill is incomplete, with FR-118
  coverage disclosure, rather than gated on backfill completion.

### Key Entities

| Entity | Required fields beyond scope/ID | Relationships and constraints |
|---|---|---|
| Team | name, slug, parent_team_id nullable, status, version, created_at, updated_at | Unique workspace+slug; parent in same workspace; depth at most 5; cycles rejected at write; not a security boundary |
| TeamMembership | team_id, membership_id, valid_from, valid_until nullable, version, created_at, updated_at | No overlapping active interval per team+membership; composition resolved as of record event time |
| TeamProject | team_id, project_id, valid_from, valid_until nullable, version, created_at, updated_at | No duplicate active pair; resolves a team's repository domain through ProjectRepository |
| Contributor | identity_digest, handle, kind, first_observed_at, last_observed_at, status, version, created_at, updated_at | Unique workspace+identity_digest; kind human/bot/unknown by explicit rule set; no project_id because contributors span projects; plaintext identity never persisted |
| ContributorAlias | contributor_id, identity_digest, merged_by, merged_at, recorded_at, schema_version, digest, supersedes_id nullable | One digest resolves to at most one contributor across Contributor and ContributorAlias; merge is audited and never inferred |
| ContributorLink | user_id, contributor_id, action, method, verified_at, actor_id, recorded_at, schema_version, digest, supersedes_id nullable | action link/unlink; method verified_email/admin_action; append-only; a display name never implies a link |
| ScopeDescriptor | level, ids, contributor_id nullable | Value object, not a row; embedded in MetricResult.scope, ReportDefinition and every metric request; level repository/team/project/organization only |
| PartialAggregate | repository_id, metric_definition_id, utc_day, numerator_count, denominator_count, dedupe_keys, value_multiset nullable, watermark, recorded_at, schema_version, digest | Immutable per input state; carries no precomputed ratio or percentile; invalidated by source, definition or mapping change |
| ReportDefinition (changed) | scope_level, scope_ids added | project_ids and repository_ids become derived projections and are not independently writable |
| Membership (changed) | team_grant_ids, is_external added | Team grant resolves through TeamProject; is_external denials are not relaxable |
| Workspace (changed) | individual_attribution_enabled, contributor_key_ref added | Flag defaults false, owner-only, audited; key reference never returned by any API |
| AuditEvent (changed) | subject_contributor_id nullable added | Remains content-free; a contributor handle is pseudonymous and permitted |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-011**: For the 12-repository fixture, every organization-level ratio and percentile equals
  a direct recomputation over the deduplicated union to the last decimal place of its canonical
  representation, and no value equals the mean or median of the per-project values.
- **SC-012**: In the shared-repository fixture, the sum of the four project values exceeds the
  organization value, the view states the discrepancy and names the count of shared repositories,
  and no test passes by hiding the difference.
- **SC-013**: Changing team composition after a window leaves every previously computed metric
  result for that window byte-identical in its canonical payload.
- **SC-014**: A repository-wide search of the schema, the OpenAPI contract, the CLI contract and
  the query surface finds zero parameters or response shapes expressing contributor ordering,
  contributor percentile rank or top-N or bottom-N contributor selection.
- **SC-015**: With `individual_attribution_enabled` false, 100% of named-person requests across
  all four roles are denied. With it true, 100% of permitted named-person requests produce exactly
  one audit event and exactly one subject notification, and a forced audit-write failure produces
  zero returned results.
- **SC-016**: A subject's self view returns the union of their linked and aliased identities with
  zero suppressed values, and returns zero records for any contributor they are not linked to.
- **SC-017**: External-viewer probes against organization scope, team scope, contributor dimension
  and non-granted projects return not found in 100% of cases across UI, API, export and job paths,
  and no response differs measurably between a non-existent and an inaccessible identifier.
- **SC-018**: At enterprise-tier fixture volume, an organization overview loads within 5 seconds at
  the 95th percentile while reading at most one partial-aggregate row per repository per day per
  metric, verified by query count rather than by wall clock alone.
- **SC-019**: Organization percentile values are identical across at least three runs with
  different partition counts and worker orderings.
- **SC-020**: The migration converts 100% of existing report definitions to a scope level, records
  the rule applied for each, and leaves every pre-existing published snapshot readable with its
  original values unchanged.
- **SC-021**: No artifact produced at any scope level, and no partial aggregate, contains a
  plaintext contributor name or email, verified by scanning every fixture artifact for the known
  plaintext identities of the test corpus.
- **SC-022**: The FR-112 leak test seeds 20 known plaintext identities and 20 known prompt
  fragments through every import path and finds zero occurrences across database, indexes, logs,
  job payloads, quarantine records, dead-letter records, backups, exports and published artifacts.
  A deliberately reintroduced plaintext field causes the test to fail, proving the test detects.
- **SC-023**: An AIBOM fixture of each of the four scope values imports to the FR-104 canonical
  level, and a request for `team` or `project` level evidence backed only by an AIBOM import
  returns unavailable with a population-mismatch reason in 100% of cases.
- **SC-024**: A `personal` AIBOM naming a contributor the requesting user is not linked to is
  denied on import in 100% of cases across all four roles.
- **SC-025**: An organization-scope artifact verifies with the public key alone, offline, with no
  access to the issuing system and no shared secret; altering any byte of the body invalidates the
  signature; and the verifier gains no ability to resolve any handle to a person.
- **SC-026**: For a window beginning 180 days before app installation, the organization overview
  states the uncovered interval and the count of partially covered repositories, and no metric for
  that window reports zero for the pre-installation interval.

## Supersessions

| Spec 001 text | Effect of this specification |
|---|---|
| FR-017 "arbitrary identity filters and individual leaderboards MUST be unavailable" | Amended. Leaderboards remain prohibited and become architecturally impossible (FR-090). Identity filters become permitted under FR-091 through FR-093. |
| FR-031 "Analysts MUST save project-scoped report definitions" | Amended by FR-073 to any scope level within the analyst's grant. |
| FR-016 "aggregate people signals" | Widened to permit pseudonymous contributor handles per ADR-011. Plaintext identity remains prohibited. |
| NFR-001 overview p95 2 seconds | Retained for repository, team and project. Superseded by NFR-014 for organization only. |
| NFR-002 50 repositories, 100,000 source records, 1,000,000 spans per workspace per day | Retained as the pilot tier. Superseded by NFR-013 for the enterprise tier. |
| security.md:53 "No identity filter is available in standard API/report views" | Superseded by FR-091 and FR-092. |
| data-model.md entity catalog | Extended by the Key Entities table above. |

## External System Reconciliation

Prompture (`/Users/shashanksaxena/Documents/Personal/Code/sovix-ai`) is treated as a source system
under Principle IV, not as a design precedent, except where cited. Its state as inspected on
2026-09-12:

| Observation | Location | Effect here |
|---|---|---|
| `Scope` enum `personal/project/team/enterprise` whose member names contradict their declared populations | packages/aibom/aibom.go:50-63 | FR-103, FR-104, FR-105 |
| No team-level and no multi-repository project-level population exists in the enum | aibom.go:53-56 | FR-105, FR-107 |
| `enterprise` is `team`'s population plus a `policy_violations` member | aibom.go:56, aibom.go:97-101 | FR-104; treated as a content variant, not a level |
| Plaintext email or username in `ExternalIdentity.ExternalID` | packages/identity/identity.go:16-23 | FR-108, FR-109 |
| `AutoBridge` matches Git email to user by plaintext comparison | identity.go:33-35 | FR-108; replaced by digest comparison |
| Plaintext `Email` in the GDPR portability export | packages/privacy/privacy.go:23 | FR-109, FR-111 |
| Full `PromptText` in the portability export | privacy.go:31-35 | FR-110 |
| Webhook forwards `author_email` and `author_name` verbatim to ingest | connectors/source/github/webhook.go:115-124 | FR-108, FR-109 |
| `CommitEntry.AuthorEmail` inside the signed, externally verifiable AIBOM document | aibom.go:52-63 | FR-111; a signed artifact carrying plaintext identity cannot be reissued pseudonymously |
| `CommitEntry.PromptPreview`, first 100 characters of the matched prompt, inside the same signed document | aibom.go:52-63 | FR-110 |
| Detached signature over `BodyWithoutSignature`, Ed25519 preferred with HMAC-SHA256 fallback | aibom.go:183-185, packages/aibom/signing.go:104-124 | FR-113, FR-114, FR-115; adopted as precedent, fallback rejected |
| Commit ingestion is push-webhook only, no diffs, no PR, review or check records | webhook.go:56-135 | FR-117 through FR-120 |

## Assumptions

- The enterprise tier describes an organization of roughly 2,000 engineers in 500 teams across
  2,000 repositories and 300 projects, with 730-day evidence retention and 30-day span retention.
  A larger tenant requires a measured capacity review, as NFR-002 already states for the pilot.
- The workspace remains the only tenancy boundary. A customer requiring several isolated
  organizations under one billing relationship is out of scope and is ADR-012's revisit trigger.
- Contributor resolution uses the author email present in Git and telemetry metadata. A source
  that provides no email yields `unknown` kind and is excluded from team scope per FR-064.
- Identity verification for `ContributorLink` reuses the hosted OIDC identity's verified email
  claim. No separate email delivery is introduced, consistent with spec 001's exclusion of email
  delivery.
- Subject notification uses the in-product inbox introduced by FR-035. No external notification
  channel is added.
- Cross-workspace contributor identity is out of scope and is ADR-011's revisit trigger.
- Works-council or similar prior-consent regimes are out of scope and are ADR-013's revisit
  trigger.
- Partial aggregates are an internal computation artifact, not a published contract, and carry no
  independent retention policy beyond that of the evidence they derive from.
- Prompture AIBOM documents already issued and signed carry plaintext identity and prompt
  fragments. They cannot be retroactively pseudonymized, because altering the body invalidates the
  signature. This specification governs what this platform stores and emits, not what the source
  system has already published. Remediation of previously issued AIBOM documents is a separate
  decision for that product.
- The Prompture GitHub App installation instant is available per repository. Where it is not, the
  earliest observed event time is used as the observation start under FR-117 and is labelled as an
  inferred rather than recorded boundary.
- The AIBOM format is owned by Prompture. This specification consumes it and does not extend it;
  a team-scope or project-scope AIBOM value would require a versioned format change on that side.
