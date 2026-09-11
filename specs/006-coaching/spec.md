# Feature Specification: Coaching, Inspectable Detectors and Leader Insight

**Feature Branch**: `006-coaching`  
**Created**: 2026-09-12  
**Status**: Draft  
**Input**: Specify the coaching capability made specifiable by ADR-013: an inspectable
user-editable detector system, a self-view for contributors, a team-and-above view for
engineering leaders, a signal inventory bound to the ADR-015 capture tiers, and the claim
discipline that lets coaching reference outcome metrics without asserting causation.

## Product Definition

Spec 001 produces metric results and at most three prioritized findings per overview
(metrics.md, Findings). This specification turns that primitive into a coaching surface:
detectors a user can read and edit, findings that state their own evidence and uncertainty,
experiments that test a suggestion prospectively, and a leader view that reports where cost
and delivery friction sit without reporting on people.

Coaching spans two signal families deliberately. **Process signals** describe how work was
done (sessions, tools, context, review participation). **Outcome signals** describe what
happened to the work afterwards (rework proxy, review latency, CI failure, remediation
markers, production change failure, recovery). Coaching that reads only process signals can
tell a contributor their habits changed but never whether anything got better. Coaching that
asserts the second from the first is the causal claim Principle II and FR-047 forbid. This
specification resolves that tension with a claim lattice (FR-400 through FR-412) rather than
a disclaimer.

This specification adds no new tenancy boundary, no new role and no new aggregation level.
It adds no ranking primitive and does not relax FR-090. Requirements already covered by
specs 001 and 002 are referenced by ID and not restated.

### Delivery scope

| Milestone | User value | Required stories | Shipping gate |
|---|---|---|---|
| C0 | Signal registry, claim lattice, detector schema | Shared foundation | Lexicon check in CI, rule schema rejects executable content, zero model calls on the coaching path |
| C1 | Self-view coaching from tier 0 signals | US31 | Every finding carries evidence kind, sample, uncertainty and falsification condition |
| C2 | Inspectable, editable, testable detectors | US32 | Dry run writes nothing, rule edit creates a new version, historical findings unchanged |
| C3 | Pre-registered experiments | US33 | Null and negative results recorded and displayed with equal prominence |
| C4 | Leader cost and friction view | US34 | Team-and-above only, `k<5` suppression, unallocated and unpriced amounts displayed |
| C5 | Tier-aware degradation and detector coverage | US35 | Unavailable detectors named, never silently omitted |
| C6 | Repurposing resistance | US36 | Adversarial probes across UI, API, export, job and artifact paths |

## User Scenarios & Testing *(mandatory)*

### User Story 31 - Understand my own practice (Priority: P1)

A contributor opens their own coaching view, sees observations about how they worked across
a window, sees where an observation is associated with an outcome in their own history, and
can tell in every case what the claim rests on and what would disprove it.

**Why this priority**: Self-knowledge is the requirement ADR-013 exists to permit, and it is
the only coaching audience that can act without a power asymmetry.

**Independent Test**: A fixture of one contributor with 120 sessions and 40 merged PRs across
two disjoint predicate cohorts produces findings whose stated samples, cohort sizes, evidence
kinds and uncertainty intervals equal a direct recomputation, and whose rendered text contains
no term from the prohibited-claim lexicon.

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

---

### User Story 32 - Read, tune and test a detector (Priority: P1)

A contributor opens the detector that produced a finding, reads its full definition, changes
a threshold, tests the change against their own data without writing anything, and saves it
as a new version that leaves every previously issued finding untouched.

**Why this priority**: An inspectable and user-owned detector is what separates coaching from
an opaque score. A rule a user cannot read is a claim a user cannot check.

**Independent Test**: Editing a threshold on a built-in detector produces a new personal rule
version, a dry run returns a differing finding set with zero persisted rows, and a byte
comparison of every pre-existing finding for that subject shows no change.

**Acceptance Scenarios**:

