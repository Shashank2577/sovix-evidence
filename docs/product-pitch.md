# Sovix Evidence

## The problem

Engineering leaders can see commits, pull requests, agent traces, token counters and production
events, but those records live in separate tools and answer different questions. A repository
report can describe what changed without showing the agent workflow behind it. Agent telemetry
can show sessions and tokens without proving which change shipped. A polished dashboard can make
incomplete collection, a proxy, or an uncertain link look more conclusive than it is.

That leaves a practical reporting gap: teams cannot easily explain what was observed, how a
number was calculated, what it cost under a declared rate card, what reached production, and
where the evidence is missing. Client-facing teams face the same gap repeatedly when preparing
project reviews.

## Target customer

The initial customer hypothesis is an engineering leader, consultancy lead or delivery manager
responsible for several product or client repositories. They already use GitHub and may use an AI
coding agent. They need repeatable project evidence for review and spending decisions, and they
care more about inspectable calculations and access boundaries than an employee score.

Developers and analysts use the investigation view to inspect arithmetic, source records and
coverage. Authorized clients use restricted aggregate snapshots. Operators see service health
without seeing customer report content. Public repository discovery serves a separate developer
audience and remains isolated from private workspaces.

## Thirty-second pitch

Sovix Evidence turns repository history, saved Sovix and Receipts reports, optional coding-agent
telemetry, and real deployment and incident records into a project report with a source behind
every number. Start offline with Git, then add private team reporting, workflow and estimated-cost
evidence, and production context as those sources become available. Every metric states its
window, population, coverage, limitations and calculation version, so a lead can move from a
finding to its arithmetic and evidence instead of trusting a black-box score.

## What the combined product delivers

Sovix CLI provides the low-friction offline entry point and historical scan. Receipts contributes
the evidence-first report structure and established engineering metric concepts. RepoRadar adds
an optional public discovery surface for public repositories. Dash0-compatible OTLP metadata adds
visibility into instrumented coding-agent sessions, tool errors and supported token categories;
the platform does not depend on an undocumented Darkplane export API.

Together, these parts support a progressive evidence chain:

1. Scan local Git or import a supported saved report to establish a reproducible baseline.
2. Open any finding to inspect the definition, arithmetic, exclusions, coverage and pinned source
   revisions; export the same explanation as a self-contained report.
3. In a private workspace, connect selected repositories and optionally ingest redacted agent
   metadata. Verify session-to-change links before they enter exact attribution totals.
4. Allocate versioned equivalent cost to verified pull requests while preserving unpriced and
   unallocated amounts, with exact conservation for every canonical usage unit.
5. Add actual deployment and incident records to distinguish merged changes and Git proxies from
   observed production outcomes.
6. After measured shadow evaluation and explicit activation, publish a narrow check or request a
   guarded merge against the current pull-request head.

The working promise is: **Know what AI-assisted engineering delivers, with a verifiable source
behind every number.**

## Product boundaries

The first release does not claim exact AI authorship, developer productivity, causal uplift,
accounting-grade spend or automatic incident causation. A detectable signature is a floor. Git
landings and rework indicators remain labelled proxies. Time proximity creates a candidate link,
not verified attribution. Estimated token-equivalent cost stays separate from invoices,
subscriptions and billed allocations. Missing or unsupported data is unavailable or partial;
it is never silently converted to zero.

Standard outputs contain aggregates and exclude raw prompts, source bodies, tool input/output and
individual rankings. Hosted people breakdowns suppress cohorts smaller than five and the
complementary slices that could reveal them. Public discovery has separate credentials, storage
and indexes, and never reads private workspace data.

Policy evaluation begins disabled or in shadow mode. Any later host action is separately scoped,
approved, idempotent and revalidated against the current head, permissions, required checks,
reviews and evidence freshness. GitHub protections remain authoritative. Production deployment
automation, arbitrary code execution, billing checkout, email delivery and native mobile apps are
outside the specified first program.

## Staged rollout

The MVP is the M1 offline evidence report, built on the M0 contracts and security foundation. A
user installs the CLI, scans a reference repository or imports a supported saved artifact, and
gets deterministic metrics, explicit coverage, evidence drill-down and a portable offline export.
It requires no account, telemetry or network during report generation.

