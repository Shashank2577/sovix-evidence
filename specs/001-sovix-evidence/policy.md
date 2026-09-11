# Policy Evaluation and Guarded Host Actions

Status: proposed M4 behavior, disabled by default. Implements FR-049–054 and US9. A policy
recommendation is an evidence result, not authorization to change GitHub. This document
uses the authorization roles, immutable versions and action entities in security.md and
data-model.md. Production deployments, arbitrary shell commands and code-changing bots are
outside this action model.

## Bounded Rule Language

Policies contain a flat `all` list of 1–20 rules; every rule is mandatory. No arbitrary code,
SQL, regular expressions, templates, embedded prompts, dynamic URLs, nested logical trees,
user-defined functions or remote execution. Server-side typed validation rejects extra keys.
Rules read a prepared evidence snapshot and live host state through fixed adapters.

| Rule type | Parameters | Pass | Fail / unknown |
|---|---|---|---|
| `required_checks` | 1–20 registered check names and trusted producer app IDs | All selected exact-head runs conclude success | Known failure fails; missing/pending/untrusted/ambiguous run unknown |
| `minimum_approvals` | integer `count` 1–5 | At least count currently valid distinct approvals | Complete data below count fails; incomplete/stale review state unknown |
| `no_changes_requested` | none | No effective outstanding changes-requested review | Outstanding request fails; incomplete review history unknown |
| `pr_ready` | none | PR open, non-draft, mergeable, intended base branch matches scope | Closed/draft/conflict fails; provider mergeability pending unknown |
| `max_changed_lines` | integer `maximum` 1–100000 | Complete exact-head addition+deletion count ≤ maximum | Above maximum fails; truncated/unknown diff unknown |
| `max_evidence_age` | integer `seconds` 30–300 | Every required observation age ≤ seconds | Stale/missing/future-skewed observation unknown |
| `collection_complete` | required capability names from versioned registry | All required populations have completed pagination and valid capability | Known revoked/incomplete source unknown; never zero-fill |

Default policy has `pr_ready`, `required_checks`, `minimum_approvals`,
`no_changes_requested`, `max_evidence_age` and `collection_complete`. Merging requires all
six irrespective of optional extra rules. Rules cannot approve merges based on AI-signature
floors, cost, inferred person identity, time proximity, popularity or an LLM judgment.

Check names alone are insufficient: bind trusted producer app IDs and exact commit SHA.
Exclude Sovix's own published policy check from dependency rules to prevent self-approval
and cycles. For repeated runs, choose the provider's latest run attempt for the trusted
producer; ambiguous duplicate producers yield unknown. Skipped, neutral, cancelled,
timed-out or action-required checks do not satisfy `success` in this v1 policy vocabulary.

Approval calculation follows current GitHub state and host dismissal rules, excludes PR
author/bot self-approval, and does not claim that a recorded approval proves review quality.
Host branch protection and rulesets may be stricter; the platform never weakens them.

Result aggregation is deterministic: any fail yields fail; otherwise any unknown yields
unknown; otherwise pass. Preserve all individual rule results, reason codes, required/source
capabilities and input versions even when the overall result is fail. Every result records
head SHA, policy version, snapshot ID, evaluated/expires timestamps and a canonical digest.
Expiry is the minimum of evaluation time + policy max age and underlying required evidence
expiry. Missing evidence never passes through vacuous truth or an empty denominator.

## Policy Lifecycle and Shadow Qualification

Creating/changing rules produces a new immutable `PolicyVersion`, initially draft or
shadow. Display-name edits do not rewrite old evaluations. Only owner/admin can activate,
disable or approve actions. Analysts can inspect/propose policies but cannot activate them.
Activation binds explicit repository IDs, base branch names, rule version and allowlisted
actions (`publish_check`, `merge_pr`). Wildcard future repository enrollment is unsupported.

A new policy version must complete at least **100 distinct eligible PR-head evaluations
across at least 14 consecutive days per repository** before activation. These numbers are
Sovix product design choices, not an industry safety guarantee. Retries and duplicate heads
do not count toward 100; every scoped repository qualifies independently. A changed rule,
producer allowlist, repository scope or action scope restarts that version's qualification.
Removing repository scope does not invalidate already qualified remaining repositories.