1. **Given** any finding, **when** the subject opens its source detector, **then** the full
   rule document, its version, its digest, its signal dependencies and its required capture
   tier are readable.
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
receives team-level suggested experiments without seeing any individual.

**Why this priority**: It is the buying question, and it is the view most likely to be built
as a people dashboard by accident.

**Independent Test**: A four-team fixture with one unpriced model, one multi-PR cost unit and
one team of four humans produces a leader view whose priced, unpriced, allocated and
unallocated amounts reconcile exactly, and in which the four-human team is suppressed.

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

---

### User Story 35 - Know what coaching cannot see (Priority: P2)

A workspace running at capture tier 0 sees exactly which detectors could not run and why,
rather than a coaching view that silently contains fewer findings.

**Why this priority**: Silent degradation makes an empty coaching view indistinguishable from
healthy practice, which is the failure mode that would make every other honesty requirement
in this specification cosmetic.

**Independent Test**: The same fixture evaluated at tier 0 and at tier 2 produces identical
tier 0 findings, an explicit unavailable entry for every tier-gated detector at tier 0, and no
metric value that differs between the two runs.

**Acceptance Scenarios**:

1. **Given** a workspace at tier 0, **when** the coaching view loads, **then** each detector
   requiring a higher tier is listed as unavailable with its required tier and the action that
   would enable it.
2. **Given** a workspace that raises its tier, **when** any metric in the registry is
   recomputed, **then** its value is unchanged, per ADR-015 rule 1.
3. **Given** a contributor who opted out of tier 2 capture, **when** a content-derived team
   aggregate is computed, **then** their sessions are excluded, the participation coverage is
   stated, and the aggregate is marked partial.
4. **Given** a session captured at tier 0, **when** a detector reports on its tool usage,
   **then** the view states that payloads were not captured and renders no empty payload pane,
   per ADR-015 rule 6.

---

### User Story 36 - Coaching cannot become performance management (Priority: P1)

A workspace owner with every available privilege, the `individual_attribution_enabled` flag
on, and administrative access to every project attempts to obtain a comparative view of
individuals' coaching, and no path produces one.

**Why this priority**: FR-096 states the rule. This story is the evidence that the rule is
implemented as an absent capability rather than as a filter that a future change can loosen.

**Independent Test**: Every probe across UI, API, CLI, export, published artifact, notification
and background job returns either not found or a subject-scoped result, and a repository-wide
search of the schema and contracts finds no shape expressing per-contributor finding counts.

**Acceptance Scenarios**:

1. **Given** an owner with the flag on and a named-person operational view open, **when** they
   request that subject's coaching findings, **then** the request is denied and the denial
   reason names FR-096 rather than a configuration state.
2. **Given** any principal, **when** they request contributors ordered by finding count,
   open-finding count, detector match rate or experiment outcome, **then** no such request
   shape is accepted by any interface.
3. **Given** a team coaching aggregate, **when** its computation is inspected, **then** it is
   computed from the team-scope population directly and not by combining member-level findings.
4. **Given** a subject who dismisses a finding, **when** any other principal's view is
   rendered, **then** the dismissal, its existence and its count are absent from that view.
5. **Given** an administrator running any export, snapshot or published artifact, **when** the
   output is scanned, **then** it contains no individual coaching finding, dismissal or
   experiment record.

---

### Edge Cases

- A contributor whose two cohorts have materially different collection completeness, so the
  comparison measures instrumentation rather than practice.
- A contributor with no prior windows, so no noise floor for the outcome metric is computable.
- A detector whose outcome metric changes definition version inside the trend window.
- A rule edited during an in-flight experiment that pins that rule version.
- A subject whose contributor identities are merged by an audited alias action after findings
  were issued under one of them.
- A workspace that lowers its capture tier while tier 2 content within retention still exists.
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

  No other class may exist. A finding MUST NOT carry two classes or an unclassified claim.
