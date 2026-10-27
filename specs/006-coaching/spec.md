# Feature Specification: Coaching, Inspectable Detectors and Leader Insight

**Feature Branch**: `006-coaching`  
**Created**: 2026-09-12  
**Status**: Draft  
**Input**: Specify the coaching capability made specifiable by ADR-013: an inspectable
user-editable detector system, a self-view for contributors, a team-and-above view for
engineering leaders, a signal inventory bound to session content availability, a language-model
coaching path over session content and history under ADR-016, and the claim discipline that lets
coaching reference outcome metrics without asserting causation.

## Product Definition

Spec 001 produces metric results and at most three prioritized findings per overview
(metrics.md, Findings). This specification turns that primitive into a coaching surface:
detectors a user can read and edit, findings that state their own evidence and uncertainty,
experiments that test a suggestion prospectively, and a leader view that reports where cost
and delivery friction sit and lets a lead read one developer's coaching at a time, without
ranking or comparing people.

Coaching spans two signal families deliberately. **Process signals** describe how work was
done (sessions, tools, context, review participation). **Outcome signals** describe what
happened to the work afterwards (rework proxy, review latency, CI failure, remediation
markers, production change failure, recovery). Coaching that reads only process signals can
tell a contributor their habits changed but never whether anything got better. Coaching that
asserts the second from the first is the causal claim Principle II and FR-047 forbid. This
specification resolves that tension with a claim lattice (FR-400 through FR-412) rather than
a disclaimer.

Coaching has two detector kinds (ADR-016). **Rule detectors** are bounded, deterministic rules
over registry metadata and outcome signals. **Model coaching** uses a language model to read a
developer's session content (prompts, system instructions, responses, tool arguments and
results with the file paths inside them, errors) together with each session's verified
outcomes (commit and pull-request links, rework, review, CI), and produces findings about
prompting technique and working practice: which prompts lacked acceptance criteria, where the
agent was corrected repeatedly on the same misunderstanding, which sessions looped on one error.
A model finding cites the sessions and turns it rests on or is discarded, is labelled
model-generated, is never regenerated in place, and is held to the same claim lattice. Neither
kind produces or alters a metric; metrics read no content and make zero model calls.

This specification adds no new tenancy boundary, no new role and no new aggregation level.
It adds no ranking primitive and no comparative view of individuals, and does not relax FR-090.
Requirements already covered by specs 001 and 002 are referenced by ID and not restated.

### Delivery scope

| Milestone | User value | Required stories | Shipping gate |
|---|---|---|---|
| C0 | Signal registry, claim lattice, detector schema, coaching instruction schema | Shared foundation | Lexicon check in CI, rule schema rejects executable content, zero model calls in metric calculation and rule-detector evaluation |
| C1 | Self-view coaching from metadata signals and session content | US31 | Every finding carries evidence kind, sample, uncertainty and falsification condition; a model finding without resolvable citations is discarded |
| C2 | Inspectable, editable, testable detectors | US32 | Dry run writes nothing, rule edit creates a new version, historical findings unchanged, every model finding opens its instruction version |
| C3 | Pre-registered experiments | US33 | Null and negative results recorded and displayed with equal prominence |
| C4 | Leader cost and friction view; one developer's coaching at a time | US34 | Aggregates team-and-above only with `k<5` suppression; individual reads grant-checked per cited project and audited for admins; unallocated and unpriced amounts displayed |
| C5 | Content-availability and runtime-capability degradation, detector coverage | US35 | Unavailable detectors and unread sessions named, never silently omitted |
| C6 | Repurposing resistance | US36 | Adversarial probes across UI, API, export, job and artifact paths |

## User Scenarios & Testing *(mandatory)*

### User Story 31 - Understand my own practice (Priority: P1)

A contributor opens their own coaching view, sees observations about how they worked across
a window, including model-generated observations about how they prompted and worked with the
agent in specific sessions, sees where an observation is associated with an outcome in their own
history, and can tell in every case what the claim rests on and what would disprove it.

**Why this priority**: Self-knowledge is the requirement ADR-013 exists to permit, and it is
the only coaching audience that can act without a power asymmetry.

**Independent Test**: A fixture of one contributor with 120 sessions and 40 merged PRs across
two disjoint predicate cohorts produces findings whose stated samples, cohort sizes, evidence
kinds and uncertainty intervals equal a direct recomputation, and whose rendered text contains
no term from the prohibited-claim lexicon. Run against recorded model responses for the same
fixture, every model finding shown resolves each citation to a session and turn of that
contributor, and every recorded response with a missing or unresolvable citation produces no
finding.

**Acceptance Scenarios**:

1. **Given** a contributor with linked identities, **when** they open their coaching view,
   **then** every finding states its claim class, population, sample size, window, evidence
   kind, coverage, uncertainty and falsification condition before any suggested action.
2. **Given** a detector whose outcome metric is `unavailable` for the window, **when** the
   view renders, **then** the detector reports unavailable with a reason and no association
   is emitted; the absence of a finding is not rendered as a good result.
3. **Given** two cohorts of the same contributor's own work whose observed difference is
   within that contributor's historical between-window variation for the metric, **when** the
   detector evaluates, **then** it emits the observation only and states that the sample is
   insufficient to compare.
4. **Given** a contributor with fewer than the detector's declared minimum cohort size on
   either side, **when** the detector evaluates, **then** no association is emitted and the
   reason names the unmet minimum.
5. **Given** sessions whose content state is `present` or `partial`, **when** model coaching
   runs, **then** every model finding shown cites the sessions and turns it rests on, is labelled
   model-generated with its model ID, instruction version and generation time, and carries claim
   class `observation`; a finding whose citations do not resolve is discarded and counted, not
   shown.
6. **Given** an issued model finding, **when** model coaching runs again over the same sessions,
   **then** the issued finding is unchanged and any new output is a new finding with its own
   generation record.
7. **Given** a local workspace with no hosted account, **when** its operator opens the coaching
   view, **then** with a provider configured, model findings are produced under FR-469 through
   FR-478 and content is sent only to that provider; with none configured, the view states that
   model coaching is not configured rather than showing no findings.

---

### User Story 32 - Read, tune and test a detector (Priority: P1)

A contributor opens the detector that produced a finding, reads its full definition, changes
a threshold, tests the change against their own data without writing anything, and saves it
as a new version that leaves every previously issued finding untouched. For a model finding, the
contributor reads the built-in coaching instruction set and the model that produced it.

**Why this priority**: An inspectable and user-owned detector is what separates coaching from
an opaque score. A rule a user cannot read is a claim a user cannot check.

**Independent Test**: Editing a threshold on a built-in detector produces a new personal rule
version, a dry run returns a differing finding set with zero persisted rows, and a byte
comparison of every pre-existing finding for that subject shows no change. Opening a model
finding's source returns the instruction version whose digest equals the one the finding records.

**Acceptance Scenarios**:

1. **Given** any finding, **when** the subject opens its source detector, **then** the full
   rule document, its version, its digest, its signal dependencies and its required runtime
   capabilities are readable; for a model finding, the full coaching instruction version, its
   digest, the model ID and the permitted finding categories are readable.
2. **Given** an edited rule, **when** the subject runs a dry run over a bounded window of
   their own data, **then** the resulting findings are returned, are labelled as a dry run,
   are not persisted, are not visible to any other principal, and generate no notification.
3. **Given** a saved rule edit, **when** the new version becomes active, **then** it is a new
   immutable version, prior findings retain their original rule version and text, and any
   trend across the version boundary is broken rather than interpolated.
4. **Given** a rule document containing executable code, a regular expression, an embedded
   prompt, a remote URL or an unknown key, **when** it is submitted, **then** it is rejected
   by typed validation before evaluation.
5. **Given** a rule with no declared confounder or no declared falsification condition,
   **when** it is submitted, **then** validation fails and names the missing field.

---

### User Story 33 - Test a suggestion instead of believing it (Priority: P2)

A contributor converts an association into a pre-registered experiment with a declared metric,
window and decision rule, and reads the honest result at the end including when the result is
no detectable difference.

**Why this priority**: It is the only mechanism in this specification that moves a claim from
association toward evidence, and it is what makes a suggestion falsifiable in practice rather
than only on paper.

**Independent Test**: An experiment whose post-window value moves in the opposite direction to
the prediction records a `worsened` outcome, displays it with the same prominence as an
`improved` outcome, and cannot be re-evaluated over a shifted window.

**Acceptance Scenarios**:

1. **Given** an association finding, **when** the subject accepts an experiment, **then** the
   metric, its version, the window, the decision rule and the predicted direction are pinned
   before any post-window data accrues.
