# Feature Specification: Session Replay and Agent Telemetry Reconstruction

**Feature Branch**: `005-session-replay`  
**Created**: 2026-09-12  
**Status**: Draft  
**Input**: Specify the OTLP ingestion boundary, session reconstruction, the replay surface for
metadata and session content, coverage honesty rules, per-tool-call detail, usage-to-owner
association and the multi-runtime capability matrix required to make an agent session inspectable
under ADR-016.

## Product Definition

Spec 001 accepts redacted OTLP traces (FR-019 through FR-024) and stores `Session`, `Span` and
`UsageUnit`, but defines no surface on which a person can see what an agent actually did. This
specification defines that surface, the ingestion contract that feeds it, and the honesty rules
that keep it from overstating what was observed.

ADR-016 governs. Session content (prompts, system instructions, responses, tool arguments and
results including any file paths inside them, session title and raw error text) is captured by
default, with no capture tiers and no per-developer opt-out, and is hard-deleted no later than 30
days after the session ends (ADR-016 rules 1 and 2). Metadata is kept for `spans_days` (default
60), strictly longer than content retention, and is sufficient for every deterministic metric; no
metric reads content. Replay shows the full conversation while content is retained. Where content
is missing or has expired, for the whole session or for some of its spans, replay falls back to a
metadata surface (the span tree, timings, tool names, error classes and token counts) and states
which case applies. This specification adds no metric and changes no metric definition.

This specification extends the existing entities. `Session`, `Span` and `UsageUnit`
(data-model.md:34-36) are extended, never duplicated. Requirements already covered by spec 001
are referenced by ID and not restated.

The upstream sender is the Dash0 agent plugin. Its behaviour is a verified external contract, not
an assumption: it filters attributes with a deny list, so every new upstream field is exported by
default (ADR-016 rule 7), and its OTLP JSON attribute value carries only `stringValue` or
`intValue`, so booleans and floats arrive as strings. Both facts are load-bearing below.

### Delivery scope

| Milestone | User value | Required stories | Shipping gate |
|---|---|---|---|
| R0 | Receiver accepts and sanitizes real traffic | Shared foundation | Independent allowlist, unknown keys discarded, string-typed value coercion, idempotent replay |
| R1 | A single-turn session is navigable | US30, US31 | Turn tree rebuilt from fixtures for all four runtimes, coverage banner before any value |
| R2 | Token and cost totals are honest | US32 | Canonical-owner accounting, no double count, `known_incomplete` stated where true |
| R3 | Replay shows the session's conversation | US35 | Content readers and fail-closed admin-only read audit per FR-340; hard deletion within 30 days or the shorter workspace period; secret scan before storage; present, partial, missing and expired states rendered per FR-334, never as an empty conversation |
| R4 | Sub-agent work is navigable | US33 | Sibling-shape and nested-shape trees both reconstructed by agent ID |
| R5 | Degraded and interrupted sessions are legible | US34 | Dangling, orphan, interrupted and unreconstructable states rendered distinctly |
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
exactly, and states the session's content state before any value.

**Acceptance Scenarios**:

1. **Given** a session, **when** the developer opens replay, **then** the tool calls appear in
   start-time order with name, duration and status; with content present each call shows its
   secret-redacted arguments and result, and every payload region without content, whether the
   session's content is partial, missing or expired, states which, with the reason or the expiry
   date, rather than rendering empty.
2. **Given** a turn whose chat span has not yet arrived, **when** replay is opened, **then** the
   turn is shown as in progress with its observed tool calls and a stated incomplete usage total,
   and no cost figure is presented as final.
3. **Given** a tool call with error status, **when** the developer opens it, **then** an error
   class is shown, and raw error text is shown beside it only while the session's content is
   present; the class is identical whether the content is present, partial, missing or expired.
4. **Given** a session whose spans arrived out of order across three deliveries, **when** replay
   is opened, **then** display order is derived from parent relationships and span start time, not
   from receipt order, and the rendering is identical to a single-delivery fixture.

---

### User Story 31 - Ingest telemetry without trusting the sender (Priority: P1)

An admin registers a collector and the platform accepts its traces, keeping only attributes it
recognizes, discarding everything else, and storing recognized content only as secret-redacted
session content — whatever the sender transmits.

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
2. **Given** a sender configured with `omit_io=false`, **when** spans carrying
   `gen_ai.tool.call.arguments` arrive with real content, **then** the content is secret-scanned
   and stored only in the session content entity of FR-337, and no metadata record, quarantine
   record or log contains it.