- **FR-401**: An `association` MUST be computed within one subject for individual coaching and
  within one team for team coaching. A comparison between two contributors MUST NOT be
  computable by any detector, which extends FR-090 to the coaching path.
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
  rather than a review convention.
- **FR-409**: A composite score, index or grade over a contributor, a session, a practice
  category or a team MUST NOT exist. A scalar that orders subjects cannot satisfy the evidence
  contract of FR-007 because it has no single formula, sample, exclusion set or availability
  state, and it reconstructs the ranking FR-090 makes impossible.
- **FR-410**: Coaching MUST NOT produce a metric value. Findings read `MetricResult` rows and
  MUST NOT write, adjust, derive or cache an alternative value for any registry metric, per
  FR-007 and NFR-012.
- **FR-411**: A finding MUST be suppressed when any metric it reads is `unavailable` or
  `suppressed`. An empty coaching view MUST state how many detectors ran, how many were
  unavailable and why, and MUST NOT be presented as an absence of problems.
- **FR-412**: Coaching output MUST be reproducible. The same pinned evidence, rule version and
  signal registry version MUST produce the identical canonical finding payload and digest;
  evaluation timestamps sit outside that digest per Principle I.

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
  MUST NOT reference a raw content field at any tier.
- **FR-416**: A rule document MUST declare: `id`, `version`, `claim_class`, `owner_scope`,
  `required_tier`, `required_capabilities`, `population`, `predicate`, `outcome_metric` for an
  association, `minimum_cohort`, `completeness_tolerance`, `noise_floor_windows`, `confounders`,
  `falsified_if`, `text_template_id` and `text_slots`. Every field MUST be present; a missing
  field MUST fail validation with the field named.
- **FR-417**: `falsified_if` MUST state a concrete observation that would make the finding not
  hold, expressed in the same clause vocabulary as the predicate so that it is evaluable rather
  than rhetorical. A rule whose `falsified_if` is unevaluable MUST fail validation.
- **FR-418**: Emitted claim text MUST come from a versioned template catalog whose slots accept
  only computed values: numbers, metric IDs and versions, window bounds, cohort sizes,
  enumerated reason codes and availability states. An author MAY supply `rationale` and
  `suggested_action` free text, bounded in length, rendered in a region labelled as author text,
  excluded from the claim, and subject to FR-408.
- **FR-419**: `owner_scope` MUST be exactly one of `builtin`, `personal` or `workspace`. A
  `personal` rule MUST apply only to its owning subject's own view. A `workspace` rule MUST be
  authored by an admin or owner, MUST apply only at team scope and above, and MUST NOT produce
  individual output. A `builtin` rule MUST NOT be edited in place; editing it creates a
  `personal` or `workspace` derivative that records its parent rule ID and version.
- **FR-420**: A personal rule, its edits and its dry runs MUST NOT affect any team or
  organization aggregate. Leader-visible aggregates MUST be computed only from `builtin` and
  `workspace` rules, so that neither a subject can tune themselves out of a team signal nor a
  leader's number can depend on a subject's private configuration.
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
  read tier 1 or tier 2 content.
- **FR-425**: Two active detectors producing contradictory suggested actions on the same
  population MUST both be shown with their evidence rather than resolved by priority, and the
  view MUST state that they disagree. Silent selection of one would present a preference as a
  finding.
- **FR-426**: Detector evaluation MUST make zero model calls and MUST be deterministic, per
  Principle VII and NFR-012. Optional narrative may paraphrase an emitted finding with citations
  and MUST NOT create a finding, a claim class, a metric value or a suggested action.

#### Individual coaching

- **FR-427**: Individual coaching MUST be generated for and readable by the subject only, per
  FR-096. It MUST be readable in the subject's self view at full fidelity with no suppression,
  per FR-091, in local and hosted mode.
- **FR-428**: No interface MUST accept a contributor identifier for a coaching read other than
  an identity linked to the requesting user. This MUST be enforced by the absence of the
  parameter in the schema and the query surface, not by an authorization check that a future
  role could satisfy.
