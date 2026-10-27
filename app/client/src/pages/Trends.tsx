/**
 * Trends — `/trends`, scoped (SPEC §5.5) — chunk C10.
 *
 * Three sections, and the order is the argument: what each month recorded, what
 * hours the work was saved in, and what each half of the window holds. Nothing on
 * this screen is computed here — the series, the grid and the fourteen comparison
 * rows all arrive from the scope file, and the only strings this module forms are
 * month names and the unit-suffixed rendering of a series point, which the chart
 * kit already owns (§9.2, §9.8).
 *
 * Three rules do most of the work on this screen:
 *
 *   1. **Axes are per-scope.** `MonthlySeries` spans the scope's own `since`→
 *      `until`; helm starts 2025-08 with 13 months and fastapi 2025-09 with 12, and
 *      a shared axis would invent history for the shorter one. The window is handed
 *      down from the scope report rather than guessed from the points.
 *   2. **The split is the dataset's, and so is its reason.** `split_reason` is
 *      printed verbatim beside the split date. A split presented as more meaningful
 *      than the collector says it is would be the product making a claim it cannot
 *      support — the reason states it is the median commit date, chosen so each half
 *      holds a similar amount of work, and that is exactly what the reader is told.
 *   3. **Two things moving together are two things moving together.** The table
 *      footer says so, at the one place on the site where the temptation to say
 *      otherwise is strongest.
 */

import { Link } from "wouter";

import { scopeTabPath } from "@/app/routes";
import type { ResolvedScope } from "@/app/scope";
import {
  MonthlySeries,
  WorkHeatmap,
  formatValue,
  monthLong,
  useMediaQuery,
} from "@/components/charts";
import { FloorFigure } from "@/components/integrity";
import { WorkingTrigger } from "@/components/working";
import * as copy from "@/copy";
import {
  useScope,
  type ComparisonRow,
  type Comparison,
  type Edition,
  type ScopeReport,
  type Series,
} from "@/data";
import { cn } from "@/lib/utils";
import { formatCount, formatDay, formatLongDay } from "@/shell/format";

import { PageFrame } from "./PageFrame";
import "./trends.css";

/** The two `temporal.*` readings the heatmap's hours belong to (§5.5.2). */
const TEMPORAL_METRIC_IDS = [
  "temporal.after_hours_share",
  "temporal.weekend_share",
];

export function TrendsScreen({
  edition,
  scope,
}: {
  edition: Edition;
  scope: ResolvedScope;
}) {
  const report = useScope(scope.slug);

  return (
    <PageFrame
      /* The heading is route-derived, so it renders before the scope file lands. */
      eyebrow={`Snapshot · ${formatLongDay(edition.generated_at)}`}
      title={`${scope.label} — ${copy.trends.title}`}
      lede={copy.trends.lede}
    >
      {report.status === "loading" && <TrendsSkeleton />}
      {report.status === "error" && (
        <ScopeErrorPanel
          reason={report.error?.message ?? ""}
          onRetry={report.retry}
        />
      )}
      {report.status === "ready" && report.data && (
        <TrendsBody scope={scope} report={report.data} />
      )}
    </PageFrame>
  );
}