3. **Given** a token count arriving as `stringValue` `"12345"` and another as `intValue`
   `"12345"`, **when** both are ingested, **then** both normalize to the integer 12345.
4. **Given** a token count arriving as `"-1"`, `"1.5"` or `"abc"`, **when** it is ingested,
   **then** the attribute is rejected, the usage unit's accounting status becomes `unknown`, and no
   count becomes zero.
5. **Given** the identical sanitized batch delivered twice, **when** both are processed, **then**
   the second is a no-op with no new accounting effect and is not reported as a partial rejection
   per FR-023 and integrations.md:176-178.
6. **Given** an admin installing a collector, **when** installation completes, **then** its
   output states once that prompts, system instructions, responses and tool output are captured
   and kept for up to 30 days, and asks for no consent, opt-in or opt-out, per FR-339.

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
identifier was absent and substituted, a fixture ending in the interrupted-session error chat
span, and a fixture whose sender sent no content each render a distinct, named state with a
user-visible explanation.

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
6. **Given** a session whose collector sent no content, or sent a sender placeholder such as
   `<REDACTED>` in its place, **when** replay is opened, **then** the session is
   `content_state=missing` with its reason, it is counted in collection coverage, and its payload
   regions state that content was not received rather than rendering an empty conversation.
7. **Given** a session in which only some spans carry content, **when** replay is opened, **then**
   the session is `content_state=partial`, spans with content show it, and every span without
   content states that its content was not received.

---

### User Story 35 - Read a session's full conversation (Priority: P1)

A developer, or a lead permitted to read the session, opens it and reads the prompts, the system
instructions, the agent's responses, the arguments each tool received and the result it
returned, with credentials redacted, for up to 30 days after the session ended. After that,
replay shows the metadata and says when the content expired.

**Why this priority**: Content replay is the core surface. It makes replay answer "what happened"
instead of only "what ran", and coaching (spec 006) reads the same content under the same access
rules. ADR-016 captures content by default and bounds it to 30 days, so the story is as much about
content leaving on time as about it arriving.

**Independent Test**: A session with content present shows its prompts, system instructions,
responses, tool arguments and results to its developer, to owner and admin, and to an analyst
whose grant covers its project, and to no other internal viewer or external principal; a
credential-shaped string in a tool result is stored redacted; every read request writes one audit
event only owner and admin can read; and 30 days after the session ends the content is gone from
storage and replay states the expiry date, while every metric is unchanged.

**Acceptance Scenarios**:

1. **Given** a session with content present, **when** a permitted reader replays it, **then**
   prompts, system instructions, responses, tool arguments, tool results, session title and raw
   error text are shown, each labelled as content and distinguished from metadata per FR-335.
2. **Given** session content in storage, **when** any export, snapshot, published artifact, event
   payload or operational log is produced, **then** the content is absent because no code path in
   those paths reads the content entity, not because a filter excluded it.
3. **Given** a tool result containing a credential-shaped string, **when** it is stored, **then**
   the credential is replaced before storage and the redaction is recorded.
4. **Given** an analyst whose grant covers a session's project, **when** they open its content,
   **then** it is shown whatever `individual_attribution_enabled` is set to, one `AuditEvent`
   recording actor, time, and the session ID returned with its subject handle is written with no
   content, and the subject is not notified and cannot list the read; an internal viewer or an
   `is_external` principal making the same request reaches no content.
5. **Given** a session that ended more than 30 days ago, or longer ago than a workspace's shorter
   period, **when** replay is opened, **then** its content has been hard-deleted, any backup copy
   is unreadable because its content key was destroyed, a restore has re-applied the deletion
   before serving, the payload regions state the date the content expired, and the turn list,
   timings, tool names and token counts remain readable, because metadata retention is strictly
   longer than content retention per FR-339.
6. **Given** a corpus in which some sessions have content present, some partial, some missing and
   some expired, **when** any metric is computed, **then** the values are identical to those
   computed with every session's content removed.

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
- A workspace shortening its content retention period while sessions inside the old period still
  hold content; the shorter period applies to them per FR-339.
- A developer disabling content in their own collector mid-session, so some spans of one session
  carry content and others do not; the session is `content_state=partial` per FR-341.
- A session that never records an end; its content and metadata retention clocks both run from
  its last received span per FR-339.
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
  reconstructed from the validated operation name, model and tool name per integrations.md:136-137,
  because the wire name embeds the model and tool name a second time and is the sender's string.
- **FR-303**: `traceState`, `flags`, span `events` and span `links` MUST be discarded. Decision:
  `status.message` is the only field carrying the sender's error text, which ADR-016 rule 1 makes
  session content, so it MUST be admitted only as a content key per FR-307 and never retained as
  metadata. This is aligned with integrations.md:109 and :133-134. Error classification is
  specified in FR-351 and MUST NOT read it.