- **FR-429**: Individual coaching findings, dismissals and experiments MUST NOT appear in a
  named-person operational view, an audit record's payload, an export, a snapshot, a published
  artifact, a notification to any other principal, a search index readable by another principal,
  or any job output.
- **FR-430**: A team or organization aggregate MUST NOT be computed from individual findings.
  Aggregates MUST be computed directly from the team-scope population resolved under FR-062 and
  FR-063. A count, share or distribution of contributors by finding state MUST NOT exist.
- **FR-431**: A subject MUST be able to dismiss or mute a finding or a detector for themselves.
  The dismissal, its reason, its count and its existence MUST NOT be observable by any other
  principal or inferable from any aggregate.
- **FR-432**: A subject MUST be able to delete their own coaching findings and experiment
  records. Deletion MUST leave no leader-visible trace and MUST NOT alter any metric result,
  because coaching is derived output rather than evidence.
- **FR-433**: Individual coaching findings MUST have a retention bound no longer than the
  evidence they derive from and MUST default to 180 days. They MUST NOT be included in a legal
  or administrative export; a request for a subject's record MUST be answered from the
  underlying source evidence under existing authorization, never from coaching output.
- **FR-434**: A subject MUST see which of their identities and which repositories contributed to
  each finding, so that a finding computed over a merged alias population is inspectable.
- **FR-435**: Alias merges and identity link changes after a finding was issued MUST NOT
  retroactively alter that finding. A subsequent evaluation MUST produce a new finding over the
  union population.
- **FR-436**: Coaching MUST NOT be delivered to a subject as an unsolicited external message.
  Delivery MUST use the in-product inbox per FR-035.

#### Leader and organization view

- **FR-437**: Leader coaching MUST be available at `team`, `project` and `organization` scope
  only, MUST follow the read matrix of FR-087, and MUST apply `k<5` and complementary
  suppression per FR-098. Bot contributors MUST NOT count toward the threshold of five.
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
- **FR-445**: A leader-visible suggested action MUST be a team-level or process-level
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

#### Signal inventory and tier behavior

- **FR-449**: A versioned `SignalRegistry` MUST enumerate every signal a detector may reference,
  and each entry MUST declare its source, its required capture tier, its evidence kind, its
  availability semantics when absent, and the runtime capability that must be present for it to
  be populated. A detector MUST NOT reference a signal outside the registry.