function TrendsBody({
  scope,
  report,
}: {
  scope: ResolvedScope;
  report: ScopeReport;
}) {
  const { since, until } = report.scope;

  const temporal = TEMPORAL_METRIC_IDS.map(id =>
    report.metrics.find(metric => metric.id === id)
  ).filter((metric): metric is NonNullable<typeof metric> => Boolean(metric));

  return (
    <>
      <section className="section-block tr-section">
        <div className="section-header">
          <div>
            <div className="section-kicker">{copy.trends.title}</div>
            <h3>{copy.trends.seriesHeading}</h3>
          </div>
        </div>
        <p className="tr-lede">{copy.trends.seriesCaption}</p>

        <div className="tr-series-grid">
          {report.series.map(series => (
            <SeriesCard
              key={series.id}
              series={series}
              scope={scope}
              since={since}
              until={until}
            />
          ))}
        </div>
      </section>

      <section className="section-block tr-section">
        <div className="section-header">
          <div>
            <div className="section-kicker">{copy.trends.title}</div>
            <h3>{copy.trends.heatmapHeading}</h3>
          </div>
        </div>

        <div className="section-panel tr-heatmap-panel">
          <WorkHeatmap heatmap={report.heatmap} />
        </div>

        {/*
          §5.5.2: no judgement copy sits on the grid. An hour of the day is not a
          verdict, and what these hours mean as a reading belongs to the two
          `temporal.*` metrics — so they are linked, with their own displays.
        */}
        {temporal.length > 0 && (
          <p className="tr-temporal">
            <span>{copy.trends.heatmapTemporalIntro}</span>
            {temporal.map(metric => (
              <Link
                key={metric.id}
                className="tr-temporal-link"
                href={scopeTabPath(scope.target, "metrics", metric.id)}
              >
                {metric.label}
                <strong>
                  <FloorFigure display={metric.display} metricId={metric.id} />
                </strong>
              </Link>
            ))}
          </p>
        )}
      </section>

      <BeforeAfter comparison={report.comparison} scope={scope} />
    </>
  );
}

/* ------------------------------------------------------------ the series */

function SeriesCard({
  series,
  scope,
  since,
  until,
}: {
  series: Series;
  scope: ResolvedScope;
  since: string;
  until: string;
}) {
  /* The series names a metric; this scope may or may not publish that reading, and
     the ⌗ affordance and the label link both depend on it rather than assuming. */
  const published = scope.summary.metrics.some(
    metric => metric.id === series.metric_id
  );
  const latest = latestObserved(series);

  const label = published ? (
    <Link
      className="tr-card-label"
      href={scopeTabPath(scope.target, "metrics", series.metric_id)}
    >
      {series.label}
    </Link>
  ) : (
    <span className="tr-card-label">{series.label}</span>
  );

  return (
    <article className="tr-card">
      <header className="tr-card-head">
        <div className="tr-card-heading">
          {label}
          {latest === null ? (
            <p className="tr-card-absent">{copy.trends.seriesNoMonths}</p>
          ) : (
            <p className="tr-card-latest">
              {/*
                Every figure routes through `FloorFigure`, including the ones that
                need no prefix. One of these nine series reads a floor —
                `ai.detected_commit_share` — and an `if` at the call site is the
                thing that eventually forgets which one (§6.3).
              */}
              <strong>
                <FloorFigure
                  display={formatValue(latest.value, series.unit)}
                  metricId={series.metric_id}
                />
              </strong>
              <small>
                {copy.trends.seriesLatest} ·{" "}
                {copy.fill(copy.trends.seriesLatestMonth, {
                  month: monthLong(latest.month),
                })}
              </small>
            </p>
          )}
        </div>
        {published && (
          <WorkingTrigger metricId={series.metric_id} label={series.label} />
        )}
      </header>

      <MonthlySeries series={series} since={since} until={until} />
    </article>
  );
}

/** The last month that carries a figure, or `null` when none of them does. */
function latestObserved(
  series: Series
): { month: string; value: number } | null {
  for (let index = series.points.length - 1; index >= 0; index -= 1) {
    const point = series.points[index];
    if (point.value !== null) return { month: point.month, value: point.value };
  }
  return null;
}

/* ------------------------------------------------------- before and after */

