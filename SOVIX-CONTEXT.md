# Sovix — engineering evidence

Context for designing an interface. This file describes **what the product does and what
data it holds**. It deliberately says nothing about layout, screens, colour, typography or
interaction — those are yours to invent.

---

## What it is, in one paragraph

Point it at a company's Git repositories. It reads the history — commits, pull requests,
reviews, branches, CI runs — and computes 57 measurements about how that engineering
organisation actually works: how much code gets a second pair of eyes before it ships, how
long a change waits between "ready" and "shipped", how much work gets rewritten within
three weeks, where knowledge is concentrated in too few people, how much carries a trace of
an AI coding tool. It runs on a schedule and each run produces an immutable snapshot.

## The one thing that makes it different

Most engineering dashboards show you a number. This one shows you **why you should believe
the number**. Every single figure carries, attached to it:

- **the formula**, with the real values substituted — `median(merged_at − created_at) over
  639 merged pull requests = 11 hours`
- **the sample** — how many records were counted, out of how many existed
- **the exclusions** — every record left out, with the reason and the count, adding up
  exactly to the population, so there is never an unexplained gap
- **the assumptions and caveats** — the conventions it rests on and what would make it wrong
- **the exemplars** — the strongest few individual records behind the figure, ranked, each
  with prose explaining why it demonstrates the number
- **the source records** — the actual commits and pull requests, linking out to GitHub
- **how it was obtained** — `measured`, `proxy` or `inferred` — and a confidence

A number whose evidence cannot be produced does not get published. That is the product.

## Who reads it

The same body of evidence, entered at four different heights:

| Reader | What they came for |
|---|---|
| **CTO / VP Engineering** | Twenty repositories at once. Where are the outliers, what changed, what needs a decision. Minutes, not hours. Will quote these figures to a board, so cannot afford one that doesn't hold up. |
| **Engineering manager** | One project. Where is work getting stuck, and is it a process problem or a staffing problem. Needs to take a number into a conversation with the team without it landing as an accusation. |
| **Project manager** | Not deeply technical. What's on track, what's at risk, and what the risk rests on. Will be asked "how do you know" and needs an answer they can repeat. |
| **Engineer** | Their own work. Is this file a hotspot, is my change sitting unreviewed, did the thing I shipped come back. Distrusts aggregates, will check the arithmetic. |

## How the data is shaped

**Scopes — the altitude ladder.** Every metric is computed at every level, independently
from the raw records rather than averaged upward:

```
organisation  →  project  →  repository  →  contributor
"All repos"      "Python"    "fastapi/fastapi"
```

The live demonstration cohort is 6 public repositories (axios, eslint, vite, fastapi,
mitmproxy, helm) in 3 projects — 10 published scopes, 4,974 commits, 1,200 pull requests,
1,483 reviews, 643 contributors, over about 54 weeks.

**Findings.** Each snapshot fires a small number of findings where a declared threshold was
crossed. A finding names its metric, its scope, its value, and the exact rule that fired
(`process.review_coverage < 50`, ruleset `rccef86aa`) — thresholds are inspectable data,
never hidden judgement. Eight fired on the current cohort, one critical.

**Series.** Nine of the metrics carry a month-by-month history. Months with no eligible
records are genuinely absent, not zero.

**Evidence records.** Roughly 1,100 individual commits and pull requests are cited
somewhere in the report. Each one can be looked up, and each knows every figure it was
counted in.

## The metrics

57 of them, in 8 families — **33 measured, 17 proxy, 7 inferred**. Tier means how the
number was obtained: **measured** = counted directly from git or GitHub records; **proxy** =
derived from a stated convention standing in for the real thing; **inferred** = read from
optional signals a tool may or may not have left behind.

### Delivery flow — `delivery` (8 metrics)

| Metric | What it is | Example value | How obtained |
|---|---|---|---|
| `delivery.lead_time_p50` | Once a developer says 'my change is ready', this is how long it typically waits before it be… | 11.0 h | measured / high |
| `delivery.lead_time_p90` | Nine out of ten changes reach the product faster than this | 7.8 days | measured / high |
| `delivery.time_to_first_review_p50` | How long a finished change sits untouched before a colleague looks at it | 1.5 h | measured / high |
| `delivery.deploy_frequency_per_week` | How many separate times each week finished work lands on the branch the product is built from | 81.26 | proxy / medium |
| `delivery.change_failure_rate` | Out of every hundred changes that shipped, roughly how many had to be undone or urgently pat… | 13.9% | proxy / low |
| `delivery.mttr_hours` | When something had to be undone, this is how long the broken version stayed in place before … | 13.8 h | proxy / low |
| `delivery.wip_open_prs` | How many finished-but-not-yet-shipped changes are sitting open right now, waiting for review… | 259 | measured / high |
| `delivery.stale_pr_share` | Of the changes currently waiting, how many have had no activity at all for more than a month | 24.3% | measured / high |

