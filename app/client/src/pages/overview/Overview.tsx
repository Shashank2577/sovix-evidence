/**
 * Overview — SPEC §5.1, every variant.
 *
 * The organisation greeting, the project read, the repository's "Inside this
 * repository", and the hero's empty variant are one screen: the same six blocks
 * top to bottom, fed by whichever scope the route resolved. Moving down the
 * altitude ladder changes the data, never the mental model (§1.1).
 *
 * What this screen is, and what it deliberately is not:
 *
 *   - Every figure on it is the dataset's own `display` string. The only number
 *     here that is not is the signal cards' m/m chip, and that is a subtraction of
 *     two published points (§9.2, §5.1.4).
 *   - There is no period selector. An edition covers exactly one window, and
 *     offering another would promise a recomputation this product refuses (§5.1.2).
 *   - There are no "vs last edition" deltas, for the plainer reason that there is
 *     no last edition.
 *   - Status pills are derived from the findings that fired and nothing else
 *     (§6.15). Nothing on this screen ranks a person, scores a scope, or says a
 *     reading is good.
 *
 * Loading is two-stage (§4.1): the heading is route-derived and paints
 * immediately; the hero, cards and panels below it are the scope file's, and wait
 * behind layout-shaped skeletons. A failed scope file replaces blocks 3–5 with an
 * inline retry and leaves the shell, the tabs and every other scope alone (§4.2).
 */

import { motion } from "framer-motion";
import { FileCheck2, Layers3, Play, RotateCw, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";

import { METHODOLOGY_PATH, scopeTabPath, withWorking } from "@/app/routes";
import type { ResolvedScope } from "@/app/scope";
import { ScopeSwitcher } from "@/shell/ScopeSwitcher";
import * as copy from "@/copy";
import {
  useScope,
  type DataFetchError,
  type Edition,
  type Metric,
  type ScopeReport,
} from "@/data";
import { duration, ease, stagger, staggerDelay } from "@/lib/motion";
import { formatCount, formatDay, formatLongDay } from "@/shell/format";

import { ChildrenPanel } from "./ChildrenPanel";
import { EvidencePanel } from "./EvidencePanel";
import { FindingHero } from "./FindingHero";
import { InsidePanel } from "./InsidePanel";
import { SignalCards } from "./SignalCards";
import { greetingFor, heroFindings, signalMetricIds } from "./derive";

import "./overview.css";

const GREETING = {
  morning: copy.overview.greetingMorning,
  afternoon: copy.overview.greetingAfternoon,
  evening: copy.overview.greetingEvening,
} as const;

/* ------------------------------------------------------------- entrance */

/** §8.2: heading first, then each section, ≤600 ms end to end. */
const section = (index: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: duration.slow,
    ease: ease.out,
    delay: 0.06 + staggerDelay(index, stagger.section),
  },
});

export interface OverviewProps {
  edition: Edition;
  scope: ResolvedScope;
}

export default function Overview({ edition, scope }: OverviewProps) {
  const report = useScope(scope.slug);
  const level = scope.summary.scope.level;
  const { facts } = scope.summary;

  const greeting = useMemo(() => greetingFor(new Date()), []);

  /* The hero's finding decides which working the evidence panel opens (§5.1.5). */
  const findings = heroFindings(edition, scope.summary);
  const heroMetricId =
    findings[0]?.metric_id ??
    scope.summary.nearestThreshold?.metricId ??
    "process.review_coverage";
  const heroMetricLabel =
    edition.metricCatalog.find(entry => entry.id === heroMetricId)?.label ??
    heroMetricId;

  const title =
    level === "org"
      ? `${GREETING[greeting]}, ${copy.overview.viewerFirstName}`
      : scope.label;

  const lede =
    level === "org"
      ? copy.overview.ledeOrg
      : level === "project"
        ? copy.overview.ledeProject
        : copy.overview.ledeRepo;

  return (
    <div className="content-wrap">
      <motion.div
        className="page-heading"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.enter, ease: ease.out }}
      >
        <div>
          <div className="eyebrow">
            <span className="live-dot" aria-hidden="true" />
            Snapshot · {formatLongDay(edition.generated_at)}
          </div>
          <h1>
            {title}
            <span className="title-period">.</span>
          </h1>
          <p className="heading-lede">
            {lede}
            {level === "repo" && scope.parent && (
              <Link
                href={scopeTabPath(scope.parent.target, "overview")}
                className="ov-heading-chip"
              >
                {copy.fill(copy.overview.repoProjectChip, {
                  project: scope.parent.label,
                })}
              </Link>
            )}
          </p>
        </div>
        <div className="heading-actions">
          <button
            type="button"
            className="quiet-button"
            onClick={() => window.print()}
            aria-label={copy.overview.exportEditionAria}
          >
            <FileCheck2 size={15} aria-hidden="true" />
            {copy.overview.exportEdition}
          </button>
          <Link
            href={withWorking(scope.path, heroMetricId)}
            className="primary-button"
          >
            <Play size={14} fill="currentColor" aria-hidden="true" />
            {copy.overview.viewWorking}
          </Link>
        </div>
      </motion.div>

      <motion.div className="filter-row" {...section(0)}>
        <div className="filter-group">
          <span className="filter-label">{copy.overview.scopeLabel}</span>
          {/* The same tree as the sidebar switcher. Duplicated here on purpose:
              the page has to be self-sufficient in a screenshot (§5.1.2). */}
          <ScopeSwitcher
            edition={edition}
            scope={scope}
            tab="overview"
            triggerClassName="filter-select"
            triggerLabel={copy.overview.scopeTriggerAria}
          >
            <Layers3 size={14} aria-hidden="true" />
            {scope.label}
          </ScopeSwitcher>
        </div>
        <div className="edition-note">
          <ShieldCheck size={14} aria-hidden="true" />
          {copy.overview.editionNote} <span aria-hidden="true">·</span>{" "}
          {copy.fill(copy.overview.editionCommits, {
            commits: formatCount(facts.commits),
          })}{" "}
          <span aria-hidden="true">·</span>{" "}
          {copy.fill(copy.overview.editionPullRequests, {
            pullRequests: formatCount(facts.pull_requests),
          })}
        </div>
      </motion.div>

      {report.status === "error" ? (
        <ScopeError
          reason={
            (report.error as DataFetchError | undefined)?.message ??
            copy.overview.errorTitle
          }
          onRetry={report.retry}
        />
      ) : report.status === "loading" || !report.data ? (
        <OverviewSkeleton />
      ) : (
        <Body
          edition={edition}
          scope={scope}
          report={report.data}
          heroMetricId={heroMetricId}
          heroMetricLabel={heroMetricLabel}
        />
      )}

      <footer className="page-footer">
        <span>
          <span className="footer-mark" aria-hidden="true" />
          {copy.overview.footerBrand}
        </span>
        <span>
          {copy.fill(copy.overview.footerEdition, {
            day: formatDay(edition.generated_at),
          })}{" "}
          ·{" "}
          <Link href={METHODOLOGY_PATH}>{copy.overview.footerMethodology}</Link>
        </span>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------ blocks 3–5 */