- **FR-450**: The initial registry is exactly:

  | Signal | Source | Tier | Kind | Notes |
  |---|---|---|---|---|
  | `session.elapsed_seconds` | Telemetry | 0 | measured | Elapsed time, never labor |
  | `session.state` | Telemetry | 0 | measured | `completed` or `interrupted`; interruption is not abandonment |
  | `session.repository_count` | Telemetry | 0 | measured | Distinct repositories touched; scope-spread proxy |
  | `session.tool_call_count` | Telemetry | 0 | measured | By tool name only |
  | `session.tool_error_count` | Telemetry | 0 | measured | Error class only; no error text stored |
  | `session.shell_tool_call_count` | Telemetry | 0 | measured | Requires runtime capability declaring shell tool identity |
  | `session.shell_confirmation_mode` | Telemetry | 0 | measured | Only when the runtime emits it as metadata; otherwise unavailable |
  | `session.named_command_count` | Telemetry | 0 | measured | Command name only; arguments are content |
  | `session.context_utilization_ratio` | Telemetry | 0 | measured | Only when the runtime emits window size and occupancy |
  | `session.compaction_count` | Telemetry | 0 | measured | Runtime-dependent; absent is unavailable, never zero |
  | `session.context_reference_count` | Telemetry | 0 | measured | Count of attached references; the references themselves are tier 1 |
  | `session.prompt_length_tokens` | Telemetry | 0 | measured | Length only; the text is tier 1 |
  | `session.model_id` | Telemetry | 0 | measured | Identifier only |
  | `session.turn_count` | Telemetry | 0 | measured | |
  | `usage.tokens_input`, `usage.tokens_output`, `usage.cache_read`, `usage.cache_write` | Telemetry | 0 | measured | Canonical owner units only, per `agent.tokens_*` |
  | `usage.estimated_cost_usd` | Derived | 0 | measured | Estimate, never billed spend |
  | `change.lines_added`, `change.lines_deleted`, `change.files_touched` | Git | 0 | measured | After versioned exclusions |
  | `change.test_line_ratio` | Git | 0 | proxy | Not executed coverage |
  | `pr.review_present`, `pr.approval_present`, `pr.first_review_hours`, `pr.cycle_hours` | GitHub | 0 | measured | Reviewed is not approved |
  | `pr.rework_21d` | Derived | 0 | proxy | Repeat file touches; no line-survival claim |
  | `ci.attempt_failed` | GitHub | 0 | measured | Canceled and running excluded |
  | `deploy.production_success`, `incident.verified_link`, `incident.recovery_hours` | Deployment / incident connectors | 0 | measured | Verified links only |
  | `link.session_change_verified` | Derived | 0 | measured | Candidate links excluded |
  | `content.prompt_text`, `content.response_text`, `content.tool_arguments`, `content.tool_results`, `content.file_paths` | Telemetry | 1 or 2 | inferred | Detectors reading these emit inferred findings only |

  Git, GitHub, deployment and incident signals are connector-sourced and are not gated by the
  ADR-015 content tier; they are available at tier 0.
- **FR-451**: Coaching capability by tier MUST be exactly:

  | Tier | Coaching available | Where | Aggregation |
  |---|---|---|---|
  | 0 | Every process detector over metadata signals, every outcome association, the full leader view | Local and hosted | Individual self-view and team-and-above aggregates |
  | 1 | Tier 0 plus content-derived detectors | Local machine only | Self-view only; never transmitted, never aggregated, never an input to a hosted experiment |
  | 2 | Tier 0 plus content-derived detectors over redacted content within its retention bound | Hosted, workspace-scoped | Self-view, plus content-derived team aggregate only when the cohort has at least five participating humans |

- **FR-452**: A detector whose `required_tier` exceeds the session's or workspace's actual tier
  MUST report `unavailable` with the required tier named. Coaching MUST NOT degrade silently:
  the view MUST list detectors that ran, detectors that were unavailable, and the reason for
  each.
- **FR-453**: A coaching finding MUST record the capture tier of the data that produced it. A
  finding count, a matched share or a detector rate MUST NOT be compared across workspaces or
  across tiers, because a higher tier enables additional detectors and changes the denominator
  of what could have fired.
- **FR-454**: A content-derived team aggregate MUST state participating members against cohort
  size, MUST be marked partial whenever any member opted out per ADR-015 rule 3, and MUST be
  `unavailable` when fewer than five humans participated.
- **FR-455**: The following signals MUST NOT exist in the registry at any tier: inferred
  emotional state, frustration, sentiment or tone of a person; keystroke, idle, focus or
  screen-activity monitoring; inferred effort or engagement; and any inference about a named
  person's state of mind. A detector referencing such a signal MUST fail validation. Capitalized
  text and profanity are content, and treating them as a measure of a person is affect inference
  rather than process observation.
- **FR-456**: A detector coverage view MUST state, per connector and per runtime, which
  registry signals that source can populate, which it cannot, and which detectors are therefore
  unavailable. Absence of a signal MUST be reported as unpopulated, never as a zero value, per
  FR-024.

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
  confounders, falsification condition, capture tier, evidence references and availability.
- **FR-462**: A finding MUST NOT assert more than its inputs support. The claim class MUST be
  the weakest class the inputs permit: an outcome comparison that fails any FR-403 gate
  degrades to `observation`, and an `experiment` claim requires an accepted pre-registration.