### Review and process — `process` (7 metrics)

| Metric | What it is | Example value | How obtained |
|---|---|---|---|
| `process.review_coverage` | Of the changes that went into the product through a pull request, how many had at least one … | 68.5% | measured / high |
| `process.self_merge_share` | How often the person who wrote a change was also the person who pressed the button to put it… | 17.5% | measured / high |
| `process.pr_size_p50` | The size of a typical proposed change, counting lines added and removed together | 36 | measured / high |
| `process.reviewer_load_top_share` | Of all the reviews recorded, this share was done by a single person — the one doing the most… | 13.1% | measured / high |
| `process.direct_push_share` | How much work reached the main branch without going through the pull request process at all … | 81.4% | proxy / medium |
| `process.stale_branch_share` | How many of the parallel lines of work in this repository have had no activity for more than… | 76.6% | measured / high |
| `process.branch_count` | A branch is a parallel copy of the code where somebody works without disturbing everyone else | 304 | measured / high |

### Output and activity — `velocity` (9 metrics)

| Metric | What it is | Example value | How obtained |
|---|---|---|---|
| `velocity.commits_total` | A commit is one saved checkpoint of work, like a numbered draft of a document | 4,974 | measured / high |
| `velocity.lines_added` | How many individual lines of code were written in the period, after removing machine-generat… | 516,391 | measured / high |
| `velocity.lines_removed` | How many lines of code were deleted during the period | 337,201 | measured / high |
| `velocity.net_lines` | Lines added minus lines removed — how much bigger or smaller the codebase got overall | 179,190 | measured / high |
| `velocity.active_days_per_week` | On how many days in a typical week does anyone save work to this codebase | 6.75 | measured / high |
| `velocity.commit_size_p50` | The size of a typical saved checkpoint, counting lines added and removed together | 8 | measured / high |
| `velocity.lines_per_active_day` | On the days when work actually happened, how many lines of code changed on average | 2,351 | measured / high |
| `velocity.feature_work_share` | Developers usually label what a change is for — new capability, a bug fix, a cleanup, or rou… | 10.6% | proxy / medium |
| `velocity.trivial_commit_share` | The share of saved checkpoints that changed almost nothing — fewer than five lines, or only … | 48.6% | proxy / medium |

### Code quality — `quality` (9 metrics)

| Metric | What it is | Example value | How obtained |
|---|---|---|---|
| `quality.rework_rate` | Of all the code written in this period, this share was changed again or deleted within three… | 7.1% | proxy / medium |
| `quality.test_line_ratio` | Of every hundred lines of code written, how many were automated tests — code whose only job … | 43.3% | proxy / medium |
| `quality.test_coupling_rate` | When a developer changed real product code, how often did they change a test in the same che… | 52.1% | proxy / medium |
| `quality.hotspot_concentration` | Out of all the editing that happened, this share happened inside just ten files | 11.2% | measured / high |
| `quality.large_change_share` | The share of proposed changes bigger than 400 lines — the size past which review research co… | 8.7% | proxy / medium |
| `quality.long_function_share` | Code is organised into functions — named blocks that each do one job | 4.8% | proxy / medium |
| `quality.max_nesting_p90` | How deeply conditions and loops sit inside one another — an 'if' inside a loop inside anothe… | 4 | proxy / medium |
| `quality.duplication_rate` | The share of lines that appear as part of a repeated block found somewhere else in the codeb… | 35.2% | proxy / medium |
| `quality.comment_density` | How much of the code is explanatory notes written for humans rather than instructions for th… | 10.2% | proxy / medium |

### Pipelines — `ci` (3 metrics)

| Metric | What it is | Example value | How obtained |
|---|---|---|---|
| `ci.failure_rate` | Every time someone proposes a change, an automated set of checks runs against it | 15.8% | measured / high |
| `ci.duration_p50_minutes` | How long a developer typically waits for the automated checks to finish before they know whe… | 1.0 min | measured / high |
| `ci.runs_per_week` | How many times per week the automated checks were triggered | 18.7 | measured / high |

### People and knowledge — `people` (6 metrics)

| Metric | What it is | Example value | How obtained |
|---|---|---|---|
| `people.active_contributors` | How many distinct people saved work to this codebase during the period, after merging the se… | 643 | measured / high |
| `people.bus_factor` | The smallest number of people who between them wrote half of all the code here | 2 | measured / high |
| `people.top_contributor_share` | How much of all the code in this period came from the single most prolific contributor | 37.6% | measured / high |
| `people.newcomer_share` | How much of the work in this period came from people whose very first change to this codebas… | 40.8% | measured / high |
| `people.knowledge_silo_share` | The share of code files that exactly one person has ever edited | 56.9% | measured / high |
| `people.contributor_retention` | Of everyone who has ever contributed to this codebase in the collected period, the share who… | 31.6% | measured / high |

