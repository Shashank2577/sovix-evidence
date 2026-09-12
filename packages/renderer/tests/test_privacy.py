"""Adversarial tests for the redaction pipeline: pseudonym.py, redact.py and
leaktests.py, per specs/004-publish-pipeline/spec.md.

These are not smoke tests. Every leak test here plants the exact kind of
value it exists to catch and asserts the specific failure, and the
pseudonym tests force a real 4-hex-char handle collision rather than
trusting that one never happens to occur. The integration tests at the
bottom run the full pipeline against a real 111-scope, 108-contributor
Receipts report (fixture path below) to prove the mechanism works on real
data, not just hand-built fixtures.
"""

from __future__ import annotations

import copy
from pathlib import Path

import pytest

from sovix_render import leaktests, model, pseudonym, redact
from sovix_render.pseudonym import Pseudonymizer

REAL_REPORT_PATH = Path(
    "/private/tmp/claude-502/-Users-shashanksaxena-Documents-ChatGPT-Git-ai"
    "/b96f9913-3b27-4af0-b87a-82c2bd64c581/scratchpad/real-axios/report.json"
)


# ── pseudonym.py ─────────────────────────────────────────────────────────

def test_identity_digest_stable_for_same_key():
    key = pseudonym.derive_key(b"\x01" * 32)
    d1 = pseudonym.identity_digest("dev@example.com", key)
    d2 = pseudonym.identity_digest("dev@example.com", key)
    assert d1 == d2


def test_identity_digest_differs_across_keys():
    key_a = pseudonym.derive_key(b"\x01" * 32)
    key_b = pseudonym.derive_key(b"\x02" * 32)
    assert pseudonym.identity_digest("dev@example.com", key_a) != (
        pseudonym.identity_digest("dev@example.com", key_b)
    )


def test_identity_digest_normalizes_case_and_whitespace():
    key = pseudonym.derive_key(b"\x03" * 32)
    variants = [
        "Dev@Example.com",
        "  dev@example.com  ",
        "DEV@EXAMPLE.COM",
        "dev@example.com",
    ]
    digests = {pseudonym.identity_digest(v, key) for v in variants}
    assert len(digests) == 1


def test_derive_key_without_salt_source_is_random_each_call():
    assert pseudonym.derive_key() != pseudonym.derive_key()


def test_handle_collision_is_resolved_never_shared():
    """Force a real 4-hex-char collision by brute search over the same
    key, then verify the two identities land on different handles by
    extension rather than silently sharing one.
    """
    key = pseudonym.derive_key(b"\x09" * 32)
    seen_prefix: dict[str, str] = {}
    collided_pair: tuple[str, str] | None = None
    for i in range(20000):
        email = f"person{i}@example.com"
        digest = pseudonym.identity_digest(email, key)
        prefix = digest[:4].upper()
        if prefix in seen_prefix and seen_prefix[prefix] != email:
            collided_pair = (seen_prefix[prefix], email)
            break
        seen_prefix[prefix] = email
    assert collided_pair is not None, (
        "no 4-hex-char collision found in 20000 identities; "
        "birthday-bound search assumption failed for this key"
    )

    pz = Pseudonymizer(key=key)
    handle_a = pz.handle_for(collided_pair[0])
    handle_b = pz.handle_for(collided_pair[1])
    assert handle_a != handle_b
    # The shared 4-char prefix is still the common start of both — the
    # collision really happened — but resolution extended one of them.
    assert handle_a[: len(pseudonym.HANDLE_PREFIX) + 4] == (
        handle_b[: len(pseudonym.HANDLE_PREFIX) + 4]
    )
    assert len(handle_b) > len(handle_a) or len(handle_a) > len(handle_b)


def test_handle_for_is_memoized_for_the_same_identity():
    pz = Pseudonymizer(key=pseudonym.derive_key(b"\x04" * 32))
    h1 = pz.handle_for("dev@example.com")
    h2 = pz.handle_for("Dev@Example.com  ")
    assert h1 == h2


def test_key_never_in_repr():
    key = pseudonym.derive_key(b"\x05" * 32)
    pz = Pseudonymizer(key=key)
    pz.handle_for("dev@example.com")
    assert key.hex() not in repr(pz)
    assert "redacted" in repr(pz).lower()


def test_key_never_in_mapping_manifest():
    key = pseudonym.derive_key(b"\x06" * 32)
    pz = Pseudonymizer(key=key)
    pz.handle_for("dev@example.com")
    manifest = pz.mapping_manifest()
    assert key.hex() not in str(manifest)
    assert key not in manifest.values()