- **FR-304**: Batch limits, attribute count and depth limits, quota checks and partial-success
  semantics MUST follow integrations.md:167-179 unchanged. A span rejected for an allowlist reason
  MUST NOT be reported as a partial rejection when the span itself was accepted with attributes
  discarded; only invalid and conflicting spans count as rejected.

#### B. Ingestion: the independent attribute allowlist

- **FR-305**: The receiver MUST apply its own allowlist and MUST discard every key not named in it,
  for metadata and content keys alike, per ADR-016 rule 7. The allowlist MUST be a closed
  enumeration in the adapter contract, versioned per NFR-011. An attribute key absent from the
  enumeration MUST NOT reach persistence, quarantine, operational logs, job payloads, caches,
  search indexes or exports. Adding a key MUST require a contract version change and a fixture,
  never a configuration setting.
- **FR-306**: The metadata allowlist is exactly the following, and this set MUST be sufficient for
  every replay behaviour in section C and every metric in metrics.md. It supersedes and extends
  integrations.md:99-131; rows marked new were absent there.

  | Accepted key | New | Normalized meaning and validation |
  |---|---|---|
  | `traceId`, `spanId`, `parentSpanId` | | Lowercase hex 32/16/16; nonzero; absent parent permitted only on a `chat` span |
  | `startTimeUnixNano`, `endTimeUnixNano` | | Integer nanosecond strings; negative duration rejected per FR-321 |
  | `status.code` | | Unset/OK/Error only; message is content per FR-303 |
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

- **FR-307**: The content allowlist is exactly the following keys. They are on the allowlist per
  ADR-016 rule 7, and each MUST be persisted only as session content under FR-337 through FR-340,
  never as metadata: `gen_ai.input.messages`, `gen_ai.output.messages`,
  `gen_ai.system_instructions`, `gen_ai.tool.call.arguments`, `gen_ai.tool.call.result`,
  `gen_ai.conversation.name`, `exception.message`, and `status.message` per FR-303.
  `gen_ai.conversation.name` is in this set because the sender derives the session title from the
  user's first prompt, making it user content rather than a label. File paths are captured only
  inside tool arguments and results; no separate attribute carries them.
- **FR-308**: The following keys MUST be denied unconditionally, and the denial MUST be enumerated
  rather than left to the absence of an allowlist entry, so that a fixture can assert it:
  span `name`, `user.name`, `process.working_directory`, `dash0.team.name`, `traceparent`,
  `dash0.gen_ai.rate_limit.*` in every form, `dash0.gen_ai.credits.*` in every form, and every key
  the sender's own deny list happens to cover today. Reasons per group:

  | Denied | Reason |
  |---|---|
  | span `name` | Sender-authored string; reconstructed per FR-302 |
  | `user.name` | Plaintext contributor identity; forbidden by data-model.md:13 and ADR-011 |
  | `process.working_directory` | Local filesystem path of the process; dropped by integrations.md:136 and security.md:53. File paths are content only inside tool arguments and results, per FR-307 |
  | `dash0.team.name` | Sender-asserted team label; team scope comes from ADR-011 entities, and a sender-supplied label is not authorization |
  | `traceparent` | Propagation header naming a trace that exists only on the developer's machine; correlation is deliberately not attempted per FR-323 |
  | `dash0.gen_ai.rate_limit.*`, `dash0.gen_ai.credits.*` | Allowance and credit snapshots, dropped by integrations.md:133-138. Consequence accepted and disclosed: rate-limit exhaustion is not an observable cause of a stalled session. Revisiting requires an ADR |
  | any unrecognized key | ADR-016 rule 7; the sender exports new fields by default |

- **FR-309**: `user.email` MUST be consumed only inside the trusted ingestion process to compute
  the `Contributor` `identity_digest` per FR-069, and MUST then be discarded. It MUST NOT be
  written to any column, index, log, quarantine record, job payload, cache, backup or export, and
  MUST NOT cross a process or queue boundary, per NFR-021.
- **FR-310**: `dash0.warning` MUST be matched against a versioned registry of known sender-emitted
  sentinel strings to derive a bounded reason code. An unmatched value MUST produce
  `unknown_warning`, and the raw string MUST be discarded and MUST NOT be echoed in any
  diagnostic. Raw error text (`exception.message`, `status.message`) is session content under
  FR-307: it MUST NOT be matched to derive a reason code or error class and MUST NOT be echoed in
  any diagnostic, so that classification is identical whether content is present, partial,
  missing or expired.

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