2. **Given** a completed experiment, **when** its result is computed, **then** the outcome is
   exactly one of `improved`, `worsened`, `no_detectable_difference` or `inconclusive`, and an
   `inconclusive` outcome names whether sample, coverage or effect size was the limit.
3. **Given** a completed experiment, **when** the subject requests re-evaluation over a
   different window, **then** the original result is retained unchanged and a new experiment
   record is created instead.
4. **Given** multiple contributors' experiments on the same detector, **when** any view is
   requested, **then** no aggregate success rate across subjects is produced by any interface.

---

### User Story 34 - See where cost and friction are (Priority: P1)

An engineering leader opens a team-and-above view, sees where spend went and how much of it
could not be priced or allocated, sees where delivery friction and coverage gaps are, and
receives team-level suggested experiments that name no individual. To help one developer, the
leader opens that developer's coaching, one developer at a time.

**Why this priority**: It is the buying question, and it is the view most likely to be built
as a people dashboard by accident.

**Independent Test**: A four-team fixture with one unpriced model, one multi-PR cost unit and
one team of four humans produces a leader view whose priced, unpriced, allocated and
unallocated amounts reconcile exactly, and in which the four-human team is suppressed. In the
same fixture, an analyst's read of one developer returns only findings whose cited projects all
lie inside the analyst's grant, and writes one owner/admin-only audit event per read request
listing the finding IDs returned.

**Acceptance Scenarios**:

1. **Given** a window containing usage at an unknown price, **when** the cost view loads,
   **then** the priced estimate, the unpriced token quantity, the allocated amount, the
   unallocated remainder and the rate-card version are displayed together and the total is
   labelled partial per FR-029.
2. **Given** an imported subscription or invoice allocation, **when** any cost total is shown,
   **then** the billed ledger and the estimated equivalent remain separate measures and are
   never summed.
3. **Given** a team of fewer than five distinct human contributors, **when** a leader requests
   its coaching aggregate, **then** the aggregate and its complementary slices are suppressed
   per FR-098.
4. **Given** a team-level detector that fired, **when** the leader opens it, **then** the view
   states the share of the team's eligible population that matched, the coverage of that
   population, and a team-level suggested experiment, and names no contributor.
5. **Given** repositories in scope with no collected evidence, **when** the view loads,
   **then** reporting repository count, in-scope repository count and the resulting
   availability appear before any headline value per FR-079.
6. **Given** an owner, admin or analyst, **when** they open one developer's coaching, **then**
   they see that developer's `builtin`-rule and model findings, each model finding labelled
   model-generated, no finding citing a session or project outside their access, and no other
   developer; one `AuditEvent` listing the finding IDs returned, possibly none, is written for the
   request and readable by owner and admin only; and the developer is not notified, per FR-479.
7. **Given** an internal viewer or an `is_external` principal, **when** they request another
   person's coaching, **then** the request returns not found per FR-089.

---

### User Story 35 - Know what coaching cannot see (Priority: P2)

A developer or lead whose sessions arrived with only part of their content or none of it, whose
session content has expired, or whose runtime does not emit a signal a detector needs sees
exactly which sessions coaching could not read or read only in part, and which detectors could
not run, and why, rather than a coaching view that silently contains fewer findings.

**Why this priority**: Silent degradation makes an empty coaching view indistinguishable from
healthy practice, which is the failure mode that would make every other honesty requirement
in this specification cosmetic.

**Independent Test**: The same fixture evaluated with every session's content state `present`,
with subsets `partial` and `missing`, and after content expiry to `expired` produces identical
rule-detector findings, identical values for every registry metric, and an explicit entry with
its reason for every session model coaching could not read or read only in part; model findings
issued before expiry keep their category, citations and time.

**Acceptance Scenarios**:

1. **Given** a window containing sessions in each content state, **when** the coaching view
   loads, **then** it states how many sessions were `present`, `partial`, `missing` and
   `expired`, how many model coaching read, and the recorded reason for each `partial` or
   `missing` session, before any finding.
2. **Given** session content that arrives, is missing or expires, **when** any metric in the
   registry is recomputed, **then** its value is unchanged, per ADR-016 rule 6.
3. **Given** a developer whose collector sends no content, **when** coaching runs, **then** their
   sessions have content state `missing`, model coaching produces no finding from them, rule
   detectors run unchanged, and the coverage a lead sees states the missing content rather than
   an absence of findings.
4. **Given** a model finding whose cited session content has expired, **when** it is rendered,
   **then** its category, citations and time are shown with the date the content expired, and
   no empty text or quote pane is rendered, per FR-478.
5. **Given** a runtime that does not emit a signal a rule detector requires, **when** the
   coaching view loads, **then** the detector is listed as unavailable with the missing runtime
   capability named.
6. **Given** a session whose content state is `partial`, **when** model coaching reads it,
   **then** it reads only the turns that carry content, every citation resolves to such a turn,
   and each finding citing the session records it as `partial`.

---

### User Story 36 - Coaching cannot rank or compare people (Priority: P1)

A workspace owner with every available privilege, the `individual_attribution_enabled` flag
on, and administrative access to every project may read one developer's coaching at a time, and
attempts to obtain a comparative view of individuals' coaching. No path produces one.

**Why this priority**: FR-090 and FR-430 state the rule, and ADR-016 keeps it while letting leads
read individual coaching. This story is the evidence that comparison is implemented as an absent
capability rather than as a filter that a future change can loosen.

**Independent Test**: Every probe across UI, API, CLI, export, published artifact, notification
and background job returns either not found or a result about exactly one subject, and a
repository-wide search of the schema and contracts finds no shape expressing per-contributor
finding counts, a list of contributors by finding, or a coaching read over more than one
contributor.

**Acceptance Scenarios**:

1. **Given** an owner with the flag on and a named-person operational view open, **when** they
   request coaching findings for two or more developers in one request, for a team's members,
   or for every developer with a finding in a category, **then** no such request shape is
   accepted and the denial names FR-428 rather than a configuration state.
2. **Given** any principal, **when** they request contributors ordered by finding count,
   open-finding count, detector match rate, model finding category or experiment outcome,
   **then** no such request shape is accepted by any interface.
3. **Given** a team coaching aggregate, **when** its computation is inspected, **then** it is
   computed from the team-scope population directly and not by combining member-level findings.
4. **Given** a subject who dismisses or mutes a finding, **when** a lead opens that subject's
   coaching, **then** the finding is still shown, and the dismissal, its existence and its count
   are absent from the lead's view and from every other principal's view.
5. **Given** an administrator running any export, snapshot or published artifact, **when** the
   output is scanned, **then** it contains no individual coaching finding, dismissal or
   experiment record.
6. **Given** a lead who has read one developer's coaching, **when** they choose another
   developer, **then** the choice is offered in an order that depends on no coaching value,
   shows no per-developer finding indicator, and includes developers whether or not they have
   findings.

---

### Edge Cases

- A contributor whose two cohorts have materially different collection completeness, so the
  comparison measures instrumentation rather than practice.
- A contributor with no prior windows, so no noise floor for the outcome metric is computable.
- A detector whose outcome metric changes definition version inside the trend window.
- A rule edited during an in-flight experiment that pins that rule version.
- A subject whose contributor identities are merged by an audited alias action after findings
  were issued under one of them.
- A workspace that shortens its content retention period while model findings still hold text
  from sessions the shorter period now expires.
- A model response that cites a session or turn that does not exist, belongs to another
  contributor, was not part of the run, or is a turn of a `partial` session that carried no
  content.
- A session that never finalizes, whose 30-day content clock runs from its last received span.
- A model finding whose cited sessions span two projects, only one of which is inside an
  analyst's grant.
- A session whose content expires while a model coaching run over it is in flight.
- A model output that describes a developer as frustrated, careless or disengaged.
- A workspace that changes its coaching model provider or instruction version mid-window.
- A coaching model provider that is unavailable or returns malformed output for a run.
- A team that drops below five humans inside the window, and a team whose only non-suppressed
  members are bots.
- A detector that can only ever fire in one direction because its predicate and its outcome
  share an input.
- An experiment whose window contains a holiday period, an incident, or a repository migration.
- A personal rule edit made immediately before a leader-visible team aggregate is computed.
- A rule authored by a model that validates against the schema but whose author text contains
  a causal claim.
- Two detectors that fire on the same population and produce contradictory suggested actions.

## Requirements *(mandatory)*

### Functional Requirements

#### Coaching model and claim discipline