Shadow report records pass/fail/unknown counts, coverage, latency, head-churn refusals,
false-pass/false-fail adjudications, reviewer and evidence. All shadow passes considered for
merge eligibility must be manually adjudicated by an owner/admin as consistent with known
host state; there must be zero unresolved false passes. Unknowns are visible and excluded
from pass precision, never relabelled. Qualification also requires successful seeded tests
for new-head arrival, missing checks, revocation, worker crash and emergency disable.
Low activity means continued shadow operation; v1 has no threshold override.

An admin reviews the concrete shadow report, repository IDs, producer IDs, rules, max age,
action permissions and consequences, then explicitly confirms activation using current
ETag. Missing If-Match returns 428; stale version returns 412. Activation grants only the
listed capability. It does not automatically make a GitHub check required, alter a ruleset,
or grant write permissions. Such host configuration remains a separate administrator action.

## Publication and Merge Are Separate Capabilities

`publish_check` posts a content-free summary/evidence link for one PR head. A passing policy
maps to GitHub success, fail to failure, unknown to action_required. The details link requires
normal Sovix authorization; it exposes no private report text in GitHub. Check output uses
fixed templates and counts/reason codes, never copied repository instructions.

`merge_pr` additionally requires an explicit owner/admin approval for that ActionRequest
and exact head in v1. Activating merge capability is not standing approval for every future
PR. Approval expires with the evaluation and cannot be reused after any head/policy/version
change. The UI presents repository, PR, head, base, merge method, live blockers, pinned
rules/evidence and proposed host effect. Approver identity must still have the relevant
workspace authority at execution time. The action worker also verifies host installation
access. Default merge method is squash; only a repository's supported, admin-selected method
is allowed. Branch deletion, force push and host protection edits are not implied.

When a published Sovix check is configured as required by the repository administrator, the
merge flow first publishes it, reconciles the host check ID/conclusion, then fetches host
state again. It cannot satisfy its own prerequisite rules. External required checks/reviews
and GitHub protections remain authoritative at the final merge call. Repositories whose
rulesets/merge queue cannot support this safe direct-merge flow get `unsupported_action`;
do not bypass them or silently switch merge strategies.

## Exact-Head Execution Protocol

1. Create an ActionRequest unique to `(evaluation_id, action_type)` with expected head SHA,
   chosen method and immutable policy/evidence references. HTTP request idempotency is
   scoped to principal/operation/resource plus request digest; reuse with changed content
   returns 409. Creation is not host execution.
2. Obtain current admin approval where required. In a transaction, verify active policy,
   action/repository allowlists, membership, deletion fence, credential capability and
   unexpired evaluation; create a leased/fenced action job.
3. Before every outbound mutation, reload kill-switch epoch, policy mode/version, scope,
   approval and membership. Re-fetch PR head/base/draft state, exact-head check runs,
   effective reviews, current host blockers and permissions. Required live observations
   must be no older than 30 seconds at dispatch and comply with the policy's stricter age.
4. If head differs from `expected_head_sha`, refuse with `head_changed`; do not update the
   evaluation or transfer approval. A new evaluation and approval are necessary.
5. Re-evaluate mandatory rules with live state and pinned rule version. Any fail/unknown,
   expired evidence, unsupported host capability or host access problem refuses execution.
6. Publish a check with `head_sha=expected_head_sha` and a stable `external_id` derived from
   ActionRequest ID. A head arriving during publication cannot make the old check apply to
   the new commit; retain the historical check and require a new evaluation.
7. Merge through the GitHub endpoint with its `sha` parameter set to expected head SHA.
   Never retry without it. A provider head mismatch, branch protection rejection or
   mergeability conflict is a refusal, not grounds to bypass checks.
8. Record result and provider IDs in an audited transaction only with a current lease fence.
   A timeout/disconnection is `unknown`, never success or a fresh mutation invitation.
   Reconcile host state before any subsequent attempt.

GitHub documents expected-head merge validation in the
[merge endpoint](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request). This guards
head changes atomically at the provider. Other host state may change between observation and
request; only GitHub's own required protections offer authoritative enforcement at merge.
Sovix cannot promise an atomic lock across GitHub reviews, status updates and its database.
Production activation must disclose that boundary and require host protections for any
condition the customer needs enforced atomically.