- **FR-330**: Replay MUST present, for a selected session: a coverage and content-state statement,
  the list of turns, and for a selected turn a chronological timeline, a tool-call list, a
  sub-agent tree, a usage and cost panel, and an error list. The coverage and content-state
  statement MUST appear before any numeric value, mirroring FR-079.
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
- **FR-334**: Content-dependent rendering MUST be exactly as follows, per ADR-016 rules 1 and 2. A
  session whose content is missing MUST state that content was not received and why; a session
  whose content is partial MUST state, on each span without content, that it was not received; a
  session whose content has expired MUST state when it expired. An empty payload pane MUST NOT be
  rendered in any state, and a session without content MUST NOT be rendered as an empty
  conversation.

  | Element | Content present | Content partial | Content missing | Content expired |
  |---|---|---|---|---|
  | Turn list, timings, status | Shown | Shown | Shown | Shown |
  | Tool name, call ID, duration, status, error class | Shown | Shown | Shown | Shown |
  | Token counts and cost estimate | Shown | Shown, identical to content present | Shown, identical to content present | Shown, identical to content present |
  | Sub-agent tree and linkage state | Shown | Shown | Shown | Shown |
  | Tool arguments and results | Shown, secret-redacted | Shown where the span carries it; otherwise stated not received | Stated not received, with the reason | Stated expired, with the date |
  | Prompt, system instruction and response content | Shown, secret-redacted | Shown where the span carries it; otherwise stated not received | Stated not received, with the reason | Stated expired, with the date |
  | Session title | Shown where the runtime provides one | Shown where received; otherwise stated not received | Stated not received | Stated expired |
  | Raw error text | Shown, secret-redacted | Shown where the span carries it; otherwise class only | Never shown; class only | Never shown; class only |
  | Any metric value | Unchanged by content state | Unchanged by content state | Unchanged by content state | Unchanged by content state |

- **FR-335**: Every value shown in replay MUST carry a provenance label, so a reader can tell
  metadata from content. A content value MUST be visually distinguished from a metadata value and
  MUST NOT be presented as though it were permanent or available for every session.
- **FR-336**: Replay MUST NOT be a publication surface. No session content may enter a
  `PublishedArtifact`, `Snapshot`, `Export`, machine-readable manifest, event payload, operational
  log, audit payload or search index readable by another principal, at any role, profile or
  redaction setting, per ADR-016 rule 7. A replay view MUST offer no content export.
- **FR-337**: Session content MUST reside in a content entity separate from the metadata entities.
  A collector registered to a hosted workspace sends content to that workspace; a local workspace
  with no hosted account keeps its content on the machine, under the same deletion bound, per
  ADR-016. No metric calculation, export, snapshot, publication, event or
  cross-principal search-indexing code path may read it; its only readers are replay under FR-340
  and coaching under ADR-016 rule 6. This MUST be achieved by the absence of a reader in those
  paths, not by a flag checked at read time. Content MUST exist only on an ingested session's
  spans; prompt fragments inside imported reports (Receipts, AIBOM) have no session and no expiry
  anchor, and MUST stay discarded, per ADR-016.
- **FR-338**: Tool arguments, tool results, prompts, system instructions, responses and every
  other content key of FR-307 MUST be scanned for credential-shaped strings and redacted before
  storage, hosted and local alike, per ADR-016 rule 7. A redaction MUST record the category and
  count, never the matched value.
- **FR-339**: Session content MUST be captured by default, with no capture tier, no admin
  enablement, no per-contributor opt-out and no notification to contributors, per ADR-016 rules 1
  and 4. Content MUST be hard-deleted no later than 30 days after the session ends. The content and
  metadata retention clocks both start at the session's end, which for a session that never
  finalizes is its last received span. A workspace MAY set a shorter content period of at least 1
  day, held as `RetentionPolicy.session_content_days` (spec 001 data-model.md:51, default 30), and
  MUST NOT set a longer one; no role, hold, export or configuration may extend it. A shorter
  period MUST apply to content already stored. Metadata MUST be kept for
  `RetentionPolicy.spans_days` (7 to 90, default 60) and MUST strictly outlive content:
  `spans_days` MUST be greater than `session_content_days`, validated when the policy is written,
  and a span purge MUST NOT be relied on to delete content. A restore from backup MUST re-apply
  deletion before serving, and backup copies of expired content MUST be unreadable per NFR-077,
  so a restore
  cannot resurrect expired content. The collector's install output and the workspace settings
  page MUST state once that prompts, system instructions, responses and tool output are captured
  and kept for up to 30 days; this is a statement of fact, not an opt-in, an opt-out or a
  notification, per ADR-016 rule 8.
