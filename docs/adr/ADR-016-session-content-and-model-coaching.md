# ADR-016: Session content captured by default; coaching reads it with a model

**Status**: Accepted for specification | **Date**: 2026-09-25 | **Supersedes**: ADR-015 |
**Amends**: ADR-006, ADR-013 rules 4 and 6 and its access matrix, Constitution III and VII

## Context

ADR-015 made metadata the default capture, put prompts and tool output behind opt-in tiers with a
local-only tier, and required notice to every contributor and a per-contributor opt-out before
hosted capture. Spec 006 then forbade any coaching rule from referencing content (FR-415) and
forbade any model call on the coaching path (FR-426, NFR-090).

Together those rules produced a product that could capture a prompt and never use it. Spec 006
FR-450 and FR-451 promised content-derived detectors that FR-415 and FR-426 made unbuildable. What
was left was coaching over metadata, which can say a session was long, error-heavy or compacted
three times, but never why, and never what the developer could have asked differently.

The product decision is that coaching is about prompting technique and session history. That needs
the prompts, the responses and what the agent did with them, and it needs a language model to read
them. A bounded rule language over counts cannot judge whether a prompt stated its acceptance
criteria.

## Decision

1. **Content is captured by default.** Every session stores its prompts, system instructions,
   responses, tool arguments, tool results, session title and raw error text alongside its
   metadata. File paths are captured where they appear inside tool arguments and results; there is
   no separate file-path attribute.
   There are no capture tiers and no per-contributor opt-out. Sovix's recommended collector
   configuration enables content, including setting the Dash0 plugin's `omit_io` to false. A
   session that arrives without content, because a collector or runtime did not send it, is
   marked `content_state=missing` with the reason and counted in collection coverage. It is never
   rendered as an empty conversation.

2. **Content lives at most 30 days.** Content is hard-deleted no later than 30 days after the
   session ends. A workspace may set a shorter period and never a longer one. No role, hold,
   export or configuration extends it. Content is encrypted under per-day keys that are destroyed
   at expiry, so copies in backups become unreadable on the same schedule, and a restore re-applies
   deletion before serving. Metadata (span tree, timings, tool names, token counts, cost, error
   classes, links to commits and pull requests) is kept strictly longer than content: both clocks
   start at session end, `spans_days` must exceed `session_content_days`, and the metadata default
   is 60 days. Metrics already computed live in snapshots under evidence retention. An expired
   session says when its content expired.

3. **Who may read session content.** The developer whose linked identity produced the session;
   owner and admin across the workspace; an analyst for sessions in a project inside their grant.
   An internal viewer and any `is_external` principal never reach session content. This access
   does not depend on `individual_attribution_enabled`, which continues to gate named-person
   metric views under ADR-013.

4. **The developer is not notified.** Reading a session, or reading another person's coaching,
   sends no notification to its subject and does not appear in the subject's list of views taken
   of them. ADR-013 rule 4 no longer applies to session content or coaching.

5. **Reads are logged for administrators only.** Every read request for session content, and
   every read request for another person's coaching, writes exactly one `AuditEvent` recording
   actor, subject handle, the session or finding IDs returned (possibly none) and time. It is
   readable by owner and admin only, is never shown or sent to the subject, and carries no
   content. Listing another developer's sessions (metadata only) is not audited, and names exactly
   one developer per request.

6. **Coaching uses a language model.** Coaching reads session content together with the session's
   outcomes (verified commit and pull-request links, rework, review, CI results) and produces
   findings about prompting technique and working practice. Binding rules:
   - **Cited or discarded.** A model-produced finding MUST cite the sessions and turns it rests
     on. A finding without resolvable citations is discarded, not shown. This is Constitution I
     applied to coaching.
   - **Labelled and immutable.** A finding records the model ID, the coaching instruction version
     and the generation time, and is labelled model-generated wherever it appears. It is never
     regenerated in place, because a second run may word it differently.
   - **Outside the calculation path.** Coaching MUST NOT produce, alter or feed a metric value, a
     metric threshold, a finding in a snapshot, or a snapshot. No metric reads content. Metrics
     keep zero model calls.
   - **No causal claims.** A finding may say what happened in the cited sessions and what tends to
     go differently. It MUST NOT claim a practice caused an outcome.
   - **Visible to the developer and their leads.** Owner, admin, and an analyst whose grant
     covers every project the finding cites. A lead never sees a finding that cites a session they
     cannot read.
   - **Never comparative.** No ordering, ranking, side-by-side view or count of developers by
     coaching finding exists at any role (FR-090, FR-430). A lead reads one developer's coaching
     at a time.
   - **Model provider is a workspace setting.** Content is sent only to the configured provider,
     under a no-training and minimal-retention agreement where the provider offers one. Model
     spend on coaching is recorded as its own cost line, separate from the team's agent usage.
   - **Quotes expire with their source.** A finding keeps its category, citations and time under
     normal retention. Any content quoted in it is deleted when the cited session's content is.