- **FR-400**: A coaching output MUST be a `CoachingFinding` and MUST carry exactly one claim
  class. The classes are exactly:

  | Class | What it asserts | Required inputs | Prohibited content |
  |---|---|---|---|
  | `observation` | A count, rate or distribution over one named eligible population in one window | Process or outcome signals | Any reference to a consequence, benefit or cost of the observed behavior |
  | `association` | Two disjoint cohorts of the same subject's own work differed in one named outcome metric | A predicate partition plus one registry outcome metric | Any statement that the predicate produced the difference |
  | `experiment` | A pre-registered prospective change produced a stated result under a pinned decision rule | An accepted `CoachingExperiment` | Any generalization beyond the subject and window that produced it |

  No other class may exist. A finding MUST NOT carry two classes or an unclassified claim. A
  model finding carries `observation` only, per FR-472.
- **FR-401**: An `association` MUST be computed within one subject for individual coaching and
  within one team for team coaching. A comparison between two contributors MUST NOT be
  computable by any detector or by model coaching, which extends FR-090 to the coaching path; a
  model coaching run reads one subject's sessions only, per FR-469.
- **FR-402**: An `association` MUST state both cohort sizes, the observed values, the direction
  of difference, an uncertainty interval, the evidence kind of the outcome metric, and the
  collection completeness of each cohort. A missing element MUST prevent emission rather than
  render as absent.
- **FR-403**: An `association` MUST NOT be emitted when either cohort is smaller than the
  detector's declared minimum, when the two cohorts' collection completeness differs by more
  than the detector's declared tolerance, or when the observed difference does not exceed the
  subject's own historical between-window variation for that metric computed over at least the
  detector's declared number of prior windows. When any gate fails, the detector MUST emit its
  `observation` with a reason naming the unmet gate.
- **FR-404**: The evidence kind of a finding MUST be the weakest kind among its inputs under
  the ordering measured > proxy > inferred. A finding whose outcome metric is a proxy MUST be
  a proxy finding, and its text MUST name the proxy per FR-010.
- **FR-405**: Every finding MUST declare the confounders its comparison did not control. A
  detector emitting an `association` MUST declare at least one confounder, and the emitted
  finding MUST list task mix, change-size distribution, repository mix and window composition
  in addition to any detector-declared confounder. A detector declaring none MUST fail
  validation.
- **FR-406**: A detector MUST be direction-neutral. A detector whose predicate can produce an
  `association` in only one direction because its predicate and its outcome metric share a
  source input MUST fail validation, and a detector that has never emitted a finding in the
  direction contrary to its author's expectation MUST be marked as unconfirmed in that
  direction rather than silently trusted.
- **FR-407**: A suggested action MUST be phrased as an experiment to run, MUST name the metric
  that would change, MUST name the window over which the subject would look, and MUST NOT
  assert that the action will improve that metric.
- **FR-408**: Rendered coaching text MUST NOT contain a term from the versioned prohibited-claim
  lexicon. The lexicon MUST include causal verbs, productivity framings, efficiency and ROI
  framings, and quality judgements about a person. The check MUST run over every built-in
  rule's rendered output and every author-supplied text field, and MUST be a build-time gate
  rather than a review convention. It MUST also run over every model finding before storage,
  per FR-472.
- **FR-409**: A composite score, index or grade over a contributor, a session, a practice
  category or a team MUST NOT exist. A scalar that orders subjects cannot satisfy the evidence
  contract of FR-007 because it has no single formula, sample, exclusion set or availability
  state, and it reconstructs the ranking FR-090 makes impossible.
- **FR-410**: Coaching MUST NOT produce a metric value. Findings read `MetricResult` rows and
  MUST NOT write, adjust, derive or cache an alternative value for any registry metric, per
  FR-007 and NFR-012.
- **FR-411**: A finding MUST be suppressed when any metric it reads is `unavailable` or
  `suppressed`. An empty coaching view MUST state how many detectors ran, how many were
  unavailable and why, and which sessions model coaching read and could not read per FR-452,
  and MUST NOT be presented as an absence of problems.
- **FR-412**: Rule-detector output MUST be reproducible. The same pinned evidence, rule version
  and signal registry version MUST produce the identical canonical finding payload and digest;
  evaluation timestamps sit outside that digest per Principle I. Model findings are not
  reproducible by recomputation; FR-470 ties each to its cited evidence and FR-471 makes it
  immutable instead.

#### Detector rule engine

- **FR-413**: A detector MUST be expressed as a `CoachingRule` document consisting of a typed
  declarative block and human-readable prose. The declarative block MUST be the only input to
  evaluation. The prose MUST NOT be parsed.
- **FR-414**: The declarative block MUST be bounded exactly as `PolicyVersion` rules are bounded
  (data-model.md:55, policy.md Bounded Rule Language). It MUST NOT contain code, SQL, regular
  expressions, templates, embedded prompts, dynamic URLs, nested logical trees, user-defined
  functions or remote execution. Server-side typed validation MUST reject unknown keys.
- **FR-415**: A rule's predicate MUST be a flat `all` list of 1 to 20 typed clauses, optionally
  containing one `any` group of at most 5 clauses. Each clause MUST reference a signal by ID
  and version from the versioned `SignalRegistry` and use one operator from the bounded set
  `gte`, `lte`, `gt`, `lt`, `eq`, `ne`, `in`, `not_in`, `ratio_gte`, `ratio_lte`. A clause
  MUST NOT reference a `content` signal. Session content is read only by model coaching, per
  FR-469 (ADR-016 rule 6).
- **FR-416**: A rule document MUST declare: `id`, `version`, `claim_class`, `owner_scope`,
  `required_capabilities`, `population`, `predicate`, `outcome_metric` for an association,
  `minimum_cohort`, `completeness_tolerance`, `noise_floor_windows`, `confounders`,
  `falsified_if`, `text_template_id` and `text_slots`. Every field MUST be present; a missing
  field MUST fail validation with the field named.
- **FR-417**: `falsified_if` MUST state a concrete observation that would make the finding not
  hold, expressed in the same clause vocabulary as the predicate so that it is evaluable rather
  than rhetorical. A rule whose `falsified_if` is unevaluable MUST fail validation.
- **FR-418**: A rule detector's emitted claim text MUST come from a versioned template catalog
  whose slots accept only computed values: numbers, metric IDs and versions, window bounds,
  cohort sizes, enumerated reason codes and availability states. An author MAY supply
  `rationale` and `suggested_action` free text, bounded in length, rendered in a region labelled
  as author text, excluded from the claim, and subject to FR-408.
- **FR-419**: `owner_scope` MUST be exactly one of `builtin`, `personal` or `workspace`. A
  `personal` rule MUST apply only to its owning subject's own view. A `workspace` rule MUST be
  authored by an admin or owner, MUST apply only at team scope and above, and MUST NOT produce
  individual output. A `builtin` rule MUST NOT be edited in place; editing it creates a
  `personal` or `workspace` derivative that records its parent rule ID and version.
- **FR-420**: A personal rule, its edits and its dry runs MUST NOT affect any team or
  organization aggregate. Leader-visible aggregates MUST be computed only from `builtin` and
  `workspace` rules, so that neither a subject can tune themselves out of a team signal nor a
  leader's number can depend on a subject's private configuration. For the same reason, a lead's
  read of one developer under FR-427 MUST show that developer's findings from `builtin` rules and
  model coaching, evaluated independently of the developer's personal rules, dismissals and
  mutes, so that no developer control can hide a finding from a lead. Personal rules, their
  findings and dry runs, and experiments are the subject's own working tools, are not part of a
  lead's read, and MUST remain readable by the subject only.
- **FR-421**: A `CoachingRuleVersion` MUST be immutable and MUST follow the `PolicyVersion`
  lifecycle `draft -> shadow -> active/disabled`, with edits creating a new draft version. A
  finding MUST pin the rule version and rule digest that produced it.
- **FR-422**: A rule change MUST NOT rewrite history. Findings issued under an earlier version
  MUST retain their original text, thresholds and claim. Recomputation under a new version MUST
  produce new findings labelled with the new version. A trend series crossing a rule version
  boundary MUST render the boundary and MUST NOT interpolate across it.
- **FR-423**: A dry run MUST evaluate a candidate rule version over a bounded window of data the
  requesting principal is already authorized to see, MUST return the resulting findings labelled
  as a dry run, MUST persist no finding, MUST emit no notification, MUST NOT be visible to any
  other principal, and MUST be rate limited. A dry run by a leader MUST operate on team-scope
  populations only and MUST NOT reach individual records.
- **FR-424**: A model MAY draft a rule document. A drafted rule MUST enter as `draft`, MUST pass
  the same typed validation and FR-408 lexicon check, MUST record that it was model-drafted and
  by which model and prompt template version, and MUST NOT activate itself. Drafting MUST NOT
  read session content, because a rule document outlives the 30-day content bound and a
  `workspace` rule is readable by other principals. Drafting requests MUST go only to the
  configured provider of FR-476, and drafting MUST NOT produce or alter a metric or a finding.
