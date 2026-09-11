# Feature Specification: Session Replay and Agent Telemetry Reconstruction

**Feature Branch**: `005-session-replay`  
**Created**: 2026-09-12  
**Status**: Draft  
**Input**: Specify the OTLP ingestion boundary, session reconstruction, tiered replay surface,
coverage honesty rules, per-tool-call detail, usage-to-owner association and the multi-runtime
capability matrix required to make an agent session inspectable under ADR-015.

## Product Definition

Spec 001 accepts redacted OTLP traces (FR-019 through FR-024) and stores `Session`, `Span` and
`UsageUnit`, but defines no surface on which a person can see what an agent actually did. This
specification defines that surface, the ingestion contract that feeds it, and the honesty rules
that keep it from overstating what was observed.

ADR-015 governs. Content capture has three tiers; tier 0 is the default and is sufficient for
every deterministic metric (ADR-015 rule 1). Replay at tier 0 is a metadata surface: the span
tree, timings, tool names, error classes and token counts, with an explicit statement that
payloads were not captured. This specification adds no metric and changes no metric definition.

This specification extends the existing entities. `Session`, `Span` and `UsageUnit`
(data-model.md:34-36) are extended, never duplicated. Requirements already covered by spec 001
are referenced by ID and not restated.

The upstream sender is the Dash0 agent plugin. Its behaviour is a verified external contract, not
an assumption: it filters attributes with a deny list, so every new upstream field is exported by
default (ADR-015 rule 5), and its OTLP JSON attribute value carries only `stringValue` or
`intValue`, so booleans and floats arrive as strings. Both facts are load-bearing below.

### Delivery scope

| Milestone | User value | Required stories | Shipping gate |
|---|---|---|---|
| R0 | Receiver accepts and sanitizes real traffic | Shared foundation | Independent allowlist, unknown keys discarded, string-typed value coercion, idempotent replay |
| R1 | A single-turn session is navigable | US30, US31 | Turn tree rebuilt from fixtures for all four runtimes, coverage banner before any value |
| R2 | Token and cost totals are honest | US32 | Canonical-owner accounting, no double count, `known_incomplete` stated where true |
| R3 | Sub-agent work is navigable | US33 | Sibling-shape and nested-shape trees both reconstructed by agent ID |
| R4 | Degraded and interrupted sessions are legible | US34 | Dangling, orphan, interrupted and unreconstructable states rendered distinctly |
| R5 | Local replay shows payloads | US35 | Tier 1 store has no transmission path; secret scan at every tier |
| R6 | Capability matrix is a product artifact | US36 | Versioned matrix shipped with the adapter and rendered in product |

## User Scenarios & Testing *(mandatory)*

### User Story 30 - Replay what the agent did (Priority: P1)

A developer opens one recorded session and reads, in order, the turn that ran, every tool the
agent called, how long each took, which failed, and what the turn cost — without needing the
agent's transcript or their terminal scrollback.

**Why this priority**: It is the feature. Every other story in this specification exists to keep
this one from lying.

**Independent Test**: A Claude Code fixture of one session with 3 turns and 14 tool calls, two of
them failures, renders a timeline whose tool order, durations and error classes match the fixture
exactly, states the capture tier, and shows no payload pane.

**Acceptance Scenarios**:

1. **Given** a tier 0 session, **when** the developer opens replay, **then** the tool calls appear
   in start-time order with name, duration and status, and the payload region states that
   arguments and results were not captured at this workspace's tier rather than rendering empty.
2. **Given** a turn whose chat span has not yet arrived, **when** replay is opened, **then** the
   turn is shown as in progress with its observed tool calls and a stated incomplete usage total,
   and no cost figure is presented as final.
3. **Given** a tool call with error status, **when** the developer opens it, **then** an error
   class is shown, and at tier 0 no raw exception text is shown because none was retained.
4. **Given** a session whose spans arrived out of order across three deliveries, **when** replay
   is opened, **then** display order is derived from parent relationships and span start time, not
   from receipt order, and the rendering is identical to a single-delivery fixture.

---

### User Story 31 - Ingest telemetry without trusting the sender (Priority: P1)

An admin registers a collector and the platform accepts its traces, keeping only attributes it
recognizes, discarding everything else, and never storing a payload the workspace's tier forbids
— even when the sender transmits one.

**Why this priority**: The upstream sender filters with a deny list. A field added upstream
arrives by default. Trusting it is the one mistake this product cannot survive.

**Independent Test**: A trace batch carrying every allowlisted attribute plus twelve unrecognized
keys (including `process.working_directory`, `user.name`, `dash0.team.name`, `traceparent`, two
rate-limit keys and a synthetic future key) is accepted; a scan of the resulting rows, indexes,
logs and quarantine records finds zero occurrences of the twelve.

**Acceptance Scenarios**:

1. **Given** a span carrying an attribute key absent from the allowlist, **when** it is ingested,
   **then** the attribute is discarded before persistence, quarantine and logs, the span is still
   accepted, and a redaction counter records the category and count without the key's value.
2. **Given** a workspace at tier 0 and a sender configured with `omit_io=false`, **when** spans
   carrying `gen_ai.tool.call.arguments` arrive with real content, **then** the content is
   discarded at the receiver and no tier 0 record contains it.
3. **Given** a token count arriving as `stringValue` `"12345"` and another as `intValue`
   `"12345"`, **when** both are ingested, **then** both normalize to the integer 12345.
4. **Given** a token count arriving as `"-1"`, `"1.5"` or `"abc"`, **when** it is ingested,
   **then** the attribute is rejected, the usage unit's accounting status becomes `unknown`, and no
   count becomes zero.
5. **Given** the identical sanitized batch delivered twice, **when** both are processed, **then**
   the second is a no-op with no new accounting effect and is not reported as a partial rejection
   per FR-023 and integrations.md:176-178.

---

### User Story 32 - Trust the session's token and cost total (Priority: P1)

An engineering lead reads a session's token and cost figures and knows whether they are complete,
which tokens are excluded, and which parts are estimates rather than spend.

**Why this priority**: A silently under-reported cost figure is the most damaging failure this
product can produce. The runtimes make it easy: Claude Code's own auxiliary model calls fire no
hook and appear in the user's `/usage` but in no span.

**Independent Test**: A Claude Code fixture whose harness made one unobserved auxiliary call
reports a total marked `known_incomplete` with the reason named, and the figure is never presented
as the session's full consumption.

**Acceptance Scenarios**:

1. **Given** a runtime whose harness makes model calls outside the hook surface, **when** a
   session total is displayed, **then** the total is labelled as observed-only, states that
   harness-internal calls are not instrumented, and states that the figure may be lower than the
   vendor's own usage view.
2. **Given** a sub-agent whose chat rounds fold into the parent turn's usage, **when** totals are
   computed, **then** the sub-agent's usage unit is `included_in_parent` and contributes zero
   additional tokens, and the sub-agent's pane states that its usage is reported by its parent.
3. **Given** a session on GitHub Copilot CLI, **when** a cost figure is requested, **then** no
   spend figure is produced, the seat-licensed billing model is stated, and any token-priced
   figure is labelled an estimate that is not expenditure.
4. **Given** a model identifier the price catalog does not contain, including the `cursor-auto`
   router placeholder, **when** cost is computed, **then** the usage remains unpriced with
   availability stated and no amount is rendered as 0.00.
5. **Given** cache creation totals plus their 5-minute and 1-hour ephemeral breakdown, **when** a
   total is computed, **then** the breakdown is presented as components of the total and is never
   added to it.

---

### User Story 33 - Follow a sub-agent's work (Priority: P2)

A developer who spawned three sub-agents sees each one as its own branch of the session, with the
tools that agent called beneath it, at any nesting depth.

**Why this priority**: Sub-agent work is where a session becomes unreadable from scrollback, so it
is where replay is worth the most. It is also where the wire tree does not match the logical tree.

