"""Regressions found by running against real data, pinned so they stay fixed.

Every test here corresponds to a defect that unit tests on synthetic input did
not catch. Each names the data shape that caused it, because the shape is the
thing worth remembering: the bug was never in the logic in isolation, it was
in an assumption about what real reports contain.
"""

from __future__ import annotations

import pytest

from sovix_render import leaktests as L
from sovix_render.model import (
    Coverage,
    Metric,
    Report,
    Sample,
    Scope,
    ScopeReport,
    Series,
    SeriesPoint,
    Source,
)
from sovix_render.pseudonym import Pseudonymizer, derive_key
from sovix_render.redact import redact_report


def _sample(n: int = 1, population: int = 1) -> Sample:
    return Sample(n=n, population=population, unit="pull requests", coverage_pct=100.0)


def _metric(**kw) -> Metric:
    base = dict(
        id="process.review_coverage",
        label="Share of merged changes with a recorded review",
        value=50.0,
        display="50.0%",
        unit="percent",
        formula="1 reviewed / 2 merged = 50.0%",
        inputs={"reviewed": 1, "merged": 2, "value": 50.0},
        sample=_sample(2, 2),
        family="process",
        tier="measured",
        confidence="high",
        direction="higher_is_better",
    )
    base.update(kw)
    return Metric(**base)


def _report(metrics: tuple[Metric, ...]) -> Report:
    scope = Scope(level="repo", key="repo:acme/thing", label="acme/thing",
                  since="2026-01-01T00:00:00+00:00", until="2026-06-01T00:00:00+00:00",
                  repos=("acme/thing",))
    sr = ScopeReport(scope=scope, facts={"commits": 10, "contributors": 3},
                     metrics=metrics,
                     series=(Series(id="commits", label="Commits per month",
                                    unit="commits",
                                    points=(SeriesPoint("2026-01", 5.0),
                                            SeriesPoint("2026-02", None))),))
    return Report(
        schema_version="1.0", org_label="acme", root_scope="repo:acme/thing",
        generated_at="2026-06-01T00:00:00+00:00", scopes={"repo:acme/thing": sr},
        findings=(), coverage=Coverage(repos_collected=1), exclusions={}, collection={},
    )


# ── The cohort-widening crash ──────────────────────────────────────────────

@pytest.mark.parametrize("merged_value", [1, 0, 1727000000, 3.5, True])
def test_non_string_merged_value_does_not_crash_redaction(merged_value) -> None:
    """`merged` on a source is an ISO string for a pull request and an integer
    on other source kinds.

    Timestamp coarsening indexed it as a string, so redaction raised
    `TypeError: 'int' object is not subscriptable`. This only appeared once the
    published cohort grew past a single repository, which is exactly why a
    synthetic-only test suite reported green while the publish job died.
    """
    src = Source(kind="pull_request", ref="#1", detail="merged",
                 values={"author": "Ada Lovelace", "merged": merged_value,
                         "opened": "2026-03-01T10:00:00+00:00"})
    report = _report((_metric(sources=(src,)),))
    redacted, manifest = redact_report(
        report, profile="pseudonymous", pseudo=Pseudonymizer(derive_key()),
        public_repos=frozenset(),
    )
    # The scope KEY is itself pseudonymized when the repository is not public,
    # so look the scope up by position rather than by its original key.
    (only,) = redacted.scopes.values()
    assert only.metrics  # redaction completed at all


def test_string_timestamp_is_still_coarsened_to_a_date() -> None:
    """Fixing the crash must not stop the coarsening from working."""
    src = Source(kind="pull_request", ref="#1", detail="merged",
                 values={"opened": "2026-03-01T10:34:56+00:00"})
    redacted, _ = redact_report(
        _report((_metric(sources=(src,)),)), profile="pseudonymous",
        pseudo=Pseudonymizer(derive_key()), public_repos=frozenset(),
    )
    (only,) = redacted.scopes.values()
    out = only.metrics[0].sources[0].values
    assert out.get("opened") == "2026-03-01", out


# ── The formula leak vector ────────────────────────────────────────────────

