/**
 * "Inside this repository" — SPEC §5.1.5, the repository variant of the left panel.
 *
 * A repository has no children, so the scope table would be empty at this
 * altitude. What takes its place answers the question a reader arriving at one
 * repository actually has: what is in here, and what are the heaviest individual
 * records the edition's figures rest on.
 *
 * The facts strip is `facts` verbatim — counts of things, not measurements. The
 * records beneath it are exemplars the dataset itself ranked, each one a link into
 * the working of the metric that ranked it, so the weight beside it is always one
 * tap from the sample it was weighed within.
 */

import {
  FileText,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Package,
} from "lucide-react";
import { Link } from "wouter";

import { withWorking } from "@/app/routes";
import type { ResolvedScope } from "@/app/scope";
import * as copy from "@/copy";
import type { ScopeReport, SourceKind } from "@/data";
import { formatCount } from "@/shell/format";

import { topExemplars } from "./derive";

const KIND_ICON: Record<SourceKind, typeof GitCommitHorizontal> = {
  commit: GitCommitHorizontal,
  pull_request: GitPullRequest,
  file: FileText,
  release: Package,
  branch: GitBranch,
  dataset: FileText,
};

export interface InsidePanelProps {
  scope: ResolvedScope;
  report: ScopeReport;
}

export function InsidePanel({ scope, report }: InsidePanelProps) {
  const { facts } = report;
  const exemplars = topExemplars(report);

  return (
    <div className="section-panel repositories-panel">
      <div className="panel-header">
        <div>
          <div className="section-kicker">{copy.overview.insideKicker}</div>
          <h3>{copy.overview.insideTitle}</h3>
        </div>
      </div>

      <div className="ov-facts">
        <div>
          <strong>{formatCount(facts.commits)}</strong>
          <small>{copy.overview.factCommits}</small>
        </div>
        <div>
          <strong>{formatCount(facts.merged_pull_requests)}</strong>
          <small>{copy.overview.factMergedPullRequests}</small>
        </div>
        <div>
          <strong>{formatCount(facts.reviews)}</strong>
          <small>{copy.overview.factReviews}</small>
        </div>
        <div>
          <strong>{formatCount(facts.branches)}</strong>
          <small>{copy.overview.factBranches}</small>
        </div>
        <div>
          <strong>{formatCount(facts.contributors)}</strong>
          <small>{copy.overview.factContributors}</small>
        </div>
        <div>
          <strong>{facts.span_weeks}</strong>
          <small>{copy.overview.factSpan}</small>
        </div>
      </div>

      <p className="ov-exemplars-title">{copy.overview.exemplarsTitle}</p>

      {exemplars.length === 0 ? (
        <p className="ov-empty">{copy.overview.exemplarsNone}</p>
      ) : (
        exemplars.map(entry => {
          const Icon = KIND_ICON[entry.exemplar.source.kind] ?? FileText;
          return (
            <Link
              key={entry.metricId}
              href={withWorking(scope.path, entry.metricId)}
              className="ov-exemplar"
              aria-label={copy.fill(copy.working.triggerAria, {
                label: entry.metricLabel,
              })}
            >
              <span className="ov-exemplar-icon" aria-hidden="true">
                <Icon size={14} />
              </span>
              <span className="ov-exemplar-body">
                <span className="ov-exemplar-metric">{entry.metricLabel}</span>
                <span className="ov-exemplar-headline">
                  {entry.exemplar.headline}
                </span>
              </span>
              <span className="ov-exemplar-weight">
                {copy.fill(copy.overview.exemplarWeight, {
                  weight: formatCount(entry.exemplar.weight),
                  unit: entry.exemplar.weight_unit,
                })}
              </span>
            </Link>
          );
        })
      )}
    </div>
  );
}