**Independent Test**: A Claude Code fixture with one sub-agent that itself spawns a nested
sub-agent, and a Copilot fixture of equivalent shape, both render a 3-level logical tree with the
same tool membership per agent, despite the two wire shapes differing.

**Acceptance Scenarios**:

1. **Given** hook-derived spans where a sub-agent's tool calls are siblings of its `invoke_agent`
   span under the spawning tool-call span, **when** the tree is reconstructed, **then** those tool
   calls appear as children of the sub-agent, grouped by `gen_ai.agent.id`, not by wire position.
2. **Given** natively nested spans where the sub-agent's tool calls are already children of the
   `invoke_agent` span, **when** the tree is reconstructed, **then** the resulting logical tree is
   identical in shape to the reconstructed sibling-shape tree.
3. **Given** an orphan span whose parent span ID is not present, **when** it matches the derived
   span ID of an observed agent ID, **then** it is reattached to that agent's branch and the
   reattachment method is recorded.
4. **Given** a nested spawn three levels deep, **when** the tree is reconstructed, **then** each
   level's parent is resolved from the agent ID naming the caller, with no shared sender state
   assumed and no depth limit below 8.

---

### User Story 34 - Understand a degraded or interrupted session (Priority: P2)

A developer opens a session that was interrupted mid-turn, and one recorded on a runtime whose
sub-agent linkage is known to be broken, and in both cases understands what is missing rather
than believing they are seeing everything.

**Why this priority**: Three of the four runtimes are degraded in a named, reproducible way.
Rendering a degraded session as a complete one converts a known limitation into a false claim.

**Independent Test**: A Cursor fixture with a dangling sub-agent span, a fixture whose session
identifier was absent and substituted, and a fixture ending in the interrupted-session error chat
span each render a distinct, named state with a user-visible explanation.

**Acceptance Scenarios**:

1. **Given** a runtime that drops the sub-agent start signal, **when** replay is opened, **then**
   the sub-agent span is shown attached where the sender placed it, labelled as unanchored, and the
   session's sub-agent linkage coverage states `dangling` with the runtime named.
2. **Given** a session terminated before its turn completed, **when** replay is opened, **then**
   the turn is shown with error status and the state `interrupted`, and the cause is stated as
   unavailable rather than inferred.
3. **Given** a span whose session identifier was missing and randomly substituted by the sender,
   **when** it is ingested, **then** its session is marked `unreconstructable`, it is excluded from
   every per-session metric, and it is counted in ingestion coverage.
4. **Given** two sub-agent tool-call spans whose sender-derived span IDs collide because the
   runtime reuses one agent identifier across tasks, **when** they are ingested, **then** both are
   retained under distinct internal identities, neither is quarantined as a conflicting duplicate,
   and the session's sub-agent linkage coverage states `ambiguous`.
5. **Given** a sub-agent tool call the sender dropped because its trace context was already
   consumed, **when** replay is opened, **then** the absence is not presented as the agent doing
   nothing, because instrumentation coverage for that branch is `partial`.

---

### User Story 35 - Turn on local replay and see payloads (Priority: P3)

A developer enables local replay on their own machine with one command and can then see the
arguments a tool received and the result it returned, for their own sessions, with credentials
redacted and with no path by which that content reaches the hosted service.

**Why this priority**: It is the capability that makes replay answer "what happened" instead of
only "what ran", and ADR-015 permits it only on the machine that produced it.

**Independent Test**: With tier 1 enabled, a session's tool arguments and results are visible
locally; a credential-shaped string in a tool result is stored redacted; and every sync, export
and published-artifact path produces output containing none of the content.

**Acceptance Scenarios**:

1. **Given** tier 1 enabled on a local workspace, **when** a session is replayed, **then** tool
   arguments, tool results, prompts and responses are shown, each labelled with the capture tier
   that produced them.
2. **Given** tier 1 content on disk, **when** any sync, export, snapshot or published artifact is
   produced, **then** the content is absent because no code path reads the tier 1 store, not
   because a filter excluded it.
3. **Given** a tool result containing a credential-shaped string, **when** it is stored at tier 1,
   **then** the credential is replaced before storage and the redaction is recorded.
4. **Given** a workspace enabling tier 2, **when** capture begins, **then** an admin action, a
   retention bound of at most 30 days, an audit record and prior notification of every affected
   contributor all exist, and an opted-out contributor's sessions remain at tier 0.
5. **Given** a mixed workspace where some sessions are tier 0 and some tier 2, **when** any metric
   is computed, **then** the values are identical to those computed with every session at tier 0.

---

### User Story 36 - Compare runtimes through the capability matrix (Priority: P3)

An admin choosing which coding agents to instrument reads one in-product table stating exactly
which telemetry each runtime provides, before deciding.

**Why this priority**: The differences are large, permanent and not the customer's fault. Hiding
them in a footnote converts an honest product into a surprising one.

**Independent Test**: The in-product matrix is generated from the same versioned artifact the
ingestion pipeline uses to decide coverage, and a fixture whose runtime lacks a capability produces
a coverage state that matches the matrix row without a separate hand-maintained list.

**Acceptance Scenarios**:

1. **Given** a registered collector, **when** the admin opens the runtime matrix, **then** every
   capability is stated as available, unavailable or placeholder for that runtime and adapter
   version, with the reason for each unavailability.
2. **Given** a capability the matrix declares unavailable, **when** a session on that runtime is
   replayed, **then** the corresponding field states unavailable with the matrix's reason and never
   states zero, none or false.
3. **Given** a runtime that emits a fixed placeholder in place of a real value, **when** that value
   is ingested, **then** it is stored as unknown with the reason `placeholder_value` and is never
   rendered as a real value.
4. **Given** an adapter version bump that changes a capability, **when** historical sessions are
   replayed, **then** they retain the matrix version in force when they were collected.

---

### Edge Cases

- A turn with zero tool calls, and a turn with 2,000 tool calls.
- A tool call whose end time precedes its start time, and one whose interval lies entirely outside
  its parent's interval, on a machine with an unsynchronized or non-monotonic clock.
- A chat span arriving twice: once from turn completion and once from the interrupted-session
  fallback, differing only in end time, status and usage.
- A sub-agent whose spans arrive after its parent turn's chat span, and one whose spans arrive
  after the session's end.
- A sub-agent that spawns a sub-agent that spawns a sub-agent, and a cycle asserted by a forged
  agent ID.
- A session whose spans arrive from two collectors, and two workspaces whose sessions share an
  external session identifier.
- A span asserting a conversation identifier that belongs to another workspace's session.
- A model changing mid-session, and a session whose spans name three providers.
- Usage present on the parent and also on the child, and usage present on neither.
- Cache read counts exceeding input tokens, and an ephemeral breakdown exceeding its total.
- A tool name of 4KB, a tool name containing control characters, and an MCP tool name colliding
  with a built-in tool name.
- A `Skill` tool call with no skill name, and a skill loaded by context injection so it lands on
  the chat span with no tool call at all.
- A workspace downgrading from tier 2 to tier 0 with content still inside the retention bound.
- A contributor opting out of tier 2 while one of their sessions is mid-capture.
- A session deleted by project deletion while a replay view is open.

## Requirements *(mandatory)*

### Functional Requirements

#### A. Ingestion: the OTLP receiver

- **FR-300**: Replay MUST be fed only through the OTLP `/v1/traces` receiver defined by FR-019
  through FR-024 and integrations.md:165-179. No replay-specific ingestion route, bulk upload or
  vendor-specific API may exist. Collector identity MUST be server-derived; a `gen_ai.conversation.id`,
  `traceId` or `dash0.team.name` supplied by a client MUST never determine workspace, project or
  team scope.
