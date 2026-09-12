"""Command line entry point.

    sovix-render REPORT.json --out site/

Runs the publication pipeline in the order spec 004 mandates:

    load -> pseudonymize -> redact -> render -> leak tests -> write

The leak tests are a gate, not a report. If any single test fails, nothing is
written and the exit status is non-zero, because the failure mode this guards
against is publishing an identity to a world-readable page.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

from . import model
from .leaktests import run_all
from .pseudonym import Pseudonymizer, derive_key
from .redact import redact_report
from .render import Provenance, render_page

REDACTION_VERSION = "1"


def _collection_note(report: model.Report) -> str:
    c = report.collection or {}
    bits = []
    if c.get("graphql_calls") is not None:
        bits.append(f"{c['graphql_calls']} GraphQL")
    if c.get("rest_calls") is not None:
        bits.append(f"{c['rest_calls']} REST")
    return f"{' and '.join(bits)} calls." if bits else ""


def _window(scope: model.ScopeReport) -> tuple[str, str]:
    since = (scope.scope.since or "")[:10]
    until = (scope.scope.until or "")[:10]
    return since or "—", until or "—"


def build(
    report_path: Path,
    out_dir: Path,
    *,
    profile: str,
    scope_key: str | None,
    public_repos: frozenset[str],
    title: str | None,
    fail_on_leak: bool = True,
) -> int:
    try:
        report = model.load(report_path)
    except model.UnsupportedReport as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    scope_key = scope_key or report.root_scope
    if scope_key not in report.scopes:
        print(
            f"error: scope {scope_key!r} is not in this report. Available "
            f"levels: {sorted({s.scope.level for s in report.scopes.values()})}",
            file=sys.stderr,
        )
        return 2

    # 1. Pseudonymize. The key is generated here, used, and discarded: it is
    #    never written to disk, so the artifact cannot be de-pseudonymized
    #    from anything this command leaves behind (ADR-011).
    pseudo = Pseudonymizer(derive_key())

    # 2. Redact.
    redacted, manifest = redact_report(
        report, profile=profile, pseudo=pseudo, public_repos=public_repos
    )
    manifest.redaction_version = REDACTION_VERSION

    # 3. Render.
    scope = redacted.scopes[scope_key]
    since, until = _window(scope)
    prov = Provenance(
        source_label=scope.scope.label or redacted.org_label,
        window_since=since,
        window_until=until,
        collection_note=_collection_note(redacted),
        redaction_version=REDACTION_VERSION,
        model_calls=0,
        lines_excluded_generated=redacted.coverage.total_lines_excluded_as_generated,
    )
    html = render_page(redacted, scope_key, prov=prov, title=title)

    # The digest covers the rendered bytes, so a reader can verify that the
    # page they hold is the page the manifest describes.
    manifest.content_digest = hashlib.sha256(html.encode()).hexdigest()
    short = f"{manifest.content_digest[:8]}·{manifest.content_digest[8:12]}"
    prov = Provenance(**{**prov.__dict__, "content_digest": short})
    html = render_page(redacted, scope_key, prov=prov, title=title)
    manifest.content_digest = hashlib.sha256(html.encode()).hexdigest()

    # 4. Gate. Every test must pass before anything is written.
    verdicts = run_all(
        html,
        manifest=manifest,
        pseudo=pseudo,
        report=report,  # the ORIGINAL, so LT-02 knows the real names
        current_redaction_version=REDACTION_VERSION,
    )
    manifest.leak_tests = verdicts
    failed = {k: v for k, v in verdicts.items() if v != "pass"}

    print(f"leak tests: {len(verdicts) - len(failed)}/{len(verdicts)} pass")
    for tid in sorted(verdicts):
        mark = "pass" if verdicts[tid] == "pass" else "FAIL"
        line = f"  {tid}  {mark}"
        if verdicts[tid] != "pass":
            line += f"  — {verdicts[tid]}"
        print(line)

    if failed and fail_on_leak:
        print(
            f"\nrefusing to write: {len(failed)} leak test(s) failed. "
            f"Nothing was published.",
            file=sys.stderr,
        )
        return 1

    # 5. Write.
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "index.html").write_text(html)
    (out_dir / "manifest.json").write_text(
        json.dumps(
            {
                "profile": manifest.profile,
                "redaction_version": manifest.redaction_version,
                "content_digest": manifest.content_digest,
                "manifest_digest": manifest.manifest_digest,
                "field_classes": manifest.field_classes,
                "removed_counts": manifest.removed_counts,
                "leak_tests": manifest.leak_tests,
                "scope": scope_key,
                "publishable": manifest.is_publishable(),
            },
            indent=2,
            sort_keys=True,
        )
    )
    size = (out_dir / "index.html").stat().st_size
    print(f"\nwrote {out_dir/'index.html'} ({size:,} bytes)")
    print(f"wrote {out_dir/'manifest.json'}")
    print(f"digest {manifest.content_digest[:16]}")
    return 0


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog="sovix-render",
        description=(
            "Render a self-contained evidence dashboard from a Receipts JSON "
            "1.0 report. Pseudonymizes, redacts, and refuses to write if any "
            "leak test fails."
        ),
    )
    p.add_argument("report", type=Path, help="path to report.json")
    p.add_argument("--out", type=Path, default=Path("site"), help="output directory")
    p.add_argument(
        "--profile",
        choices=("pseudonymous", "aggregate_only"),
        default="pseudonymous",
        help="privacy profile. There is no identified profile.",
    )
    p.add_argument("--scope", default=None, help="scope key, e.g. repo:owner/name")
    p.add_argument("--title", default=None, help="override the page heading")
    p.add_argument(
        "--public-repo",
        action="append",
        default=[],
        metavar="OWNER/NAME",
        help=(
            "a repository that is already public, whose name may therefore "
            "appear unredacted. Repeatable."
        ),
    )
    p.add_argument(
        "--allow-leaks",
        action="store_true",
        help="write the artifact even if a leak test fails. For local "
        "diagnosis only; never use this to publish.",
    )
    a = p.parse_args(argv)

    return build(
        a.report,
        a.out,
        profile=a.profile,
        scope_key=a.scope,
        public_repos=frozenset(a.public_repo),
        title=a.title,
        fail_on_leak=not a.allow_leaks,
    )


if __name__ == "__main__":
    raise SystemExit(main())