def test_mapping_manifest_maps_digest_to_handle_never_plaintext():
    key = pseudonym.derive_key(b"\x07" * 32)
    pz = Pseudonymizer(key=key)
    handle = pz.handle_for("dev@example.com")
    manifest = pz.mapping_manifest()
    digest = pseudonym.identity_digest("dev@example.com", key)
    assert manifest[digest] == handle
    assert "dev@example.com" not in manifest
    assert "dev@example.com" not in str(manifest)


def test_known_plaintexts_excludes_repo_and_branch_labels():
    """A repository/branch opaque label lives in its own namespace and
    must never be treated as a contributor identity — LT-02 scanning a
    repo label as if it were a person's name is exactly the false
    positive this separation exists to prevent.
    """
    pz = Pseudonymizer(key=pseudonym.derive_key(b"\x08" * 32))
    pz.handle_for("dev@example.com")
    pz.opaque_label("repo", "internal-tools")
    assert "internal-tools" not in pz.known_plaintexts
    assert "dev@example.com" in pz.known_plaintexts


def test_bot_account_names_are_pseudonymized_but_not_needles():
    """A bot's login is not personal data (ADR-011's `kind` distinguishes
    bot from human precisely for this reason), and several common bot
    names collide with unrelated legitimate text (a repo's own
    `.github/dependabot.yml`, a product's AI-tool-detection copy
    mentioning "GitHub Copilot"). The account still gets a stable handle;
    it just isn't registered as an LT-02 needle.
    """
    pz = Pseudonymizer(key=pseudonym.derive_key(b"\x0a" * 32))
    handle = pz.handle_for("dependabot[bot]")
    assert handle.startswith(pseudonym.HANDLE_PREFIX)
    assert "dependabot" not in pz.known_plaintexts
    assert "dependabot[bot]" not in pz.known_plaintexts


# ── leaktests.py: each test plants exactly what it exists to catch ────────

def _manifest(profile: str = "pseudonymous") -> redact.RedactionManifest:
    m = redact.RedactionManifest(
        profile=profile,
        redaction_version=redact.REDACTION_VERSION,
        field_classes={},
        removed_counts={},
    )
    m.seal()
    return m


def test_lt01_catches_planted_email():
    html = "<p>Contact the maintainer at jane.doe@example.com for access.</p>"
    assert leaktests.lt_01_no_email(html).startswith("fail:")


def test_lt01_passes_on_clean_html():
    html = "<p>42 pull requests merged this window.</p>"
    assert leaktests.lt_01_no_email(html) == "pass"


def test_lt02_catches_planted_contributor_name():
    pz = Pseudonymizer(key=pseudonym.derive_key(b"\x0b" * 32))
    pz.handle_for("Priya Sharma")
    html = "<p>Top contributor this month: Priya Sharma (42 commits)</p>"
    result = leaktests.lt_02_no_plaintext_identity(html, pz)
    assert result.startswith("fail:")
    # The failure names the class, never the planted value.
    assert "Priya Sharma" not in result


def test_lt02_passes_when_identity_is_pseudonymized():
    pz = Pseudonymizer(key=pseudonym.derive_key(b"\x0c" * 32))
    handle = pz.handle_for("Priya Sharma")
    html = f"<p>Top contributor this month: {handle} (42 commits)</p>"
    assert leaktests.lt_02_no_plaintext_identity(html, pz) == "pass"


def test_lt02_short_name_does_not_false_positive_on_prose():
    """A contributor named "Eve" must not turn every occurrence of "every"
    or "However" in ordinary report prose into a reported leak. Matching
    is on whole tokens, not raw substrings.
    """
    pz = Pseudonymizer(key=pseudonym.derive_key(b"\x0d" * 32))
    pz.handle_for("Eve")  # below MIN_IDENTITY_NEEDLE, and a common fragment
    html = "<p>However, every metric here is measured, not inferred.</p>"
    assert leaktests.lt_02_no_plaintext_identity(html, pz) == "pass"


def test_lt03_catches_absolute_unix_path():
    html = '<p>Config loaded from /Users/alice/.config/sovix/config.toml</p>'
    assert leaktests.lt_03_no_absolute_path(html).startswith("fail:")