- **FR-425**: Two active detectors producing contradictory suggested actions on the same
  population MUST both be shown with their evidence rather than resolved by priority, and the
  view MUST state that they disagree. Silent selection of one would present a preference as a
  finding.
- **FR-426**: Rule-detector evaluation MUST make zero model calls and MUST be deterministic, per
  Principle VII and NFR-012. Model coaching is a separate detector kind governed by FR-469
  through FR-478 and MUST NOT create, alter or re-score a rule-detector finding. Optional
  narrative may paraphrase an emitted finding with citations, MUST send requests only to the
  configured provider of FR-476, and MUST NOT create or alter a finding, a claim class, a metric
  value or a suggested action. Narrative that paraphrases a model finding MUST be deleted with
  that finding's model-written text under FR-478.

#### Model coaching

- **FR-469**: Model coaching MUST be a second detector kind alongside rule detectors (ADR-016
  rule 6). A run MUST read the session content of one subject's sessions whose `content_state`
  (spec 005 FR-341) is `present` or `partial`, reading only the turns that carry content in a
  `partial` session, together with each session's outcomes reachable through
  `link.session_change_verified` (commit and pull-request links, `pr.rework_21d`, review and CI
  signals), and MUST send them to the workspace's configured coaching model under one active
  `CoachingInstructionVersion`. It MUST produce findings about prompting technique and working
  practice for that subject only. It MUST NOT read a session whose content state is `missing` or
  `expired`, MUST NOT read prompt fragments inside imported reports (Receipts, AIBOM), which have
  no session and stay discarded (ADR-016 Clarifications), MUST NOT read another contributor's
  sessions or a candidate link, and MUST NOT produce a team, project or organization finding,
  because a model reading several people's sessions together could compare them, which FR-090
  and FR-430 forbid. Model coaching MUST run in hosted mode and in local mode alike whenever the
  workspace has a provider configured under FR-476: a local workspace with no hosted account
  keeps its content on the machine under the same 30-day bound, and its model coaching follows
  every rule of FR-469 through FR-478 (ADR-016 Clarifications).
- **FR-470**: A model finding MUST cite each session and, within it, each turn it rests on, and
  MAY cite outcome records verified-linked to a cited session. Every citation MUST resolve at
  generation time to a content-bearing turn of a session the run read, or to such an outcome
  record. A finding with no citation, or with any citation that does not resolve, MUST be
  discarded whole before storage, not stored with the unresolvable citation removed, and MUST
  NOT be shown or stored as a finding; the run record MUST count it as discarded (Principle I).
- **FR-471**: A model finding MUST record the provider, the model ID, the
  `CoachingInstructionVersion` and its digest, and the generation time, and MUST be labelled
  model-generated wherever it is rendered, including the subject's view and a lead's read. It
  MUST be immutable: it MUST NOT be regenerated, reworded or re-scored in place. A later run
  over the same sessions MUST produce new findings with their own generation record and MUST
  leave earlier findings unchanged. Two model findings that disagree MUST both be shown, per
  FR-425.
- **FR-472**: A model finding MUST carry claim class `observation` and MUST NOT carry
  `association` or `experiment`, because it is not computed from a pinned cohort partition
  (FR-402, FR-403). Its claim MAY state what happened in the cited turns and the outcomes
  recorded for the cited sessions. It MAY state what tends to go differently only in a region
  labelled as a model suggestion and excluded from the claim, as FR-418 treats author text.
  Neither the claim nor the suggestion may state or imply that a practice caused, produced,
  prevented or would change an outcome, per Principle II and FR-047, and neither may carry a
  score, grade or rating, per FR-409. Every model finding MUST pass the FR-408 lexicon check and
  the FR-455 affect prohibition before storage; a finding that fails MUST be discarded rather
  than edited, and counted in the run record.
- **FR-473**: A model finding MUST fill the structured fields of FR-461 as follows: model ID,
  instruction version and instruction digest in place of rule ID, rule version and rule digest;
  evidence kind `inferred`, per FR-404; population is the cited sessions and sample size is the
  count of cited sessions and turns; uncertainty is the explicit statement that no interval is
  computable, per FR-463; declared confounders are those of the instruction version; the
  falsification condition names what the cited turns would have to show for the finding not to
  hold, so that a reader can check it in replay; content availability is each cited session's
  `content_state` at generation time, so a finding resting on a `partial` session says so. A
  model finding missing any field MUST be discarded under FR-470.
- **FR-474**: Model coaching MUST NOT produce, alter or feed a metric value, a metric threshold,
  a finding in a snapshot, or a snapshot (ADR-016 rule 6). A metric, `MetricResult`, rule
  detector, team aggregate or experiment decision rule MUST NOT read session content or a model
  finding. Enabling, disabling or changing model coaching, its provider or its instruction
  version MUST change no metric value and no rule-detector finding.
- **FR-475**: Model coaching MUST run under a `CoachingInstructionVersion`: an immutable,
  digested document holding the full instructions sent to the model, the finding categories it
  may emit, the output schema including citation fields, the content and outcome signals it
  reads, its declared confounders, and the prohibited-claim lexicon version it is checked
  against. It MUST contain no session content. It MUST be readable in full, from any model
  finding, by any principal who may read that finding. Instruction versions are `builtin` in this
  specification: a subject or workspace MUST NOT edit one, and a new version MUST leave findings
  issued under earlier versions unchanged, per FR-422.
- **FR-476**: The coaching model provider MUST be a workspace setting, changeable only by an
  owner, and each change MUST be recorded as an audited configuration change, following the
  `individual_attribution_enabled` pattern of FR-074, because the provider decides where content
  goes (ADR-016 Clarifications). In local mode the operator of the local workspace holds this
  owner right. Session content MUST be sent only to the configured provider, under a no-training
  and minimal-retention agreement where the provider offers one, and only as stored after secret
  redaction (ADR-016 rules 6 and 7). A hosted or local workspace with no configured provider MUST
  run no model coaching, and its coaching view MUST state that model coaching is not configured
  rather than render an empty set of model findings.
- **FR-477**: Coaching model spend MUST be recorded as its own cost line at workspace scope, with
  provider, model ID, token usage, estimated cost and rate-card version, separate from the
  team's agent usage (ADR-016 rule 6). It MUST NOT be added to agent usage,
  `usage.estimated_cost_usd`, cost allocation or any cost metric, and MUST NOT be summed with
  agent usage in any view.
- **FR-478**: A model finding's category, citations, claim class, generation record and time
  MUST follow the retention of FR-433, so a developer can still see how often a kind of finding
  recurred. Its model-written text (claim, suggestion and falsification condition) and any quote
  MUST be treated as quoted session content, because a paraphrase cannot be reliably told apart
  from a quote and Constitution III requires content to be gone within 30 days, and MUST be
  hard-deleted when the content of the earliest-expiring cited session is deleted: no later than
  30 days after that session ended, where a session that never finalizes ends at its last
  received span, and sooner under a shorter workspace period of at least 1 day, which applies
  retroactively to text already stored (ADR-016 rules 2 and 6 and Clarifications). Model-written
  text and quotes MUST be encrypted under the content key of the earliest-expiring cited
  session, per the key scheme of spec 005 NFR-077, so that destroying that key at expiry makes
  every backup copy unreadable. No role, hold, export or configuration may extend it, and a
  restore from backup MUST re-apply the deletion before serving. After deletion the finding MUST
  render its category, citations and time with the date its content expired, and MUST NOT
  render an empty text or quote pane.

#### Individual coaching

- **FR-427**: Individual coaching MUST be readable by its subject in the self view at full
  fidelity with no suppression, per FR-091, in local and hosted mode. In hosted mode it MUST also
  be readable, one subject at a time, by an owner, an admin, and an analyst whose grant covers
  every project that the finding's cited sessions and evidence references resolve to, per FR-096
  as amended by ADR-016 rule 6. A session that resolves to no project is outside every analyst
  grant. A finding citing a session or evidence reference outside the reader's access MUST NOT be
  shown to that reader, and its existence MUST NOT be disclosed, per FR-089. An internal viewer
  MUST NOT read another person's coaching, and FR-448 applies to external viewers. An owner,
  admin or analyst reading another person's coaching under this requirement is a lead, and sees
  what FR-420 lists. This access MUST NOT depend on `individual_attribution_enabled`, matching
  ADR-016 rule 3 for session content.
- **FR-428**: A coaching read MUST name exactly one subject: an identity linked to the requesting
  user, or, for a lead under FR-427, one contributor handle. The schema and query surface MUST
  NOT accept a list, team, filter or predicate over contributors in a coaching read, and MUST NOT
  return findings of more than one contributor in a response. This MUST be enforced by the
  absence of the parameter shape, not by an authorization check that a future role could
  satisfy.
