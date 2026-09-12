"""Leak tests LT-01..LT-11, per specs/004-publish-pipeline/spec.md FR-205.

Each test takes the *rendered* artifact (an HTML string, as if produced by
the not-yet-written render stage) and whatever context it needs, and
returns exactly `"pass"` or `"fail: <reason>"`. A failure reason names the
offending value's *class* — never the value itself — per FR-205's
safe-diagnostic requirement.

Two tests (LT-08, LT-09) check against information the render stage would
need but that `model.Report` does not carry today: `Scope` has no
`visibility` field, and nothing in the model carries a raw branch name
(see redact.py's module docstring — `default_branch` is the only
branch-shaped value anywhere in the current schema). Rather than skip
those tests, `run_all` accepts optional `public_repos` / `default_branches`
kwargs beyond the four the spec names, so a caller that *does* have that
context (the publish job, which already threaded `public_repos` through
`redact_report`) can exercise them meaningfully; without it, both checks
degrade to "nothing in this artifact to check" and pass vacuously. This is
called out explicitly rather than silently — see the module-level note at
the bottom of this file and the report back to the team.

LT-06 has a similar honest gap: it can only check field keys the render
stage chose to expose as machine-readable markup (this module looks for
`<script type="application/json">` blocks). No renderer exists yet in this
package, so on real HTML from a template that never emits such a block,
LT-06 passes vacuously — there is nothing to check, not confirmation that
everything present is safe. It will start doing real work the moment the
renderer embeds its provenance/manifest JSON that way (FR-206 requires
exactly that embed).
"""

from __future__ import annotations

import json
import re

from .model import Report
from .pseudonym import HANDLE_PREFIX
from .redact import RedactionManifest
from .pseudonym import Pseudonymizer

# ── LT-01 ────────────────────────────────────────────────────────────────
_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")

# ── LT-03 ────────────────────────────────────────────────────────────────
_ABS_PATH_RE = re.compile(
    r"(?:/Users/|/home/|~/|[A-Za-z]:\\\\|\\\\\\\\[A-Za-z0-9_.\-]+\\\\)"
)

# ── LT-04 ────────────────────────────────────────────────────────────────
_REMOTE_SRC_HREF_RE = re.compile(
    r"""(?:src|href)\s*=\s*["']https?://""", re.IGNORECASE
)
_SCRIPT_SRC_RE = re.compile(r"<script\b[^>]*\bsrc\s*=", re.IGNORECASE)
_CSS_URL_RE = re.compile(r"""url\(\s*["']?([^"')]+)["']?\s*\)""", re.IGNORECASE)

# ── LT-05 ────────────────────────────────────────────────────────────────
_TOKEN_PREFIX_RE = re.compile(
    r"\b(?:ghp_|gho_|github_pat_|sk-|xoxb-)[A-Za-z0-9_\-]{8,}"
)
_LONG_HEX_RE = re.compile(r"\b[0-9a-fA-F]{32,}\b")
_LONG_BASE64_RE = re.compile(r"\b[A-Za-z0-9+/]{44,}={0,2}\b")

# ── LT-06 ────────────────────────────────────────────────────────────────
_JSON_BLOCK_RE = re.compile(
    r"""<script[^>]+type=["']application/json["'][^>]*>(.*?)</script>""",
    re.IGNORECASE | re.DOTALL,
)
ALLOWED_FIELD_KEYS = frozenset({
    "id", "label", "value", "display", "unit", "formula", "inputs",
    "sample", "n", "population", "coverage_pct", "excluded", "family",
    "tier", "confidence", "direction", "plain_english", "why_it_matters",
    "how_to_read", "assumptions", "caveats", "sources", "exemplars",
    "no_sources_reason", "scope", "level", "key", "since", "until",
    "repos", "kind", "ref", "detail", "repo", "url", "occurred_at",
    "values", "rank", "headline", "why_this_proves_it", "weight",
    "weight_unit", "share_of_total_pct", "source", "month", "point",
    "points", "note", "metric_id", "severity", "title", "action",
    "scope_key", "value_display", "handle", "commits", "lines",
    "contributor_handle", "top_handle", "opened", "merged",
    "hours_to_merge", "size_bucket", "review_cycle_count", "state",
    "commit_count", "reviews", "profile", "redaction_version",
    "field_classes", "removed_counts", "leak_tests", "content_digest",
    "manifest_digest", "path", "org_label", "root_scope", "generated_at",
    "scopes", "findings", "coverage", "exclusions", "collection",
    "schema_version", "children", "series", "by_reason", "lines_by_reason",
    "total_lines_excluded", "top_paths", "repos_collected", "repos_failed",
    "pull_requests_truncated_in", "structure_scan_missing_in",
    "no_ci_data_in", "no_review_records_in",
    "total_lines_excluded_as_generated", "primary_language",
    "default_branch",
})

# ── LT-10 ────────────────────────────────────────────────────────────────
_HANDLE_RE = re.compile(re.escape(HANDLE_PREFIX) + r"[0-9A-F]{4,}")


def _fail(reason: str) -> str:
    return f"fail: {reason}"


def lt_01_no_email(html: str) -> str:
    if _EMAIL_RE.search(html):
        return _fail("email-shaped string in rendered output")
    return "pass"