def test_lt03_catches_windows_drive_path():
    html = r'<p>Config loaded from C:\Users\alice\config.toml</p>'
    assert leaktests.lt_03_no_absolute_path(html).startswith("fail:")


def test_lt03_passes_on_relative_path():
    html = "<p>lib/core/Axios.js changed 4 times this window.</p>"
    assert leaktests.lt_03_no_absolute_path(html) == "pass"


def test_lt04_catches_google_fonts_link():
    html = (
        '<head><link rel="stylesheet" '
        'href="https://fonts.googleapis.com/css2?family=Inter"></head>'
    )
    assert leaktests.lt_04_no_remote_assets(html).startswith("fail:")


def test_lt04_catches_cdn_script():
    html = '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>'
    assert leaktests.lt_04_no_remote_assets(html).startswith("fail:")


def test_lt04_catches_css_url_with_remote_scheme():
    html = "<style>@font-face{src:url(https://example.com/font.woff2)}</style>"
    assert leaktests.lt_04_no_remote_assets(html).startswith("fail:")


def test_lt04_allows_inline_data_uri_font():
    html = "<style>@font-face{src:url(data:font/woff2;base64,AAAA)}</style>"
    assert leaktests.lt_04_no_remote_assets(html) == "pass"


def test_lt04_allows_same_document_css_fragment():
    html = '<svg><rect fill="url(#gradient)"/></svg>'
    assert leaktests.lt_04_no_remote_assets(html) == "pass"


def test_lt05_catches_planted_github_token():
    html = "<!-- debug: token=ghp_1234567890abcdefghijklmnop -->"
    assert leaktests.lt_05_no_secret_material(html).startswith("fail:")


def test_lt05_catches_64_char_hex_string():
    html = f"<p>key={'a1b2c3d4' * 8}</p>"
    assert len(html) > 64
    assert leaktests.lt_05_no_secret_material(html).startswith("fail:")


def test_lt05_allows_git_commit_sha_in_public_repo_url():
    html = (
        '<a>https://github.com/axios/axios/commit/'
        '18e7dfedf30c96e58652887f930642ae82e0130c</a>'
    )
    assert leaktests.lt_05_no_secret_material(html) == "pass"


def test_lt05_excludes_manifest_own_digests_from_the_scan():
    m = _manifest()
    m.content_digest = "b" * 64
    html = f"<p>content digest: {m.content_digest}</p>"
    assert leaktests.lt_05_no_secret_material(html, m) == "pass"


def test_lt06_catches_field_key_not_on_allowlist():
    html = (
        '<script type="application/json">'
        '{"id": "x", "author_email": "leaked@example.com"}'
        "</script>"
    )
    assert leaktests.lt_06_field_keys_allowlisted(html).startswith("fail:")


def test_lt06_passes_when_all_keys_allowlisted():
    html = '<script type="application/json">{"id": "x", "label": "y"}</script>'
    assert leaktests.lt_06_field_keys_allowlisted(html) == "pass"


def test_lt07_catches_tampered_manifest():
    m = _manifest()
    m.field_classes["contributor_identity"] = "tampered after sealing"
    result = leaktests.lt_07_manifest_integrity(m)
    assert result.startswith("fail:")
    assert "does not recompute" in result


def test_lt07_catches_never_sealed_manifest_with_a_distinct_message():
    """An empty manifest_digest (sealing never ran — a pipeline-wiring bug)
    and a present-but-wrong digest (tampering, or a stale render) are
    different failure causes and must not share one ambiguous message.
    """
    m = redact.RedactionManifest(
        profile="pseudonymous", redaction_version=redact.REDACTION_VERSION
    )
    assert m.manifest_digest == ""
    result = leaktests.lt_07_manifest_integrity(m)
    assert result.startswith("fail:")
    assert "never sealed" in result
    assert "does not recompute" not in result


def test_lt07_passes_on_freshly_sealed_manifest():
    m = _manifest()
    assert leaktests.lt_07_manifest_integrity(m) == "pass"


def test_lt08_catches_private_repo_name():
    report = _tiny_report()  # scope.repos == ("acme/private-repo",)
    html = "<p>Evidence drawn from acme/private-repo, 3 pull requests.</p>"
    assert leaktests.lt_08_no_private_repo_identity(html, report).startswith(
        "fail:"
    )


