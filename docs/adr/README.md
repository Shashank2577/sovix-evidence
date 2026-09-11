# Architecture decision register

The full context, alternatives and consequences are in [research.md](../../specs/001-sovix-evidence/research.md). This register provides stable decision identifiers for implementation reviews.

| ID | Decision | Why | Revisit trigger |
|---|---|---|---|
| ADR-001 | Modular Python backend with TypeScript clients/scanner | Reuse Receipts analytics and Sovix/Radar strengths through typed boundaries | Proven independent service scaling or ownership need |
| ADR-002 | SQLite local; PostgreSQL/RLS hosted; shared domain | Useful offline product and explicit tenant isolation | A required domain capability cannot preserve parity |
| ADR-003 | PostgreSQL leased jobs and transactional outbox | Durable replay without premature distributed infrastructure | Measured queue saturation under documented target load |
| ADR-004 | Evidence graph represented as relational versioned links | Auditable joins and corrections; no graph database required | Demonstrated query cost unaddressable by indexing/projection |
| ADR-005 | Canonical usage ownership and conservative allocation | Avoid parent/subagent double counting and invented attribution | New vendor accounting semantics with conformance fixtures |
| ADR-006 | Metadata-only telemetry, aggregate-first hosted reporting | Reduce retained sensitive content and individual surveillance | Separately approved product/privacy revision, never a silent toggle |
| ADR-007 | Shadow before action; per-action admin approval | Separate observed evidence from authority to mutate a host | Explicit new threat model and scope approval |
| ADR-008 | Public discovery isolated and optional | Retain RepoRadar value without private-data publication paths | None without an explicit data-boundary redesign |
| ADR-009 | Deterministic calculators; optional labelled narrative | Reproducible decisions without required model cost | A new use case needs generated explanation with separate budget |
| ADR-010 | Pin OTLP wire contract to opentelemetry-proto v1.5.0 | Concrete reproducible receiver conformance target | Intentional adapter upgrade with old-payload replay tests |
| [ADR-011](ADR-011-team-and-contributor-entities.md) | Team and pseudonymous Contributor entities | Team rollups and self-view without storing plaintext identity | Cross-workspace identity or a legal named-record obligation |
| [ADR-012](ADR-012-organization-aggregation-tier.md) | Organization aggregation tier above Project | Enterprise-wide answers without double counting shared repositories | Several isolated organizations under one billing relationship |
| [ADR-013](ADR-013-person-scope-gating.md) | Person scope gated by mode, role and subject; ranking has no primitive | Self-knowledge and attribution are separable from comparative ranking | A jurisdiction requiring prior consent for any individual measurement |
| [ADR-014](ADR-014-published-artifact.md) | PublishedArtifact distinct from Export | Public pages cannot honour Export's revocation guarantee | Consented publication of identified data |

ADR-011 through ADR-014 have dedicated documents because each reverses or qualifies an explicit
earlier decision. ADR-001 through ADR-010 retain their context in
[research.md](../../specs/001-sovix-evidence/research.md).

All decisions are accepted for the specification, not evidence of a running deployment.