The next pilot stage adds hosted workspaces, project access, GitHub repository selection, redacted
agent telemetry and conservative cost linkage. Reporting operations then add saved definitions,
schedules, an in-product inbox, investigations, quotas, retention, deletion and restore drills.
Production correlations and policy controls follow only after exact deployment/incident sources
and shadow evidence are available. RepoRadar-style public discovery ships independently after
public/private isolation is demonstrated.

Each stage has a usable boundary and a reason to stop. A customer can use the offline report
without telemetry, hosted reporting without merge actions, and production evidence without public
discovery. This keeps higher-risk capabilities dependent on evidence and operational controls
already established in earlier stages.

## Demo narrative

Open with a repository the audience recognizes as a project rather than a telemetry stream. Run a
fixed-window offline scan and open the resulting leadership view. The first finding shows recorded
review coverage: 28 of 189 eligible merged pull requests, displayed as 14.8%. Open “Explain” to
show the denominator, exclusions, source references, collection boundaries and canonical digest.
Switch to coverage and point out an unavailable deployment measure rather than a fabricated zero.
Disconnect the network and open the exported report to demonstrate that the same values and
evidence remain available.

Then open the private pilot workspace. Show an instrumented session with supported token units and
normalized tool errors, while the forbidden prompt and error text never enter the report. Follow
a verified session/change link to a USD 10.000000 equivalent-cost unit allocated USD 6.000000 and
USD 4.000000 across two pull requests. Show the explicit unallocated row and an unpriced usage
bucket, then replay the telemetry to demonstrate that the total does not double.

Add a deployment at an exact revision and a verified incident association. The production measure
now becomes available from actual source records while a time-proximate incident remains a
candidate. Finish with a policy in shadow mode: a passing evaluation tied to head H1 refuses action
after H2 arrives. The demo closes on the investigation created from the original finding, with an
owner, due date and next measurement date.

## How data is presented

Every metric carries its evidence kind (`measured`, `proxy` or `inferred`) separately from its
availability (`available`, `partial`, `unavailable` or `suppressed`). It also carries scope,
half-open window, timezone, observed-through watermark, eligibility, inputs, exclusions, sample
counts, collection/instrumentation/linkage coverage, calculator and configuration digests,
evidence references and limitations.

Leadership view presents at most three prioritized findings. Investigation view presents the
arithmetic and evidence. Coverage view presents collection, instrumentation, linkage and maturity
gaps. All three read the same immutable snapshot. Rates show numerator and denominator; cohort
comparisons show both sample sizes, task mix, coverage and maturity; cost shows currency, price
version, basis, unpriced units and unallocated remainder. Charts always have accessible tables,
and status is never encoded by color alone.

This structure is part of the product value: uncertainty stays attached to the number at the
moment a user makes a decision, instead of being buried in a general disclaimer.

## Commercial hypotheses to test

The commercial model is intentionally a set of pilot hypotheses rather than established demand.

- Project and client reporting may be a stronger entry point than generic AI cost analytics
  because it begins with an existing recurring management task.
- Teams may pay for a private workspace when it shortens evidence gathering for project reviews
  and makes calculations defensible to clients or executives.
- Repository count, retained evidence volume, report frequency and accepted telemetry volume are
  candidate entitlement dimensions. The pilot should measure which one customers understand and
  which one tracks delivered value without discouraging useful instrumentation.
- Guarded policy actions may justify a higher tier after teams trust the reporting and complete
  shadow qualification. They should not be bundled into the first buying decision.
- Public discovery may lower acquisition cost for the private product, but it must be evaluated as
  a separate funnel with no assumed conversion or data-sharing benefit.

The first business validation target is modest and observable: after real use by three willing
teams, at least two should be able to document a concrete review-process or tool-spend decision
informed by a report. The pilot should also record setup time, repeat report usage, which evidence
was opened, the decision made, willingness to continue, and objections. Interest, dashboard views
and positive feedback alone do not count as the decision outcome, and this target is not evidence
of demand until the pilot produces it.
