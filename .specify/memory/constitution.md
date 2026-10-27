<!-- Sync impact: initial template -> 1.0.0. Added seven project principles, delivery gates,
security constraints and amendment rules. No principles removed; no deferred placeholders.
Template sources are unchanged and read this constitution at execution time.

1.0.0 -> 1.1.0 (2026-09-12). Principle III amended per ADR-011, ADR-013 and ADR-014 to permit
keyed pseudonymous contributor handles, to allow self-view and audited named-person operational
views as bounded exceptions to k<5 suppression, to forbid any contributor-ranking primitive
architecturally, and to separate published artifacts from exports. No principle removed. Minor
version because the amendment adds a constraint (no ranking primitive) and bounded exceptions
rather than reversing a governing rule. Affected: spec.md FR-016/FR-017, data-model.md entity
catalog and Export row, ux-spec.md people views. Those documents are updated in specs 002-006.

1.1.0 -> 2.0.0 (2026-09-25). Principles III and VII amended per ADR-016. Session content
(prompts, responses, tool arguments and results) may now be stored in the platform database for
session replay and coaching, secret-redacted and hard-deleted within 30 days, and is readable by
the developer, owner, admin and analysts whose grant covers the session's project. The exclusion
of raw-content capture from initial delivery is removed. Coaching may call a language model,
outside the calculation path, with cited and labelled output. Major version because the amendment
reverses a governing rule. A fourth exception to k<5 suppression is added for one-developer
session and coaching reads. Affected: spec 001 US4 and FR-016, plan.md constraints, security.md,
data-model.md, spec 002 FR-093/FR-094/FR-096, spec 005 (tiers removed), spec 006 (content and
model coaching), spec 003 person view, ADR-013 rules 4 and 6 and its access matrix, ADR-015
(superseded). -->

# Sovix Evidence Constitution

## Core Principles

### I. Every claim carries evidence
Every metric MUST include a versioned definition, scope, event-time window, formula,
named inputs, sample, collection completeness, exclusions, sources and limitations.
A value MUST be classified as measured, proxy or inferred. Availability is a separate
state; unavailable, suppressed and unpriced values MUST NOT become numeric zero.
Reproducibility means the same normalized inputs, configuration and calculator version
produce the same canonical metric payload. Collection timestamps are outside that hash.

### II. Preserve the limits of observation
Agent-signature shares MUST be described as detectable floors. Commit signatures do not
establish precise line authorship. Session duration is elapsed time, not labor. A merge
is not a deployment. A fix marker is not an incident. Correlation is not causation.
Candidate session/change links MUST NOT enter exact attribution totals. Rework based on
file touches MUST be labelled a proxy. Benchmarks MUST disclose cohort selection.

### III. Privacy is part of the domain
Local analysis MUST function without telemetry or a hosted account. Team/project reporting
is the default. Contributor plaintext identities MUST be absent from the platform database and
from standard exports; keyed pseudonymous handles are permitted and are the only contributor
representation that may persist or be published (ADR-011). Session content (prompts, responses,
tool arguments and results) MAY be stored in the platform database for session replay and
coaching only; it MUST be secret-redacted before storage, hard-deleted no later than 30 days
after the session ends, readable only by the developer, owner, admin and analysts whose grant
covers the session's project, sent to no one but the workspace's configured coaching model
provider, and MUST NOT enter any metric, export, snapshot, event, log, audit payload, published
artifact or search index readable by another principal (ADR-016).
Cohorts smaller than five distinct humans MUST be suppressed in hosted people breakdowns,
except in a subject's view of their own data, in local mode, in an audited named-person
operational view that a workspace has separately enabled (ADR-013), and in an owner's, admin's or
granted analyst's read of one developer's sessions or coaching (ADR-016). Ranking contributors
against one another MUST NOT be implementable: no ordering, percentile-rank or top-N
contributor primitive may exist in any interface. Public discovery, published
artifacts and private engineering datasets MUST have separate storage, credentials and
publication paths, and publication MUST be an explicit audited act over pseudonymous or
aggregate data only (ADR-014).

### IV. Contracts precede integration
External boundaries MUST have versioned schemas, fixtures and failure semantics before
implementation. Connectors MUST retain source identity, event time, collection time and
coverage. Duplicate delivery MUST be idempotent. Changed duplicate payloads MUST be
quarantined instead of silently replacing evidence. Cross-language implementations MUST
pass shared golden fixtures. Legacy exports MUST remain interpretable through adapters.

### V. Decisions and actions are separate
Observation, recommendation, approval and execution MUST be distinct records. Default
policy mode is shadow. An enabled enforcement policy MUST evaluate the current commit,
current evidence and current host protections immediately before action. Missing, stale,
ambiguous or failed checks require human review. Changes to authorization, repository
access or publication MUST be explicit, attributable and audited. No autonomous production
deployment is included in this specification.

### VI. Test the properties that carry risk
Financial allocation, aggregation, privacy, tenancy, signature verification, event replay
and policy decisions MUST have unit/property and integration tests. Contract changes MUST
validate old and new fixtures. An end-to-end acceptance scenario MUST demonstrate each
user story. A checkbox is complete only when its acceptance evidence is recorded. A schema
validator passing is not evidence that the future application works.

### VII. Prefer a modular product over distributed complexity
One monorepo and a modular backend with independently runnable workers are the initial
architecture. Extract a service only after measured scale, isolation or ownership needs
justify it. Deterministic analytics MUST make zero model calls. Coaching, optional AI narrative
and public-repo enrichment MUST sit outside the calculation path and cite existing facts;
coaching MAY call a language model over session content, and its output MUST cite the sessions
it rests on, be labelled model-generated, and never produce or alter a metric value (ADR-016).

## Product and Security Constraints

- Initial adapters: Sovix JSON v1, Receipts JSON 1.0, GitHub and redacted Dash0/OTLP traces.
- Initial user interfaces: local CLI/portable report and hosted project console.
- Tenant scope MUST be server-derived; IDs supplied by clients are never authorization.
- Tokens MUST be scoped, redacted from logs and stored outside report artifacts.
- Snapshots are immutable until lifecycle deletion; deletion invalidates downloadable
  artifacts and retains only a content-free audit tombstone.
- All price estimates MUST retain currency, catalog version and unresolved usage.
- Source code MUST NOT be copied from upstream projects until its license and revision are
  recorded. Upstream notices survive vendoring. No private report belongs in public fixtures.

## Development Workflow and Quality Gates

1. Update spec and acceptance traceability before changing product behavior.
2. Record cross-cutting decisions in an ADR; update plan, domain and contracts together.
3. Work on the smallest story slice whose prerequisites are complete.
4. Run schema/document checks, relevant contract tests and story acceptance tests.
5. Review metric claims, privacy and migration effects before calling a release ready.
6. Record executed checks separately from planned checks in the validation report.
7. Preserve existing repository contents and legacy commands during migration.

## Governance

This constitution governs project-generated implementation guidance. User instructions
remain authoritative. Amendments require an ADR describing rationale, affected contracts,
migration and acceptance impact. Governance-breaking changes increment the major version;
new principles increment the minor version; clarifications increment patch. Each plan
records compliance with every principle and explains any justified exception. There are
no approved exceptions at initial ratification.

**Version**: 2.0.0 | **Ratified**: 2026-09-11 | **Last Amended**: 2026-09-25
