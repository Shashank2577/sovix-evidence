# Domain and Ubiquitous Language

## Bounded Contexts

| Context | Owns | Does not own |
|---|---|---|
| Access | Workspace, membership, project grants, service principals | Source identity claims |
| Collection | Connectors, receipts, source revisions, completeness | Business conclusions |
| Agent observation | Sessions, spans, capability coverage, usage units | PR authorship or developer performance |
| Attribution | Evidence links, adjudication, versioned monetary allocations | Metric presentation or price-provider billing |
| Analytics | Definitions, eligible populations, results, comparisons | Arbitrary source mutation |
| Reporting | Definitions, snapshots, evidence bundles, investigations | Recalculation during browser rendering |
| Lifecycle | Retention, deletion fences, jobs, health, quotas | Tenant payload inspection by operators |
| Delivery | Deployments, incidents, verified outcome links | Causal claims from time correlation |
| Policy | Versions, evaluations, explicit actions and reconciliation | Bypassing host rules |
| Discovery | Public profiles, trends, public narrative, watchlists | Private telemetry and customer benchmarks |

## Terms

- **Observed**: A source explicitly recorded an event. Observation can still be incomplete.
- **Measured**: A deterministic count over a declared observed population.
- **Proxy**: A convention standing in for a different concept, such as landings for releases.
- **Inferred**: A conclusion based on optional signals, such as an agent-signature floor.
- **Available / partial / unavailable / suppressed**: Whether a value can be shown; independent
  of measured/proxy/inferred. A partial measured value is still measured within its sample.
- **Collection completeness**: Whether all eligible source pages/events in the requested
  window were retrieved; distinct from the fraction of retrieved records eligible for a metric.
- **Instrumented population**: Agents/devices/time intervals with explicitly enabled collection.
  There is no credible denominator for all human AI usage unless supplied independently.
- **Verified link**: A source-backed association or explicit analyst attestation. This shows
  a relationship, not proof that an agent authored every changed line.
- **Candidate link**: A relationship needing stronger evidence; excluded from exact totals.
- **Usage unit**: The one canonical owner of token quantities for accounting, often a turn.
- **Estimated equivalent cost**: Token usage priced with a versioned rate card. It is not an invoice.
- **Allocation**: A declared distribution of a cost unit among PRs and an unallocated remainder.
- **Snapshot**: A pinned logical view with an immutable content manifest until lifecycle deletion.
- **Report definition**: Mutable saved scope/window/view preferences used to generate snapshots.
- **Finding**: A rule-derived observation with evidence; not an automatically confirmed failure.
- **Investigation**: A user's follow-up, conclusion and next measurement date for a finding.
- **Policy evaluation**: A tri-state result on an exact head/evidence version.
- **Action**: A separately authorized, idempotent host mutation, never implied by evaluation.

## Domain Invariants

1. A child record's workspace/project must match its parent's; cross-tenant associations fail.
2. Source identity is connector + external ID + source revision, under a workspace namespace.
3. A source payload digest collision with unequal sanitized payloads is an error, not overwrite.
4. A metric with denominator zero is unavailable/null, even if numerator is zero.
5. Compatible raw records can be reaggregated; summary-only legacy scopes cannot manufacture
   a new median, percentile or union population.
6. All windows use `[start,end)` in UTC; display timezone is pinned in snapshots.
7. Source deletion/revocation changes availability or creates tombstones; it does not falsify
   an earlier calculation's provenance. A retained link may be unavailable without being wrong.
8. Every priced usage unit has a single selected cost estimate per price version. Billed and
   subscription allocations are separate ledgers and cannot be added to that estimate.
9. Each allocation version sums exactly to the cost unit, including an explicit unallocated
   row. Candidate associations receive zero allocation in verified views.
10. A report cannot disclose evidence its current viewer is not allowed to see; metric totals
    built from broader scopes must not leak through drill-down or export.
11. Deterministic metrics cannot depend on optional narrative output or source instructions.
12. Policy action authorization is evaluated against current state, never a stale report alone.

## State Machines

| Aggregate | States and allowed transitions |
|---|---|
| Connector | pending -> active; active -> degraded/revoked/disabled; degraded -> active/revoked/disabled; disabled -> pending; revoked -> pending only after new authorization |
| Job | queued -> running/canceled; running -> succeeded/partially_succeeded/retrying/failed/cancel_requested; retrying -> running/canceled/failed; cancel_requested -> canceled or completed result if commit already passed; terminals never restart, retry creates a new job |
| Session | open -> completed/interrupted; interrupted -> completed only with authoritative final event; late spans revise a new projection, not prior snapshots |
| EvidenceLink | candidate -> verified/rejected; verified/rejected -> superseded with a new immutable link revision; no in-place history edits |
| Snapshot | building -> ready/partial/failed; ready/partial -> revoked/deleted; revoked -> deleted; published manifests never return to building |
| Investigation | open -> in_progress/resolved/dismissed; in_progress -> resolved/dismissed; resolved/dismissed -> open with a reason |
| DeletionRequest | queued -> fencing -> purging -> completed; any active phase -> retrying/failed; retrying resumes same fenced scope |
| PolicyVersion | draft -> shadow -> active/disabled; active -> disabled; disabled -> shadow; edits create a new draft version |
| ActionRequest | pending_approval -> queued/cancelled; queued -> executing/refused/cancelled; executing -> succeeded/refused/failed/unknown; unknown -> succeeded/refused/failed after reconciliation |

`unknown` actions cannot be retried until host reconciliation. `partially_succeeded` is an
explicit success with rejected/inaccessible subsets, never an alias for complete success.

## Domain Events

Committed aggregate changes publish the versioned event envelope described in
[contracts/events.md](contracts/events.md). The initial event types are source.accepted,
source.rejected, collection.completed, session.updated, link.adjudicated, allocation.created,
snapshot.published, export.ready, investigation.changed, connector.revoked, deletion.completed,
deployment.recorded, incident.recorded, policy.evaluated and action.reconciled. Events carry
identifiers and safe counts, not prompts, raw source payloads or credentials.

## Product Boundaries

The platform can explain recorded review coverage; it cannot conclude that all missing
reviews happened nowhere else. It can link a session to a PR; it cannot deduce the economic
value of every line. It can compare observed cohorts; it cannot prove the model caused the
difference. Public stars remain attention signals. Those boundaries are enforced in copy,
calculation contracts and acceptance tests, not hidden in a general disclaimer.
