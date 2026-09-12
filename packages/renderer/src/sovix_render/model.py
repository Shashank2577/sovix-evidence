"""Typed view of a Receipts JSON 1.0 report.

This is an adapter, not a redefinition. The authoritative shape is whatever
`receipts collect` emits; this module parses it defensively and is explicit
about what is absent. Parsing MUST NOT invent a value: a missing number stays
None all the way to the renderer, which is what lets absence be rendered as
absence rather than as zero.

Field names mirror the source JSON so a reader can diff the two by eye.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterator

SCHEMA_SUPPORTED = "1.0"


class UnsupportedReport(Exception):
    """The report is not a shape this renderer claims to understand."""


# ── Leaf records ────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class Sample:
    """What was actually counted, and what was left out."""
    n: int
    population: int
    unit: str
    coverage_pct: float
    excluded: dict[str, int] = field(default_factory=dict)

    @property
    def is_partial(self) -> bool:
        # A sample that read less than its population is partial, and every
        # metric derived from it inherits that ceiling.
        return self.population > 0 and self.n < self.population

    @property
    def is_empty(self) -> bool:
        return self.population == 0


@dataclass(frozen=True)
class Source:
    """One raw record a reader can click through to."""
    kind: str
    ref: str
    detail: str
    repo: str | None = None
    url: str | None = None
    occurred_at: str | None = None
    values: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class Exemplar:
    """The strongest single piece of evidence, ranked, with its reasoning."""
    rank: int
    headline: str
    why_this_proves_it: str
    weight: float
    weight_unit: str
    share_of_total_pct: float
    source: Source | None = None


@dataclass(frozen=True)
class Scope:
    level: str            # org | project | repo | person  (see note below)
    key: str
    label: str
    since: str | None = None
    until: str | None = None
    repos: tuple[str, ...] = ()


# Receipts emits org|project|repo|person. ADR-012 declares
# organization|project|team|repository canonical, with contributor as an
# orthogonal filter. This is the adapter mapping; `team` has no Receipts
# equivalent yet and is therefore never produced by this loader.
SCOPE_LEVEL_CANONICAL = {
    "org": "organization",
    "project": "project",
    "repo": "repository",
    "person": "contributor",
}


@dataclass(frozen=True)
class Metric:
    """A value and everything required to defend it."""
    id: str
    label: str
    value: float | str | None
    display: str
    unit: str
    formula: str
    inputs: dict[str, Any]
    sample: Sample
    family: str
    tier: str                    # measured | proxy | inferred
    confidence: str              # high | medium | low
    direction: str               # higher_is_better | lower_is_better | neutral
    plain_english: str = ""
    why_it_matters: str = ""
    how_to_read: str = ""
    assumptions: tuple[str, ...] = ()
    caveats: tuple[str, ...] = ()
    sources: tuple[Source, ...] = ()
    exemplars: tuple[Exemplar, ...] = ()
    no_sources_reason: str | None = None
    scope: Scope | None = None

    @property
    def is_available(self) -> bool:
        """False when the metric has no value. Never conflate with zero."""
        if self.value is None:
            return False
        # Receipts renders an absent value as this exact display string.
        return "not available" not in str(self.display).lower()

    @property
    def is_known_zero(self) -> bool:
        """A real observed zero, which is a finding, not a gap."""
        return self.is_available and self.value == 0

    @property
    def is_floor(self) -> bool:
        """Inferred detection shares are floors and must render with '>='."""
        return self.tier == "inferred" and self.unit == "percent"


@dataclass(frozen=True)
class SeriesPoint:
    month: str
    value: float | None          # None means no eligible records, not zero
    detail: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class Series:
    id: str
    label: str
    unit: str
    points: tuple[SeriesPoint, ...]
    note: str = ""
    metric_id: str | None = None

    @property
    def observed_count(self) -> int:
        return sum(1 for p in self.points if p.value is not None)

    @property
    def gap_runs(self) -> list[tuple[int, int]]:
        """Inclusive index ranges holding no eligible records.

        The renderer draws these as marked uncollected regions and never
        spans them with a line.
        """
        runs: list[tuple[int, int]] = []
        start: int | None = None
        for i, p in enumerate(self.points):
            if p.value is None and start is None:
                start = i
            elif p.value is not None and start is not None:
                runs.append((start, i - 1))
                start = None
        if start is not None:
            runs.append((start, len(self.points) - 1))
        return runs


@dataclass(frozen=True)
class Finding:
    severity: str
    title: str
    detail: str
    action: str = ""
    metric_id: str = ""
    scope_key: str = ""
    value_display: str = ""


@dataclass(frozen=True)
class Coverage:
    repos_collected: int = 0
    repos_failed: int = 0
    pull_requests_truncated_in: tuple[str, ...] = ()
    structure_scan_missing_in: tuple[str, ...] = ()
    no_ci_data_in: tuple[str, ...] = ()
    no_review_records_in: tuple[str, ...] = ()
    total_lines_excluded_as_generated: int = 0

    @property
    def has_gap(self) -> bool:
        return bool(
            self.repos_failed
            or self.pull_requests_truncated_in
            or self.structure_scan_missing_in
            or self.no_ci_data_in
            or self.no_review_records_in
        )


@dataclass
class ScopeReport:
    scope: Scope
    facts: dict[str, Any]
    metrics: tuple[Metric, ...]
    series: tuple[Series, ...]
    children: tuple[str, ...] = ()

    def metric(self, metric_id: str) -> Metric | None:
        return next((m for m in self.metrics if m.id == metric_id), None)

    def series_by_id(self, series_id: str) -> Series | None:
        return next((s for s in self.series if s.id == series_id), None)

    def by_family(self, family: str) -> tuple[Metric, ...]:
        # Registry order, never value order. Value-ordering contributors is
        # the ranking primitive that must not exist.
        return tuple(m for m in self.metrics if m.family == family)

    def tier_census(self) -> dict[str, int]:
        out: dict[str, int] = {}
        for m in self.metrics:
            out[m.tier] = out.get(m.tier, 0) + 1
        return out


@dataclass
class Report:
    schema_version: str
    org_label: str
    root_scope: str
    generated_at: str
    scopes: dict[str, ScopeReport]
    findings: tuple[Finding, ...]
    coverage: Coverage
    exclusions: dict[str, Any]
    collection: dict[str, Any]

    def root(self) -> ScopeReport:
        return self.scopes[self.root_scope]

    def scopes_at(self, level: str) -> Iterator[ScopeReport]:
        for s in self.scopes.values():
            if s.scope.level == level:
                yield s

    @property
    def contributor_scope_keys(self) -> tuple[str, ...]:
        return tuple(k for k, s in self.scopes.items() if s.scope.level == "person")


# ── Parsing ─────────────────────────────────────────────────────────────────

def _sample(d: dict[str, Any] | None) -> Sample:
    d = d or {}
    return Sample(
        n=int(d.get("n") or 0),
        population=int(d.get("population") or 0),
        unit=str(d.get("unit") or ""),
        coverage_pct=float(d.get("coverage_pct") or 0.0),
        excluded={str(k): int(v) for k, v in (d.get("excluded") or {}).items()},
    )


def _source(d: dict[str, Any]) -> Source:
    return Source(
        kind=str(d.get("kind") or ""),
        ref=str(d.get("ref") or ""),
        detail=str(d.get("detail") or ""),
        repo=d.get("repo"),
        url=d.get("url"),
        occurred_at=d.get("occurred_at"),
        values=d.get("values") or {},
    )


def _scope(d: dict[str, Any]) -> Scope:
    return Scope(
        level=str(d.get("level") or ""),
        key=str(d.get("key") or ""),
        label=str(d.get("label") or ""),
        since=d.get("since"),
        until=d.get("until"),
        repos=tuple(d.get("repos") or ()),
    )


def _metric(d: dict[str, Any]) -> Metric:
    return Metric(
        id=str(d["id"]),
        label=str(d.get("label") or ""),
        value=d.get("value"),
        display=str(d.get("display") or ""),
        unit=str(d.get("unit") or ""),
        formula=str(d.get("formula") or ""),
        inputs=d.get("inputs") or {},
        sample=_sample(d.get("sample")),
        family=str(d.get("family") or ""),
        tier=str(d.get("tier") or ""),
        confidence=str(d.get("confidence") or ""),
        direction=str(d.get("direction") or "neutral"),
        plain_english=str(d.get("plain_english") or ""),
        why_it_matters=str(d.get("why_it_matters") or ""),
        how_to_read=str(d.get("how_to_read") or ""),
        assumptions=tuple(d.get("assumptions") or ()),
        caveats=tuple(d.get("caveats") or ()),
        sources=tuple(_source(s) for s in (d.get("sources") or ())),
        exemplars=tuple(
            Exemplar(
                rank=int(e.get("rank") or 0),
                headline=str(e.get("headline") or ""),
                why_this_proves_it=str(e.get("why_this_proves_it") or ""),
                weight=float(e.get("weight") or 0.0),
                weight_unit=str(e.get("weight_unit") or ""),
                share_of_total_pct=float(e.get("share_of_total_pct") or 0.0),
                source=_source(e["source"]) if e.get("source") else None,
            )
            for e in (d.get("exemplars") or ())
        ),
        no_sources_reason=d.get("no_sources_reason"),
        scope=_scope(d["scope"]) if d.get("scope") else None,
    )


def _series(d: dict[str, Any]) -> Series:
    return Series(
        id=str(d.get("id") or ""),
        label=str(d.get("label") or ""),
        unit=str(d.get("unit") or ""),
        note=str(d.get("note") or ""),
        metric_id=d.get("metric_id"),
        points=tuple(
            SeriesPoint(
                month=str(p.get("month") or ""),
                value=None if p.get("value") is None else float(p["value"]),
                detail=p.get("detail") or {},
            )
            for p in (d.get("points") or ())
        ),
    )


def load(path: str | Path) -> Report:
    """Parse a Receipts report. Raises UnsupportedReport on an unknown shape."""
    raw = json.loads(Path(path).read_text())

    got = str(raw.get("schema_version") or "")
    if got != SCHEMA_SUPPORTED:
        raise UnsupportedReport(
            f"report schema_version is {got!r}; this renderer implements "
            f"{SCHEMA_SUPPORTED!r}. Re-collect with a matching Receipts "
            f"version, or add an adapter for {got!r}."
        )

    scopes: dict[str, ScopeReport] = {}
    for key, s in (raw.get("scopes") or {}).items():
        scopes[key] = ScopeReport(
            scope=_scope(s.get("scope") or {}),
            facts=s.get("facts") or {},
            metrics=tuple(_metric(m) for m in (s.get("metrics") or ())),
            series=tuple(_series(x) for x in (s.get("series") or ())),
            children=tuple(s.get("children") or ()),
        )

    root_scope = str(raw.get("root_scope") or "")
    if root_scope not in scopes:
        raise UnsupportedReport(
            f"root_scope {root_scope!r} is not present among "
            f"{len(scopes)} scopes in the report."
        )

    cov = (raw.get("data_quality") or {}).get("coverage") or {}
    return Report(
        schema_version=got,
        org_label=str(raw.get("org_label") or ""),
        root_scope=root_scope,
        generated_at=str(raw.get("generated_at") or ""),
        scopes=scopes,
        findings=tuple(
            Finding(
                severity=str(f.get("severity") or ""),
                title=str(f.get("title") or ""),
                detail=str(f.get("detail") or ""),
                action=str(f.get("action") or ""),
                metric_id=str(f.get("metric_id") or ""),
                scope_key=str(f.get("scope_key") or ""),
                value_display=str(f.get("value_display") or ""),
            )
            for f in (raw.get("headlines") or ())
        ),
        coverage=Coverage(
            repos_collected=int(cov.get("repos_collected") or 0),
            repos_failed=int(cov.get("repos_failed") or 0),
            pull_requests_truncated_in=tuple(cov.get("pull_requests_truncated_in") or ()),
            structure_scan_missing_in=tuple(cov.get("structure_scan_missing_in") or ()),
            no_ci_data_in=tuple(cov.get("no_ci_data_in") or ()),
            no_review_records_in=tuple(cov.get("no_review_records_in") or ()),
            total_lines_excluded_as_generated=int(
                cov.get("total_lines_excluded_as_generated") or 0
            ),
        ),
        exclusions=raw.get("exclusions") or {},
        collection=raw.get("collection") or {},
    )
