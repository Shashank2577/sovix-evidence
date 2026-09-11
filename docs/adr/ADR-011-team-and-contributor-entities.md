# ADR-011: Team and pseudonymous Contributor entities

**Status**: Accepted for specification | **Date**: 2026-09-12 | **Amends**: Constitution III

## Context

The product specification has no `Team` entity. `Membership` (data-model.md:23) carries only
`role` and `project_ids`, so there is no grouping of members below the workspace. There is also
no `Contributor` entity: data-model.md:13-14 forbids contributor name, email, prompt, source body
and filesystem path from the normalized platform database, and FR-016/FR-017 (spec.md:267-270)
make hosted people breakdowns aggregate-only with individual leaderboards unavailable.

Enterprise buyers require team-level rollups and the ability for a contributor to see their own
activity. The existing design forbids both. Removing the privacy constraint outright would delete
the product's principal differentiator against surveillance-style developer analytics.

## Decision

Add two entities. Identity is separated from the subject of measurement.

`Team`
- Fields beyond scope/ID: `name`, `slug`, `parent_team_id` nullable, `status`.
- Unique `workspace_id` + `slug`. `parent_team_id` MUST reference a team in the same workspace.
- Team nesting depth MUST NOT exceed 5. Cycles MUST be rejected at write time.
- Teams group memberships and projects; they are a reporting and access dimension, not a
  security boundary. The workspace remains the only tenant boundary.

`TeamMembership`
- Fields: `team_id`, `membership_id`, `valid_from`, `valid_until` nullable.
- Effective-dated, matching the `ProjectRepository` pattern (data-model.md:26). A metric window
  MUST resolve team composition as of the window, not as of query time.

`Contributor`
- Fields: `identity_digest`, `handle`, `kind`, `first_observed_at`, `last_observed_at`, `status`.
- `identity_digest` is HMAC-SHA256 over the normalized lowercase author email, keyed by a
  per-workspace secret that is never exported and never returned by any API.
- `handle` is a stable pseudonym derived from the digest (for example `Contributor 7f3a`).
- `kind` is `human`, `bot` or `unknown`, resolved by an explicit bot-pattern rule set.
- The plaintext author name and email MUST NOT be persisted in any column, index, log, audit
  record or export. They exist only transiently inside the local trusted process during scanning,
  consistent with data-model.md:14.

`ContributorAlias`
- Fields: `contributor_id`, `identity_digest`, `merged_by`, `merged_at`.
- Permits merging the multiple addresses of one human (the demo repositories exhibit exactly
  this: a `noreply` address and a personal address for the same person). Merging is an explicit,
  audited act, never automatic inference from a display name.

## Consequences

- Team-level and contributor-level aggregation become expressible without storing identities.
- Re-identification requires the per-workspace HMAC key, which is not exported with any artifact.
  A published artifact therefore cannot be de-pseudonymized from its own contents.
- Constitution Principle III is amended from "contributor identities MUST be absent" to
  "contributor plaintext identities MUST be absent; pseudonymous handles are permitted".
  Constitution version becomes 1.1.0.
- A display name shown in local mode is resolved live from the local Git repository at render
  time. It is not read from the platform database, because it is not there.

## Alternatives rejected

- **Store identities and rely on access control.** Rejected: it makes a breach or a mis-scoped
  export disclose real identities, and it contradicts data-model.md:13 directly.
- **Keep aggregate-only reporting.** Rejected: it cannot satisfy team rollups or self-view, both
  of which are required for enterprise adoption.
- **Derive the pseudonym by unkeyed hash.** Rejected: an unkeyed digest of an email is trivially
  reversible by dictionary attack over a known contributor set.

## Revisit trigger

A customer requirement for cross-workspace contributor identity, or a legal obligation to
produce named individual records, either of which requires a separate privacy review.