- **FR-429**: Individual coaching findings, dismissals and experiments MUST NOT appear outside
  the self view and the lead read of FR-427: not in a named-person operational view, an audit
  record's payload, an export, a snapshot, a published artifact, a notification to any other
  principal, a search index readable by another principal, or any job output.
- **FR-430**: A team or organization aggregate MUST NOT be computed from individual findings.
  Aggregates MUST be computed directly from the team-scope population resolved under FR-062 and
  FR-063. A count, share or distribution of contributors by finding state MUST NOT exist.
- **FR-431**: A subject MUST be able to dismiss or mute a finding or a detector for themselves.
  A dismissal or mute MUST change only the subject's own view: it MUST NOT remove, hide or
  reorder the finding in a lead's read under FR-427, and MUST NOT stop any detector or model
  coaching from running. The dismissal, its reason, its count and its existence MUST NOT be
  observable by any other principal or inferable from any aggregate.
- **FR-432**: A subject MUST NOT be able to delete a coaching finding or hide one from a lead;
  findings follow the retention of FR-433 and FR-478. A subject MAY delete their own personal
  rules and experiment records, which no lead reads under FR-420. Deletion MUST NOT alter any
  metric result, because coaching is derived output rather than evidence.
- **FR-433**: Individual coaching findings MUST be retained no longer than the evidence they
  derive from. A finding that cites sessions MUST keep its category, citations and other
  non-content fields no longer than those sessions' span metadata retention (`spans_days`, which
  always exceeds `session_content_days`); a model finding's model-written text and quotes follow
  FR-478 and never outlive the cited session content. They MUST NOT be
  included in a legal or administrative export; a request for a subject's record MUST be
  answered from the underlying source evidence under existing authorization, never from
  coaching output.
- **FR-434**: A subject MUST see which of their identities and which repositories contributed to
  each finding, and which sessions and turns a model finding cites, so that a finding computed
  over a merged alias population is inspectable.
- **FR-435**: Alias merges and identity link changes after a finding was issued MUST NOT
  retroactively alter that finding. A subsequent evaluation MUST produce a new finding over the
  union population.
- **FR-436**: Coaching MUST NOT be delivered to a subject as an unsolicited external message.
  Delivery MUST use the in-product inbox per FR-035.
- **FR-479**: Every request to read another person's coaching MUST write exactly one
  `AuditEvent`, recording actor, subject contributor handle, the IDs of the findings returned
  and time (ADR-016 rule 5). A request that returns no finding still writes one, with an empty
  list. The audit write MUST succeed before any finding is returned; a failed write MUST fail the
  read (ADR-016 Clarifications). The event MUST be readable by owner and admin only, MUST carry
  no finding text, quote or session content, MUST NOT be shown or sent to the subject, and MUST
  NOT appear in the subject's list under FR-094. The read MUST NOT notify the subject (ADR-016
  rule 4). A lead's coaching read is separate from the named-person operational view of FR-092
  and FR-093 and is audited under this requirement rather than FR-093.
- **FR-480**: A lead MUST read one developer's coaching at a time (ADR-016 rule 6). An interface
  MUST NOT place two developers' coaching side by side, offer next or previous navigation ordered
  by any coaching value, or list, filter, badge or count developers by whether or how they have
  findings, at any role, per FR-090 and FR-430. A surface for choosing whose coaching to open
  MUST order developers independently of any coaching value and MUST show no coaching indicator
  per developer.

#### Leader and organization view

- **FR-437**: Leader coaching aggregates MUST be available at `team`, `project` and
  `organization` scope only, MUST follow the read matrix of FR-087, and MUST apply `k<5` and
  complementary suppression per FR-098. Bot contributors MUST NOT count toward the threshold of
  five. A lead's read of one developer's coaching is governed by FR-427 and FR-480 and is not an
  aggregate.
- **FR-438**: A leader-visible coaching aggregate MUST state the matched share of the eligible
  population, the population size, the coverage of that population, the evidence kind, and the
  window, before any suggested action.
- **FR-439**: Cost attribution in the leader view MUST display together: the estimated
  equivalent cost, its rate-card catalog and version, the unpriced token quantity, the allocated
  amount by cohort, the unallocated remainder including rounding remainder, and the count of
  cost units left unallocated because they linked to several PRs without explicit weights, per
  FR-027 through FR-029 and metrics.md Pricing and Allocation.
- **FR-440**: The estimated equivalent cost and any imported billed or subscription allocation
  MUST remain separate measures and MUST NOT be summed, averaged into one figure or presented
  as one total, per data-model.md BillingAllocation and domain invariant 8.
- **FR-441**: Unpriced usage and unallocated cost MUST NOT be rendered as zero and MUST NOT be
  omitted from a headline. A cost view whose unpriced or unallocated share exceeds a configured
  disclosure threshold MUST state that share adjacent to the headline value.
- **FR-442**: Delivery friction in the leader view MUST be expressed with the existing registry
  metrics and their stated boundaries: `delivery.first_review_hours_p50`,
  `delivery.pr_cycle_hours_p50`, `ci.failure_share`, `quality.file_rework_21d`,
  `delivery.remediation_marker_share`, `production.change_failure_share` and
  `production.recovery_hours_p50`. A leader view MUST NOT introduce a friction metric that is
  not in the registry.
- **FR-443**: Coverage gaps MUST be a first-class element of the leader view, reporting
  instrumented population, reporting repository count against in-scope repository count,
  `evidence.session_link_coverage`, `process.recorded_review_coverage` and per-connector
  collection completeness. A gap MUST be distinguishable from a low value.
- **FR-444**: Teams MAY be compared on one named registry metric at a time. A comparison MUST
  display each team's sample size, coverage, uncertainty and exclusions, MUST NOT produce a
  composite team score, MUST NOT render an ordinal badge, position number or percentile rank,
  and MUST NOT use superlative labelling such as best, worst or top performing.
- **FR-445**: A suggested action in a leader aggregate view MUST be a team-level or process-level
  experiment. It MUST NOT name, imply or make identifiable an individual, and MUST NOT be
  phrased as an instruction to address a person.
- **FR-446**: An `organization` scope coaching view MUST follow FR-075 through FR-083: matched
  shares MUST be recomputed from the deduplicated union population and MUST NOT be combined from
  child results, and shared repositories MUST contribute once.
- **FR-447**: A leader comparison across windows MUST retain cohort definitions, sample sizes,
  exclusions, observation maturity, instrumentation coverage change and missing-source coverage,
  per FR-046, and MUST NOT generate a causal or ROI statement, per FR-047.
- **FR-448**: An external viewer per FR-085 MUST NOT reach any coaching surface, at any scope
  level and any cohort size.

#### Signal inventory and content availability

- **FR-449**: A versioned `SignalRegistry` MUST enumerate every signal a detector may reference,
  and each entry MUST declare its source, whether it is `metadata` or `content`, its evidence
  kind, its availability semantics when absent, and the runtime capability that must be present
  for it to be populated. A detector MUST NOT reference a signal outside the registry. A rule
  detector reads `metadata` signals only (FR-415); model coaching reads the `content` and outcome
  signals its instruction version declares (FR-469, FR-475).
