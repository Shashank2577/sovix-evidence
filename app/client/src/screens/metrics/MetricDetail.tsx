/**
 * Metric detail — SPEC §5.4.
 *
 * One figure, fully unpacked: the page the drawer expands into, the engineer's
 * audit bench, and the project manager's script. The reading on the left, the
 * working on the right, permanently expanded — the same five sections the drawer
 * renders, from the same component, so the page and the drawer can never show
 * different evidence for the same figure.
 *
 * Two things this page deliberately does not render:
 *
 *   - **Direction.** `direction: lower_is_better` never becomes an arrow or a
 *     caption. §5.4 settles it: `how_to_read` already carries the nuance, and a
 *     bare arrow invites the ranking-think §0.1 forbids. Direction survives only
 *     as the colour rule for a delta chip elsewhere.
 *   - **A zero in place of a missing reading.** The NA variant of this page is the
 *     proof that absence is a stance: the prose renders in full, the formula shows
 *     its zero inputs, the sample says `0 of 0`, and a panel states the reason in
 *     the dataset's own words.
 */

import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, RotateCw } from "lucide-react";
import { Link } from "wouter";

import { scopeTabPath, type ScopeTarget } from "@/app/routes";
import { targetForKey, type ResolvedScope } from "@/app/scope";
import { MonthlySeries } from "@/components/charts";
import {
  FloorFigure,
  NotAvailable,
  TierBadge,
  notAvailableReason,
} from "@/components/integrity";
import { CaveatBox, WorkingSections } from "@/components/working";
import type {
  DataFetchError,
  Edition,
  Headline,
  Metric,
  MetricSummary,
  ScopeKey,
  ScopeReport,
} from "@/data";
import { useScope } from "@/data";
import { duration, ease } from "@/lib/motion";
import { PageFrame } from "@/pages/PageFrame";
import * as copy from "@/copy";

import "./metrics.css";