- **FR-301**: The receiver MUST accept the span shapes the upstream sender emits and no others:
  `SpanKind=Internal` spans whose `gen_ai.operation.name` is `chat`, `invoke_agent` or
  `execute_tool`. A span with any other kind or operation name MUST be rejected with a safe
  content-free diagnostic and counted, not stored as an unclassified span.
- **FR-302**: The receiver MUST NOT accept the span's `name` field as data. Display names MUST be
  reconstructed from the validated operation name, model and tool name per integrations.md:135-136,
  because the wire name embeds the model and tool name a second time and is the sender's string.
- **FR-303**: `traceState`, `flags`, `status.message`, span `events` and span `links` MUST be
  discarded. Decision: `status.message` is discarded even though it is the only field carrying the
  sender's error text, because retaining arbitrary exception content at tier 0 contradicts
  integrations.md:136-137. Error classification is specified in FR-351.
- **FR-304**: Batch limits, attribute count and depth limits, quota checks and partial-success
  semantics MUST follow integrations.md:167-179 unchanged. A span rejected for an allowlist reason
  MUST NOT be reported as a partial rejection when the span itself was accepted with attributes
  discarded; only invalid and conflicting spans count as rejected.

#### B. Ingestion: the independent attribute allowlist

- **FR-305**: The receiver MUST apply its own allowlist and MUST discard every key not named in it,
  at every capture tier, per ADR-015 rule 5. The allowlist MUST be a closed enumeration in the
  adapter contract, versioned per NFR-011. An attribute key absent from the enumeration MUST NOT
  reach persistence, quarantine, operational logs, job payloads, caches, search indexes or
  exports. Adding a key MUST require a contract version change and a fixture, never a
  configuration setting.
- **FR-306**: The tier 0 allowlist is exactly the following, and this set MUST be sufficient for
  every replay behaviour in section C and every metric in metrics.md. It supersedes and extends
  integrations.md:99-131; rows marked new were absent there.

  | Accepted key | New | Normalized meaning and validation |
  |---|---|---|
  | `traceId`, `spanId`, `parentSpanId` | | Lowercase hex 32/16/16; nonzero; absent parent permitted only on a `chat` span |
  | `startTimeUnixNano`, `endTimeUnixNano` | | Integer nanosecond strings; negative duration rejected per FR-321 |
  | `status.code` | | Unset/OK/Error only; message discarded per FR-303 |
  | `kind` | | Must equal Internal; otherwise the span is rejected per FR-301 |
  | resource `service.name`, `service.version`; scope `name`, `version` | | Registered runtime/plugin identifiers, max 128 chars; never authority |
  | `gen_ai.conversation.id` | | Opaque external session ID, max 256 chars; scoped by collector |
  | `gen_ai.operation.name` | | Enum `chat`, `execute_tool`, `invoke_agent` |
  | `gen_ai.request.model` | | Catalog-normalized model, max 128 chars; unknown stays unpriced |
  | `gen_ai.provider.name` | | Catalog-normalized provider, max 128 chars |
  | `gen_ai.harness.name` | | Registered runtime identifier, max 128 chars; selects the capability matrix row |
  | `gen_ai.agent.name` | | Declared agent or sub-agent type, max 128 chars |
  | `gen_ai.agent.id` | | Opaque caller-naming agent ID, max 256 chars; load-bearing for FR-325 |
  | `gen_ai.tool.name` | | Validated tool identifier, max 128 chars; control characters reject the attribute |
  | `gen_ai.tool.call.id` | | Opaque tool-call ID, max 256 chars |
  | `gen_ai.tool.type` | Yes | Enum; only `function` is recognized in v1 |
  | `gen_ai.request.reasoning.level` | Yes | Free-form string, max 32 chars; Claude Code only; no rounding or bucketing |
  | `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens` | | Nonnegative int64; nullable when absent, never zero when absent |
  | `gen_ai.usage.cache_read.input_tokens` | | Nonnegative int64; inclusive/exclusive semantics per FR-356 |
  | `gen_ai.usage.cache_creation.input_tokens` | | Nonnegative int64; unavailable on Codex and Copilot |
  | `gen_ai.usage.reasoning.output_tokens` | Yes | Nonnegative int64; emitted only when above zero, so absence means none on Claude Code and Copilot and means unavailable elsewhere |
  | `dash0.gen_ai.usage.cache_creation.ephemeral_5m.input_tokens` | Yes | Nonnegative int64; component of cache creation, never additive per FR-357 |
  | `dash0.gen_ai.usage.cache_creation.ephemeral_1h.input_tokens` | Yes | Nonnegative int64; same constraint |
  | `dash0.gen_ai.code.lines_added`, `dash0.gen_ai.code.lines_removed` | Yes | Nonnegative int64; a proxy per Constitution II, never line authorship |
  | `dash0.gen_ai.tool.bash.command_family` | Yes | Bounded family enum, max 64 chars; unknown family stored as unknown |
  | `dash0.gen_ai.tool.skill.name` | Yes | Skill identifier, max 128 chars; never a filesystem path |
  | `dash0.gen_ai.tool.skill.source` | Yes | Bounded route enum distinguishing model-chosen from person-invoked |
  | `dash0.gen_ai.tool.mcp_server` | | Registered server identifier, max 128 chars; no endpoint URL; placeholder handled by FR-353 |
  | `dash0.gen_ai.billing_mode`, `dash0.gen_ai.plan_type` | | Bounded classification; absence is undetermined, never per-token |
  | `dash0.gen_ai.billing_provider` | Yes | Bounded vendor enum; meaningful only with an externally metered billing mode |
  | `dash0.gen_ai.vcs.repository.url.full` | | Canonical allowed-host remote; userinfo, query and fragment stripped |
  | `dash0.gen_ai.vcs.repository.name`, `.owner.name`, `.provider.name` | | Validation hints only; resolved repository is authoritative |
  | `dash0.gen_ai.vcs.ref.head.name`, `.ref.head.type`, `.ref.head.revision` | | Safe ref/type/full SHA; observed checkout state only |
  | `dash0.gen_ai.vcs.pull_request.url`, `.issue.url`, `.commit.sha` | | Canonical source links and full SHA; candidate evidence only per FR-025 |
  | `dash0.gen_ai.user.identity.source` | Yes | Bounded enum; attribution confidence only; not identifying, never hashed |
  | `dash0.warning` | Yes | Matched against a registry of known sender warnings to produce a coverage reason code; the raw string is discarded per FR-310 |
  | `user.email` | | Transient only per FR-309; consumed to compute a contributor digest and then discarded |

- **FR-307**: The tier 1 and tier 2 content extension is exactly the following keys, and they MUST
  be discarded outright at tier 0: `gen_ai.input.messages`, `gen_ai.output.messages`,
  `gen_ai.tool.call.arguments`, `gen_ai.tool.call.result`, `gen_ai.conversation.name`,
  `exception.message`. `gen_ai.conversation.name` is in this set because the sender derives the
  session title from the user's first prompt, making it user content rather than a label.
- **FR-308**: The following keys MUST be denied at every tier, and the denial MUST be enumerated
  rather than left to the absence of an allowlist entry, so that a fixture can assert it:
  span `name`, `user.name`, `process.working_directory`, `dash0.team.name`, `traceparent`,
  `dash0.gen_ai.rate_limit.*` in every form, `dash0.gen_ai.credits.*` in every form, and every key
  the sender's own deny list happens to cover today. Reasons per group:

  | Denied | Reason |
  |---|---|
  | span `name` | Sender-authored string; reconstructed per FR-302 |
  | `user.name` | Plaintext contributor identity; forbidden by data-model.md:13 and ADR-011 |
  | `process.working_directory` | Local filesystem path; forbidden by data-model.md:13 |
  | `dash0.team.name` | Sender-asserted team label; team scope comes from ADR-011 entities, and a sender-supplied label is not authorization |
  | `traceparent` | Propagation header naming a trace that exists only on the developer's machine; correlation is deliberately not attempted per FR-323 |
  | `dash0.gen_ai.rate_limit.*`, `dash0.gen_ai.credits.*` | Allowance and credit snapshots, dropped by integrations.md:133-138. Consequence accepted and disclosed: rate-limit exhaustion is not an observable cause of a stalled session. Revisiting requires an ADR |
  | any unrecognized key | ADR-015 rule 5; the sender exports new fields by default |

