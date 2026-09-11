# UX Specification

## Experience Principles

The interface makes evidence inspectable before it makes it impressive. Every number keeps
its evidence kind, availability, window, scope and freshness close enough to understand
without opening documentation. Labels use the domain terms measured, proxy, inferred,
partial, unavailable and suppressed. A zero is shown only for a known observed zero.

The visual foundation inherits the restrained Receipts style: page background `#fbfbfc`,
primary text `#16181d`, action/focus color `#3d4fd7`, system font stack
`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
Body text is 16px/1.5, metadata 14px/1.4 and tabular numerals use `font-variant-numeric:
tabular-nums`. The spacing unit is 4px; standard gaps are 8, 12, 16, 24 and 32px. Borders
use a neutral color with at least 3:1 contrast against adjacent surfaces; text and controls
meet WCAG 2.2 AA. Status never depends on color or icon alone.

## Information Architecture and Routes

Hosted routes are workspace scoped. Local mode presents the same project/report hierarchy
under `/local` and omits sign-in, membership and hosted connector administration.

| Route | Purpose | Primary roles |
|---|---|---|
| `/sign-in`, `/session` | OIDC entry, session details and sign-out | All hosted users |
| `/w/{workspace}/projects` | Authorized project list, source health and latest snapshot | Owner, admin, analyst, viewer |
| `/w/{workspace}/projects/{project}` | Leadership overview and view switcher | All granted roles |
| `/w/{workspace}/projects/{project}/coverage` | Collection, instrumentation, linkage and maturity coverage | All granted roles |
| `/w/{workspace}/projects/{project}/investigate` | Findings, candidate links and investigation queue | Owner, admin, analyst; viewer read-only |
| `/w/{workspace}/reports` | Definitions, generation jobs, schedules and snapshot inbox | Owner, admin, analyst; viewer sees authorized snapshots |
| `/w/{workspace}/reports/{snapshot}` | Immutable report with overview, evidence and manifest | All granted roles |
| `/w/{workspace}/reports/{snapshot}/metrics/{metric}` | Metric arithmetic and evidence drill-down | All granted roles, sanitized for viewer |
| `/w/{workspace}/investigations/{id}` | Finding follow-up history, assignee and resolution | Owner, admin, analyst; viewer read-only |
| `/w/{workspace}/sources` | Repositories, connectors, collectors and freshness | Owner, admin; analyst reads granted source health |
| `/w/{workspace}/jobs/{id}` | Progress, attempts, safe errors and cancellation | Creator or owner/admin in scope |
| `/w/{workspace}/settings/{members,retention,quotas,audit}` | Access and lifecycle administration | Owner/admin according to authorization matrix |
| `/radar`, `/radar/{owner}/{repo}` | Isolated public search, profile and local watchlist | Public; no private workspace navigation |

An inaccessible workspace, project, snapshot, job or export returns the same not-found page;
the page does not reveal that an identifier exists. Navigation only lists resources the
current principal can access. Changing project, repository or window updates the URL so the
view is bookmarkable. Opening a metric and returning restores those filters and scroll focus.

## Role Views

- **Owner** sees all projects, membership, ownership transfer, connectors, retention,
  deletion, quotas, audit, policy activation and report workflows.
- **Admin** sees the same operational surfaces except last-owner removal/transfer. Destructive
  project deletion states its project scope, irreversibility and downloaded-export limit.
- **Analyst** sees granted projects, raw permitted evidence, definitions, generation,
  investigations and link/allocation adjudication. Member, connector, retention and policy
  activation controls are absent rather than disabled.
- **Viewer** sees authorized aggregate snapshots, coverage, sanitized evidence and existing
  downloads. Editing and identity-level controls are absent. Suppression is never relaxed.
- **Operator** uses a separate operational surface containing health, rates, safe codes and
  counts only; report values, source text and customer payloads are unavailable.
- **Local user** has single-owner capabilities for local scan, import, reports and exports;
  hosted identity, membership, scheduling and remote collector controls are not presented.

## Report Structure

Each report has a persistent header with project/repository scope, half-open window, display
timezone, observed-through watermark, snapshot state and generation time. Its sections are:

1. **Overview**: at most three rule-derived findings, a compact metric set and explicit
   coverage callouts. Each finding links to one metric and proposes an investigation.
2. **Delivery and process**: reviews, cycle time, branch landings and actual production
   outcomes when available. Git release proxies never occupy the visual slot for deployments.
3. **Agent and cost**: observed sessions, supported token categories, equivalent cost,
   attributed and unallocated amounts, price version and linkage coverage.
4. **Quality signals**: rework and test-path proxies, maturity and exclusions.
5. **Coverage and limitations**: source success/failure, pagination, instrumentation,
   unsupported fields, immature records and unavailable measures.
6. **Evidence and verification**: metric definitions, pinned revision references, calculator
   and configuration digests, allocation versions and downloadable manifest.
7. **Investigations**: follow-up history anchored to the immutable source snapshot.

Leadership view prioritizes findings and trends; investigation view prioritizes arithmetic,
links and source records; coverage view prioritizes collection boundaries. They use the same
snapshot and filters and therefore cannot disagree about values.

## Evidence Drill-down

A metric opens within three interactions from its finding. The detail page shows, in order:
definition and version; displayed value and unit; measured/proxy/inferred badge; availability;
scope, window and timezone; numerator/denominator or ordered percentile population; eligibility
and exclusions; source/sample counts; collection, instrumentation and linkage coverage;
observed-through watermark; limitations; then paginated evidence references. Candidate links
are visually and textually separate from verified links and excluded from verified totals.

Evidence rows show only allowlisted fields and link to the authorized source when available.
An expired or revoked source remains as an unavailable reference with a reason code. The
verification panel exposes normalized inputs and digests, but never credentials, source
bodies, prompts, names, emails, tool I/O or local paths. Viewer drill-down uses sanitized
aggregate records; export rendering applies the same authorization and suppression policy.

## Visualization Rules

- Metric cards include unit, availability, evidence kind, window and a direct “Explain” link.
- Time series use the snapshot timezone, label DST offset changes and never bridge missing
  intervals. Partial intervals use a pattern plus text; suppressed points have no plotted value.
- Rates show numerator and denominator beside the percentage. A 0/0 population renders
  “Unavailable — no eligible records,” not 0%.
- Cohort comparisons show both sample sizes, task mix, coverage and maturity. No causal arrow,
  productivity score or ROI language is generated.
- Medians and percentiles derive from union populations. Imported summary-only values cannot
  be plotted at a finer grain or rolled into incompatible scopes.
- Cost charts use exact decimal display, distinguish equivalent estimates from billed values,
  and always include unpriced usage and unallocated remainder.
- Tables are the accessible source for every chart. Chart descriptions state the main encoded
  dimensions and the missing/partial/suppressed regions without manufacturing a conclusion.

## Unified State Language

| State | Required presentation and action |
|---|---|
| Empty | State what has no records, name the selected scope/window and offer the permitted next action: scan, import, connect, widen window or return. Never seed example data into the result. |
| Loading | Preserve page geometry with labelled skeletons; expose progress for jobs, allow navigation away and announce state changes politely. A loading value is never temporarily shown as zero. |
| Error | Show stable safe code, affected source/step, whether any prior snapshot remains usable, and retry/remediation. Do not display payload excerpts or stack traces. |
| Partial | Show the computed value plus a persistent partial badge, missing sources/counts, observed-through watermark and impact on interpretation. |
| Stale | Show “Observed through {time} {timezone},” expected refresh cadence, stale reason and refresh action. Stale snapshots remain immutable; refresh creates a new snapshot. |
| Unavailable | Show a null value, exact reason and required capability/evidence. Keep it distinct from collection failure and known zero. |
| Suppressed | Show “Suppressed for privacy,” policy basis (`k<5` or complementary suppression) and no value, chart position, tooltip leak or downloadable cell. |
| Revoked/deleted | Replace report content with scope-neutral unavailability and a support-safe reference. Existing browser caches must not reveal content after reauthorization fails. |

Source health uses healthy, delayed, degraded, revoked and disabled labels. Job status follows
the domain state machine verbatim. A partially succeeded job lists successful and failed
subsets; it is never presented as a generic success.

## Responsive and Accessible Behavior

The application works at 360px without page-level horizontal overflow. Below 768px, the
sidebar becomes a labelled modal navigation, report sections stack in reading order, metric
cards become one column and comparison controls remain above their results. Wide evidence
tables live in a focusable, labelled scroll region and offer a stacked row view; key identity,
value and status columns remain visible. At 768–1199px use a two-column report grid; at 1200px
and above use a 12-column grid with a maximum readable content width of 1440px.

All functions are keyboard operable with visible `#3d4fd7` focus rings at least 2px thick
with 2px offset. Skip links reach navigation, filters and report content. Focus moves to the
new page heading after navigation, to the error summary after failed submission, and back to
the invoking control when a dialog closes. Dialogs trap focus and support Escape unless an
irreversible submission is actively committing. Controls have programmatic names; headings
remain hierarchical; status updates use restrained live regions. Charts have text summaries
and equivalent tables. Motion is limited to 150ms state transitions and removed under
`prefers-reduced-motion`. Offline exports embed fonts only by using the system stack and
require no remote scripts, styles or assets.

## UX Acceptance

- The reference finding reaches its arithmetic and evidence in three or fewer interactions.
- Available, partial, unavailable and suppressed fixtures render the same semantics in the
  console, offline HTML and manifest; suppressed values cannot be inferred from complements.
- Owner, admin, analyst and viewer route matrices pass direct-URL and back-button tests.
- At 360px, all journeys complete without page overflow; table regions remain labelled and
  operable. Automated axe checks and keyboard-only review find no WCAG 2.2 AA blockers.
- Refresh, late evidence and source revocation never mutate an old snapshot or lose filters.
- The complete offline report works with networking disabled and contains no remote resource.
