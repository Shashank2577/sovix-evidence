/**
 * The five numbered sections of the working (SPEC §5.10.4–§5.10.8).
 *
 * Exported on its own because §5.4 requires the metric detail page to render "the
 * five numbered sections exactly as the drawer renders them, permanently expanded".
 * Two implementations would drift, and the day they drifted the page and the drawer
 * would be showing different evidence for the same figure — so there is one, with a
 * `variant` that says how much of it arrives already open.
 *
 * Variants, and why they differ:
 *   - `drawer` (≥781px): every exemplar is its own collapsible card, rank 1 open.
 *     Six source rows, then the way through to the filtered evidence index.
 *   - `sheet` (≤780px): §10.4 — exemplars past the first and sources past the third
 *     fold behind one disclosure each. A 62%-tall sheet that opens onto five cards
 *     is a scroll, not a read.
 *   - `page`: everything open, nothing to click before you can see it.
 *
 * What every variant shares: the order. Plain English precedes the formula because
 * §5.10 makes it an audience decision, not a layout one — the project manager
 * outnumbers the engineer at this surface, and the engineer loses nothing by
 * scrolling one section.
 */

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

import { SampleBreakdown } from "@/components/integrity";
import type { Metric, SourceRecord } from "@/data";
import { cn } from "@/lib/utils";
import * as copy from "@/copy";

import { CaveatBox } from "./CaveatBox";
import { Disclosure } from "./Disclosure";
import { ExemplarCard } from "./ExemplarCard";
import { FormulaBlock } from "./FormulaBlock";
import { SourceRecordRow } from "./SourceRecordRow";
import { evidenceFilterPath } from "./useWorking";

export type WorkingVariant = "drawer" | "sheet" | "page";

/**
 * A source record's React key.
 *
 * The position is load-bearing, not lazy. `(kind, repo, ref)` looks unique and is
 * not: `people.bus_factor` at fastapi/fastapi publishes fifteen `dataset` records
 * that share all three fields *and* share one `evidenceId` — they differ only in
 * `detail`, one contributor each. Nothing in the record identifies it, so the list
 * position is the identity. These lists never reorder (the dataset's order is the
 * order), so an index key is stable here in the way it would not be in a sortable
 * table.
 */
function sourceKey(source: SourceRecord, index: number): string {
  return `${index}:${source.evidenceId ?? source.ref}`;
}

/** §5.10.7 caps the list at five; the dataset publishes at most five anyway. */
const MAX_EXEMPLARS = 5;
/** §5.10.8: six rows in the drawer, then the link out. §10.4: three on the sheet. */
const SOURCE_ROWS: Record<WorkingVariant, number> = {
  drawer: 6,
  sheet: 3,
  page: 12,
};

export interface WorkingSectionsProps {
  metric: Metric;
  /** The scope's slug, for the pre-filtered evidence link (§5.10.8). */
  scopeSlug: string;
  variant: WorkingVariant;
  /** Fired when a link inside the sections leaves this page (§5.10.9). */
  onNavigateAway?: () => void;
  className?: string;
}

function Section({
  number,
  heading,
  children,
}: {
  number: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="wk-section" data-section={number}>
      <h3 className="wk-section__title">
        <span className="wk-section__number">{number}</span>
        <span>{heading}</span>
      </h3>
      {children}
    </section>
  );
}