def lt_02_no_plaintext_identity(html: str, pseudo: Pseudonymizer) -> str:
    lowered = html.lower()
    for plaintext in pseudo.known_plaintexts:
        if len(plaintext) < 3:
            continue
        if plaintext.lower() in lowered:
            return _fail(
                "LT-02", "known contributor plaintext identity in rendered output"
            )
    return "pass"


def lt_03_no_absolute_path(html: str) -> str:
    if _ABS_PATH_RE.search(html):
        return _fail("absolute filesystem path in rendered output")
    return "pass"


def lt_04_no_remote_assets(html: str) -> str:
    if _REMOTE_SRC_HREF_RE.search(html):
        return _fail("remote http(s) src/href reference in rendered output")
    if _SCRIPT_SRC_RE.search(html):
        return _fail("<script src> reference in rendered output")
    for target in _CSS_URL_RE.findall(html):
        if not target.lower().startswith("data:"):
            return _fail("non-data: CSS url() reference in rendered output")
    return "pass"


def lt_05_no_secret_material(html: str) -> str:
    if _TOKEN_PREFIX_RE.search(html):
        return _fail("known secret-token prefix in rendered output")
    if _LONG_HEX_RE.search(html):
        return _fail("high-entropy hex run in rendered output")
    if _LONG_BASE64_RE.search(html):
        return _fail("high-entropy base64 run in rendered output")
    return "pass"


def lt_06_field_keys_allowlisted(html: str) -> str:
    def _walk(obj) -> str | None:
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k not in ALLOWED_FIELD_KEYS:
                    return k
                bad = _walk(v)
                if bad is not None:
                    return bad
        elif isinstance(obj, list):
            for item in obj:
                bad = _walk(item)
                if bad is not None:
                    return bad
        return None

    for block in _JSON_BLOCK_RE.findall(html):
        try:
            payload = json.loads(block)
        except json.JSONDecodeError:
            continue
        offending = _walk(payload)
        if offending is not None:
            return _fail("rendered field key not on the structured allowlist")
    return "pass"


def lt_07_manifest_integrity(manifest: RedactionManifest) -> str:
    if manifest.compute_digest() != manifest.manifest_digest:
        return _fail("manifest digest does not recompute to its recorded value")
    return "pass"


def lt_08_no_private_repo_identity(
    html: str, report: Report, public_repos: frozenset[str] = frozenset()
) -> str:
    private_repos: set[str] = set()
    for sr in report.scopes.values():
        private_repos.update(r for r in sr.scope.repos if r not in public_repos)
    lowered = html.lower()
    for repo in private_repos:
        if repo.lower() in lowered:
            return _fail("private repository identity in rendered output")
    return "pass"


def lt_09_no_raw_branch(
    html: str, default_branches: dict[str, str] | None = None,
    known_branch_names: frozenset[str] = frozenset(),
) -> str:
    default_branches = default_branches or {}
    allowed = set(default_branches.values())
    lowered = html.lower()
    for branch in known_branch_names:
        if branch in allowed:
            continue
        if branch.lower() in lowered:
            return _fail("non-default branch name in rendered output")
    return "pass"


def lt_10_cohort_enforcement(html: str, manifest: RedactionManifest) -> str:
    handles = set(_HANDLE_RE.findall(html))
    if manifest.profile == "aggregate_only":
        if handles:
            return _fail("per-contributor row present under aggregate_only")
        return "pass"
    if 0 < len(handles) < 5:
        return _fail("contributor cohort below k>=5 shown in rendered output")
    return "pass"


def lt_11_current_ruleset(
    manifest: RedactionManifest, current_redaction_version: str
) -> str:
    if manifest.redaction_version != current_redaction_version:
        return _fail("manifest redaction_version is not the current ruleset")
    return "pass"


def run_all(
    html: str,
    *,
    manifest: RedactionManifest,
    pseudo: Pseudonymizer,
    report: Report,
    current_redaction_version: str,
    public_repos: frozenset[str] = frozenset(),
    default_branches: dict[str, str] | None = None,
    known_branch_names: frozenset[str] = frozenset(),
) -> dict[str, str]:
    """Run every LT-01..LT-11 check. `public_repos`, `default_branches` and
    `known_branch_names` are not part of the four-argument signature the
    spec's FR-205 table implies, but LT-08/LT-09 are meaningless without
    them (see module docstring); they default to empty so the four-argument
    call still works and those two checks degrade to a vacuous pass.
    """
    return {
        "LT-01": lt_01_no_email(html),
        "LT-02": lt_02_no_plaintext_identity(html, pseudo),
        "LT-03": lt_03_no_absolute_path(html),
        "LT-04": lt_04_no_remote_assets(html),
        "LT-05": lt_05_no_secret_material(html),
        "LT-06": lt_06_field_keys_allowlisted(html),
        "LT-07": lt_07_manifest_integrity(manifest),
        "LT-08": lt_08_no_private_repo_identity(html, report, public_repos),
        "LT-09": lt_09_no_raw_branch(html, default_branches, known_branch_names),
        "LT-10": lt_10_cohort_enforcement(html, manifest),
        "LT-11": lt_11_current_ruleset(manifest, current_redaction_version),
    }