- **FR-450**: The initial registry is exactly:

  | Signal | Source | Data | Kind | Notes |
  |---|---|---|---|---|
  | `session.elapsed_seconds` | Telemetry | metadata | measured | Elapsed time, never labor |
  | `session.state` | Telemetry | metadata | measured | `completed` or `interrupted`; interruption is not abandonment |
  | `session.repository_count` | Telemetry | metadata | measured | Distinct repositories touched; scope-spread proxy |
  | `session.tool_call_count` | Telemetry | metadata | measured | By tool name only |
  | `session.tool_error_count` | Telemetry | metadata | measured | Error class only; error text is content |
  | `session.shell_tool_call_count` | Telemetry | metadata | measured | Requires runtime capability declaring shell tool identity |
  | `session.shell_confirmation_mode` | Telemetry | metadata | measured | Only when the runtime emits it as metadata; otherwise unavailable |
  | `session.named_command_count` | Telemetry | metadata | measured | Command name only; arguments are content |
  | `session.context_utilization_ratio` | Telemetry | metadata | measured | Only when the runtime emits window size and occupancy |
  | `session.compaction_count` | Telemetry | metadata | measured | Runtime-dependent; absent is unavailable, never zero |
  | `session.context_reference_count` | Telemetry | metadata | measured | Count of attached references; the references themselves are content |
  | `session.prompt_length_tokens` | Telemetry | metadata | measured | Length only; the text is content |
  | `session.model_id` | Telemetry | metadata | measured | Identifier only |
  | `session.turn_count` | Telemetry | metadata | measured | |
  | `usage.tokens_input`, `usage.tokens_output`, `usage.cache_read`, `usage.cache_write` | Telemetry | metadata | measured | Canonical owner units only, per `agent.tokens_*` |
  | `usage.estimated_cost_usd` | Derived | metadata | measured | Estimate, never billed spend |
  | `change.lines_added`, `change.lines_deleted`, `change.files_touched` | Git | metadata | measured | After versioned exclusions |
  | `change.test_line_ratio` | Git | metadata | proxy | Not executed coverage |
  | `pr.review_present`, `pr.approval_present`, `pr.first_review_hours`, `pr.cycle_hours` | GitHub | metadata | measured | Reviewed is not approved |
  | `pr.rework_21d` | Derived | metadata | proxy | Repeat file touches; no line-survival claim |
  | `ci.attempt_failed` | GitHub | metadata | measured | Canceled and running excluded |
  | `deploy.production_success`, `incident.verified_link`, `incident.recovery_hours` | Deployment / incident connectors | metadata | measured | Verified links only |
  | `link.session_change_verified` | Derived | metadata | measured | Candidate links excluded |
  | `content.prompt_text`, `content.system_instructions`, `content.response_text`, `content.tool_arguments`, `content.tool_results`, `content.error_text`, `content.session_title` | Telemetry | content | inferred | Read by model coaching only (FR-469), never by a rule clause (FR-415) or a metric; hard-deleted within 30 days (ADR-016 rule 2) |
  | `content.file_paths` | Derived | content | inferred | Extracted from `content.tool_arguments` and `content.tool_results`, never captured as a separate attribute; same readers and deletion as its sources |

  Git, GitHub, deployment and incident signals are connector-sourced metadata and do not depend
  on session content being present.