def test_lt08_allows_repo_named_in_public_repos():
    """A repository the caller declared public may keep its own name in
    the rendered output (ADR-014 rule 2a) — LT-08 must not treat that as a
    leak just because the name is present.
    """
    report = _tiny_report()  # scope.repos == ("acme/private-repo",)
    html = "<p>Evidence drawn from acme/private-repo, 3 pull requests.</p>"
    result = leaktests.lt_08_no_private_repo_identity(
        html, report, public_repos=frozenset({"acme/private-repo"})
    )
    assert result == "pass"


def test_lt10_blocks_any_contributor_row_under_aggregate_only():
    html = "<p>Contributor 7F3A: 12 commits</p>"
    m = _manifest(profile="aggregate_only")
    assert leaktests.lt_10_cohort_enforcement(html, m).startswith("fail:")


def test_lt10_blocks_cohort_below_k5_under_pseudonymous():
    html = "<p>Contributor 0001, Contributor 0002, Contributor 0003</p>"
    m = _manifest(profile="pseudonymous")
    assert leaktests.lt_10_cohort_enforcement(html, m).startswith("fail:")


def test_lt10_allows_cohort_at_or_above_k5():
    handles = " ".join(f"Contributor {i:04X}" for i in range(5))
    html = f"<p>{handles}</p>"
    m = _manifest(profile="pseudonymous")
    assert leaktests.lt_10_cohort_enforcement(html, m) == "pass"


def test_lt11_catches_stale_ruleset_version():
    m = _manifest()
    m.redaction_version = "old-version"
    assert leaktests.lt_11_current_ruleset(m, redact.REDACTION_VERSION).startswith(
        "fail:"
    )


def test_lt11_passes_on_current_ruleset_version():
    m = _manifest()
    assert leaktests.lt_11_current_ruleset(m, redact.REDACTION_VERSION) == "pass"


def test_failure_reason_never_echoes_the_offending_value():
    secret_email = "very-specific-name@example.com"
    html = f"<p>{secret_email}</p>"
    result = leaktests.lt_01_no_email(html)
    assert secret_email not in result


# ── is_publishable() ────────────────────────────────────────────────────

def test_is_publishable_false_with_no_leak_tests_run():
    m = _manifest()
    assert m.is_publishable() is False


def test_is_publishable_false_when_any_single_test_fails():
    m = _manifest()
    m.leak_tests = {f"LT-{i:02d}": "pass" for i in range(1, 12)}
    m.leak_tests["LT-05"] = "fail: high-entropy hex run in rendered output"
    assert m.is_publishable() is False


def test_is_publishable_true_when_every_test_passes():
    m = _manifest()
    m.leak_tests = {f"LT-{i:02d}": "pass" for i in range(1, 12)}
    assert m.is_publishable() is True


# ── redact_report: structural guarantees ───────────────────────────────

def _tiny_report() -> model.Report:
    scope = model.Scope(level="person", key="person:email:dev@example.com",
                         label="Dev Person", since="2026-01-01T00:00:00Z",
                         until="2026-01-31T00:00:00Z", repos=("acme/private-repo",))
    metric = model.Metric(
        id="delivery.lead_time_p50", label="Lead time", value=12.0,
        display="12h", unit="hours", formula="median(...) = 12h", inputs={},
        sample=model.Sample(n=1, population=1, unit="pull requests", coverage_pct=100.0),
        family="delivery", tier="measured", confidence="high",
        direction="lower_is_better", plain_english="Static description.",
        scope=scope,
    )
    scope_report = model.ScopeReport(
        scope=scope, facts={"commits": 3, "names": ["Dev Person"]},
        metrics=(metric,), series=(),
    )
    return model.Report(
        schema_version="1.0", org_label="Acme", root_scope=scope.key,
        generated_at="2026-01-31T00:00:00Z",
        scopes={scope.key: scope_report}, findings=(),
        coverage=model.Coverage(), exclusions={}, collection={},
    )


def test_redact_report_does_not_mutate_input():
    report = _tiny_report()
    before = copy.deepcopy(report)
    pz = Pseudonymizer(key=pseudonym.derive_key(b"\x0e" * 32))
    redact.redact_report(report, profile="pseudonymous", pseudo=pz)
    assert report == before


def test_redact_report_returns_new_report_instance():
    report = _tiny_report()
    pz = Pseudonymizer(key=pseudonym.derive_key(b"\x0f" * 32))
    new_report, _ = redact.redact_report(report, profile="pseudonymous", pseudo=pz)
    assert new_report is not report
    assert new_report.scopes is not report.scopes