7. **Carried over from ADR-015 unchanged.** Credential-shaped strings are redacted before storage.
   The receiver allowlists attributes independently of the sender and discards unknown keys;
   content attributes are now on the allowlist. Content never enters a `PublishedArtifact`,
   snapshot, export, event payload, log, audit payload or search index readable by another
   principal, and replay offers no content export.

8. **One disclosure, no consent step.** The collector's install output and the workspace settings
   page state once that prompts, system instructions, responses and tool output are captured and
   kept for up to 30 days. It is a statement of fact, not an opt-in, an opt-out or a notification.

### Clarifications

- **A reader of content can browse, one developer at a time.** A principal permitted by rule 3
  may list one developer's sessions per request in the projects they can read, see that
  developer's pseudonymous handle, and keep reading a session's metadata after its content
  expires. An unfiltered list holds only the caller's own sessions. Sessions with no linked
  developer are listed through an explicit `unattributed` filter; they carry no handle, so this is
  not a view of a person. Sessions and developers are never ordered by a metric, per FR-090.
- **The audit write gates the read.** If the rule 5 audit event cannot be written, the content or
  coaching read fails.
- **When a session "ends".** A session that never finalizes ends at its last received span, for
  the purpose of the 30-day clock.
- **Shortening applies retroactively.** A shorter workspace period applies to content already
  stored. The minimum is 1 day; 0 is not allowed, because it would be a workspace-wide opt-out.
- **Partial content.** A session where only some spans carry content has content state `partial`,
  alongside `present`, `missing` and `expired`.
- **Content belongs to a session.** Content exists only on an ingested session's spans. Prompt
  fragments inside imported reports (Receipts, AIBOM) have no session and no expiry anchor, and
  stay discarded.
- **Model-written text expires too.** The claim, suggestion and falsification text a model writes
  can paraphrase content, so it is deleted with the earliest-expiring session it cites. The
  finding's category, citations, claim class and generation record remain, so a developer can still
  see how often a kind of finding recurred over time.
- **Only the owner changes the model provider.** Each change is an audited configuration change,
  like `individual_attribution_enabled`, because the provider decides where content goes.
- **Local mode stays local.** A local workspace with no hosted account keeps its content on the
  machine under the same 30-day bound. A collector registered to a hosted workspace sends content
  to that workspace. Model coaching runs in local mode too, when the local workspace has a
  provider configured.

## Consequences

- Replay shows the full conversation for 30 days, then falls back to metadata with the expiry date
  stated.
- Coaching can finally say something specific: which prompts lacked acceptance criteria, where the
  agent was corrected four times on the same misunderstanding, which sessions looped on one error.
- The hosted database now holds sensitive content. Encryption at rest, row-level tenant isolation
  and content-free logs become load-bearing, and the 30-day bound caps what a breach can expose.
  Content keys are per workspace per session-end day and are held outside every database backup,
  so destroying a key shreds every copy, backups included.
- A developer cannot opt out. A developer who disables content in their own collector appears as
  `content_state=missing` in coverage, which leads can see.
- Some jurisdictions require transparency or a prior employee-representative agreement for this
  kind of capture (for example GDPR, German works councils). Rule 8 is the product's minimum;
  meeting local employment law is the deploying organization's responsibility.
- Coaching is non-deterministic. Two runs over the same sessions can word findings differently,
  which is why findings are immutable and cite their evidence rather than being recomputed.
- ADR-015 is superseded. ADR-006's metadata-only commitment no longer covers session telemetry.
  ADR-009 is unchanged for calculators; coaching is the "new use case with separate budget" its
  revisit trigger anticipated. ADR-013 rules 4 and 6 and its access matrix are amended as above,
  and Constitution III gains a fourth exception to `k<5` suppression; the ranking prohibition is
  untouched.

## Alternatives rejected

- **Keep ADR-015's tiers.** Rejected: the default made coaching generic, and the local-only tier
  meant a lead could never help with a session.
- **Capture content but coach with rules only.** Rejected: a bounded rule language cannot judge a
  prompt, which is the thing coaching is for.
- **Opt-out and notify-on-read.** Rejected by product decision: it adds friction for little
  benefit and leaves gaps that make team-level coaching unreliable.
- **Retain content longer than 30 days.** Rejected by product decision.

## Revisit trigger

A customer or jurisdiction that requires per-person consent or opt-out for content capture, or a
need to keep content longer than 30 days.
