# Domain Event Contract

## Purpose and Boundary

Domain events connect committed aggregates to internal workers through the transactional
outbox. They are an at-least-once internal integration contract, not a public webhook or an
analytics payload. No public event subscription exists in v1. Consumers that need report
content fetch an authorized resource through the API; the event itself carries generic
references and safe counts only.

The generated [events.schema.json](events.schema.json) defines the v1 envelope. Every event has:

| Field | Meaning |
|---|---|
| `schema_version` | Envelope/payload schema version, currently `1.0` |
| `event_id` | Globally unique immutable delivery identity |
| `event_type` | Declared domain fact from the generated enum |
| `workspace_id`, `project_id` | Owning scope; project is null only for workspace-level facts |
| `aggregate_id`, `aggregate_version` | Aggregate whose committed revision emitted the fact |
| `occurred_at` | Domain transition instant in UTC |
| `recorded_at` | Outbox record instant in UTC; may be later than occurrence |
| `correlation_id` | Opaque request/job flow identity, not a source trace payload |
| `payload.resource_id` | Generic primary affected resource reference |
| `payload.state` | Safe normalized state/result label |
| `payload.count` | Nonnegative safe affected-record count; zero is valid |

The payload cannot contain prompts, source bodies, repository/user names, email, credentials,
external IDs, URLs, filesystem paths, tool input/output, exception messages, arbitrary labels
or tenant content. It does not embed a MetricResult, manifest, policy rules or source record.
`resource_id` is a lookup reference subject to fresh authorization and lifecycle state.

## Event Types

The initial event names are `source.accepted`, `source.rejected`, `collection.completed`,
`session.updated`, `link.adjudicated`, `allocation.created`, `snapshot.published`,
`export.ready`, `investigation.changed`, `connector.revoked`, `deletion.completed`,
`deployment.recorded`, `incident.recorded`, `policy.evaluated` and `action.reconciled`.
Names state a committed fact. They are not commands and do not authorize a consumer to mutate
an external system. In particular, `policy.evaluated` never implies approval, and
`action.reconciled` reports the state established under policy.md.

Producers populate only the generic payload fields from the schema. Event-specific meaning is
resolved from `event_type`, referenced aggregate/resource and pinned aggregate version. If a
consumer lacks access or the resource has been deleted, it discards or applies the relevant
tombstone behavior without attempting to reconstruct the payload.

## Transaction, Delivery and Deduplication

The aggregate write and OutboxEvent insert commit in one database transaction. The producer
enforces uniqueness on `(aggregate_id, aggregate_version,event_type)`, assigns one `event_id`,
and never creates a second logical event for worker retry. An outbox relay may deliver that
same event more than once until its publication checkpoint commits.

Consumers persist `event_id` in the same transaction as their effect. A repeated ID is
acknowledged without repeating the effect. A different event ID with the same producer
uniqueness tuple is a producer integrity fault and is quarantined with IDs and a safe code; it
does not apply twice. Source/webhook receipt deduplication happens before domain emission and
is separate from event-consumer deduplication.

Delivery order is not global. For one aggregate, consumers process `aggregate_version` in
ascending order. A gap is held for up to 15 minutes while the consumer requests relay/replay;
after that it marks the projection degraded and alerts rather than applying later versions out
of order. Events for different aggregates may interleave freely. Consumers must tolerate an
event arriving after its referenced resource is revoked or deleted. `recorded_at` determines
relay latency; business calculations use source event times and pinned snapshot windows, never
outbox delivery time.

## Version Evolution

`schema_version` uses `major.minor`. A minor revision may add an optional field or event type
without changing existing meaning; the generator publishes the complete strict schema and
consumers declare the highest minor they accept. A new event type is ignored with a safe count
by consumers that do not subscribe to it. A major revision is required to remove/rename a
field, change a field's meaning/type, weaken privacy, or change deduplication semantics.

Producers emit one configured major version per event. During a breaking migration they may
emit v1 and v2 to separate versioned channels/outboxes from the same aggregate transaction;
they never place two shapes behind the same schema version. Breaking versions require fixtures,
consumer compatibility evidence and at least 90 days of deprecation. Replay retains the
original `event_id`, schema version, aggregate version and timestamps; translation creates a
new explicitly versioned derived event and provenance record, not a silent rewrite.

## Failure and Replay

A producer cannot report success for a domain mutation if its required outbox insert failed.
Relay failures retry with the leased-job fence and full-jitter policy in operations.md. Poison
events move to a metadata-only quarantine containing event ID, schema version, type, scope IDs,
safe code and attempt count; raw or expanded resource content is never copied there.

Replay selects explicit event IDs or aggregate version ranges, records the operator and reason,
and reuses original envelopes. It does not bypass a project deletion fence. Before replay,
deletion tombstones are applied; a deleted scope is acknowledged without resurrecting a
projection, snapshot, search record or export. A consumer rebuild uses the authoritative
resource store plus ordered events and must reproduce the same pinned digest.

## Event Acceptance

- Transaction rollback leaves neither aggregate change nor event; commit makes both durable.
- Duplicate delivery causes one consumer effect, including after consumer crash between effect
  work and acknowledgement.
- Cross-aggregate delivery reorders safely; same-aggregate gaps degrade rather than silently
  producing a newer projection.
- Every envelope validates against its declared generated schema and contains only generic
  references, safe state and count.
- Version fixtures prove supported minor evolution and parallel major migration; an unknown
  major is quarantined without payload logging.
- Replaying events after project deletion cannot restore any governed data or export access.