## Action States, Idempotency and Reconciliation

Action states are `pending_approval`, `queued`, `executing`, `succeeded`, `refused`, `failed`,
`unknown`, `cancelled`. Legal transitions are pending_approval→queued/cancelled,
queued→executing/refused/cancelled, executing→succeeded/refused/failed/unknown. Unknown may
become succeeded/refused/failed only after reconciliation; an operator cannot label it
successful without provider evidence. Retryable transport failures before dispatch can
requeue with the same action identity after full revalidation, bounded to three attempts.
No duplicate action row is created. Terminal states retain immutable attempt/audit history.

For check publication, reconcile by stored provider ID or stable external ID plus exact
head and app identity. Serialize action attempts; if the host exposes multiple matching
checks, preserve ambiguity and stop writes rather than multiplying them. External ID is a
correlation aid, not an assumed GitHub idempotency key. A lost create response requires a
read/reconciliation wait before any retry.

For merge, read PR merged state and provider merge SHA. If the operation completed, record
the observed outcome; do not issue a second merge. If another actor merged it, record
`already_merged_external` and attribute no mutation to Sovix. If the head changed, refuse.
If still open and dispatch outcome remains uncertain, keep unknown and require reconciliation;
do not assume lack of an immediate read result proves the request never executed.

All audit records contain actor, action, repository/PR/head identifiers, policy/evaluation
versions, approval, attempt, provider result and reason code. No prompts, tokens, error
bodies or source descriptions enter audit data. Outbox notifications are deduplicated by
action/transition; publishing a check does not send a separate unsolicited comment/message.

## Kill Switch and Failure Behavior

A workspace action kill switch and per-policy disable are owner/admin controls. Each
increments a durable action epoch, changes policy mode to disabled where applicable, blocks
new action jobs and invalidates queued approvals. Workers check the epoch at lease claim
and immediately before every write. Collector failure or unsupported mandatory evidence
returns unknown and prevents merges; ordinary analysis and shadow evaluation can continue.

Disable cancels queued requests and suppresses future writes. An already dispatched provider
request may complete and cannot be recalled; mark its state uncertain and reconcile. The
UI must state that limit. Removing host write permission is the administrator's emergency
external control. Do not delete prior checks, undo completed merges, or rewrite evidence
when disabling. Existing required host checks may consequently block merges; changing that
host rule is a separate explicit action. Re-enabling requires fresh admin confirmation,
valid qualification, new evaluations and new per-action approvals; queued work is not revived.

## Acceptance Cases

| Case | Required outcome |
|---|---|
| Policy with script/SQL/extra key/nested condition | Schema rejection before evaluation |
| Empty required-check list or own Sovix check selected | Policy validation fails |
| 99 observations or 13 days, any repository | Remains shadow; activation rejected |
| 100 observations/14 days but unresolved false pass | Activation rejected with report reason |
| Missing or skipped required check | Unknown; no merge; check conclusion action_required |
| Spoofed same-name check from different app | Unknown; never counted as trusted success |
| Complete reviews below minimum | Fail; no action authorization |
| New commit after pass or after approval | Head-changed refusal; old approval unusable |
| New commit between validation and merge | Expected-SHA host rejection; no bypass |
| Policy/version/permission revoked in queue | Refused/cancelled before host mutation |
| Worker loses lease after dispatch | Cannot publish a competing terminal state; reconciliation owns result |
| Timeout after successful merge/check creation | Unknown then reconciled once; no duplicate effect |
| Duplicate ActionRequest or idempotency key | Existing action returned; changed body yields 409 |
| Unknown collector state | Unknown; no fabricated pass |
| Required Sovix check publication pending | Merge waits for confirmed host state and revalidation |
| Kill switch before dispatch | No host mutation; queued work cancelled |
| Kill switch during in-flight request | UI acknowledges possible completion; result reconciled |
| Branch protection/merge queue rejection | Host refusal preserved; no alternative bypass path |
| Analyst/viewer attempts activation/approval | 403 in known project scope; no host token issued |
| Successful merge by another actor | Recorded as external outcome, never Sovix-authored success |