function BeforeAfter({
  comparison,
  scope,
}: {
  comparison: Comparison;
  scope: ResolvedScope;
}) {
  /* §7.4: at 390px the fourteen rows become fourteen cards. Two structures rather
     than one squeezed one — a table this wide has no honest 390px column set. */
  const asCards = useMediaQuery("(max-width: 510px)");

  return (
    <section className="section-block tr-section">
      <div className="section-header">
        <div>
          <div className="section-kicker">{copy.trends.title}</div>
          <h3>{copy.trends.comparisonHeading}</h3>
        </div>
      </div>

      <div className="section-panel tr-split-intro">
        <div className="tr-split-dates">
          <span className="tr-split-kicker">
            {copy.trends.comparisonSplitLabel}
          </span>
          <strong>{formatDay(comparison.split_at)}</strong>
          <span className="tr-split-halves">
            {copy.fill(copy.trends.comparisonBeforeCommits, {
              count: formatCount(comparison.before_commits),
            })}
            {" · "}
            {copy.fill(copy.trends.comparisonAfterCommits, {
              count: formatCount(comparison.after_commits),
            })}
          </span>
        </div>

        {/*
          The collector's own sentence about why the window was cut here, printed as
          given. Paraphrasing it would let the split look chosen for a reason the
          data does not claim (§5.5.3).
        */}
        <blockquote className="tr-split-reason" data-testid="split-reason">
          {comparison.split_reason}
        </blockquote>

        {/* The dataset's own no-causality caveat, verbatim. */}
        <p className="tr-split-caveat">{comparison.caveat}</p>
      </div>

      {asCards ? (
        <>
          <p className="tr-change-legend">
            <span>{comparison.before_label}</span>
            <span aria-hidden="true">{copy.trends.comparisonArrow}</span>
            <span>{comparison.after_label}</span>
          </p>
          <div className="tr-change-cards">
            {comparison.rows.map(row => (
              <ChangeCard key={row.metric_id} row={row} scope={scope} />
            ))}
          </div>
        </>
      ) : (
        <ChangeTable comparison={comparison} scope={scope} />
      )}

      <p className="tr-split-footer">{copy.trends.comparisonFooter}</p>
    </section>
  );
}

function ChangeTable({
  comparison,
  scope,
}: {
  comparison: Comparison;
  scope: ResolvedScope;
}) {
  return (
    <div className="tr-table" role="table" aria-label={copy.trends.comparisonHeading}>
      <div className="tr-row tr-row--head" role="row">
        <span role="columnheader">{copy.trends.comparisonColumnMetric}</span>
        <span role="columnheader">{comparison.before_label}</span>
        <span role="columnheader">{comparison.after_label}</span>
        <span role="columnheader">{copy.trends.comparisonColumnChange}</span>
        <span role="columnheader">{copy.trends.comparisonColumnConfidence}</span>
      </div>

      {comparison.rows.map(row => (
        <div className="tr-row" role="row" key={row.metric_id}>
          <span role="cell" className="tr-cell-metric">
            <MetricLink row={row} scope={scope} />
          </span>
          <span role="cell" className="tr-cell-figure">
            <Figure
              display={row.before_display}
              value={row.before}
              metricId={row.metric_id}
            />
          </span>
          <span role="cell" className="tr-cell-figure">
            <Figure
              display={row.after_display}
              value={row.after}
              metricId={row.metric_id}
            />
          </span>
          <span role="cell">
            <ChangeChip row={row} />
          </span>
          <span role="cell">
            <ConfidenceChip row={row} />
          </span>
        </div>
      ))}
    </div>
  );
}

/** §7.4 — the 390px form: label, `before → after`, then the two chips. */
function ChangeCard({
  row,
  scope,
}: {
  row: ComparisonRow;
  scope: ResolvedScope;
}) {
  return (
    <article className="tr-change-card">
      <h4>
        <MetricLink row={row} scope={scope} />
      </h4>
      <p className="tr-change-pair">
        <Figure
          display={row.before_display}
          value={row.before}
          metricId={row.metric_id}
        />
        <span className="tr-change-arrow" aria-hidden="true">
          {copy.trends.comparisonArrow}
        </span>
        <Figure
          display={row.after_display}
          value={row.after}
          metricId={row.metric_id}
        />
      </p>
      <p className="tr-change-chips">
        <ChangeChip row={row} />
        <ConfidenceChip row={row} />
      </p>
    </article>
  );
}

function MetricLink({
  row,
  scope,
}: {
  row: ComparisonRow;
  scope: ResolvedScope;
}) {
  const published = scope.summary.metrics.some(
    metric => metric.id === row.metric_id
  );
  if (!published) return <span className="tr-metric-label">{row.label}</span>;
  return (
    <Link
      className="tr-metric-label"
      href={scopeTabPath(scope.target, "metrics", row.metric_id)}
    >
      {row.label}
    </Link>
  );
}

