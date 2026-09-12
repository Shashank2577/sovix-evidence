# Sovix Evidence

**Engineering metrics where every number carries its evidence.**

Point it at a Git repository. It reads the history, computes 57 metrics, and
publishes a report where every figure shows its formula, what was counted, what
was excluded, and which records back it up.

### See it working

**Live report: https://shashank2577.github.io/sovix-evidence/**

That page is generated from six real open-source repositories — axios, helm,
eslint, fastapi, vite and mitmproxy — by the code in this repository. No
screenshots, no mockups. It is regenerated weekly by
[a GitHub Action](.github/workflows/publish-pages.yml).

### Try it on your own code in 30 seconds

```bash
pip install git+https://github.com/Shashank2577/receipts@master
receipts demo                       # no token, no config, no network
```

`receipts demo` builds a synthetic repository, analyses it, and writes a
self-contained `dashboard.html` you can open by double-clicking. Then point it
at something real:

```bash
receipts collect --repo axios/axios --out out/
open out/dashboard.html
```

To publish a redacted, pseudonymous version suitable for a public URL:

```bash
pip install ./packages/renderer
sovix-render out/report.json --out site/ --site --public-repo axios/axios
```

---

## What problem this solves

An engineering leader can already see commits, pull requests, CI runs and
AI-agent token counters. What they cannot easily do is answer a question and
show their work:

> "Review coverage is 70%. Which 30% wasn't reviewed, how do you know, and what
> did you exclude before computing it?"

Most dashboards cannot answer that. A number appears, its derivation does not,
and nobody can tell whether a low figure means a real problem or a collection
gap. This tool treats that derivation as the product.

Every metric ships with:

| Field | What it gives you |
|---|---|
| `formula` | The arithmetic with the real numbers substituted, e.g. `46 reviewed / 72 merged = 63.9%` |
| `sample` | How many records were read, out of how many exist, and the coverage percentage |
| `excluded` | What was left out and why — "78 pull requests not merged" |
| `sources` | The actual commits, PRs and reviews behind the number, with links |
| `exemplars` | The single strongest piece of evidence, ranked, with prose explaining why it proves the figure |
| `tier` | `measured`, `proxy`, or `inferred` — how the number was obtained |
| `confidence` | `high`, `medium`, or `low` |
| `caveats` | What would make this number wrong |

A metric that cannot cite a source, or a proxy metric with no caveat, **fails
CI**. Evidence is enforced, not encouraged.

---

## What it will not do

These are deliberate, and they are the reason to trust the rest.

- **No score, no rank, no leaderboard.** There is no API to order contributors
  by a metric, no percentile-against-peers, no top-N query. This is absent
  capability, not a disabled setting, so it cannot be switched on.
- **No productivity or ROI claims.** It will not tell you an engineer is
  performing well. It reports what was observed and what that cannot establish.
- **No causal language.** Two things moving together is reported as two things
  moving together.
- **Zero is never a placeholder.** A metric with no eligible records reads
  "Unavailable — no eligible records", never `0%`. A gap in a chart is drawn as
  a gap, never bridged.
- **No language-model calls in any calculation.** Analytics are deterministic:
  the same inputs produce the same output, verifiable by digest.

---

## Features

**Analysis**
- 57 metrics across 8 families: delivery, velocity, quality, AI adoption,
  people, process, working patterns, CI
- Scopes: organization, project (a group of repositories), repository, and
  contributor
- Works offline with `--no-api`: history from the Git mirror, and pull-request
  metrics reported as unavailable rather than silently zeroed
- AI-tool detection from commit trailers for Claude Code, Copilot, Cursor,
  Aider, Codex, Devin, Gemini CLI, and Windsurf
- Optional import of Copilot or Cursor analytics, which turns the AI figures
  from an inferred floor into a measurement for the period covered

**Reporting**
- A single self-contained HTML file: no server, no CDN, opens by double-click,
  prints to PDF, works with networking disabled
- Multi-page site mode with navigable organization, project and repository
  scopes
- Exports: `report.json`, per-metric CSV, per-source evidence CSV, and Markdown
  evidence packs designed to survive being read aloud in a meeting

**Privacy**
- Contributor identity is stored only as a keyed HMAC digest. The key is never
  written to disk, so a published artifact cannot be de-pseudonymized from
  anything the tool leaves behind
- Cohorts under five people are suppressed
- 11 mechanical leak tests gate publication. If any fails, nothing is written

---

## Repository layout

```
specs/                    The specification. Six features, 274 requirements.
  001-sovix-evidence/     Core product: journeys, domain, metrics, contracts
  002-enterprise-scopes/  Organization, project, team and contributor scoping
  003-evidence-dashboard/ The design system: tokens, chart catalog, voice
  004-publish-pipeline/   Redaction, leak tests, publishing, installation
  005-session-replay/     AI-agent telemetry ingestion and session replay
  006-coaching/           Individual and leader coaching
docs/
  adr/                    Architecture decisions, with the reasoning
  ARCHITECTURE.md         How the pieces fit together
  DEVELOPING.md           Set up, run, test, contribute
  READING-A-REPORT.md     What each number means and how to check it
packages/renderer/        The publishing pipeline (Python, no dependencies)
config/projects.yaml      Which repositories belong to which project
.github/workflows/        The weekly publish job
```

---

## Status, honestly

**Working today**
- Analysis and the self-contained HTML report, via `receipts`
- The publish pipeline: pseudonymization, redaction, 11 leak tests, multi-page
  site output, GitHub Pages deployment
- 236 tests

**Specified, not built**
- Session replay and AI-agent telemetry ingestion (spec 005)
- Coaching (spec 006)
- The hosted console, access control, and scheduled reports (spec 001, M2–M3)
- Team-level scoping (spec 002) — organization, project, repository and
  contributor work; `team` has no implementation yet

**Known limitations**
- Pull requests are fetched newest-first to a page limit, so on a busy
  repository the oldest can fall outside the window. Every affected metric
  states its coverage
- `quality.*` metrics are mostly `proxy`, and 9 of 11 `ai.*` metrics are
  `inferred`. The report marks each one rather than presenting them as measured
- One leak test (LT-09, raw branch names) has no data path to exercise it
  today. It is implemented but unverified against real input

---

## Licence

Apache-2.0. Built on [Receipts](https://github.com/Shashank2577/receipts) for
analysis. Its evidence model, and the rule that a scope is always recomputed
from raw records rather than averaged from its children, are the foundation
this depends on.