- **FR-309**: `user.email` MUST be consumed only inside the trusted ingestion process to compute
  the `Contributor` `identity_digest` per FR-069, and MUST then be discarded. It MUST NOT be
  written to any column, index, log, quarantine record, job payload, cache, backup or export, and
  MUST NOT cross a process or queue boundary, per NFR-021.
- **FR-310**: `dash0.warning` and, where admitted, `exception.message` MUST be matched against a
  versioned registry of known sender-emitted sentinel strings to derive a bounded reason code. An
  unmatched value MUST produce `unknown_warning` or `unknown_error` respectively, and the raw
  string MUST be discarded at tier 0 and MUST NOT be echoed in any diagnostic.

#### C. Ingestion: normalization, typing and idempotency

- **FR-311**: The receiver MUST treat the sender's OTLP attribute value as carrying only
  `stringValue` or `intValue`. Every allowlisted attribute MUST declare its logical type and MUST
  be coerced exactly as follows. A value failing coercion MUST cause the attribute to be discarded
  and counted; it MUST NOT be defaulted.

  | Logical type | Accepted wire forms | Coercion rule |
  |---|---|---|
  | Integer count | `intValue` decimal string; `stringValue` of digits only, optional leading `-` | Parse as int64; reject negative, non-integer and out-of-range |
  | Boolean | `stringValue` exactly `true` or `false` | Any other value is invalid; absence is not false |
  | Decimal | `stringValue` decimal | Parse as decimal; never as binary floating point, per data-model.md:8 |
  | Bounded enum | `stringValue` | Must match the enumeration; unmatched becomes unknown with a reason, never the enum's first member |
  | Opaque string | `stringValue` | Length and character validation; control characters reject the attribute |

- **FR-312**: Because the sender emits an integral JSON number as a digit-only `stringValue` and an
  explicitly typed int64 as `intValue`, both forms MUST normalize to the same integer for every
  usage and line-count attribute. A fixture MUST cover both forms of every such key, because the
  form varies by which runtime injected the value.
- **FR-313**: Normalization MUST write to the existing entities. A `chat` span with no parent
  becomes the turn anchor; `invoke_agent` and `execute_tool` spans become `Span` rows with a new
  `span_type`; usage attributes on a span become at most one `UsageUnit` whose `owner_span_id` is
  that span, per data-model.md:36. No new span or usage table may be introduced.
- **FR-314**: Session identity MUST remain unique per workspace, collector and external session ID
  (data-model.md:34). Two workspaces or two collectors presenting the same external session ID MUST
  resolve to different sessions with no cross-visibility, per NFR-007.
- **FR-315**: Span identity MUST remain unique per collector, trace and span (data-model.md:35).
  Idempotency MUST be decided on the digest of the sanitized attribute set plus timings and status:
  an identical replay is a no-op with no new accounting effect; a conflicting duplicate is
  quarantined per FR-023 without replacing the original.
- **FR-316**: One conflicting-duplicate case MUST be treated as a finalization rather than
  quarantined: a `chat` span whose repeat differs only in `endTimeUnixNano`, `status.code` and
  usage attributes. The sender emits such a span when a session ends with a turn still open, so
  the repeat is the completion of a known-open record. It MUST supersede the original with
  `supersedes_id` set, and the original MUST remain readable. Any other differing field MUST
  quarantine.
- **FR-317**: A span whose sender-derived span ID collides with an existing span in the same trace
  MUST be retained under a distinct internal span key with the wire span ID preserved, and MUST NOT
  be quarantined. Decision: the collision is a known upstream property — one runtime reuses a
  single agent identifier across successive tasks, and the spawning tool-call span's ID is derived
  from that identifier — so treating it as evidence corruption would discard real work. The
  affected session's sub-agent linkage coverage MUST become `ambiguous` per FR-344.
- **FR-318**: A span whose `gen_ai.conversation.id` is absent, or whose session was created from a
  sender-substituted random identifier signalled by `dash0.warning`, MUST produce a session in
  state `unreconstructable`. Such a session MUST be excluded from every per-session metric, MUST
  be counted in ingestion coverage, and MUST NOT be silently merged into any other session.
- **FR-319**: Ingestion MUST record, per session, the collector, runtime, runtime version, plugin
  version, adapter version and capability matrix version in force, per FR-021 and integrations.md:79-80.
  A later matrix version MUST NOT retroactively change a stored session's coverage.

#### D. Session reconstruction

- **FR-320**: A session MUST be reconstructed as an ordered list of turns, each turn a tree rooted
  at its parentless `chat` span. Turns MUST be ordered by the root span's start time. A span whose
  trace has no root `chat` span MUST produce a turn in state `orphan_turn` rather than being hidden.
- **FR-321**: Timestamps MUST be treated as originating from an unsynchronized developer machine
  clock. The receiver MUST reject a span whose end time precedes its start time (integrations.md:108).
  It MUST NOT reject a child span lying wholly or partly outside its parent's interval; it MUST
  record a `clock_anomaly` flag on the span and surface it in replay. Display order MUST be derived
  from parent relationships and start time, with ties broken by span ID lexicographic order so the
  rendering is deterministic. Receipt order MUST NOT affect order or content, per NFR-008.
- **FR-322**: Sub-agent structure MUST be reconstructed from `gen_ai.agent.id`, which names the
  calling agent, rather than from wire tree position. The two observed wire shapes MUST produce the
  same logical tree:

  | Wire shape | Observed on | Reconstruction |
  |---|---|---|
  | Sibling shape: the sub-agent's `invoke_agent` span and its `execute_tool` spans are all children of the spawning tool-call span | Hook-derived runtimes | Group the spawning tool-call span's children by `gen_ai.agent.id`; re-parent the non-`invoke_agent` members under the `invoke_agent` span sharing that agent ID |
  | Nested shape: the `execute_tool` spans are already children of the `invoke_agent` span | Natively instrumented runtime | Accept as given; assert the same agent ID grouping holds |

- **FR-323**: Reconstruction MAY use the sender's deterministic span-ID derivation to repair
  linkage, and MUST record the method used. The derivations in force are:

  | Derived value | Derivation | Role in replay |
  |---|---|---|
  | Spawning tool-call span ID | SHA-256 over the sub-agent's agent ID, first 8 bytes, hex | Load-bearing. Lets a sub-agent's spans name their parent with no shared sender state, so nesting works at any depth |
  | Log-correlation trace ID | SHA-256 over the session ID, first 16 bytes, hex | Not used for turn spans; a turn's trace ID is random per turn. Reconstruction MUST NOT assume a session maps to one trace |
  | Log-correlation span ID | SHA-256 over the session ID, bytes 16 to 24, hex | Same; MUST NOT be assumed to identify any turn's chat span |

  An orphan span MAY be reattached when its parent span ID equals the derived span ID of an observed
  agent ID. `traceparent` correlation MUST NOT be attempted, because the header names a trace that
  exists only on the developer's machine.
- **FR-324**: A recomputed derivation MUST NOT be an authorization or authenticity mechanism. A
  span ID is derived from values a client supplies, so matching a derivation proves only a
  consistent claim. Reattachment MUST never widen a principal's visible population, cross a
  workspace or collector boundary, or override server-derived scope, per NFR-007 and NFR-019.
- **FR-325**: Sub-agent nesting depth MUST be supported to at least 8 and MUST be bounded. A cycle
  asserted by agent IDs MUST be detected at reconstruction time, MUST NOT recurse, and MUST render
  the affected branch as `ambiguous` rather than failing the session.
