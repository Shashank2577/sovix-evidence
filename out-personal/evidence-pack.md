# Engineering evidence pack — All repositories

*Org scope · generated 2026-09-14T16:32:16 UTC*

Every figure below is followed by the arithmetic that produced it, what was counted, what was deliberately left out, and links to the specific records it came from. Numbers you disagree with should be checkable here without this tool.

## What was examined

| | |
|---|---|
| Scope | All repositories (org) |
| Repositories | 74: Shashank2577/Awesome-BI, Shashank2577/Awesome-managed-agent, Shashank2577/GrowthOS, Shashank2577/JavaRAG, Shashank2577/LOAN-MUDRA, Shashank2577/Marketing, Shashank2577/NCRT_AI, Shashank2577/Nexus-BE … |
| Period observed | 2024-01-02 to 2026-09-14 (140.9 weeks) |
| Commits | 8,111 (plus 558 merge commits, excluded) |
| Lines counted | 6,208,167 added, 1,704,343 removed |
| Pull requests | 772 seen, 679 merged, 32 reviews recorded |
| Contributors | 80 (bots excluded) |

## Findings

### [Needs attention now] Most changes reach production without a review

**0.0%** — Of the changes that went into the product through a pull request, how many had at least one colleague formally look at them and record an opinion. Here it is 0.0%. The strongest single piece of evidence: Shashank2577/prompture #1 “Auth: Clerk + real CLI tokens; stub cleanup (9 packages)” — 25,124 lines merged with no review.

*What to do:* Turn on branch protection requiring one approving review on the affected repositories. This is a settings change, not a process programme.

*Evidence:* see `process.review_coverage` below.

### [Needs attention now] Authors are merging their own changes

**100.0%** — How often the person who wrote a change was also the person who pressed the button to put it into the product, with nobody else involved in between. Here it is 100.0%. The strongest single piece of evidence: Shashank2577/prompture #1 — 25,124 lines, written and merged by Shashank2577, no review.

*What to do:* Require a non-author approval before merge. Until then, treat the review metrics in this report as describing intent rather than practice.

*Evidence:* see `process.self_merge_share` below.

### [Needs attention now] New code is arriving with almost no tests

**0.0%** — Of every hundred lines of code written, how many were automated tests — code whose only job is to check that the rest of the code still works. Here it is 0.0%. The strongest single piece of evidence: Shashank2577/sovix-ai-brain: only 0.0% of 5,962 new lines are tests.

*What to do:* Agree a minimum test expectation for new work and make it visible in review. Start with the repositories named in the evidence rather than org-wide.

*Evidence:* see `quality.test_line_ratio` below.

### [Worth investigating] AI-assisted work is arriving with fewer tests than the rest

**-10.9%** — Whether changes carrying an AI signature include proportionally more or fewer tests than other changes. Here it is -10.9%. The strongest single piece of evidence: Shashank2577/spreix-platform 4c59cfe8 — 2,849 AI-traced product lines, no tests.

*What to do:* This is a workflow gap rather than a tooling limit — these tools write tests well when asked. Add it to the team's prompt conventions.

*Evidence:* see `ai.test_ratio_delta` below.

### [Worth investigating] Automated checks fail more often than they pass cleanly

**87.8%** — Every time someone proposes a change, an automated set of checks runs against it. Here it is 87.8%. The strongest single piece of evidence: “CI” fails 100% of the time (123 of 123 runs).

*What to do:* Stabilise or delete the flakiest workflows named in the evidence. A check nobody believes provides no protection.

*Evidence:* see `ci.failure_rate` below.

### [Worth investigating] Most open changes have been abandoned

**100.0%** — Of the changes currently waiting, how many have had no activity at all for more than a month. Here it is 100.0%. The strongest single piece of evidence: Shashank2577/spreix-notetaker #1 “refactor: SOLID principles, design pattern, and code qualit…” — untouched for 112 days.

*What to do:* Close what is not going to ship, so the queue reflects real work in progress.

*Evidence:* see `delivery.stale_pr_share` below.

### [Worth investigating] Half the code sits with one person

**1** — The smallest number of people who between them wrote half of all the code here. Here it is 1. The strongest single piece of evidence: Shashank2577 wrote 3,864 lines (56.7%) — running total 56.7%.

*What to do:* Pair a second engineer onto the files named in the evidence. This is a finite list, not an open-ended documentation project.

*Evidence:* see `people.bus_factor` below.

### [Worth investigating] A quarter of releases bypassed pull requests entirely

**100.0%** — How much work reached the main branch without going through the pull request process at all — pushed straight onto the branch the product is built from. Here it is 100.0%. The strongest single piece of evidence: Shashank2577/sovix-ai-brain 4803fc1d “brain: weekly review 2026-09-14” — 828 lines with no pull request.

*What to do:* Enable branch protection on the default branch. Verify the named commits first — squash merges can produce this pattern legitimately.

*Evidence:* see `process.direct_push_share` below.

### [Worth investigating] A third of changes are too large to review properly

**50.0%** — The share of proposed changes bigger than 400 lines — the size past which review research consistently shows reviewers stop finding defects and start skimming. Here it is 50.0%. The strongest single piece of evidence: Shashank2577/prompture #1 “Auth: Clerk + real CLI tokens; stub cleanup (9 packages)” — 25,124 lines, merged with no review.

*What to do:* Set an expectation for change size. Large changes are the mechanism by which review quietly stops working.

*Evidence:* see `quality.large_change_share` below.

### [Worth investigating] A quarter of new code is being rewritten within three weeks

**40.1%** — Of all the code written in this period, this share was changed again or deleted within three weeks of being written. Here it is 40.1%. The strongest single piece of evidence: workflow_editor.tsx: 2,551 lines written on 01 Jul 2026 were rewritten 10 days later.

*What to do:* Look upstream at how work is specified before it starts. The named files show where the thrash is concentrated.

*Evidence:* see `quality.rework_rate` below.

## Every metric, with its evidence

### Delivery flow

*How quickly work moves from a developer's machine into the product, and how reliably it stays there. The industry shorthand for this family is DORA.*

#### Median time from ready to shipped: **6 min**

`delivery.lead_time_p50` · confidence **high** · measured (counted directly from records)

**What this means.** Once a developer says 'my change is ready', this is how long it typically waits before it becomes part of the product. Half of all changes are faster than this, half slower.

**Why it matters.** This is the clearest single measure of how responsive engineering is to a request. A commitment made to a customer on Monday can only ship as fast as this number allows, and a long wait almost always means people are blocked on each other rather than working.

**How to read it.** Under a day is strong. Several days means review has become a bottleneck. But a figure measured in minutes is also a warning, not a win: it usually means nobody is reviewing. Always read this next to review coverage.

**How it was calculated.** `median(merged_at - created_at) over 679 merged pull requests = 0.1 hours`

**Sample.** 679 of 772 pull requests (87.95% coverage).

Excluded from this metric:

- open pull requests (not yet merged, so no lead time exists) — 28
- pull requests closed without merging (never shipped, so no lead time exists) — 65
- pull requests beyond the collection window in 1 repository/-ies

**Assumptions.**

- A pull request counts as 'ready' the moment it is opened. Teams that open drafts early to share progress will look slower here than they really are.

**Caveats.**