function Body({
  edition,
  scope,
  report,
  heroMetricId,
  heroMetricLabel,
}: {
  edition: Edition;
  scope: ResolvedScope;
  report: ScopeReport;
  heroMetricId: string;
  heroMetricLabel: string;
}) {
  const byId = useMemo(
    () =>
      new Map<string, Metric>(
        report.metrics.map(metric => [metric.id, metric])
      ),
    [report]
  );
  const signals = signalMetricIds(scope.summary.scope.level, byId)
    .map(id => byId.get(id))
    .filter((metric): metric is Metric => metric !== undefined);

  return (
    <>
      <motion.div {...section(1)}>
        <FindingHero edition={edition} scope={scope} facts={report.facts} />
      </motion.div>

      <motion.section className="section-block metrics-section" {...section(2)}>
        <div className="section-header">
          <div>
            <div className="section-kicker">{copy.overview.signalsKicker}</div>
            <h3>{copy.overview.signalsTitle}</h3>
          </div>
          <Link
            href={scopeTabPath(scope.target, "metrics")}
            className="section-link"
          >
            {copy.fill(copy.overview.signalsAll, {
              count: edition.metricCatalog.length,
            })}{" "}
            →
          </Link>
        </div>
        <SignalCards
          edition={edition}
          target={scope.target}
          metrics={signals}
        />
      </motion.section>

      {/* §8.8: below the fold, so it reveals on scroll rather than on a timer. */}
      <motion.section
        className="section-block split-section"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: duration.slow, ease: ease.out }}
      >
        {scope.summary.scope.level === "repo" ? (
          <InsidePanel scope={scope} report={report} />
        ) : (
          <ChildrenPanel edition={edition} scope={scope} />
        )}
        <EvidencePanel
          scope={scope}
          metricId={heroMetricId}
          metricLabel={heroMetricLabel}
        />
      </motion.section>
    </>
  );
}

/* ----------------------------------------------------------------- states */

/** §4.1 — skeletons mirror the real layout: hero block, four cards, six rows. */
function OverviewSkeleton() {
  return (
    <div aria-busy="true" aria-label={copy.overview.loadingLabel}>
      <div className="skeleton-block ov-skeleton-hero" />
      <div className="section-block">
        <div className="metric-grid">
          {[0, 1, 2, 3].map(index => (
            <div key={index} className="skeleton-block ov-skeleton-card" />
          ))}
        </div>
      </div>
      <div className="section-block split-section">
        <div className="section-panel">
          {[0, 1, 2, 3, 4, 5].map(index => (
            <div key={index} className="skeleton-block ov-skeleton-row" />
          ))}
        </div>
        <div className="section-panel">
          {[0, 1, 2].map(index => (
            <div key={index} className="skeleton-block ov-skeleton-row" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** §4.2 — one scope's file failed. The shell and every other scope are untouched. */
function ScopeError({
  reason,
  onRetry,
}: {
  reason: string;
  onRetry: () => void;
}) {
  return (
    <section className="ov-error" role="alert">
      <h2>{copy.overview.errorTitle}</h2>
      <code>{reason}</code>
      <p>{copy.overview.errorBody}</p>
      <div className="ov-error-actions">
        <button type="button" className="primary-button" onClick={onRetry}>
          <RotateCw size={14} aria-hidden="true" />
          {copy.overview.errorRetry}
        </button>
      </div>
    </section>
  );
}
