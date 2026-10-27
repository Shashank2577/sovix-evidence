/**
 * The children table — SPEC §5.1.5, columns §5.6.
 *
 * At the organisation: the six repositories under their project subheads. At a
 * project: its own repositories, flat. It compares *scopes*; there is no column
 * anywhere in it that could be sorted by a per-person value (§0.1).
 *
 * The status column is derived, never stored: `StatusPill` is handed the findings
 * that fired against the row's scope and works out the severity itself, so no call
 * site — including this one — can pass in a judgement of its own (§6.15). The
 * footnote naming the driving finding lives on the Repositories screen, where the
 * row has the width for it; here the pill's own scope is one tap away.
 *
 * Six columns at full width; §7.4's reflow drops to four, then three, then the
 * card layout at 390 px. Nothing scrolls sideways and nothing is lost, because
 * every dropped column is on the repository's own overview.
 */

import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

import { scopeTabPath, type ScopeTarget } from "@/app/routes";
import {
  initialsFor,
  repoTint,
  targetForKey,
  type ResolvedScope,
} from "@/app/scope";
import { FloorFigure, StatusPill } from "@/components/integrity";
import * as copy from "@/copy";
import type { Edition, MetricSummary, NavRepo, ScopeKey } from "@/data";
import { formatCount } from "@/shell/format";

interface Row {
  key: ScopeKey;
  label: string;
  project: string;
  target: ScopeTarget;
}

function rowsFor(edition: Edition, scope: ResolvedScope): Row[] {
  const projects =
    scope.summary.scope.level === "org"
      ? edition.navigation.projects
      : edition.navigation.projects.filter(
          project => project.key === scope.key
        );

  const rows: Row[] = [];
  for (const project of projects) {
    for (const repo of project.repos as NavRepo[]) {
      rows.push({
        key: repo.key,
        label: repo.label,
        project: project.label,
        target: targetForKey(edition, repo.key),
      });
    }
  }
  return rows;
}

function readingOf(
  edition: Edition,
  key: ScopeKey,
  metricId: string
): MetricSummary | undefined {
  return edition.scopeSummaries[key]?.metrics.find(
    metric => metric.id === metricId
  );
}

/**
 * One cell carrying a metric's reading. The dataset's own `display` string, routed
 * through `FloorFigure` so a floor metric cannot lose its `≥` at this call site,
 * and words rather than a zero when the edition publishes no reading (§6.3, §6.4).
 */
function Figure({ reading }: { reading: MetricSummary | undefined }) {
  if (!reading) return <span className="ov-na">{copy.notAvailable.label}</span>;
  if (reading.isNA)
    return <span className="ov-na">{copy.notAvailable.label}</span>;
  return (
    <span className="ov-figure">
      <FloorFigure display={reading.display} metricId={reading.id} />
    </span>
  );
}

export interface ChildrenPanelProps {
  edition: Edition;
  scope: ResolvedScope;
}

export function ChildrenPanel({ edition, scope }: ChildrenPanelProps) {
  const rows = rowsFor(edition, scope);
  const grouped = scope.summary.scope.level === "org";

  let lastProject: string | null = null;

  return (
    <div className="section-panel repositories-panel">
      <div className="panel-header">
        <div>
          <div className="section-kicker">{copy.overview.childrenKicker}</div>
          <h3>{copy.overview.childrenTitle}</h3>
        </div>
        <Link
          href={scopeTabPath(scope.target, "repositories")}
          className="more-button"
        >
          {copy.overview.childrenAll}
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="ov-empty">{copy.overview.childrenEmpty}</p>
      ) : (
        <div className="ov-table">
          <div className="ov-row ov-head" role="presentation">
            <span>{copy.overview.colRepository}</span>
            <span>{copy.overview.colReview}</span>
            <span>{copy.overview.colLead}</span>
            <span>{copy.overview.colContributors}</span>
            <span>{copy.overview.colOpenPrs}</span>
            <span>{copy.overview.colStatus}</span>
          </div>

          {rows.map(row => {
            const summary = edition.scopeSummaries[row.key];
            const review = readingOf(
              edition,
              row.key,
              "process.review_coverage"
            );
            const lead = readingOf(edition, row.key, "delivery.lead_time_p50");
            const people = readingOf(
              edition,
              row.key,
              "people.active_contributors"
            );
            const headlines = (summary?.findingIndices ?? []).map(
              index => edition.headlines[index]
            );
            const showHead = grouped && row.project !== lastProject;
            lastProject = row.project;

            return (
              <div key={row.key}>
                {showHead && <div className="ov-group">{row.project}</div>}
                <Link
                  href={scopeTabPath(row.target, "overview")}
                  className="ov-row"
                >
                  <span className="ov-name">
                    <span
                      className="repo-avatar"
                      style={{ background: repoTint(row.label) }}
                      aria-hidden="true"
                    >
                      {initialsFor(row.label)}
                    </span>
                    <span>
                      <strong>{row.label}</strong>
                      <small>{row.project}</small>
                    </span>
                  </span>

                  <span className="ov-review">
                    {/* The bar draws the share the figure beside it states. It is
                        ornament for that number, not a second measurement, so it is
                        hidden from assistive tech rather than given a label of its
                        own. */}
                    {review && !review.isNA && review.value !== null && (
                      <span className="mini-progress" aria-hidden="true">
                        <span
                          style={{
                            width: `${Math.max(0, Math.min(100, review.value))}%`,
                          }}
                        />
                      </span>
                    )}
                    <Figure reading={review} />
                  </span>

                  <span>
                    <span className="ov-cell-label">
                      {copy.overview.colLead}
                    </span>
                    <Figure reading={lead} />
                  </span>

                  <span>
                    <span className="ov-cell-label">
                      {copy.overview.colContributors}
                    </span>
                    <Figure reading={people} />
                  </span>

                  <span>
                    <span className="ov-cell-label">
                      {copy.overview.colOpenPrs}
                    </span>
                    {/* A count of zero open pull requests is a real observation,
                        so it renders as a zero; a *missing* scope summary is not,
                        and renders as words (§0.1). */}
                    {summary ? (
                      <span className="ov-figure">
                        {formatCount(summary.facts.open_pull_requests)}
                      </span>
                    ) : (
                      <span className="ov-na">{copy.notAvailable.label}</span>
                    )}
                  </span>

                  <StatusPill headlines={headlines} withFootnote={false} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