- **FR-340**: Replay MUST be reachable at every scope level a principal is authorized for, and MUST
  apply FR-087, FR-091 and FR-092 unchanged except as this requirement states. Session content
  MUST be readable only by the developer whose linked contributor identity produced the session,
  per FR-091; by owner and admin across the workspace; and by an analyst for a session in a
  project inside their grant, per ADR-016 rule 3. A session with no project is outside every
  analyst grant. Content access MUST NOT depend on `individual_attribution_enabled`, which
  continues to gate named-person metric views under FR-092. A principal permitted by this rule
  MAY list one developer's sessions per request, within the projects they can read, and see that
  developer's pseudonymous handle; a reader other than the developer MUST name exactly one
  developer, or the explicit `unattributed` filter, in every session listing request, and an
  unfiltered listing is permitted only for the developer's own sessions. The `unattributed` filter
  lists sessions with no linked developer to the same readers; those sessions carry no handle, so
  the listing is not a view of a person and writes no `AuditEvent`, while a content read on such
  a session is audited as any other. Such a principal MAY keep reading a session's metadata after
  its content expires. Sessions and developers MUST NOT be ordered by a metric, per FR-090. An
  internal viewer MUST NOT reach another person's session content. An external principal
  (`is_external`) MUST NOT reach replay at all, because a session is a
  per-person record and FR-085 denies the contributor dimension absolutely. Every read request
  for session content MUST write exactly one `AuditEvent` recording actor, time, and the session
  IDs whose content it returned, possibly none, each with its subject contributor handle, per
  ADR-016 rule 5. The audit write MUST succeed before content is returned; a failed audit write
  MUST fail the read. That event MUST carry no content, MUST be readable by owner and
  admin only, and MUST NOT be shown, listed or sent to the subject; FR-093's notification and
  FR-094's subject listing MUST NOT apply to it, per ADR-016 rule 4 and ADR-013 rule 4 as amended.

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
  | `content_state` | `present`, `partial`, `missing`, `expired` | Whether session content is available, per ADR-016 rules 1 and 2; `partial` means only some spans carry content; `missing` and `partial` carry why content was not received, `expired` when it was deleted |
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
  | Content not sent by the collector, or replaced by a sender placeholder such as `<REDACTED>` under `omit_io=true` | All | `content_state=missing`, or `partial` when only some spans lack content, reason `content_not_sent` or `sender_placeholder`; counted in collection coverage per ADR-016 rule 1 | This session's prompts, system instructions, responses and tool output were not received; its metadata and metrics are unaffected |
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

- **FR-349**: Per tool call, the following MUST be recorded and rendered according to whether the
  call's span carries content; in a `partial` session each span follows its own column. A field
  unavailable for the runtime MUST follow FR-345.

  | Field | Span content missing or expired | Span content present | Notes |
  |---|---|---|---|
  | Tool name | Yes | Yes | Normalized; MCP tool names normalized to a canonical form |
  | Tool call ID | Yes | Yes | Opaque; used to join, never to authorize |
  | Tool type | Yes | Yes | Only `function` recognized in v1 |
  | Start time, end time, duration | Yes | Yes | Duration source labelled per FR-331 |
  | Status | Yes | Yes | From `status.code` only |
  | Error class | Yes | Yes | Derived per FR-351 from metadata only; raw text is content |
  | Bash command family | Yes | Yes | Bounded family, not the command line |
  | Skill name and skill source | Yes | Yes | Source distinguishes model-chosen from person-invoked |
  | MCP server | Yes | Yes | Placeholder handled per FR-353 |
  | Lines added, lines removed | Yes | Yes | Proxy per Constitution II; unavailable on one runtime |
  | Model | Yes | Yes | May be absent on a sub-agent's tool call; unavailable, not the parent's model |
  | Arguments, result | Stated not received or expired, per FR-334 | Shown, secret-redacted | Truncation marker preserved per FR-352 |

- **FR-350**: A skill loaded by context injection rather than by a tool call MUST be recorded on the
  turn's chat span and MUST NOT be rendered as a tool call. Its absence from the tool-call list MUST
  NOT be read as the skill not being used. One runtime loads skills exclusively this way.
- **FR-351**: Error class MUST be derived from `status.code` plus the sentinel registry of FR-310,
  producing one of a bounded set including at least `tool_error`, `interrupted_session` and
  `unknown_error`. Classification MUST NOT read session content, including raw error text, so a
  tool call's error class is identical whether its session's content is present, partial, missing
  or expired.