- **FR-326**: A span whose parent is absent and unrepairable MUST be rendered as an orphan attached
  to its turn root with its orphan status stated. It MUST NOT be discarded, hidden, or silently
  attached to an arbitrary parent.
- **FR-327**: A turn whose root `chat` span carries error status and the interrupted-session
  sentinel MUST produce turn state `interrupted`. The cause MUST be stated as unavailable, because
  the sender's reason field is denied upstream and by FR-308. An interrupted turn MUST NOT be
  presented as a failure of the agent's work.
- **FR-328**: A turn with no chat span yet observed MUST be rendered `in_progress` with its
  observed tool calls shown and its usage total stated incomplete. It MUST NOT be rendered as
  complete, and its cost MUST NOT be presented as final.
- **FR-329**: Reconstruction MUST be a pure function of the accepted span set, the capability matrix
  version and the reconstruction algorithm version. The same inputs MUST produce a byte-identical
  canonical reconstruction, and the algorithm version MUST be recorded on the session, per
  Constitution I.

#### E. Replay surface

- **FR-330**: Replay MUST present, for a selected session: a coverage and tier statement, the list
  of turns, and for a selected turn a chronological timeline, a tool-call list, a sub-agent tree, a
  usage and cost panel, and an error list. The coverage and tier statement MUST appear before any
  numeric value, mirroring FR-079.
- **FR-331**: The tool-call list MUST show, per call, the tool name, start time, duration, status
  and error class, in start-time order per FR-321. Duration MUST be labelled reconstructed rather
  than measured on runtimes where the sender derives it from a reported elapsed time instead of
  observing both endpoints.
- **FR-332**: The sub-agent tree MUST show each sub-agent as a node bearing its agent name, its
  span count, its elapsed interval and its linkage state, with its tool calls beneath it per
  FR-322. A sub-agent whose usage folds into its parent MUST state that its usage is reported by
  its parent rather than showing zero tokens.
- **FR-333**: The usage panel MUST show accumulation across the turn: input, output, cache read,
  cache creation and reasoning tokens as separate quantities, each either a count or an explicit
  unavailable state. An unavailable category MUST NOT render as 0, per Constitution I.
- **FR-334**: Tier-dependent rendering MUST be exactly as follows, per ADR-015 rule 6. A tier 0
  session MUST state that payloads were not captured. An empty payload pane MUST NOT be rendered at
  any tier.

  | Element | Tier 0 | Tier 1 | Tier 2 |
  |---|---|---|---|
  | Turn list, timings, status | Shown | Shown | Shown |
  | Tool name, call ID, duration, status, error class | Shown | Shown | Shown |
  | Token counts and cost estimate | Shown | Shown, identical to tier 0 | Shown, identical to tier 0 |
  | Sub-agent tree and linkage state | Shown | Shown | Shown |
  | Tool arguments and results | Stated not captured, with the tier named | Shown, secret-redacted | Shown, secret-redacted, retention-bounded |
  | Prompt and response content | Stated not captured | Shown, secret-redacted | Shown, secret-redacted, retention-bounded |
  | Session title | Stated not captured | Shown where the runtime provides one | Shown where the runtime provides one |
  | Raw error text | Never shown; class only | Shown | Shown |
  | Any metric value | Unchanged by tier | Unchanged by tier | Unchanged by tier |

- **FR-335**: Every value shown in replay MUST carry a tier provenance label, so a reader can tell
  metadata from content. A tier 1 or tier 2 value MUST be visually distinguished from a tier 0 value
  and MUST NOT be presented as though it were universally available.
- **FR-336**: Replay MUST NOT be a publication surface. No tier 1 or tier 2 content may enter a
  `PublishedArtifact`, `Snapshot`, `Export` or machine-readable manifest, at any role, profile or
  redaction setting, per ADR-015 rule 4. A replay view MUST offer no content export.
- **FR-337**: Tier 1 content MUST reside in a store that no sync, export, snapshot or publication
  code path reads. This MUST be achieved by a separate entity with no reader in those paths, not by
  a flag checked at read time, per ADR-015 rule 2.
- **FR-338**: Tool arguments, tool results, prompts and responses MUST be scanned for
  credential-shaped strings and redacted before storage at every tier, including tier 1, per
  ADR-015 rule 7. A redaction MUST record the category and count, never the matched value.
- **FR-339**: Tier 2 capture MUST require an admin action, a retention bound of at most 30 days, an
  audit record, and notification of every affected contributor before capture begins. An opted-out
  contributor's sessions MUST remain at tier 0, per ADR-015 rule 3. A tier downgrade MUST stop
  capture immediately and MUST delete retained content within the retention bound.
- **FR-340**: Replay MUST be reachable at every scope level a principal is authorized for, and MUST
  apply FR-087, FR-091 and FR-092 unchanged. An external principal (`is_external`) MUST NOT reach
  replay at all, because a session is a per-person record and FR-085 denies the contributor
  dimension absolutely.

#### F. Coverage and honesty

- **FR-341**: Every session MUST carry an explicit coverage record with the following fields, each a
  bounded state plus a reason code plus a user-visible explanation. A field MUST NOT be omitted
  when its state is the healthy one; absence of a coverage field MUST NOT mean complete.

  | Coverage field | States | Meaning |
  |---|---|---|
  | `reconstruction_state` | `complete`, `partial`, `orphan_turn`, `interrupted`, `unreconstructable` | Whether the span tree rebuilt into a navigable session |
  | `span_completeness` | `complete`, `partial`, `unknown` | Whether spans are believed to be all that the session produced |
  | `usage_completeness` | `complete`, `known_incomplete`, `unknown` | Whether observed token totals are believed to be the session's full consumption |
  | `subagent_linkage` | `anchored`, `dangling`, `ambiguous`, `unavailable` | Whether sub-agent spans are correctly parented |
  | `tool_duration_source` | `measured`, `reconstructed`, `unavailable` | How tool durations were obtained |
  | `content_tier` | `0`, `1`, `2` | The tier that produced the record, per ADR-015 |
  | `identity_confidence` | `git`, `os`, `absent` | Provenance of the attribution, from the sender's identity source |
  | `placeholder_fields` | List of field names | Fields whose value was a runtime placeholder and is stored unknown |

- **FR-342**: `usage_completeness` MUST be `known_incomplete` whenever the runtime's harness is
  known to make model calls outside the instrumented hook surface. This is presently true of Claude
  Code, whose auxiliary calls — session-title generation among them — fire no hook, so their tokens
  appear in the vendor's own usage view and in no span. The product MUST state this wherever a
  session, project or organization token or cost total derived from those sessions is displayed or
  exported. Decision: this is stated as a permanent property of the runtime, not a transient
  collection gap, because no configuration of the sender can observe those calls.
- **FR-343**: A token or cost total whose `usage_completeness` is not `complete` MUST NOT be
  presented as the session's consumption. It MUST be labelled observed-only, MUST name the reason,
  and MUST state that the true figure may be higher. A rollup containing any such session MUST
  inherit the label and MUST state the count of contributing sessions that are incomplete.