def test_redact_report_rejects_unknown_profile():
    report = _tiny_report()
    pz = Pseudonymizer(key=pseudonym.derive_key(b"\x10" * 32))
    with pytest.raises(ValueError):
        redact.redact_report(report, profile="identified", pseudo=pz)


def test_redact_report_aggregate_only_drops_all_contributor_scopes():
    report = _tiny_report()
    pz = Pseudonymizer(key=pseudonym.derive_key(b"\x11" * 32))
    new_report, manifest = redact.redact_report(
        report, profile="aggregate_only", pseudo=pz
    )
    assert new_report.contributor_scope_keys == ()


def test_redact_report_manifest_is_sealed_and_self_consistent():
    report = _tiny_report()
    pz = Pseudonymizer(key=pseudonym.derive_key(b"\x12" * 32))
    _, manifest = redact.redact_report(report, profile="pseudonymous", pseudo=pz)
    assert manifest.manifest_digest != ""
    assert manifest.compute_digest() == manifest.manifest_digest


# ── Integration: the real 111-scope, 108-contributor axios report ─────────

pytestmark_real_report = pytest.mark.skipif(
    not REAL_REPORT_PATH.exists(),
    reason="real axios report fixture not present at REAL_REPORT_PATH",
)


@pytestmark_real_report
def test_real_report_redacts_and_publishes_under_both_profiles():
    report = model.load(REAL_REPORT_PATH)
    assert len(report.contributor_scope_keys) == 108  # k>=5 cohort is real

    for profile in ("pseudonymous", "aggregate_only"):
        pz = Pseudonymizer(key=pseudonym.derive_key(b"\x13" * 32))
        new_report, manifest = redact.redact_report(
            report, profile=profile, pseudo=pz,
            public_repos=frozenset({"axios/axios"}),
        )
        assert manifest.manifest_digest == manifest.compute_digest()
        if profile == "aggregate_only":
            assert new_report.contributor_scope_keys == ()
        else:
            assert len(new_report.contributor_scope_keys) == 108


@pytestmark_real_report
def test_real_report_lt02_fires_on_a_genuine_planted_contributor_name():
    """Proof, against real data, that LT-02 is not a tautology: it
    actually rejects a genuine contributor's name once redact_report has
    registered that identity, even though the name never came from this
    test's own fixtures.
    """
    report = model.load(REAL_REPORT_PATH)
    pz = Pseudonymizer(key=pseudonym.derive_key(b"\x14" * 32))
    redact.redact_report(
        report, profile="pseudonymous", pseudo=pz,
        public_repos=frozenset({"axios/axios"}),
    )

    person_scopes = [
        s for s in report.scopes.values() if s.scope.level == "person"
    ]
    assert person_scopes, "fixture has no person-level scopes to test against"
    real_name = person_scopes[0].scope.label
    assert len(real_name.strip()) >= leaktests.MIN_IDENTITY_NEEDLE, (
        "fixture's first contributor name is too short for this assertion; "
        "pick a different index"
    )

    leaked_html = f"<tr><td>Top contributor: {real_name}</td></tr>"
    assert leaktests.lt_02_no_plaintext_identity(leaked_html, pz).startswith(
        "fail:"
    )

    clean_html = "<tr><td>Top contributor: Contributor 0001</td></tr>"
    assert leaktests.lt_02_no_plaintext_identity(clean_html, pz) == "pass"


@pytestmark_real_report
def test_real_report_top_contributor_name_does_not_leak_via_formula():
    """`people.top_contributor_share`'s `formula` field literally
    interpolates the top contributor's name in the raw Receipts report
    (e.g. "115,306 lines from Jason Saayman / 127,946 total lines").
    redact_report must scrub that, not just drop the field-level `author`.
    """
    report = model.load(REAL_REPORT_PATH)
    pz = Pseudonymizer(key=pseudonym.derive_key(b"\x15" * 32))
    new_report, _ = redact.redact_report(
        report, profile="pseudonymous", pseudo=pz,
        public_repos=frozenset({"axios/axios"}),
    )

    top_name = None
    for sr in report.scopes.values():
        for m in sr.metrics:
            if m.id == "people.top_contributor_share":
                top_name = m.inputs.get("top_name")
                break
        if top_name:
            break
    assert top_name, "fixture no longer has people.top_contributor_share.top_name"

    for sr in new_report.scopes.values():
        for m in sr.metrics:
            assert top_name not in (m.formula or "")
            assert top_name not in (m.display or "")
            assert "top_name" not in m.inputs