- **FR-451**: Coaching capability by session `content_state` (spec 005 FR-341, ADR-016
  Clarifications) MUST be exactly:

  | Content state | Rule detectors | Model coaching |
  |---|---|---|
  | `present` | Every process detector over metadata signals, every outcome association, the full leader view | Reads the session with its verified outcomes and may cite it |
  | `partial` (only some spans carry content) | Unchanged | Reads only the turns that carry content, may cite only those turns, and records the session as `partial` with the recorded reason |
  | `missing` (collector or runtime did not send content) | Unchanged | Does not read the session; counts it as unread with the recorded reason |
  | `expired` (deleted at the end of the workspace's content period, at most 30 days) | Unchanged | Does not read the session; findings already citing it keep category, citations and time per FR-478 |

  Rule-detector output and every metric value MUST be identical across the four states, because
  neither reads content. Model coaching produces individual findings only and never a team,
  project or organization aggregate.
- **FR-452**: A rule detector whose `required_capabilities` are not met by the runtime or
  connector that produced its data MUST report `unavailable` with the missing capability named.
  Model coaching MUST state, for the window, the sessions it read, the sessions it read only in
  part because their content state was `partial`, the sessions it could not read because their
  content state was `missing` or `expired`, the reason for each, and whether a coaching model is
  configured. A model coaching run that fails MUST be recorded as failed with
  its reason and MUST NOT render as a run that found nothing. Coaching MUST NOT degrade silently:
  the view MUST list detectors that ran, detectors that were unavailable, and the reason for
  each.
- **FR-453**: A model finding MUST record the content state of each cited session at generation
  time. A finding count, a matched share or a detector rate MUST NOT be compared across
  workspaces, across populations with different content availability, or across coaching models
  or instruction versions, because each changes the denominator of what could have fired.
- **FR-454**: Content availability MUST be reported as collection coverage. The leader view
  under FR-443 MUST state the count and share of in-scope sessions whose content state is
  `partial` or `missing`, by reason, subject to `k<5` suppression per FR-098. A lead's read of
  one developer under FR-427 MUST state which of that developer's sessions were `partial`,
  `missing` or `expired`, and why. There is
  no per-contributor opt-out of content capture (ADR-016 rule 1).
- **FR-455**: The following signals MUST NOT exist in the registry: inferred emotional state,
  frustration, sentiment or tone of a person; keystroke, idle, focus or screen-activity
  monitoring; inferred effort or engagement; and any inference about a named person's state of
  mind. A detector referencing such a signal MUST fail validation. Capitalized text and
  profanity are content, and treating them as a measure of a person is affect inference rather
  than process observation. This binds model coaching equally: a `CoachingInstructionVersion`
  MUST NOT ask for such an inference, the prohibited-claim lexicon MUST include affect,
  effort, engagement and state-of-mind terms, and a model finding that attributes any of them
  to a person MUST be discarded under FR-472.
- **FR-456**: A detector coverage view MUST state, per connector and per runtime, which
  registry signals that source can populate, which it cannot, whether it sends session content,
  and which detectors are therefore unavailable. Absence of a signal MUST be reported as
  unpopulated, never as a zero value, per FR-024.

#### Anti-gamification

- **FR-457**: The product MUST NOT implement experience points, levels, tiers, badges, medals,
  streaks, stars, trophies, leaderboards, scored quizzes, or any persistent scalar that
  accumulates for a person or a team. This MUST be enforced by absence in the schema and the
  contracts, like FR-090, so that no configuration enables it.
- **FR-458**: Progress MUST be represented only as a subject's own registry metric over time
  against their own prior windows, with uncertainty and definition-version boundaries visible,
  and as their own experiment log including null and negative outcomes.
- **FR-459**: A streak, an unbroken-period counter or any construct whose value decreases with
  absence MUST NOT exist, because it measures availability rather than practice and penalizes
  leave, illness and on-call rotation.
- **FR-460**: Coaching MUST NOT send an engagement, reminder or nudge notification. A finding
  reaches a subject when they open their view or when a report they subscribed to is generated,
  per FR-035 and FR-436.

#### Honesty contract

- **FR-461**: Every finding MUST carry, as structured fields rather than prose: claim class,
  rule ID, rule version, rule digest, signal registry version, evidence kind, population
  definition, sample sizes, window, collection completeness, coverage, uncertainty, declared
  confounders, falsification condition, content availability, evidence references and
  availability. A model finding fills these fields as FR-473 states.
- **FR-462**: A finding MUST NOT assert more than its inputs support. The claim class MUST be
  the weakest class the inputs permit: an outcome comparison that fails any FR-403 gate
  degrades to `observation`, and an `experiment` claim requires an accepted pre-registration.
- **FR-463**: Uncertainty MUST be expressed as an interval or an explicit statement that an
  interval is not computable, and MUST NOT be omitted or replaced with a confidence word.
- **FR-464**: A finding MUST link to the source records that support it, and drill-down MUST
  apply the viewer's current authorization per FR-048 and domain invariant 10. A model finding's
  citations MUST open the cited turns in session replay under ADR-016 rule 3, and opening another
  person's cited content is a read of session content logged under ADR-016 rule 5.
- **FR-465**: An experiment result MUST record `improved`, `worsened`, `no_detectable_difference`
  or `inconclusive`, MUST display all four outcomes with equal prominence, MUST NOT be re-run
  over a shifted window, and MUST NOT be withheld because its result contradicts the detector
  that proposed it.
- **FR-466**: Experiment outcomes MUST NOT be aggregated across subjects into a claim that a
  practice works. The trials are self-selected and unrandomized, and such an aggregate is the
  causal claim FR-047 forbids wearing a sample size.
- **FR-467**: A finding MUST state what it did not observe when the boundary is material:
  unlinked sessions, uninstrumented work, candidate links excluded from totals, immature
  observations excluded from a mature comparison, and, for model coaching, sessions whose content
  state was `partial`, `missing` or `expired`, per Principle II.
- **FR-468**: Coaching copy MUST carry the product boundaries of domain.md in the finding
  itself rather than in a general disclaimer, and acceptance tests MUST assert the presence of
  those boundary statements in rendered output.

### Non-Functional Requirements

- **NFR-090**: Metric calculation and rule-detector evaluation MUST make zero model calls and
  MUST be deterministic. The same pinned evidence, rule version and signal registry version MUST
  produce byte-identical canonical rule-finding payloads regardless of worker count, partition
  order or evaluation order. On the coaching path, model calls MUST be confined to three sites:
  model coaching (FR-469), model drafting of rule documents (FR-424) and optional narrative
  (FR-426). Each MUST send requests only to the configured provider of FR-476 and MUST have no
  write path to `MetricResult`, metric thresholds, snapshots or rule-detector findings; drafting
  and narrative MUST NOT produce or alter a metric or a finding. Report narrative under spec 001
  NFR-012 and public-repo enrichment under Constitution VII are outside this specification.
- **NFR-091**: A self-view coaching page MUST load within 2 seconds at the 95th percentile on
  the agreed benchmark dataset, consistent with NFR-001. A team-scope coaching view retains the
  NFR-001 bound; an organization-scope coaching view retains the NFR-014 bound of 5 seconds.
- **NFR-092**: A dry run over a bounded window MUST return within 10 seconds at the 95th
  percentile, MUST be rate limited per principal, and MUST NOT be able to consume evaluation
  capacity that delays scheduled report generation.
- **NFR-093**: Rule-detector evaluation MUST read `MetricResult` and partial-aggregate rows and
  MUST NOT scan raw spans or source revisions at team scope or above, consistent with NFR-015.
- **NFR-094**: On the model coaching path, in hosted and local mode, session content MUST be
  sent only in a request to the workspace's configured coaching model provider (FR-476). The
  path MUST have no other outbound destination for content, by construction rather than by
  filter, and content MUST be absent from its logs, retries, dead-letter records and error
  reports (ADR-016 rule 7).
- **NFR-095**: Individual coaching findings, dismissals and experiment records MUST be absent
  from exports, snapshots, published artifacts, dead-letter records, operational logs, audit
  payloads and search indexes readable by another principal, consistent with NFR-010. A restore
  from backup MUST re-apply FR-478 deletion and FR-431 dismissal privacy before serving any
  coaching surface.
- **NFR-096**: The prohibited-claim lexicon check MUST run in the build over every built-in
  rule's rendered output for every template slot combination represented in fixtures, and MUST
  fail the build on a match rather than warn.
- **NFR-097**: The coaching read surface MUST be isolation-preserving under NFR-007. A guessed
  rule ID, finding ID, experiment ID or contributor handle MUST NOT change any response in a way
  that reveals existence.
- **NFR-098**: Rule validation MUST reject an invalid document within 200 milliseconds at the
  95th percentile and MUST name every failed field in one response rather than one field per
  attempt.
- **NFR-099**: Coaching surfaces MUST meet NFR-005 and NFR-006. Uncertainty, availability and
  claim class MUST be conveyed by text and structure rather than by color alone.
- **NFR-100**: The signal registry, the rule schema, the template catalog, the prohibited
  lexicon, the coaching instruction schema and the model finding schema MUST be versioned public
  contracts under NFR-011, with migration fixtures and a deprecation window of at least 90 days.

### Key Entities

| Entity | Required fields beyond scope/ID | Relationships and constraints |
|---|---|---|
| SignalRegistry | version, entries, effective_from, digest | Immutable published version; a detector pins exactly one registry version |
| SignalDefinition | signal_id, source, data_class, evidence_kind, required_capabilities, absent_semantics | data_class is `metadata` or `content`; `content` signals are read by model coaching only; absent semantics is unavailable or unpopulated, never zero |
| CoachingRule | rule_id, owner_scope, subject_id nullable, parent_rule_id nullable, title, status | `personal` requires subject_id; `workspace` requires admin or owner author; `builtin` is not editable in place |
| CoachingRuleVersion | rule_id, version, claim_class, population, predicate, outcome_metric nullable, minimum_cohort, completeness_tolerance, noise_floor_windows, confounders, falsified_if, text_template_id, text_slots, author_text, drafted_by_model nullable, mode, recorded_at, schema_version, digest | Immutable; `draft -> shadow -> active/disabled`; bounded rules only, no executable code; at least one confounder; evaluable `falsified_if` |
| TextTemplate | template_id, version, slots, rendered_forms, digest | Slots accept computed values only; free author text is never part of the claim |
| ProhibitedClaimLexicon | version, terms, effective_from, digest | Versioned contract; build-time gate |
| CoachingFinding | subject_kind, subject_id, detector_kind, rule_version_id nullable, rule_digest nullable, instruction_version_id nullable, provider nullable, model_id nullable, generated_at nullable, category nullable, registry_version, claim_class, evidence_kind, population, sample, window, coverage, completeness, uncertainty, confounders, falsified_if, content_availability, evidence_refs, availability, model_text nullable, content_expires_at nullable, recorded_at, schema_version, digest | subject_kind is contributor or scope; detector_kind is `rule` or `model`; contributor findings readable by the subject and, one subject per read, by leads per FR-427; never aggregated into a leader view; a model finding is `observation` only, immutable, labelled model-generated, and its model_text is encrypted under the content key of its earliest-expiring cited session (spec 005 NFR-077) and hard-deleted at content_expires_at |
| CoachingInstructionVersion | instruction_id, version, instructions, finding_categories, output_schema, signals_read, confounders, lexicon_version, status, recorded_at, digest | Immutable; `builtin` only; contains no session content; readable from every finding it produced |
| CoachingCitation | finding_id, session_id, turn_refs, outcome_refs, project_id nullable, content_state, quote nullable, content_expires_at | Resolves to a session the run read, or the finding is discarded; quote encrypted under the content key of the finding's earliest-expiring cited session (spec 005 NFR-077) and hard-deleted with that content; project_id decides analyst visibility, and a null project is outside every analyst grant |
| CoachingModelSetting | workspace_id, provider nullable, model_id nullable, provider_agreement nullable, changed_by, changed_at, audit_event_id | One per workspace, hosted or local; only an owner (the operator in local mode) may change it; every change is an audited configuration change like `individual_attribution_enabled`; null provider means model coaching is not configured |
| CoachingModelCost | workspace_id, window, provider, model_id, tokens_input, tokens_output, estimated_cost, rate_card_version, recorded_at | Its own cost line at workspace scope; never summed with agent usage or any cost metric |
| CoachingDismissal | subject_id, target_kind, target_id, reason_code, recorded_at | Visible to the subject only; existence and count not inferable by any other principal; does not hide the finding from a lead's read |
| CoachingExperiment | subject_kind, subject_id, source_finding_id, metric_id, metric_version, predicted_direction, decision_rule, pre_window, post_window, state, outcome, outcome_reason, registered_at, evaluated_at, digest | Pre-registered before post-window data accrues; outcome in improved/worsened/no_detectable_difference/inconclusive; immutable once evaluated; never aggregated across subjects |
| DetectorCoverage | scope, connector_id nullable, runtime nullable, registry_version, populated_signals, unpopulated_signals, unavailable_rules, sends_content, sessions_by_content_state, partial_or_missing_by_reason | Reports unpopulated rather than zero; rendered before findings |
| CoachingRunRecord | scope, detector_kind, rule_version_ids, instruction_version_id nullable, model_id nullable, registry_version, evidence_snapshot_id, ran_count, unavailable_count, sessions_read, sessions_partial, sessions_unread_by_content_state, discarded_count, run_state, recorded_at, digest | Makes an empty coaching view explainable, including a failed or unconfigured model run; carries no content; not a metric result |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-060**: Across every built-in detector, every rendered finding for every fixture contains
  zero terms from the prohibited-claim lexicon, verified by a build-time scan that fails the
  build on a match.
- **SC-061**: 100% of emitted findings carry all FR-461 fields populated; a fixture with a
  missing field produces no finding rather than a finding with a blank field.
- **SC-062**: In the paired-cohort fixture, every association's stated cohort sizes, values,
  uncertainty interval and completeness equal a direct recomputation, and every association
  whose difference lies within the subject's historical variation degrades to an observation.
- **SC-063**: A repository-wide search of the schema, the OpenAPI contract, the CLI contract and
  the query surface finds zero shapes expressing a per-person composite score, an experience
  point total, a badge, a streak, a per-contributor finding count, contributors ordered by any
  coaching value, or a coaching read accepting more than one subject.
- **SC-064**: With `individual_attribution_enabled` both true and false, an owner, an admin and
  an analyst with a covering grant each read one developer's findings through the coaching read
  only, and 100% of requests for another contributor's dismissals, mutes, personal rules,
  dry runs or experiments, for more than one contributor's findings in one request, or for a
  finding citing a session outside the reader's access, are denied or return not found across
  UI, API, CLI, export, artifact, notification and job paths. An internal viewer and an
  `is_external` principal are denied every other person's coaching in 100% of probes.
- **SC-065**: Every leader-visible coaching aggregate in the fixture is reproducible from the
  team-scope population alone, and removing all individual findings from the store changes no
  leader-visible value.
- **SC-066**: Editing a detector threshold leaves 100% of previously issued findings
  byte-identical in their canonical payloads, and every trend crossing the version boundary
  renders the boundary rather than a continuous series.
- **SC-067**: A dry run over the fixture persists zero findings, emits zero notifications, and
  returns a finding set that differs from the active version's set, verified by row count rather
  than by absence of visible output.
- **SC-068**: Rule validation rejects 100% of the malformed-rule corpus, which includes embedded
  code, a regular expression, an embedded prompt, a remote URL, an unknown key, a missing
  confounder, an unevaluable `falsified_if`, a signal outside the registry, and a single-direction
  detector, and names every failed field in one response.
- **SC-069**: The same fixture evaluated with every session's content state `present`, with
  subsets `partial` and `missing`, and after expiry to `expired` produces identical values for
  every registry metric and identical rule-detector findings, an explicit entry with its reason
  for every session model coaching could not read or read only in part, zero citations to a turn
  of a `partial` session that carried no content, an explicit unavailable entry for every rule
  detector whose runtime capability is absent, and zero silently omitted detectors.
- **SC-070**: In the cost fixture, priced estimate, unpriced quantity, allocated amount and
  unallocated remainder reconcile to exactly 100% of each canonical cost unit, the billed ledger
  is never summed with the estimate, and the unpriced and unallocated shares appear adjacent to
  the headline.
- **SC-071**: For a team of four humans, the coaching aggregate and every complementary slice
  are suppressed across UI, API, export and job paths in 100% of probes.
- **SC-072**: In the experiment fixture, a contradicting outcome is recorded and rendered with
  the same prominence as a confirming outcome, a re-run over a shifted window creates a new
  record and leaves the original unchanged, and no interface returns a cross-subject success
  rate.
- **SC-073**: Metric calculation and rule-detector evaluation issue zero model calls, verified
  by an instrumented run in which every model call observed originates at one of the three
  NFR-090 sites (model coaching, rule drafting, narrative) and targets the configured provider,
  and in which drafting and narrative change zero metric values and zero findings, and
  rule-detector evaluation produces byte-identical canonical payloads across at least three runs
  with different worker counts and orderings.
- **SC-074**: No export, snapshot, published artifact, log, dead-letter record, audit payload or
  search index in the fixture corpus contains an individual coaching finding, dismissal,
  experiment record or quoted session content, verified by scanning every produced artifact for
  the fixture's known finding digests and content strings.
- **SC-075**: A subject dismissing or muting a finding changes zero metric results and zero
  elements of a lead's read of that subject, and the dismissal leaves zero trace in any other
  principal's view, verified by comparing the full lead-visible surface before and after.
- **SC-076**: Against the recorded-model-response fixture, 100% of shown model findings resolve
  every citation to a session and turn of their subject and carry provider, model ID, instruction
  version, generation time and a model-generated label; 100% of fixture responses with a missing
  or unresolvable citation, a lexicon term, a statement from the causal-claim corpus, a score,
  or an affect inference produce no finding and are counted as discarded in the run record; and
  a second run over the same sessions leaves every issued finding byte-identical.
- **SC-077**: After the cited sessions' content is deleted, 100% of affected model findings keep
  category, citations and time and contain no model-written text or quote, verified by scanning
  the store, a backup restored for the test, and every rendered surface for the fixture's known
  content strings. The same holds, immediately after the change, for findings citing sessions
  that a workspace's shortened content period (minimum 1 day) newly expires.
- **SC-078**: 100% of requests to read another person's coaching in the fixture, including
  requests that return no finding, write exactly one owner/admin-only `AuditEvent` listing the
  finding IDs returned, with zero content in the payload, zero notifications to the subject, and
  zero entries in the subject's FR-094 list; a forced audit-write failure returns no finding.
- **SC-079**: Coaching model spend in the fixture appears as its own cost line, and enabling,
  disabling or changing model coaching changes zero agent usage, allocation,
  `usage.estimated_cost_usd` and registry metric values. 100% of provider changes attempted by an
  admin, analyst or viewer are denied, and every owner change writes one audited configuration
  event.

## Supersessions

| Existing text | Effect of this specification |
|---|---|
| metrics.md Findings: "Rule versions select at most three prioritized findings per overview" | Retained for report overviews. Extended by the coaching finding contract (FR-400, FR-461); the coaching surface is not bounded to three and has its own claim classes |
| metrics.md Findings: "Generated narratives can paraphrase findings with citations but cannot create new metric values, person rankings or unsupported causal statements" | Restated for narrative by FR-426 and enforced at build time by FR-408. Model findings, which ADR-016 adds, meet the same bar through FR-472 and FR-474 |
| FR-096 "Individual coaching output MUST be generated for and visible to its subject" | Amended by ADR-016: readable by the subject and, one subject per read, by owner, admin and an analyst whose grant covers every cited project (FR-427, FR-428, FR-480). Comparison across people remains an absent capability |
| FR-090 no ranking primitive | Extended to the coaching path by FR-401, FR-409, FR-428, FR-430, FR-457 and FR-480 |
| ADR-015 tier table | Superseded by ADR-016. Replaced by content availability (FR-451): rule detectors and metrics are identical with or without content, and model coaching reads content within retention |
| ADR-013 rule 6 "Coaching output belongs to its subject ... not surfaced in a leader's view" | Amended by ADR-016 and implemented by FR-427, FR-429 and FR-479 |
| ADR-013 rule 4 and FR-093/FR-094: the subject is notified of, and can list, views of their data | Do not apply to coaching reads (ADR-016 rule 4). FR-479 logs each read for owner and admin only, with no notification and no entry in the subject's list |
| This spec (2026-09-12) FR-415: no rule clause may reference content "at any tier" | Retained for rule clauses. Session content is read only by model coaching (FR-469), a second detector kind under ADR-016 rule 6 |
| This spec (2026-09-12) FR-426, NFR-090, SC-073 and the C0 gate: zero model calls on the whole coaching path | Narrowed to metric calculation and rule-detector evaluation per Constitution VII 2.0.0. Model coaching calls a model under FR-469 through FR-478 |
| This spec (2026-09-12) FR-412: all coaching output reproducible | Retained for rule detectors. Model findings are cited and immutable instead (FR-470, FR-471) |
| This spec (2026-09-12) FR-427, FR-428: individual coaching readable by the subject only | Replaced by FR-427, FR-428 and FR-480: subject plus leads, one subject per read, never comparative |
| This spec (2026-09-12) FR-432: a subject may delete their findings | Replaced. Findings follow retention (FR-433, FR-478); a subject may dismiss or mute in their own view only (FR-431) and may delete personal rules and experiment records |
| This spec (2026-09-12) FR-450 tier column, FR-451 tier table, FR-452 to FR-454 tier gating and opt-out partial aggregates | Replaced by content availability and runtime capability (FR-449 to FR-454). There is no opt-out; a developer whose collector sends no content appears with content state `missing` in coverage |
| This spec (2026-09-12) FR-433: findings default to 180 days of retention | Replaced: a finding citing sessions is retained no longer than their span metadata (`spans_days`); model text follows FR-478 |
| This spec (2026-09-12) NFR-094: tier 1 content has no transmission path | Replaced: content leaves the platform only to the configured coaching model provider |
| This spec (2026-09-12) US35 tier-aware degradation; US36 scenario 1 denying an owner the subject's coaching | US35 rewritten around `partial`, `missing` and `expired` content states and runtime capability. US36 permits one-at-a-time lead reads and keeps every comparison probe |

## Assumptions

- Runtime-dependent signals (`session.context_utilization_ratio`, `session.compaction_count`,
  `session.shell_confirmation_mode`, edit accept counts) are populated only when a runtime emits
  them as allowlisted metadata. They are unavailable otherwise and are never inferred. Edit
  accept and reject counts are omitted from the initial registry because no initial adapter
  emits them as metadata; adding them is a registry version change, not a code change.
- The noise floor for an outcome metric is computed from the subject's own prior windows for
  that metric at its pinned definition version. A subject without the declared number of prior
  windows has no computable noise floor and receives observations only.
- Team-level coaching uses the same detector vocabulary as individual coaching evaluated over a
  team-scope population; no separate team signal family is introduced.
- The prohibited-claim lexicon is a product convention, not a linguistic guarantee. It is
  versioned and reviewed, and its purpose is to make a violating claim fail a build rather than
  to prove that no violating claim can be phrased.
- Cross-workspace or cross-cohort benchmarks of coaching detector rates are out of scope.
  FR-453 forbids the comparison because the denominator differs by content availability,
  runtime capability and coaching model.
- Individual coaching is derived output, not evidence. Rule-detector findings are regenerable
  from pinned evidence; model findings are not (FR-471) but rest on cited evidence. Neither
  carries an independent legal-hold obligation; FR-433 routes such requests to the source
  evidence, and no hold extends session content beyond 30 days (ADR-016 rule 2).
- Meeting local employment law for content capture and coaching, for example a works-council
  agreement, is the deploying organization's responsibility (ADR-016 Consequences).
- The competitor-analysis input to this specification is a positioning input only. No competitor
  claim, threshold or score is adopted, and no benchmark against it is asserted anywhere in the
  product.