- **FR-344**: Each known runtime gap MUST map to a coverage state rather than to a hidden
  behaviour. The mapping MUST be exactly:

  | Known gap | Runtime | Coverage effect | User-visible statement |
  |---|---|---|---|
  | Harness-internal model calls fire no hook | Claude Code | `usage_completeness=known_incomplete`, reason `harness_internal_calls_unobserved` | Observed tokens exclude the agent's own auxiliary calls, so the total may be lower than the vendor's usage view |
  | Sub-agent start signal dropped; stop span dangles under the chat span | Cursor | `subagent_linkage=dangling` | Sub-agent work is recorded but not anchored to the tool call that started it |
  | No hook-based sub-agent linkage; structure sourced natively | Copilot CLI | `subagent_linkage=anchored` with source stated | Sub-agent structure comes from the runtime's own telemetry, not from hooks |
  | Per-edit line counts absent | Copilot CLI | Line-count fields `unavailable` | This runtime does not report changed-line counts; it is not zero lines |
  | One agent identifier reused across tasks; derived span IDs collide | Codex | `subagent_linkage=ambiguous` per FR-317 | Two sub-agent tasks cannot be told apart with certainty |
  | Sub-agent trace context not released on stop; later tool spans dropped by the sender | Codex | `span_completeness=partial` | Some sub-agent tool calls were not transmitted; absence is not inactivity |
  | Tool duration reconstructed from a reported elapsed time | Codex | `tool_duration_source=reconstructed` | Durations are derived, not measured at both endpoints |
  | Cache-creation tokens not reported | Codex, Copilot CLI | Cache-creation `unavailable` | This runtime does not report cache-creation tokens; it is not zero |
  | Reasoning level not reported | Cursor, Codex, Copilot CLI | Reasoning level `unavailable` | Only one runtime reports the requested reasoning level |
  | Session title not reported | Cursor, Codex, Copilot CLI | Title `unavailable` | This runtime provides no session title |
  | MCP server is a fixed placeholder | Cursor | `placeholder_fields` includes the MCP server field | The runtime reports a placeholder, so the real server is unknown |
  | Model reported as a router placeholder | Cursor | Model `unknown` for pricing, `placeholder_fields` includes the model | The router did not disclose which model ran, so usage is unpriced |
  | Session identifier absent and randomly substituted | All | `reconstruction_state=unreconstructable` per FR-318 | This record could not be attached to a session |
  | Propagation header deliberately not correlated | Copilot CLI | No effect; documented | The runtime's own trace is not correlated with this one |

- **FR-345**: A capability the matrix declares unavailable MUST render as unavailable with the
  matrix's reason. It MUST NOT render as zero, none, false, empty or absent, per FR-024 and
  Constitution I. A fixture MUST assert this for every unavailable cell of every runtime row.
- **FR-346**: Export of a session's own telemetry MUST carry the coverage record verbatim. A
  downstream consumer MUST be able to tell an unavailable value from a zero without consulting this
  specification.
- **FR-347**: Instrumentation coverage MUST remain independent of Git collection coverage
  (integrations.md:96-97). Absence of a span MUST NOT be treated as absence of activity anywhere in
  the product, because the sender is fail-open and bounded.
- **FR-348**: The product MUST NOT present a session's elapsed interval as labor, a tool-call count
  as productivity, or a line count as authorship, per Constitution II. Replay is an inspection
  surface; every derived figure it shows MUST carry the classification required by FR-007.

#### G. Tool-call detail

- **FR-349**: Per tool call, the following MUST be recorded and rendered at the stated tier. A field
  unavailable for the runtime MUST follow FR-345.

  | Field | Tier 0 | Tier 1 and 2 | Notes |
  |---|---|---|---|
  | Tool name | Yes | Yes | Normalized; MCP tool names normalized to a canonical form |
  | Tool call ID | Yes | Yes | Opaque; used to join, never to authorize |
  | Tool type | Yes | Yes | Only `function` recognized in v1 |
  | Start time, end time, duration | Yes | Yes | Duration source labelled per FR-331 |
  | Status | Yes | Yes | From `status.code` only |
  | Error class | Yes | Yes | Derived per FR-351; raw text tier 1 and 2 only |
  | Bash command family | Yes | Yes | Bounded family, not the command line |
  | Skill name and skill source | Yes | Yes | Source distinguishes model-chosen from person-invoked |
  | MCP server | Yes | Yes | Placeholder handled per FR-353 |
  | Lines added, lines removed | Yes | Yes | Proxy per Constitution II; unavailable on one runtime |
  | Model | Yes | Yes | May be absent on a sub-agent's tool call; unavailable, not the parent's model |
  | Arguments, result | Not captured, stated | Shown, secret-redacted | Truncation marker preserved per FR-352 |

- **FR-350**: A skill loaded by context injection rather than by a tool call MUST be recorded on the
  turn's chat span and MUST NOT be rendered as a tool call. Its absence from the tool-call list MUST
  NOT be read as the skill not being used. One runtime loads skills exclusively this way.
- **FR-351**: Error class MUST be derived from `status.code` plus the sentinel registry of FR-310,
  producing one of a bounded set including at least `tool_error`, `interrupted_session` and
  `unknown_error`. Classification MUST NOT be performed by retaining or pattern-matching arbitrary
  exception content at tier 0.
- **FR-352**: Content admitted at tier 1 or 2 MUST preserve the sender's truncation marker as a
  distinct state. A truncated value MUST be rendered as truncated with the sender's reported total
  size, and MUST NOT be presented as the complete argument or result. The receiver MUST apply its
  own size bound independently and MUST NOT assume the sender truncated.
- **FR-353**: A field whose value is a known runtime placeholder MUST be stored as unknown with
  reason `placeholder_value` and MUST be listed in `placeholder_fields`. The placeholder registry
  MUST be part of the versioned capability matrix. It MUST include at minimum: one runtime's MCP
  server field, whose value is always the literal runtime name and never a real server; and the
  same runtime's router model identifier, which names the router rather than the model that ran. A
  placeholder MUST NOT be rendered as a real server or a real model, and MUST NOT be priced.
- **FR-354**: A tool call observed without a corresponding start signal, or with a start and no
  completion, MUST be rendered with the missing endpoint stated and MUST NOT be assigned a fabricated
  duration or an end time equal to the session's end.

#### H. Cost association

- **FR-355**: Usage MUST be associated with exactly one canonical owner span per ADR-005, research
  R5 and data-model.md:36. `accounting_status` MUST be `canonical`, `included_in_parent` or
  `unknown`; non-canonical units MUST be excluded from every total. Where a runtime folds a
  sub-agent's chat rounds into the parent turn, the sub-agent's unit MUST be `included_in_parent`
  and MUST contribute zero additional tokens.
- **FR-356**: Cache-read counts MUST NOT be added to input totals without a versioned adapter
  fixture proving that runtime's inclusive or exclusive semantics, per integrations.md:149-151. Until
  such a fixture exists for a runtime, its cache-read total MUST be reported separately and MUST NOT
  enter a combined input figure.
- **FR-357**: The 5-minute and 1-hour ephemeral cache-creation counts MUST be treated as a breakdown
  of the cache-creation total, never as additional quantities. Their sum MUST NOT be added to the
  total, and a sum exceeding the total MUST produce a validation exclusion rather than a corrected
  figure.
- **FR-358**: A token-priced figure MUST remain a `CostEstimate` and MUST NOT be presented as spend.
  Billing classification MUST follow the sender's bounded values, and absence MUST mean undetermined,
  never per-token. Where a runtime is sold per seat, no spend figure may be produced for it at all;
  a token-priced figure MUST be labelled an estimate that is not expenditure, per FR-029 and
  integrations.md:153-156.
- **FR-359**: An unknown or placeholder model MUST leave its usage unpriced with availability stated,
  per FR-027. Unpriced usage MUST NOT be rendered as 0.00 and MUST be counted in the cost panel's
  unresolved-usage figure.
- **FR-360**: Attributing a session's cost to a repository, PR or change MUST remain candidate
  linkage per FR-025 and research R6. Replay MUST NOT introduce a new attribution path. A session
  touching several repositories MUST NOT attach its full cost to each, per integrations.md:161-163.

#### I. Multi-runtime capability matrix

- **FR-361**: The runtime capability matrix MUST be a versioned first-class artifact, shipped with
  the adapter, consumed by the ingestion pipeline to decide coverage, and rendered in product. The
  rendered matrix and the enforcing matrix MUST be the same artifact; a hand-maintained
  documentation copy MUST NOT exist.
