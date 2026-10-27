# Collector fixes for `receipts`

`receipts-collector-fixes.patch` holds five fixes to the analytics collector
(github.com/Shashank2577/receipts), developed against a clone and verified there:
**835 tests pass**. They are kept here as a patch because that clone lived in a temporary
directory; this file is the only durable copy.

Apply with:

```bash
git clone https://github.com/Shashank2577/receipts
cd receipts && git checkout -b collector-fixes
git apply "../Git ai/patches/receipts-collector-fixes.patch"
python -m pytest          # expect 835 passed
```

## What each fix does, and what it changed

**1. Bots competed in the people metrics.** `active_contributors` excluded bots; nothing
else in the family did, so a bot could not be *a* contributor but could be *the top* one.
On the six-repository public cohort "GitHub Actions Bot" held 18.8% of all lines, took
rank 1 of the bus-factor evidence, and owned the file cited as the strongest
knowledge-silo risk. Fixed in the people family only — a bot commit is still a commit for
velocity and delivery.
→ org top contributor 18.8% (a bot) becomes 37.6% (a person); **bus factor 5 → 2**, which
matters because the old figure understated concentration risk.

**2. Shallow-clone boundary commits inflated every line count.** At a shallow fetch
boundary git withholds the parents, so those commits report as parentless and git diffs
them against the empty tree — the whole codebase reads as added. helm/helm had twelve such
commits at ~113,000 lines each. Detected by asking git `rev-parse --is-shallow-repository`;
the commit is kept and only its file statistics are excluded, so the lines appear in the
exclusion report rather than vanishing.
→ org lines added 3,124,521 → **516,391**; helm 1,325,598 → 36,930; lines per active day
8,945 → 2,351.

**3. The observed window was measured on author dates.** One helm commit carried a 2022
author date on a 2025 commit date (rebased), stretching that repository's span to 240 weeks
when the collected history covered 52. Every per-week rate divides by that span. Now
measured on commit dates; attribution and the working-pattern metrics still use author
dates, because those are about when a person was at the keyboard.
→ org span 241.9 → **53.7 weeks**; deploy frequency 18.05 → 81.26/wk; CI runs 4.2 → 18.9/wk.

**4. Calendar buckets used a different clock from the window.** Exposed by fix 3:
`active_days_per_week` came out at **7.2**, more days than a week contains, because the span
had moved to commit dates while the active-day set still counted author dates. `Commit.day`
and `.month` now share the window's clock.
→ org active days 7.2 → **6.75**; all repositories now ≤ 7.

**5. The three `ai.*_delta` metrics claimed to be floors.** The floor caveat was attached to
the whole `ai.*` family, including the signed cohort differences, so a renderer reading the
caveat printed `≥ −34.4%` — a statement asserting nothing. A floor is a coherent claim about
a share and an incoherent one about a difference. The deltas now carry a caveat about the
trace-detected cohort instead, and the two tests that pinned the old wording were split
rather than loosened: shares must state a floor, deltas must state cohort uncertainty *and*
must not say "floor".

## Still worth doing upstream

- Findings could not cite their own rule because `Headline` dropped the comparison and
  threshold it already had. Fixed here (fix in `report.py`, with a `ruleset_version`
  derived as a digest of the rule table) — but the matching renderer change lives in this
  repository, in `packages/renderer`, and both halves are needed.
- Evidence records have no stable identity; they are keyed on `(kind, repo, ref)`, so two
  metrics describing the same record with different field subsets are merged on a guess.