export function MetricDetail({
  edition,
  scope,
  metricId,
}: {
  edition: Edition;
  scope: ResolvedScope;
  metricId: string;
}) {
  const report = useScope(scope.slug);

  const entry = edition.metricCatalog.find(row => row.id === metricId);
  const summary = scope.summary.metrics.find(row => row.id === metricId);
  const metric = report.data?.metrics.find(row => row.id === metricId);

  /* The edition does not publish this id at all — a mistyped or stale address. */
  if (!entry) return <UnknownMetric edition={edition} scope={scope} metricId={metricId} />;

  /* It is in the catalog but not in this scope's file: same answer, because from
     the reader's position it is the same fact. */
  if (report.status === "ready" && !metric)
    return <UnknownMetric edition={edition} scope={scope} metricId={metricId} />;

  const familyLabel =
    edition.glossary.families[entry.family]?.label ?? entry.family;

  return (
    <div className="content-wrap">
      <motion.div
        className="mp-heading"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.enter, ease: ease.out }}
      >
        <Link
          className="mp-back"
          href={scopeTabPath(scope.target, "metrics")}
          aria-label={copy.metricPage.backAria}
        >
          <ArrowLeft size={12} aria-hidden="true" />
          {copy.fill(copy.metricPage.backToIndex, {
            count: edition.metricCatalog.length,
          })}
        </Link>

        <div className="mp-kicker">
          <span>{familyLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="mp-kicker__scope">{scope.label}</span>
        </div>

        <h1>
          {entry.label}
          <span className="title-period">.</span>
        </h1>

        <div className="mp-value-row" data-na={metric?.isNA ? "true" : undefined}>
          <ValueFigure metric={metric} summary={summary} metricId={metricId} />
          {summary && (
            <TierBadge
              tier={summary.tier}
              confidence={summary.confidence}
              boxed
              legend={edition.data_quality.tier_legend[summary.tier]}
            />
          )}
        </div>
      </motion.div>

      <Findings edition={edition} scope={scope} metricId={metricId} />

      {report.status === "error" && (
        <DetailError
          reason={(report.error as DataFetchError | undefined)?.message ?? ""}
          onRetry={report.retry}
        />
      )}

      {report.status === "loading" && <DetailSkeleton />}

      {report.status === "ready" && report.data && metric && (
        <div className="mp-columns">
          <div className="mp-column">
            {metric.isNA && <NotAvailablePanel metric={metric} />}

            <section className="mp-panel">
              <h2>{copy.metricPage.plainEnglishHeading}</h2>
              <p className="mp-prose">{metric.plain_english}</p>
            </section>

            <section className="mp-panel">
              <h2>{copy.metricPage.whyHeading}</h2>
              <p className="mp-prose mp-prose--small">{metric.why_it_matters}</p>
            </section>

            <section className="mp-panel">
              <h2>{copy.metricPage.howHeading}</h2>
              <figure className="mp-quote">
                <span className="mp-quote__mark" aria-hidden="true">
                  &ldquo;
                </span>
                <p>{metric.how_to_read}</p>
              </figure>
            </section>

            <SeriesPanel report={report.data} metric={metric} />

            <CrossScopeStrip
              edition={edition}
              scope={scope}
              metricId={metricId}
            />
          </div>

          <div className="mp-column">
            <section className="mp-working" aria-label={copy.metricPage.workingHeading}>
              <div className="mp-working__head">
                <span className="drawer-live" aria-hidden="true" />
                {copy.metricPage.workingHeading}
              </div>
              <p className="mp-working__caption">{copy.metricPage.workingCaption}</p>
              <WorkingSections
                metric={metric}
                scopeSlug={scope.slug}
                variant="page"
              />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ the figure */

/**
 * The reading, at 44px. Every figure routes through `FloorFigure` — including the
 * ones that need no `≥` — so no call site can forget which three metrics are
 * floors (§6.3). A null reading never reaches it: it goes to `NotAvailable`,
 * which states the reason rather than printing a zero (§6.4).
 */
function ValueFigure({
  metric,
  summary,
  metricId,
}: {
  metric: Metric | undefined;
  summary: MetricSummary | undefined;
  metricId: string;
}) {
  if (metric) {
    return (
      <span className="mp-value">
        {metric.isNA ? (
          <NotAvailable metric={metric} size="stat" />
        ) : (
          <FloorFigure display={metric.display} metricId={metric.id} />
        )}
      </span>
    );
  }

  /* The scope file has not arrived. A published reading can still be shown — it is
     the same edition's own `display`, already in memory — but a *missing* reading
     cannot, because the reason for the absence lives in the file that is still in
     flight, and "Not available" without its reason is the bare dash §6.4 forbids. */
  if (summary && !summary.isNA) {
    return (
      <span className="mp-value">
        <FloorFigure display={summary.display} metricId={metricId} />
      </span>
    );
  }

  return <div className="skeleton-block" style={{ width: 190, height: 44 }} />;
}

/* ------------------------------------------------------- the NA explanation */

/**
 * §5.4's NA variant: "an explanation panel renders the relevant caveat".
 *
 * The caveat that the figure's own reason line already carries is left out rather
 * than repeated two inches below itself; what remains is everything else the
 * dataset says about why this reading is absent.
 */
function NotAvailablePanel({ metric }: { metric: Metric }) {
  const stated = notAvailableReason(metric);
  const rest = metric.caveats.filter(text => text !== stated);

  return (
    <section className="mp-na-panel">
      <h2>{copy.metricPage.naHeading}</h2>
      <p>{copy.metricPage.naBody}</p>
      {/* The caveats only, and only the ones not already stated as the figure's
          own reason. The assumptions are in the working's 03, beside the rest of
          the list — promoting one caveat is emphasis; repeating the whole
          section here would just be the same panel twice. */}
      {rest.map(text => (
        <CaveatBox key={text} kind="caveat" text={text} />
      ))}
    </section>
  );
}

/* -------------------------------------------------------------- the series */

function SeriesPanel({ report, metric }: { report: ScopeReport; metric: Metric }) {
  const series = report.series.find(row => row.metric_id === metric.id);

  return (
    <section className="mp-panel">
      <h2>{copy.metricPage.seriesHeading}</h2>
      {series ? (
        <>
          <MonthlySeries
            series={series}
            since={report.scope.since}
            until={report.scope.until}
            height={260}
          />
          {/* The standing caption (§5.4), beside the dataset's own note rather
              than merged into it — two authors, two sentences. */}
          <p className="mp-chart-note">{copy.metricPage.seriesStandingCaption}</p>
        </>
      ) : (
        /* Absence is never silent: a metric with no series says so (§0.1, §4.3). */
        <p className="mp-prose mp-prose--small">{copy.metricPage.seriesNone}</p>
      )}
    </section>
  );
}

/* -------------------------------------------------------- cross-scope strip */

interface PeerScope {
  key: ScopeKey;
  label: string;
  target: ScopeTarget;
}

/**
 * The scopes to set this reading beside (§5.4).
 *
 * Peers at the reader's own altitude: the other projects from a project, the
 * sibling repositories from a repository. The org has no peers, so it looks one
 * level down at its projects — the comparison that altitude actually invites.
 * This is scope comparison, which the product allows; it is never people (§0.1).
 */
function peerScopes(edition: Edition, scope: ResolvedScope): PeerScope[] {
  const asPeer = (key: ScopeKey, label: string): PeerScope => ({
    key,
    label,
    target: targetForKey(edition, key),
  });

  if (scope.summary.scope.level === "org")
    return edition.navigation.projects.map(project =>
      asPeer(project.key, project.label)
    );

  if (scope.summary.scope.level === "project")
    return edition.navigation.projects.map(project =>
      asPeer(project.key, project.label)
    );

  const parent = edition.navigation.projects.find(project =>
    project.repos.some(repo => repo.key === scope.key)
  );
  if (!parent) return [];
  return parent.repos.map(repo => asPeer(repo.key, repo.label));
}

function CrossScopeStrip({
  edition,
  scope,
  metricId,
}: {
  edition: Edition;
  scope: ResolvedScope;
  metricId: string;
}) {
  const peers = peerScopes(edition, scope);
  if (peers.length === 0) return null;

  const caption =
    scope.summary.scope.level === "org"
      ? copy.metricPage.crossScopeCaptionOrg
      : copy.metricPage.crossScopeCaptionPeers;

  return (
    <section className="mp-panel">
      <h2>{copy.metricPage.crossScopeHeading}</h2>
      <p className="mp-prose mp-prose--small">{caption}</p>
      <div className="mp-scopes">
        {peers.map(peer => (
          <PeerCard
            key={peer.key}
            peer={peer}
            metricId={metricId}
            summary={edition.scopeSummaries[peer.key]?.metrics.find(
              row => row.id === metricId
            )}
            current={peer.key === scope.key}
          />
        ))}
      </div>
    </section>
  );
}

function PeerCard({
  peer,
  metricId,
  summary,
  current,
}: {
  peer: PeerScope;
  metricId: string;
  summary: MetricSummary | undefined;
  current: boolean;
}) {
  const body = (
    <>
      <span className="mp-scope-card__label">{peer.label}</span>
      <span className="mp-scope-card__value">
        {summary ? (
          summary.isNA ? (
            /* §6.4 owns what an absent reading looks like, summaries included —
               C3's component takes a summary row and states the coverage the
               reading was attempted over, since a summary carries no caveat to
               quote. The full reason is on the page this card links to. */
            <NotAvailable metric={summary} size="chip" />
          ) : (
            <FloorFigure display={summary.display} metricId={metricId} />
          )
        ) : (
          /* Not an absent *reading* but an absent row: this edition publishes all
             57 at all 10 scopes, so this is a guard, and it says which it is. */
          <span className="mp-scope-card__absent">
            {copy.metricPage.crossScopeAbsent}
          </span>
        )}
        {summary && (
          <span
            className="mp-scope-card__dot"
            data-tier={summary.tier}
            aria-hidden="true"
          />
        )}
      </span>
      {current && (
        <span className="mp-scope-card__here">{copy.metricPage.crossScopeHere}</span>
      )}
    </>
  );

  if (current)
    return (
      <div className="mp-scope-card" data-current="true" aria-current="page">
        {body}
      </div>
    );

  return (
    <Link
      className="mp-scope-card"
      href={scopeTabPath(peer.target, "metrics", metricId)}
      aria-label={copy.fill(copy.metricPage.crossScopeOpen, { label: peer.label })}
    >
      {body}
    </Link>
  );
}

/* ------------------------------------------------------------- findings */

/** §5.4 — the rules that fired on this metric, restated, above the columns. */
function Findings({
  edition,
  scope,
  metricId,
}: {
  edition: Edition;
  scope: ResolvedScope;
  metricId: string;
}) {
  const hits = scope.summary.subtreeFindingIndices
    .map(index => edition.headlines[index])
    .filter((headline): headline is Headline => Boolean(headline))
    .filter(headline => headline.metric_id === metricId);

  if (hits.length === 0) return null;

  return (
    <>
      {hits.map(headline => {
        const elsewhere = headline.scope_key !== scope.key;
        const target = targetForKey(edition, headline.scope_key);
        const scopeLabel =
          edition.scopeSummaries[headline.scope_key]?.scope.label ??
          headline.scope_key;

        return (
          <section
            className="mp-finding"
            key={`${headline.scope_key}-${headline.title}`}
            data-severity={headline.severity}
          >
            <div className="mp-finding__top">
              <span className="mp-sev" data-severity={headline.severity}>
                {copy.severity[headline.severity]}
              </span>
              <span className="mp-finding__rule">
                {copy.fill(copy.metricPage.findingRule, {
                  metric: headline.metric_id,
                  comparison: headline.rule_comparison,
                  threshold: headline.rule_threshold,
                  value: headline.value_display,
                })}
              </span>
            </div>
            <h2>{headline.title}</h2>
            <p>{headline.detail}</p>
            {elsewhere && (
              <Link className="quiet-button" href={scopeTabPath(target, "metrics", metricId)}>
                {copy.fill(copy.metricPage.findingOpenScope, { label: scopeLabel })}
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            )}
          </section>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------- not found */

/** §5.4 — "not-found variant listing the family's metric ids". */
function UnknownMetric({
  edition,
  scope,
  metricId,
}: {
  edition: Edition;
  scope: ResolvedScope;
  metricId: string;
}) {
  const familyKey = metricId.split(".")[0];
  const family = edition.glossary.families[familyKey];
  const ids = family ? family.metric_ids : [];

  return (
    <PageFrame eyebrow={copy.metrics.eyebrow} title={copy.metricPage.unknownTitle}>
      <section className="state-panel">
        <h2>
          {family
            ? copy.fill(copy.metricPage.unknownBody, {
                metricId,
                family: family.label,
              })
            : copy.fill(copy.metricPage.unknownBodyNoFamily, {
                metricId,
                count: edition.metricCatalog.length,
              })}
        </h2>
        {ids.length > 0 && (
          <div className="state-links">
            {ids.map(id => (
              <Link key={id} href={scopeTabPath(scope.target, "metrics", id)}>
                {id}
              </Link>
            ))}
          </div>
        )}
        <div className="state-actions">
          <Link className="primary-button" href={scopeTabPath(scope.target, "metrics")}>
            {copy.metricPage.unknownOpenIndex}
          </Link>
        </div>
      </section>
    </PageFrame>
  );
}

/* --------------------------------------------------------------- states */

function DetailSkeleton() {
  return (
    <div className="mp-columns" aria-busy="true" aria-label={copy.metricPage.loading}>
      <div className="mp-column">
        {[0, 1, 2].map(block => (
          <div
            className="skeleton-block"
            key={block}
            style={{ height: block === 2 ? 240 : 118, borderRadius: 9, marginTop: block === 0 ? 0 : 14 }}
          />
        ))}
      </div>
      <div className="mp-column">
        <div className="skeleton-block" style={{ height: 520, borderRadius: 9 }} />
      </div>
    </div>
  );
}

function DetailError({ reason, onRetry }: { reason: string; onRetry: () => void }) {
  return (
    <section className="mx-panel-error" role="alert">
      <h2>{copy.metricPage.errorTitle}</h2>
      <p>{copy.metricPage.errorBody}</p>
      {reason && <code>{reason}</code>}
      <div>
        <button type="button" className="primary-button" onClick={onRetry}>
          <RotateCw size={14} aria-hidden="true" />
          {copy.metricPage.errorRetry}
        </button>
      </div>
    </section>
  );
}
