# ADR-015: Tiered content capture for session replay

**Status**: Accepted for specification | **Date**: 2026-09-12 | **Qualifies**: Constitution III

## Context

Session replay — seeing what an agent actually did, which tools it called, with what arguments,
and what came back — requires content that the current design excludes. Three facts collide.

The constitution states raw-content capture is excluded from initial delivery and that a future
change requires a separately versioned policy. `plan.md:33` commits to metadata-only telemetry.

The Dash0 plugin defaults to `omit_io=true`, replacing `gen_ai.tool.call.arguments`,
`gen_ai.tool.call.result`, `gen_ai.input.messages` and `gen_ai.output.messages` with the literal
string `<REDACTED>`. With the default in force, replay is impossible: the span tree survives but
every payload is gone.

The sibling product already stores full `prompt_text` and `response_text` in its
`prompts` table (apps/cli/internal/store/sqlite.go:32-56) and syncs them to a hosted service.
So raw content capture is not hypothetical; it exists and is already being transmitted.

A single global switch is the wrong shape. "Never capture content" makes replay and meaningful
coaching impossible. "Always capture content" puts developer prompts, source excerpts and tool
output into a hosted multi-tenant store, which is the exact posture this product exists to
differentiate against.

## Decision

Content capture has three tiers. The tier is a property of a workspace and is recorded on every
session, so any consumer can tell what fidelity produced a given record.

| Tier | Name | What is captured | Where it may live | Default |
|---|---|---|---|---|
| 0 | Metadata | Span tree, timings, tool names, token counts, model IDs, error classes | Local and hosted | Yes |
| 1 | Local replay | Tier 0 plus tool arguments, tool results, prompts and responses | Local machine only, never transmitted | Opt-in, one command |
| 2 | Shared replay | Tier 0 plus redacted content under a retention bound | Hosted, workspace-scoped | Opt-in, admin, audited |

Binding rules:

1. **Tier 0 is the default and is sufficient for every deterministic metric.** No analytics
   calculation may require tier 1 or tier 2 data. Metrics MUST NOT silently improve when a
   higher tier is enabled, because that would make measurements incomparable across workspaces.
2. **Tier 1 never leaves the machine.** It is stored in the local workspace store, excluded from
   every sync, export and published artifact by construction rather than by filter. A tier 1
   record has no transmission path.
3. **Tier 2 requires an admin action, a retention bound of at most 30 days, and an audit record.**
   Enabling it notifies every contributor whose sessions will be captured, before capture begins.
   Contributors may opt out individually, and an opted-out contributor's sessions stay at tier 0.
4. **Content is never published.** No tier 1 or tier 2 content may enter a `PublishedArtifact`
   (ADR-014), regardless of role, profile or redaction. Replay is an inspection surface, not a
   publication surface.
5. **The receiver applies its own allowlist.** The Dash0 plugin filters with a deny-list, so any
   new upstream attribute is exported by default. Our receiver MUST allowlist attributes
   independently and discard unknown keys, never trusting that the sender redacted correctly.
   This holds at every tier.
6. **Tier is visible wherever replay is offered.** A session captured at tier 0 shows the tool
   names and timings with an explicit statement that payloads were not captured. It MUST NOT
   render an empty payload pane that implies the tool did nothing.
7. **Secrets are redacted at every tier, including tier 1.** Tool arguments and results are
   scanned for credential-shaped strings before storage. Local-only is not an excuse to persist
   a leaked token in plaintext.

## Consequences

- Replay is specifiable without putting developer content into a hosted store by default.
- Rule 1 is what keeps the product honest: two workspaces at different tiers still produce
  comparable numbers, so a customer is never pressured into a higher tier to get better metrics.
- Rule 3's notify-before-capture obligation has UI, timing and retention consequences, and is a
  stronger commitment than competitors make. The competing coach product claims zero telemetry
  while its chat feature transmits prompts and tool output to a model provider, unreconciled.
  Our claim must survive the same scrutiny we would apply to theirs.
- Tier 1 makes the local product genuinely more capable than the hosted one for self-inspection,
  which is an unusual but defensible shape: the developer's own machine is the most privileged
  place for their own data.

## Alternatives rejected

- **Metadata only, forever.** Rejected: replay and specific coaching become impossible, and the
  span tree without payloads answers "what ran" but never "what happened".
- **Capture everything, redact on read.** Rejected: makes disclosure a query-time property, so a
  single authorization mistake exposes everything retained.
- **Follow the upstream plugin's `omit_io` setting.** Rejected: delegates a privacy decision to a
  third-party default we do not control and cannot audit per workspace.

## Revisit trigger

A customer requirement for cross-machine replay of their own sessions, which would need tier 1
data to sync end-to-end encrypted under a key the platform cannot read.
