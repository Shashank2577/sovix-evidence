# Running this on your own repositories

Four steps. The whole chain is local — nothing is uploaded anywhere, and no
language model touches a calculation.

```
receipts collect  →  out/report.json      read your git history, compute 57 metrics
trim-report.mjs   →  app/data/cohort.json drop contributor scopes, cap records
pnpm run data     →  client/public/data/  split into what the browser loads
pnpm dev          →  localhost            look at it
```

---

## 1. Install the collector

It is not on PyPI yet, so it installs from source. Use a virtual environment.

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install "git+https://github.com/Shashank2577/receipts@master"
```

**Apply the six fixes first.** `patches/receipts-collector-fixes.patch` in this
repository corrects defects that materially change the numbers — bots competing
in the people metrics (bus factor read 5 when it was 2), shallow-clone boundary
commits inflating line counts sixfold, the observed window measured on author
dates (one rebased commit stretched a span to 240 weeks), calendar buckets on a
different clock (7.2 active days in a seven-day week), signed AI deltas claiming
to be floors, and pull-request exclusions that left records counted nowhere.
`patches/README.md` has the apply steps and the before/after each produced.

Without them the tool runs; it just reports several things wrongly.

## 2. Collect

A private repository needs a token with the **`repo`** scope. `receipts` reads
`GITHUB_TOKEN`, falling back to `gh auth token`.

```bash
export GITHUB_TOKEN=$(gh auth token)

receipts collect \
  --repo yourorg/service-a \
  --repo yourorg/service-b \
  --since 2025-01-01 \
  --config config/ \
  --per-project \
  --out out/
```

Or a whole organisation, which takes every repository the token can see:

```bash
receipts collect --org yourorg --since 2025-01-01 --config config/ --out out/
```

**What it does to your machine and your code:** clones each repository bare and
read-only into a cache, reads history with `git log`, and calls the GitHub API
for pull requests, reviews and workflow runs. It never writes to your
repositories. Expect roughly 3 minutes per repository on a first run; later runs
reuse the cache unless you pass `--no-refresh`.

**`config/projects.yaml` is worth writing.** Without it every repository becomes
its own single-repository project and the project tier shows you nothing. Group
by team or product — the example in this repository groups by language only
because that is checkable by a stranger.

**No token, or an air-gapped machine:** `--no-api` works from the git mirror
alone. Pull-request, review and CI metrics then report as unavailable rather
than being silently zeroed, which is the honest failure and the reason the
"Not available" state exists.

## 3. Trim, split, run

```bash
cd app
node scripts/trim-report.mjs ../out/report.json data/cohort.json
pnpm install          # first time only
pnpm dev              # runs `pnpm run data` automatically, then serves
```

`trim-report.mjs` drops every contributor scope and each scope's
`top_contributors` list before the data ever reaches a browser. The product has
no contributor altitude and no ranking of people; shipping per-person scopes to
the client would put the ingredients of a leaderboard in devtools whether or not
a screen renders them.

`pnpm run data` then splits the cohort into `edition.json`, ten scope files and
`evidence.json`, and **validates** as it goes. That validator is the gate: a
metric that cannot produce its evidence fails the build rather than rendering as
a number you cannot defend.

## 4. Keep it current

```bash
receipts collect --org yourorg --since 2025-01-01 --config config/ --out out/ \
  && node app/scripts/trim-report.mjs out/report.json app/data/cohort.json \
  && cd app && pnpm run data
```

Weekly is the cadence the snapshot model assumes. Each run is a new immutable
edition; it never rewrites an old one.

---

## Before anyone else can see it

This is the part that matters more on private repositories than public ones,
because the people in the data are your colleagues and the repository names may
themselves be confidential.

**`client/public/data/` contains real contributor names and email addresses.**
It has to — a metric cites the commit it counted, and a commit has an author.
Behind authentication, for an audience that already has access to the
repositories, that is correct and is the point. On a public URL it is a leak.

The product has a redaction pipeline for exactly this, in
`packages/renderer` of the parent repository. It replaces identities with keyed
HMAC digests whose key is never written to disk, suppresses cohorts below five
people, strips private repository names and paths, and runs eleven mechanical
leak tests that **gate publication** — if any test fails, nothing is written.

```bash
pip install ./packages/renderer
sovix-render out/report.json --out site/ --site --profile pseudonymous
```

Pass `--public-repo owner/name` for each repository whose name may legitimately
appear. Anything not named is replaced with an opaque label.

So, concretely:

| Audience | What to serve |
|---|---|
| You, locally | `pnpm dev` — full fidelity, names and all |
| Your team, behind SSO | the built app — same thing, access-controlled |
| Anyone else | `sovix-render --profile pseudonymous` output, never `client/public/data/` |

**Two things to decide before you point this at a real team**, because they are
policy rather than configuration:

- **Who sees the people metrics.** Bus factor, knowledge silos and
  top-contributor share are the most useful numbers here and the easiest to
  misuse. The product refuses to rank individuals, but it will still tell you
  that half the code sits with one person.
- **Whether contributors know.** A tool that reads everyone's commit history is
  a different thing when the people in it have been told about it. That is not a
  technical control and nothing in the code can substitute for it.

---

## When something looks wrong

The product is built so you can check it rather than trust it. Every figure
opens to the formula with real numbers substituted, the sample it was computed
over, every exclusion with its count and reason, and links to the actual commits
and pull requests. If a number looks wrong, open its working — the answer is
usually there, and if it is not, that is a bug worth reporting.

`receipts verify --report out/report.json --metric <id> --scope <scope>` prints
the same derivation on the command line.