- **FR-352**: Session content MUST preserve the sender's truncation marker as a
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
  | Prompt and response content available | Yes | Yes | Yes | Yes, native source |

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
- **NFR-076**: No identity or attribute excluded by the allowlist may appear in any accepted
  record, quarantine record, operational log, trace, metric, cache, search index, backup, crash dump
  or export, per NFR-010. Session content MUST NOT appear in any metadata record, quarantine record,
  operational log, trace, metric, cache, crash dump or export, or in a search index readable by
  another principal. The content entity of FR-337 MUST have no reader in any metric calculation,
  export, snapshot or publication code path, verified by dependency inspection rather than by
  runtime assertion.
- **NFR-077**: Session content MUST be hard-deleted, hosted and local, no later than 30 days after
  the session ends, or within the workspace's `session_content_days`, per FR-339. Deletion MUST
  leave a content-free tombstone recording when the content expired, per data-model.md:107-112.
  Content MUST be encrypted under content keys scoped to one workspace and one session-end day. A
  still-open session's content MUST be written under a provisional key and re-wrapped to its
  end-day key when the session ends, or at its last received span when it never finalizes. In
  hosted mode keys MUST be held in the secret manager or KMS, outside every database backup; in
  local mode they MUST be held in the OS keychain or an equivalent local key store, outside the
  local database and any local backup, with the same per-day destruction. A key MUST be
  destroyed when the content it protects expires, and shortening `session_content_days` MUST
  destroy the affected keys early, so every backup copy of expired content becomes unreadable. A
  restore from backup MUST still complete deletion of expired content before any content is
  served.
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
| Session (changed) | content_state, content_missing_reason nullable, content_expired_at nullable, reconstruction_state, reconstruction_algorithm_version, capability_matrix_version, runtime_version, plugin_version, adapter_version, usage_completeness, span_completeness, subagent_linkage, tool_duration_source, identity_confidence, placeholder_fields, watermark_at | Extends data-model.md:34; `coverage` becomes the structured record of FR-341; content_state is `present`, `partial`, `missing` or `expired` per FR-341, content_missing_reason is set when missing or partial, content_expired_at when expired; unreconstructable sessions excluded from every per-session metric |
| Span (changed) | span_type, internal_span_key, wire_span_id, logical_parent_span_id nullable, parent_resolution_method, clock_anomaly, error_class, tool_detail, agent_id nullable | Extends data-model.md:35; span_type chat/invoke_agent/execute_tool; unique collector+trace+internal_span_key; wire_span_id may repeat within a trace per FR-317; logical parent is reconstructed, wire parent is retained unchanged |
| UsageUnit (changed) | reasoning_output_tokens nullable, cache_creation_ephemeral_5m_tokens nullable, cache_creation_ephemeral_1h_tokens nullable, completeness | Extends data-model.md:36; unique owner span unchanged; ephemeral fields are components of cache_creation and never additive; completeness carries the FR-342 state |
| SessionCoverage | session_id, field, state, reason_code, explanation_key, matrix_version, recorded_at, schema_version, digest | One row per FR-341 field per session; immutable; a missing row MUST NOT be read as healthy; content deletion appends a `content_state=expired` row rather than editing the earlier one |
| RuntimeCapability | harness_name, adapter_version, capability_key, availability, reason_code, placeholder_value_class nullable, matrix_version, digest | Availability available/unavailable/placeholder/unverified; the single artifact consumed by ingestion and rendered in product per FR-361; immutable per matrix version |
| AttributeAllowlistVersion | version, accepted_keys, content_keys, denied_keys, coercion_rules, digest | Closed enumeration per FR-305 through FR-308; content_keys is the FR-307 set, persisted only as session content; adding a key requires a new version and a fixture; never a runtime setting |
| SentinelRegistry | version, kind, pattern_class, reason_code, digest | kind warning/error; maps a known sender string to a bounded reason code per FR-310; unmatched yields unknown_warning or unknown_error |
| SpanContent | span_id, session_id, field, value_redacted, truncated, truncated_total_bytes, redaction_counts, retention_expires_at, recorded_at | The content entity of FR-337; field is one of the FR-307 content keys (prompts, system instructions, responses, tool arguments and results, session title, raw error text); span_id is required and is `Span.id`, the platform UUID, not the 16-hex OTLP wire span ID (`wire_span_id`); the session title is stored on the root `chat` span's SpanContent; hosted, or on the machine for a local workspace with no hosted account; retention_expires_at at most 30 days after the session ends, or `RetentionPolicy.session_content_days` when shorter, recomputed when that period is shortened, per FR-339; no reader in any metric, export, snapshot or publication path; never enters a Snapshot, Export or PublishedArtifact per FR-336 |
| RetentionPolicy (changed) | session_content_days; spans_days default | Extends spec 001 data-model.md:51; session_content_days is an integer from 1 to 30, default 30, per FR-339; spans_days stays 7 to 90 with default 60; both clocks start at session end, or at the last received span when the session never finalizes; a write where spans_days is not greater than session_content_days is rejected; no other retention field, hold or role extends content |
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
- **SC-050**: Every metric value computed over a corpus of sessions with content present, partial,
  missing and expired is identical to the value computed with every session's content removed, to
  the last decimal place of its canonical representation.