- Pull requests are fetched newest-first up to the configured page limit, so on very busy repositories the oldest pull requests can fall outside the collected window. The sample figures on this metric state exactly how many were read.
- Computed over 679 of 772 pull requests (88% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/prompture #8 “fix(dashboard): align profile/projects/analytics with captu…” waited 20.2 days to merge** (484 hours open)
   This is the single slowest merge in scope. It is what the typical figure is built from, and removing it would move the number — so it is the concrete case to examine first.
   Record: [#8](https://github.com/Shashank2577/prompture/pull/8) — open 20.2 days before merging

2. **Shashank2577/spreix-boat #3 “ci(x): add CI quality gate for apps/x and sync contributor …” waited 3.7 days to merge** (89 hours open)
   This is the second slowest merge in scope. It is what the typical figure is built from, and removing it would move the number — so it is the concrete case to examine first.
   Record: [#3](https://github.com/Shashank2577/spreix-boat/pull/3) — open 3.7 days before merging

3. **Shashank2577/Awesome-BI #1 “feat: Implement reporting orchestration backend, frontend, …” waited 3.4 days to merge** (81 hours open)
   This is the third slowest merge in scope. It is what the typical figure is built from, and removing it would move the number — so it is the concrete case to examine first.
   Record: [#1](https://github.com/Shashank2577/Awesome-BI/pull/1) — open 3.4 days before merging

4. **Shashank2577/ai-sdlc #248 “fix: adding two roles broke the dashboards build and made t…” waited 41.3 hours to merge** (41 hours open)
   This is the fourth slowest merge in scope. It is what the typical figure is built from, and removing it would move the number — so it is the concrete case to examine first.
   Record: [#248](https://github.com/Shashank2577/ai-sdlc/pull/248) — open 41.3 hours before merging

5. **Shashank2577/spreix-platform #85 “feat(agents): spend caps + auto-pause guards (P5-T08)” waited 40.9 hours to merge** (41 hours open)
   This is the fifth slowest merge in scope. It is what the typical figure is built from, and removing it would move the number — so it is the concrete case to examine first.
   Record: [#85](https://github.com/Shashank2577/spreix-platform/pull/85) — open 40.9 hours before merging

**Underlying records (12 shown).**

- Shashank2577/prompture [#8](https://github.com/Shashank2577/prompture/pull/8) — merged after 20.2 days
- Shashank2577/spreix-boat [#3](https://github.com/Shashank2577/spreix-boat/pull/3) — merged after 3.7 days
- Shashank2577/Awesome-BI [#1](https://github.com/Shashank2577/Awesome-BI/pull/1) — merged after 3.4 days
- Shashank2577/ai-sdlc [#248](https://github.com/Shashank2577/ai-sdlc/pull/248) — merged after 41.3 hours
- Shashank2577/spreix-platform [#85](https://github.com/Shashank2577/spreix-platform/pull/85) — merged after 40.9 hours
- Shashank2577/spreix-platform [#84](https://github.com/Shashank2577/spreix-platform/pull/84) — merged after 40.8 hours
- Shashank2577/spreix-platform [#81](https://github.com/Shashank2577/spreix-platform/pull/81) — merged after 33.7 hours
- Shashank2577/spreix-platform [#60](https://github.com/Shashank2577/spreix-platform/pull/60) — merged after 25.0 hours
- Shashank2577/ai-sdlc [#188](https://github.com/Shashank2577/ai-sdlc/pull/188) — merged after 23.6 hours
- Shashank2577/ai-sdlc [#189](https://github.com/Shashank2577/ai-sdlc/pull/189) — merged after 23.5 hours
- Shashank2577/ai-sdlc [#195](https://github.com/Shashank2577/ai-sdlc/pull/195) — merged after 23.0 hours
- Shashank2577/ai-sdlc [#196](https://github.com/Shashank2577/ai-sdlc/pull/196) — merged after 23.0 hours

---

#### Slowest tenth of changes take at least: **7.2 h**

`delivery.lead_time_p90` · confidence **high** · measured (counted directly from records)

**What this means.** Nine out of ten changes reach the product faster than this. The remaining one in ten takes at least this long. It describes the bad weeks rather than the typical day.

**Why it matters.** Teams get judged on their worst delivery, not their median. This is the number a stakeholder remembers when something 'took forever', and it is where unclear ownership and stalled reviews actually show up.

**How to read it.** Compare it against the median. If the slowest tenth takes ten times the median, the process is unpredictable even when the average looks healthy — and unpredictability is harder to plan around than slowness.

**How it was calculated.** `90th percentile(merged_at - created_at) over 679 merged pull requests = 7.2 hours`

**Sample.** 679 of 772 pull requests (87.95% coverage).

Excluded from this metric:

- open pull requests (not yet merged, so no lead time exists) — 28
- pull requests closed without merging (never shipped, so no lead time exists) — 65
- pull requests beyond the collection window in 1 repository/-ies

**Caveats.**

- Pull requests are fetched newest-first up to the configured page limit, so on very busy repositories the oldest pull requests can fall outside the collected window. The sample figures on this metric state exactly how many were read.
- Computed over 679 of 772 pull requests (88% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/prompture #8 “fix(dashboard): align profile/projects/analytics with captu…” waited 20.2 days to merge** (484 hours open)
   This is the single slowest merge in scope. It is what the slowest tenth of figure is built from, and removing it would move the number — so it is the concrete case to examine first.
   Record: [#8](https://github.com/Shashank2577/prompture/pull/8) — open 20.2 days before merging

2. **Shashank2577/spreix-boat #3 “ci(x): add CI quality gate for apps/x and sync contributor …” waited 3.7 days to merge** (89 hours open)
   This is the second slowest merge in scope. It is what the slowest tenth of figure is built from, and removing it would move the number — so it is the concrete case to examine first.
   Record: [#3](https://github.com/Shashank2577/spreix-boat/pull/3) — open 3.7 days before merging

3. **Shashank2577/Awesome-BI #1 “feat: Implement reporting orchestration backend, frontend, …” waited 3.4 days to merge** (81 hours open)
   This is the third slowest merge in scope. It is what the slowest tenth of figure is built from, and removing it would move the number — so it is the concrete case to examine first.
   Record: [#1](https://github.com/Shashank2577/Awesome-BI/pull/1) — open 3.4 days before merging

4. **Shashank2577/ai-sdlc #248 “fix: adding two roles broke the dashboards build and made t…” waited 41.3 hours to merge** (41 hours open)
   This is the fourth slowest merge in scope. It is what the slowest tenth of figure is built from, and removing it would move the number — so it is the concrete case to examine first.
   Record: [#248](https://github.com/Shashank2577/ai-sdlc/pull/248) — open 41.3 hours before merging

5. **Shashank2577/spreix-platform #85 “feat(agents): spend caps + auto-pause guards (P5-T08)” waited 40.9 hours to merge** (41 hours open)
   This is the fifth slowest merge in scope. It is what the slowest tenth of figure is built from, and removing it would move the number — so it is the concrete case to examine first.
   Record: [#85](https://github.com/Shashank2577/spreix-platform/pull/85) — open 40.9 hours before merging

**Underlying records (12 shown).**

- Shashank2577/prompture [#8](https://github.com/Shashank2577/prompture/pull/8) — merged after 20.2 days
- Shashank2577/spreix-boat [#3](https://github.com/Shashank2577/spreix-boat/pull/3) — merged after 3.7 days
- Shashank2577/Awesome-BI [#1](https://github.com/Shashank2577/Awesome-BI/pull/1) — merged after 3.4 days
- Shashank2577/ai-sdlc [#248](https://github.com/Shashank2577/ai-sdlc/pull/248) — merged after 41.3 hours
- Shashank2577/spreix-platform [#85](https://github.com/Shashank2577/spreix-platform/pull/85) — merged after 40.9 hours
- Shashank2577/spreix-platform [#84](https://github.com/Shashank2577/spreix-platform/pull/84) — merged after 40.8 hours
- Shashank2577/spreix-platform [#81](https://github.com/Shashank2577/spreix-platform/pull/81) — merged after 33.7 hours
- Shashank2577/spreix-platform [#60](https://github.com/Shashank2577/spreix-platform/pull/60) — merged after 25.0 hours
- Shashank2577/ai-sdlc [#188](https://github.com/Shashank2577/ai-sdlc/pull/188) — merged after 23.6 hours
- Shashank2577/ai-sdlc [#189](https://github.com/Shashank2577/ai-sdlc/pull/189) — merged after 23.5 hours
- Shashank2577/ai-sdlc [#195](https://github.com/Shashank2577/ai-sdlc/pull/195) — merged after 23.0 hours
- Shashank2577/ai-sdlc [#196](https://github.com/Shashank2577/ai-sdlc/pull/196) — merged after 23.0 hours

---

#### Median wait for the first human review: **6 min**

`delivery.time_to_first_review_p50` · confidence **high** · measured (counted directly from records)

**What this means.** How long a finished change sits untouched before a colleague looks at it. This is pure waiting: the work is complete, and nothing is happening to it.

**Why it matters.** This is usually the largest single removable delay in software delivery, and fixing it costs nothing but attention. It is also the part of the wait developers find most demoralising, precisely because the work is finished and idle.

**How to read it.** Under four working hours is healthy. Over a day means reviewing is nobody's priority. 'Not available' means no reviews were recorded at all — which is itself the finding, and a more serious one than a slow number.

**How it was calculated.** `median(first_review_at - created_at) over 11 reviewed pull requests = 0.1 hours`

**Sample.** 11 of 772 pull requests (1.42% coverage).

Excluded from this metric:

- merged pull requests with no recorded review — 668
- pull requests beyond the collection window in 1 repository/-ies
- pull requests not eligible for this measure — 93

**Assumptions.**

- Only reviews recorded through GitHub's review feature count. Approval given in a plain comment, over chat, or in person is invisible to this metric.

**Caveats.**

- Pull requests are fetched newest-first up to the configured page limit, so on very busy repositories the oldest pull requests can fall outside the collected window. The sample figures on this metric state exactly how many were read.
- Computed over 11 of 772 pull requests (1% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/spreix-platform #95 sat 12 minutes before anyone reviewed it** (0 hours waiting)
   Pure queue time: the work was finished and idle for this long, which is the cheapest delay in the whole pipeline to remove.
   Record: [#95](https://github.com/Shashank2577/spreix-platform/pull/95) — waited 12 minutes for a first review

2. **Shashank2577/spreix-platform #86 sat 10 minutes before anyone reviewed it** (0 hours waiting)
   Pure queue time: the work was finished and idle for this long, which is the cheapest delay in the whole pipeline to remove.
   Record: [#86](https://github.com/Shashank2577/spreix-platform/pull/86) — waited 10 minutes for a first review

3. **Shashank2577/spreix-platform #100 sat 9 minutes before anyone reviewed it** (0 hours waiting)
   Pure queue time: the work was finished and idle for this long, which is the cheapest delay in the whole pipeline to remove.
   Record: [#100](https://github.com/Shashank2577/spreix-platform/pull/100) — waited 9 minutes for a first review

4. **Shashank2577/spreix-platform #62 sat 9 minutes before anyone reviewed it** (0 hours waiting)
   Pure queue time: the work was finished and idle for this long, which is the cheapest delay in the whole pipeline to remove.
   Record: [#62](https://github.com/Shashank2577/spreix-platform/pull/62) — waited 9 minutes for a first review

5. **Shashank2577/spreix-platform #94 sat 9 minutes before anyone reviewed it** (0 hours waiting)
   Pure queue time: the work was finished and idle for this long, which is the cheapest delay in the whole pipeline to remove.
   Record: [#94](https://github.com/Shashank2577/spreix-platform/pull/94) — waited 9 minutes for a first review

**Underlying records (11 shown).**

- Shashank2577/spreix-platform [#95](https://github.com/Shashank2577/spreix-platform/pull/95) — first review after 12 minutes
- Shashank2577/spreix-platform [#86](https://github.com/Shashank2577/spreix-platform/pull/86) — first review after 10 minutes
- Shashank2577/spreix-platform [#100](https://github.com/Shashank2577/spreix-platform/pull/100) — first review after 9 minutes
- Shashank2577/spreix-platform [#62](https://github.com/Shashank2577/spreix-platform/pull/62) — first review after 9 minutes
- Shashank2577/spreix-platform [#94](https://github.com/Shashank2577/spreix-platform/pull/94) — first review after 9 minutes
- Shashank2577/spreix-platform [#61](https://github.com/Shashank2577/spreix-platform/pull/61) — first review after 8 minutes
- Shashank2577/ai-sdlc [#13](https://github.com/Shashank2577/ai-sdlc/pull/13) — first review after 8 minutes
- Shashank2577/ai-sdlc [#11](https://github.com/Shashank2577/ai-sdlc/pull/11) — first review after 7 minutes
- Shashank2577/ai-sdlc [#14](https://github.com/Shashank2577/ai-sdlc/pull/14) — first review after 6 minutes
- Shashank2577/ai-sdlc [#12](https://github.com/Shashank2577/ai-sdlc/pull/12) — first review after 6 minutes
- Shashank2577/ai-sdlc [#10](https://github.com/Shashank2577/ai-sdlc/pull/10) — first review after 6 minutes

---

#### Releases to the main branch per week: **42.47**

`delivery.deploy_frequency_per_week` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** How many separate times each week finished work lands on the branch the product is built from. Roughly: how often this team ships.

**Why it matters.** Shipping in small, frequent pieces is the most consistently reproduced predictor of both speed and stability in the research literature. Rare large releases concentrate risk into stressful events that people learn to fear and therefore delay further.

**How to read it.** Daily or better is elite. Weekly is solid. Less than monthly usually means releasing is a manual event rather than a routine one.

**How it was calculated.** `5,983 landings on feat/multi-consumer-keys, feat/second-brain, main over 140.9 weeks = 42.47 per week`

**Sample.** 5,983 of 8,669 commits (69.02% coverage).

Excluded from this metric:

- commits not on the default branch's first-parent line — 2,686

**Assumptions.**

- Each merge or direct push to the default branch counts as one landing, because no deployment system is connected to this tool.

**Caveats.**

- With no deployment system feeding this tool, a landing on the default branch stands in for a release. A team that batches merges and releases weekly will be over-counted here.
- Computed over 5,983 of 8,669 commits (69% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **2026-04: 1275 separate arrivals of work on feat/multi-consumer-keys, feat/second-brain, main** (1,275 landings, 21.3% of the total)
   The busiest month in scope, and the strongest single demonstration of the cadence this team is capable of when nothing is blocking it.
   Record: `org:org:all` — 1275 landings on feat/multi-consumer-keys, feat/second-brain, main during 2026-04

2. **2026-08: 1140 separate arrivals of work on feat/multi-consumer-keys, feat/second-brain, main** (1,140 landings, 19.1% of the total)
   The busiest month in scope, and the strongest single demonstration of the cadence this team is capable of when nothing is blocking it.
   Record: `org:org:all` — 1140 landings on feat/multi-consumer-keys, feat/second-brain, main during 2026-08

3. **2026-05: 914 separate arrivals of work on feat/multi-consumer-keys, feat/second-brain, main** (914 landings, 15.3% of the total)
   The busiest month in scope, and the strongest single demonstration of the cadence this team is capable of when nothing is blocking it.
   Record: `org:org:all` — 914 landings on feat/multi-consumer-keys, feat/second-brain, main during 2026-05

**Underlying records (10 shown).**

- Shashank2577/reporadar [973a7b3bc4](https://github.com/Shashank2577/reporadar/commit/973a7b3bc4d016e55fcf07d3fad12982c46eb9a0) — landed on feat/multi-consumer-keys, feat/second-brain, main
- Shashank2577/reporadar [3498ec47e9](https://github.com/Shashank2577/reporadar/commit/3498ec47e9bf387d41a55fc2189c01e3ccc0e632) — landed on feat/multi-consumer-keys, feat/second-brain, main
- Shashank2577/reporadar [7a79d9a558](https://github.com/Shashank2577/reporadar/commit/7a79d9a558278a9446daee7469da90d1ab4f22c0) — landed on feat/multi-consumer-keys, feat/second-brain, main
- Shashank2577/reporadar [d9fe1c8fd7](https://github.com/Shashank2577/reporadar/commit/d9fe1c8fd794b7d27ffbc1325f15b3f467196fd4) — landed on feat/multi-consumer-keys, feat/second-brain, main
- Shashank2577/sovix-ai-brain [c2481a8b6c](https://github.com/Shashank2577/sovix-ai-brain/commit/c2481a8b6c5f16be680c72c9a067243fac1f68ca) — landed on feat/multi-consumer-keys, feat/second-brain, main
- Shashank2577/sovix-ai-brain [1c3e1f42d0](https://github.com/Shashank2577/sovix-ai-brain/commit/1c3e1f42d06b6a4ee4f639c4341d9a1a21563ab1) — landed on feat/multi-consumer-keys, feat/second-brain, main
- Shashank2577/sovix-ai-brain [72939ad3ed](https://github.com/Shashank2577/sovix-ai-brain/commit/72939ad3ed58767e2e5cb97b6a4b33ea6103c49a) — landed on feat/multi-consumer-keys, feat/second-brain, main
- Shashank2577/sovix-ai-brain [4803fc1df9](https://github.com/Shashank2577/sovix-ai-brain/commit/4803fc1df9ee83ffe251efc3f8a3b2168074ffcb) — landed on feat/multi-consumer-keys, feat/second-brain, main
- Shashank2577/sovix-evidence-ui [51284c9e9e](https://github.com/Shashank2577/sovix-evidence-ui/commit/51284c9e9ecc5fb1067803f5959d0518bbadf71b) — landed on feat/multi-consumer-keys, feat/second-brain, main
- Shashank2577/reporadar [6c68928d54](https://github.com/Shashank2577/reporadar/commit/6c68928d54844389a441aa52cc41c787318c99fc) — landed on feat/multi-consumer-keys, feat/second-brain, main

---

#### Share of changes that needed a fix or revert: **12.6%**

`delivery.change_failure_rate` · confidence **low** · proxy (derived from a stated convention)

**What this means.** Out of every hundred changes that shipped, roughly how many had to be undone or urgently patched afterwards.

**Why it matters.** Speed only counts if the work stays shipped. A rising value means the team is paying for its velocity in rework, and that bill usually lands on whoever is on call.

**How to read it.** Under 15% is the industry's 'good' band. Treat the exact figure with real caution: it is inferred from how people word their commits, so a team that never writes 'fix' will look artificially healthy and a disciplined team will look worse than it is.

**How it was calculated.** `755 remediation commits / 5,983 landings = 12.6%`

**Sample.** 5,983 of 8,669 default-branch landings (69.02% coverage).

Excluded from this metric:

- commits that did not land on the default branch — 2,686

**Assumptions.**

- A commit counts as remediation when git records it as a revert, or when its subject line opens with a hotfix or revert marker.

**Caveats.**

- This reads commit messages, not incidents. It is a conversation starter, not a reliability measurement. Connecting an incident tracker is what turns it into one.
- A team that writes 'fix:' on ordinary small corrections scores worse than a team that writes nothing at all, which is the opposite of the truth.
- Computed over 5,983 of 8,669 default-branch landings (69% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/OBSERVE 60639c37 “fix(clickhouse): write rows as JSONEachRow, never as bound …”** (1,179 lines changed)
   The subject line marks this as a fix or hotfix landing directly on the default branch, which is how remediation is identified here.
   Record: [60639c3701](https://github.com/Shashank2577/OBSERVE/commit/60639c3701b38eabee58e5bf7a93fc0656548eda) — revert or hotfix landed on the default branch

2. **Shashank2577/OBSERVE 4604eeee “fix(investigations): make machine-owned records readable by…”** (325 lines changed)
   The subject line marks this as a fix or hotfix landing directly on the default branch, which is how remediation is identified here.
   Record: [4604eeee9c](https://github.com/Shashank2577/OBSERVE/commit/4604eeee9c21fb1872053c253a6425b3979e2a87) — revert or hotfix landed on the default branch

3. **Shashank2577/OBSERVE 31751686 “fix(automations): deliver to webhook channels, and stop cal…”** (275 lines changed)
   The subject line marks this as a fix or hotfix landing directly on the default branch, which is how remediation is identified here.
   Record: [31751686e9](https://github.com/Shashank2577/OBSERVE/commit/31751686e96e97080aa3d5584eb49931d344204d) — revert or hotfix landed on the default branch

4. **Shashank2577/OBSERVE 4ffaee6b “fix(investigations): render the error status, and say when …”** (197 lines changed)
   The subject line marks this as a fix or hotfix landing directly on the default branch, which is how remediation is identified here.
   Record: [4ffaee6b45](https://github.com/Shashank2577/OBSERVE/commit/4ffaee6b458feb1d6ee48699014c9f1af9eb0215) — revert or hotfix landed on the default branch

5. **Shashank2577/OBSERVE fc633a8f “fix(chart): stop shipping one shared NEXTAUTH_SECRET to eve…”** (29 lines changed)
   The subject line marks this as a fix or hotfix landing directly on the default branch, which is how remediation is identified here.
   Record: [fc633a8f95](https://github.com/Shashank2577/OBSERVE/commit/fc633a8f95f07362f7c66d62760e7436684dd4ae) — revert or hotfix landed on the default branch

**Underlying records (12 shown).**

- Shashank2577/um [c3d2182d23](https://github.com/Shashank2577/um/commit/c3d2182d23fd41ecc1f806375b67da75d84f684e) — counted as remediation
- Shashank2577/um [ab9dd28139](https://github.com/Shashank2577/um/commit/ab9dd28139bc1d2a2b01b3db7edc4276ecc39d64) — counted as remediation
- Shashank2577/um [92c3200772](https://github.com/Shashank2577/um/commit/92c320077270212047eddc353d6ecea03168dec6) — counted as remediation
- Shashank2577/um [041a511484](https://github.com/Shashank2577/um/commit/041a511484948d1deac21f4dd0e954feec12cc84) — counted as remediation
- Shashank2577/um [d6d9f8bc5b](https://github.com/Shashank2577/um/commit/d6d9f8bc5b5828289c42268438a22708778d352e) — counted as remediation
- Shashank2577/um [f725af51f3](https://github.com/Shashank2577/um/commit/f725af51f304ab894dfddd719441047c5f7a6019) — counted as remediation
- Shashank2577/um [e17463378d](https://github.com/Shashank2577/um/commit/e17463378dce4de0b0f8627f0520e0d3323306ad) — counted as remediation
- Shashank2577/um [3b3d277ddd](https://github.com/Shashank2577/um/commit/3b3d277ddd3cd685ff421e9c3c5ef750530174a9) — counted as remediation
- Shashank2577/um [7540e78aab](https://github.com/Shashank2577/um/commit/7540e78aabaaed2e3471a6dedcd296d28e6a26a5) — counted as remediation
- Shashank2577/um [29a8c34c94](https://github.com/Shashank2577/um/commit/29a8c34c9405d1d6e2ffb7576f4343540c896da8) — counted as remediation
- Shashank2577/um [e7695b81ce](https://github.com/Shashank2577/um/commit/e7695b81ceb040bad109ac0d131f4ee9f9f87a49) — counted as remediation
- Shashank2577/um [62c35c82a7](https://github.com/Shashank2577/um/commit/62c35c82a73f705225477110b92b48b0813f1ebc) — counted as remediation

---

#### Median time to repair a reverted change: **6.0 days**

`delivery.mttr_hours` · confidence **low** · proxy (derived from a stated convention)

**What this means.** When something had to be undone, this is how long the broken version stayed in place before the correction landed.

**Why it matters.** Everything breaks eventually; what separates teams is how fast they recover. Short recovery means problems get contained before customers accumulate.

**How to read it.** Under an hour is elite. Over a day suggests either detection or the release path is slow. Check the sample size first — most repositories have only a handful of events, so one outlier moves this a long way.

**How it was calculated.** `median(revert_time - original_commit_time) over 6 revert pairs = 143.6 hours`

**Sample.** 6 of 1,315 revert events (0.46% coverage).

Excluded from this metric:

- reverts with no recorded original commit hash, so untimeable — 1,309

**Assumptions.**

- Only reverts where git recorded the original commit hash can be paired and timed.

**Caveats.**

- Measures time to revert in source control, not time to restore service for customers. Those two differ by however long the release path takes.
- Usually computed over very few events, so read it as an anecdote with a number attached.
- Computed over 6 of 1,315 revert events (0% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/um: “TAINT-2661 async call while sending notification” stood for 6.1 days before being reverted** (147 hours until reverted)
   Both commits are named, so the full repair window can be verified directly in git.
   Record: [e17463378d](https://github.com/Shashank2577/um/commit/e17463378dce4de0b0f8627f0520e0d3323306ad) — reverted 3879a944 after 6.1 days

2. **Shashank2577/um: “TAINT-2661 add logs to scheduler” stood for 6.1 days before being reverted** (146 hours until reverted)
   Both commits are named, so the full repair window can be verified directly in git.
   Record: [f725af51f3](https://github.com/Shashank2577/um/commit/f725af51f304ab894dfddd719441047c5f7a6019) — reverted a8bc3a73 after 6.1 days

3. **Shashank2577/um: “TAINT-2661 fix log message” stood for 6.0 days before being reverted** (145 hours until reverted)
   Both commits are named, so the full repair window can be verified directly in git.
   Record: [d6d9f8bc5b](https://github.com/Shashank2577/um/commit/d6d9f8bc5b5828289c42268438a22708778d352e) — reverted b9b8a9d9 after 6.0 days

4. **Shashank2577/um: “TAINT-2661 Resolved MR comment” stood for 5.9 days before being reverted** (142 hours until reverted)
   Both commits are named, so the full repair window can be verified directly in git.
   Record: [041a511484](https://github.com/Shashank2577/um/commit/041a511484948d1deac21f4dd0e954feec12cc84) — reverted 67fca266 after 5.9 days

5. **Shashank2577/um: “TAINT-2852, Maintaining status for stopped sync account and…” stood for 26.9 hours before being reverted** (27 hours until reverted)
   Both commits are named, so the full repair window can be verified directly in git.
   Record: [92c3200772](https://github.com/Shashank2577/um/commit/92c320077270212047eddc353d6ecea03168dec6) — reverted e18a9540 after 26.9 hours

**Underlying records (6 shown).**

- Shashank2577/um [92c3200772](https://github.com/Shashank2577/um/commit/92c320077270212047eddc353d6ecea03168dec6) — revert paired to e18a9540
- Shashank2577/um [041a511484](https://github.com/Shashank2577/um/commit/041a511484948d1deac21f4dd0e954feec12cc84) — revert paired to 67fca266
- Shashank2577/um [d6d9f8bc5b](https://github.com/Shashank2577/um/commit/d6d9f8bc5b5828289c42268438a22708778d352e) — revert paired to b9b8a9d9
- Shashank2577/um [f725af51f3](https://github.com/Shashank2577/um/commit/f725af51f304ab894dfddd719441047c5f7a6019) — revert paired to a8bc3a73
- Shashank2577/um [e17463378d](https://github.com/Shashank2577/um/commit/e17463378dce4de0b0f8627f0520e0d3323306ad) — revert paired to 3879a944
- Shashank2577/oh-my-tokens [dbd2c9c44d](https://github.com/Shashank2577/oh-my-tokens/commit/dbd2c9c44d87675bfe637e3b75aba0232c0905a2) — revert paired to 98ac6260

---

#### Changes currently waiting: **28**

`delivery.wip_open_prs` · confidence **high** · measured (counted directly from records)

**What this means.** How many finished-but-not-yet-shipped changes are sitting open right now, waiting for review or a decision.

**Why it matters.** This is inventory. Every open change is effort already spent that has not yet produced any value, and it decays: the longer it waits, the more it conflicts with other work and the more expensive it becomes to finish.

**How to read it.** Roughly one open change per active developer is normal. Several times that means the team is starting faster than it can finish, and adding more work will not help.

**How it was calculated.** `count(pull requests open at collection time) = 28`

**Sample.** 28 of 772 pull requests (3.63% coverage).

Excluded from this metric:

- pull requests beyond the collection window in 1 repository/-ies
- pull requests not eligible for this measure — 744

**Caveats.**

- Pull requests are fetched newest-first up to the configured page limit, so on very busy repositories the oldest pull requests can fall outside the collected window. The sample figures on this metric state exactly how many were read.
- Computed over 28 of 772 pull requests (4% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/OBSERVE #1 “feat: Phase 3 Differentiation” open for 150 days** (151 days open)
   The longest-waiting item in the queue. Effort already spent that has produced nothing yet, and the most likely to have become unmergeable.
   Record: [#1](https://github.com/Shashank2577/OBSERVE/pull/1) — still open at collection time

2. **Shashank2577/OBSERVE #3 “feat: Implement Phase 2 - Intelligence Layer” open for 150 days** (150 days open)
   The longest-waiting item in the queue. Effort already spent that has produced nothing yet, and the most likely to have become unmergeable.
   Record: [#3](https://github.com/Shashank2577/OBSERVE/pull/3) — still open at collection time

3. **Shashank2577/OBSERVE #4 “feat(ai): Phase 1 Foundation Implementation” open for 150 days** (150 days open)
   The longest-waiting item in the queue. Effort already spent that has produced nothing yet, and the most likely to have become unmergeable.
   Record: [#4](https://github.com/Shashank2577/OBSERVE/pull/4) — still open at collection time

4. **Shashank2577/OBSERVE #5 “feat: Phase 4 Predictive and Auto-Remediation” open for 150 days** (150 days open)
   The longest-waiting item in the queue. Effort already spent that has produced nothing yet, and the most likely to have become unmergeable.
   Record: [#5](https://github.com/Shashank2577/OBSERVE/pull/5) — still open at collection time

5. **Shashank2577/Nexus-BE #1 “refactor(A1.2): extract JwtTokenService interface” open for 146 days** (147 days open)
   The longest-waiting item in the queue. Effort already spent that has produced nothing yet, and the most likely to have become unmergeable.
   Record: [#1](https://github.com/Shashank2577/Nexus-BE/pull/1) — still open at collection time

**Underlying records (5 shown).**

- Shashank2577/OBSERVE [#1](https://github.com/Shashank2577/OBSERVE/pull/1) — open
- Shashank2577/OBSERVE [#3](https://github.com/Shashank2577/OBSERVE/pull/3) — open
- Shashank2577/OBSERVE [#4](https://github.com/Shashank2577/OBSERVE/pull/4) — open
- Shashank2577/OBSERVE [#5](https://github.com/Shashank2577/OBSERVE/pull/5) — open
- Shashank2577/Nexus-BE [#1](https://github.com/Shashank2577/Nexus-BE/pull/1) — open

---

#### Share of open changes stalled over 30 days: **75.0%**

`delivery.stale_pr_share` · confidence **high** · measured (counted directly from records)

**What this means.** Of the changes currently waiting, how many have had no activity at all for more than a month. In practice, work that was finished and then quietly forgotten.

**Why it matters.** Each one is fully paid-for engineering effort delivering nothing. They also mislead planning, because the work looks 'in progress' when it is actually abandoned.

**How to read it.** Under 10% is normal churn. Above a third means the review queue is not being worked, and the honest move is to close them rather than let them imply progress.

**How it was calculated.** `21 open pull requests idle over 30 days / 28 open = 75%`

**Sample.** 28 of 772 pull requests (3.63% coverage).

Excluded from this metric:

- pull requests beyond the collection window in 1 repository/-ies
- pull requests not eligible for this measure — 744

**Caveats.**

- Pull requests are fetched newest-first up to the configured page limit, so on very busy repositories the oldest pull requests can fall outside the collected window. The sample figures on this metric state exactly how many were read.
- Computed over 28 of 772 pull requests (4% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/OBSERVE #1 “feat: Phase 3 Differentiation” — untouched for 150 days** (151 days idle)
   12,231 lines of finished work delivering nothing. Either it should be merged this week or closed honestly.
   Record: [#1](https://github.com/Shashank2577/OBSERVE/pull/1) — no activity for 150 days

2. **Shashank2577/OBSERVE #3 “feat: Implement Phase 2 - Intelligence Layer” — untouched for 150 days** (150 days idle)
   12,903 lines of finished work delivering nothing. Either it should be merged this week or closed honestly.
   Record: [#3](https://github.com/Shashank2577/OBSERVE/pull/3) — no activity for 150 days

3. **Shashank2577/OBSERVE #4 “feat(ai): Phase 1 Foundation Implementation” — untouched for 150 days** (150 days idle)
   11,339 lines of finished work delivering nothing. Either it should be merged this week or closed honestly.
   Record: [#4](https://github.com/Shashank2577/OBSERVE/pull/4) — no activity for 150 days

4. **Shashank2577/OBSERVE #5 “feat: Phase 4 Predictive and Auto-Remediation” — untouched for 150 days** (150 days idle)
   11,329 lines of finished work delivering nothing. Either it should be merged this week or closed honestly.
   Record: [#5](https://github.com/Shashank2577/OBSERVE/pull/5) — no activity for 150 days

5. **Shashank2577/Nexus-BE #1 “refactor(A1.2): extract JwtTokenService interface” — untouched for 146 days** (147 days idle)
   454 lines of finished work delivering nothing. Either it should be merged this week or closed honestly.
   Record: [#1](https://github.com/Shashank2577/Nexus-BE/pull/1) — no activity for 146 days

**Underlying records (12 shown).**

- Shashank2577/growth-dashboard [#1](https://github.com/Shashank2577/growth-dashboard/pull/1) — stalled
- Shashank2577/OBSERVE [#5](https://github.com/Shashank2577/OBSERVE/pull/5) — stalled
- Shashank2577/OBSERVE [#4](https://github.com/Shashank2577/OBSERVE/pull/4) — stalled
- Shashank2577/OBSERVE [#3](https://github.com/Shashank2577/OBSERVE/pull/3) — stalled
- Shashank2577/OBSERVE [#1](https://github.com/Shashank2577/OBSERVE/pull/1) — stalled
- Shashank2577/spreix-boat [#21](https://github.com/Shashank2577/spreix-boat/pull/21) — stalled
- Shashank2577/spreix-boat [#20](https://github.com/Shashank2577/spreix-boat/pull/20) — stalled
- Shashank2577/spreix-boat [#19](https://github.com/Shashank2577/spreix-boat/pull/19) — stalled
- Shashank2577/spreix-boat [#18](https://github.com/Shashank2577/spreix-boat/pull/18) — stalled
- Shashank2577/spreix-boat [#17](https://github.com/Shashank2577/spreix-boat/pull/17) — stalled
- Shashank2577/spreix-boat [#16](https://github.com/Shashank2577/spreix-boat/pull/16) — stalled
- Shashank2577/spreix-boat [#15](https://github.com/Shashank2577/spreix-boat/pull/15) — stalled

---

### Output and activity

*How much change is being made, by how many people, at what cadence, and of what kind. Volume is not value, so read this family as context for the others.*

#### Commits: **8,111**

`velocity.commits_total` · confidence **high** · measured (counted directly from records)

**What this means.** A commit is one saved checkpoint of work, like a numbered draft of a document. This is how many such checkpoints were recorded in the period.

**Why it matters.** It is the raw pulse of activity and the denominator for most percentages on this page. On its own it says nothing at all about value delivered.

**How to read it.** Use it for shape and trend, never as a target. Teams differ tenfold in how finely they slice their work, and both extremes can be perfectly healthy.

**How it was calculated.** `count(commits in scope, merge commits excluded) = 8,111`

**Sample.** 8,111 of 8,669 commits (93.56% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Assumptions.**

- Merge commits are excluded, because they restate the line changes of the commits they bring in and would double-count every line.

**Caveats.**

- If the team squash-merges pull requests, many individual commits collapse into one. Per-commit counts are then lower than the work actually done, and individual authorship inside a squashed change is lost entirely.
- Rebases, force-pushes and history rewrites change commit hashes and dates. Older history can therefore appear tidier, or more recent, than it actually was.

**Strongest evidence.**

1. **Shashank2577/um 3ac8c542 “ABU-134 - Added BM cheetah modules” — 954,922 lines in one commit** (954,922 lines changed)
   The single largest checkpoint in scope. It shows how coarse this team's commits can get, which is the context needed before reading any per-commit average.
   Record: [3ac8c542b1](https://github.com/Shashank2577/um/commit/3ac8c542b15291be7ff88dfdc4a644eb4849958b) — largest single commit: 954,922 lines

2. **Shashank2577/um 2de8f654 “Cheetah: Add gradle script to build dashboard and include i…” — 906,361 lines in one commit** (906,361 lines changed)
   The single largest checkpoint in scope. It shows how coarse this team's commits can get, which is the context needed before reading any per-commit average.
   Record: [2de8f65484](https://github.com/Shashank2577/um/commit/2de8f65484c6aae643ad79833d029e5207ee38bd) — largest single commit: 906,361 lines

3. **Shashank2577/um 33c47f0a “ABU-134 Migration Cheetah API from Microservices to Integra…” — 899,754 lines in one commit** (899,754 lines changed)
   The single largest checkpoint in scope. It shows how coarse this team's commits can get, which is the context needed before reading any per-commit average.
   Record: [33c47f0a46](https://github.com/Shashank2577/um/commit/33c47f0a463fa9b5a216d71a4f9bac76d5bba871) — largest single commit: 899,754 lines

**Underlying records (5 shown).**

- Shashank2577/um [3ac8c542b1](https://github.com/Shashank2577/um/commit/3ac8c542b15291be7ff88dfdc4a644eb4849958b) — 954,922 lines changed
- Shashank2577/um [2de8f65484](https://github.com/Shashank2577/um/commit/2de8f65484c6aae643ad79833d029e5207ee38bd) — 906,361 lines changed
- Shashank2577/um [33c47f0a46](https://github.com/Shashank2577/um/commit/33c47f0a463fa9b5a216d71a4f9bac76d5bba871) — 899,754 lines changed
- Shashank2577/agent-native-deploy [43cd62c38c](https://github.com/Shashank2577/agent-native-deploy/commit/43cd62c38c639d9908b1332e535cfa6ec76ed7bb) — 186,964 lines changed
- Shashank2577/spreix-boat [25de58d45e](https://github.com/Shashank2577/spreix-boat/commit/25de58d45e83ef72c0eb8b68ae647ce0901e39c4) — 168,864 lines changed

---

#### Lines of code added: **6,208,167**

`velocity.lines_added` · confidence **high** · measured (counted directly from records)

**What this means.** How many individual lines of code were written in the period, after removing machine-generated and third-party files that nobody actually typed.

**Why it matters.** It gives a sense of scale — a thousand-line month and a hundred-thousand-line month are very different situations — and it is the denominator for the test ratio and the AI line share.

**How to read it.** Treat large spikes as questions rather than achievements. The usual explanations are an initial code import, a dependency upgrade, or a file type the exclusion rules missed.

**How it was calculated.** `sum(added lines over 86,694 counted files) = 6,208,167`

**Sample.** 86,694 of 359,538 file changes (24.11% coverage).

Excluded from this metric:

- structured data file — excluded so data dumps cannot dominate line counts — 134,403
- unrecognised file type (.mjs) — 1,610
- dependency lock file — regenerated by a tool, never hand-written — 597
- no recognised file extension — 1,015
- unrecognised file type (.html) — 494
- unrecognised file type (.css) — 615
- binary or media asset — line counts are meaningless — 3,074
- unrecognised file type (.example) — 182
- generated or migration directory — usually tool-authored and append-only — 1,595
- unrecognised file type (.gitignore) — 245
- unrecognised file type (.bak) — 6
- unrecognised file type (.mts) — 2
- unrecognised file type (.plist) — 9
- unrecognised file type (.patch) — 16
- unrecognised file type (.log) — 182
- unrecognised file type (.jsonl) — 115
- unrecognised file type (.gitkeep) — 107
- unrecognised file type (.tpl) — 49
- unrecognised file type (.lock) — 43
- unrecognised file type (.npmrc) — 12
- compiled, minified or archived artefact — 533
- third-party dependency source checked into the repository — 101,605
- unrecognised file type (.service) — 5
- unrecognised file type (.0) — 1
- build output directory — produced by the toolchain, not authored — 4,116
- unrecognised file type (.mod) — 17
- unrecognised file type (.template) — 6
- unrecognised file type (.pid) — 13
- unrecognised file type (.mdb) — 2
- unrecognised file type (.api) — 8
- unrecognised file type (.web) — 4
- unrecognised file type (.fuse_hidden0000001500000001) — 1
- unrecognised file type (.cls) — 1
- unrecognised file type (.tex) — 2
- unrecognised file type (.stderr) — 6
- unrecognised file type (.canvas) — 2
- unrecognised file type (.base) — 1
- unrecognised file type (.glb) — 1
- unrecognised file type (.bin) — 15
- unrecognised file type (.gltf) — 1
- unrecognised file type (.webmanifest) — 3
- unrecognised file type (.qdrant) — 3
- unrecognised file type (.dockerignore) — 59
- unrecognised file type (.dockerfile) — 10
- unrecognised file type (.cjs) — 93
- unrecognised file type (.icns) — 13
- unrecognised file type (.db) — 11
- unrecognised file type (.prisma) — 5
- unrecognised file type (.tsbuildinfo) — 11
- unrecognised file type (.jsonc) — 7
- unrecognised file type (.typ) — 2
- unrecognised file type (.bat) — 9
- unrecognised file type (.excalidraw) — 1
- unrecognised file type (.development) — 1
- unrecognised file type (.production) — 2
- unrecognised file type (.prod) — 1
- unrecognised file type (.pen) — 5
- unrecognised file type (.last-run) — 1
- unrecognised file type (.diff) — 1
- unrecognised file type (.runtime) — 1
- unrecognised file type (.ignore) — 25
- unrecognised file type (.prettierrc) — 24
- unrecognised file type (.func) — 6
- unrecognised file type (.prettierignore) — 1
- unrecognised file type (.car) — 5
- unrecognised file type (.taurignore) — 1
- unrecognised file type (.windsurfrules) — 6
- unrecognised file type (.cursorrules) — 5
- unrecognised file type (.builderrules) — 4
- unrecognised file type (.mdc) — 20
- unrecognised file type (.backup) — 2
- unrecognised file type (.npmignore) — 2
- unrecognised file type (.state) — 3
- unrecognised file type (.apps) — 1
- unrecognised file type (.imports) — 26
- unrecognised file type (.cmd) — 8
- unrecognised file type (.orig) — 1
- unrecognised file type (.rej) — 2
- unrecognised file type (.http) — 237
- unrecognised file type (.nvmrc) — 2
- unrecognised file type (.probe) — 2
- unrecognised file type (.pro) — 3
- unrecognised file type (.ds_store) — 5
- unrecognised file type (.tmp) — 1
- unrecognised file type (.webm) — 6
- unrecognised file type (.helmignore) — 44
- unrecognised file type (.frontend) — 1
- unrecognised file type (.io) — 2
- unrecognised file type (.gradle) — 569
- unrecognised file type (.xsd) — 2
- unrecognised file type (.xlf) — 92
- unrecognised file type (.md5) — 9,718
- unrecognised file type (.sha1) — 9,700
- unrecognised file type (.apib) — 1
- unrecognised file type (.editorconfig) — 2
- unrecognised file type (.new) — 1
- unrecognised file type (.scss) — 1
- unrecognised file type (.identifier) — 2
- unrecognised file type (.kbx) — 7
- unrecognised file type (.secret) — 14
- unrecognised file type (.avz) — 1
- unrecognised file type (.code-workspace) — 5
- unrecognised file type (.pac) — 2
- unrecognised file type (.openapi-generator-ignore) — 2
- unrecognised file type (.jsp) — 1
- history boundary of a shallow clone — the whole tree reads as added because the parent commit was never fetched — 1,327
- unrecognised file type (.gpg) — 1
- unrecognised file type (.config) — 1

**Caveats.**

- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.
- Lines of code measures volume, not value. A hard-won hundred-line fix and a thousand lines of boilerplate look the same here. This is not a basis for ranking people.
- 28,637,494 lines were excluded from this total as machine-generated, vendored or binary content (19,121,318 lines from third-party dependency source checked into the repository; 7,304,544 lines from structured data file — excluded so data dumps cannot dominate line counts). The full exclusion list is on the Evidence tab.
- Computed over 86,694 of 359,538 file changes (24% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/um 3ac8c542 “ABU-134 - Added BM cheetah modules” added 954,922 lines** (954,922 lines added, 15.4% of the total)
   The largest single contribution to this total — 15.4% of it in one commit. Worth confirming it is real work rather than an import the exclusion rules missed.
   Record: [3ac8c542b1](https://github.com/Shashank2577/um/commit/3ac8c542b15291be7ff88dfdc4a644eb4849958b) — 954,922 lines added

2. **Shashank2577/um 33c47f0a “ABU-134 Migration Cheetah API from Microservices to Integra…” added 899,740 lines** (899,740 lines added, 14.5% of the total)
   The largest single contribution to this total — 14.5% of it in one commit. Worth confirming it is real work rather than an import the exclusion rules missed.
   Record: [33c47f0a46](https://github.com/Shashank2577/um/commit/33c47f0a463fa9b5a216d71a4f9bac76d5bba871) — 899,740 lines added

3. **Shashank2577/agent-native-deploy 43cd62c3 “Add starter templates and framework env management” added 186,902 lines** (186,902 lines added, 3.0% of the total)
   The largest single contribution to this total — 3.0% of it in one commit. Worth confirming it is real work rather than an import the exclusion rules missed.
   Record: [43cd62c38c](https://github.com/Shashank2577/agent-native-deploy/commit/43cd62c38c639d9908b1332e535cfa6ec76ed7bb) — 186,902 lines added

**Underlying records (5 shown).**

- Shashank2577/um [3ac8c542b1](https://github.com/Shashank2577/um/commit/3ac8c542b15291be7ff88dfdc4a644eb4849958b) — 954,922 lines added
- Shashank2577/um [33c47f0a46](https://github.com/Shashank2577/um/commit/33c47f0a463fa9b5a216d71a4f9bac76d5bba871) — 899,740 lines added
- Shashank2577/agent-native-deploy [43cd62c38c](https://github.com/Shashank2577/agent-native-deploy/commit/43cd62c38c639d9908b1332e535cfa6ec76ed7bb) — 186,902 lines added
- Shashank2577/spreix-boat [25de58d45e](https://github.com/Shashank2577/spreix-boat/commit/25de58d45e83ef72c0eb8b68ae647ce0901e39c4) — 168,864 lines added
- Shashank2577/spreix-notetaker [4d9b9f97c1](https://github.com/Shashank2577/spreix-notetaker/commit/4d9b9f97c1794a755c9880b7239097433268203e) — 94,316 lines added

---

#### Lines of code removed: **1,704,343**

`velocity.lines_removed` · confidence **high** · measured (counted directly from records)

**What this means.** How many lines of code were deleted during the period. Deleting code is a normal and usually welcome part of the work: it happens when something is replaced by a simpler version, when a feature is retired, or when a mistake is undone.

**Why it matters.** Deletion is usually a good sign: it means simplification and cleanup are happening rather than only accumulation. A codebase that only ever grows steadily gets harder and more expensive to change.

**How to read it.** Compare against lines added. Roughly balanced means the team is reworking what exists; heavily additive means new construction.

**How it was calculated.** `sum(removed lines over 86,694 counted files) = 1,704,343`

**Sample.** 86,694 of 359,538 file changes (24.11% coverage).

Excluded from this metric:

- structured data file — excluded so data dumps cannot dominate line counts — 134,403
- unrecognised file type (.mjs) — 1,610
- dependency lock file — regenerated by a tool, never hand-written — 597
- no recognised file extension — 1,015
- unrecognised file type (.html) — 494
- unrecognised file type (.css) — 615
- binary or media asset — line counts are meaningless — 3,074
- unrecognised file type (.example) — 182
- generated or migration directory — usually tool-authored and append-only — 1,595
- unrecognised file type (.gitignore) — 245
- unrecognised file type (.bak) — 6
- unrecognised file type (.mts) — 2
- unrecognised file type (.plist) — 9
- unrecognised file type (.patch) — 16
- unrecognised file type (.log) — 182
- unrecognised file type (.jsonl) — 115
- unrecognised file type (.gitkeep) — 107
- unrecognised file type (.tpl) — 49
- unrecognised file type (.lock) — 43
- unrecognised file type (.npmrc) — 12
- compiled, minified or archived artefact — 533
- third-party dependency source checked into the repository — 101,605
- unrecognised file type (.service) — 5
- unrecognised file type (.0) — 1
- build output directory — produced by the toolchain, not authored — 4,116
- unrecognised file type (.mod) — 17
- unrecognised file type (.template) — 6
- unrecognised file type (.pid) — 13
- unrecognised file type (.mdb) — 2
- unrecognised file type (.api) — 8
- unrecognised file type (.web) — 4
- unrecognised file type (.fuse_hidden0000001500000001) — 1
- unrecognised file type (.cls) — 1
- unrecognised file type (.tex) — 2
- unrecognised file type (.stderr) — 6
- unrecognised file type (.canvas) — 2
- unrecognised file type (.base) — 1
- unrecognised file type (.glb) — 1
- unrecognised file type (.bin) — 15
- unrecognised file type (.gltf) — 1
- unrecognised file type (.webmanifest) — 3
- unrecognised file type (.qdrant) — 3
- unrecognised file type (.dockerignore) — 59
- unrecognised file type (.dockerfile) — 10
- unrecognised file type (.cjs) — 93
- unrecognised file type (.icns) — 13
- unrecognised file type (.db) — 11
- unrecognised file type (.prisma) — 5
- unrecognised file type (.tsbuildinfo) — 11
- unrecognised file type (.jsonc) — 7
- unrecognised file type (.typ) — 2
- unrecognised file type (.bat) — 9
- unrecognised file type (.excalidraw) — 1
- unrecognised file type (.development) — 1
- unrecognised file type (.production) — 2
- unrecognised file type (.prod) — 1
- unrecognised file type (.pen) — 5
- unrecognised file type (.last-run) — 1
- unrecognised file type (.diff) — 1
- unrecognised file type (.runtime) — 1
- unrecognised file type (.ignore) — 25
- unrecognised file type (.prettierrc) — 24
- unrecognised file type (.func) — 6
- unrecognised file type (.prettierignore) — 1
- unrecognised file type (.car) — 5
- unrecognised file type (.taurignore) — 1
- unrecognised file type (.windsurfrules) — 6
- unrecognised file type (.cursorrules) — 5
- unrecognised file type (.builderrules) — 4
- unrecognised file type (.mdc) — 20
- unrecognised file type (.backup) — 2
- unrecognised file type (.npmignore) — 2
- unrecognised file type (.state) — 3
- unrecognised file type (.apps) — 1
- unrecognised file type (.imports) — 26
- unrecognised file type (.cmd) — 8
- unrecognised file type (.orig) — 1
- unrecognised file type (.rej) — 2
- unrecognised file type (.http) — 237
- unrecognised file type (.nvmrc) — 2
- unrecognised file type (.probe) — 2
- unrecognised file type (.pro) — 3
- unrecognised file type (.ds_store) — 5
- unrecognised file type (.tmp) — 1
- unrecognised file type (.webm) — 6
- unrecognised file type (.helmignore) — 44
- unrecognised file type (.frontend) — 1
- unrecognised file type (.io) — 2
- unrecognised file type (.gradle) — 569
- unrecognised file type (.xsd) — 2
- unrecognised file type (.xlf) — 92
- unrecognised file type (.md5) — 9,718
- unrecognised file type (.sha1) — 9,700
- unrecognised file type (.apib) — 1
- unrecognised file type (.editorconfig) — 2
- unrecognised file type (.new) — 1
- unrecognised file type (.scss) — 1
- unrecognised file type (.identifier) — 2
- unrecognised file type (.kbx) — 7
- unrecognised file type (.secret) — 14
- unrecognised file type (.avz) — 1
- unrecognised file type (.code-workspace) — 5
- unrecognised file type (.pac) — 2
- unrecognised file type (.openapi-generator-ignore) — 2
- unrecognised file type (.jsp) — 1
- history boundary of a shallow clone — the whole tree reads as added because the parent commit was never fetched — 1,327
- unrecognised file type (.gpg) — 1
- unrecognised file type (.config) — 1

**Caveats.**

- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.
- Lines of code measures volume, not value. A hard-won hundred-line fix and a thousand lines of boilerplate look the same here. This is not a basis for ranking people.
- 28,637,494 lines were excluded from this total as machine-generated, vendored or binary content (19,121,318 lines from third-party dependency source checked into the repository; 7,304,544 lines from structured data file — excluded so data dumps cannot dominate line counts). The full exclusion list is on the Evidence tab.
- Computed over 86,694 of 359,538 file changes (24% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/um 2de8f654 “Cheetah: Add gradle script to build dashboard and include i…” removed 891,182 lines** (891,182 lines removed, 52.3% of the total)
   The largest single contribution to this total — 52.3% of it in one commit. Worth confirming it is real work rather than an import the exclusion rules missed.
   Record: [2de8f65484](https://github.com/Shashank2577/um/commit/2de8f65484c6aae643ad79833d029e5207ee38bd) — 891,182 lines removed

2. **Shashank2577/agent-native-deploy 076f81d3 “feat: SQLite-first data layer with cloud upgrade path (#74)” removed 78,888 lines** (78,888 lines removed, 4.6% of the total)
   The largest single contribution to this total — 4.6% of it in one commit. Worth confirming it is real work rather than an import the exclusion rules missed.
   Record: [076f81d31f](https://github.com/Shashank2577/agent-native-deploy/commit/076f81d31f6b110b090e9d481e7d7fad5b9aae96) — 78,888 lines removed

3. **Shashank2577/spreix-boat e247575e “Delete dead legacy apps (rowboat, rowboatx, experimental, p…” removed 69,972 lines** (69,972 lines removed, 4.1% of the total)
   The largest single contribution to this total — 4.1% of it in one commit. Worth confirming it is real work rather than an import the exclusion rules missed.
   Record: [e247575e84](https://github.com/Shashank2577/spreix-boat/commit/e247575e84320f1d86d23f02f07f057a85400952) — 69,972 lines removed

**Underlying records (5 shown).**

- Shashank2577/um [2de8f65484](https://github.com/Shashank2577/um/commit/2de8f65484c6aae643ad79833d029e5207ee38bd) — 891,182 lines removed
- Shashank2577/agent-native-deploy [076f81d31f](https://github.com/Shashank2577/agent-native-deploy/commit/076f81d31f6b110b090e9d481e7d7fad5b9aae96) — 78,888 lines removed
- Shashank2577/spreix-boat [e247575e84](https://github.com/Shashank2577/spreix-boat/commit/e247575e84320f1d86d23f02f07f057a85400952) — 69,972 lines removed
- Shashank2577/agent-native-deploy [9539f289e3](https://github.com/Shashank2577/agent-native-deploy/commit/9539f289e3a5725c94a62494c22c5655898207f3) — 56,012 lines removed
- Shashank2577/agent-native-deploy [c4621f5e30](https://github.com/Shashank2577/agent-native-deploy/commit/c4621f5e305a303a37c88010aedd58fef914fc9c) — 37,426 lines removed

---

#### Net change in codebase size: **4,503,824**

`velocity.net_lines` · confidence **high** · measured (counted directly from records)

**What this means.** Lines added minus lines removed — how much bigger or smaller the codebase got overall.

**Why it matters.** Size is the main driver of long-term maintenance cost. Watching net growth against delivered features tells you whether the team is building capability or accumulating bulk.

**How to read it.** Steady modest growth is normal for an active product. A negative figure during an active period is usually a successful cleanup and worth celebrating rather than questioning.

**How it was calculated.** `6,208,167 added - 1,704,343 removed = 4,503,824 net lines`

**Sample.** 8,111 of 8,669 commits (93.56% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Caveats.**

- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.
- Lines of code measures volume, not value. A hard-won hundred-line fix and a thousand lines of boilerplate look the same here. This is not a basis for ranking people.

**Underlying records (1 shown).**

- `org:org:all` — 6,208,167 lines added and 1,704,343 removed across 8,111 commits

---

#### Days per week with any activity: **4.15**

`velocity.active_days_per_week` · confidence **high** · measured (counted directly from records)

**What this means.** On how many days in a typical week does anyone save work to this codebase. It separates steady daily progress from occasional bursts.

**Why it matters.** A steady cadence usually indicates well-understood work flowing smoothly. Long silences followed by bursts normally mean work is blocked elsewhere, or being done privately on a branch and landed in one go.

**How to read it.** Four to five is normal for an actively staffed team. One or two means the project is in maintenance, or a single person is carrying it.

**How it was calculated.** `584 distinct active days / 140.9 weeks = 4.15 days per week`

**Sample.** 8,111 of 8,669 commits (93.56% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Caveats.**

- Rebases, force-pushes and history rewrites change commit hashes and dates. Older history can therefore appear tidier, or more recent, than it actually was.

**Strongest evidence.**

1. **2026-05-12: 350 commits — the busiest single day in scope** (350 commits)
   Shows the team's peak daily throughput, which is the ceiling the average is measured against.
   Record: `org:org:all` — 350 commits on 2026-05-12

2. **2026-04-21: 271 commits — the busiest single day in scope** (271 commits)
   Shows the team's peak daily throughput, which is the ceiling the average is measured against.
   Record: `org:org:all` — 271 commits on 2026-04-21

3. **2026-04-27: 173 commits — the busiest single day in scope** (173 commits)
   Shows the team's peak daily throughput, which is the ceiling the average is measured against.
   Record: `org:org:all` — 173 commits on 2026-04-27

**Underlying records (1 shown).**

- `org:org:all` — 584 distinct active days across a 140.9-week window

---

#### Median commit size: **86**

`velocity.commit_size_p50` · confidence **high** · measured (counted directly from records)

**What this means.** The size of a typical saved checkpoint, counting lines added and removed together.

**Why it matters.** Small commits are easier to review, easier to undo, and far easier to understand a year later when something breaks. Very large commits cannot be reviewed meaningfully at all.

**How to read it.** Tens of lines is comfortable. Hundreds means changes are hard to review. A sudden rise alongside rising AI adoption is worth investigating rather than celebrating.

**How it was calculated.** `median(added + removed per commit) over 6,674 commits = 86 lines`

**Sample.** 6,674 of 8,669 commits (76.99% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558
- commits touching no counted files (docs-only, binary, or excluded paths) — 1,437

**Caveats.**

- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.
- If the team squash-merges pull requests, many individual commits collapse into one. Per-commit counts are then lower than the work actually done, and individual authorship inside a squashed change is lost entirely.
- Computed over 6,674 of 8,669 commits (77% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/um 3ac8c542 — 954,922 lines, 11104x the median** (954,922 lines)
   An outlier this far above the median is the reason to read the median rather than the average, and a change this size cannot have been meaningfully reviewed.
   Record: [3ac8c542b1](https://github.com/Shashank2577/um/commit/3ac8c542b15291be7ff88dfdc4a644eb4849958b) — 954,922 lines in one commit

2. **Shashank2577/um 2de8f654 — 906,361 lines, 10539x the median** (906,361 lines)
   An outlier this far above the median is the reason to read the median rather than the average, and a change this size cannot have been meaningfully reviewed.
   Record: [2de8f65484](https://github.com/Shashank2577/um/commit/2de8f65484c6aae643ad79833d029e5207ee38bd) — 906,361 lines in one commit

3. **Shashank2577/um 33c47f0a — 899,754 lines, 10462x the median** (899,754 lines)
   An outlier this far above the median is the reason to read the median rather than the average, and a change this size cannot have been meaningfully reviewed.
   Record: [33c47f0a46](https://github.com/Shashank2577/um/commit/33c47f0a463fa9b5a216d71a4f9bac76d5bba871) — 899,754 lines in one commit

**Underlying records (5 shown).**

- Shashank2577/um [3ac8c542b1](https://github.com/Shashank2577/um/commit/3ac8c542b15291be7ff88dfdc4a644eb4849958b) — 954,922 lines
- Shashank2577/um [2de8f65484](https://github.com/Shashank2577/um/commit/2de8f65484c6aae643ad79833d029e5207ee38bd) — 906,361 lines
- Shashank2577/um [33c47f0a46](https://github.com/Shashank2577/um/commit/33c47f0a463fa9b5a216d71a4f9bac76d5bba871) — 899,754 lines
- Shashank2577/agent-native-deploy [43cd62c38c](https://github.com/Shashank2577/agent-native-deploy/commit/43cd62c38c639d9908b1332e535cfa6ec76ed7bb) — 186,964 lines
- Shashank2577/spreix-boat [25de58d45e](https://github.com/Shashank2577/spreix-boat/commit/25de58d45e83ef72c0eb8b68ae647ce0901e39c4) — 168,864 lines

---

#### Lines changed per active day: **13,549**

`velocity.lines_per_active_day` · confidence **high** · measured (counted directly from records)

**What this means.** On the days when work actually happened, how many lines of code changed on average.

**Why it matters.** It normalises output for how many days the team was actually engaged, which makes two periods comparable even when one contains holidays or a hiring gap.

**How to read it.** Only meaningful compared against the same codebase's own history. A step change that coincides with a tool rollout is the pattern worth examining.

**How it was calculated.** `7,912,510 lines changed / 584 active days = 13,549 lines per active day`

**Sample.** 8,111 of 8,669 commits (93.56% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Caveats.**

- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.
- Lines of code measures volume, not value. A hard-won hundred-line fix and a thousand lines of boilerplate look the same here. This is not a basis for ranking people.

**Underlying records (1 shown).**

- `org:org:all` — 7,912,510 lines changed across 584 active days

---

#### Share of work that is new capability: **44.5%**

`velocity.feature_work_share` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** Developers usually label what a change is for — new capability, a bug fix, a cleanup, or routine maintenance. This is the share of work labelled as new capability.

**Why it matters.** This is the closest available answer to 'what are we actually spending engineering on?'. A quarter where most effort went to fixes and cleanup rather than new capability explains a missed roadmap far better than any velocity chart.

**How to read it.** There is no correct number. Around half on new capability is common for a growing product; much lower means the team is absorbed by maintenance. Look for the trend, and check the coverage figure — this only works where teams label their commits.

**How it was calculated.** `2,295 feature commits / 5,156 classified commits = 44.5%`

**Sample.** 5,156 of 8,669 commits (59.48% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558
- commits whose subject matched no recognised convention or keyword — 2,955

**Assumptions.**

- Classification reads conventional-commit prefixes (feat, fix, refactor, chore, docs, test, perf, ci, build, style) and falls back to keyword matching on the subject line.

**Caveats.**

- Only commits that follow a recognisable convention can be classified. The coverage figure on this metric states what share of commits it could read at all — if that is low, the percentage describes a minority of the work.
- Labels are self-reported. A change labelled 'refactor' that adds a feature is counted as a refactor.
- Only 64% of commits in this scope could be classified at all. The percentage therefore describes that subset, not all work.
- Computed over 5,156 of 8,669 commits (59% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **feature: 2,295 commits (44% of classified work)** (2,295 commits, 44.5% of the total)
   The full composition is the finding, not the feature share alone — this is where engineering effort actually went.
   Record: `org:org:all` — 2,295 commits classified as feature

2. **fix: 1,658 commits (32% of classified work)** (1,658 commits, 32.2% of the total)
   The full composition is the finding, not the feature share alone — this is where engineering effort actually went.
   Record: `org:org:all` — 1,658 commits classified as fix

3. **chore: 597 commits (12% of classified work)** (597 commits, 11.6% of the total)
   The full composition is the finding, not the feature share alone — this is where engineering effort actually went.
   Record: `org:org:all` — 597 commits classified as chore

4. **docs: 364 commits (7% of classified work)** (364 commits, 7.1% of the total)
   The full composition is the finding, not the feature share alone — this is where engineering effort actually went.
   Record: `org:org:all` — 364 commits classified as docs

5. **refactor: 127 commits (2% of classified work)** (127 commits, 2.5% of the total)
   The full composition is the finding, not the feature share alone — this is where engineering effort actually went.
   Record: `org:org:all` — 127 commits classified as refactor

**Underlying records (10 shown).**

- Shashank2577/um [3ac8c542b1](https://github.com/Shashank2577/um/commit/3ac8c542b15291be7ff88dfdc4a644eb4849958b) — classified as feature
- Shashank2577/um [2de8f65484](https://github.com/Shashank2577/um/commit/2de8f65484c6aae643ad79833d029e5207ee38bd) — classified as feature
- Shashank2577/agent-native-deploy [43cd62c38c](https://github.com/Shashank2577/agent-native-deploy/commit/43cd62c38c639d9908b1332e535cfa6ec76ed7bb) — classified as feature
- Shashank2577/agent-native-deploy [076f81d31f](https://github.com/Shashank2577/agent-native-deploy/commit/076f81d31f6b110b090e9d481e7d7fad5b9aae96) — classified as feature
- Shashank2577/um [9a95ff787a](https://github.com/Shashank2577/um/commit/9a95ff787a6cd5fa297c1d711361a3339258dfac) — classified as feature
- Shashank2577/agent-native-deploy [c4621f5e30](https://github.com/Shashank2577/agent-native-deploy/commit/c4621f5e305a303a37c88010aedd58fef914fc9c) — classified as feature
- Shashank2577/micro-saas [499134799d](https://github.com/Shashank2577/micro-saas/commit/499134799d26f57171027b12d6bd61f77abc62e3) — classified as feature
- Shashank2577/agent-native-deploy [3b4c23090f](https://github.com/Shashank2577/agent-native-deploy/commit/3b4c23090fb3076e5b5203cd2a3ce97a5c2653c9) — classified as feature
- Shashank2577/opencover-complete [2757f48e85](https://github.com/Shashank2577/opencover-complete/commit/2757f48e856435421f8df4fb7503273b34d4a0eb) — classified as feature
- Shashank2577/agent-native-deploy [eb2f574346](https://github.com/Shashank2577/agent-native-deploy/commit/eb2f574346c35a51c0d2c25b15120a564853c6ee) — classified as feature

---

#### Share of commits that are trivial: **25.6%**

`velocity.trivial_commit_share` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** The share of saved checkpoints that changed almost nothing — fewer than five lines, or only configuration and formatting.

**Why it matters.** It stops commit counts being read as productivity. If a large share of a team's commits are one-line tweaks, then a rising commit count is a change in habit, not in output.

**How to read it.** Twenty to thirty percent is normal, since real work includes small corrections. Much higher means commit counts are not a usable measure of anything for this team.

**How it was calculated.** `2,073 commits under 5 lines / 8,111 commits = 25.6%`

**Sample.** 8,111 of 8,669 commits (93.56% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Caveats.**

- A one-line change can be the most important fix of the quarter. This measures size, which is not the same as significance.
- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.

**Underlying records (10 shown).**

- Shashank2577/ai-sdlc [f674ba1baa](https://github.com/Shashank2577/ai-sdlc/commit/f674ba1baa88a6d36b903cf692ac2547b9f2be7a) — 0 lines changed
- Shashank2577/reporadar [7a79d9a558](https://github.com/Shashank2577/reporadar/commit/7a79d9a558278a9446daee7469da90d1ab4f22c0) — 0 lines changed
- Shashank2577/reporadar [7e3004a2ac](https://github.com/Shashank2577/reporadar/commit/7e3004a2ac2463f5bf3044335766ffd6cd103468) — 0 lines changed
- Shashank2577/sovix-ai-brain [c2481a8b6c](https://github.com/Shashank2577/sovix-ai-brain/commit/c2481a8b6c5f16be680c72c9a067243fac1f68ca) — 0 lines changed
- Shashank2577/sovix-ai-brain [72939ad3ed](https://github.com/Shashank2577/sovix-ai-brain/commit/72939ad3ed58767e2e5cb97b6a4b33ea6103c49a) — 0 lines changed
- Shashank2577/reporadar [6c68928d54](https://github.com/Shashank2577/reporadar/commit/6c68928d54844389a441aa52cc41c787318c99fc) — 0 lines changed
- Shashank2577/reporadar [6f2f78c909](https://github.com/Shashank2577/reporadar/commit/6f2f78c90964ec4aaa040a3ef81398c42dba478a) — 0 lines changed
- Shashank2577/growth-dashboard [9852ba763c](https://github.com/Shashank2577/growth-dashboard/commit/9852ba763ce85063661b3c962471819b6e0a2900) — 0 lines changed
- Shashank2577/reporadar [e10553832f](https://github.com/Shashank2577/reporadar/commit/e10553832fe2c22e6922fbf81e3537eb057e47e0) — 0 lines changed
- Shashank2577/reporadar [7444e65aea](https://github.com/Shashank2577/reporadar/commit/7444e65aeac8e0fdd625f9a8c891a84c417d8b30) — 0 lines changed

---

### Code health

*Whether the codebase is getting easier or harder to work in: rework, test coverage of new code, structural complexity, duplication, and concentration of risk.*

#### Rework rate: new code rewritten within 21 days: **10.0%**

`quality.rework_rate` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** Of all the code written in this period, this share was changed again or deleted within three weeks of being written. Put plainly: work that did not stay put. Getting a requirement wrong and then correcting it lands here.

**Why it matters.** This is the closest thing available to a measure of wasted effort. Every point of rework is engineering time spent twice on the same outcome. It is also usually caused upstream — unclear requirements, missing review, changing minds — rather than by careless coding, which makes it a management lever rather than a developer scorecard.

**How to read it.** Under 15% is normal and healthy; some rework always happens and a codebase with none is probably not being maintained. Sustained above roughly 25% signals that work is starting before it is properly understood. A step up immediately after a tool rollout or a team change is the specific pattern worth investigating.

**How it was calculated.** `620,849 lines rewritten within 21 days / 6,208,167 lines added = 10%`

**Sample.** 39,144 of 39,144 files with tracked history (100.0% coverage).

**Assumptions.**

- A file touched again within 21 days is treated as rework in proportion to the lines changed on the second visit. This is file-level attribution, not line-level blame, which is the practical trade-off that keeps this affordable over years of history.
- The 21-day window follows the convention used in the published code-churn research. It is a considered judgement, not a law of nature, and is configurable.

**Caveats.**

- Legitimate iteration also lands here. A feature built across several days of successive commits looks like rework even though it is ordinary progress.
- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.

**Strongest evidence.**

1. **workflow_editor.tsx: 2,551 lines written on 01 Jul 2026 were rewritten 10 days later** (2,551 lines rewritten, 0.4% of the total)
   Both commits are named and linkable: “Initial commit: Spreix Boat — self-hosted web port of Rowbo…” (25de58d4, Shashank Saxena) put the lines in, and “Delete dead legacy apps (rowboat, rowboatx, experimental, p…” (e247575e, Shashank Saxena) took them out again. This single event is 0.4% of all rework in scope, which makes it the strongest available proof that the rate is real rather than an artefact of the calculation.
   Record: [apps/rowboat/app/projects/[projectId]/workflow/workflow_editor.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/app/projects/[projectId]/workflow/workflow_editor.tsx) — 2,551 lines rewritten 10 days after being written

2. **entity_list.tsx: 2,154 lines written on 01 Jul 2026 were rewritten 10 days later** (2,154 lines rewritten, 0.3% of the total)
   Both commits are named and linkable: “Initial commit: Spreix Boat — self-hosted web port of Rowbo…” (25de58d4, Shashank Saxena) put the lines in, and “Delete dead legacy apps (rowboat, rowboatx, experimental, p…” (e247575e, Shashank Saxena) took them out again. This single event is 0.3% of all rework in scope, which makes it the strongest available proof that the rate is real rather than an artefact of the calculation.
   Record: [apps/rowboat/app/projects/[projectId]/workflow/entity_list.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/app/projects/[projectId]/workflow/entity_list.tsx) — 2,154 lines rewritten 10 days after being written

3. **agents.ts: 1,578 lines written on 01 Jul 2026 were rewritten 10 days later** (1,578 lines rewritten, 0.3% of the total)
   Both commits are named and linkable: “Initial commit: Spreix Boat — self-hosted web port of Rowbo…” (25de58d4, Shashank Saxena) put the lines in, and “Delete dead legacy apps (rowboat, rowboatx, experimental, p…” (e247575e, Shashank Saxena) took them out again. This single event is 0.3% of all rework in scope, which makes it the strongest available proof that the rate is real rather than an artefact of the calculation.
   Record: [apps/rowboat/src/application/lib/agents-runtime/agents.ts](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/src/application/lib/agents-runtime/agents.ts) — 1,578 lines rewritten 10 days after being written

4. **prompt.txt: 1,549 lines written on 04 Aug 2026 were rewritten 0 days later** (1,549 lines rewritten, 0.2% of the total)
   Both commits are named and linkable: “feat: complete deep repo enrichment pass for 20 repos” (30ee783f, shashanksaxena-tz) put the lines in, and “feat: complete deep repo enrichment pass for 20 repos” (77a6e669, shashanksaxena-tz) took them out again. This single event is 0.2% of all rework in scope, which makes it the strongest available proof that the rate is real rather than an artefact of the calculation.
   Record: [prompt.txt](https://github.com/Shashank2577/reporadar/blob/main/prompt.txt) — 1,549 lines rewritten 0 days after being written

5. **Timeline.tsx: 1,520 lines written on 14 Mar 2026 were rewritten 0 days later** (1,520 lines rewritten, 0.2% of the total)
   Both commits are named and linkable: “Add starter templates and framework env management” (43cd62c3, Steve Sewell) put the lines in, and “better” (9539f289, Steve Sewell) took them out again. This single event is 0.2% of all rework in scope, which makes it the strongest available proof that the rate is real rather than an artefact of the calculation.
   Record: [templates/videos/client/components/Timeline.tsx](https://github.com/Shashank2577/agent-native-deploy/blob/main/templates/videos/client/components/Timeline.tsx) — 1,520 lines rewritten 0 days after being written

**Underlying records (12 shown).**

- Shashank2577/reporadar [data/repos/github__spec-kit.json](https://github.com/Shashank2577/reporadar/blob/main/data/repos/github__spec-kit.json) — 5,195 lines of rework attributed to this file
- Shashank2577/agent-native-deploy [packages/core/src/client/AssistantChat.tsx](https://github.com/Shashank2577/agent-native-deploy/blob/main/packages/core/src/client/AssistantChat.tsx) — 4,512 lines of rework attributed to this file
- Shashank2577/agent-native-deploy [packages/core/src/server/agent-chat-plugin.ts](https://github.com/Shashank2577/agent-native-deploy/blob/main/packages/core/src/server/agent-chat-plugin.ts) — 4,388 lines of rework attributed to this file
- Shashank2577/agent-native-deploy [packages/docs/app/components/searchIndex.ts](https://github.com/Shashank2577/agent-native-deploy/blob/main/packages/docs/app/components/searchIndex.ts) — 2,636 lines of rework attributed to this file
- Shashank2577/spreix-boat [apps/rowboat/app/projects/[projectId]/workflow/workflow_editor.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/app/projects/[projectId]/workflow/workflow_editor.tsx) — 2,551 lines of rework attributed to this file
- Shashank2577/agent-native-deploy [packages/core/src/client/AgentPanel.tsx](https://github.com/Shashank2577/agent-native-deploy/blob/main/packages/core/src/client/AgentPanel.tsx) — 2,459 lines of rework attributed to this file
- Shashank2577/spreix-boat [apps/rowboat/app/projects/[projectId]/workflow/entity_list.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/app/projects/[projectId]/workflow/entity_list.tsx) — 2,154 lines of rework attributed to this file
- Shashank2577/agent-native-deploy [packages/core/src/server/auth.ts](https://github.com/Shashank2577/agent-native-deploy/blob/main/packages/core/src/server/auth.ts) — 2,102 lines of rework attributed to this file
- Shashank2577/agent-native-deploy [templates/mail/app/components/layout/AppLayout.tsx](https://github.com/Shashank2577/agent-native-deploy/blob/main/templates/mail/app/components/layout/AppLayout.tsx) — 2,058 lines of rework attributed to this file
- Shashank2577/agent-native-deploy [templates/calendar/app/pages/BookingLinksPage.tsx](https://github.com/Shashank2577/agent-native-deploy/blob/main/templates/calendar/app/pages/BookingLinksPage.tsx) — 1,827 lines of rework attributed to this file
- Shashank2577/agent-native-deploy [templates/content/client/components/notion/NotionSyncPanel.tsx](https://github.com/Shashank2577/agent-native-deploy/blob/main/templates/content/client/components/notion/NotionSyncPanel.tsx) — 1,815 lines of rework attributed to this file
- Shashank2577/agent-native-deploy [templates/content/client/components/builder/BuilderSyncPanel.tsx](https://github.com/Shashank2577/agent-native-deploy/blob/main/templates/content/client/components/builder/BuilderSyncPanel.tsx) — 1,772 lines of rework attributed to this file

---

#### Share of new code that is tests: **11.2%**

`quality.test_line_ratio` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** Of every hundred lines of code written, how many were automated tests — code whose only job is to check that the rest of the code still works.

**Why it matters.** Tests are how a team keeps moving quickly without breaking what already works. If output rises while this ratio falls, the team is borrowing speed from future stability, and that debt is repaid as production incidents at the least convenient moment.

**How to read it.** Twenty to forty percent is typical for a well-tested service. Near zero on a codebase that is actively changing is the strongest early warning signal in this whole report.

**How it was calculated.** `696,580 lines in test files / 6,208,167 total lines added = 11.2%`

**Sample.** 8,111 of 8,669 commits (93.56% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Assumptions.**

- A file counts as a test when its path matches a test directory or a test/spec naming convention. Language-specific layouts are configured in config/path_rules.yaml.

**Caveats.**

- This counts the volume of test code, not whether the tests are any good or what they actually exercise. A thousand lines of shallow tests score better than a hundred excellent ones.
- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.

**Strongest evidence.**

1. **Shashank2577/marvin-template: only 0.0% of 8,628 new lines are tests** (8,628 untested lines)
   The weakest-tested repository in scope. 8,628 lines of product code arrived here with no matching test volume, which is where the aggregate figure is coming from.
   Record: `org:org:all` — Shashank2577/marvin-template: 0 test lines out of 8,628 total

2. **Shashank2577/Observability-Jager-GroundCover: only 0.0% of 7,406 new lines are tests** (7,406 untested lines)
   The weakest-tested repository in scope. 7,406 lines of product code arrived here with no matching test volume, which is where the aggregate figure is coming from.
   Record: `org:org:all` — Shashank2577/Observability-Jager-GroundCover: 0 test lines out of 7,406 total

3. **Shashank2577/muncipality-Tax: only 0.0% of 4,467 new lines are tests** (4,467 untested lines)
   The weakest-tested repository in scope. 4,467 lines of product code arrived here with no matching test volume, which is where the aggregate figure is coming from.
   Record: `org:org:all` — Shashank2577/muncipality-Tax: 0 test lines out of 4,467 total

4. **Shashank2577/splitwise: only 0.0% of 2,708 new lines are tests** (2,708 untested lines)
   The weakest-tested repository in scope. 2,708 lines of product code arrived here with no matching test volume, which is where the aggregate figure is coming from.
   Record: `org:org:all` — Shashank2577/splitwise: 0 test lines out of 2,708 total

5. **Shashank2577/NCRT_AI: only 0.0% of 1,331 new lines are tests** (1,331 untested lines)
   The weakest-tested repository in scope. 1,331 lines of product code arrived here with no matching test volume, which is where the aggregate figure is coming from.
   Record: `org:org:all` — Shashank2577/NCRT_AI: 0 test lines out of 1,331 total

**Underlying records (10 shown).**

- Shashank2577/agent-native-deploy [5b96abc777](https://github.com/Shashank2577/agent-native-deploy/commit/5b96abc77705f7b87b2b7a5cdf6a27ce7bb219d5) — 33,269 lines of product code with no test changes
- Shashank2577/agent-native-deploy [5a9126b7c2](https://github.com/Shashank2577/agent-native-deploy/commit/5a9126b7c2ac512137d102821a52f54f1dbbcd2a) — 17,292 lines of product code with no test changes
- Shashank2577/agent-native-deploy [3ed23148a3](https://github.com/Shashank2577/agent-native-deploy/commit/3ed23148a3268de867e87ca3ed99c44fc9af6380) — 14,138 lines of product code with no test changes
- Shashank2577/oh-my-design [b2b5b040f6](https://github.com/Shashank2577/oh-my-design/commit/b2b5b040f6e24237c3347a2e5e237bf0c0994517) — 11,425 lines of product code with no test changes
- Shashank2577/agent-native-deploy [076f81d31f](https://github.com/Shashank2577/agent-native-deploy/commit/076f81d31f6b110b090e9d481e7d7fad5b9aae96) — 11,328 lines of product code with no test changes
- Shashank2577/agent-native-deploy [0023d54ff7](https://github.com/Shashank2577/agent-native-deploy/commit/0023d54ff7ca0a4d69bbfe4d74c8d86ee326d0fc) — 11,106 lines of product code with no test changes
- Shashank2577/OBSERVE [82e5647f2f](https://github.com/Shashank2577/OBSERVE/commit/82e5647f2f671030c2ea55325d45deeed4f6b3bd) — 9,212 lines of product code with no test changes
- Shashank2577/oh-my-design [6976eadcd1](https://github.com/Shashank2577/oh-my-design/commit/6976eadcd1e9818edceada81d3a04ba87a478323) — 8,272 lines of product code with no test changes
- Shashank2577/agent-native-deploy [fb8c75e4ca](https://github.com/Shashank2577/agent-native-deploy/commit/fb8c75e4ca14081c7200c055d6e1e571fb59b45f) — 8,004 lines of product code with no test changes
- Shashank2577/agent-native-deploy [9aeed71f16](https://github.com/Shashank2577/agent-native-deploy/commit/9aeed71f16bc71c6af8ad8f1cf8816acde93b20f) — 7,884 lines of product code with no test changes

---

#### Share of code changes that updated tests too: **39.1%**

`quality.test_coupling_rate` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** When a developer changed real product code, how often did they change a test in the same checkpoint. It measures whether testing happens alongside the work or gets deferred.

**Why it matters.** A team can have a healthy overall test ratio while still shipping most individual changes untested, if tests arrive in occasional big batches. This catches that pattern, which the overall ratio hides.

**How to read it.** Above 40% is a strong habit. Below 15% means tests are an afterthought, regardless of what the total test ratio says.

**How it was calculated.** `1,665 commits touching both code and tests / 4,258 code commits = 39.1%`

**Sample.** 4,258 of 8,669 commits (49.12% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558
- commits that touched no product code (docs, config, tests only) — 3,853

**Caveats.**

- Not every code change needs a test change — a rename or a config tweak legitimately does not. This will therefore never reach 100%, and should not.
- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.
- Computed over 4,258 of 8,669 commits (49% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/agent-native-deploy 5b96abc7 “mail: persistent search bar + include snoozed in search res…” — 33,269 lines of product code, no test touched** (33,269 untested product lines)
   The largest change in scope that altered behaviour without touching a single test. This is the concrete case behind the coupling gap.
   Record: [5b96abc777](https://github.com/Shashank2577/agent-native-deploy/commit/5b96abc77705f7b87b2b7a5cdf6a27ce7bb219d5) — 33,269 lines of product code, zero test lines

2. **Shashank2577/agent-native-deploy 5a9126b7 “fix: rename fusion to builder, fix hydration/SSR errors, UI…” — 17,292 lines of product code, no test touched** (17,292 untested product lines)
   The largest change in scope that altered behaviour without touching a single test. This is the concrete case behind the coupling gap.
   Record: [5a9126b7c2](https://github.com/Shashank2577/agent-native-deploy/commit/5a9126b7c2ac512137d102821a52f54f1dbbcd2a) — 17,292 lines of product code, zero test lines

3. **Shashank2577/agent-native-deploy 3ed23148 “Updates 50 (#109)” — 14,138 lines of product code, no test touched** (14,138 untested product lines)
   The largest change in scope that altered behaviour without touching a single test. This is the concrete case behind the coupling gap.
   Record: [3ed23148a3](https://github.com/Shashank2577/agent-native-deploy/commit/3ed23148a3268de867e87ca3ed99c44fc9af6380) — 14,138 lines of product code, zero test lines

**Underlying records (5 shown).**

- Shashank2577/agent-native-deploy [5b96abc777](https://github.com/Shashank2577/agent-native-deploy/commit/5b96abc77705f7b87b2b7a5cdf6a27ce7bb219d5) — product code changed, no test touched
- Shashank2577/agent-native-deploy [5a9126b7c2](https://github.com/Shashank2577/agent-native-deploy/commit/5a9126b7c2ac512137d102821a52f54f1dbbcd2a) — product code changed, no test touched
- Shashank2577/agent-native-deploy [3ed23148a3](https://github.com/Shashank2577/agent-native-deploy/commit/3ed23148a3268de867e87ca3ed99c44fc9af6380) — product code changed, no test touched
- Shashank2577/oh-my-design [b2b5b040f6](https://github.com/Shashank2577/oh-my-design/commit/b2b5b040f6e24237c3347a2e5e237bf0c0994517) — product code changed, no test touched
- Shashank2577/agent-native-deploy [0023d54ff7](https://github.com/Shashank2577/agent-native-deploy/commit/0023d54ff7ca0a4d69bbfe4d74c8d86ee326d0fc) — product code changed, no test touched

---

#### Share of all changes landing in the busiest 10 files: **9.3%**

`quality.hotspot_concentration` · confidence **high** · measured (counted directly from records)

**What this means.** Out of all the editing that happened, this share happened inside just ten files. It shows whether work is spread across the codebase or piling up in a few crowded places.

**Why it matters.** Files that every change touches are where merge conflicts, regressions and onboarding pain concentrate. They are also the highest-return refactoring targets in the codebase, because one well-chosen split relieves pressure on every future change.

**How to read it.** Under 20% means change is well distributed. Over 40% means a handful of files are acting as a bottleneck for the whole team. The named files are listed underneath as evidence, so this metric comes with its own to-do list.

**How it was calculated.** `changes in top 10 files (738,900) / all file changes (7,912,510) = 9.3%`

**Sample.** 40,298 of 40,298 files touched (100.0% coverage).

**Caveats.**

- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.

**Strongest evidence.**

1. **cheetah/modules/assets/vendors/angular/1.5.9/angular-scenario.js: 89,514 lines changed over 2 separate commits** (89,514 lines changed, 1.1% of the total)
   1.1% of every line changed in this scope landed in this one file, touched by 2 different people. It is both the most likely source of merge conflicts and the highest-return refactoring target available.
   Record: [cheetah/modules/assets/vendors/angular/1.5.9/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/angular/1.5.9/angular-scenario.js) — 89,514 lines changed across 2 commits by 2 people

2. **cheetah/modules/assets/vendors/angular/1.5.6/angular-scenario.js: 86,194 lines changed over 2 separate commits** (86,194 lines changed, 1.1% of the total)
   1.1% of every line changed in this scope landed in this one file, touched by 2 different people. It is both the most likely source of merge conflicts and the highest-return refactoring target available.
   Record: [cheetah/modules/assets/vendors/angular/1.5.6/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/angular/1.5.6/angular-scenario.js) — 86,194 lines changed across 2 commits by 2 people

3. **cheetah/modules/assets/vendors/angular/1.4.8/angular-scenario.js: 80,878 lines changed over 2 separate commits** (80,878 lines changed, 1.0% of the total)
   1.0% of every line changed in this scope landed in this one file, touched by 2 different people. It is both the most likely source of merge conflicts and the highest-return refactoring target available.
   Record: [cheetah/modules/assets/vendors/angular/1.4.8/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/angular/1.4.8/angular-scenario.js) — 80,878 lines changed across 2 commits by 2 people

4. **cheetah/modules/assets/vendors/angular/1.4.7/angular-scenario.js: 80,648 lines changed over 2 separate commits** (80,648 lines changed, 1.0% of the total)
   1.0% of every line changed in this scope landed in this one file, touched by 2 different people. It is both the most likely source of merge conflicts and the highest-return refactoring target available.
   Record: [cheetah/modules/assets/vendors/angular/1.4.7/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/angular/1.4.7/angular-scenario.js) — 80,648 lines changed across 2 commits by 2 people

5. **cheetah/modules/assets/vendors/pdfjs-dist/1.3.72/pdf.worker.js: 80,148 lines changed over 2 separate commits** (80,148 lines changed, 1.0% of the total)
   1.0% of every line changed in this scope landed in this one file, touched by 2 different people. It is both the most likely source of merge conflicts and the highest-return refactoring target available.
   Record: [cheetah/modules/assets/vendors/pdfjs-dist/1.3.72/pdf.worker.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/pdfjs-dist/1.3.72/pdf.worker.js) — 80,148 lines changed across 2 commits by 2 people

**Underlying records (10 shown).**

- Shashank2577/um [cheetah/modules/assets/vendors/angular/1.5.9/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/angular/1.5.9/angular-scenario.js) — 89,514 lines changed
- Shashank2577/um [cheetah/modules/assets/vendors/angular/1.5.6/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/angular/1.5.6/angular-scenario.js) — 86,194 lines changed
- Shashank2577/um [cheetah/modules/assets/vendors/angular/1.4.8/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/angular/1.4.8/angular-scenario.js) — 80,878 lines changed
- Shashank2577/um [cheetah/modules/assets/vendors/angular/1.4.7/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/angular/1.4.7/angular-scenario.js) — 80,648 lines changed
- Shashank2577/um [cheetah/modules/assets/vendors/pdfjs-dist/1.3.72/pdf.worker.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/pdfjs-dist/1.3.72/pdf.worker.js) — 80,148 lines changed
- Shashank2577/um [cheetah/modules/assets/vendors/pdfjs-dist/1.1.215/pdf.worker.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/pdfjs-dist/1.1.215/pdf.worker.js) — 78,860 lines changed
- Shashank2577/um [cheetah/modules/assets/vendors/angular/1.5.9/angular.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/angular/1.5.9/angular.js) — 64,768 lines changed
- Shashank2577/um [cheetah/modules/assets/vendors/angular/1.5.6/angular.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/angular/1.5.6/angular.js) — 62,046 lines changed
- Shashank2577/um [cheetah/modules/assets/vendors/angular/1.4.8/angular.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/angular/1.4.8/angular.js) — 58,036 lines changed
- Shashank2577/um [cheetah/modules/assets/vendors/angular/1.4.7/angular.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/angular/1.4.7/angular.js) — 57,808 lines changed

---

#### Share of changes too large to review properly: **60.4%**

`quality.large_change_share` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** The share of proposed changes bigger than 400 lines — the size past which review research consistently shows reviewers stop finding defects and start skimming.

**Why it matters.** A large change that gets approved has not really been reviewed. This measures how much of the review process is ceremony, which matters most precisely when delivery is fastest.

**How to read it.** Under 20% is healthy. A high value combined with a very fast median merge time is strong evidence that changes are being waved through rather than examined.

**How it was calculated.** `466 pull requests over 400 lines / 772 pull requests = 60.4%`

**Sample.** 772 of 772 pull requests (100.0% coverage).

Excluded from this metric:

- pull requests beyond the collection window in 1 repository/-ies

**Assumptions.**

- The 400-line threshold comes from published code-review research; it is a convention rather than a property of your codebase.

**Caveats.**

- Pull requests are fetched newest-first up to the configured page limit, so on very busy repositories the oldest pull requests can fall outside the collected window. The sample figures on this metric state exactly how many were read.
- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.
- 403 of these large changes were merged with no recorded review.

**Strongest evidence.**

1. **Shashank2577/spreix-boat #15 “fix: resolve vault compilation race condition and performan…” — 233,289 lines, merged with no review** (233,289 lines)
   583x the 400-line reviewability threshold. Large enough that any review it received was necessarily a skim.
   Record: [#15](https://github.com/Shashank2577/spreix-boat/pull/15) — 233,289 lines, 0 review(s)

2. **Shashank2577/micro-saas #15 “feat(seointelligence): create SEO intelligence platform” — 44,196 lines, merged with no review** (44,196 lines)
   110x the 400-line reviewability threshold. Large enough that any review it received was necessarily a skim.
   Record: [#15](https://github.com/Shashank2577/micro-saas/pull/15) — 44,196 lines, 0 review(s)

3. **Shashank2577/prompture #1 “Auth: Clerk + real CLI tokens; stub cleanup (9 packages)” — 25,124 lines, merged with no review** (25,124 lines)
   63x the 400-line reviewability threshold. No review was recorded, so this volume of change entered the product unexamined.
   Record: [#1](https://github.com/Shashank2577/prompture/pull/1) — 25,124 lines, 0 review(s)

4. **Shashank2577/closepilot #27 “feat: Phase 2 & 3 — production readiness, intelligence & sc…” — 17,253 lines, merged with no review** (17,253 lines)
   43x the 400-line reviewability threshold. No review was recorded, so this volume of change entered the product unexamined.
   Record: [#27](https://github.com/Shashank2577/closepilot/pull/27) — 17,253 lines, 0 review(s)

5. **Shashank2577/spreix-platform #99 “Phase 6 implementation: session box, webhooks, integrations…” — 15,136 lines, merged with no review** (15,136 lines)
   38x the 400-line reviewability threshold. No review was recorded, so this volume of change entered the product unexamined.
   Record: [#99](https://github.com/Shashank2577/spreix-platform/pull/99) — 15,136 lines, 0 review(s)

**Underlying records (12 shown).**

- Shashank2577/spreix-boat [#15](https://github.com/Shashank2577/spreix-boat/pull/15) — 233,289 lines
- Shashank2577/micro-saas [#15](https://github.com/Shashank2577/micro-saas/pull/15) — 44,196 lines
- Shashank2577/prompture [#1](https://github.com/Shashank2577/prompture/pull/1) — 25,124 lines
- Shashank2577/closepilot [#27](https://github.com/Shashank2577/closepilot/pull/27) — 17,253 lines
- Shashank2577/spreix-platform [#99](https://github.com/Shashank2577/spreix-platform/pull/99) — 15,136 lines
- Shashank2577/growth-dashboard [#1](https://github.com/Shashank2577/growth-dashboard/pull/1) — 14,359 lines
- Shashank2577/OBSERVE [#3](https://github.com/Shashank2577/OBSERVE/pull/3) — 12,903 lines
- Shashank2577/OBSERVE [#1](https://github.com/Shashank2577/OBSERVE/pull/1) — 12,231 lines
- Shashank2577/OBSERVE [#6](https://github.com/Shashank2577/OBSERVE/pull/6) — 11,666 lines
- Shashank2577/OBSERVE [#2](https://github.com/Shashank2577/OBSERVE/pull/2) — 11,516 lines
- Shashank2577/spreix-platform [#5](https://github.com/Shashank2577/spreix-platform/pull/5) — 11,467 lines
- Shashank2577/OBSERVE [#4](https://github.com/Shashank2577/OBSERVE/pull/4) — 11,339 lines

---

#### Share of functions long enough to be hard to follow: **6.6%**

`quality.long_function_share` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** Code is organised into functions — named blocks that each do one job. This is the share of them longer than 60 lines, which is roughly the point where a reader can no longer hold the whole thing in their head at once.

**Why it matters.** Long functions are where bugs hide and where new joiners stall. They are also the most commonly reported side effect of generated code, since a tool asked for a working solution will happily produce one long block rather than several well-named small ones.

**How to read it.** Under 10% is tidy. Over 25% means the codebase is structurally difficult to work in, and onboarding time will reflect that. Watch the trend more than the level.

**How it was calculated.** `2,428 functions over 60 lines / 36,825 functions found = 6.6%`

**Sample.** 36,825 of 36,825 functions found (100.0% coverage).

Excluded from this metric:

- 15 repository/-ies where the structure scan did not run

**Caveats.**

- Structure is measured with a brace-and-indent scanner, not a full language parser. It is reliable for ordinary code and can be fooled by macros, generated code, and unusual formatting. Treat the trend as the signal and any single file as a lead to verify.
- Some languages and frameworks legitimately produce long declarative blocks — configuration, schema definitions, generated builders — which inflate this.

**Strongest evidence.**

1. **getOnboardingHtml() in onboarding-html.ts is 1712 lines long** (1,712 lines in one function)
   28x the 60-line readability threshold. Nobody can hold this much logic in their head at once, which is why changes here are slow and risky.
   Record: [packages/core/src/server/onboarding-html.ts](https://github.com/Shashank2577/agent-native-deploy/blob/main/packages/core/src/server/onboarding-html.ts) — getOnboardingHtml() is 1712 lines long

2. **ScheduledPageContent() in page.tsx is 1646 lines long** (1,646 lines in one function)
   27x the 60-line readability threshold. Nobody can hold this much logic in their head at once, which is why changes here are slow and risky.
   Record: [frontend/src/app/(dashboard)/dashboard/scheduled/page.tsx](https://github.com/Shashank2577/spreix-notetaker/blob/master/frontend/src/app/(dashboard)/dashboard/scheduled/page.tsx) — ScheduledPageContent() is 1646 lines long

3. **WorkflowEditor() in workflow_editor.tsx is 1589 lines long** (1,589 lines in one function)
   26x the 60-line readability threshold. Nobody can hold this much logic in their head at once, which is why changes here are slow and risky.
   Record: [apps/rowboat/app/projects/[projectId]/workflow/workflow_editor.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/app/projects/[projectId]/workflow/workflow_editor.tsx) — WorkflowEditor() is 1589 lines long

4. **cleanFilename() in sync_gmail.ts is 1383 lines long** (1,383 lines in one function)
   23x the 60-line readability threshold. Nobody can hold this much logic in their head at once, which is why changes here are slow and risky.
   Record: [apps/x/packages/core/src/knowledge/sync_gmail.ts](https://github.com/Shashank2577/spreix-boat/blob/main/apps/x/packages/core/src/knowledge/sync_gmail.ts) — cleanFilename() is 1383 lines long

5. **getRaw() in note_creation.ts is 1263 lines long** (1,263 lines in one function)
   21x the 60-line readability threshold. Nobody can hold this much logic in their head at once, which is why changes here are slow and risky.
   Record: [apps/x/packages/core/src/knowledge/note_creation.ts](https://github.com/Shashank2577/spreix-boat/blob/main/apps/x/packages/core/src/knowledge/note_creation.ts) — getRaw() is 1263 lines long

**Underlying records (12 shown).**

- Shashank2577/agent-native-deploy [packages/core/src/server/onboarding-html.ts](https://github.com/Shashank2577/agent-native-deploy/blob/main/packages/core/src/server/onboarding-html.ts) — getOnboardingHtml() spans 1712 lines
- Shashank2577/spreix-notetaker [frontend/src/app/(dashboard)/dashboard/scheduled/page.tsx](https://github.com/Shashank2577/spreix-notetaker/blob/master/frontend/src/app/(dashboard)/dashboard/scheduled/page.tsx) — ScheduledPageContent() spans 1646 lines
- Shashank2577/spreix-boat [apps/rowboat/app/projects/[projectId]/workflow/workflow_editor.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/app/projects/[projectId]/workflow/workflow_editor.tsx) — WorkflowEditor() spans 1589 lines
- Shashank2577/spreix-boat [apps/x/packages/core/src/knowledge/sync_gmail.ts](https://github.com/Shashank2577/spreix-boat/blob/main/apps/x/packages/core/src/knowledge/sync_gmail.ts) — cleanFilename() spans 1383 lines
- Shashank2577/spreix-boat [apps/x/packages/core/src/knowledge/note_creation.ts](https://github.com/Shashank2577/spreix-boat/blob/main/apps/x/packages/core/src/knowledge/note_creation.ts) — getRaw() spans 1263 lines
- Shashank2577/spreix-notetaker [insightstream-feature/api/src/routes/gemini.ts](https://github.com/Shashank2577/spreix-notetaker/blob/master/insightstream-feature/api/src/routes/gemini.ts) — geminiRoutes() spans 1221 lines
- Shashank2577/OBSERVE [components/shared/interactive-chart.tsx](https://github.com/Shashank2577/OBSERVE/blob/master/components/shared/interactive-chart.tsx) — InteractiveChart() spans 1211 lines
- Shashank2577/agent-native-deploy [templates/calendar/app/pages/BookingLinksPage.tsx](https://github.com/Shashank2577/agent-native-deploy/blob/main/templates/calendar/app/pages/BookingLinksPage.tsx) — BookingLinksPage() spans 1178 lines
- Shashank2577/spreix-boat [apps/x/apps/renderer/src/components/chat-input-with-mentions.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/x/apps/renderer/src/components/chat-input-with-mentions.tsx) — ChatInputInner() spans 1029 lines
- Shashank2577/agent-native-deploy [templates/clips/desktop/src/overlays/bubble.tsx](https://github.com/Shashank2577/agent-native-deploy/blob/main/templates/clips/desktop/src/overlays/bubble.tsx) — Bubble() spans 962 lines
- Shashank2577/spreix-boat [apps/rowboatx/app/page.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboatx/app/page.tsx) — PageBody() spans 928 lines
- Shashank2577/spreix-platform [sst.config.ts](https://github.com/Shashank2577/spreix-platform/blob/main/sst.config.ts) — run() spans 922 lines

---

#### Deepest nesting in the worst tenth of functions: **4**

`quality.max_nesting_p90` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** How deeply conditions and loops sit inside one another — an 'if' inside a loop inside another 'if' is depth three. Deeper means more paths through the code and more ways for it to go wrong.

**Why it matters.** Nesting depth predicts defect rates better than raw size does, and it is the property that makes code genuinely hard to reason about rather than merely long.

**How to read it.** Three or four is ordinary. Six or more in the worst tenth means there are functions in this codebase that nobody can safely change without tests.

**How it was calculated.** `90th percentile(max nesting depth per function) over 36,825 functions = 4`

**Sample.** 36,825 of 36,825 functions measured (100.0% coverage).

**Caveats.**

- Structure is measured with a brace-and-indent scanner, not a full language parser. It is reliable for ordinary code and can be fooled by macros, generated code, and unusual formatting. Treat the trend as the signal and any single file as a lead to verify.

**Underlying records (1 shown).**

- `org:org:all` — nesting depth measured for 36,825 functions across 61 repositories

---

#### Share of code that is copy-pasted: **15.1%**

`quality.duplication_rate` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** The share of lines that appear as part of a repeated block found somewhere else in the codebase — the same six or more lines written twice.

**Why it matters.** Duplication multiplies the cost of every future fix: a bug in a copied block has to be found and fixed in each copy, and the copies drift apart over time. It is also the most frequently observed consequence of generating code rather than reusing it.

**How to read it.** Under 5% is normal. Over 15% means fixes are systematically incomplete, and the trend matters more than the level. Test files legitimately repeat setup code, so check whether the duplication is in tests or in product code.

**How it was calculated.** `223,041 lines inside repeated 6-line blocks / 1,477,782 scanned = 15.1%`

**Sample.** 12,200 of 12,200 source files scanned (100.0% coverage).

**Assumptions.**

- Blocks are compared after normalising whitespace and stripping comments, using a sliding window of 6 lines. Exact-match detection only — near-duplicates with renamed variables are not caught, so this is a floor.

**Caveats.**

- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.
- Detects identical blocks only. Real-world duplication with renamed variables is invisible here, so the true figure is higher than reported.

**Strongest evidence.**

1. **A 6-line block appears 4763 times — cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_ak-gh.js:47 and cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_ak-gh.js:48** (4,763 occurrences)
   Both locations are named, so the duplication can be confirmed by opening the two files side by side. Every future fix to this logic has to be applied 4763 times.
   Record: [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_ak-gh.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_ak-gh.js) — block repeated 4763 times, first at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_ak-gh.js:47 and again at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_ak-gh.js:48

2. **A 6-line block appears 3124 times — cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js:87 and cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js:88** (3,124 occurrences)
   Both locations are named, so the duplication can be confirmed by opening the two files side by side. Every future fix to this logic has to be applied 3124 times.
   Record: [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — block repeated 3124 times, first at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js:87 and again at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js:88

3. **A 6-line block appears 745 times — cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js:96 and cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:78** (745 occurrences)
   Both locations are named, so the duplication can be confirmed by opening the two files side by side. Every future fix to this logic has to be applied 745 times.
   Record: [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — block repeated 745 times, first at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js:96 and again at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:78

4. **A 6-line block appears 744 times — cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js:89 and cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:71** (744 occurrences)
   Both locations are named, so the duplication can be confirmed by opening the two files side by side. Every future fix to this logic has to be applied 744 times.
   Record: [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — block repeated 744 times, first at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js:89 and again at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:71

5. **A 6-line block appears 744 times — cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js:90 and cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:72** (744 occurrences)
   Both locations are named, so the duplication can be confirmed by opening the two files side by side. Every future fix to this logic has to be applied 744 times.
   Record: [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — block repeated 744 times, first at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js:90 and again at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:72

**Underlying records (12 shown).**

- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_ak-gh.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_ak-gh.js) — identical 6-line block also at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_ak-gh.js:48, 4763 occurrences
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — identical 6-line block also at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js:88, 3124 occurrences
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — identical 6-line block also at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:78, 745 occurrences
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — identical 6-line block also at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:71, 744 occurrences
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — identical 6-line block also at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:72, 744 occurrences
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — identical 6-line block also at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:73, 744 occurrences
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — identical 6-line block also at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:74, 744 occurrences
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — identical 6-line block also at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:75, 744 occurrences
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — identical 6-line block also at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:76, 744 occurrences
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — identical 6-line block also at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_af-za.js:65, 738 occurrences
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_ak-gh.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_ak-gh.js) — identical 6-line block also at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_ar-001.js:44, 579 occurrences
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_aa-er.js) — identical 6-line block also at cheetah/dashboards/common/assets/vendors/angular/1.4.7/i18n/angular-locale_ak-gh.js:2, 481 occurrences

---

#### Share of lines that are comments: **9.9%**

`quality.comment_density` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** How much of the code is explanatory notes written for humans rather than instructions for the computer.

**Why it matters.** Comments carry the reasoning that code cannot express — why a decision was made, what was tried and rejected. That reasoning is what a new joiner or a future maintainer actually needs, and it is the first thing lost when code is generated rather than written.

**How to read it.** Ten to twenty percent is typical. Very low means intent lives only in people's heads. Very high can mean boilerplate documentation headers that say nothing. Read the trend, not the level.

**How it was calculated.** `146,011 comment lines / 1,477,782 scanned lines = 9.9%`

**Sample.** 12,200 of 12,200 source files scanned (100.0% coverage).

**Caveats.**

- Structure is measured with a brace-and-indent scanner, not a full language parser. It is reliable for ordinary code and can be fooled by macros, generated code, and unusual formatting. Treat the trend as the signal and any single file as a lead to verify.
- Comment volume is not comment quality. Generated documentation headers count the same as a hard-won explanation of a subtle bug.

**Underlying records (1 shown).**

- `org:org:all` — 146,011 comment lines out of 1,477,782 scanned across 61 repositories

---

### AI-assisted development

*How much of the work carries a detectable trace of an AI coding tool, and whether that work behaves differently. Every number here is a floor, never a measurement.*

#### Commits carrying an AI-tool trace (floor): **24.8%**

`ai.detected_commit_share` · confidence **medium** · inferred (read from optional signals a tool may not leave)

**What this means.** Some AI coding tools leave a small signature in the record of a change, rather like a photocopier leaving a faint mark. This is the share of changes carrying such a signature. It can only count the ones that left a mark, so the real figure is higher — how much higher is genuinely unknown.

**Why it matters.** It is the only retrospective evidence of AI adoption that exists across full history, and the floor alone is often decisive for a licensing conversation: if the floor is already high, the tools are clearly in use whatever the true number is.

**How to read it.** Read it aloud as 'at least this much', never as 'this much'. A rising floor over time is meaningful. The absolute level is not comparable between teams, because it depends on which tools they chose and whether they left the default settings alone.

**How it was calculated.** `2,012 commits with an AI trace / 8,111 commits = 24.8%`

**Sample.** 8,111 of 8,669 commits (93.56% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Assumptions.**

- Detection patterns live in config/ai_signatures.yaml and cover commit trailers and message fingerprints from Claude Code, GitHub Copilot, Cursor, Aider, Windsurf, Devin and any custom 'AI-Assisted:' trailer the organisation chooses to mandate.

**Caveats.**

- This is a floor, not a measurement. It counts only work where a tool chose to leave a trace in commit metadata, and every one of those traces can be switched off in a single setting.
- Nothing here says AI wrote the code. It says an AI tool was involved in producing the change. A developer who accepted a single suggestion and one who generated an entire file are indistinguishable in this data.
- Tool-native analytics (Cursor, Copilot) only report from the day telemetry was enabled. History before that point was never recorded and cannot be reconstructed after the fact.
- 4 repository/-ies in this scope have an AI tool configuration file checked in but a trace rate below 5% (Shashank2577/reporadar (1.4%), Shashank2577/claw-assistant (0.0%), Shashank2577/payload-utility (0.0%)). That combination means traces are being suppressed rather than that the tools are unused, so the floor here is materially below actual usage.

**Strongest evidence.**

1. **Claude Code: 2,009 commits (24.8% of all commits)** (2,009 commits, 99.9% of the total)
   Each of these commits contains a literal tool signature in its metadata, which is why this is evidence rather than estimation — the trailer text can be read directly in the linked commits below.
   Record: `org:org:all` — 2,009 commits carry the Claude Code signature

2. **Cursor: 2 commits (0.0% of all commits)** (2 commits, 0.1% of the total)
   Each of these commits contains a literal tool signature in its metadata, which is why this is evidence rather than estimation — the trailer text can be read directly in the linked commits below.
   Record: `org:org:all` — 2 commits carry the Cursor signature

3. **OpenAI Codex: 1 commits (0.0% of all commits)** (1 commits)
   Each of these commits contains a literal tool signature in its metadata, which is why this is evidence rather than estimation — the trailer text can be read directly in the linked commits below.
   Record: `org:org:all` — 1 commits carry the OpenAI Codex signature

4. **GitHub Copilot: 1 commits (0.0% of all commits)** (1 commits)
   Each of these commits contains a literal tool signature in its metadata, which is why this is evidence rather than estimation — the trailer text can be read directly in the linked commits below.
   Record: `org:org:all` — 1 commits carry the GitHub Copilot signature

**Underlying records (12 shown).**

- Shashank2577/sovix-evidence [0b785ae96f](https://github.com/Shashank2577/sovix-evidence/commit/0b785ae96f9ee5a5c4c9f3c5baa76f173382863a) — signature found: Claude Code
- Shashank2577/sovix-evidence [241aab7483](https://github.com/Shashank2577/sovix-evidence/commit/241aab74836ec31bb87c6e756e3b04ee5a6b52ea) — signature found: Claude Code
- Shashank2577/sovix-evidence [8ec49735e9](https://github.com/Shashank2577/sovix-evidence/commit/8ec49735e9d49202f353868842c28fd90045f8fb) — signature found: Claude Code
- Shashank2577/sovix-evidence [23b4e6ee4e](https://github.com/Shashank2577/sovix-evidence/commit/23b4e6ee4e41330b3026c2f0a0cbc3f5f4d06fc6) — signature found: Claude Code
- Shashank2577/sovix-evidence [9cd7358363](https://github.com/Shashank2577/sovix-evidence/commit/9cd7358363eeefbd48328f10593e7c7549c95a68) — signature found: Claude Code
- Shashank2577/sovix-evidence [094848428d](https://github.com/Shashank2577/sovix-evidence/commit/094848428d8a566324cf1209dca9c48fe08d21a6) — signature found: Claude Code
- Shashank2577/sovix-evidence [2862937349](https://github.com/Shashank2577/sovix-evidence/commit/28629373499f40502b582bdd6a5cb26fedd02f30) — signature found: Claude Code
- Shashank2577/sovix-evidence [16f30332ad](https://github.com/Shashank2577/sovix-evidence/commit/16f30332ad4cbc32b105feb4c7b9d899b870956d) — signature found: Claude Code
- Shashank2577/sovix-evidence [835eaf2668](https://github.com/Shashank2577/sovix-evidence/commit/835eaf2668e478a06fb34b5edd3e3f49b6d8762f) — signature found: Claude Code
- Shashank2577/sovix-evidence [8b67a1d670](https://github.com/Shashank2577/sovix-evidence/commit/8b67a1d670efb5f27b0ef8a9300a305054f27fcd) — signature found: Claude Code
- Shashank2577/sovix-evidence [56cb5ad7b4](https://github.com/Shashank2577/sovix-evidence/commit/56cb5ad7b41862cb46378274708c610b681623c6) — signature found: Claude Code
- Shashank2577/sovix-evidence [0e46c941f4](https://github.com/Shashank2577/sovix-evidence/commit/0e46c941f431c83985f69fa4226ec7f285b969d4) — signature found: Claude Code

---

#### Lines arriving in AI-traced commits (floor): **23.9%**

`ai.detected_line_share` · confidence **low** · inferred (read from optional signals a tool may not leave)

**What this means.** The share of all code lines that arrived inside a change carrying an AI signature. Note the careful wording: lines that came in alongside an AI trace, not lines an AI wrote.

**Why it matters.** It converts adoption into something closer to volume, which is what people actually mean when they ask 'how much of our code is AI'. Giving them this number with its wording intact is more useful than refusing to answer.

**How to read it.** Always higher than nothing and always lower than the truth. Use it to compare periods within one team. Do not use it to compare teams, and do not let it be quoted as 'the percentage of our code that is AI'.

**How it was calculated.** `1,483,521 lines in AI-traced commits / 6,208,167 lines = 23.9%`

**Sample.** 8,111 of 8,669 commits (93.56% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Caveats.**

- This is a floor, not a measurement. It counts only work where a tool chose to leave a trace in commit metadata, and every one of those traces can be switched off in a single setting.
- A commit mixing hand-written and AI-assisted code attributes all of its lines to the AI side. That overstates within the commits it catches, while the overall figure understates. The two errors do not reliably cancel out.
- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.

**Strongest evidence.**

1. **Shashank2577/spreix-boat 25de58d4 “Initial commit: Spreix Boat — self-hosted web port of Rowbo…” — 168,864 lines with an Claude Code signature** (168,864 lines added, 11.4% of the total)
   11.4% of all AI-traced lines in scope arrived in this one commit. Open it to see how much of the content is really tool-authored — this is exactly where the 'lines alongside a trace, not lines written by AI' distinction bites.
   Record: [25de58d45e](https://github.com/Shashank2577/spreix-boat/commit/25de58d45e83ef72c0eb8b68ae647ce0901e39c4) — 168,864 added lines, AI signature present

2. **Shashank2577/claude-forza-horizon 4dc4be9e “Initial commit — Horizon Festival open-world racer” — 82,538 lines with an Claude Code signature** (82,538 lines added, 5.6% of the total)
   5.6% of all AI-traced lines in scope arrived in this one commit. Open it to see how much of the content is really tool-authored — this is exactly where the 'lines alongside a trace, not lines written by AI' distinction bites.
   Record: [4dc4be9e64](https://github.com/Shashank2577/claude-forza-horizon/commit/4dc4be9e64d2ab3e3845b736e11f97cfcdcb257b) — 82,538 added lines, AI signature present

3. **Shashank2577/sovix-evidence 0e46c941 “Initial import: Sovix Evidence specification and governance” — 54,209 lines with an Claude Code signature** (54,209 lines added, 3.7% of the total)
   3.7% of all AI-traced lines in scope arrived in this one commit. Open it to see how much of the content is really tool-authored — this is exactly where the 'lines alongside a trace, not lines written by AI' distinction bites.
   Record: [0e46c941f4](https://github.com/Shashank2577/sovix-evidence/commit/0e46c941f431c83985f69fa4226ec7f285b969d4) — 54,209 added lines, AI signature present

4. **Shashank2577/java-microservices-framework cf3c1033 “chore(framework): initial commit of java-microservices-fram…” — 46,886 lines with an Claude Code signature** (46,886 lines added, 3.2% of the total)
   3.2% of all AI-traced lines in scope arrived in this one commit. Open it to see how much of the content is really tool-authored — this is exactly where the 'lines alongside a trace, not lines written by AI' distinction bites.
   Record: [cf3c1033d3](https://github.com/Shashank2577/java-microservices-framework/commit/cf3c1033d33fb968b6e503801a3962e1e34bcf42) — 46,886 added lines, AI signature present

5. **Shashank2577/ai-cos b1f860be “chore: initial commit — Stage 1 Exa search + Phase 3 domain…” — 34,139 lines with an Claude Code signature** (34,139 lines added, 2.3% of the total)
   2.3% of all AI-traced lines in scope arrived in this one commit. Open it to see how much of the content is really tool-authored — this is exactly where the 'lines alongside a trace, not lines written by AI' distinction bites.
   Record: [b1f860be5c](https://github.com/Shashank2577/ai-cos/commit/b1f860be5c4d4518642580b3ca7de264cf04e4cb) — 34,139 added lines, AI signature present

**Underlying records (12 shown).**

- Shashank2577/spreix-boat [25de58d45e](https://github.com/Shashank2577/spreix-boat/commit/25de58d45e83ef72c0eb8b68ae647ce0901e39c4) — 168,864 lines arrived in an AI-traced commit
- Shashank2577/claude-forza-horizon [4dc4be9e64](https://github.com/Shashank2577/claude-forza-horizon/commit/4dc4be9e64d2ab3e3845b736e11f97cfcdcb257b) — 82,538 lines arrived in an AI-traced commit
- Shashank2577/sovix-evidence [0e46c941f4](https://github.com/Shashank2577/sovix-evidence/commit/0e46c941f431c83985f69fa4226ec7f285b969d4) — 54,209 lines arrived in an AI-traced commit
- Shashank2577/java-microservices-framework [cf3c1033d3](https://github.com/Shashank2577/java-microservices-framework/commit/cf3c1033d33fb968b6e503801a3962e1e34bcf42) — 46,886 lines arrived in an AI-traced commit
- Shashank2577/ai-cos [b1f860be5c](https://github.com/Shashank2577/ai-cos/commit/b1f860be5c4d4518642580b3ca7de264cf04e4cb) — 34,139 lines arrived in an AI-traced commit
- Shashank2577/opencover-complete [2757f48e85](https://github.com/Shashank2577/opencover-complete/commit/2757f48e856435421f8df4fb7503273b34d4a0eb) — 24,107 lines arrived in an AI-traced commit
- Shashank2577/receipts [c37f5a8dfd](https://github.com/Shashank2577/receipts/commit/c37f5a8dfdccadf7e3fd30b57ed0df2394e5063a) — 20,594 lines arrived in an AI-traced commit
- Shashank2577/axon [feb0cbf6ef](https://github.com/Shashank2577/axon/commit/feb0cbf6efa6d02b788123bfe3a13c4f765edfea) — 18,512 lines arrived in an AI-traced commit
- Shashank2577/micro-saas-java [16eb7d0035](https://github.com/Shashank2577/micro-saas-java/commit/16eb7d00351ae821931768b725864c2a59d7cb94) — 17,773 lines arrived in an AI-traced commit
- Shashank2577/spreix-platform [c8177a78c8](https://github.com/Shashank2577/spreix-platform/commit/c8177a78c82070636478b2316a5b7fd9472809b0) — 17,744 lines arrived in an AI-traced commit
- Shashank2577/micro-saas [f3bc87081b](https://github.com/Shashank2577/micro-saas/commit/f3bc87081b9c98bf330a3b4d2b60d7b9a4ce88a6) — 16,316 lines arrived in an AI-traced commit
- Shashank2577/opencover-complete [2d2908e643](https://github.com/Shashank2577/opencover-complete/commit/2d2908e64344aa2423b8221bb6d2a343839e54f2) — 14,596 lines arrived in an AI-traced commit

---

#### Contributors with any AI-traced commit: **16.3%**

`ai.adopter_share` · confidence **medium** · inferred (read from optional signals a tool may not leave)

**What this means.** The share of people contributing to this code who have at least one change carrying an AI signature. It measures how widely the tools have spread, not how heavily they are used.

**Why it matters.** Breadth and depth of adoption call for completely different responses. A few power users means the opportunity is training and enablement. Broad shallow use means the opportunity is workflow and integration.

**How to read it.** Compare it against how many licences were issued. A large gap between seats paid for and people showing any trace is the single most actionable number in this family, because it converts directly into either a training plan or a cancelled renewal.

**How it was calculated.** `14 contributors with an AI trace / 86 contributors = 16.3%`

**Sample.** 86 of 86 contributors (100.0% coverage).

**Caveats.**

- This is a floor, not a measurement. It counts only work where a tool chose to leave a trace in commit metadata, and every one of those traces can be switched off in a single setting.
- Anyone who disabled their tool's commit trailer appears here as a non-adopter, so this understates adoption in exactly the population most comfortable changing settings.
- 30 contributor(s) with 10 or more commits show no trace at all. Compare that list against issued licences: the gap is either an enablement opportunity or a renewal to cancel.

**Strongest evidence.**

1. **Sterling Chin: 97% of 35 commits carry a trace** (97 % of own commits traced)
   The heaviest observable adoption in scope. Useful as an enablement example for colleagues — not as a ranking, since a suppressed trailer is indistinguishable from non-use.
   Record: `org:org:all` — Sterling Chin shows a trace on 97% of their commits

2. **matt abrams: 94% of 31 commits carry a trace** (94 % of own commits traced)
   The heaviest observable adoption in scope. Useful as an enablement example for colleagues — not as a ranking, since a suppressed trailer is indistinguishable from non-use.
   Record: `org:org:all` — matt abrams shows a trace on 94% of their commits

3. **Claude: 63% of 57 commits carry a trace** (63 % of own commits traced)
   The heaviest observable adoption in scope. Useful as an enablement example for colleagues — not as a ranking, since a suppressed trailer is indistinguishable from non-use.
   Record: `org:org:all` — Claude shows a trace on 63% of their commits

4. **Shashank2577: 47% of 961 commits carry a trace** (47 % of own commits traced)
   The heaviest observable adoption in scope. Useful as an enablement example for colleagues — not as a ranking, since a suppressed trailer is indistinguishable from non-use.
   Record: `org:org:all` — Shashank2577 shows a trace on 47% of their commits

5. **Engineering Core: 44% of 3167 commits carry a trace** (44 % of own commits traced)
   The heaviest observable adoption in scope. Useful as an enablement example for colleagues — not as a ranking, since a suppressed trailer is indistinguishable from non-use.
   Record: `org:org:all` — Engineering Core shows a trace on 44% of their commits

**Underlying records (14 shown).**

- `org:org:all` — Engineering Core: 1408 of 3167 commits carry a trace
- `org:org:all` — Shashank2577: 451 of 961 commits carry a trace
- `org:org:all` — Claude: 36 of 57 commits carry a trace
- `org:org:all` — Sterling Chin: 34 of 35 commits carry a trace
- `org:org:all` — matt abrams: 29 of 31 commits carry a trace
- `org:org:all` — Steve Sewell: 28 of 793 commits carry a trace
- `org:org:all` — tashfeenahmed: 8 of 81 commits carry a trace
- `org:org:all` — Madison Dickson: 6 of 6 commits carry a trace
- `org:org:all` — prdeepak: 4 of 4 commits carry a trace
- `org:org:all` — claude[bot]: 4 of 89 commits carry a trace
- `org:org:all` — Peter Vanhee: 1 of 1 commits carry a trace
- `org:org:all` — Shannon Duncan: 1 of 1 commits carry a trace

---

#### Share of AI traces from the single most-used tool: **99.8%**

`ai.tool_concentration` · confidence **medium** · inferred (read from optional signals a tool may not leave)

**What this means.** Of all the AI signatures found, this share came from one tool. It shows whether the organisation has settled on a standard or has several tools in parallel use.

**Why it matters.** Tool sprawl costs money in duplicate licences and costs more in fragmented practice — prompts, conventions and lessons do not transfer between tools. It also tells you which vendor relationship actually matters at renewal time.

**How to read it.** Near 100% means one tool dominates, which simplifies both purchasing and enablement. A spread across three or more suggests adoption happened bottom-up without a decision.

**How it was calculated.** `2,009 traces from Claude Code / 2,013 traces = 99.8%`

**Sample.** 8,111 of 8,669 commits (93.56% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Caveats.**

- This is a floor, not a measurement. It counts only work where a tool chose to leave a trace in commit metadata, and every one of those traces can be switched off in a single setting.
- Tools differ enormously in how readily they leave a trace, so this reflects trace-leaving behaviour at least as much as actual usage. A quiet tool looks unused.

**Strongest evidence.**

1. **Claude Code: 2,009 traces (100% of all traces)** (2,009 traces, 99.8% of the total)
   The tool mix is what a licence renewal conversation actually turns on, and each figure is a count of literal signatures rather than an estimate.
   Record: `org:org:all` — Claude Code accounts for 2,009 traces

2. **Cursor: 2 traces (0% of all traces)** (2 traces, 0.1% of the total)
   The tool mix is what a licence renewal conversation actually turns on, and each figure is a count of literal signatures rather than an estimate.
   Record: `org:org:all` — Cursor accounts for 2 traces

3. **OpenAI Codex: 1 traces (0% of all traces)** (1 traces)
   The tool mix is what a licence renewal conversation actually turns on, and each figure is a count of literal signatures rather than an estimate.
   Record: `org:org:all` — OpenAI Codex accounts for 1 traces

4. **GitHub Copilot: 1 traces (0% of all traces)** (1 traces)
   The tool mix is what a licence renewal conversation actually turns on, and each figure is a count of literal signatures rather than an estimate.
   Record: `org:org:all` — GitHub Copilot accounts for 1 traces

**Underlying records (4 shown).**

- `org:org:all` — Claude Code: 2,009 traces
- `org:org:all` — Cursor: 2 traces
- `org:org:all` — OpenAI Codex: 1 traces
- `org:org:all` — GitHub Copilot: 1 traces

---

#### Rework gap between AI-traced and untraced work: **0.4%**

`ai.rework_delta` · confidence **low** · inferred (read from optional signals a tool may not leave)

**What this means.** Whether code arriving with an AI signature gets rewritten more or less often than the rest. A positive number means AI-traced work needed more revisiting than other work.

**Why it matters.** It is the most direct available answer to 'is AI-assisted code holding up?'. If speed arrives with a rework penalty, the net productivity gain is smaller than the velocity chart implies, and that is exactly the arithmetic a leadership team needs.

**How to read it.** Treat anything within a few percentage points as noise. Look for a consistent gap that persists across several quarters, then confirm it on one specific repository with named examples before acting on it.

**How it was calculated.** `rework in AI-traced (10.3%) - rework in untraced (9.9%) = 0.4 points`

**Sample.** 6,208,167 of 6,208,167 added lines with a cohort (100.0% coverage).

**Caveats.**

- This is a correlation between two rough proxies, not a causal finding. The people using AI tools most heavily are often also working on the least familiar code, which on its own would produce this gap.
- The AI-assisted side of this comparison is only the work where a tool left a trace in commit metadata, and any developer can switch that trace off. The cohort is therefore smaller than the real one, which widens the uncertainty on this difference in both directions.
- Both cohorts need enough volume for this comparison to mean anything. Here the AI-traced cohort contributed 1,483,521 lines and the untraced cohort 4,724,646.

**Strongest evidence.**

1. **workflow_editor.tsx: 2,551 AI-traced lines rewritten after 10 days** (2,551 lines rewritten)
   A named, checkable instance of AI-traced work being redone. Several of these in the same area is what turns a statistical gap into an actionable finding.
   Record: [apps/rowboat/app/projects/[projectId]/workflow/workflow_editor.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/app/projects/[projectId]/workflow/workflow_editor.tsx) — AI-traced origin 25de58d4 rewritten by e247575e

2. **entity_list.tsx: 2,154 AI-traced lines rewritten after 10 days** (2,154 lines rewritten)
   A named, checkable instance of AI-traced work being redone. Several of these in the same area is what turns a statistical gap into an actionable finding.
   Record: [apps/rowboat/app/projects/[projectId]/workflow/entity_list.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/app/projects/[projectId]/workflow/entity_list.tsx) — AI-traced origin 25de58d4 rewritten by e247575e

3. **agents.ts: 1,578 AI-traced lines rewritten after 10 days** (1,578 lines rewritten)
   A named, checkable instance of AI-traced work being redone. Several of these in the same area is what turns a statistical gap into an actionable finding.
   Record: [apps/rowboat/src/application/lib/agents-runtime/agents.ts](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/src/application/lib/agents-runtime/agents.ts) — AI-traced origin 25de58d4 rewritten by e247575e

4. **prompt-input.tsx: 1,413 AI-traced lines rewritten after 10 days** (1,413 lines rewritten)
   A named, checkable instance of AI-traced work being redone. Several of these in the same area is what turns a statistical gap into an actionable finding.
   Record: [apps/rowboatx/components/ai-elements/prompt-input.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboatx/components/ai-elements/prompt-input.tsx) — AI-traced origin 25de58d4 rewritten by e247575e

5. **example_multi_agent_1.ts: 1,329 AI-traced lines rewritten after 10 days** (1,329 lines rewritten)
   A named, checkable instance of AI-traced work being redone. Several of these in the same area is what turns a statistical gap into an actionable finding.
   Record: [apps/rowboat/src/application/lib/copilot/example_multi_agent_1.ts](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/src/application/lib/copilot/example_multi_agent_1.ts) — AI-traced origin 25de58d4 rewritten by e247575e

**Underlying records (10 shown).**

- Shashank2577/spreix-boat [apps/rowboat/app/projects/[projectId]/workflow/workflow_editor.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/app/projects/[projectId]/workflow/workflow_editor.tsx) — 2,551 lines from an AI-traced commit rewritten 10 days later
- Shashank2577/spreix-boat [apps/rowboat/app/projects/[projectId]/workflow/entity_list.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/app/projects/[projectId]/workflow/entity_list.tsx) — 2,154 lines from an AI-traced commit rewritten 10 days later
- Shashank2577/spreix-boat [apps/rowboat/src/application/lib/agents-runtime/agents.ts](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/src/application/lib/agents-runtime/agents.ts) — 1,578 lines from an AI-traced commit rewritten 10 days later
- Shashank2577/spreix-boat [apps/rowboatx/components/ai-elements/prompt-input.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboatx/components/ai-elements/prompt-input.tsx) — 1,413 lines from an AI-traced commit rewritten 10 days later
- Shashank2577/spreix-boat [apps/rowboat/src/application/lib/copilot/example_multi_agent_1.ts](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/src/application/lib/copilot/example_multi_agent_1.ts) — 1,329 lines from an AI-traced commit rewritten 10 days later
- Shashank2577/prompture [docs/superpowers/plans/2026-05-13-frontend-implementation.md](https://github.com/Shashank2577/prompture/blob/main/docs/superpowers/plans/2026-05-13-frontend-implementation.md) — 1,112 lines from an AI-traced commit rewritten 0 days later
- Shashank2577/spreix-boat [apps/rowboatx/app/page.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboatx/app/page.tsx) — 1,045 lines from an AI-traced commit rewritten 10 days later
- Shashank2577/spreix-boat [apps/rowboat/app/projects/[projectId]/playground/components/messages.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/app/projects/[projectId]/playground/components/messages.tsx) — 967 lines from an AI-traced commit rewritten 10 days later
- Shashank2577/spreix-boat [apps/rowboat/app/projects/[projectId]/workflow/components/TopBar.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/app/projects/[projectId]/workflow/components/TopBar.tsx) — 920 lines from an AI-traced commit rewritten 10 days later
- Shashank2577/spreix-boat [apps/rowboat/app/projects/[projectId]/entities/datasource_config.tsx](https://github.com/Shashank2577/spreix-boat/blob/main/apps/rowboat/app/projects/[projectId]/entities/datasource_config.tsx) — 909 lines from an AI-traced commit rewritten 10 days later

---

#### Test-ratio gap between AI-traced and untraced work: **8.2%**

`ai.test_ratio_delta` · confidence **low** · inferred (read from optional signals a tool may not leave)

**What this means.** Whether changes carrying an AI signature include proportionally more or fewer tests than other changes. A negative number means AI-traced work came with fewer tests.

**Why it matters.** AI tools are demonstrably good at writing tests when asked. If this gap is negative, the problem is workflow rather than capability — people are not asking — and that is a cheap fix with a large payoff.

**How to read it.** A positive gap is a genuinely good sign worth publicising internally. A strongly negative gap alongside high AI adoption is the clearest 'act now' combination in this report.

**How it was calculated.** `test ratio in AI-traced (17.5%) - in untraced (9.3%) = 8.2 points`

**Sample.** 8,111 of 8,669 commits (93.56% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Caveats.**

- The AI-assisted side of this comparison is only the work where a tool left a trace in commit metadata, and any developer can switch that trace off. The cohort is therefore smaller than the real one, which widens the uncertainty on this difference in both directions.
- Confounded by the kind of work people choose AI for. Exploratory work legitimately carries fewer tests regardless of how it was written.

**Strongest evidence.**

1. **Shashank2577/oh-my-design b2b5b040 — 11,425 AI-traced product lines, no tests** (11,425 untested product lines)
   AI tools write tests well when asked. A commit like this is evidence the asking is not happening, which is a workflow fix rather than a tooling limit.
   Record: [b2b5b040f6](https://github.com/Shashank2577/oh-my-design/commit/b2b5b040f6e24237c3347a2e5e237bf0c0994517) — 11,425 product lines, zero test lines

2. **Shashank2577/OBSERVE 82e5647f — 9,212 AI-traced product lines, no tests** (9,212 untested product lines)
   AI tools write tests well when asked. A commit like this is evidence the asking is not happening, which is a workflow fix rather than a tooling limit.
   Record: [82e5647f2f](https://github.com/Shashank2577/OBSERVE/commit/82e5647f2f671030c2ea55325d45deeed4f6b3bd) — 9,212 product lines, zero test lines

3. **Shashank2577/clickup 62eab49d — 7,359 AI-traced product lines, no tests** (7,359 untested product lines)
   AI tools write tests well when asked. A commit like this is evidence the asking is not happening, which is a workflow fix rather than a tooling limit.
   Record: [62eab49da0](https://github.com/Shashank2577/clickup/commit/62eab49da0f9c001b306b08fa7a02f3028a797f6) — 7,359 product lines, zero test lines

4. **Shashank2577/ai-cos bc28998a — 6,214 AI-traced product lines, no tests** (6,214 untested product lines)
   AI tools write tests well when asked. A commit like this is evidence the asking is not happening, which is a workflow fix rather than a tooling limit.
   Record: [bc28998a3b](https://github.com/Shashank2577/ai-cos/commit/bc28998a3be6b65b78d9b8fc9c08c55a6a770174) — 6,214 product lines, zero test lines

5. **Shashank2577/spreix-notetaker ac515c2b — 5,706 AI-traced product lines, no tests** (5,706 untested product lines)
   AI tools write tests well when asked. A commit like this is evidence the asking is not happening, which is a workflow fix rather than a tooling limit.
   Record: [ac515c2b36](https://github.com/Shashank2577/spreix-notetaker/commit/ac515c2b36a451618c745f7b24fa2152310ede8d) — 5,706 product lines, zero test lines

**Underlying records (10 shown).**

- Shashank2577/oh-my-design [b2b5b040f6](https://github.com/Shashank2577/oh-my-design/commit/b2b5b040f6e24237c3347a2e5e237bf0c0994517) — AI-traced, 11,425 product lines, no tests
- Shashank2577/OBSERVE [82e5647f2f](https://github.com/Shashank2577/OBSERVE/commit/82e5647f2f671030c2ea55325d45deeed4f6b3bd) — AI-traced, 9,212 product lines, no tests
- Shashank2577/clickup [62eab49da0](https://github.com/Shashank2577/clickup/commit/62eab49da0f9c001b306b08fa7a02f3028a797f6) — AI-traced, 7,359 product lines, no tests
- Shashank2577/ai-cos [bc28998a3b](https://github.com/Shashank2577/ai-cos/commit/bc28998a3be6b65b78d9b8fc9c08c55a6a770174) — AI-traced, 6,214 product lines, no tests
- Shashank2577/spreix-notetaker [ac515c2b36](https://github.com/Shashank2577/spreix-notetaker/commit/ac515c2b36a451618c745f7b24fa2152310ede8d) — AI-traced, 5,706 product lines, no tests
- Shashank2577/clickup [1da709bc25](https://github.com/Shashank2577/clickup/commit/1da709bc251deea1aba01c6d9eafaa3a00da01ce) — AI-traced, 5,653 product lines, no tests
- Shashank2577/spreix-notetaker [6eba919297](https://github.com/Shashank2577/spreix-notetaker/commit/6eba919297e5ae8e3fc511e7226c292e3d65b569) — AI-traced, 5,363 product lines, no tests
- Shashank2577/agent-native-deploy [5ff29ba9ae](https://github.com/Shashank2577/agent-native-deploy/commit/5ff29ba9ae3c0a74bc32c1bb05fa79dc2199cc37) — AI-traced, 5,353 product lines, no tests
- Shashank2577/clickup [baa131ae13](https://github.com/Shashank2577/clickup/commit/baa131ae13a295a4f7dfb1e4a0c96eb5409f109f) — AI-traced, 4,348 product lines, no tests
- Shashank2577/Nexus-BE [cd7965e685](https://github.com/Shashank2577/Nexus-BE/commit/cd7965e6850e607919e69ab5632e324a61bae61a) — AI-traced, 4,247 product lines, no tests

---

#### Size gap between AI-traced and untraced commits: **211.7%**

`ai.commit_size_delta` · confidence **low** · inferred (read from optional signals a tool may not leave)

**What this means.** Whether changes carrying an AI signature tend to be bigger or smaller than other changes, expressed as a percentage difference in typical size.

**Why it matters.** Larger changes are harder to review, so if AI-assisted work is systematically bigger then AI adoption quietly increases review burden. That cost usually lands on senior engineers and is rarely accounted for in the productivity case.

**How to read it.** A large positive number means review capacity needs to grow alongside AI adoption. Combine with review coverage to see whether it already failed to.

**How it was calculated.** `median AI-traced size (187) vs untraced (60) = 211.7% difference`

**Sample.** 6,674 of 8,669 commits (76.99% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Caveats.**

- The AI-assisted side of this comparison is only the work where a tool left a trace in commit metadata, and any developer can switch that trace off. The cohort is therefore smaller than the real one, which widens the uncertainty on this difference in both directions.
- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.
- Computed over 6,674 of 8,669 commits (77% coverage) — see the exclusion list for what was left out.

**Underlying records (1 shown).**

- `org:org:all` — median size compared across 1,904 AI-traced and 4,770 untraced commits

---

#### AI tool configuration files present: **37**

`ai.config_artifact_count` · confidence **high** · measured (counted directly from records)

**What this means.** AI coding tools often keep a settings or instructions file in the repository — files named CLAUDE.md, .cursorrules, copilot-instructions.md and similar. This counts how many are present.

**Why it matters.** Unlike commit traces, these files cannot be switched off without deleting them, so they are an independent corroborating signal. A repository with a tool config file and a zero commit-trace rate is strong evidence that traces are being suppressed rather than that the tool is unused.

**How to read it.** Presence proves a tool was deliberately set up for this repository. Absence proves nothing, since most usage needs no configuration file at all.

**How it was calculated.** `count(files matching known AI tool config patterns) = 37`

**Sample.** 76 of 76 repositories (100.0% coverage).

**Assumptions.**

- Patterns are listed in config/ai_signatures.yaml under artifact_files and are matched against the current checkout of the default branch only.

**Strongest evidence.**

1. **Shashank2577/reporadar contains AGENTS.md** (1 file)
   This file was deliberately committed, and unlike a commit trailer it cannot be switched off in a setting. It is independent proof the tool was set up here.
   Record: [AGENTS.md](https://github.com/Shashank2577/reporadar/blob/main/AGENTS.md) — AI tool configuration file committed to the repository

2. **Shashank2577/reporadar contains CLAUDE.md** (1 file)
   This file was deliberately committed, and unlike a commit trailer it cannot be switched off in a setting. It is independent proof the tool was set up here.
   Record: [CLAUDE.md](https://github.com/Shashank2577/reporadar/blob/main/CLAUDE.md) — AI tool configuration file committed to the repository

3. **Shashank2577/sovix-evidence contains AGENTS.md** (1 file)
   This file was deliberately committed, and unlike a commit trailer it cannot be switched off in a setting. It is independent proof the tool was set up here.
   Record: [AGENTS.md](https://github.com/Shashank2577/sovix-evidence/blob/main/AGENTS.md) — AI tool configuration file committed to the repository

4. **Shashank2577/OBSERVE contains AGENTS.md** (1 file)
   This file was deliberately committed, and unlike a commit trailer it cannot be switched off in a setting. It is independent proof the tool was set up here.
   Record: [AGENTS.md](https://github.com/Shashank2577/OBSERVE/blob/master/AGENTS.md) — AI tool configuration file committed to the repository

5. **Shashank2577/OBSERVE contains CLAUDE.md** (1 file)
   This file was deliberately committed, and unlike a commit trailer it cannot be switched off in a setting. It is independent proof the tool was set up here.
   Record: [CLAUDE.md](https://github.com/Shashank2577/OBSERVE/blob/master/CLAUDE.md) — AI tool configuration file committed to the repository

**Underlying records (37 shown).**

- Shashank2577/reporadar [AGENTS.md](https://github.com/Shashank2577/reporadar/blob/main/AGENTS.md) — AI tool configuration file present on the default branch
- Shashank2577/reporadar [CLAUDE.md](https://github.com/Shashank2577/reporadar/blob/main/CLAUDE.md) — AI tool configuration file present on the default branch
- Shashank2577/sovix-evidence [AGENTS.md](https://github.com/Shashank2577/sovix-evidence/blob/main/AGENTS.md) — AI tool configuration file present on the default branch
- Shashank2577/OBSERVE [AGENTS.md](https://github.com/Shashank2577/OBSERVE/blob/master/AGENTS.md) — AI tool configuration file present on the default branch
- Shashank2577/OBSERVE [CLAUDE.md](https://github.com/Shashank2577/OBSERVE/blob/master/CLAUDE.md) — AI tool configuration file present on the default branch
- Shashank2577/prompture [.claude/settings.json](https://github.com/Shashank2577/prompture/blob/main/.claude/settings.json) — AI tool configuration file present on the default branch
- Shashank2577/prompture [AGENTS.md](https://github.com/Shashank2577/prompture/blob/main/AGENTS.md) — AI tool configuration file present on the default branch
- Shashank2577/prompture [CLAUDE.md](https://github.com/Shashank2577/prompture/blob/main/CLAUDE.md) — AI tool configuration file present on the default branch
- Shashank2577/backlot [.claude/settings.json](https://github.com/Shashank2577/backlot/blob/main/.claude/settings.json) — AI tool configuration file present on the default branch
- Shashank2577/backlot [CLAUDE.md](https://github.com/Shashank2577/backlot/blob/main/CLAUDE.md) — AI tool configuration file present on the default branch
- Shashank2577/spreix-platform [AGENTS.md](https://github.com/Shashank2577/spreix-platform/blob/main/AGENTS.md) — AI tool configuration file present on the default branch
- Shashank2577/spreix-platform [CLAUDE.md](https://github.com/Shashank2577/spreix-platform/blob/main/CLAUDE.md) — AI tool configuration file present on the default branch

---

#### Share of AI suggestions actually accepted: **not available**

`ai.native_acceptance_rate` · confidence **high** · measured (counted directly from records)

**What this means.** When an AI tool offers a suggestion, the developer either takes it or ignores it. This is the share that was taken, recorded by the tool itself rather than guessed from the change history.

**Why it matters.** It is the clearest measure of whether the tools are actually useful to the people holding the licences. A low rate means suggestions are not good enough to accept, which is a training or configuration problem rather than a reason to cancel.

**How to read it.** Twenty to thirty percent is the commonly reported band. Very low means the tool is interrupting more than helping. Very high can mean people are accepting without reading, which shows up later as rework.

**How it was calculated.** `0 lines accepted / 0 lines suggested = not available%`

**Sample.** 0 of 0 days of recorded telemetry (0.0% coverage).

**Assumptions.**

- Counted from the export you supplied, over the dates that export covers.

**Caveats.**

- Covers only the window the tool's telemetry was switched on for. Everything before that date was never recorded and cannot be recovered.
- No value could be computed: the underlying records for this metric are absent in this scope. Reported as 'not available' rather than zero, because zero would be a different and false claim.

**No underlying records.** No tool analytics were imported. Export them and re-run with --native-analytics to turn the AI figures in this report from a floor into a measurement: `gh api /orgs/ORG/copilot/metrics > copilot.json` for Copilot, or the Cursor Admin API's daily usage endpoint. Neither export is retroactive — they cover only the dates telemetry was switched on.

---

#### Lines accepted from AI suggestions (measured): **not available**

`ai.native_lines_accepted` · confidence **high** · measured (counted directly from records)

**What this means.** How many lines of code developers took from AI suggestions, as counted by the tool that made them. Unlike everything else in this section, this is a measurement rather than an inference.

**Why it matters.** This is the number people think they are asking for when they ask how much code is AI-written. It is the only figure in the report that can answer it directly, and it only exists for the period the tool was recording.

**How to read it.** Compare it against total lines added over the same window to get a real share. Note that accepted does not mean survived — read it next to the rework rate.

**How it was calculated.** `sum(accepted lines across 0 days of recorded telemetry) = not available`

**Sample.** 0 of 0 days of recorded telemetry (0.0% coverage).

**Caveats.**

- Accepted at the moment of typing. A line accepted and then deleted an hour later still counts here, so this is an upper bound on AI-authored code that survived.
- Only covers the dates present in the export.
- No value could be computed: the underlying records for this metric are absent in this scope. Reported as 'not available' rather than zero, because zero would be a different and false claim.

**No underlying records.** No tool analytics were imported. Export them and re-run with --native-analytics to turn the AI figures in this report from a floor into a measurement: `gh api /orgs/ORG/copilot/metrics > copilot.json` for Copilot, or the Cursor Admin API's daily usage endpoint. Neither export is retroactive — they cover only the dates telemetry was switched on.

---

#### How far the commit-trace floor understates measured AI use: **not available**

`ai.floor_understatement` · confidence **medium** · measured (counted directly from records)

**What this means.** This report's main AI figures are a floor, built from signatures that tools optionally leave behind. Where a tool's own records are available for the same period, this compares the two and shows how many times larger the recorded figure is.

**Why it matters.** It puts a number on the report's biggest known weakness. If the floor understates real usage threefold, then every historical AI figure in here should be read with that multiplier in mind — and that is a far more useful thing to tell leadership than either figure alone.

**How to read it.** A value of 1.0 means the floor was about right; 3.0 means recorded usage was three times the floor. Anything well above 1 is evidence that commit signatures are being suppressed or never emitted, and that the historical trend is understated rather than wrong.

**How it was calculated.** `measured share over the covered window (not available%) / trace-based floor (not available%) = not availablex`

**Sample.** 0 of 0 days of recorded telemetry (0.0% coverage).

**Assumptions.**

- Both figures are restricted to the dates the export covers, so they describe the same period.

**Caveats.**

- The two sides count different things: one counts lines accepted at typing time, the other counts lines arriving in commits that carried a signature. The ratio is an indication of scale, not a precise correction factor.
- Only computable for the window the tool's telemetry covers.
- No value could be computed: the underlying records for this metric are absent in this scope. Reported as 'not available' rather than zero, because zero would be a different and false claim.

**No underlying records.** No tool analytics were imported. Export them and re-run with --native-analytics to turn the AI figures in this report from a floor into a measurement: `gh api /orgs/ORG/copilot/metrics > copilot.json` for Copilot, or the Cursor Admin API's daily usage endpoint. Neither export is retroactive — they cover only the dates telemetry was switched on.

---

### People and knowledge

*Who is contributing, how concentrated the knowledge is, and where the organisation is exposed if a specific person becomes unavailable.*

#### Active contributors: **80**

`people.active_contributors` · confidence **high** · measured (counted directly from records)

**What this means.** How many distinct people saved work to this codebase during the period, after merging the several email addresses one person often uses and removing automated accounts.

**Why it matters.** This is the real staffing level, as opposed to the planned one. Comparing it against the team roster frequently reveals that fewer people are actually in the code than anyone believed, which reframes a delivery conversation immediately.

**How to read it.** Compare against the roster for this project. Persistently lower means the plan and the reality have diverged, and the plan is the thing that is wrong.

**How it was calculated.** `count(distinct human contributors after identity merge) = 80`

**Sample.** 80 of 87 commit authors (91.95% coverage).

Excluded from this metric:

- automated accounts (bots, CI, dependency updaters) — 7

**Assumptions.**

- Identities are merged by email address first, then by normalised display name, using any explicit alias rules in config/identities.yaml. Bot accounts are excluded by pattern.

**Caveats.**

- Pair and ensemble programming credit a single author for several people's work.
- If the team squash-merges pull requests, many individual commits collapse into one. Per-commit counts are then lower than the work actually done, and individual authorship inside a squashed change is lost entirely.

**Strongest evidence.**

1. **Engineering Core appears under 4 git addresses, merged into one person** (4 git addresses merged)
   Without this merge the contributor count would be inflated and the bus factor would look healthier than it is. The addresses are listed so the merge can be checked.
   Record: `org:org:all` — Engineering Core committed under 4 addresses

2. **agent-native appears under 2 git addresses, merged into one person** (2 git addresses merged)
   Without this merge the contributor count would be inflated and the bus factor would look healthier than it is. The addresses are listed so the merge can be checked.
   Record: `org:org:all` — agent-native committed under 2 addresses

3. **David Ignjic appears under 2 git addresses, merged into one person** (2 git addresses merged)
   Without this merge the contributor count would be inflated and the bus factor would look healthier than it is. The addresses are listed so the merge can be checked.
   Record: `org:org:all` — David Ignjic committed under 2 addresses

4. **Madison Dickson appears under 2 git addresses, merged into one person** (2 git addresses merged)
   Without this merge the contributor count would be inflated and the bus factor would look healthier than it is. The addresses are listed so the merge can be checked.
   Record: `org:org:all` — Madison Dickson committed under 2 addresses

5. **matt abrams appears under 2 git addresses, merged into one person** (2 git addresses merged)
   Without this merge the contributor count would be inflated and the bus factor would look healthier than it is. The addresses are listed so the merge can be checked.
   Record: `org:org:all` — matt abrams committed under 2 addresses

**Underlying records (80 shown).**

- `org:org:all` — Engineering Core: 3,167 commits
- `org:org:all` — Shashank2577: 961 commits
- `org:org:all` — Steve Sewell: 793 commits
- `org:org:all` — reporadar-bot: 738 commits
- `org:org:all` — shashanksaxena-tz: 535 commits
- `org:org:all` — David Ignjic: 183 commits
- `org:org:all` — Google AI Edge Gallery: 124 commits
- `org:org:all` — Shiva Kumar: 107 commits
- `org:org:all` — Tibor Gémes: 107 commits
- `org:org:all` — renovatebot runner: 97 commits
- `org:org:all` — Purushotam Thakur: 94 commits
- `org:org:all` — Jing Jin: 90 commits

---

#### Bus factor: people holding half the code: **2**

`people.bus_factor` · confidence **high** · measured (counted directly from records)

**What this means.** The smallest number of people who between them wrote half of all the code here. If that number is one, then a single person's departure — or holiday — takes half the working knowledge of this codebase with them.

**Why it matters.** It is a staffing risk expressed as a single number, and it is the metric most likely to change a hiring, documentation or pairing decision. Unlike most risks in this report it is cheap to fix once you know precisely where it sits.

**How to read it.** One or two is a genuine risk worth acting on this quarter. Three or more on a small team is reasonable. Read it alongside the contributor list: a bus factor of one on a one-person prototype is expected, not alarming.

**How it was calculated.** `smallest k where the top k contributors exceed 50% of 7,750,417 lines = 2`

**Sample.** 80 of 80 contributors (100.0% coverage).

**Assumptions.**

- Lines written stands in for knowledge held. Reviewers and architects who shaped the code without typing much of it are invisible to this measure, so it understates resilience on teams with strong review cultures.

**Caveats.**

- Lines of code measures volume, not value. A hard-won hundred-line fix and a thousand lines of boilerplate look the same here. This is not a basis for ranking people.
- If the team squash-merges pull requests, many individual commits collapse into one. Per-commit counts are then lower than the work actually done, and individual authorship inside a squashed change is lost entirely.

**Strongest evidence.**

1. **Engineering Core wrote 2,082,295 lines (26.9%) — running total 26.9%** (2,082,295 lines written, 26.9% of the total)
   These are the specific people whose combined work crosses the halfway mark. That makes this a concrete pairing and documentation plan rather than an abstract risk score.
   Record: `org:org:all` — Engineering Core holds 26.9% of the code; cumulative 26.9%

2. **Naveen Kumar wrote 1,855,079 lines (23.9%) — running total 50.8%** (1,855,079 lines written, 23.9% of the total)
   These are the specific people whose combined work crosses the halfway mark. That makes this a concrete pairing and documentation plan rather than an abstract risk score.
   Record: `org:org:all` — Naveen Kumar holds 23.9% of the code; cumulative 50.8%

**Underlying records (15 shown).**

- `org:org:all` — Engineering Core: 2,082,295 lines (26.9% of the total)
- `org:org:all` — Naveen Kumar: 1,855,079 lines (23.9% of the total)
- `org:org:all` — Steve Sewell: 1,588,623 lines (20.5% of the total)
- `org:org:all` — Oleksii Mitrov: 906,568 lines (11.7% of the total)
- `org:org:all` — Shashank2577: 523,687 lines (6.8% of the total)
- `org:org:all` — shashanksaxena-tz: 188,575 lines (2.4% of the total)
- `org:org:all` — Purushotam Thakur: 157,558 lines (2.0% of the total)
- `org:org:all` — David Ignjic: 54,447 lines (0.7% of the total)
- `org:org:all` — Google AI Edge Gallery: 49,989 lines (0.6% of the total)
- `org:org:all` — Shiva Kumar: 49,738 lines (0.6% of the total)
- `org:org:all` — Jing Jin: 28,258 lines (0.4% of the total)
- `org:org:all` — Shashank: 24,540 lines (0.3% of the total)

---

#### Share of the code written by one person: **26.9%**

`people.top_contributor_share` · confidence **high** · measured (counted directly from records)

**What this means.** How much of all the code in this period came from the single most prolific contributor.

**Why it matters.** It is the bus factor with the detail restored. A single person at 70% is a different conversation from three people at 25% each, even though both can produce the same bus factor, and the mitigation differs too.

**How to read it.** Above 50% on a team of several people means the work is not really shared, whatever the org chart says. On a solo project it is simply a fact rather than a finding.

**How it was calculated.** `2,082,295 lines from Engineering Core / 7,750,417 total lines = 26.9%`

**Sample.** 80 of 80 contributors (100.0% coverage).

**Caveats.**

- Lines of code measures volume, not value. A hard-won hundred-line fix and a thousand lines of boilerplate look the same here. This is not a basis for ranking people.
- This breaks down by individual. Published research and hard experience both show that per-person delivery metrics change behaviour once people can see themselves ranked. Use it to find where help is needed, not to compare colleagues.

**Strongest evidence.**

1. **Engineering Core wrote 26.9% of all code in scope across 3,167 commits** (2,082,295 lines written, 26.9% of the total)
   Concentration this high means reviews, holidays and handovers all route through one person. The remedy is redistributing new work, not measuring them.
   Record: `org:org:all` — Engineering Core: 2,082,295 of 7,750,417 lines

**Underlying records (10 shown).**

- Shashank2577/spreix-boat [25de58d45e](https://github.com/Shashank2577/spreix-boat/commit/25de58d45e83ef72c0eb8b68ae647ce0901e39c4) — 168,864 lines
- Shashank2577/spreix-notetaker [4d9b9f97c1](https://github.com/Shashank2577/spreix-notetaker/commit/4d9b9f97c1794a755c9880b7239097433268203e) — 94,316 lines
- Shashank2577/spreix-boat [e247575e84](https://github.com/Shashank2577/spreix-boat/commit/e247575e84320f1d86d23f02f07f057a85400952) — 69,972 lines
- Shashank2577/payload-utility [0b9f2c2a4b](https://github.com/Shashank2577/payload-utility/commit/0b9f2c2a4b1d5ab5ac8ff70dbab5c88f33f71677) — 48,945 lines
- Shashank2577/java-microservices-framework [cf3c1033d3](https://github.com/Shashank2577/java-microservices-framework/commit/cf3c1033d33fb968b6e503801a3962e1e34bcf42) — 46,886 lines
- Shashank2577/ai-cos [b1f860be5c](https://github.com/Shashank2577/ai-cos/commit/b1f860be5c4d4518642580b3ca7de264cf04e4cb) — 34,139 lines
- Shashank2577/cortex [b0f753b735](https://github.com/Shashank2577/cortex/commit/b0f753b7355a7b80ee1b89d95825166eb0a97562) — 31,961 lines
- Shashank2577/agent-native-deploy [3b4c23090f](https://github.com/Shashank2577/agent-native-deploy/commit/3b4c23090fb3076e5b5203cd2a3ce97a5c2653c9) — 26,907 lines
- Shashank2577/opencover-complete [2757f48e85](https://github.com/Shashank2577/opencover-complete/commit/2757f48e856435421f8df4fb7503273b34d4a0eb) — 24,263 lines
- Shashank2577/axon [feb0cbf6ef](https://github.com/Shashank2577/axon/commit/feb0cbf6efa6d02b788123bfe3a13c4f765edfea) — 18,512 lines

---

#### Share of work from people new to this codebase: **62.1%**

`people.newcomer_share` · confidence **high** · measured (counted directly from records)

**What this means.** How much of the work in this period came from people whose very first change to this codebase was less than 90 days ago.

**Why it matters.** Newcomer-heavy periods need more review capacity and reliably produce more rework. That is normal and temporary. Knowing the share explains a quality dip factually, without anyone having to be blamed for it.

**How to read it.** High values on a deliberately growing team are expected and fine. High values on a team that is supposed to be stable point at turnover worth understanding.

**How it was calculated.** `4,810,713 lines from contributors under 90 days / 7,750,417 lines = 62.1%`

**Sample.** 7,756 of 8,669 commits (89.47% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Caveats.**

- This measures tenure on this repository, not at the company. A twenty-year veteran joining a new project counts as a newcomer — which is the right reading for review load, and the wrong one for seniority.
- Computed over 7,756 of 8,669 commits (89% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Naveen Kumar contributed 1,855,079 lines in their first 90 days** (1,855,079 lines while new, 23.9% of the total)
   Expected and healthy on a growing team, but it predicts extra review load and extra rework in the same period. Worth reading the rework rate alongside this.
   Record: `org:org:all` — Naveen Kumar contributed 1,855,079 lines while new

2. **Steve Sewell contributed 1,588,623 lines in their first 90 days** (1,588,623 lines while new, 20.5% of the total)
   Expected and healthy on a growing team, but it predicts extra review load and extra rework in the same period. Worth reading the rework rate alongside this.
   Record: `org:org:all` — Steve Sewell contributed 1,588,623 lines while new

3. **Oleksii Mitrov contributed 906,568 lines in their first 90 days** (906,568 lines while new, 11.7% of the total)
   Expected and healthy on a growing team, but it predicts extra review load and extra rework in the same period. Worth reading the rework rate alongside this.
   Record: `org:org:all` — Oleksii Mitrov contributed 906,568 lines while new

4. **shashanksaxena-tz contributed 184,509 lines in their first 90 days** (184,509 lines while new, 2.4% of the total)
   Expected and healthy on a growing team, but it predicts extra review load and extra rework in the same period. Worth reading the rework rate alongside this.
   Record: `org:org:all` — shashanksaxena-tz contributed 184,509 lines while new

5. **Jing Jin contributed 26,831 lines in their first 90 days** (26,831 lines while new, 0.3% of the total)
   Expected and healthy on a growing team, but it predicts extra review load and extra rework in the same period. Worth reading the rework rate alongside this.
   Record: `org:org:all` — Jing Jin contributed 26,831 lines while new

**Underlying records (12 shown).**

- `org:org:all` — Naveen Kumar: 1,855,079 lines within 90 days of their first commit
- `org:org:all` — Steve Sewell: 1,588,623 lines within 90 days of their first commit
- `org:org:all` — Oleksii Mitrov: 906,568 lines within 90 days of their first commit
- `org:org:all` — shashanksaxena-tz: 184,509 lines within 90 days of their first commit
- `org:org:all` — Jing Jin: 26,831 lines within 90 days of their first commit
- `org:org:all` — Google AI Edge Gallery: 26,393 lines within 90 days of their first commit
- `org:org:all` — Shashank: 24,540 lines within 90 days of their first commit
- `org:org:all` — reporadar-bot: 24,065 lines within 90 days of their first commit
- `org:org:all` — Z User: 22,660 lines within 90 days of their first commit
- `org:org:all` — Vishwas: 20,429 lines within 90 days of their first commit
- `org:org:all` — tashfeenahmed: 18,690 lines within 90 days of their first commit
- `org:org:all` — Ubuntu: 15,804 lines within 90 days of their first commit

---

#### Share of files only one person has ever touched: **81.5%**

`people.knowledge_silo_share` · confidence **high** · measured (counted directly from records)

**What this means.** The share of code files that exactly one person has ever edited. Nobody else has seen them closely enough to have changed anything in them.

**Why it matters.** This is the bus factor at file resolution, which makes it actionable: it produces an actual list of files needing a second reader. It is also where incidents become long incidents, because the only person who understands the code may be asleep.

**How to read it.** Some single-owner files are inevitable and harmless. Above 50% means the codebase is a collection of private territories rather than shared property, and reviewing will not fix it on its own — deliberate pairing will.

**How it was calculated.** `32,517 files with exactly one distinct author / 39,895 files = 81.5%`

**Sample.** 39,895 of 39,895 files touched (100.0% coverage).

**Assumptions.**

- Authorship comes from commit history within the collected window. A file written years ago by someone who has left, and untouched since, counts as single-owner.

**Caveats.**

- Generated and configuration files inflate this, since one person typically sets them up and nobody needs to return to them.

**Strongest evidence.**

1. **cheetah/modules/assets/vendors/pdfjs-dist/1.3.72/pdf.combined.js — 47,195 lines, one author ever: Naveen Kumar** (47,195 lines in a single-owner file)
   The busiest file in scope that nobody else has ever edited. If this person is unavailable during an incident here, there is no second reader. This is a named, finite list — pairing on these files closes the risk.
   Record: [cheetah/modules/assets/vendors/pdfjs-dist/1.3.72/pdf.combined.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/pdfjs-dist/1.3.72/pdf.combined.js) — single owner: Naveen Kumar

2. **cheetah/dashboards/common/assets/vendors/angular/1.5.9/angular-scenario.js — 44,757 lines, one author ever: Naveen Kumar** (44,757 lines in a single-owner file)
   The busiest file in scope that nobody else has ever edited. If this person is unavailable during an incident here, there is no second reader. This is a named, finite list — pairing on these files closes the risk.
   Record: [cheetah/dashboards/common/assets/vendors/angular/1.5.9/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.5.9/angular-scenario.js) — single owner: Naveen Kumar

3. **cheetah/dashboards/common/assets/vendors/angular/1.5.6/angular-scenario.js — 43,097 lines, one author ever: Naveen Kumar** (43,097 lines in a single-owner file)
   The busiest file in scope that nobody else has ever edited. If this person is unavailable during an incident here, there is no second reader. This is a named, finite list — pairing on these files closes the risk.
   Record: [cheetah/dashboards/common/assets/vendors/angular/1.5.6/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.5.6/angular-scenario.js) — single owner: Naveen Kumar

4. **cheetah/dashboards/common/assets/vendors/angular/1.4.8/angular-scenario.js — 40,439 lines, one author ever: Naveen Kumar** (40,439 lines in a single-owner file)
   The busiest file in scope that nobody else has ever edited. If this person is unavailable during an incident here, there is no second reader. This is a named, finite list — pairing on these files closes the risk.
   Record: [cheetah/dashboards/common/assets/vendors/angular/1.4.8/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.8/angular-scenario.js) — single owner: Naveen Kumar

5. **cheetah/dashboards/common/assets/vendors/angular/1.4.7/angular-scenario.js — 40,324 lines, one author ever: Naveen Kumar** (40,324 lines in a single-owner file)
   The busiest file in scope that nobody else has ever edited. If this person is unavailable during an incident here, there is no second reader. This is a named, finite list — pairing on these files closes the risk.
   Record: [cheetah/dashboards/common/assets/vendors/angular/1.4.7/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/angular-scenario.js) — single owner: Naveen Kumar

**Underlying records (12 shown).**

- Shashank2577/um [cheetah/modules/assets/vendors/pdfjs-dist/1.3.72/pdf.combined.js](https://github.com/Shashank2577/um/blob/master/cheetah/modules/assets/vendors/pdfjs-dist/1.3.72/pdf.combined.js) — only Naveen Kumar has ever touched this file (47,195 lines)
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.5.9/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.5.9/angular-scenario.js) — only Naveen Kumar has ever touched this file (44,757 lines)
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.5.6/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.5.6/angular-scenario.js) — only Naveen Kumar has ever touched this file (43,097 lines)
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.8/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.8/angular-scenario.js) — only Naveen Kumar has ever touched this file (40,439 lines)
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/angular-scenario.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/angular-scenario.js) — only Naveen Kumar has ever touched this file (40,324 lines)
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/pdfjs-dist/1.3.72/pdf.worker.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/pdfjs-dist/1.3.72/pdf.worker.js) — only Naveen Kumar has ever touched this file (40,074 lines)
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/pdfjs-dist/1.1.215/pdf.worker.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/pdfjs-dist/1.1.215/pdf.worker.js) — only Naveen Kumar has ever touched this file (39,430 lines)
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.5.9/angular.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.5.9/angular.js) — only Naveen Kumar has ever touched this file (32,384 lines)
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.5.6/angular.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.5.6/angular.js) — only Naveen Kumar has ever touched this file (31,023 lines)
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.8/angular.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.8/angular.js) — only Naveen Kumar has ever touched this file (29,018 lines)
- Shashank2577/um [cheetah/dashboards/common/assets/vendors/angular/1.4.7/angular.js](https://github.com/Shashank2577/um/blob/master/cheetah/dashboards/common/assets/vendors/angular/1.4.7/angular.js) — only Naveen Kumar has ever touched this file (28,904 lines)
- Shashank2577/sovix-evidence [specs/001-sovix-evidence/contracts/openapi.json](https://github.com/Shashank2577/sovix-evidence/blob/main/specs/001-sovix-evidence/contracts/openapi.json) — only Shashank2577 has ever touched this file (23,583 lines)

---

#### Share of contributors still active in the last 90 days: **10.0%**

`people.contributor_retention` · confidence **high** · measured (counted directly from records)

**What this means.** Of everyone who has ever contributed to this codebase in the collected period, the share who were still contributing within the last three months.

**Why it matters.** It distinguishes a codebase with a living team from one being maintained by whoever is left. A low figure means most of the knowledge about this code now sits with people who have moved on.

**How to read it.** On a long-lived repository this is naturally low and not alarming. On a repository under active development, a low figure means the team turned over and the remaining people are working in code they did not write.

**How it was calculated.** `8 contributors active in last 90 days / 80 contributors = 10%`

**Sample.** 80 of 80 contributors (100.0% coverage).

**Caveats.**

- Someone who moved to another project deliberately looks identical to someone who left the company. This measures presence in this codebase, nothing more.
- Measured against the most recent commit in scope (2026-09-14), not today, so an inactive repository does not make everyone look departed.

**Underlying records (12 shown).**

- `org:org:all` — tashfeenahmed: last commit 2026-06-04
- `org:org:all` — RoboMWM: last commit 2026-06-04
- `org:org:all` — Tazrif Raim: last commit 2026-06-04
- `org:org:all` — Chong Jia Zhen: last commit 2026-06-04
- `org:org:all` — bharvey42: last commit 2026-05-31
- `org:org:all` — Yuvraj Singh Sisodiya: last commit 2026-05-31
- `org:org:all` — Davy: last commit 2026-05-31
- `org:org:all` — Nic: last commit 2026-05-29
- `org:org:all` — Tushar49: last commit 2026-05-28
- `org:org:all` — Ricardo: last commit 2026-05-26
- `org:org:all` — Sumit: last commit 2026-05-26
- `org:org:all` — Jake Hash: last commit 2026-05-26

---

### Review and process

*Whether the safety net around changes is actually being used: review coverage, change size, self-merges, reviewer load, and branch hygiene.*

#### Share of merged changes with a recorded review: **1.6%**

`process.review_coverage` · confidence **high** · measured (counted directly from records)

**What this means.** Of the changes that went into the product through a pull request, how many had at least one colleague formally look at them and record an opinion.

**Why it matters.** Review is the main defect-catching and knowledge-sharing mechanism most teams have. If coverage is low then a fast delivery time is not efficiency — it is an unguarded path to production, and every other process number here should be read in that light.

**How to read it.** Above 90% is the expectation for shared code. Near zero means the pull request process exists on paper only. This is the metric to check before believing any good news in the delivery family.

**How it was calculated.** `11 merged pull requests with a review / 679 merged = 1.6%`

**Sample.** 679 of 772 pull requests (87.95% coverage).

Excluded from this metric:

- pull requests not merged (open or closed unmerged) — 93
- pull requests beyond the collection window in 1 repository/-ies

**Assumptions.**

- Only GitHub review records count. Approval given in a plain comment, over chat, or in person is invisible, so a team with a different review habit will score unfairly low — verify against the listed examples before treating a low number as a finding.

**Caveats.**

- Pull requests are fetched newest-first up to the configured page limit, so on very busy repositories the oldest pull requests can fall outside the collected window. The sample figures on this metric state exactly how many were read.
- 668 of 679 merged pull requests carry no review record. If this team approves changes verbally or in chat, that practice is invisible here — check two or three of the named examples before treating this as a control failure.
- Computed over 679 of 772 pull requests (88% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/prompture #1 “Auth: Clerk + real CLI tokens; stub cleanup (9 packages)” — 25,124 lines merged with no review** (25,124 lines merged unreviewed)
   Opened and merged by Shashank2577 with nobody else involved at any point. 25,124 lines entered the product with no second pair of eyes, which is the single clearest demonstration of what a low coverage figure means in practice.
   Record: [#1](https://github.com/Shashank2577/prompture/pull/1) — merged 25,124 lines with no review recorded

2. **Shashank2577/closepilot #27 “feat: Phase 2 & 3 — production readiness, intelligence & sc…” — 17,253 lines merged with no review** (17,253 lines merged unreviewed)
   Opened and merged by Shashank2577 with nobody else involved at any point. 17,253 lines entered the product with no second pair of eyes, which is the single clearest demonstration of what a low coverage figure means in practice.
   Record: [#27](https://github.com/Shashank2577/closepilot/pull/27) — merged 17,253 lines with no review recorded

3. **Shashank2577/spreix-platform #99 “Phase 6 implementation: session box, webhooks, integrations…” — 15,136 lines merged with no review** (15,136 lines merged unreviewed)
   Opened and merged by Shashank2577 with nobody else involved at any point. 15,136 lines entered the product with no second pair of eyes, which is the single clearest demonstration of what a low coverage figure means in practice.
   Record: [#99](https://github.com/Shashank2577/spreix-platform/pull/99) — merged 15,136 lines with no review recorded

4. **Shashank2577/OBSERVE #6 “Feat/multi agent swarm” — 11,666 lines merged with no review** (11,666 lines merged unreviewed)
   Opened and merged by Shashank2577 with nobody else involved at any point. 11,666 lines entered the product with no second pair of eyes, which is the single clearest demonstration of what a low coverage figure means in practice.
   Record: [#6](https://github.com/Shashank2577/OBSERVE/pull/6) — merged 11,666 lines with no review recorded

5. **Shashank2577/OBSERVE #2 “feat: Phase 1 - Foundation and UI/MCP setup” — 11,516 lines merged with no review** (11,516 lines merged unreviewed)
   Opened and merged by Shashank2577 with nobody else involved at any point. 11,516 lines entered the product with no second pair of eyes, which is the single clearest demonstration of what a low coverage figure means in practice.
   Record: [#2](https://github.com/Shashank2577/OBSERVE/pull/2) — merged 11,516 lines with no review recorded

**Underlying records (12 shown).**

- Shashank2577/prompture [#1](https://github.com/Shashank2577/prompture/pull/1) — merged with no recorded review
- Shashank2577/closepilot [#27](https://github.com/Shashank2577/closepilot/pull/27) — merged with no recorded review
- Shashank2577/spreix-platform [#99](https://github.com/Shashank2577/spreix-platform/pull/99) — merged with no recorded review
- Shashank2577/OBSERVE [#6](https://github.com/Shashank2577/OBSERVE/pull/6) — merged with no recorded review
- Shashank2577/OBSERVE [#2](https://github.com/Shashank2577/OBSERVE/pull/2) — merged with no recorded review
- Shashank2577/spreix-platform [#5](https://github.com/Shashank2577/spreix-platform/pull/5) — merged with no recorded review
- Shashank2577/closepilot [#15](https://github.com/Shashank2577/closepilot/pull/15) — merged with no recorded review
- Shashank2577/closepilot [#26](https://github.com/Shashank2577/closepilot/pull/26) — merged with no recorded review
- Shashank2577/closepilot [#28](https://github.com/Shashank2577/closepilot/pull/28) — merged with no recorded review
- Shashank2577/micro-saas [#12](https://github.com/Shashank2577/micro-saas/pull/12) — merged with no recorded review
- Shashank2577/lumen [#1](https://github.com/Shashank2577/lumen/pull/1) — merged with no recorded review
- Shashank2577/micro-saas [#11](https://github.com/Shashank2577/micro-saas/pull/11) — merged with no recorded review

---

#### Share of changes merged by their own author: **54.3%**

`process.self_merge_share` · confidence **high** · measured (counted directly from records)

**What this means.** How often the person who wrote a change was also the person who pressed the button to put it into the product, with nobody else involved in between.

**Why it matters.** Self-merging is the specific mechanism by which a review policy quietly stops applying. It is also the first control weakness an auditor asks about in regulated work, and the easiest to fix — it is a branch-protection setting.

**How to read it.** Some self-merging is fine on small internal tools. Consistently high values on a customer-facing codebase is a governance finding, not a style preference.

**How it was calculated.** `369 pull requests merged by their author / 679 merged = 54.3%`

**Sample.** 679 of 772 pull requests (87.95% coverage).

Excluded from this metric:

- merged pull requests with no recorded merger
- pull requests beyond the collection window in 1 repository/-ies
- pull requests not eligible for this measure — 93

**Caveats.**

- Pull requests are fetched newest-first up to the configured page limit, so on very busy repositories the oldest pull requests can fall outside the collected window. The sample figures on this metric state exactly how many were read.
- A change properly reviewed and approved by a colleague and then merged by its author still counts here. Read this next to review coverage rather than alone.
- Computed over 679 of 772 pull requests (88% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/prompture #1 — 25,124 lines, written and merged by Shashank2577, no review** (25,124 lines self-merged unreviewed)
   Author, approver and merger are the same person. This is the exact mechanism by which a review policy stops applying, and it is fixed with a branch protection setting rather than a process document.
   Record: [#1](https://github.com/Shashank2577/prompture/pull/1) — 25,124 lines, self-merged, no review

2. **Shashank2577/closepilot #27 — 17,253 lines, written and merged by Shashank2577, no review** (17,253 lines self-merged unreviewed)
   Author, approver and merger are the same person. This is the exact mechanism by which a review policy stops applying, and it is fixed with a branch protection setting rather than a process document.
   Record: [#27](https://github.com/Shashank2577/closepilot/pull/27) — 17,253 lines, self-merged, no review

3. **Shashank2577/spreix-platform #99 — 15,136 lines, written and merged by Shashank2577, no review** (15,136 lines self-merged unreviewed)
   Author, approver and merger are the same person. This is the exact mechanism by which a review policy stops applying, and it is fixed with a branch protection setting rather than a process document.
   Record: [#99](https://github.com/Shashank2577/spreix-platform/pull/99) — 15,136 lines, self-merged, no review

4. **Shashank2577/OBSERVE #6 — 11,666 lines, written and merged by Shashank2577, no review** (11,666 lines self-merged unreviewed)
   Author, approver and merger are the same person. This is the exact mechanism by which a review policy stops applying, and it is fixed with a branch protection setting rather than a process document.
   Record: [#6](https://github.com/Shashank2577/OBSERVE/pull/6) — 11,666 lines, self-merged, no review

5. **Shashank2577/OBSERVE #2 — 11,516 lines, written and merged by Shashank2577, no review** (11,516 lines self-merged unreviewed)
   Author, approver and merger are the same person. This is the exact mechanism by which a review policy stops applying, and it is fixed with a branch protection setting rather than a process document.
   Record: [#2](https://github.com/Shashank2577/OBSERVE/pull/2) — 11,516 lines, self-merged, no review

**Underlying records (12 shown).**

- Shashank2577/prompture [#1](https://github.com/Shashank2577/prompture/pull/1) — author Shashank2577 merged their own change
- Shashank2577/closepilot [#27](https://github.com/Shashank2577/closepilot/pull/27) — author Shashank2577 merged their own change
- Shashank2577/spreix-platform [#99](https://github.com/Shashank2577/spreix-platform/pull/99) — author Shashank2577 merged their own change
- Shashank2577/OBSERVE [#6](https://github.com/Shashank2577/OBSERVE/pull/6) — author Shashank2577 merged their own change
- Shashank2577/OBSERVE [#2](https://github.com/Shashank2577/OBSERVE/pull/2) — author Shashank2577 merged their own change
- Shashank2577/spreix-platform [#5](https://github.com/Shashank2577/spreix-platform/pull/5) — author Shashank2577 merged their own change
- Shashank2577/closepilot [#15](https://github.com/Shashank2577/closepilot/pull/15) — author Shashank2577 merged their own change
- Shashank2577/closepilot [#26](https://github.com/Shashank2577/closepilot/pull/26) — author Shashank2577 merged their own change
- Shashank2577/closepilot [#28](https://github.com/Shashank2577/closepilot/pull/28) — author Shashank2577 merged their own change
- Shashank2577/lumen [#1](https://github.com/Shashank2577/lumen/pull/1) — author Shashank2577 merged their own change
- Shashank2577/prompture [#2](https://github.com/Shashank2577/prompture/pull/2) — author Shashank2577 merged their own change
- Shashank2577/micro-saas [#77](https://github.com/Shashank2577/micro-saas/pull/77) — author Shashank2577 merged their own change

---

#### Median change size: **528**

`process.pr_size_p50` · confidence **high** · measured (counted directly from records)

**What this means.** The size of a typical proposed change, counting lines added and removed together.

**Why it matters.** Size is the strongest single predictor of whether a review will find anything. Small changes get real scrutiny; large ones get approved.

**How to read it.** Under 200 lines is reviewable. Over 500 means review quality is compromised.

**How it was calculated.** `median(additions + deletions) over 767 pull requests = 528 lines`

**Sample.** 767 of 772 pull requests (99.35% coverage).

Excluded from this metric:

- pull requests beyond the collection window in 1 repository/-ies
- pull requests not eligible for this measure — 5

**Caveats.**

- Pull requests are fetched newest-first up to the configured page limit, so on very busy repositories the oldest pull requests can fall outside the collected window. The sample figures on this metric state exactly how many were read.
- Generated, vendored, minified and dependency-lock files are excluded from line counts by the rules in config/path_rules.yaml. Anything those rules miss will inflate line totals, so check the excluded-file report before quoting a large number.

**Strongest evidence.**

1. **Shashank2577/spreix-boat #15 “fix: resolve vault compilation race condition and performan…” — 233,289 lines** (233,289 lines)
   442 times the median size. Reviewing this properly would take hours, which is why very large changes tend to be approved rather than examined.
   Record: [#15](https://github.com/Shashank2577/spreix-boat/pull/15) — 233,289 lines — 442x the median

2. **Shashank2577/micro-saas #15 “feat(seointelligence): create SEO intelligence platform” — 44,196 lines** (44,196 lines)
   84 times the median size. Reviewing this properly would take hours, which is why very large changes tend to be approved rather than examined.
   Record: [#15](https://github.com/Shashank2577/micro-saas/pull/15) — 44,196 lines — 84x the median

3. **Shashank2577/prompture #1 “Auth: Clerk + real CLI tokens; stub cleanup (9 packages)” — 25,124 lines** (25,124 lines)
   48 times the median size. Reviewing this properly would take hours, which is why very large changes tend to be approved rather than examined.
   Record: [#1](https://github.com/Shashank2577/prompture/pull/1) — 25,124 lines — 48x the median

**Underlying records (12 shown).**

- Shashank2577/spreix-boat [#15](https://github.com/Shashank2577/spreix-boat/pull/15) — 233,289 lines
- Shashank2577/micro-saas [#15](https://github.com/Shashank2577/micro-saas/pull/15) — 44,196 lines
- Shashank2577/prompture [#1](https://github.com/Shashank2577/prompture/pull/1) — 25,124 lines
- Shashank2577/closepilot [#27](https://github.com/Shashank2577/closepilot/pull/27) — 17,253 lines
- Shashank2577/spreix-platform [#99](https://github.com/Shashank2577/spreix-platform/pull/99) — 15,136 lines
- Shashank2577/growth-dashboard [#1](https://github.com/Shashank2577/growth-dashboard/pull/1) — 14,359 lines
- Shashank2577/OBSERVE [#3](https://github.com/Shashank2577/OBSERVE/pull/3) — 12,903 lines
- Shashank2577/OBSERVE [#1](https://github.com/Shashank2577/OBSERVE/pull/1) — 12,231 lines
- Shashank2577/OBSERVE [#6](https://github.com/Shashank2577/OBSERVE/pull/6) — 11,666 lines
- Shashank2577/OBSERVE [#2](https://github.com/Shashank2577/OBSERVE/pull/2) — 11,516 lines
- Shashank2577/spreix-platform [#5](https://github.com/Shashank2577/spreix-platform/pull/5) — 11,467 lines
- Shashank2577/OBSERVE [#4](https://github.com/Shashank2577/OBSERVE/pull/4) — 11,339 lines

---

#### Share of reviews done by one person: **65.6%**

`process.reviewer_load_top_share` · confidence **high** · measured (counted directly from records)

**What this means.** Of all the reviews recorded, this share was done by a single person — the one doing the most reviewing.

**Why it matters.** A single overloaded reviewer is both a delivery bottleneck and a burnout risk, and the cost is invisible in every other metric because their own output looks low while they unblock everyone else. This is the number that makes that work visible.

**How to read it.** On a team of five, anything above 50% means one person is carrying review. Combine with the review-wait metric: if both are high, that one person is the constraint on the whole team's delivery.

**How it was calculated.** `21 reviews by Shashank2577 / 32 reviews = 65.6%`

**Sample.** 32 of 32 review events (100.0% coverage).

**Caveats.**

- Pull requests are fetched newest-first up to the configured page limit, so on very busy repositories the oldest pull requests can fall outside the collected window. The sample figures on this metric state exactly how many were read.
- Counts review events, not review effort. A one-word approval and a detailed critique count the same.

**Strongest evidence.**

1. **Shashank2577: 21 reviews (66% of all reviews)** (21 reviews performed, 65.6% of the total)
   This person's throughput is the team's review capacity. Their own delivery numbers will look low precisely because they are unblocking everyone else — which is invisible in every other metric in this report.
   Record: `org:org:all` — Shashank2577 performed 21 of 32 reviews

2. **chatgpt-codex-connector: 11 reviews (34% of all reviews)** (11 reviews performed, 34.4% of the total)
   This person's throughput is the team's review capacity. Their own delivery numbers will look low precisely because they are unblocking everyone else — which is invisible in every other metric in this report.
   Record: `org:org:all` — chatgpt-codex-connector performed 11 of 32 reviews

**Underlying records (2 shown).**

- `org:org:all` — Shashank2577: 21 reviews
- `org:org:all` — chatgpt-codex-connector: 11 reviews

---

#### Share of work that bypassed pull requests: **80.1%**

`process.direct_push_share` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** How much work reached the main branch without going through the pull request process at all — pushed straight onto the branch the product is built from.

**Why it matters.** Work that bypasses pull requests is invisible to every review, approval and audit control the organisation believes it has. This metric measures the size of that blind spot, which means it also bounds how much the review metrics above can be trusted.

**How to read it.** Near zero is the goal, and branch protection is what achieves it. A high value means the review numbers describe only part of what is actually shipping.

**How it was calculated.** `4,791 landings on feat/multi-consumer-keys, feat/second-brain, main not traceable to a pull request / 5,983 = 80.1%`

**Sample.** 5,983 of 8,669 default-branch landings (69.02% coverage).

Excluded from this metric:

- commits that never landed on the default branch — 2,686

**Assumptions.**

- A landing is credited to a pull request when its commit appears in that pull request's commit list, or when a merge commit references the pull request number.

**Caveats.**

- Pull requests are fetched newest-first up to the configured page limit, so on very busy repositories the oldest pull requests can fall outside the collected window. The sample figures on this metric state exactly how many were read.
- Squash merges rewrite commit hashes, which can make properly reviewed work look like a direct push. Check the named examples before acting on a high figure.
- Computed over 5,983 of 8,669 default-branch landings (69% coverage) — see the exclusion list for what was left out.

**Strongest evidence.**

1. **Shashank2577/um 3ac8c542 “ABU-134 - Added BM cheetah modules” — 954,922 lines with no pull request** (954,922 lines pushed directly)
   954,922 lines by Naveen Kumar reached the release branch without passing through review, approval or any audit trail. Verify against the repo first: squash merges can also produce this pattern.
   Record: [3ac8c542b1](https://github.com/Shashank2577/um/commit/3ac8c542b15291be7ff88dfdc4a644eb4849958b) — 954,922 lines pushed straight to feat/multi-consumer-keys, feat/second-brain, main

2. **Shashank2577/um 2de8f654 “Cheetah: Add gradle script to build dashboard and include i…” — 906,361 lines with no pull request** (906,361 lines pushed directly)
   906,361 lines by Oleksii Mitrov reached the release branch without passing through review, approval or any audit trail. Verify against the repo first: squash merges can also produce this pattern.
   Record: [2de8f65484](https://github.com/Shashank2577/um/commit/2de8f65484c6aae643ad79833d029e5207ee38bd) — 906,361 lines pushed straight to feat/multi-consumer-keys, feat/second-brain, main

3. **Shashank2577/um 33c47f0a “ABU-134 Migration Cheetah API from Microservices to Integra…” — 899,754 lines with no pull request** (899,754 lines pushed directly)
   899,754 lines by Naveen Kumar reached the release branch without passing through review, approval or any audit trail. Verify against the repo first: squash merges can also produce this pattern.
   Record: [33c47f0a46](https://github.com/Shashank2577/um/commit/33c47f0a463fa9b5a216d71a4f9bac76d5bba871) — 899,754 lines pushed straight to feat/multi-consumer-keys, feat/second-brain, main

4. **Shashank2577/agent-native-deploy 43cd62c3 “Add starter templates and framework env management” — 186,964 lines with no pull request** (186,964 lines pushed directly)
   186,964 lines by Steve Sewell reached the release branch without passing through review, approval or any audit trail. Verify against the repo first: squash merges can also produce this pattern.
   Record: [43cd62c38c](https://github.com/Shashank2577/agent-native-deploy/commit/43cd62c38c639d9908b1332e535cfa6ec76ed7bb) — 186,964 lines pushed straight to feat/multi-consumer-keys, feat/second-brain, main

5. **Shashank2577/spreix-boat 25de58d4 “Initial commit: Spreix Boat — self-hosted web port of Rowbo…” — 168,864 lines with no pull request** (168,864 lines pushed directly)
   168,864 lines by Shashank Saxena reached the release branch without passing through review, approval or any audit trail. Verify against the repo first: squash merges can also produce this pattern.
   Record: [25de58d45e](https://github.com/Shashank2577/spreix-boat/commit/25de58d45e83ef72c0eb8b68ae647ce0901e39c4) — 168,864 lines pushed straight to feat/multi-consumer-keys, feat/second-brain, main

**Underlying records (12 shown).**

- Shashank2577/um [3ac8c542b1](https://github.com/Shashank2577/um/commit/3ac8c542b15291be7ff88dfdc4a644eb4849958b) — landed on feat/multi-consumer-keys, feat/second-brain, main with no traceable pull request
- Shashank2577/um [2de8f65484](https://github.com/Shashank2577/um/commit/2de8f65484c6aae643ad79833d029e5207ee38bd) — landed on feat/multi-consumer-keys, feat/second-brain, main with no traceable pull request
- Shashank2577/um [33c47f0a46](https://github.com/Shashank2577/um/commit/33c47f0a463fa9b5a216d71a4f9bac76d5bba871) — landed on feat/multi-consumer-keys, feat/second-brain, main with no traceable pull request
- Shashank2577/agent-native-deploy [43cd62c38c](https://github.com/Shashank2577/agent-native-deploy/commit/43cd62c38c639d9908b1332e535cfa6ec76ed7bb) — landed on feat/multi-consumer-keys, feat/second-brain, main with no traceable pull request
- Shashank2577/spreix-boat [25de58d45e](https://github.com/Shashank2577/spreix-boat/commit/25de58d45e83ef72c0eb8b68ae647ce0901e39c4) — landed on feat/multi-consumer-keys, feat/second-brain, main with no traceable pull request
- Shashank2577/agent-native-deploy [9539f289e3](https://github.com/Shashank2577/agent-native-deploy/commit/9539f289e3a5725c94a62494c22c5655898207f3) — landed on feat/multi-consumer-keys, feat/second-brain, main with no traceable pull request
- Shashank2577/spreix-notetaker [4d9b9f97c1](https://github.com/Shashank2577/spreix-notetaker/commit/4d9b9f97c1794a755c9880b7239097433268203e) — landed on feat/multi-consumer-keys, feat/second-brain, main with no traceable pull request
- Shashank2577/claude-forza-horizon [4dc4be9e64](https://github.com/Shashank2577/claude-forza-horizon/commit/4dc4be9e64d2ab3e3845b736e11f97cfcdcb257b) — landed on feat/multi-consumer-keys, feat/second-brain, main with no traceable pull request
- Shashank2577/um [9a95ff787a](https://github.com/Shashank2577/um/commit/9a95ff787a6cd5fa297c1d711361a3339258dfac) — landed on feat/multi-consumer-keys, feat/second-brain, main with no traceable pull request
- Shashank2577/sovix-evidence [0e46c941f4](https://github.com/Shashank2577/sovix-evidence/commit/0e46c941f431c83985f69fa4226ec7f285b969d4) — landed on feat/multi-consumer-keys, feat/second-brain, main with no traceable pull request
- Shashank2577/payload-utility [0b9f2c2a4b](https://github.com/Shashank2577/payload-utility/commit/0b9f2c2a4b1d5ab5ac8ff70dbab5c88f33f71677) — landed on feat/multi-consumer-keys, feat/second-brain, main with no traceable pull request
- Shashank2577/java-microservices-framework [cf3c1033d3](https://github.com/Shashank2577/java-microservices-framework/commit/cf3c1033d33fb968b6e503801a3962e1e34bcf42) — landed on feat/multi-consumer-keys, feat/second-brain, main with no traceable pull request

---

#### Share of branches abandoned over 90 days: **73.5%**

`process.stale_branch_share` · confidence **high** · measured (counted directly from records)

**What this means.** How many of the parallel lines of work in this repository have had no activity for more than three months. In practice: work that was started and neither finished nor cleaned up.

**Why it matters.** Each stale branch is unfinished work somebody was paid for that delivered nothing. In volume it is also a security concern, because old branches keep old vulnerable dependencies — and occasionally old credentials — alive and reachable.

**How to read it.** Under 20% is tidy. Over half means nobody is cleaning up, and the total branch count stops being a useful signal of how much parallel work is happening.

**How it was calculated.** `258 branches idle over 90 days / 351 branches = 73.5%`

**Sample.** 351 of 351 branches (100.0% coverage).

Excluded from this metric:

- branches with no readable last-commit date

**Caveats.**

- Long-lived release and environment branches are legitimately old and count as stale unless excluded in configuration. Check the named list before reporting this.
- Long-lived release and environment branches are counted as stale. Branches named in config as protected (develop, main, master) are the usual exceptions — check the named list before reporting this figure.

**Strongest evidence.**

1. **Shashank2577/JavaRAG branch “main” — untouched for 678 days** (678 days idle)
   Unfinished work that was paid for and never delivered. It also keeps the dependency versions of that date alive and reachable, which is why old branches show up in vulnerability scans.
   Record: [main](https://github.com/Shashank2577/JavaRAG/tree/main) — last commit 2024-11-05, 678 days ago

2. **Shashank2577/JavaRAG branch “evaluators-and-dvisors” — untouched for 678 days** (678 days idle)
   Unfinished work that was paid for and never delivered. It also keeps the dependency versions of that date alive and reachable, which is why old branches show up in vulnerability scans.
   Record: [evaluators-and-dvisors](https://github.com/Shashank2577/JavaRAG/tree/evaluators-and-dvisors) — last commit 2024-11-05, 678 days ago

3. **Shashank2577/interview-preps branch “main” — untouched for 667 days** (667 days idle)
   Unfinished work that was paid for and never delivered. It also keeps the dependency versions of that date alive and reachable, which is why old branches show up in vulnerability scans.
   Record: [main](https://github.com/Shashank2577/interview-preps/tree/main) — last commit 2024-11-16, 667 days ago

4. **Shashank2577/JavaRAG branch “vaadin+telegram-added” — untouched for 659 days** (659 days idle)
   Unfinished work that was paid for and never delivered. It also keeps the dependency versions of that date alive and reachable, which is why old branches show up in vulnerability scans.
   Record: [vaadin+telegram-added](https://github.com/Shashank2577/JavaRAG/tree/vaadin+telegram-added) — last commit 2024-11-24, 659 days ago

5. **Shashank2577/splitwise branch “main” — untouched for 659 days** (659 days idle)
   Unfinished work that was paid for and never delivered. It also keeps the dependency versions of that date alive and reachable, which is why old branches show up in vulnerability scans.
   Record: [main](https://github.com/Shashank2577/splitwise/tree/main) — last commit 2024-11-24, 659 days ago

**Underlying records (15 shown).**

- Shashank2577/JavaRAG [main](https://github.com/Shashank2577/JavaRAG/tree/main) — last commit 2024-11-05, 678 days ago
- Shashank2577/JavaRAG [evaluators-and-dvisors](https://github.com/Shashank2577/JavaRAG/tree/evaluators-and-dvisors) — last commit 2024-11-05, 678 days ago
- Shashank2577/interview-preps [main](https://github.com/Shashank2577/interview-preps/tree/main) — last commit 2024-11-16, 667 days ago
- Shashank2577/JavaRAG [vaadin+telegram-added](https://github.com/Shashank2577/JavaRAG/tree/vaadin+telegram-added) — last commit 2024-11-24, 659 days ago
- Shashank2577/splitwise [main](https://github.com/Shashank2577/splitwise/tree/main) — last commit 2024-11-24, 659 days ago
- Shashank2577/NexusAPI [main](https://github.com/Shashank2577/NexusAPI/tree/main) — last commit 2024-11-27, 655 days ago
- Shashank2577/Nexus-BE [frontend](https://github.com/Shashank2577/Nexus-BE/tree/frontend) — last commit 2024-12-07, 645 days ago
- Shashank2577/NCRT_AI [project](https://github.com/Shashank2577/NCRT_AI/tree/project) — last commit 2025-05-01, 501 days ago
- Shashank2577/NCRT_AI [main](https://github.com/Shashank2577/NCRT_AI/tree/main) — last commit 2025-05-01, 501 days ago
- Shashank2577/um [master](https://github.com/Shashank2577/um/tree/master) — last commit 2025-09-02, 377 days ago
- Shashank2577/observability [main](https://github.com/Shashank2577/observability/tree/main) — last commit 2025-09-15, 364 days ago
- Shashank2577/Observability-Jager-GroundCover [main](https://github.com/Shashank2577/Observability-Jager-GroundCover/tree/main) — last commit 2025-09-26, 353 days ago

---

#### Branches: **351**

`process.branch_count` · confidence **high** · measured (counted directly from records)

**What this means.** A branch is a parallel copy of the code where somebody works without disturbing everyone else. This is how many exist right now.

**Why it matters.** Branch count is a rough measure of how much work is in flight simultaneously, and of how much housekeeping is being neglected. Both matter for merge pain.

**How to read it.** Read it together with the stale share. Fifty branches of which forty are stale is a cleanup problem; fifty active branches on a ten-person team is a coordination problem.

**How it was calculated.** `count(branches on the remote at collection time) = 351`

**Sample.** 351 of 351 branches (100.0% coverage).

**Underlying records (74 shown).**

- `org:org:all` — Shashank2577/oh-my-design: 56 branches
- `org:org:all` — Shashank2577/reporadar: 39 branches
- `org:org:all` — Shashank2577/closepilot: 33 branches
- `org:org:all` — Shashank2577/clickup: 22 branches
- `org:org:all` — Shashank2577/micro-saas: 20 branches
- `org:org:all` — Shashank2577/spreix-boat: 17 branches
- `org:org:all` — Shashank2577/OBSERVE: 16 branches
- `org:org:all` — Shashank2577/Awesome-managed-agent: 12 branches
- `org:org:all` — Shashank2577/Nexus-BE: 11 branches
- `org:org:all` — Shashank2577/prompture: 9 branches
- `org:org:all` — Shashank2577/opencover-complete: 9 branches
- `org:org:all` — Shashank2577/ai-sdlc: 8 branches

---

### Working patterns

*When the work happens. Useful as a wellbeing signal and as a way to spot workflow shifts that coincide with a new tool rollout.*

#### Share of work saved outside working hours: **37.0%**

`temporal.after_hours_share` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** The share of saved work recorded before 8am or after 7pm in the author's own recorded time zone. Roughly: how much of the work happens outside a normal working day.

**Why it matters.** This is the cheapest early warning of unsustainable pace available, and it usually moves before attrition does. It also acts as a control on the velocity numbers: output that rose alongside this figure was bought with people's evenings, not with efficiency.

**How to read it.** Under 15% is normal — everyone has the occasional late night. A sustained rise, especially one that starts at a specific date, is worth a conversation rather than a target. Watch for it moving in step with a deadline or a tool rollout.

**How it was calculated.** `3,005 commits outside 8:00-19:00 local / 8,111 commits = 37%`

**Sample.** 8,111 of 8,669 commits (93.56% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Assumptions.**

- Uses the timezone offset git recorded on each commit, which reflects the machine's clock at the time. This is the author's real local time in almost all cases.

**Caveats.**

- Commit time is when work was saved, not when it was done. Someone who codes in the afternoon and commits at 9pm looks like a late worker.
- Genuinely distributed teams and deliberate flexible schedules both show up as after-hours work. This is a prompt to ask, never a conclusion on its own.
- This breaks down by individual. Published research and hard experience both show that per-person delivery metrics change behaviour once people can see themselves ranked. Use it to find where help is needed, not to compare colleagues.

**Strongest evidence.**

1. **2026-09: 51% of 603 commits landed outside 8:00-19:00 local time** (51 % of commits after hours)
   The most out-of-hours month in scope. Cross-check it against the release calendar: if it lines up with a deadline, the schedule was the cause, not the team's habits.
   Record: `org:org:all` — 2026-09: 51% of commits outside working hours

2. **2026-08: 50% of 1441 commits landed outside 8:00-19:00 local time** (50 % of commits after hours)
   The most out-of-hours month in scope. Cross-check it against the release calendar: if it lines up with a deadline, the schedule was the cause, not the team's habits.
   Record: `org:org:all` — 2026-08: 50% of commits outside working hours

3. **2026-04: 42% of 1785 commits landed outside 8:00-19:00 local time** (42 % of commits after hours)
   The most out-of-hours month in scope. Cross-check it against the release calendar: if it lines up with a deadline, the schedule was the cause, not the team's habits.
   Record: `org:org:all` — 2026-04: 42% of commits outside working hours

4. **2025-06: 36% of 52 commits landed outside 8:00-19:00 local time** (36 % of commits after hours)
   The most out-of-hours month in scope. Cross-check it against the release calendar: if it lines up with a deadline, the schedule was the cause, not the team's habits.
   Record: `org:org:all` — 2025-06: 36% of commits outside working hours

5. **2026-06: 36% of 181 commits landed outside 8:00-19:00 local time** (36 % of commits after hours)
   The most out-of-hours month in scope. Cross-check it against the release calendar: if it lines up with a deadline, the schedule was the cause, not the team's habits.
   Record: `org:org:all` — 2026-06: 36% of commits outside working hours

**Underlying records (12 shown).**

- `org:org:all` — 2026-09: 308 of 603 commits outside 8:00-19:00 local time
- `org:org:all` — 2026-08: 722 of 1441 commits outside 8:00-19:00 local time
- `org:org:all` — 2026-04: 741 of 1785 commits outside 8:00-19:00 local time
- `org:org:all` — 2025-06: 19 of 52 commits outside 8:00-19:00 local time
- `org:org:all` — 2026-06: 66 of 181 commits outside 8:00-19:00 local time
- `org:org:all` — 2024-03: 8 of 22 commits outside 8:00-19:00 local time
- `org:org:all` — 2026-07: 246 of 693 commits outside 8:00-19:00 local time
- `org:org:all` — 2025-02: 16 of 49 commits outside 8:00-19:00 local time
- `org:org:all` — 2026-05: 460 of 1416 commits outside 8:00-19:00 local time
- `org:org:all` — 2024-12: 15 of 48 commits outside 8:00-19:00 local time
- `org:org:all` — 2024-08: 7 of 23 commits outside 8:00-19:00 local time
- `org:org:all` — 2024-09: 7 of 23 commits outside 8:00-19:00 local time

---

#### Share of work saved at weekends: **21.3%**

`temporal.weekend_share` · confidence **medium** · proxy (derived from a stated convention)

**What this means.** The share of saved work recorded on a Saturday or Sunday. Unlike a late evening, which can be a personal preference, weekend work is usually a response to a deadline that the working week could not absorb.

**Why it matters.** Weekend work is the clearest signal that a schedule is not working. Unlike a late evening, it rarely happens by preference, and it correlates strongly with the periods teams later describe as their worst.

**How to read it.** Under 5% is background noise. A sustained figure above 15% means the plan depends on weekends, which means the plan is wrong rather than the team being slow.

**How it was calculated.** `1,728 commits on Saturday or Sunday / 8,111 commits = 21.3%`

**Sample.** 8,111 of 8,669 commits (93.56% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Caveats.**

- Assumes a Saturday-Sunday weekend, which is wrong for parts of the world. Configure it per team where that applies.
- This breaks down by individual. Published research and hard experience both show that per-person delivery metrics change behaviour once people can see themselves ranked. Use it to find where help is needed, not to compare colleagues.

**Strongest evidence.**

1. **2026-08: 31% of 1441 commits happened on a Saturday or Sunday** (31 % weekend commits)
   Weekend work rarely happens by preference. A month like this usually means the plan for that period depended on it.
   Record: `org:org:all` — 2026-08: 31% weekend commits

2. **2026-07: 31% of 693 commits happened on a Saturday or Sunday** (31 % weekend commits)
   Weekend work rarely happens by preference. A month like this usually means the plan for that period depended on it.
   Record: `org:org:all` — 2026-07: 31% weekend commits

3. **2026-05: 25% of 1416 commits happened on a Saturday or Sunday** (25 % weekend commits)
   Weekend work rarely happens by preference. A month like this usually means the plan for that period depended on it.
   Record: `org:org:all` — 2026-05: 25% weekend commits

4. **2026-09: 24% of 603 commits happened on a Saturday or Sunday** (24 % weekend commits)
   Weekend work rarely happens by preference. A month like this usually means the plan for that period depended on it.
   Record: `org:org:all` — 2026-09: 24% weekend commits

5. **2026-03: 23% of 743 commits happened on a Saturday or Sunday** (23 % weekend commits)
   Weekend work rarely happens by preference. A month like this usually means the plan for that period depended on it.
   Record: `org:org:all` — 2026-03: 23% weekend commits

**Underlying records (12 shown).**

- `org:org:all` — 2026-08: 449 of 1441 commits at the weekend
- `org:org:all` — 2026-07: 215 of 693 commits at the weekend
- `org:org:all` — 2026-05: 354 of 1416 commits at the weekend
- `org:org:all` — 2026-09: 143 of 603 commits at the weekend
- `org:org:all` — 2026-03: 172 of 743 commits at the weekend
- `org:org:all` — 2026-01: 14 of 61 commits at the weekend
- `org:org:all` — 2026-04: 317 of 1785 commits at the weekend
- `org:org:all` — 2026-06: 30 of 181 commits at the weekend
- `org:org:all` — 2026-02: 4 of 29 commits at the weekend
- `org:org:all` — 2024-11: 6 of 58 commits at the weekend
- `org:org:all` — 2024-09: 2 of 23 commits at the weekend
- `org:org:all` — 2025-05: 8 of 126 commits at the weekend

---

#### Busiest hour of the day: **12:00–13:00 local**

`temporal.peak_hour` · confidence **high** · measured (counted directly from records)

**What this means.** The hour of the day when the most work gets saved, in each author's own local time.

**Why it matters.** It shows when the team is actually productive, which is what meeting schedules should be built around. A team whose peak is late afternoon is being interrupted all morning.

**How to read it.** Mid-morning or mid-afternoon peaks are typical and healthy. A late-evening peak means the working day is being consumed by something other than the work.

**How it was calculated.** `hour with the most commits over 8,111 commits = 12:00–13:00 local`

**Sample.** 8,111 of 8,669 commits (93.56% coverage).

Excluded from this metric:

- merge commits (line changes would be double-counted) — 558

**Caveats.**

- Rebases, force-pushes and history rewrites change commit hashes and dates. Older history can therefore appear tidier, or more recent, than it actually was.

**Underlying records (24 shown).**

- `org:org:all` — 00:00 local — 189 commits
- `org:org:all` — 01:00 local — 144 commits
- `org:org:all` — 02:00 local — 106 commits
- `org:org:all` — 03:00 local — 134 commits
- `org:org:all` — 04:00 local — 143 commits
- `org:org:all` — 05:00 local — 129 commits
- `org:org:all` — 06:00 local — 328 commits
- `org:org:all` — 07:00 local — 335 commits
- `org:org:all` — 08:00 local — 437 commits
- `org:org:all` — 09:00 local — 521 commits
- `org:org:all` — 10:00 local — 400 commits
- `org:org:all` — 11:00 local — 444 commits

---

#### How bursty the work pattern is: **4.76x**

`temporal.burstiness` · confidence **low** · proxy (derived from a stated convention)

**What this means.** Whether work arrives in a steady stream or in concentrated bursts. It compares the variability of the gaps between saved checkpoints against their average length. Higher means more feast-and-famine.

**Why it matters.** Bursty patterns usually mean people are blocked and then suddenly unblocked, which is a flow problem rather than an effort problem. It is also a documented signature of AI-assisted workflows, where a long exploratory pause is followed by rapid acceptance of several suggestions.

**How to read it.** Around 1.0 means gaps vary about as much as their average, which is ordinary. Above 2.0 means strongly bursty. Interpret as a shift over time rather than a level to fix.

**How it was calculated.** `standard deviation of inter-commit gaps / mean gap over 8,110 gaps = 4.76`

**Sample.** 8,110 of 8,110 gaps between commits (100.0% coverage).

**Caveats.**

- Holidays, sprint boundaries and release freezes all create bursts that have nothing to do with how anyone works.
- Sensitive to the size of the window measured. Compare like-for-like periods only.

**Underlying records (1 shown).**

- `org:org:all` — 8,110 intervals between consecutive commits measured

---

### Build and pipeline

*Whether automated checks are passing and how long they take. The fastest feedback loop a team has, and the first thing to degrade when volume rises.*

#### Share of automated checks that failed: **51.8%**

`ci.failure_rate` · confidence **high** · measured (counted directly from records)

**What this means.** Every time someone proposes a change, an automated set of checks runs against it. This is the share of those runs that failed.

**Why it matters.** A build that frequently fails stops being a signal. Teams learn to ignore it, re-run it, or merge past it — at which point the organisation is paying for a safety net that nobody trusts and that catches nothing.

**How to read it.** Ten to twenty percent is healthy: the checks are catching real problems. Above 40% usually means flaky tests rather than bad code, and the fix is to stabilise the tests. Near zero can mean the checks are too shallow to fail.

**How it was calculated.** `780 failed runs / 1,507 completed runs = 51.8%`

**Sample.** 1,507 of 1,560 workflow runs (96.6% coverage).

Excluded from this metric:

- runs still in progress or cancelled — 53

**Caveats.**

- Workflow runs are fetched newest-first up to the configured page limit, so this describes recent pipeline behaviour rather than full history. The sample figures state exactly how many runs were read.
- Only visible when the repository uses GitHub Actions. A team using Jenkins, GitLab CI, Azure Pipelines or CircleCI will show nothing here, which is a gap in this tool rather than a finding about the team.

**Strongest evidence.**

1. **“Project sync” fails 100% of the time (43 of 43 runs)** (100 % of runs failing)
   A check that fails this often stops being believed. Either it is catching a real recurring problem worth fixing, or it is flaky and should be stabilised — both are concrete actions on a named workflow.
   Record: `org:org:all` — workflow “Project sync” failed 43 of 43 runs

2. **“Package and Push Helm Chart” fails 100% of the time (35 of 35 runs)** (100 % of runs failing)
   A check that fails this often stops being believed. Either it is catching a real recurring problem worth fixing, or it is flaky and should be stabilised — both are concrete actions on a named workflow.
   Record: `org:org:all` — workflow “Package and Push Helm Chart” failed 35 of 35 runs

3. **“Build and Push Runtime Image” fails 100% of the time (9 of 9 runs)** (100 % of runs failing)
   A check that fails this often stops being believed. Either it is catching a real recurring problem worth fixing, or it is flaky and should be stabilised — both are concrete actions on a named workflow.
   Record: `org:org:all` — workflow “Build and Push Runtime Image” failed 9 of 9 runs

4. **“Build and Push Runtime Images” fails 100% of the time (6 of 6 runs)** (100 % of runs failing)
   A check that fails this often stops being believed. Either it is catching a real recurring problem worth fixing, or it is flaky and should be stabilised — both are concrete actions on a named workflow.
   Record: `org:org:all` — workflow “Build and Push Runtime Images” failed 6 of 6 runs

5. **“.github/workflows/ci.yml” fails 100% of the time (15 of 15 runs)** (100 % of runs failing)
   A check that fails this often stops being believed. Either it is catching a real recurring problem worth fixing, or it is flaky and should be stabilised — both are concrete actions on a named workflow.
   Record: `org:org:all` — workflow “.github/workflows/ci.yml” failed 15 of 15 runs

**Underlying records (12 shown).**

- Shashank2577/reporadar [34845492924](https://github.com/Shashank2577/reporadar/actions/runs/34845492924) — Auto-merge Jules PRs failed
- Shashank2577/reporadar [34807912951](https://github.com/Shashank2577/reporadar/actions/runs/34807912951) — Auto-merge Jules PRs failed
- Shashank2577/reporadar [34786709805](https://github.com/Shashank2577/reporadar/actions/runs/34786709805) — Auto-merge Jules PRs failed
- Shashank2577/reporadar [34775785987](https://github.com/Shashank2577/reporadar/actions/runs/34775785987) — Auto-merge Jules PRs failed
- Shashank2577/reporadar [34768147660](https://github.com/Shashank2577/reporadar/actions/runs/34768147660) — Auto-merge Jules PRs failed
- Shashank2577/reporadar [34755618408](https://github.com/Shashank2577/reporadar/actions/runs/34755618408) — Auto-merge Jules PRs failed
- Shashank2577/reporadar [34738782211](https://github.com/Shashank2577/reporadar/actions/runs/34738782211) — Auto-merge Jules PRs failed
- Shashank2577/reporadar [34726927038](https://github.com/Shashank2577/reporadar/actions/runs/34726927038) — Auto-merge Jules PRs failed
- Shashank2577/reporadar [34722392764](https://github.com/Shashank2577/reporadar/actions/runs/34722392764) — Auto-merge Jules PRs failed
- Shashank2577/reporadar [34717378657](https://github.com/Shashank2577/reporadar/actions/runs/34717378657) — Evening report failed
- Shashank2577/reporadar [34711062059](https://github.com/Shashank2577/reporadar/actions/runs/34711062059) — Auto-merge Jules PRs failed
- Shashank2577/reporadar [34392056614](https://github.com/Shashank2577/reporadar/actions/runs/34392056614) — Jules deep enrichment failed

---

#### Median time for automated checks to finish: **1.1 min**

`ci.duration_p50_minutes` · confidence **high** · measured (counted directly from records)

**What this means.** How long a developer typically waits for the automated checks to finish before they know whether their change is safe.

**Why it matters.** This wait is paid on every single change, by every developer, several times a day. It is the highest-leverage number in this report for improving day-to-day productivity, because halving it compounds across every change the team will ever make.

**How to read it.** Under 10 minutes keeps people in flow. Beyond 30 minutes developers context-switch away and lose the thread, so the real cost is far higher than the clock time suggests.

**How it was calculated.** `median(run duration) over 1,431 completed runs = 1.1 minutes`

**Sample.** 1,431 of 1,507 workflow runs (94.96% coverage).

Excluded from this metric:

- runs with no measurable duration — 76

**Caveats.**

- Workflow runs are fetched newest-first up to the configured page limit, so this describes recent pipeline behaviour rather than full history. The sample figures state exactly how many runs were read.
- Only visible when the repository uses GitHub Actions. A team using Jenkins, GitLab CI, Azure Pipelines or CircleCI will show nothing here, which is a gap in this tool rather than a finding about the team.
- Includes time spent queued waiting for a runner, which is what the developer actually experiences but is not the same as the pipeline's own execution time.

**Strongest evidence.**

1. **“CI” run took 321 minutes** (321 minutes)
   Every developer waiting on this pays that time on every change. It is the highest-leverage number in this report to cut, because the saving compounds across every future change.
   Record: [30026128586](https://github.com/Shashank2577/spreix-platform/actions/runs/30026128586) — 321.3 minutes

2. **“CI” run took 74 minutes** (74 minutes)
   Every developer waiting on this pays that time on every change. It is the highest-leverage number in this report to cut, because the saving compounds across every future change.
   Record: [32766442752](https://github.com/Shashank2577/spreix-platform/actions/runs/32766442752) — 74.1 minutes

3. **“CI” run took 70 minutes** (70 minutes)
   Every developer waiting on this pays that time on every change. It is the highest-leverage number in this report to cut, because the saving compounds across every future change.
   Record: [29712423848](https://github.com/Shashank2577/spreix-platform/actions/runs/29712423848) — 70.1 minutes

**Underlying records (12 shown).**

- Shashank2577/spreix-platform [30026128586](https://github.com/Shashank2577/spreix-platform/actions/runs/30026128586) — CI took 321.3 minutes
- Shashank2577/spreix-platform [32766442752](https://github.com/Shashank2577/spreix-platform/actions/runs/32766442752) — CI took 74.1 minutes
- Shashank2577/spreix-platform [29712423848](https://github.com/Shashank2577/spreix-platform/actions/runs/29712423848) — CI took 70.1 minutes
- Shashank2577/agent-native-deploy [25860359005](https://github.com/Shashank2577/agent-native-deploy/actions/runs/25860359005) — Build + Deploy to EKS took 53.6 minutes
- Shashank2577/agent-native-deploy [25921737657](https://github.com/Shashank2577/agent-native-deploy/actions/runs/25921737657) — Build + Deploy to EKS took 52.1 minutes
- Shashank2577/reporadar [34723622629](https://github.com/Shashank2577/reporadar/actions/runs/34723622629) — Hourly refresh took 51.0 minutes
- Shashank2577/prompture [32094162052](https://github.com/Shashank2577/prompture/actions/runs/32094162052) — CI took 49.1 minutes
- Shashank2577/prompture [26335829168](https://github.com/Shashank2577/prompture/actions/runs/26335829168) — CI took 49.1 minutes
- Shashank2577/prompture [26211109459](https://github.com/Shashank2577/prompture/actions/runs/26211109459) — CI took 49.1 minutes
- Shashank2577/prompture [25921157435](https://github.com/Shashank2577/prompture/actions/runs/25921157435) — CI took 47.1 minutes
- Shashank2577/spreix-platform [30008775038](https://github.com/Shashank2577/spreix-platform/actions/runs/30008775038) — CI took 45.1 minutes
- Shashank2577/spreix-platform [32759137384](https://github.com/Shashank2577/spreix-platform/actions/runs/32759137384) — CI took 44.4 minutes

---

#### Automated check runs per week: **10.7**

`ci.runs_per_week` · confidence **high** · measured (counted directly from records)

**What this means.** How many times per week the automated checks were triggered. Each run is one occasion where the tests, build and quality gates were exercised against somebody's change.

**Why it matters.** It shows whether automation is actually in the team's path or bolted on the side. It is also the multiplier on pipeline duration and cost: a slow pipeline run twice a week is a nuisance, run two hundred times a week it is a budget line.

**How to read it.** Should be at least as high as the number of changes landing. Much lower means checks are not running on every change.

**How it was calculated.** `1,507 runs over 140.9 weeks = 10.7 per week`

**Sample.** 1,507 of 1,560 workflow runs (96.6% coverage).

**Caveats.**

- Workflow runs are fetched newest-first up to the configured page limit, so this describes recent pipeline behaviour rather than full history. The sample figures state exactly how many runs were read.
- Only visible when the repository uses GitHub Actions. A team using Jenkins, GitLab CI, Azure Pipelines or CircleCI will show nothing here, which is a gap in this tool rather than a finding about the team.

**Underlying records (1 shown).**

- `org:org:all` — 1,507 completed runs across a 140.9-week window

---

## Data quality and limits

**How to read the confidence labels**

- **high** — Directly counted from complete records. Recomputable by hand from the evidence shown.
- **medium** — Counted from complete records, but resting on a defined convention — a threshold, a naming rule, or a time window — that is stated on the metric.
- **low** — A proxy standing in for something this data cannot observe directly. Use for direction and conversation, not as a measurement.

**Structural limits of this data**

- **AI involvement is a floor, never a measurement.** Git records who committed a change, not who or what wrote each line. Every AI figure in this report counts only commits where a tool chose to leave a trace in the metadata, and every one of those traces can be switched off in a single setting. The true figure is higher by an unknown margin.
- **Tool-native analytics cannot be backfilled.** Cursor and Copilot report usage only from the date their telemetry was enabled. Usage before that point was never recorded anywhere and cannot be reconstructed. This is a hard limit of the data, not a gap in this tool.
- **Lines of code measure volume, not value.** A hard-won hundred-line fix and a thousand lines of boilerplate are indistinguishable here. Nothing in this report is a basis for comparing individuals' productivity, and the people metrics carry that warning explicitly.
- **Several delivery metrics are proxies, and are labelled as such.** With no deployment or incident system connected, release cadence is inferred from landings on the default branch, and change failure rate and recovery time are inferred from how commits are worded. Each of those metrics states this on its own evidence panel and carries reduced confidence.

**Coverage of this run**

- Repositories collected: 76, failed: 2
- Pull request history truncated in: Shashank2577/reporadar
- Structure scan did not run in: Shashank2577/obsidian-vault, Shashank2577/bootstrap-fixture-209, Shashank2577/Shashank2577, Shashank2577/axon-sandbox, Shashank2577/prompture-cli, Shashank2577/Marketing, Shashank2577/awesome-cursor-walkthrough, Shashank2577/awesome-copilot-walkthrough, Shashank2577/awesome-codex-walkthrough, Shashank2577/awesome-claude-code-walkthrough …
- No pipeline data in: Shashank2577/Awesome-BI, Shashank2577/Awesome-managed-agent, Shashank2577/GrowthOS, Shashank2577/JavaRAG, Shashank2577/LOAN-MUDRA, Shashank2577/Marketing, Shashank2577/NCRT_AI, Shashank2577/NexusAPI, Shashank2577/Observability-Jager-GroundCover, Shashank2577/Opencover …
- No review records at all in: Shashank2577/reporadar, Shashank2577/OBSERVE, Shashank2577/prompture, Shashank2577/spreix-boat, Shashank2577/lumen, Shashank2577/clickup, Shashank2577/Awesome-BI, Shashank2577/Awesome-managed-agent, Shashank2577/micro-saas, Shashank2577/LOAN-MUDRA …
- Lines excluded as generated, vendored or binary: 28,637,494

**What was excluded from line counts, and why**

| Reason | File changes | Lines |
|---|---:|---:|
| third-party dependency source checked into the repository | 101,605 | 19,121,318 |
| structured data file — excluded so data dumps cannot dominate line counts | 134,403 | 7,304,544 |
| dependency lock file — regenerated by a tool, never hand-written | 597 | 936,745 |
| generated or migration directory — usually tool-authored and append-only | 1,595 | 256,245 |
| build output directory — produced by the toolchain, not authored | 4,116 | 161,401 |
| history boundary of a shallow clone — the whole tree reads as added because the parent commit was never fetched | 1,327 | 139,931 |
| unrecognised file type (.patch) | 16 | 139,773 |
| unrecognised file type (.css) | 615 | 110,699 |
| unrecognised file type (.html) | 494 | 98,793 |
| binary or media asset — line counts are meaningless | 3,074 | 95,934 |
| unrecognised file type (.log) | 182 | 74,482 |
| unrecognised file type (.mjs) | 1,610 | 61,218 |
| unrecognised file type (.pen) | 5 | 29,059 |
| no recognised file extension | 1,015 | 19,719 |
| unrecognised file type (.lock) | 43 | 11,088 |
| unrecognised file type (.md5) | 9,718 | 9,613 |
| unrecognised file type (.http) | 237 | 9,608 |
| unrecognised file type (.sha1) | 9,700 | 9,577 |
| compiled, minified or archived artefact | 533 | 8,306 |
| unrecognised file type (.xlf) | 92 | 8,259 |
| unrecognised file type (.gradle) | 569 | 5,749 |
| unrecognised file type (.example) | 182 | 3,554 |
| unrecognised file type (.gitignore) | 245 | 3,076 |
| unrecognised file type (.cjs) | 93 | 2,951 |
| unrecognised file type (.diff) | 1 | 1,482 |
| unrecognised file type (.tpl) | 49 | 1,474 |
| unrecognised file type (.prisma) | 5 | 1,359 |
| unrecognised file type (.cmd) | 8 | 1,310 |
| unrecognised file type (.backup) | 2 | 904 |
| unrecognised file type (.helmignore) | 44 | 892 |
| unrecognised file type (.jsonl) | 115 | 813 |
| unrecognised file type (.typ) | 2 | 802 |
| unrecognised file type (.gltf) | 1 | 713 |
| unrecognised file type (.dockerignore) | 59 | 657 |
| unrecognised file type (.bat) | 9 | 595 |
| unrecognised file type (.apib) | 1 | 485 |
| unrecognised file type (.template) | 6 | 454 |
| unrecognised file type (.rej) | 2 | 325 |
| unrecognised file type (.io) | 2 | 282 |
| unrecognised file type (.mdc) | 20 | 259 |
| unrecognised file type (.mts) | 2 | 230 |
| unrecognised file type (.code-workspace) | 5 | 206 |
| unrecognised file type (.bak) | 6 | 180 |
| unrecognised file type (.dockerfile) | 10 | 178 |
| unrecognised file type (.mod) | 17 | 156 |
| unrecognised file type (.production) | 2 | 153 |
| unrecognised file type (.orig) | 1 | 136 |
| unrecognised file type (.prettierrc) | 24 | 125 |
| unrecognised file type (.tex) | 2 | 119 |
| unrecognised file type (.jsonc) | 7 | 102 |
| unrecognised file type (.service) | 5 | 95 |
| unrecognised file type (.state) | 3 | 95 |
| unrecognised file type (.imports) | 26 | 95 |
| unrecognised file type (.api) | 8 | 93 |
| unrecognised file type (.builderrules) | 4 | 90 |
| unrecognised file type (.new) | 1 | 90 |
| unrecognised file type (.plist) | 9 | 85 |
| unrecognised file type (.prod) | 1 | 78 |
| unrecognised file type (.cls) | 1 | 77 |
| unrecognised file type (.development) | 1 | 74 |
| unrecognised file type (.web) | 4 | 69 |
| unrecognised file type (.pro) | 3 | 65 |
| unrecognised file type (.stderr) | 6 | 54 |
| unrecognised file type (.runtime) | 1 | 44 |
| unrecognised file type (.excalidraw) | 1 | 42 |
| unrecognised file type (.xsd) | 2 | 40 |
| unrecognised file type (.ignore) | 25 | 30 |
| unrecognised file type (.apps) | 1 | 30 |
| unrecognised file type (.editorconfig) | 2 | 29 |
| unrecognised file type (.prettierignore) | 1 | 19 |
| unrecognised file type (.taurignore) | 1 | 16 |
| unrecognised file type (.pac) | 2 | 16 |
| unrecognised file type (.pid) | 13 | 15 |
| unrecognised file type (.tmp) | 1 | 15 |
| unrecognised file type (.frontend) | 1 | 14 |
| unrecognised file type (.npmrc) | 12 | 13 |
| unrecognised file type (.webmanifest) | 3 | 13 |
| unrecognised file type (.tsbuildinfo) | 11 | 13 |
| unrecognised file type (.qdrant) | 3 | 7 |
| unrecognised file type (.func) | 6 | 6 |
| unrecognised file type (.windsurfrules) | 6 | 6 |
| unrecognised file type (.last-run) | 1 | 5 |
| unrecognised file type (.cursorrules) | 5 | 5 |
| unrecognised file type (.jsp) | 1 | 5 |
| unrecognised file type (.config) | 1 | 5 |
| unrecognised file type (.gitkeep) | 107 | 3 |
| unrecognised file type (.base) | 1 | 3 |
| unrecognised file type (.npmignore) | 2 | 3 |
| unrecognised file type (.canvas) | 2 | 2 |
| unrecognised file type (.nvmrc) | 2 | 2 |
| unrecognised file type (.0) | 1 | 0 |
| unrecognised file type (.mdb) | 2 | 0 |
| unrecognised file type (.fuse_hidden0000001500000001) | 1 | 0 |
| unrecognised file type (.glb) | 1 | 0 |
| unrecognised file type (.bin) | 15 | 0 |
| unrecognised file type (.icns) | 13 | 0 |
| unrecognised file type (.db) | 11 | 0 |
| unrecognised file type (.car) | 5 | 0 |
| unrecognised file type (.probe) | 2 | 0 |
| unrecognised file type (.ds_store) | 5 | 0 |
| unrecognised file type (.webm) | 6 | 0 |
| unrecognised file type (.scss) | 1 | 0 |
| unrecognised file type (.identifier) | 2 | 0 |
| unrecognised file type (.kbx) | 7 | 0 |
| unrecognised file type (.secret) | 14 | 0 |
| unrecognised file type (.avz) | 1 | 0 |
| unrecognised file type (.openapi-generator-ignore) | 2 | 0 |
| unrecognised file type (.gpg) | 1 | 0 |

**Before circulating this**

This report breaks down to individual contributors. Published research and repeated industry experience both show that per-person delivery metrics change behaviour once people can see themselves ranked — including by suppressing the very AI traces this report depends on. Agree with HR and legal, before publishing, whether the audience is adoption tracking or performance management. The two need different access.

## How this was collected

- Started 2026-09-14T16:20:54 UTC, took 682.2s
- 180 GraphQL calls, 84 REST calls, 0 language-model calls (cost $0.00)
- Identity resolution: 88 people, 9 merged from multiple addresses, 7 bots excluded
- Repositories were read through bare mirror clones. Nothing was written to any source repository.

**Collection warnings**

- Shashank2577/PDF-HistoryChat-AIBOT: git clone --mirror --no-tags --shallow-since=2024-01-01 https://x-access-token:***@github.com/Shashank2577/PDF-HistoryChat-AIBOT.git /private/tmp/claude-502/personal-cache/Shashank2577__PDF-HistoryChat-AIBOT.git failed (128): Cloning into bare repository '/private/tmp/claude-502/personal-cache/Shashank2577__PDF-HistoryChat-AIBOT.git'...
fatal: error processing shallow info: 4
- Shashank2577/PDF-GPT-LANGCHAIN: git clone --mirror --no-tags --shallow-since=2024-01-01 https://x-access-token:***@github.com/Shashank2577/PDF-GPT-LANGCHAIN.git /private/tmp/claude-502/personal-cache/Shashank2577__PDF-GPT-LANGCHAIN.git failed (128): Cloning into bare repository '/private/tmp/claude-502/personal-cache/Shashank2577__PDF-GPT-LANGCHAIN.git'...
fatal: error processing shallow info: 4

**Thresholds in force for this run**

`duplicate_window_lines=6`, `hotspot_top_n=10`, `large_pr_lines=400`, `long_function_lines=60`, `newcomer_days=90`, `recent_activity_days=90`, `rework_window_days=21`, `stale_branch_days=90`, `stale_pr_days=30`, `trivial_commit_lines=5`, `work_day_end_hour=19`, `work_day_start_hour=8`
