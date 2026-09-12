"""Redaction pipeline stage, per specs/004-publish-pipeline/spec.md.

`redact_report` turns an internal `Report` into a publishable one by
applying the Redaction Rules table (spec.md, "Redaction Rules") per field
class, for one of two `PROFILES`. It never mutates its input: every
transformed dataclass is a new instance, built bottom-up from the leaves.

Design notes that are not spelled out field-by-field below, because they
apply uniformly:

- **Repository and branch names** go through `Pseudonymizer.opaque_label`
  (a separate label space from contributor handles) unless the repository
  is in `public_repos`, per ADR-014 rule 2a. A repository's `default_branch`
  is the one branch name allowed to survive regardless of visibility
  (spec.md Redaction Rules, "Branch name" row) because a default branch
  name ("main") is not identity-bearing on its own.
- **Free text** (spec.md Redaction Rules row 9) is excluded by default. The
  only free-text fields that survive are `Metric.plain_english`,
  `.why_it_matters`, `.how_to_read`, `.assumptions`, `.caveats` and
  `.no_sources_reason`: static per-metric-definition prose that never
  varies with the data being reported. Anything *derived from* the
  data — a `Finding.detail`, a `Source.detail`, an `Exemplar.headline`
  or `why_this_proves_it`, a PR title, a commit message, a collection
  note — is dynamically generated from contributor-authored text and
  cannot be mechanically verified safe (LT-06), so it is dropped or
  replaced with a synthetic, structured-only equivalent rather than kept
  verbatim. This is the one leak test (LT-06) that shapes the design of
  the whole module: only an allowlist of field keys is something a test
  can check exhaustively; a denylist is defeated by the next field someone
  adds upstream.
- **Cohort suppression (k>=5)**: under `pseudonymous`, a per-contributor
  breakdown is only shown if the report has at least 5 distinct
  contributors overall. Below that, contributor-level scopes and
  `top_contributors` breakdowns are dropped entirely, same as
  `aggregate_only` — a cohort that size makes ranking-by-exclusion
  possible even through pseudonyms (spec.md Redaction Rules row 1;
  security.md k>=5).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field, replace

from .model import (
    Coverage,
    Exemplar,
    Finding,
    Metric,
    Report,
    Scope,
    ScopeReport,
    Series,
    Source,
)
from .pseudonym import Pseudonymizer

PROFILES = ("pseudonymous", "aggregate_only")

REDACTION_VERSION = "2026-09-12.1"

K_ANONYMITY_MIN = 5

# Substituted for a contributor identity inside free text such as a rendered
# formula. Deliberately not a handle: a handle in prose discloses one
# individual and can be cross-referenced between pages, while a cohort
# listing of at least K_ANONYMITY_MIN is where a handle belongs.
CONTRIBUTOR_TEXT_MARKER = "a contributor"

# ── Field classes, per the Redaction Rules table ────────────────────────────
CLASS_CONTRIBUTOR_IDENTITY = "contributor_identity"
CLASS_REPOSITORY_NAME = "repository_name"
CLASS_FILE_PATH = "file_path"
CLASS_BRANCH_NAME = "branch_name"
CLASS_COMMIT_MESSAGE = "commit_message"
CLASS_PR_TITLE = "pr_title"
CLASS_URL = "url"
CLASS_TIMESTAMP = "timestamp_granularity"
CLASS_FREE_TEXT = "free_text"

_ALL_CLASSES = (
    CLASS_CONTRIBUTOR_IDENTITY,
    CLASS_REPOSITORY_NAME,
    CLASS_FILE_PATH,
    CLASS_BRANCH_NAME,
    CLASS_COMMIT_MESSAGE,
    CLASS_PR_TITLE,
    CLASS_URL,
    CLASS_TIMESTAMP,
    CLASS_FREE_TEXT,
)

# Static, per-metric-definition prose. Identical for every report; never
# derived from contributor data. The only free text this module keeps.

# facts keys that are plain structured counts/strings, safe under either
# profile, and never redacted.
_SAFE_FACT_KEYS = frozenset({
    "commits", "merge_commits", "pull_requests", "merged_pull_requests",
    "open_pull_requests", "reviews", "branches", "workflow_runs",
    "contributors", "lines_added", "lines_removed", "first_commit",
    "last_commit", "span_weeks", "rework_window_days", "primary_language",
    "created_at", "pushed_at", "structure_files_scanned", "pr_truncated",
    "ai_config_files",
})

# Source.values keys that are plain numeric/structured, safe under either
# profile once contributor identity is handled separately.
_SAFE_SOURCE_VALUE_KEYS = frozenset({
    "lines", "reviews", "hours_to_merge", "size_bucket",
    "review_cycle_count", "state", "commit_count",
})

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")

# Metric.inputs is `dict[str, Any]`: a per-metric grab-bag whose shape is
# defined by the metric registry, not by this model. In practice some
# metrics stash a raw contributor display name in it (e.g.
# `people.top_contributor_share`'s `top_name`), which is exactly the kind
# of upstream-added field an allowlist (rather than a denylist) is meant to
# catch. Any input key ending in one of these suffixes/names is treated as
# a contributor identity, not a structured count.
_IDENTITY_INPUT_KEYS = frozenset({
    "name", "top_name", "author", "contributor", "login", "handle", "email",
})


def _date_only(ts: object) -> str | None:
    """Coarsen an ISO 8601 timestamp to its calendar date.

    Only a string is a timestamp. A non-string reaching here means a key that
    usually carries a timestamp carried something else instead, which happens
    for real: the `merged` key on a source is an ISO string for a pull request
    but an integer on other source kinds, and indexing an int raised a
    TypeError that only appeared once the cohort widened past one repository.

    A value whose type is not understood is dropped rather than guessed at.
    Dropping is the privacy-safe direction: passing an unrecognised value
    through would be publishing something this function never classified, and
    coercing it to a string would invent a timestamp that was never observed.
    """
    if ts is None or ts == "":
        return None
    if not isinstance(ts, str):
        return None
    return ts[:10]  # "YYYY-MM-DD" prefix of an ISO 8601 timestamp.


@dataclass
class RedactionManifest:
    profile: str
    redaction_version: str
    field_classes: dict[str, str] = field(default_factory=dict)
    removed_counts: dict[str, int] = field(default_factory=dict)
    leak_tests: dict[str, str] = field(default_factory=dict)
    content_digest: str = ""
    manifest_digest: str = ""

    def compute_digest(self) -> str:
        """Digest over the *redaction* content only: profile, ruleset
        version, and what was done to each field class. Deliberately
        excludes `leak_tests` and `manifest_digest` itself.

        Excluding `leak_tests` avoids a real circularity, not just a
        theoretical one: leak tests run against the *rendered* artifact,
        which is produced after this manifest exists, and LT-07 itself
        checks this digest against `manifest_digest`. If the digest
        covered `leak_tests`, sealing would have to happen after LT-07's
        own result was known — but LT-07's result depends on the sealed
        digest. `redact_report` calls `seal()` right after producing
        `field_classes`/`removed_counts`, before render or any leak test
        runs, so LT-07 verifies the redaction record wasn't altered
        between then and publish — which is what it can actually check.
        """
        import hashlib
        import json

        payload = {
            "profile": self.profile,
            "redaction_version": self.redaction_version,
            "field_classes": self.field_classes,
            "removed_counts": self.removed_counts,
        }
        blob = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(blob.encode("utf-8")).hexdigest()

    def seal(self) -> None:
        """Recompute and store `manifest_digest`. `redact_report` calls
        this before returning; LT-07 later checks this value against a
        fresh `compute_digest()` to confirm nothing in the redaction
        record changed since."""
        self.manifest_digest = self.compute_digest()

    def is_publishable(self) -> bool:
        return bool(self.leak_tests) and all(
            v == "pass" for v in self.leak_tests.values()
        )


class _Redactor:
    """Carries the per-call state a single `redact_report` pass needs:
    the profile, the pseudonymizer, which repos are public, the running
    counts for the manifest, and the k-anonymity verdict computed once up
    front from the whole report.
    """

    def __init__(
        self,
        profile: str,
        pseudo: Pseudonymizer,
        public_repos: frozenset[str],
        contributor_cohort_size: int,
    ) -> None:
        self.profile = profile
        self.pseudo = pseudo
        self.public_repos = public_repos
        self.counts: dict[str, int] = {c: 0 for c in _ALL_CLASSES}
        # Whether any per-contributor breakdown may be shown at all.
        self.contributor_breakdown_allowed = (
            profile == "pseudonymous"
            and contributor_cohort_size >= K_ANONYMITY_MIN
        )
        # Built once, after `_collect_plaintexts` has seen the whole
        # report, and reused by every `_scrub_text` call in this pass. A
        # real report has hundreds of identities and calls `_scrub_text`
        # once per metric's formula/display plus once per source's ref;
        # rebuilding the needle set and recompiling a regex on every one
        # of those calls was the dominant cost of `redact_report` on the
        # 111-scope axios fixture (unset until `build_scrub_pattern` runs).
        self.scrub_pattern: re.Pattern | None = None
        self.scrub_replacements_lower: dict[str, str] = {}

    def build_scrub_pattern(self) -> None:
        """Call once, after every identity `_collect_plaintexts` will find
        has been registered. Safe to call again — recomputing after the
        needle set has stopped growing is a cheap no-op in effect, just
        not necessary."""
        replacements: dict[str, str] = {}
        for plaintext in self.pseudo.known_plaintexts:
            # Free text gets a NON-REFERENCEABLE marker, not a handle.
            #
            # A handle is the right rendering inside a cohort listing of at
            # least K_ANONYMITY_MIN people, where it distinguishes rows
            # without naming anyone. Substituted into prose it does the
            # opposite: the top-contributor formula becomes "lines from
            # Contributor DB50 / total = 91.7%", which is a per-contributor
            # disclosure of exactly one person. On a public repository that
            # re-identifies them immediately, because anyone can open the
            # contributor graph and see who wrote the most. It is also a
            # ranking of one, which ADR-013 forbids having a primitive for.
            #
            # A constant marker removes the identity without minting a
            # pseudonym that can be cross-referenced between pages, and the
            # arithmetic around it still reads.
            replacements[plaintext] = CONTRIBUTOR_TEXT_MARKER
            # Registering the handle anyway keeps the digest/handle mapping
            # complete for the manifest, even though it is not substituted
            # into prose.
            self.pseudo.handle_for(plaintext)
        for plaintext in self.pseudo.known_plaintexts_in("repo"):
            # A repository is not a person, so an opaque label is fine here:
            # there is no individual to re-identify.
            replacements[plaintext] = self.pseudo.opaque_label("repo", plaintext)
        needles = sorted(
            {p for p in replacements if len(p) >= 3}, key=len, reverse=True
        )
        self.scrub_replacements_lower = {
            n.lower(): replacements[n] for n in needles
        }
        self.scrub_pattern = (
            re.compile(
                "|".join(re.escape(n) for n in needles), re.IGNORECASE
            )
            if needles
            else None
        )

    def _bump(self, cls: str, n: int = 1) -> None:
        self.counts[cls] = self.counts.get(cls, 0) + n

    # ── repository / branch / path ──────────────────────────────────────

    def is_public_repo(self, repo_name: str | None) -> bool:
        return bool(repo_name) and repo_name in self.public_repos

    def redact_repo_name(self, repo_name: str | None) -> str | None:
        if repo_name is None:
            return None
        if self.is_public_repo(repo_name):
            return repo_name
        self._bump(CLASS_REPOSITORY_NAME)
        return self.pseudo.opaque_label("repo", repo_name)

    def redact_repo_tuple(self, repos: tuple[str, ...]) -> tuple[str, ...]:
        return tuple(self.redact_repo_name(r) for r in repos if r is not None)

    def redact_path(self, path: str, repo_name: str | None) -> str:
        if self.is_public_repo(repo_name):
            return path
        self._bump(CLASS_FILE_PATH)
        # Reduced to extension/category, never directory structure.
        if "." in path.rsplit("/", 1)[-1]:
            ext = path.rsplit(".", 1)[-1].lower()
            return f"*.{ext}"
        return "(no extension)"

    def redact_url(self, url: str | None, repo_name: str | None) -> str | None:
        if url is None:
            return None
        self._bump(CLASS_URL)
        if self.is_public_repo(repo_name) and url.startswith(
            ("https://github.com/", "http://github.com/")
        ):
            return url
        return None

    # ── contributor identity ────────────────────────────────────────────

    def redact_identity(self, plaintext: str | None) -> str | None:
        if not plaintext:
            return plaintext
        self._bump(CLASS_CONTRIBUTOR_IDENTITY)
        return self.pseudo.handle_for(plaintext)

    # ── timestamps ───────────────────────────────────────────────────────

    def redact_timestamp(self, ts: str | None) -> str | None:
        if ts is None:
            return None
        self._bump(CLASS_TIMESTAMP)
        if self.profile == "aggregate_only":
            return None
        return _date_only(ts)


def _person_identity_plaintext(scope: Scope) -> str:
    """The raw email/name a person `Scope` carries in its `key`/`label`."""
    if scope.key.startswith("person:email:"):
        return scope.key[len("person:email:"):]
    return scope.label


def _collect_plaintexts(report: Report, r: _Redactor) -> None:
    """Register every contributor identity, and every private repository
    name, the report contains with `r.pseudo` *before* the main transform
    pass runs, purely so `pseudo.known_plaintexts` is complete up front.

    Two concrete leaks in real Receipts data make this pre-pass necessary
    rather than optional: `people.top_contributor_share`'s `formula`
    literally interpolates the top contributor's name into an otherwise
    "structured" string, and `Source.ref` on a `dataset`-kind source is
    literally the referenced scope's key (e.g. `person:person:email:
    name@example.com` — Receipts itself double-prefixes the level).
    Neither is reachable by field-name-based redaction alone; `_scrub_text`
    catches both, but only if it already knows every identity by the time
    it runs — hence collecting them up front rather than incrementally.

    Only *private* repository names are registered (public ones must
    remain visible wherever they legitimately appear, so they must never
    be a `_scrub_text` target).
    """
    for sr in report.scopes.values():
        if sr.scope is not None and sr.scope.level == "person":
            r.pseudo.handle_for(_person_identity_plaintext(sr.scope))
        if sr.scope is not None:
            for repo in sr.scope.repos:
                if not r.is_public_repo(repo):
                    r.pseudo.opaque_label("repo", repo)
        for entry in sr.facts.get("top_contributors") or []:
            name = entry.get("name") or entry.get("key")
            if name:
                r.pseudo.handle_for(name)
        for name in (sr.facts.get("names") or ()):
            r.pseudo.handle_for(name)
        for email in (sr.facts.get("emails") or ()):
            r.pseudo.handle_for(email)
        login = sr.facts.get("github_login")
        if login:
            r.pseudo.handle_for(login)
        for m in sr.metrics:
            for key, value in (m.inputs or {}).items():
                base = key[: -len("_name")] if key.endswith("_name") else key
                if (key in _IDENTITY_INPUT_KEYS or base in _IDENTITY_INPUT_KEYS) and value:
                    r.pseudo.handle_for(str(value))
            for src in m.sources:
                author = (src.values or {}).get("author")
                if author:
                    r.pseudo.handle_for(author)
                if not r.is_public_repo(src.repo) and src.repo:
                    r.pseudo.opaque_label("repo", src.repo)
            for ex in m.exemplars:
                if ex.source is not None:
                    author = (ex.source.values or {}).get("author")
                    if author:
                        r.pseudo.handle_for(author)
                    if not r.is_public_repo(ex.source.repo) and ex.source.repo:
                        r.pseudo.opaque_label("repo", ex.source.repo)


def _scrub_text(text: str, r: _Redactor) -> str:
    """Defense-in-depth: replace every known contributor identity *or*
    private-repository plaintext that appears as a substring of `text`,
    case-insensitively, with its handle/label. Field-level redaction above
    handles every case this module could identify by field name; this
    catches an identity or a repo name that leaked into a field through
    data interpolation rather than through its own field (e.g. a
    `dataset`-kind `Source.ref` that is literally the referenced scope's
    key: `person:person:email:x@y` — see `_collect_plaintexts`).

    Deliberately pulls from both the "contributor" and "repo" namespaces
    (not `pseudo.known_plaintexts`, which is contributor-only — that
    narrower set is what LT-02 scans, and conflating the two there is what
    produced a false contributor-identity leak against a repository
    label in the first place). Uses the single needle pattern
    `r.build_scrub_pattern` compiled once per `redact_report` call, rather
    than rebuilding it here: this runs once per metric's formula/display
    plus once per source's ref, and a real report has enough identities
    that rebuilding on every call was the dominant cost of redaction.
    """
    if not text or r.scrub_pattern is None:
        return text
    return r.scrub_pattern.sub(
        lambda m: r.scrub_replacements_lower[m.group(0).lower()], text
    )


def _redact_scope(scope: Scope | None, r: _Redactor) -> Scope | None:
    if scope is None:
        return None
    if scope.level == "person":
        if not r.contributor_breakdown_allowed:
            return None
        plaintext = _person_identity_plaintext(scope)
        handle = r.redact_identity(plaintext)
        return Scope(
            level=scope.level,
            key=f"person:{handle}",
            label=handle,
            since=r.redact_timestamp(scope.since),
            until=r.redact_timestamp(scope.until),
            repos=r.redact_repo_tuple(scope.repos),
        )
    if scope.level == "repo":
        # A repo-level scope's key/label *is* the repository name, so it
        # goes through the same public/private rule as any other repo
        # name reference (spec.md Redaction Rules, "Repository name" row).
        repo_name = scope.repos[0] if scope.repos else scope.label
        redacted_name = r.redact_repo_name(repo_name)
        new_key = scope.key if r.is_public_repo(repo_name) else f"repo:{redacted_name}"
        return Scope(
            level=scope.level,
            key=new_key,
            label=redacted_name,
            since=r.redact_timestamp(scope.since),
            until=r.redact_timestamp(scope.until),
            repos=r.redact_repo_tuple(scope.repos),
        )
    return Scope(
        level=scope.level,
        key=scope.key,
        label=scope.label,
        since=r.redact_timestamp(scope.since),
        until=r.redact_timestamp(scope.until),
        repos=r.redact_repo_tuple(scope.repos),
    )


def _redact_top_contributors(entries: list, r: _Redactor) -> list:
    if not r.contributor_breakdown_allowed:
        return []
    out = []
    for e in entries:
        e = dict(e)
        plaintext = e.get("name") or e.get("key") or ""
        handle = r.redact_identity(plaintext) if plaintext else None
        out.append({
            "handle": handle,
            "commits": e.get("commits"),
            "lines": e.get("lines"),
        })
    return out


def _redact_facts(facts: dict, r: _Redactor) -> dict:
    out: dict = {}
    repo_ctx = None
    if isinstance(facts.get("repos"), list) and len(facts["repos"]) == 1:
        repo_ctx = facts["repos"][0]
    elif isinstance(facts.get("repos_touched"), list) and len(facts["repos_touched"]) == 1:
        repo_ctx = facts["repos_touched"][0]

    for key, value in facts.items():
        if key in _SAFE_FACT_KEYS:
            out[key] = value
        elif key in ("repos", "repos_touched"):
            out[key] = r.redact_repo_tuple(tuple(value or ()))
        elif key == "url":
            out[key] = r.redact_url(value, repo_ctx)
        elif key == "description":
            out[key] = value if r.is_public_repo(repo_ctx) else None
        elif key == "default_branch":
            # Per the redaction table, the default branch itself MAY
            # appear regardless of repository visibility.
            out[key] = value
        elif key == "top_contributors":
            out[key] = _redact_top_contributors(value or [], r)
        elif key in ("emails", "names", "github_login"):
            # Raw contributor identity lists/fields. Never rendered, even
            # pseudonymized, because their key names alone would announce
            # "this is a list of identities" without adding evidence value
            # beyond what `top_contributors` already carries pseudonymized.
            r._bump(CLASS_CONTRIBUTOR_IDENTITY, len(value) if isinstance(value, list) else 1)
            continue
        elif key in ("collection_notes",):
            r._bump(CLASS_FREE_TEXT)
            continue
        else:
            # Unknown key: not on the allowlist, dropped per the free-text
            # rule (row 9) applied generally to unclassified facts.
            r._bump(CLASS_FREE_TEXT)
            continue
    return out


def _redact_source_values(values: dict, r: _Redactor) -> dict:
    out: dict = {}
    author = values.get("author")
    if author:
        out["contributor_handle"] = r.redact_identity(author)
    if "title" in values:
        r._bump(CLASS_PR_TITLE)
    for key in ("opened", "merged"):
        if key not in values:
            continue
        v = values[key]
        if isinstance(v, str):
            out[key] = r.redact_timestamp(v)
        # A non-string under these keys is not a timestamp. `merged` is an ISO
        # string on a pull-request source but an integer on other source
        # kinds. Such a value is left for the safe-list check below to admit
        # deliberately, rather than run through timestamp coarsening that
        # cannot apply to it.
    for key, v in values.items():
        if key in _SAFE_SOURCE_VALUE_KEYS:
            out[key] = v
    return out


def _redact_source(source: Source | None, r: _Redactor) -> Source | None:
    if source is None:
        return None
    if source.kind == "commit" or "message" in (source.values or {}):
        r._bump(CLASS_COMMIT_MESSAGE)
    redacted_repo = r.redact_repo_name(source.repo)
    return Source(
        kind=source.kind,
        # `ref` is sometimes literally the referenced scope's key (e.g. a
        # `dataset`-kind source's ref is `person:person:email:x@y`,
        # Receipts' own double-prefixed scope key) — scrub it the same way
        # as any other free text, rather than assume it is always a bare
        # identifier like a PR number.
        ref=_scrub_text(source.ref, r),
        # `detail` is free-form narrative generated from the source record
        # (e.g. "merged after 22.2 days") and is not on the structured
        # allowlist, so it is dropped rather than kept verbatim.
        detail="",
        repo=redacted_repo,
        url=r.redact_url(source.url, source.repo),
        occurred_at=r.redact_timestamp(source.occurred_at),
        values=_redact_source_values(source.values or {}, r),
    )


def _redact_exemplar(ex: Exemplar, r: _Redactor) -> Exemplar:
    r._bump(CLASS_FREE_TEXT)  # headline / why_this_proves_it are dropped.
    return Exemplar(
        rank=ex.rank,
        headline=f"Rank {ex.rank}: {ex.weight} {ex.weight_unit}",
        why_this_proves_it="",
        weight=ex.weight,
        weight_unit=ex.weight_unit,
        share_of_total_pct=ex.share_of_total_pct,
        source=_redact_source(ex.source, r),
    )


def _redact_inputs(inputs: dict, r: _Redactor) -> dict:
    out: dict = {}
    for key, value in inputs.items():
        base = key
        if base.endswith("_name"):
            base = base[: -len("_name")]
        if key in _IDENTITY_INPUT_KEYS or base in _IDENTITY_INPUT_KEYS:
            new_key = f"{base}_handle" if base != key else "contributor_handle"
            if r.contributor_breakdown_allowed and value:
                out[new_key] = r.redact_identity(str(value))
            else:
                r._bump(CLASS_CONTRIBUTOR_IDENTITY)
            continue
        if isinstance(value, str) and _EMAIL_RE.search(value):
            r._bump(CLASS_CONTRIBUTOR_IDENTITY)
            continue
        out[key] = value
    return out


def _redact_metric(m: Metric, r: _Redactor) -> Metric | None:
    if m.scope is not None and m.scope.level == "person" and not r.contributor_breakdown_allowed:
        return None
    # Order matters: redact inputs first so any identity it exposes
    # (`top_name` and friends) is registered with the pseudonymizer before
    # `formula`/`display` are scrubbed for the same identity leaking in
    # through interpolated text.
    redacted_inputs = _redact_inputs(m.inputs, r)
    formula = _scrub_text(m.formula, r)
    display = _scrub_text(m.display, r)
    return Metric(
        id=m.id,
        label=m.label,
        value=m.value,
        display=display,
        unit=m.unit,
        formula=formula,
        inputs=redacted_inputs,
        sample=m.sample,
        family=m.family,
        tier=m.tier,
        confidence=m.confidence,
        direction=m.direction,
        # Static per-metric-definition prose: on the allowlist, kept as-is.
        plain_english=m.plain_english,
        why_it_matters=m.why_it_matters,
        how_to_read=m.how_to_read,
        assumptions=m.assumptions,
        caveats=m.caveats,
        sources=tuple(
            s for s in (_redact_source(src, r) for src in m.sources) if s is not None
        ),
        exemplars=tuple(_redact_exemplar(e, r) for e in m.exemplars),
        no_sources_reason=m.no_sources_reason,
        scope=_redact_scope(m.scope, r),
    )


def _redact_series(s: Series, r: _Redactor) -> Series:
    # Points carry only month + numeric value + a detail dict; the detail
    # dict is data-derived free text if present, so it is dropped.
    return Series(
        id=s.id,
        label=s.label,
        unit=s.unit,
        note=s.note,
        metric_id=s.metric_id,
        points=tuple(
            replace(p, detail={}) if p.detail else p for p in s.points
        ),
    )


def _redact_finding(f: Finding, r: _Redactor) -> Finding | None:
    if f.scope_key.startswith("person:") and not r.contributor_breakdown_allowed:
        return None
    r._bump(CLASS_FREE_TEXT)
    return Finding(
        severity=f.severity,
        title="",
        detail="",
        action="",
        metric_id=f.metric_id,
        scope_key=f.scope_key,
        value_display=f.value_display,
    )


def _all_repo_names(report: Report) -> set[str]:
    names: set[str] = set()
    for sr in report.scopes.values():
        names.update(sr.scope.repos)
    return names


def _redact_exclusions(exclusions: dict, r: _Redactor, all_repos_public: bool) -> dict:
    out: dict = {}
    for key, value in exclusions.items():
        if key in ("by_reason", "lines_by_reason", "total_lines_excluded"):
            out[key] = value  # numeric aggregates, safe under either profile.
        elif key == "top_paths":
            entries = []
            for e in value or ():
                path = e.get("path")
                if path is None:
                    continue
                shown = path if all_repos_public else r.redact_path(path, None)
                entries.append({"path": shown, "lines": e.get("lines")})
            out[key] = entries
        else:
            r._bump(CLASS_FREE_TEXT)
    return out


def _redact_coverage(cov: Coverage, r: _Redactor) -> Coverage:
    return Coverage(
        repos_collected=cov.repos_collected,
        repos_failed=cov.repos_failed,
        pull_requests_truncated_in=r.redact_repo_tuple(cov.pull_requests_truncated_in),
        structure_scan_missing_in=r.redact_repo_tuple(cov.structure_scan_missing_in),
        no_ci_data_in=r.redact_repo_tuple(cov.no_ci_data_in),
        no_review_records_in=r.redact_repo_tuple(cov.no_review_records_in),
        total_lines_excluded_as_generated=cov.total_lines_excluded_as_generated,
    )


def redact_report(
    report: Report,
    *,
    profile: str,
    pseudo: Pseudonymizer,
    public_repos: frozenset[str] = frozenset(),
) -> tuple[Report, RedactionManifest]:
    if profile not in PROFILES:
        raise ValueError(f"profile must be one of {PROFILES!r}, got {profile!r}")

    cohort_size = len(report.contributor_scope_keys)
    r = _Redactor(profile, pseudo, public_repos, cohort_size)
    _collect_plaintexts(report, r)
    r.build_scrub_pattern()

    new_scopes: dict[str, ScopeReport] = {}
    key_remap: dict[str, str] = {}
    for key, sr in report.scopes.items():
        redacted_scope = _redact_scope(sr.scope, r)
        if redacted_scope is None:
            continue  # person scope suppressed under this profile/cohort
        new_key = redacted_scope.key
        key_remap[key] = new_key
        metrics = tuple(
            m for m in (
                _redact_metric(mm, r) for mm in sr.metrics
            ) if m is not None
        )
        new_scopes[new_key] = ScopeReport(
            scope=redacted_scope,
            facts=_redact_facts(sr.facts, r),
            metrics=metrics,
            series=tuple(_redact_series(s, r) for s in sr.series),
            children=tuple(key_remap.get(c, c) for c in sr.children if c in report.scopes),
        )

    # A second pass fixes up children references that pointed at a scope
    # key redacted *after* the child itself was written above.
    for sk, sr in new_scopes.items():
        new_scopes[sk] = replace(
            sr, children=tuple(key_remap.get(c, c) for c in sr.children)
        )

    root_key = key_remap.get(report.root_scope, report.root_scope)
    all_repos_public = _all_repo_names(report) <= public_repos

    new_report = Report(
        schema_version=report.schema_version,
        org_label=report.org_label,
        root_scope=root_key,
        generated_at=report.generated_at,
        scopes=new_scopes,
        findings=tuple(
            f for f in (_redact_finding(ff, r) for ff in report.findings) if f is not None
        ),
        coverage=_redact_coverage(report.coverage, r),
        exclusions=_redact_exclusions(report.exclusions, r, all_repos_public),
        # `collection` (collection.repos/notes/warnings) is a free-form,
        # implementation-shaped passthrough blob with no field this module
        # can classify against the allowlist; dropped rather than guessed.
        collection={},
    )

    field_classes = {
        CLASS_CONTRIBUTOR_IDENTITY: (
            "pseudonymized handle; breakdown suppressed below k>=5"
            if profile == "pseudonymous"
            else "dropped entirely (aggregate_only)"
        ),
        CLASS_REPOSITORY_NAME: "shown if public_repos, else opaque label",
        CLASS_FILE_PATH: "shown if public_repos, else extension/category only",
        CLASS_BRANCH_NAME: "default_branch kept, else opaque label",
        CLASS_COMMIT_MESSAGE: "full text never included",
        CLASS_PR_TITLE: "full text never included",
        CLASS_URL: "public repo github.com URL only, else stripped",
        CLASS_TIMESTAMP: (
            "coarsened to calendar date"
            if profile == "pseudonymous"
            else "dropped entirely (aggregate_only)"
        ),
        CLASS_FREE_TEXT: "excluded unless on the structured allowlist",
    }

    manifest = RedactionManifest(
        profile=profile,
        redaction_version=REDACTION_VERSION,
        field_classes=field_classes,
        removed_counts=dict(r.counts),
    )
    # Sealed here, before render or any leak test runs — see
    # RedactionManifest.compute_digest for why leak_tests is excluded from
    # what gets sealed.
    manifest.seal()
    return new_report, manifest
