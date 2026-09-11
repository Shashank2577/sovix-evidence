# ADR-013: Person-scope reporting gated by mode, role and subject

**Status**: Accepted for specification | **Date**: 2026-09-12 | **Amends**: Constitution III, FR-017

## Context

FR-017 (spec.md:269-270) states that hosted people breakdowns MUST suppress cohorts under five
and that "arbitrary identity filters and individual leaderboards MUST be unavailable". The rule
is unconditional: no role, not even owner, unlocks a single-person view.

Two legitimate requirements conflict with it. An individual contributor wants to understand their
own work — what they did, how they performed, how that changed over time. An engineering leader
needs cost and delivery attribution granular enough to act on. Neither requirement is a
leaderboard, but the current rule forbids both because it was written to forbid the leaderboard.

The rule conflates three different things: **self-knowledge**, **operational attribution**, and
**comparative ranking**. Only the third is the harm the rule exists to prevent.

## Decision

Replace the unconditional prohibition with an access matrix. A person-scoped query is permitted
only when every condition for its row is satisfied.

| View | Who may see it | Where | Suppression |
|---|---|---|---|
| Self view | The authenticated user, about their own linked contributor identities only | Local and hosted | None; a person is never suppressed from themselves |
| Local individual view | Any operator of a local workspace, about that machine's repositories | Local only | None; the data never leaves the machine |
| Team aggregate | Analyst and above, about a team of at least five humans | Local and hosted | `k<5` and complementary suppression apply |
| Named-person operational view | Owner and admin only, with an explicit per-workspace `individual_attribution_enabled` flag, and only within a project they administer | Hosted | Access is audited per query; subject is notified |
| Ranking or leaderboard | Nobody | Nowhere | Prohibited outright and not implementable |

Binding rules:

1. **No ranking primitive exists.** The API MUST NOT expose ordering by a performance metric
   across contributors, a percentile rank of one contributor against peers, or a "top/bottom N
   contributors" query shape. This is enforced by the absence of the capability, not by policy
   configuration, so it cannot be enabled by a misconfiguration.
2. **Self view is a right, not a grant.** A contributor who can authenticate and prove control of
   an identity may always see their own data at full fidelity.
3. **Identity linking is explicit.** A `User` is bound to a `Contributor` (ADR-011) by verified
   email control or an admin action that is audited. A display name never implies a link.
4. **Named-person views are audited and disclosed.** Every named-person query writes an
   `AuditEvent` naming the actor, the subject and the window. The subject can see who viewed
   their data. A leader who inspects an individual leaves a trace the individual can read.
5. **Published artifacts are always pseudonymous.** No person-scoped artifact leaving the system
   may carry a plaintext identity, regardless of role. See ADR-014.
6. **Coaching output belongs to its subject.** Individual coaching is generated for and visible to
   the contributor. It is not surfaced in a leader's view of that person.

Constitution Principle III is amended: "Cohorts smaller than five distinct humans MUST be
suppressed in hosted people breakdowns" gains the qualifier "except in a subject's view of
themselves, in local mode, and in an audited, separately enabled named-person operational view".

## Consequences

- The individual profile and coaching capability become specifiable.
- Rule 1 is the substantive privacy guarantee. Ranking is prevented architecturally rather than
  by a setting, which is what distinguishes this product from surveillance analytics.
- Rule 4 introduces a notification obligation with UI and retention implications.
- `individual_attribution_enabled` defaults to false. Enabling it is a workspace-level decision
  recorded as an audited configuration change.

## Alternatives rejected

- **Keep the absolute prohibition.** Rejected: forbids a person seeing their own data, which is
  neither a privacy benefit nor defensible to a user.
- **Allow named-person views to any analyst.** Rejected: analyst is a broad role and this
  reconstructs the leaderboard socially even without the primitive.
- **Permit ranking behind a flag.** Rejected: a flag that can be turned on will be turned on, and
  the guarantee is only credible if the capability does not exist.

## Revisit trigger

A jurisdiction requiring works-council approval for any individual measurement, which would make
even the audited named-person view require a prior consent record.
