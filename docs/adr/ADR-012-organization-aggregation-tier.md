# ADR-012: Organization aggregation tier above Project

**Status**: Accepted for specification | **Date**: 2026-09-12

## Context

Reports are hard-scoped to projects. `ReportDefinition` carries `project_ids` and
`repository_ids` (data-model.md:47) and FR-031 (spec.md:303) permits only project-scoped saved
definitions. The `Workspace` is a tenant and security boundary (NFR-007, spec.md:384-385), not a
reporting aggregation level. There is consequently no way to answer "how is the whole
organization performing", which is the primary question an enterprise buyer asks first.

FR-009 (spec.md:255-256) already establishes the correct arithmetic for cross-repository
rollups: recompute from eligible raw populations rather than combining per-repository results.
The same hazard applies with greater force at organization scale, where naive averaging of
project ratios produces a number that is not any real quantity.

## Decision

Introduce a `scope` descriptor that is uniform across every aggregation level, and permit
report definitions and metric results to bind to any level.

Scope levels, from narrowest to widest: `repository`, `team`, `project`, `organization`.
`contributor` is an orthogonal filter applied within a level, governed by ADR-013.

Rules:

1. A `MetricResult` at any level MUST be computed from the union of eligible raw populations at
   that level. Aggregating previously computed child `MetricResult` values is forbidden for
   ratios, percentiles and any metric whose definition carries a denominator.
2. Counts and sums MAY be computed additively from child populations only when the underlying
   records are provably disjoint by unique source ID. Repository membership in multiple projects
   makes project sums non-disjoint, so deduplication by unique repository and source revision ID
   is mandatory, as FR-009 already requires.
3. Percentiles at organization level MUST be recomputed from the union distribution
   (metrics.md:61). A median of medians MUST NOT be produced.
4. A scope whose population is empty yields `unavailable`, never zero, per ux-spec.md:8.
5. Coverage is computed per level. An organization overview MUST state how many of its
   repositories actually reported, because partial organizational coverage is the normal case
   and the most common way an enterprise dashboard misleads.
6. A repository belonging to several projects is counted once at organization level. Its
   contribution to each project remains whole. Project values therefore MAY sum to more than
   the organization value, and the UI MUST say so rather than hide the discrepancy.

`Organization` is not a new tenancy row. It is the workspace viewed as a reporting scope, so no
new isolation boundary is introduced and Principle VII (prefer modular over distributed) holds.

## Consequences

- `ReportDefinition` gains `scope_level` and `scope_ids`; `project_ids`/`repository_ids` become
  the `project`/`repository` specializations of that pair, preserving existing definitions.
- `MetricResult.scope` (data-model.md:43) already exists and now carries the level explicitly.
- Organization-level queries touch every repository in the workspace, so the plan's stated
  target of 50 repositories and 1m spans/workspace/day (plan.md:31) is insufficient for the
  enterprise claim. Revised targets are specified in `specs/002-enterprise-scopes`.
- Rule 6 is a presentation obligation, not only a computation rule.

## Alternatives rejected

- **Sum project metrics into an organization total.** Rejected: double counts shared
  repositories and produces invalid ratios and percentiles.
- **Make organization a separate tenant entity.** Rejected: adds an isolation boundary with no
  isolation requirement, and would fragment the existing RLS model.

## Revisit trigger

A customer requiring several isolated organizations under one billing relationship, which would
make organization a genuine tenancy row rather than a scope descriptor.
