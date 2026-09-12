"""Multi-scope site assembly.

Renders one page per scope and links them, so the scope hierarchy of ADR-012
is navigable rather than implied. The organization page is the site root; each
repository gets its own page beneath it.

Every page passes through the leak-test gate independently. A site is written
only if every page passes, because publishing a directory where one page is
clean and another is not would be worse than publishing nothing: the clean
pages would lend the leaking one credibility.
"""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field
from pathlib import Path

from . import tokens as T
from .leaktests import run_all
from .model import Report, ScopeReport
from .pseudonym import Pseudonymizer
from .redact import RedactionManifest
from .render import Provenance, esc, render_page


def slug(text: str) -> str:
    """A path segment that is stable, lowercase and filesystem-safe."""
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or "scope"


@dataclass
class Page:
    scope_key: str
    level: str
    label: str
    path: str  # relative to the site root, e.g. "repository/axios-axios/"
    html: str = ""
    digest: str = ""
    verdicts: dict[str, str] = field(default_factory=dict)

    @property
    def href(self) -> str:
        return "./" if self.path == "" else "./" + self.path

    @property
    def passed(self) -> bool:
        return bool(self.verdicts) and all(v == "pass" for v in self.verdicts.values())


def plan_pages(report: Report) -> list[Page]:
    """Decide which scopes become pages.

    Organization first as the root, then repositories in declared order.
    Contributor scopes are deliberately NOT given pages: a per-person page on
    a public site is the ranking surface ADR-013 forbids, and a directory of
    them would be a leaderboard by another name even with pseudonyms.
    """
    pages: list[Page] = []
    root = report.scopes.get(report.root_scope)
    if root is not None:
        pages.append(
            Page(report.root_scope, root.scope.level, root.scope.label or "All repositories", "")
        )
    for key, sr in report.scopes.items():
        if key == report.root_scope:
            continue
        if sr.scope.level == "project":
            pages.append(Page(key, "project", sr.scope.label, f"project/{slug(sr.scope.label)}/"))
    for key, sr in report.scopes.items():
        if sr.scope.level == "repo":
            pages.append(
                Page(key, "repository", sr.scope.label, f"repository/{slug(sr.scope.label)}/")
            )
    return pages


def _nav(pages: list[Page], current: str, depth: int) -> str:
    """Scope navigation. Relative hrefs so the site works from any prefix,
    including a project-pages subpath and a local file:// open."""
    up = "../" * depth
    items = []
    for p in pages:
        here = p.scope_key == current
        href = up + p.path if p.path else (up or "./")
        label = esc(p.label)
        level = esc(p.level)
        if here:
            items.append(
                f'<li aria-current="page"><span class="navlevel">{level}</span>'
                f"<strong>{label}</strong></li>"
            )
        else:
            items.append(
                f'<li><span class="navlevel">{level}</span>'
                f'<a href="{esc(href)}">{label}</a></li>'
            )
    return (
        '<nav class="scopenav" aria-label="Report scopes"><ul>'
        + "".join(items)
        + "</ul></nav>"
    )


NAV_CSS = f"""
.scopenav{{margin:0 0 {T.SPACE[4]}px}}
.scopenav ul{{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;
  gap:0 {T.SPACE[4]}px;border-bottom:1px solid {T.HAIRLINE};
  padding-bottom:{T.SPACE[2]}px}}
.scopenav li{{display:flex;flex-direction:column;gap:2px;font-size:15px}}
.scopenav li[aria-current] strong{{font-weight:600}}
.navlevel{{font-size:12px;line-height:1.33;font-weight:500;letter-spacing:.04em;
  text-transform:uppercase;color:{T.INK_3}}}
.scopenav a{{color:{T.ACCENT};text-decoration:none;
  border-bottom:1px solid transparent}}
.scopenav a:hover{{border-bottom-color:currentColor}}
"""


def build_site(
    report: Report,
    redacted: Report,
    manifest: RedactionManifest,
    pseudo: Pseudonymizer,
    out_dir: Path,
    *,
    redaction_version: str,
    public_repos: frozenset[str],
    fail_on_leak: bool = True,
) -> tuple[list[Page], int]:
    """Render every planned page, gate each one, then write the site.

    Returns (pages, exit_code). Nothing is written unless every page passes.
    """
    pages = plan_pages(redacted)
    if not pages:
        print("error: no scopes in this report could be rendered")
        return [], 2

    for page in pages:
        sr: ScopeReport = redacted.scopes[page.scope_key]
        depth = page.path.count("/")
        nav = _nav(pages, page.scope_key, depth)

        prov = Provenance(
            source_label=sr.scope.label or redacted.org_label,
            window_since=(sr.scope.since or "")[:10] or "—",
            window_until=(sr.scope.until or "")[:10] or "—",
            redaction_version=redaction_version,
            model_calls=0,
            lines_excluded_generated=redacted.coverage.total_lines_excluded_as_generated,
        )
        canonical = render_page(
            redacted, page.scope_key, prov=prov, extra_css=NAV_CSS, prologue=nav
        )
        page.digest = hashlib.sha256(canonical.encode()).hexdigest()
        short = f"{page.digest[:8]}·{page.digest[8:12]}"
        page.html = render_page(
            redacted,
            page.scope_key,
            prov=Provenance(**{**prov.__dict__, "content_digest": short}),
            extra_css=NAV_CSS,
            prologue=nav,
        )

        manifest.content_digest = page.digest
        manifest.manifest_digest = manifest.compute_digest()
        page.verdicts = run_all(
            page.html,
            manifest=manifest,
            pseudo=pseudo,
            report=report,
            current_redaction_version=redaction_version,
            public_repos=public_repos,
        )

    # Report every page before deciding, so one failure does not hide others.
    width = max(len(p.label) for p in pages)
    for p in pages:
        failed = {k: v for k, v in p.verdicts.items() if v != "pass"}
        mark = "ok  " if not failed else "FAIL"
        print(f"  {mark} {p.level:11s} {p.label:{width}s}  {len(p.verdicts)-len(failed)}/{len(p.verdicts)}")
        for tid, why in sorted(failed.items()):
            print(f"        {tid}: {why}")

    bad = [p for p in pages if not p.passed]
    if bad and fail_on_leak:
        print(
            f"\nrefusing to write: {len(bad)} of {len(pages)} page(s) failed the "
            f"gate. Nothing was published."
        )
        return pages, 1

    for p in pages:
        target = out_dir / p.path
        target.mkdir(parents=True, exist_ok=True)
        (target / "index.html").write_text(p.html)

    (out_dir / "manifest.json").write_text(
        json.dumps(
            {
                "profile": manifest.profile,
                "redaction_version": manifest.redaction_version,
                "field_classes": manifest.field_classes,
                "removed_counts": manifest.removed_counts,
                "publishable": True,
                "pages": [
                    {
                        "scope": p.scope_key,
                        "level": p.level,
                        "path": p.path or ".",
                        "content_digest": p.digest,
                        "leak_tests": p.verdicts,
                    }
                    for p in pages
                ],
            },
            indent=2,
            sort_keys=True,
        )
    )
    # A no-JavaScript, no-cookie site has nothing to say to a crawler beyond
    # what it can read, so robots.txt exists only to be explicit rather than
    # silent about it.
    (out_dir / "robots.txt").write_text("User-agent: *\nAllow: /\n")

    total = sum((out_dir / p.path / "index.html").stat().st_size for p in pages)
    print(f"\nwrote {len(pages)} page(s), {total:,} bytes total, to {out_dir}")
    for p in pages:
        print(f"  {p.path or '.':32s} {p.digest[:12]}")
    return pages, 0
