/**
 * "What every number carries" — SPEC §5.1.5, right half of the split.
 *
 * This panel is the product's thesis stated on the page that most readers will
 * only ever see: every figure here carries its formula with real values, the
 * sample it was computed over with every exclusion itemised, and the actual
 * commits and pull requests underneath. Which is why it appears at every scope
 * rather than only at the organisation.
 *
 * Each row opens the working for the finding the hero is showing — the same
 * evidence, entered at the section the row names. The drawer has no section
 * anchor in its URL contract (§1.3 carries the metric, not a position within it),
 * so the rows land at the top of the same working and each one says what it will
 * find there.
 */

import { ChevronRight, Code2, Database, Github, Sparkles } from "lucide-react";
import { Link } from "wouter";

import { withWorking } from "@/app/routes";
import type { ResolvedScope } from "@/app/scope";
import * as copy from "@/copy";

export interface EvidencePanelProps {
  scope: ResolvedScope;
  /** The metric the hero is standing on — the working these rows open. */
  metricId: string;
  metricLabel: string;
}

export function EvidencePanel({
  scope,
  metricId,
  metricLabel,
}: EvidencePanelProps) {
  const href = withWorking(scope.path, metricId);

  const rows = [
    {
      key: "formula",
      icon: Code2,
      title: copy.overview.evidenceFormula,
      sub: copy.overview.evidenceFormulaSub,
    },
    {
      key: "sample",
      icon: Database,
      title: copy.overview.evidenceSample,
      sub: copy.overview.evidenceSampleSub,
    },
    {
      key: "source",
      icon: Github,
      title: copy.overview.evidenceSources,
      sub: copy.overview.evidenceSourcesSub,
    },
  ] as const;

  return (
    <div className="section-panel evidence-panel">
      <div className="panel-header">
        <div>
          <div className="section-kicker">{copy.overview.evidenceKicker}</div>
          <h3>{copy.overview.evidenceTitle}</h3>
        </div>
        <Sparkles size={18} className="sparkle-icon" aria-hidden="true" />
      </div>

      <div className="evidence-list">
        {rows.map(row => {
          const Icon = row.icon;
          return (
            <Link
              key={row.key}
              href={href}
              className="evidence-item"
              /* Three links to one place: the name has to say which part of it
                 each one is about, or a screen reader hears the same link thrice. */
              aria-label={copy.fill(copy.overview.evidenceRowAria, {
                section: row.title,
                label: metricLabel,
              })}
            >
              <span className={`evidence-icon ${row.key}`} aria-hidden="true">
                <Icon size={17} />
              </span>
              <span>
                <strong>{row.title}</strong>
                <small>{row.sub}</small>
              </span>
              <ChevronRight size={15} aria-hidden="true" />
            </Link>
          );
        })}
      </div>

      <div className="evidence-quote">
        <span className="quote-mark" aria-hidden="true">
          &ldquo;
        </span>
        <p>{copy.overview.evidenceQuote}</p>
        <span className="quote-attribution">
          {copy.overview.evidenceAttribution}
        </span>
      </div>
    </div>
  );
}