export function WorkingSections({
  metric,
  scopeSlug,
  variant,
  onNavigateAway,
  className,
}: WorkingSectionsProps) {
  const exemplars = [...metric.exemplars]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, MAX_EXEMPLARS);
  /* §0.1's first rule. See `ExemplarCard`'s `showRank` for the full reasoning. */
  const showRank = metric.family !== "people";
  const leadExemplars = variant === "sheet" ? exemplars.slice(0, 1) : exemplars;
  const foldedExemplars = variant === "sheet" ? exemplars.slice(1) : [];

  const rowCount = SOURCE_ROWS[variant];
  const shownSources = metric.sources.slice(0, rowCount);
  /*
   * Only the sheet folds the overflow (§10.4). In the drawer the rows past the
   * sixth are reached through the evidence index instead (§5.10.8) — a disclosure
   * holding nineteen more rows inside a 470px panel is a worse door to them than
   * the screen built to list them.
   */
  const foldedSources =
    variant === "sheet" ? metric.sources.slice(rowCount) : [];

  return (
    <div className={cn("wk-sections", className)}>
      <Section number="01" heading={copy.working.formulaHeading}>
        <FormulaBlock formula={metric.formula} />
      </Section>

      <Section number="02" heading={copy.working.sampleHeading}>
        <SampleBreakdown sample={metric.sample} />
      </Section>

      <Section number="03" heading={copy.working.assumptionsHeading}>
        <div className="wk-caveats">
          {metric.assumptions.map(text => (
            <CaveatBox key={text} kind="assumption" text={text} />
          ))}
          {metric.caveats.map(text => (
            <CaveatBox key={text} kind="caveat" text={text} />
          ))}
        </div>
      </Section>

      <Section number="04" heading={copy.working.exemplarsHeading}>
        {exemplars.length === 0 ? (
          /* Absence is never silent (§0.1). A section that simply vanished would
             read as a figure with nothing behind it rather than a figure whose
             evidence is spread evenly across its sample. */
          <p className="wk-empty" data-testid="working-no-exemplars">
            {copy.working.exemplarsNone}
          </p>
        ) : (
          <>
            <p className="wk-section__caption">
              {copy.working.exemplarsCaption}
            </p>
            <div className="wk-exemplars">
              {leadExemplars.map(exemplar => (
                <ExemplarCard
                  key={exemplar.rank}
                  exemplar={exemplar}
                  showRank={showRank}
                  defaultOpen={variant === "page" || exemplar.rank === 1}
                />
              ))}
              {foldedExemplars.length > 0 && (
                <Disclosure
                  label={copy.fill(copy.working.exemplarMoreToggle, {
                    count: foldedExemplars.length,
                  })}
                  closeLabel={copy.working.exemplarMoreClose}
                >
                  <div className="wk-exemplars">
                    {foldedExemplars.map(exemplar => (
                      <ExemplarCard
                        key={exemplar.rank}
                        exemplar={exemplar}
                        showRank={showRank}
                      />
                    ))}
                  </div>
                </Disclosure>
              )}
            </div>
          </>
        )}
      </Section>

      <Section number="05" heading={copy.working.sourcesHeading}>
        {metric.sources.length === 0 ? (
          /* §5.10.8: when there are no sources the dataset says why, and that
             sentence is the section. A metric whose evidence cannot be produced
             does not get published — one whose evidence does not exist yet says so. */
          metric.no_sources_reason ? (
            <CaveatBox kind="caveat" text={metric.no_sources_reason} />
          ) : (
            <p className="wk-empty">{copy.working.sourceNoneHeading}</p>
          )
        ) : (
          <>
            <ul className="wk-sources">
              {/* The (kind, repo, ref) tuple is NOT unique: people.bus_factor at
                  repo:fastapi/fastapi carries two `dataset` records sharing a repo
                  and ref, so keying on it collapsed them and React logged a
                  duplicate-key error five times per mount. A source record has no
                  stable id of its own, so position within the list is the
                  identity — which is correct here, because the exporter's order
                  is meaningful (it is the ranked order) and is preserved. */}
              {shownSources.map((source, index) => (
                <SourceRecordRow
                  key={`${source.kind}:${source.repo}:${source.ref}:${index}`}
                  source={source}
                  onOpenRecord={onNavigateAway}
                />
              ))}
            </ul>

            {foldedSources.length > 0 && (
              <Disclosure
                label={copy.fill(copy.working.sourceMoreToggle, {
                  count: foldedSources.length,
                })}
                closeLabel={copy.working.sourceMoreClose}
              >
                <ul className="wk-sources">
                  {foldedSources.map((source, index) => (
                    <SourceRecordRow
                      key={`${source.kind}:${source.repo}:${source.ref}:${index}`}
                      source={source}
                      onOpenRecord={onNavigateAway}
                    />
                  ))}
                </ul>
              </Disclosure>
            )}

            <Link
              className="wk-all-records"
              href={evidenceFilterPath(metric.id, scopeSlug)}
              onClick={onNavigateAway}
            >
              {copy.fill(copy.working.sourceAllRecords, {
                count: metric.sources.length,
              })}
              <ArrowRight size={13} strokeWidth={2} aria-hidden="true" />
            </Link>
          </>
        )}
      </Section>
    </div>
  );
}