- **FR-463**: Uncertainty MUST be expressed as an interval or an explicit statement that an
  interval is not computable, and MUST NOT be omitted or replaced with a confidence word.
- **FR-464**: A finding MUST link to the source records that support it, and drill-down MUST
  apply the viewer's current authorization per FR-048 and domain invariant 10.
- **FR-465**: An experiment result MUST record `improved`, `worsened`, `no_detectable_difference`
  or `inconclusive`, MUST display all four outcomes with equal prominence, MUST NOT be re-run
  over a shifted window, and MUST NOT be withheld because its result contradicts the detector
  that proposed it.
- **FR-466**: Experiment outcomes MUST NOT be aggregated across subjects into a claim that a
  practice works. The trials are self-selected and unrandomized, and such an aggregate is the
  causal claim FR-047 forbids wearing a sample size.
- **FR-467**: A finding MUST state what it did not observe when the boundary is material:
  unlinked sessions, uninstrumented work, candidate links excluded from totals, and immature
  observations excluded from a mature comparison, per Principle II.
- **FR-468**: Coaching copy MUST carry the product boundaries of domain.md in the finding
  itself rather than in a general disclaimer, and acceptance tests MUST assert the presence of
  those boundary statements in rendered output.

### Non-Functional Requirements

- **NFR-090**: Coaching evaluation MUST make zero model calls and MUST be deterministic. The
  same pinned evidence, rule version and signal registry version MUST produce byte-identical
  canonical finding payloads regardless of worker count, partition order or evaluation order.
- **NFR-091**: A self-view coaching page MUST load within 2 seconds at the 95th percentile on
  the agreed benchmark dataset, consistent with NFR-001. A team-scope coaching view retains the
  NFR-001 bound; an organization-scope coaching view retains the NFR-014 bound of 5 seconds.
- **NFR-092**: A dry run over a bounded window MUST return within 10 seconds at the 95th
  percentile, MUST be rate limited per principal, and MUST NOT be able to consume evaluation
  capacity that delays scheduled report generation.
- **NFR-093**: Detector evaluation MUST read `MetricResult` and partial-aggregate rows and MUST
  NOT scan raw spans or source revisions at team scope or above, consistent with NFR-015.
- **NFR-094**: Tier 1 content MUST have no transmission path by construction, per ADR-015 rule
  2. A tier 1 detector, its findings and its dry runs MUST be unreachable from any hosted code
  path, not merely filtered out of one.
- **NFR-095**: Individual coaching findings, dismissals and experiment records MUST be absent
  from exports, snapshots, published artifacts, dead-letter records, operational logs, search
  indexes readable by another principal, and backups restored into any leader-visible surface,
  consistent with NFR-010.
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
- **NFR-100**: The signal registry, the rule schema, the template catalog and the prohibited
  lexicon MUST be versioned public contracts under NFR-011, with migration fixtures and a
  deprecation window of at least 90 days.

### Key Entities

