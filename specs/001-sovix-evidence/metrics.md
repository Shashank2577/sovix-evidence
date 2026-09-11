# Metric Registry and Calculation Rules

## Common Contract

Each result contains metric ID/version, evidence kind, availability, value/unit, scope and
half-open UTC window; eligibility rule and real named inputs; source and sample counts;
collection/instrumentation/linkage completeness; exclusions; calculator/config digest;
evidence references; limitations; observed-through watermark. Display formatting is derived
from the value and unit and never used as calculation input.

Availability is `available`, `partial`, `unavailable` or `suppressed`. Unavailable/suppressed
values are null with a reason. Known zero requires an observed complete eligible population.
A metric can be measured but partial. A percentage is numeric 0–100, not 0–1. Money uses
six-decimal USD strings and rounding occurs after summation. Ratios with zero denominator
are unavailable. Do not substitute an absent token field with zero.

## Initial Canonical Registry

| Metric ID | Version / kind | Definition and boundary |
|---|---|---|
| git.commits | 1 / measured | Count unique eligible non-merge commit SHAs in window; merges separately counted |
| git.lines_added | 1 / measured | Sum additions after versioned generated/vendor/binary/path exclusions; volume, not value |
| ai.signature_commit_floor | 1 / inferred | 100 × signed eligible commits / eligible commits; detectable metadata floor only |
| ai.instrumented_sessions | 1 / measured | Count distinct observed sessions; no claim about all AI activity |
| process.recorded_review_coverage | 1 / measured | 100 × merged PRs with formal review records / collected eligible merged PRs; reviewed is not necessarily approved |
| process.approval_coverage | 1 / measured | 100 × merged PRs with a non-author approval before merge / eligible merged PRs; dismissed approval handling pinned |
| delivery.pr_cycle_hours_p50 | 1 / measured | Median merged_at − created_at for eligible merged PRs; not deployment lead time |
| delivery.first_review_hours_p50 | 1 / measured | Median first formal review time − created_at; absent reviews excluded and counted |
| quality.file_rework_21d | 1 / proxy | Preserve Receipts repeat-file-touch estimator under its versioned method; no line survival claim |
| quality.test_line_ratio | 1 / proxy | Test-path changed lines / all eligible changed lines; not executed test coverage |
| ci.failure_share | 1 / measured | Failed completed workflow attempts / eligible completed attempts; canceled/running excluded and reported |
| delivery.branch_landings_week | 1 / proxy | First-parent default-branch landings / observed weeks; not actual deployments |
| delivery.remediation_marker_share | 1 / proxy | Hotfix/revert marker matches / eligible default-branch landings; not incident rate |
| agent.tool_error_share | 1 / measured | Error tool spans / complete observed tool spans; no error text stored |
| agent.elapsed_seconds_p50 | 1 / measured | Median completed session wall time; interrupted sessions excluded and counted |
| agent.tokens_input | 1 / measured | Sum canonical owner input-token quantities under runtime-specific cache accounting |
| agent.tokens_output | 1 / measured | Sum canonical owner output-token quantities; child-inclusive parents count once |
| cost.estimated_equivalent_usd | 1 / measured | Deterministic rate-card calculation over observed canonical units; estimated financial meaning, not billed expenditure |
| cost.attributed_pr_usd | 1 / measured | Sum verified allocated estimate amounts for the selected PR cohort, one allocation version |
| cost.estimated_per_merged_pr_usd | 1 / measured | Attributed estimate for eligible merged cohort / distinct eligible merged PRs; disclose unpriced/unallocated amounts |
| cost.unallocated_usd | 1 / measured | Sum explicit unallocated estimate rows; research is not automatically wasted work |
| evidence.session_link_coverage | 1 / measured | Observed sessions with ≥1 verified change/PR link / all observed sessions in declared cohort |
| production.deployments_week | 1 / measured | Successful production deployment IDs / observed weeks; only actual source records |
| production.change_failure_share | 1 / measured | Successful production deployments with verified incident links / successful production deployments; partial if linkage unknown |
| production.recovery_hours_p50 | 1 / measured | Median recovered_at − impact_started_at for verified incidents with both instants; detection-based duration separately named |
| people.active_contributors | 1 / measured | Distinct resolved non-bot contributors; internal resolution then aggregate disclosure controls |
| specs.valid_spec_count | 1 / proxy | Content-qualified specification documents under exclusion/version rules; quantity is not quality |

Other existing metrics retain `legacy.receipts.*` or `legacy.sovix.*` IDs with original
version/meaning until a reviewed canonical mapping exists. No blind rename of a legacy ID
with changed semantics. README metric counts are never the registry authority.

## Cohorts and Windows

PR throughput/cycle cohorts use merged_at inside `[start,end)`. Session workload uses
session started_at; cost-attributed PR cohort includes contributing usage outside the PR's
merge window and says so. Calendar usage spend uses usage event time instead. These views
must never share an unlabeled denominator. Rework requires additions at least 21 days before
the observation watermark for a mature comparison; immature additions are separately counted.

Ratios reaggregate numerator/denominator from deduplicated records. Percentiles recompute
from the union distribution. Overlapping project repositories are counted once in workspace
rollups. Imported summary-only legacy reports allow their original scopes/windows; arbitrary
reaggregation is unavailable until source records are collected. A changed cohort rule yields
a new definition version. No automatic causal/ROI language is allowed in comparisons.

## Pricing and Allocation

PriceVersion states model identifier, effective interval, unit size, input/output/cache rates
and whether input includes cached tokens. For inclusive input, billable uncached input is
`input − cache_read − cache_write` only when all fields are known under that runtime's
semantics; otherwise price only supported categories and mark partial. Negative derived
quantities quarantine the unit. Unknown cache fields are not invented.

Cost unit U with amount C is allocated with integer weights summing 1,000,000 parts per
million. Amounts use Decimal; rounding remainder goes to unallocated. Default attribution
is conservative: a unit with one verified PR receives 100%; with multiple verified PRs it
remains unallocated until explicit weights are supplied. UI may suggest equal weights but
cannot silently apply them. Weights and supporting link versions are immutable. A new
price or mapping creates a new version; snapshots pin exactly one. Known prices and
unpriced token quantities are visible together. Subscription/billed allocation is a separate
measure, never added to equivalent token cost.

## Findings

Rule versions select at most three prioritized findings per overview. Each includes metric,
scope, comparison if valid, source link, uncertainty and proposed investigation. Example:
“Low recorded review coverage in the collected sample,” not “Most code reached production
unreviewed.” Thresholds are configurable policy conventions, not universal performance
standards. Generated narratives can paraphrase findings with citations but cannot create
new metric values, person rankings or unsupported causal statements.

## Canonical Verification

Normalize all timestamps to UTC; sort object keys and evidence-reference sets; retain array
order where meaningful; use UTF-8 and stable decimal strings; hash schema version + normalized
inputs + calculator version + scope/window + configuration. Hashes exclude collection run
IDs and created_at. Export manifests separately record those operational timestamps. JSON
canonicalization follows RFC 8785 for supported primitive data; decimals are strings.
