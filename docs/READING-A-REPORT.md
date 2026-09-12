# Reading a report

A guide to what the numbers mean, and how to check one you do not believe.

The worked examples below come from the live report at
https://shashank2577.github.io/sovix-evidence/ so you can follow along.

## Start with the three words next to every number

Every metric carries a **tier**, and it changes what the number is allowed to
mean.

| Tier | Meaning | Example |
|---|---|---|
| `measured` | Counted directly from a source record | "46 of 72 merged pull requests had a review." A record exists for each one. |
| `proxy` | An estimator standing in for the thing itself | Rework rate counts lines rewritten within 21 days. That is a *signal* about churn, not a defect count. |
| `inferred` | Derived from detectable traces only | AI adoption counts commits carrying a tool trailer. Untagged AI work is invisible, so the figure is a **floor**. |

A `proxy` or `inferred` number is not a worse number. It is a different claim.
Read `measured` as "this happened", `proxy` as "this correlates with what you
care about", and `inferred` as "at least this much".

Anything inferred that is a share renders with `≥`. `≥ 1.9%` of commits carry an
AI trace means *at least* 1.9%, not 1.9%.

## Then check coverage before you react

Most misreadings come from treating a collection gap as a finding.

In the live report, review coverage is computed over 72 of 150 pull requests —
**48% coverage** — because pull requests are fetched newest-first to a page
limit. The card says so. Before concluding "this team does not review", the
question is whether the unread 52% look like the read 48%.

Three states are deliberately different and must not be confused:

- **`0%`** — a real, observed zero. Something was counted and there was none.
- **"Unavailable — no eligible records"** — the denominator was zero. Nothing
  could be computed. This is *never* shown as 0%.
- **A gap in a chart** — that interval had no eligible records. The line does
  not cross it. In the live report, January to May have no collected pull
  requests, so the review-coverage line starts in June.

If you see a dramatic improvement on a chart, check whether the earlier period
is a gap rather than a low value.

## How to check a number you do not believe

```bash
receipts verify --report out/report.json --metric process.review_coverage
```

That prints the full derivation: the formula with real numbers, every named
input, the sample, the exclusion list, the assumptions, and the source records.
For example:

```
formula   46 merged pull requests with a review / 72 merged = 63.9%
sample    n = 72 of population 150 pull requests · 48.0% coverage
excluded  78 pull requests not merged (open or closed unmerged)
assumption
          Only recorded review objects count. Approval given in a comment,
          over chat, or in person is invisible here.
strongest evidence
          #11133 — merged with no recorded review
```

The assumption line is usually where a surprising number gets explained. A team
that approves changes in Slack will score badly on review coverage while
reviewing everything.

## The metric families

| Family | Question it answers | Watch out for |
|---|---|---|
| **delivery** | How long does a change take to land, and how often do we ship? | Deploy frequency is a `proxy` — it counts landings on the default branch, not actual deployments. |
| **velocity** | How much changed, and how steadily? | Volume, not value. More lines is not more progress. |
| **quality** | Is the code churning, tested, duplicated, deeply nested? | Mostly `proxy`. These are signals about the codebase, not defect counts. |
| **ai** | How much work carries an AI-tool trace, and does traced work differ? | 9 of 11 are `inferred`. Every share is a floor. |
| **people** | How concentrated is knowledge? Who is leaving? | Aggregate only. No individual is named or ranked. |
| **process** | Are changes reviewed, self-merged, landed directly? | `direct_push_share` is a `proxy`; a squash or rebase workflow inflates it without any governance gap. |
| **temporal** | When is work happening? | After-hours and weekend shares use committer-local time and say nothing about whether it was voluntary. |
| **ci** | Do automated checks pass, and how long do they take? | Only GitHub Actions. A project on CircleCI looks like it has no CI. |

## Reading the findings

Findings at the top of a report are produced by **declared thresholds, encoded
as data**, not by a model forming an opinion. Each one prints the rule that
fired, so you can disagree with the threshold rather than the number.

A finding states an observation and suggests an investigation. It never asserts
a cause. "AI-traced work arrives with fewer tests" is a difference between two
populations, both small, with the trace share being a floor. That is a reason to
look, not a conclusion about AI.

## What is deliberately absent

If you go looking for these, they do not exist:

- Any ordering of contributors by a metric
- A percentile rank of one person against peers
- A top-N or bottom-N contributor query
- A productivity score, an index, or a composite rating
- An ROI or cost-saving claim

These are absent capabilities rather than hidden features, so no setting turns
them on. The reasoning is in
[ADR-013](adr/ADR-013-person-scope-gating.md): self-knowledge, operational
attribution and comparative ranking are three different things, and only the
third is the harm worth preventing architecturally.

## Before you share a report

A local report may contain contributor names and file paths, because it is about
your own code on your own machine. **It is not safe to publish as-is.**

For anything world-readable, run it through the publish pipeline, which
pseudonymizes identity, drops commit messages and PR titles, coarsens
timestamps, and refuses to write if any of 11 leak tests fails:

```bash
sovix-render out/report.json --out site/ --site --public-repo owner/name
```

The published `manifest.json` records exactly which field classes were
transformed and every leak-test verdict, so a reader can audit what was removed
rather than taking it on trust.