| Entity | Required fields beyond scope/ID | Relationships and constraints |
|---|---|---|
| SignalRegistry | version, entries, effective_from, digest | Immutable published version; a detector pins exactly one registry version |
| SignalDefinition | signal_id, source, required_tier, evidence_kind, required_capabilities, absent_semantics | Absent semantics is unavailable or unpopulated, never zero |
| CoachingRule | rule_id, owner_scope, subject_id nullable, parent_rule_id nullable, title, status | `personal` requires subject_id; `workspace` requires admin or owner author; `builtin` is not editable in place |
| CoachingRuleVersion | rule_id, version, claim_class, required_tier, population, predicate, outcome_metric nullable, minimum_cohort, completeness_tolerance, noise_floor_windows, confounders, falsified_if, text_template_id, text_slots, author_text, drafted_by_model nullable, mode, recorded_at, schema_version, digest | Immutable; `draft -> shadow -> active/disabled`; bounded rules only, no executable code; at least one confounder; evaluable `falsified_if` |
| TextTemplate | template_id, version, slots, rendered_forms, digest | Slots accept computed values only; free author text is never part of the claim |
| ProhibitedClaimLexicon | version, terms, effective_from, digest | Versioned contract; build-time gate |
| CoachingFinding | subject_kind, subject_id, rule_version_id, rule_digest, registry_version, claim_class, evidence_kind, population, sample, window, coverage, completeness, uncertainty, confounders, falsified_if, capture_tier, evidence_refs, availability, recorded_at, schema_version, digest | subject_kind is contributor or scope; contributor findings readable by the subject only; never aggregated into a leader view |
| CoachingDismissal | subject_id, target_kind, target_id, reason_code, recorded_at | Visible to the subject only; existence and count not inferable by any other principal |
| CoachingExperiment | subject_kind, subject_id, source_finding_id, metric_id, metric_version, predicted_direction, decision_rule, pre_window, post_window, state, outcome, outcome_reason, registered_at, evaluated_at, digest | Pre-registered before post-window data accrues; outcome in improved/worsened/no_detectable_difference/inconclusive; immutable once evaluated; never aggregated across subjects |
| DetectorCoverage | scope, connector_id nullable, runtime nullable, registry_version, populated_signals, unpopulated_signals, unavailable_rules, capture_tier | Reports unpopulated rather than zero; rendered before findings |
| CoachingRunRecord | scope, rule_version_ids, registry_version, evidence_snapshot_id, ran_count, unavailable_count, recorded_at, digest | Makes an empty coaching view explainable; not a metric result |

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
  point total, a badge, a streak, a per-contributor finding count, or contributors ordered by
  any coaching value.
- **SC-064**: With `individual_attribution_enabled` true and an owner acting inside an
  administered project, 100% of requests for another contributor's coaching findings,
  dismissals or experiments are denied across UI, API, CLI, export, artifact, notification and
  job paths.
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
- **SC-069**: The same fixture evaluated at tier 0 and tier 2 produces identical values for
  every registry metric, an explicit unavailable entry for every tier-gated detector at tier 0,
  and zero silently omitted detectors.
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
- **SC-073**: Coaching evaluation issues zero model calls, verified by an instrumented run, and
  produces byte-identical canonical payloads across at least three runs with different worker
  counts and orderings.
- **SC-074**: No export, snapshot, published artifact, log, dead-letter record or search index
  in the fixture corpus contains an individual coaching finding, dismissal or experiment record,
  verified by scanning every produced artifact for the fixture's known finding digests.
- **SC-075**: A subject deleting their coaching findings changes zero metric results and leaves
  zero leader-visible traces, verified by comparing the full leader-visible surface before and
  after.

## Supersessions

| Existing text | Effect of this specification |
|---|---|
| metrics.md Findings: "Rule versions select at most three prioritized findings per overview" | Retained for report overviews. Extended by the coaching finding contract (FR-400, FR-461); the coaching surface is not bounded to three and has its own claim classes |
| metrics.md Findings: "Generated narratives can paraphrase findings with citations but cannot create new metric values, person rankings or unsupported causal statements" | Restated as a normative requirement on the coaching path by FR-426 and enforced at build time by FR-408 |
| FR-096 "Individual coaching output MUST be generated for and visible to its subject" | Implemented by FR-427 through FR-436 as absent capability rather than filtered access |
| FR-090 no ranking primitive | Extended to the coaching path by FR-401, FR-409, FR-430 and FR-457 |
| ADR-015 tier table | Bound to concrete coaching capabilities by FR-449 through FR-454 |

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
  FR-453 forbids the comparison because the denominator differs by tier and capability.
- Individual coaching is derived output, not evidence. It is regenerable from pinned evidence
  and carries no independent legal-hold obligation; FR-433 routes such requests to the source
  evidence.
- The competitor-analysis input to this specification is a positioning input only. No competitor
  claim, threshold or score is adopted, and no benchmark against it is asserted anywhere in the
  product.