- **SC-051**: A dependency inspection of the metric calculation, export, snapshot and publication
  code paths finds zero references to the session content entity, and a fixture run with content
  present produces exports, snapshots, published artifacts, event payloads, audit payloads and
  operational logs containing none of the captured content.
- **SC-052**: Seeded credential-shaped strings in tool arguments and results are redacted before
  storage in 100% of cases, hosted and local, with the redaction counted and the matched value
  absent from storage and logs.
- **SC-053**: A session whose content is missing, partial or expired states, on 100% of payload
  regions without content, that content was not received with the reason, or that it expired with
  the date, and an automated check finds zero rendered payload panes that are empty without such a
  statement.
- **SC-054**: Summing a session's token totals from its reconstructed tree equals the sum of its
  canonical usage units exactly, with sub-agent units marked `included_in_parent` contributing zero
  and the ephemeral cache-creation breakdown contributing zero, across all four runtime fixtures.
- **SC-055**: Reconstruction of a 2,000-span session with depth 8 completes within 250 milliseconds
  at the 95th percentile while issuing a bounded query count independent of span count, verified by
  query count rather than wall clock alone.
- **SC-056**: A fixture session's content is absent or unreadable in every store, hosted and
  local, including backups, no later than 30 days after the session ends, or after its last
  received span when it never finalizes, and within a workspace's `session_content_days` when
  shorter, including content stored before the period was shortened; a backup copy of that
  content is unreadable once its key is destroyed, and no database backup contains a content key;
  a restore from a backup taken before deletion serves none of it; and at the default retention
  (content 30 days, spans 60 days) the session's replay states the expiry date while its metadata
  stays readable and every metric derived from it is unchanged.
- **SC-057**: Across every role and principal type of FR-087, a request for a session's content
  succeeds exactly for the session's own developer, owner, admin and an analyst whose grant covers
  the session's project, with the same outcome whether `individual_attribution_enabled` is true or
  false, and is refused for every other internal viewer and every `is_external` principal with a
  response indistinguishable from that for a nonexistent session; a session listing request from
  a reader other than the developer is refused unless it names exactly one developer or the
  `unattributed` filter; and an `unattributed` listing returns only sessions with no linked
  developer, carries no handle and writes no `AuditEvent`, while a content read on one of those
  sessions writes one as usual.
- **SC-058**: Every content read request writes exactly one `AuditEvent` carrying actor, time and
  the session IDs returned with their subject handles, including a request that returns none, and
  no content; the event is readable by owner and admin and is absent from every view, list, inbox
  and notification available to the subject; and a fixture whose audit write fails returns no
  content.

## Supersessions