def test_identity_in_a_formula_string_is_scrubbed() -> None:
    """Receipts interpolates a contributor's real name into `formula`:
    "115,306 lines from Jason Saayman / 125,756 total lines = 91.7%".

    The published page escaped this only because the renderer happened not to
    print that particular derivation. Identity must be removed from the data,
    not avoided by layout.
    """
    m = _metric(
        id="people.top_contributor_share",
        family="people",
        formula="900 lines from Ada Lovelace / 1,000 total lines = 90.0%",
        inputs={"top_name": "Ada Lovelace", "top_lines": 900, "total_lines": 1000},
    )
    pseudo = Pseudonymizer(derive_key())
    redacted, _ = redact_report(_report((m,)), profile="pseudonymous",
                                pseudo=pseudo, public_repos=frozenset())
    (only,) = redacted.scopes.values()
    out = only.metrics[0]
    assert "Ada Lovelace" not in out.formula, out.formula
    assert "Contributor" in out.formula, out.formula
    # The arithmetic must survive the scrub: a redacted formula still has to
    # let a reader check the division.
    assert "900" in out.formula and "1,000" in out.formula


def test_redaction_does_not_mutate_its_input() -> None:
    """The leak tests are handed the ORIGINAL report so they know which names
    to hunt for. If redaction mutated it in place, LT-02 would be scanning for
    pseudonyms and would pass no matter what leaked."""
    m = _metric(formula="900 lines from Ada Lovelace / 1,000 total = 90.0%")
    report = _report((m,))
    before = report.scopes["repo:acme/thing"].metrics[0].formula
    redact_report(report, profile="pseudonymous", pseudo=Pseudonymizer(derive_key()),
                  public_repos=frozenset())
    after = report.scopes["repo:acme/thing"].metrics[0].formula
    assert before == after == "900 lines from Ada Lovelace / 1,000 total = 90.0%"


# ── LT-02 false positives that made the gate untrustworthy ────────────────

def test_short_name_inside_an_ordinary_word_is_not_a_leak() -> None:
    """A contributor named Eve matched inside "every" and "However"."""
    pseudo = Pseudonymizer(derive_key())
    pseudo.handle_for("Eve")
    assert L.lt_02_no_plaintext_identity("<p>every However</p>", pseudo) == "pass"


def test_generic_email_local_part_is_not_a_leak() -> None:
    """A real contributor uses work@<domain>. Recording the bare local part
    made LT-02 flag the metric label "share of work that is new capability"."""
    pseudo = Pseudonymizer(derive_key())
    pseudo.handle_for("work@marcosnocetti.com")
    html = "<h3>share of work that is new capability</h3>"
    assert L.lt_02_no_plaintext_identity(html, pseudo) == "pass"


def test_full_address_still_caught_even_though_local_part_is_not() -> None:
    pseudo = Pseudonymizer(derive_key())
    pseudo.handle_for("work@marcosnocetti.com")
    verdict = L.lt_02_no_plaintext_identity("<p>work@marcosnocetti.com</p>", pseudo)
    assert verdict.startswith("fail")


def test_repository_label_is_not_an_identity_needle() -> None:
    """Repository labels go through the same pseudonymizer. Pooling the needle
    sets let a four-letter repo label be reported as a contributor leak."""
    pseudo = Pseudonymizer(derive_key())
    pseudo.opaque_label("repo", "work")
    assert L.lt_02_no_plaintext_identity("<h3>share of work</h3>", pseudo) == "pass"
    assert "work" not in {p.lower() for p in pseudo.known_plaintexts}


def test_same_document_svg_fragment_is_not_a_remote_asset() -> None:
    """url(#p-partial) applies the partial-interval hatch. LT-04 read it as a
    non-data CSS url and blocked every publish."""
    html = '<style>rect{fill:url(#p-partial)}</style>'
    assert L.lt_04_no_remote_assets(html) == "pass"


@pytest.mark.parametrize(
    "css",
    [
        '<style>a{background:url(https://cdn.example/x.png)}</style>',
        '<style>a{background:url(//cdn.example/x.png)}</style>',
        '<style>a{background:url(javascript:alert(1))}</style>',
    ],
)
def test_absolute_scheme_in_css_url_still_fails(css: str) -> None:
    """Allowing fragments must not allow an actual network reference."""
    assert L.lt_04_no_remote_assets(css).startswith("fail")