### Working patterns — `temporal` (4 metrics)

| Metric | What it is | Example value | How obtained |
|---|---|---|---|
| `temporal.after_hours_share` | The share of saved work recorded before 8am or after 7pm in the author's own recorded time zone | 35.5% | proxy / medium |
| `temporal.weekend_share` | The share of saved work recorded on a Saturday or Sunday | 14.8% | proxy / medium |
| `temporal.peak_hour` | The hour of the day when the most work gets saved, in each author's own local time | 15:00–16:00 local | measured / high |
| `temporal.burstiness` | Whether work arrives in a steady stream or in concentrated bursts | 20.67x | proxy / low |

### AI assistance — `ai` (11 metrics)

| Metric | What it is | Example value | How obtained |
|---|---|---|---|
| `ai.detected_commit_share` | Some AI coding tools leave a small signature in the record of a change, rather like a photoc… | 1.9% | inferred / medium |
| `ai.detected_line_share` | The share of all code lines that arrived inside a change carrying an AI signature | 1.3% | inferred / low |
| `ai.adopter_share` | The share of people contributing to this code who have at least one change carrying an AI si… | 6.1% | inferred / medium |
| `ai.tool_concentration` | Of all the AI signatures found, this share came from one tool | 66.3% | inferred / medium |
| `ai.rework_delta` | Whether code arriving with an AI signature gets rewritten more or less often than the rest | -2.8% | inferred / low |
| `ai.test_ratio_delta` | Whether changes carrying an AI signature include proportionally more or fewer tests than oth… | -13.5% | inferred / low |
| `ai.commit_size_delta` | Whether changes carrying an AI signature tend to be bigger or smaller than other changes, ex… | 125.0% | inferred / low |
| `ai.config_artifact_count` | AI coding tools often keep a settings or instructions file in the repository — files named C… | 8 | measured / high |
| `ai.native_acceptance_rate` | When an AI tool offers a suggestion, the developer either takes it or ignores it | *not available* | measured / high |
| `ai.native_lines_accepted` | How many lines of code developers took from AI suggestions, as counted by the tool that made… | *not available* | measured / high |
| `ai.floor_understatement` | This report's main AI figures are a floor, built from signatures that tools optionally leave… | *not available* | measured / medium |

---

## Vocabulary worth keeping

- **Snapshot / edition** — one immutable run. Refreshing makes a new one; it never rewrites
  an old one.
- **The working** — the formula, sample, exclusions and records behind a single figure.
- **Coverage** — how much of the available population a figure was computed from.
- **Floor** — an AI *share of the whole* counts only work where a tool left a trace, and any
  developer can switch that trace off. Those figures are a minimum, printed with `≥`, and
  the true number is higher by an unknown margin. Exactly three metrics qualify:
  `ai.detected_commit_share`, `ai.detected_line_share`, `ai.adopter_share`.
  `ai.tool_concentration` is a share *of the traced work only* and the three `ai.*_delta`
  metrics are differences between two cohorts — neither is a floor, and neither takes `≥`.
- **Exemplar** — the strongest individual record behind a figure, with prose saying why.

## Things the product deliberately does not do

These are not features awaiting a roadmap slot. They are absent on purpose, and they shape
what the product can honestly say:

- **It never ranks people.** No leaderboard, no per-person comparison, no sorting
  contributors by any metric. Scopes are compared; people never are.
- **No score, no grade, no index.** There is no single number standing in for "how good is
  this team".
- **It never claims cause.** Two things moving together is reported as two things moving
  together, and nothing more.
- **Absence is never zero.** A metric with no eligible records reads "Not available" with
  the reason. A missing month in a history is a gap, never bridged.
- **No language model touches a calculation.** Same inputs, same output, every time.

## Real figures from the current cohort, for realistic content

- Review coverage runs from **7.8%** at fastapi/fastapi to **99.3%** at eslint/eslint.
- Median time from ready to shipped: **12 minutes** at fastapi, **18.9 hours** at mitmproxy
  — and fastapi's 12-minute median sits next to its 7.8% review coverage, which is the
  single most telling pairing in the data.
- Lead time p90 across the org is **7.8 days** against a p50 of **11 hours**.
- Bus factor at organisation level is **2**: two people wrote half of all the code.
- 643 contributors, but **47.3%** of files have had exactly one author, ever.
- AI tool traces appear on **≥ 1.9%** of commits — a floor, not a share.
- The critical finding: *"Most changes reach production without a review"* — 7.8% at
  fastapi/fastapi, fired by `process.review_coverage < 50`.
- A single pull request, fastapi #16210, merged **1,936 lines with no review** — the
  strongest evidence behind that finding.