| Existing text | Effect of this specification |
|---|---|
| Constitution III (2.0.0) "Session content … MAY be stored in the platform database for session replay and coaching only" | Implemented. FR-307 and FR-336 through FR-340 apply its secret redaction, 30-day hard deletion, reader set and exclusion from metrics, exports, snapshots, events, logs and published artifacts |
| ADR-006 metadata-only telemetry | Superseded for session telemetry by ADR-016. Content is captured by default; metadata remains the only input to hosted metrics |
| plan.md:33 telemetry commitment | Aligned with ADR-016 in spec 001 for replay and coaching. No calculation path gains access to content |
| integrations.md:99-131 metadata allowlist | Extended by FR-306 and FR-307. Fourteen metadata keys are added by FR-306; the content keys of FR-307 are admitted as session content per ADR-016 rule 7 |
| integrations.md:133-138 dropping of rate-limit and credit snapshots | Retained. FR-308 keeps them denied and discloses the observability cost |
| integrations.md:109 and :133-134 status message as session content | Aligned with FR-303. The status message is raw error text, admitted only as session content per ADR-016 rule 1; error classification reads metadata only, via the sentinel registry of FR-310 |
| ADR-015 capture tiers 0, 1 and 2 | Superseded by ADR-016 rule 1. FR-334 and FR-341 model content state (`present`, `partial`, `missing`, `expired`) instead of a tier; `content_tier` becomes `content_state` |
| ADR-015 rule 2, tier 1 local-only store with no transmission path | Superseded. FR-337 keeps one content entity, hosted and local, with no reader in any metric, export, snapshot or publication path; `LocalSpanContent` and `SharedSpanContent` become `SpanContent` |
| ADR-015 rule 3, admin enablement, contributor notice and per-contributor opt-out | Superseded by ADR-016 rules 1, 4 and 8. FR-339 captures by default with a one-time disclosure and a 30-day hard-deletion limit; `ContentCaptureAuthorization` and `ContributorCaptureOptOut` are removed, and a workspace's shorter period is `RetentionPolicy.session_content_days` |
| spec 001 data-model.md:51 RetentionPolicy | Extended with `session_content_days`, 1 to 30 days, default 30, per FR-339 and ADR-016's clarifications; shortening applies to content already stored; `spans_days` default raised to 60 and MUST exceed `session_content_days` |
| FR-087 and FR-092 gating of another person's data by `individual_attribution_enabled` | Not applied to session content or to browsing sessions by developer, per ADR-016 rule 3 and its clarifications. FR-340 grants content, session listing filtered to one developer and post-expiry metadata to owner, admin and analysts within their grant; FR-092 continues to gate named-person metric views |
| FR-093 notification and FR-094 subject listing of named-person queries | Not applied to session-content reads, per ADR-016 rules 4 and 5 and ADR-013 rule 4 as amended. FR-340 writes an audit event readable by owner and admin only |
| FR-022 "Sessions MUST expose elapsed duration, supported token categories, tool/error counts and instrumentation coverage" | Extended by FR-330 through FR-334 into a defined surface, and by FR-341 into a structured coverage record |
| FR-024 unsupported fields have explicit availability states | Extended by FR-344 and FR-345 into a per-runtime mapping with user-visible text |
| data-model.md:34-36 Session, Span, UsageUnit | Extended by the Key Entities table above; no new span or usage table is introduced |
| data-model.md:13-15 placement of prompts, responses, tool input and output and file paths | Aligned with ADR-016 and Constitution III 2.0.0 in spec 001. They live only in the expiring session-content store, which this specification defines as the `SpanContent` entity of FR-337, secret-redacted and hard-deleted within 30 days |

## Assumptions

- The upstream sender remains the Dash0 agent plugin at a pinned, checksum-verified release
  (integrations.md:84). A sender upgrade requires re-running the fixture set, because its deny list
  means a new upstream field arrives without any change on our side.
- Four runtimes are in scope: Claude Code, Cursor, Codex CLI and GitHub Copilot CLI. Codex CLI on
  the platforms named in integrations.md:77-79 is the certified target; any other runtime or
  platform is `unverified` per FR-363 and research R4.
- The sender's `omit_io` setting is not relied upon for privacy; the receiver's own allowlist
  decides which keys are accepted (FR-305 through FR-308). Sovix's recommended collector
  configuration sets `omit_io` to false (ADR-016 rule 1). A sender left at its default sends a
  placeholder in place of content, which produces `content_state=missing` per FR-344 and is never
  stored as content.
- Rate-limit and credit telemetry remains out of scope. A customer requirement to explain a stalled
  session by allowance exhaustion is the revisit trigger and requires an ADR amending
  integrations.md:133-138.
- Cross-machine replay of a developer's own sessions needs no separate mechanism: hosted content
  is readable from any machine by the principals of FR-340, per ADR-016. Content of a local
  workspace with no hosted account stays on its machine per FR-337.
- Correlating a runtime's own native trace with ours is out of scope. When it is undertaken it MUST
  be a span link applied to every span of a turn, not the retention of a propagation header.
- The secret-detection rule set for FR-338 is the same versioned rule set used elsewhere in the
  product. Its recall is not assumed to be complete, which is a further reason content is bounded
  to 30 days and kept out of every export and publication path.
- Meeting local employment law for content capture, such as a transparency duty or a prior
  employee-representative agreement, is the deploying organization's responsibility. The
  disclosure of FR-339 is the product's minimum, per ADR-016.
- How coaching reads session content is specified in spec 006. FR-337 names coaching as the only
  reader of the content entity besides replay.
- Replay presents no new attribution. Associating a session with a change, PR or repository remains
  candidate linkage under FR-025 and research R6.
- The in-product explanation strings referenced by `explanation_key` are localizable content, not
  part of the versioned contract; the reason codes are.