- **FR-362**: The v1 matrix is exactly the following. `Yes` means the field is populated by that
  runtime; `No` means the runtime does not provide it and the field is unavailable, not zero.

  | Capability | Claude Code | Cursor | Codex | Copilot CLI |
  |---|---|---|---|---|
  | Turn chat span | Yes | Yes | Yes | Yes |
  | Tool-call span | Yes | Yes | Yes | Yes (native source) |
  | Sub-agent span emitted | Yes | Yes | Yes | Yes (native source) |
  | Sub-agent correctly anchored | Yes | No, dangling | Ambiguous on agent reuse | Yes, native source |
  | Sub-agent usage of its own | No, folds into parent | No, folds into parent | No, folds into parent | No, folds into parent |
  | Input and output tokens | Yes | Yes | Yes | Yes |
  | Cache-read tokens | Yes | Yes | Yes | Yes |
  | Cache-creation tokens | Yes | Yes | No | No |
  | Ephemeral cache-creation breakdown | Yes | No | No | No |
  | Reasoning tokens | Yes | No | No | Yes |
  | Requested reasoning level | Yes | No | No | No |
  | Model identifier | Yes | Placeholder router ID | Yes | Yes |
  | Tool duration | Measured | Measured | Reconstructed | Measured, native source |
  | MCP server | Yes | Placeholder | Yes | Yes |
  | Skill name and source | Yes, via tool call | Yes, via tool call | Yes, via context injection on the chat span | Yes, via vendor field |
  | Changed-line counts | Yes | Yes | Yes | No |
  | Session title | Yes | No | No | No |
  | VCS enrichment | Yes | Yes | Yes | Yes |
  | Identity source | Yes | Yes | Yes | Yes |
  | Billing mode and plan type | Yes | No | Yes, subscription or unknown only | No, per-seat |
  | Externally metered billing provider | Yes | No | No | No |
  | Rate-limit and credit snapshots | No | No | Emitted upstream, denied at ingest per FR-308 | No |
  | Harness-internal calls observable | No | Unknown | Unknown | Unknown |
  | Prompt and response content available at tier 1 and 2 | Yes | Yes | Yes | Yes, native source |

- **FR-363**: A runtime not present in the matrix MUST be ingested as `unverified`: its spans are
  accepted and stored, every capability-dependent field is `unknown`, and its sessions are excluded
  from cross-runtime comparison until a certification fixture passes, per research R4. A matrix row
  MUST NOT be added without a fixture run.

### Non-Functional Requirements

- **NFR-070**: Replay of a session of up to 2,000 spans MUST render its turn list within 2 seconds
  and a selected turn's full tree, tool list and usage panel within 1 second, at the 95th
  percentile, matching NFR-001's overview and drill-down bounds. Reconstruction MUST NOT be
  performed in the browser from raw spans.
- **NFR-071**: Reconstruction MUST be bounded and MUST NOT be quadratic in span count. Rebuilding a
  session of 2,000 spans with nesting depth 8 MUST complete within 250 milliseconds at the 95th
  percentile server-side, and MUST NOT issue a query per span or per sub-agent.
- **NFR-072**: Reconstruction MUST be deterministic and reproducible. The same accepted span set,
  capability matrix version and algorithm version MUST produce a byte-identical canonical
  reconstruction regardless of arrival order, delivery batching, worker count or partition order,
  per Constitution I and NFR-008.
- **NFR-073**: The receiver MUST sustain the accepted-span rates of NFR-002 and NFR-013 with the
  allowlist, coercion, sentinel matching, secret scan and idempotency digest all applied inline. The
  allowlist MUST be an exact-match lookup with no per-span regular-expression evaluation over
  unknown keys.
- **NFR-074**: Valid spans MUST become replayable within 60 seconds at the 95th percentile, per
  NFR-003. Replay MUST display the accepted-evidence watermark, so a session still receiving spans
  is visibly incomplete rather than silently partial.
- **NFR-075**: Discarding an attribute MUST be constant-cost and MUST NOT allocate or log the
  value. A batch consisting entirely of unrecognized attributes MUST NOT degrade throughput by more
  than 10% relative to a batch of entirely allowlisted attributes.
- **NFR-076**: No content or identity excluded by tier or allowlist may appear in any accepted
  record, quarantine record, operational log, trace, metric, cache, search index, backup, crash dump
  or export, per NFR-010. A tier 1 store MUST have no reader in any sync, export or publication code
  path, verified by dependency inspection rather than by runtime assertion.
- **NFR-077**: Tier 2 content MUST be deleted within its retention bound of at most 30 days, and a
  tier downgrade MUST stop capture within one session boundary. Deletion MUST leave a content-free
  tombstone, per data-model.md:107-113.
- **NFR-078**: Replay MUST be isolation-preserving under NFR-007. A conversation ID, trace ID, span
  ID, agent ID or tool-call ID supplied by a client MUST NOT widen the visible population, and a
  guessed identifier MUST NOT produce a response distinguishable from that of a nonexistent one.
  Because span IDs are derivable from client-supplied values, they MUST NOT be treated as
  unguessable.
- **NFR-079**: Replay views MUST meet WCAG 2.2 AA per NFR-005 and MUST remain usable at 360px
  width per NFR-006. A deep sub-agent tree and a long tool-call list MUST remain navigable at that
  width with wide content contained rather than overflowing the page.
- **NFR-080**: Every user-visible timestamp in replay MUST identify its timezone per NFR-009, and
  MUST state that the instant originates from the developer's machine clock. Durations MUST be
  rendered from stored instants, never recomputed in the client from a locale-parsed string.
- **NFR-081**: The allowlist, the coercion table, the sentinel registry, the placeholder registry
  and the capability matrix MUST each be versioned per NFR-011, and a change to any of them MUST
  validate both the old and the new fixture set per Constitution IV. A session MUST retain the
  versions in force when it was collected.

### Key Entities

| Entity | Required fields beyond scope/ID | Relationships and constraints |
|---|---|---|
| Session (changed) | content_tier, reconstruction_state, reconstruction_algorithm_version, capability_matrix_version, runtime_version, plugin_version, adapter_version, usage_completeness, span_completeness, subagent_linkage, tool_duration_source, identity_confidence, placeholder_fields, watermark_at | Extends data-model.md:34; `coverage` becomes the structured record of FR-341; unreconstructable sessions excluded from every per-session metric |
| Span (changed) | span_type, internal_span_key, wire_span_id, logical_parent_span_id nullable, parent_resolution_method, clock_anomaly, error_class, tool_detail, agent_id nullable | Extends data-model.md:35; span_type chat/invoke_agent/execute_tool; unique collector+trace+internal_span_key; wire_span_id may repeat within a trace per FR-317; logical parent is reconstructed, wire parent is retained unchanged |
| UsageUnit (changed) | reasoning_output_tokens nullable, cache_creation_ephemeral_5m_tokens nullable, cache_creation_ephemeral_1h_tokens nullable, completeness | Extends data-model.md:36; unique owner span unchanged; ephemeral fields are components of cache_creation and never additive; completeness carries the FR-342 state |
| SessionCoverage | session_id, field, state, reason_code, explanation_key, matrix_version, recorded_at, schema_version, digest | One row per FR-341 field per session; immutable; a missing row MUST NOT be read as healthy |
| RuntimeCapability | harness_name, adapter_version, capability_key, availability, reason_code, placeholder_value_class nullable, matrix_version, digest | Availability available/unavailable/placeholder/unverified; the single artifact consumed by ingestion and rendered in product per FR-361; immutable per matrix version |
| AttributeAllowlistVersion | version, tier, accepted_keys, denied_keys, coercion_rules, digest | Closed enumeration per FR-305 through FR-308; adding a key requires a new version and a fixture; never a runtime setting |
| SentinelRegistry | version, kind, pattern_class, reason_code, digest | kind warning/error; maps a known sender string to a bounded reason code per FR-310; unmatched yields unknown_warning or unknown_error |
| LocalSpanContent | span_id, session_id, field, value_redacted, truncated, truncated_total_bytes, redaction_counts, recorded_at | Tier 1 only; local store with no reader in any sync, export or publication path per FR-337; no transmission path exists by construction |
| SharedSpanContent | span_id, session_id, field, value_redacted, truncated, truncated_total_bytes, redaction_counts, retention_expires_at, capture_authorization_id, recorded_at | Tier 2 only; retention bound at most 30 days; never enters a Snapshot, Export or PublishedArtifact per FR-336 |
| ContentCaptureAuthorization | workspace_id, tier, enabled_by, enabled_at, retention_days, audit_event_id, notified_contributor_count, notified_at | Required before tier 2 capture begins per FR-339; retention_days at most 30; a downgrade appends a new record rather than editing this one |
| ContributorCaptureOptOut | contributor_id, opted_out_at, actor_id | An opted-out contributor's sessions remain at tier 0 regardless of the workspace tier |
| RedactionCounter | session_id, category, count, recorded_at | Categories and counts only; never a key name that was denied for content reasons and never a value, per integrations.md:138 |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-040**: For a trace batch containing every allowlisted key plus at least twelve unrecognized
  keys, a scan of all resulting rows, indexes, quarantine records, operational logs, caches and
  exports finds zero occurrences of the unrecognized keys and of every FR-308 denied key, while all
  allowlisted values are present and correctly typed.
