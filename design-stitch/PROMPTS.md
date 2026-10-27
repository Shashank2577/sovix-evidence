# Stitch prompts — one per screen

**How to run these.** Open [labs.google.com/stitch](https://labs.google.com/stitch),
start a project, and paste the whole of `DESIGN.md` first as the design system. Then
generate one screen per prompt below, in order — screen 1 sets the shell and the rest
inherit it. Paste each generated screen back to me (or save the export into
`design-stitch/out/`) and I will assemble, correct and wire them to the real data.

Every figure below is real, from the collected snapshot of six public repositories on
2026-09-13. Nothing here is invented, and Stitch must not substitute placeholder numbers.

---

## Screen 1 — Portfolio

The entry screen. Six repositories, one organisation, what needs attention.

> A dark executive dashboard called **Sovix**, screen title "All repositories".
>
> Persistent left rail, 260px, listing six repositories each with its review-coverage
> figure right-aligned in monospace: axios/axios 65.5%, eslint/eslint 99.3%,
> fastapi/fastapi 7.8%, helm/helm 99.1%, mitmproxy/mitmproxy 40.0%, vitejs/vite 82.0%.
> Above them a group header "REPOSITORIES"; below them a second group "REFERENCE" with
> "Ledger — all 57" and "Method". The rail also carries three org-level entries at the
> top: "Portfolio", "Findings 8", "Evidence search".
>
> Top bar: product mark "SOVIX", breadcrumb "All repositories", and on the right
> "snapshot 2026-09-13 · immutable · 6 collected, 0 failed".
>
> Main column, in order:
>
> 1. A provenance strip in small monospace on the recessed surface: "4,974 commits · 643
>    contributors · 6 repositories · window 2025-08-31 to 2026-09-12 · 0 language-model
>    calls in any calculation". Second line in the alarm hairline treatment:
>    "Pull-request collection truncated in all 6 repositories — read 200 of 2,795–9,077
>    each, newest first."
> 2. A critical finding banner: badge CRITICAL, headline "Most changes reach production
>    without a review", body "Share of merged changes with a recorded review: 7.8% at
>    fastapi/fastapi.", and three monospace chips on the recessed surface reading
>    "rule process.review_coverage < 50", "ruleset rccef86aa", "scope repo:fastapi/fastapi".
>    A brass text link "Open the working".
> 3. Below it, a compact list of the seven further findings, one line each: severity
>    label, metric name, figure, repository.
> 4. A section headed "Is anything guarding the door?" with a one-line subtitle
>    "Whether changes get a second pair of eyes before they ship." Under it, three
>    horizontal dot-strip charts on a shared 0–100% axis, one per metric, each dot a
>    repository, the extremes labelled:
>    - "Share of merged changes with a recorded review" — 7.8% to 99.3%
>    - "Share of work that bypassed pull requests" — 33.2% to 92.5%
>    - "Share of changes merged by their own author" — 1.4% to 57.8%
>    Each row carries a qualifier line: "MEASURED · HIGH · 6 OF 6 REPOSITORIES".
> 5. A section headed "How fast does work ship?" containing a dumbbell chart: six rows,
>    one per repository, each with a filled dot at its median and an open dot at its
>    p90, connected by a line, on a labelled logarithmic time axis running 6 min · 15 min
>    · 1 h · 6 h · 1 d · 3 d · 1 w · 3 w. Values: axios 17.8h→11.7d, eslint 8.2h→5.6d,
>    fastapi 12min→4.1d, helm 13.0h→30.1h, mitmproxy 18.9h→11.8d, vite 11.8h→7.9d.
>    Caption: "filled = median · open = p90 — the connector length is the
>    unpredictability".
>
> No coloured figures. All numerals monospace. Brass only on links and the active rail
> item.

---

## Screen 2 — Repository

One repository in full. This is the screen an engineer and a team lead live on.

> Same shell, rail item "fastapi/fastapi" active, breadcrumb "All repositories › Python ›
> fastapi/fastapi".
>
> Header: repository name as the page title, and a metadata line "759 commits · 86
> contributors · 50.8 weeks observed · default branch master · 200 pull requests read of
> 6,323".
>
> The critical finding banner from screen 1, then four sections, each opening with its
> question and a one-line subtitle, each containing statement blocks:
>
> - **Is anything guarding the door?** — "Share of merged changes with a recorded review"
>   7.8%, qualifier "MEASURED · HIGH · 90 OF 200 PULL REQUESTS (45%)", definition "Of the
>   changes that went into the product through a pull request, how many had at least one
>   colleague formally look at them and record an opinion."; "Share of changes merged by
>   their own author" 57.8%; "Share of work that bypassed pull requests" 92.5% with
>   qualifier "PROXY · MEDIUM · 759 OF 759 DEFAULT-BRANCH LANDINGS (100%)".
> - **How fast does work ship?** — subtitle "A 12-minute median beside a 7.8% review rate
>   is not speed." — "Median time from ready to shipped" 12 min; "Median wait for the
>   first human review" 5.0 h.
> - **Does it stay shipped?** — "Share of new code rewritten within three weeks" 8.2%,
>   qualifier "PROXY · MEDIUM".
> - **Who holds the code?** — "People whose combined work is half the code" 1;
>   "Files with exactly one author" 73.5%.
>
> Under the first statement, show its working expanded, on the recessed surface with a
> brass left rule and five numbered rows:
> 1. DERIVATION — "7.8% = 7 merged pull requests with a review / 90 merged", with two
>    chips "reviewed: 7" and "merged: 90".
> 2. SAMPLE AND EXCLUSIONS — a single horizontal bar split into three labelled segments:
>    7 solid, 83 outlined, 110 hatched; beneath it three key rows: "7 merged with a
>    recorded review", "83 merged with no review recorded", "110 excluded — pull requests
>    not merged".
> 3. CONVENTIONS AND CAVEATS — "Only GitHub review records count. Approval given in a
>    plain comment, over chat, or in person is invisible, so a team with a different
>    review habit will record a low figure — verify against the listed examples before
>    treating it as a finding."
> 4. STRONGEST EVIDENCE — a bordered block: "fastapi/fastapi #16210 — 1,936 lines merged
>    with no review", a line of explanation, a share strip, and a brass link "View the
>    pull request".
> 5. RECORDS — a table of ten pull requests: reference, lines, reviews, merged date, and
>    an outbound link column. Below it "Showing 10 of 90" and a brass "Show all 90".

---

## Screen 3 — Evidence record

The bottom rung. An engineer searches for their own pull request and lands here.

> Same shell. Page title "Pull request #16210", subtitle "fastapi/fastapi".
>
> A record panel listing the allowlisted fields as a definition list in monospace:
> reference #16210, repository fastapi/fastapi, lines 1,936, reviews 0, opened
> 2026-07-02, merged 2026-07-02, and a brass outbound link "Open on GitHub".
>
> Then a section headed "What the claims say about this record" — the inversion that makes
> the product feel like a body of evidence. A list of every metric that counted this
> record, each row showing: metric name, its scope, its qualifier chips, the contribution
> this record made ("rank 1 of 5 exemplars — 1,936 lines merged unreviewed"), and a brass
> link "Open the working at this scope". Three rows: "Share of merged changes with a
> recorded review" at fastapi/fastapi; "Share of changes merged by their own author" at
> fastapi/fastapi; "Share of merged changes with a recorded review" at All repositories.
>
> A closing line in Ash: "A record appears here because a metric counted it. Nothing on
> this page is derived; every field is copied from the collected source record."

---

## Screen 4 — Ledger

Every metric, for the reader who wants the whole surface rather than the promoted set.

> Same shell, rail item "Ledger — all 57" active. Page title "Every metric",
> subtitle "fastapi/fastapi · 57 metrics across 8 families".
>
> A filter bar: a search field, and three toggle groups — family, evidence tier
> (measured / proxy / inferred), and availability. Counts beside each.
>
> Then a table with a section header row per family. Columns: metric name, identifier in
> monospace, value right-aligned in monospace, tier, confidence, coverage, and a chevron
> that expands the full working inline beneath the row. Show one row expanded so the
> inline working is visible inside the table.
>
> Rows must include: delivery.lead_time_p50 "12 min", process.review_coverage "7.8%",
> quality.rework_rate "8.2%", people.bus_factor "1", ai.detected_commit_share "≥ 0.4%"
> with the caption "a detectable floor, not a share", ci.failure_rate "8.3%", and
> three rows reading "Unavailable — no eligible records" rather than 0.

---

## Screen 5 — Method

The honesty surface. This is the page that makes the rest quotable.

> Same shell. Page title "Method", subtitle "How these numbers were produced, and what
> would make them wrong."
>
> Sections:
> - **This snapshot** — a definition list: collected 2026-09-13, 6 repositories, 0 failed,
>   window 2025-08-31 to 2026-09-12, 0 language-model calls, ruleset rccef86aa.
> - **Evidence tiers** — three blocks: MEASURED "Counted directly from git or GitHub
>   records."; PROXY "Derived from a stated convention that stands in for the real
>   thing."; INFERRED "Read from optional signals that tools may or may not leave behind."
> - **Structural limits** — four blocks, each a heading and a paragraph. First:
>   "AI involvement is a floor, never a measurement — git records who committed a change,
>   not who or what wrote each line."
> - **Every convention these metrics rest on** — a two-column table of thresholds:
>   rework window 21 days, large pull request 400 lines, trivial commit 5 lines, long
>   function 60 lines, stale branch 90 days, stale pull request 30 days, working day
>   08:00–19:00. With the fixed caption "Thresholds are configurable policy conventions,
>   not universal performance standards."
> - **What was excluded before any metric was computed** — a horizontal bar broken into
>   labelled segments with counts: "27,227 history boundary of a shallow clone", "3,472
>   structured data files", "1,253 binary or media assets", "1,152 compiled or minified
>   artefacts", "520 dependency lock files".

---

## Corrections to apply to whatever comes back

Stitch will get some of this wrong in predictable ways. When you paste the output back I
will fix these without being asked:

- Any coloured metric value → Bone.
- Any green, any second accent, any gradient → removed.
- Any invented figure → replaced with the real one from the snapshot.
- Any donut, gauge, pie or radar → replaced with the form in `DESIGN.md` §4.
- Any value shown without its denominator or its qualifier → qualifier restored.
- Any bar that animates up from zero → reveal by opacity instead.
- Any information reachable only on hover → printed.
