# Developing

## Set up

You need Python 3.10 or newer. Nothing else.

```bash
git clone https://github.com/Shashank2577/sovix-evidence
cd sovix-evidence

python -m venv .venv && source .venv/bin/activate
# or: uv venv .venv && source .venv/bin/activate

pip install git+https://github.com/Shashank2577/receipts@master   # the analysis engine
pip install -e "packages/renderer[dev]"                           # the publishing pipeline
```

`packages/renderer` has **no runtime dependencies** by design. It is the code
that decides what reaches a public URL, so it must be auditable end to end, and
it must not be able to pull a transitive package that reaches the network at
build time. Keep it that way.

## Run the tests

```bash
cd packages/renderer && python -m pytest -q      # 236 tests, about 10 seconds
```

Four suites, each with a distinct job:

| Suite | What it protects |
|---|---|
| `test_tokens.py` | The design system's own accessibility claims. Recomputes every contrast ratio from the hex values rather than trusting a comment. |
| `test_charts.py` | Chart generators: deterministic output, gaps not bridged, zero never substituted for absence, escaping. |
| `test_privacy.py` | Pseudonymization, redaction, and that each leak test fires on planted material. |
| `test_regressions.py` | Every defect real data found that synthetic input missed. Each test names the data shape responsible. |

## Make a report end to end

```bash
# 1. Analyse. Keep the cache OUT of the working tree: it holds bare mirror
#    clones whose git config embeds the token used to fetch.
export GITHUB_TOKEN=$(gh auth token)
receipts collect --repo axios/axios --since 2025-09-01 \
  --cache /tmp/receipts-cache --out out/

# 2. Publish, redacted, with the leak tests as a gate.
sovix-render out/report.json --out site/ --site --public-repo axios/axios

open site/index.html
```

`sovix-render` exits non-zero and writes nothing if any leak test fails. That is
the intended behaviour — do not add a flag to bypass it in CI. `--allow-leaks`
exists for local diagnosis only.

## Where things live

```
packages/renderer/src/sovix_render/
  tokens.py      Design system as code. Imports nothing from this package.
  model.py       Typed adapter over Receipts JSON 1.0. Keeps None as absence.
  pseudonym.py   HMAC identity. The key must never escape repr() or a manifest.
  redact.py      The 9 field classes. Returns a new Report; never mutates.
  leaktests.py   LT-01..LT-11. Each returns "pass" or "fail: <class>".
  charts.py      One pure function per chart form. Emits static SVG.
  style.py       Stylesheet generated from tokens.
  render.py      Page assembly. One renderer for console, export and artifact.
  site.py        Multi-scope site. Every page gated independently.
  cli.py         load → pseudonymize → redact → render → gate → write
```

The dependency arrow points one way: `tokens` imports nothing, `model` imports
nothing but itself, and `cli` sits at the top. If you find yourself wanting
`tokens.py` to import `model.py`, something has gone wrong.

## Conventions that are load-bearing

**A missing value stays `None` all the way to the renderer.** Do not default it
to `0` anywhere, including in a convenience accessor. The entire honesty claim
rests on absence surviving the trip.

**Never mutate a `Report`.** `redact_report` builds new instances bottom-up. The
leak tests are handed the *original* report deliberately, so they know which
real names to hunt for. Mutating it would make LT-02 scan for pseudonyms and
pass no matter what leaked.

**Redaction is structural; leak tests are a backstop.** If you find yourself
fixing a leak by making a leak test stricter, you are fixing the alarm instead
of the fire. Remove the data in `redact.py`.

**No colour without a second channel.** Every state needs a text form and a
pattern or placement form. `test_tokens.py` enforces that each evidence kind has
a distinct stroke style, so the grammar never depends on colour alone.

**Registry order, never value order.** Sorting anything by a metric value is how
a ranking primitive gets introduced by accident.

## Adding a chart form

1. Add the generator to `charts.py`. Pure function, returns an SVG string, takes
   colours and sizes from `tokens`, hardcodes nothing.
2. It must handle three cases explicitly: a value, no value, and a partial
   value. If you cannot say what it renders for a suppressed point, it is not
   finished.
3. Emit `role="img"` and an `aria-label` naming the encoded dimensions **and**
   the missing regions.
4. Provide an accessible table. Spec 003 requires one for every chart — a table
   is the source, the chart is the summary.
5. Add a determinism test: calling it twice must give identical strings.

## Adding a leak test

Read [spec 004](../specs/004-publish-pipeline/spec.md) first. Then:

1. It takes the rendered artifact and returns `"pass"` or `"fail: <reason>"`.
2. **The reason names the class of the offending value, never the value.** A
   failure message that echoes the secret has leaked it into your CI logs.
3. Add both a true positive and a false positive test. A test that only proves
   it fires is half a test — the false-positive case is what stops someone
   disabling the gate in six months.
4. Run it against real data, not only fixtures. Every false positive found so
   far came from real reports: a contributor named `Eve` matching inside
   "every", another whose address local part is `work` matching the metric label
   "share of work that is new capability", and a same-document SVG `url(#...)`
   read as a remote asset.

## Changing the design system

Edit `tokens.py`, then run `pytest tests/test_tokens.py`. The suite will tell
you if a colour you picked fails contrast, if the ink hierarchy stopped being
monotonic, if two evidence kinds started sharing a stroke style, or if a
categorical colour drifted close enough to another to collapse in grayscale.

If you change a token, update the corresponding table in
[spec 003](../specs/003-evidence-dashboard/spec.md) in the same commit. A spec
that disagrees with the code is worse than no spec, because someone will trust
it.

## Publishing

The [workflow](../.github/workflows/publish-pages.yml) runs weekly and on
demand:

```bash
gh workflow run publish-pages.yml -f repos="axios/axios helm/helm"
```

Two invariants it must keep:

- **It collects only public repositories.** There is no secret beyond the
  ambient read-only `GITHUB_TOKEN`, so a fork or pull request cannot cause
  private data to be published.
- **The gate stops the deploy.** No `continue-on-error`. It also re-greps every
  built page for remote references and email-shaped strings, independently of
  the renderer's own tests, because a renderer verifying itself is not enough
  for something world-readable.

## The specs

`specs/` holds the design, `docs/adr/` holds the decisions and why they were
made. Read the relevant ADR before changing behaviour it governs — each records
the alternatives that were rejected and what would justify revisiting it, which
is usually the context you need.

The ADRs that constrain the most code:

- [ADR-011](adr/ADR-011-team-and-contributor-entities.md) — pseudonymous identity
- [ADR-012](adr/ADR-012-organization-aggregation-tier.md) — why a scope is recomputed, never averaged
- [ADR-013](adr/ADR-013-person-scope-gating.md) — why no ranking primitive exists
- [ADR-014](adr/ADR-014-published-artifact.md) — why publication is not an export
- [ADR-015](adr/ADR-015-tiered-content-capture.md) — content capture tiers