- **SC-041**: Every usage and line-count key parses identically from its `intValue` form and its
  digit-only `stringValue` form across 100% of fixture spans, and every malformed numeric value
  produces a rejected attribute with `unknown` accounting rather than a zero, in 100% of cases.
- **SC-042**: Replaying the identical sanitized batch twice produces zero additional spans, zero
  additional usage units and zero change to any total, and is not reported as a partial rejection.
- **SC-043**: For all four runtime fixtures, the reconstructed logical tree matches the
  hand-verified expected tree exactly in node set, parent relationships and ordering, including the
  3-level nested sub-agent case in both the sibling and the nested wire shape.
- **SC-044**: Shuffling the delivery order of a session's spans across at least 20 random
  permutations produces a byte-identical canonical reconstruction every time.
- **SC-045**: The Codex agent-reuse fixture, whose two spawning tool-call spans share a derived span
  ID, retains both spans, quarantines neither, and reports `subagent_linkage=ambiguous`.
- **SC-046**: A session whose identifier was sender-substituted is marked `unreconstructable`,
  contributes to zero per-session metrics, and appears in the ingestion coverage count, verified by
  recomputing every affected metric with and without it and observing no difference.
- **SC-047**: Every session on a runtime with unobserved harness-internal calls reports
  `usage_completeness=known_incomplete`, and every surface displaying a total derived from such a
  session — session view, project rollup, organization rollup, export and published artifact —
  carries the statement, verified by asserting the statement's presence on each surface rather than
  on the underlying value.
- **SC-048**: For each unavailable cell of the FR-362 matrix, the corresponding fixture renders an
  unavailable state with a reason and never renders 0, none, false or an empty value, across 100% of
  cells.
- **SC-049**: A placeholder-emitting runtime's MCP server field and router model identifier are
  stored unknown with reason `placeholder_value`, appear in `placeholder_fields`, produce no priced
  cost, and are never rendered as a real server or model.
- **SC-050**: Every metric value computed over a corpus of sessions at tiers 0, 1 and 2 is identical
  to the value computed with the same corpus forced to tier 0, to the last decimal place of its
  canonical representation.
- **SC-051**: A dependency inspection of the sync, export, snapshot and publication code paths finds
  zero references to the tier 1 content store, and a fixture run at tier 1 produces sync payloads,
  exports, snapshots and published artifacts containing none of the captured content.
- **SC-052**: Seeded credential-shaped strings in tool arguments and results are redacted before
  storage in 100% of cases at tier 1 and tier 2, with the redaction counted and the matched value
  absent from storage and logs.
- **SC-053**: A tier 0 session's replay view states that payloads were not captured on 100% of
  payload regions, and an automated check finds zero rendered payload panes that are empty without
  such a statement.
- **SC-054**: Summing a session's token totals from its reconstructed tree equals the sum of its
  canonical usage units exactly, with sub-agent units marked `included_in_parent` contributing zero
  and the ephemeral cache-creation breakdown contributing zero, across all four runtime fixtures.
- **SC-055**: Reconstruction of a 2,000-span session with depth 8 completes within 250 milliseconds
  at the 95th percentile while issuing a bounded query count independent of span count, verified by
  query count rather than wall clock alone.

## Supersessions

| Existing text | Effect of this specification |
|---|---|
| Constitution III "Raw-content capture is excluded from initial delivery; a future change requires a separately versioned policy" | Satisfied rather than contradicted. ADR-015 is that separately versioned policy; tier 0 remains the default and no metric depends on a higher tier |
| ADR-006 metadata-only telemetry | Qualified by ADR-015. Metadata-only remains the default posture and the only posture for hosted metrics |
| plan.md:33 metadata-only telemetry commitment | Qualified for replay only. No calculation path gains access to content |
| integrations.md:99-131 metadata allowlist | Extended by FR-306. Fourteen keys are added, all of them metadata; the content keys remain excluded at tier 0 by FR-307 |
| integrations.md:133-138 "drop … rate-limit and credit snapshots" | Retained. FR-308 keeps them denied and discloses the observability cost |
| integrations.md:109 "discard status message" | Retained and made explicit by FR-303; error classification moves to the sentinel registry of FR-310 |
| FR-022 "Sessions MUST expose elapsed duration, supported token categories, tool/error counts and instrumentation coverage" | Extended by FR-330 through FR-334 into a defined surface, and by FR-341 into a structured coverage record |
| FR-024 unsupported fields have explicit availability states | Extended by FR-344 and FR-345 into a per-runtime mapping with user-visible text |
| data-model.md:34-36 Session, Span, UsageUnit | Extended by the Key Entities table above; no new span or usage table is introduced |
| data-model.md:13 tool arguments and output excluded from the platform database | Retained for the platform database. Tier 1 content lives only in the local store; tier 2 content lives in a separate hosted store that no export or publication path reads |

## Assumptions

- The upstream sender remains the Dash0 agent plugin at a pinned, checksum-verified release
  (integrations.md:84). A sender upgrade requires re-running the fixture set, because its deny list
  means a new upstream field arrives without any change on our side.
- Four runtimes are in scope: Claude Code, Cursor, Codex CLI and GitHub Copilot CLI. Codex CLI on
  the platforms named in integrations.md:77-79 is the certified target; any other runtime or
  platform is `unverified` per FR-363 and research R4.
- The sender's `omit_io` default is not relied upon. The receiver's own allowlist is the only
  control that matters, and a workspace at tier 0 receiving content from a misconfigured sender
  discards it (FR-306, FR-307).
- Rate-limit and credit telemetry remains out of scope. A customer requirement to explain a stalled
  session by allowance exhaustion is the revisit trigger and requires an ADR amending
  integrations.md:133-138.
- Cross-machine replay of a contributor's own sessions is out of scope and is ADR-015's revisit
  trigger, because it requires tier 1 data to sync end-to-end encrypted under a key the platform
  cannot read.
- Correlating a runtime's own native trace with ours is out of scope. When it is undertaken it MUST
  be a span link applied to every span of a turn, not the retention of a propagation header.
- The secret-detection rule set for FR-338 is the same versioned rule set used elsewhere in the
  product. Its recall is not assumed to be complete, which is a further reason tier 1 has no
  transmission path.
- Replay presents no new attribution. Associating a session with a change, PR or repository remains
  candidate linkage under FR-025 and research R6.
- The in-product explanation strings referenced by `explanation_key` are localizable content, not
  part of the versioned contract; the reason codes are.