/**
 * A half of the comparison, as the dataset displays it.
 *
 * When the earlier half has no figure the dataset says so in `before_display`
 * ("not available") and leaves `before` null. That string is rendered as words, in
 * the absence treatment rather than the mono figure treatment, so it cannot be read
 * as a quantity — and never as a zero (§0.1, §6.4).
 */
function Figure({
  display,
  value,
  metricId,
}: {
  display: string;
  value: number | null;
  metricId: string;
}) {
  if (value === null) {
    return (
      <span className="tr-absent" data-na="true">
        {display}
      </span>
    );
  }
  /*
    A floor metric's half keeps its `≥`. The *change* between two halves does not:
    a difference of two floors is not itself a floor, and prefixing one would be a
    claim about a quantity nobody measured (§6.3).
  */
  return (
    <span className="tr-figure">
      <FloorFigure display={display} metricId={metricId} />
    </span>
  );
}

/**
 * The change, signed, in DM Mono.
 *
 * Colour follows §5.1.4 exactly: a metric whose `direction` is `neutral` is grey
 * whatever it did, and a directioned metric is tinted only by whether the move ran
 * with or against its stated direction. The chip's text never says which of those
 * it is — the reader is told the size and the sign, and the metric's own direction
 * is a fact they can look up. Where the dataset offers no change figure at all, the
 * chip states why rather than printing a zero.
 */
function ChangeChip({ row }: { row: ComparisonRow }) {
  if (row.change_pct === null && row.change_points === null) {
    return (
      <span className="tr-change tr-change--absent" data-na="true">
        {copy.trends.comparisonNoChange}
      </span>
    );
  }

  const amount = row.change_pct ?? row.change_points!;
  const display =
    row.change_pct !== null
      ? `${signed(row.change_pct)}%`
      : copy.fill(copy.trends.comparisonChangePoints, {
          value: signed(row.change_points!),
        });

  return (
    <span
      className={cn("tr-change", `tr-change--${toneFor(row.direction, amount)}`)}
      data-direction={row.direction}
    >
      {display}
    </span>
  );
}

function ConfidenceChip({ row }: { row: ComparisonRow }) {
  return (
    <span className="tr-confidence" data-confidence={row.confidence}>
      {copy.confidence[row.confidence]}
    </span>
  );
}

/** `+1.2`, `-6.1`, `0`. The sign is part of the figure, so it is always written. */
function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function toneFor(
  direction: ComparisonRow["direction"],
  amount: number
): "with" | "against" | "neutral" {
  if (direction === "neutral" || amount === 0) return "neutral";
  const upwards = amount > 0;
  const wanted = direction === "higher_is_better";
  return upwards === wanted ? "with" : "against";
}

/* ------------------------------------------------------- loading & error */

/** §5.5 — four chart-card skeletons and a table skeleton. */
function TrendsSkeleton() {
  return (
    <div className="tr-skeleton" aria-busy="true" aria-label="Loading this scope's trends">
      <div className="tr-series-grid">
        {[0, 1, 2, 3].map(index => (
          <div
            key={index}
            className="skeleton-block"
            style={{ height: 300, borderRadius: 11 }}
          />
        ))}
      </div>
      <div
        className="skeleton-block"
        style={{ height: 240, marginTop: 28, borderRadius: 11 }}
      />
      <div
        className="skeleton-block"
        style={{ height: 420, marginTop: 28, borderRadius: 11 }}
      />
    </div>
  );
}

/** §4.2 — the scope file failed. Nothing from another scope is shown in its place. */
function ScopeErrorPanel({
  reason,
  onRetry,
}: {
  reason: string;
  onRetry: () => void;
}) {
  return (
    <section className="state-panel">
      <h2>This scope&rsquo;s records didn&rsquo;t load.</h2>
      {reason && <code className="state-reason">{reason}</code>}
      <p>
        The series, the grid of hours and the two halves of the window all come
        from one file, and none of them is shown from another scope&rsquo;s.
      </p>
      <div className="state-actions">
        <button className="primary-button" onClick={onRetry} type="button">
          Try again
        </button>
      </div>
    </section>
  );
}
