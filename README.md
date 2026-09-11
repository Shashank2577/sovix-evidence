# Sovix Evidence

**From AI coding activity to engineering decisions—with evidence you can inspect.**

This repository specifies a product combining Sovix's local Git scanner, Receipts' evidence-backed reports, optional Dash0/Darkplane agent telemetry, and RepoRadar public discovery. It covers activity before a push, changes and reviews after a push, and production outcomes when explicit deployment/incident sources exist.

**Status: specification complete; application implementation has not started.** There are 10 user journeys, 60 functional requirements, 12 non-functional requirements, 10 success criteria, 138 planned tasks, and a generated OpenAPI contract with 99 operations. No production service or new host integration is running from this repository.

## Start here

| Document | What it answers |
|---|---|
| [Product pitch](docs/product-pitch.md) | Customer, problem, value, demo and commercial hypotheses |
| [Product specification](specs/001-sovix-evidence/spec.md) | Full scope, user journeys, requirements and success criteria |
| [Implementation plan](specs/001-sovix-evidence/plan.md) | Architecture, selected stack and milestone boundaries |
| [Task backlog](specs/001-sovix-evidence/tasks.md) | 138 concrete, dependency-ordered implementation tasks |
| [Quickstart](specs/001-sovix-evidence/quickstart.md) | Validate these specifications and begin implementation |
| [Validation report](specs/001-sovix-evidence/validation.md) | Checks actually run and remaining implementation gates |

## Domain and integration contracts

- [Domain vocabulary and invariants](specs/001-sovix-evidence/domain.md), [data model](specs/001-sovix-evidence/data-model.md), [metric catalog](specs/001-sovix-evidence/metrics.md).
- [API semantics](specs/001-sovix-evidence/contracts/README.md), [OpenAPI 3.1.1](specs/001-sovix-evidence/contracts/openapi.json), [operation index](specs/001-sovix-evidence/contracts/operations.md), [CLI](specs/001-sovix-evidence/contracts/cli.md), [events](specs/001-sovix-evidence/contracts/events.md), [browser authentication](specs/001-sovix-evidence/contracts/bff.md).
- [Integration capability matrix](specs/001-sovix-evidence/integrations.md), [policy evaluation and actions](specs/001-sovix-evidence/policy.md), [security/privacy](specs/001-sovix-evidence/security.md).
- [UX and data presentation](specs/001-sovix-evidence/ux-spec.md), [operations](specs/001-sovix-evidence/operations.md), [migration](specs/001-sovix-evidence/migration.md).
- [Acceptance scenarios](specs/001-sovix-evidence/acceptance.md), [requirement traceability](specs/001-sovix-evidence/traceability.json), [research decisions and sources](specs/001-sovix-evidence/research.md).

## Scope of the first release

M0 establishes contracts and foundations. M1 ships the useful local product: read-only scan/import, reproducible calculations, clear coverage, evidence drilldown and portable reports. M2 adds hosted access controls, agent telemetry and conservative cost association. M3 adds schedules, investigations and operational lifecycle. M4 adds actual production outcomes and explicitly approved host actions after shadow qualification. M5 adds isolated public discovery.

The product will show observed associations and missing data. It will not equate session time with labor, model list prices with invoices, merge counts with production deployments, popularity with quality, or correlations with causal ROI. These constraints are part of the metric and policy contracts.

## GitHub Spec Kit

Initialized with official [GitHub Spec Kit v1.0.0](https://github.com/github/spec-kit/tree/v1.0.0), including Codex skills, templates and scripts. [Constitution](.specify/memory/constitution.md) and [provenance](docs/spec-kit-provenance.md) describe the setup. The feature is `specs/001-sovix-evidence`; the Git branch is `codex/001-sovix-evidence`.

In Codex, the next implementation instruction is:

```text
$speckit-implement Implement M0 then M1 only, following the task dependencies and acceptance gates. Keep later milestones unimplemented.
```

Read the implementation skill before executing. Specification checks do not establish application correctness, security or performance. Future application files named in the plan/tasks are not represented as already built.
