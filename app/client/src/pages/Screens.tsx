/**
 * Screen placeholders for chunk C2.
 *
 * C2 owns the shell and the route table; the screens themselves belong to
 * C6–C12. What each placeholder must prove is exactly what C2 is responsible
 * for: that the route resolved, that it resolved to the *right scope*, and
 * that the scope's identity survived the trip through the URL. So each one
 * states the scope it resolved to and shows a handful of that scope's facts
 * read from `edition.json` — no invented figures, and nothing a real screen
 * will have to un-say later.
 */

import { ArrowRight, Hammer, Layers3, RotateCw } from "lucide-react";
import { Link } from "wouter";

import {
  EVIDENCE_PATH,
  METHODOLOGY_PATH,
  TAB_LABELS,
  scopeTabPath,
  type RouteMatch,
  type TabId,
} from "@/app/routes";
import { scopeRows, type ResolvedScope } from "@/app/scope";
import { useWorkingMetricId } from "@/app/useAppRoute";
import type { Edition } from "@/data";
import { CompareScreen as Compare } from "@/screens/compare/CompareScreen";
import { FindingsScreen } from "@/screens/findings/FindingsScreen";
import { MetricDetail, MetricsIndex } from "@/screens/metrics";
import { RepositoriesScreen } from "@/screens/repositories/RepositoriesScreen";
import { formatCount, formatLongDay } from "@/shell/format";

import { Overview } from "./overview";
import { PageFrame } from "./PageFrame";
import { TrendsScreen } from "./Trends";

/* ------------------------------------------------------------ page frame */

export { PageFrame } from "./PageFrame";

function editionEyebrow(edition: Edition | undefined): string {
  return edition
    ? `Snapshot · ${formatLongDay(edition.generated_at)}`
    : "Snapshot";
}

function ChunkNote({ chunk, what }: { chunk: string; what: string }) {
  return (
    <span className="placeholder-chip">
      <Hammer size={11} aria-hidden="true" />
      {what} · chunk {chunk}
    </span>
  );
}

/* ------------------------------------------------------- scope placeholder */

const TAB_BLURB: Record<TabId, { chunk: string; what: string; lede: string }> =
  {
    overview: {
      chunk: "C6",
      what: "Overview",
      lede: "The height-appropriate read, with the strongest finding impossible to miss.",
    },
    findings: {
      chunk: "C8",
      what: "Findings",
      lede: "Every threshold that fired in this scope, with the rule that fired it.",
    },
    metrics: {
      chunk: "C7",
      what: "Metrics index",
      lede: "All 57 measurements at this altitude, each one tap from its working.",
    },
    trends: {
      chunk: "C10",
      what: "Trends",
      lede: "Nine monthly series, the work heatmap, and what changed either side of the split.",
    },
    repositories: {
      chunk: "C9",
      what: "Scope table",
      lede: "The repositories beneath this scope, grouped by project.",
    },
  };

export function ScopeScreen({
  edition,
  scope,
  tab,
  metricId,
}: {
  edition: Edition;
  scope: ResolvedScope;
  tab: TabId;
  metricId: string | null;
}) {
  const working = useWorkingMetricId();
  const blurb = TAB_BLURB[tab];
  const { facts } = scope.summary;

  /* C6 owns Overview — the org greeting, the project read, the repository's
     "Inside this repository", and the hero's empty variant. */
  if (tab === "overview") {
    return <Overview edition={edition} scope={scope} />;
  }

  /* C10 owns Trends; the placeholder below covers the tabs still to be built. */
  if (tab === "trends") {
    return <TrendsScreen edition={edition} scope={scope} />;
  }

  /* C7 owns both halves of the Metrics tab: the index of all 57, and one
     metric's own page when the route carries an id. */
  if (tab === "metrics") {
    return metricId ? (
      <MetricDetail edition={edition} scope={scope} metricId={metricId} />
    ) : (
      <MetricsIndex edition={edition} scope={scope} />
    );
  }

  /* Built screens take over their own tabs; the rest keep the C2 placeholder
     until their chunk lands. */
  if (tab === "findings")
    return <FindingsScreen edition={edition} scope={scope} />;
  if (tab === "repositories")
    return <RepositoriesScreen edition={edition} scope={scope} />;

  return (
    <PageFrame
      eyebrow={editionEyebrow(edition)}
      title={`${scope.label} — ${TAB_LABELS[tab]}`}
      lede={blurb.lede}
    >
      <section className="placeholder-panel">
        <div className="section-kicker">Scope resolved</div>
        <h3>{scope.label}</h3>
        <p>
          Route <code>{scope.path}</code> resolved to scope key{" "}
          <code>{scope.key}</code> ({scope.summary.scope.level}). This screen's
          body is built elsewhere; the shell, the route and the scope around it
          are real.
        </p>
        <div className="placeholder-facts">
          <div>
            <strong>{formatCount(facts.commits)}</strong>
            <small>commits</small>
          </div>
          <div>
            <strong>{formatCount(facts.pull_requests)}</strong>
            <small>pull requests</small>
          </div>
          <div>
            <strong>{formatCount(facts.contributors)}</strong>
            <small>contributors</small>
          </div>
          <div>
            <strong>{formatCount(scope.summary.metrics.length)}</strong>
            <small>metrics published</small>
          </div>
          <div>
            <strong>
              {formatCount(scope.summary.subtreeFindingIndices.length)}
            </strong>
            <small>findings in subtree</small>
          </div>
        </div>
        <ChunkNote chunk={blurb.chunk} what={blurb.what} />
        {working && <WorkingNote metricId={working} />}
      </section>
    </PageFrame>
  );
}

/**
 * The `?working=` param is C5's to act on. C2's job is that it survives
 * navigation and round-trips through the URL, so the placeholder says what it
 * is holding rather than swallowing it.
 */
function WorkingNote({ metricId }: { metricId: string }) {
  return (
    <p style={{ marginTop: 14 }}>
      <span className="placeholder-chip">
        <ArrowRight size={11} aria-hidden="true" />
        working drawer requested · {metricId}
      </span>
    </p>
  );
}

/* --------------------------------------------------- edition-level screens */

/** C9 owns this screen; the route table still reaches it through this name. */
export function CompareScreen({ edition }: { edition: Edition }) {
  return <Compare edition={edition} />;
}

/* Evidence index and record (§5.8, §5.9) live in `@/components/evidence`; the
   route table reaches them directly from `App.tsx` — C11. */

export { MethodologyScreen } from "./Methodology";
/* ----------------------------------------------------------- not found &c */

/** SPEC §5.12 — the route itself is unknown. */
export function RouteNotFound({ edition }: { edition: Edition | undefined }) {
  return (
    <PageFrame
      eyebrow={editionEyebrow(edition)}
      title="This page isn't in the edition"
      lede="The address exists, but this build publishes nothing at it."
    >
      <section className="state-panel">
        <h2>No screen answers to that address.</h2>
        <p>
          Every screen in this edition is reachable from the navigation, or by
          name from the command palette — press <kbd>⌘</kbd> <kbd>K</kbd>.
        </p>
        <div className="state-actions">
          <Link href="/" className="primary-button">
            Go to the overview
          </Link>
          <Link href={EVIDENCE_PATH} className="quiet-button">
            Evidence index
          </Link>
          <Link href={METHODOLOGY_PATH} className="quiet-button">
            Methodology
          </Link>
        </div>
      </section>
    </PageFrame>
  );
}

/** SPEC §4.2 — the route shape is fine; this edition has no such scope. */
export function ScopeNotFound({
  edition,
  match,
}: {
  edition: Edition;
  match: Extract<RouteMatch, { kind: "scope" }>;
}) {
  const asked =
    match.target.level === "repo"
      ? `${match.target.owner}/${match.target.name}`
      : (match.target.slug ?? "—");

  return (
    <PageFrame
      eyebrow={editionEyebrow(edition)}
      title="This scope isn't in this edition"
      lede={`Nothing named ${asked} was collected for the ${formatLongDay(edition.generated_at)} edition.`}
    >
      <section className="state-panel">
        <h2>The edition publishes {scopeRows(edition).length} scopes.</h2>
        <p>
          Editions are immutable, so a scope that is absent here will stay
          absent here. These are the ones this edition does carry:
        </p>
        <div className="state-links">
          {scopeRows(edition).map(row => (
            <Link key={row.key} href={scopeTabPath(row.target, match.tab)}>
              <Layers3 size={14} aria-hidden="true" />
              {row.label}
            </Link>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}

/** SPEC §4.2 — `edition.json` itself failed. No cached figures are shown. */
export function EditionError({
  reason,
  onRetry,
}: {
  reason: string;
  onRetry: () => void;
}) {
  return (
    <PageFrame eyebrow="Snapshot" title="The edition didn't load">
      <section className="state-panel">
        <h2>The edition didn&rsquo;t load.</h2>
        <code className="state-reason">{reason}</code>
        <p>
          No figures are shown from an earlier visit. A number in this product
          is only ever the edition it came from, and we would rather show you
          nothing than something we cannot name the source of.
        </p>
        <div className="state-actions">
          <button className="primary-button" onClick={onRetry}>
            <RotateCw size={14} aria-hidden="true" />
            Retry
          </button>
        </div>
      </section>
    </PageFrame>
  );
}

/** Layout-shaped skeleton for the edition gate (SPEC §4.1). */
export function ShellSkeleton() {
  return (
    <div
      className="content-wrap"
      aria-busy="true"
      aria-label="Loading the edition"
    >
      <div className="skeleton-block" style={{ width: 190, height: 12 }} />
      <div
        className="skeleton-block"
        style={{ width: "min(420px, 70%)", height: 40, marginTop: 14 }}
      />
      <div
        className="skeleton-block"
        style={{ width: "min(560px, 90%)", height: 14, marginTop: 12 }}
      />
      <div
        className="skeleton-block"
        style={{ height: 242, marginTop: 28, borderRadius: 11 }}
      />
      <div className="metric-grid" style={{ marginTop: 28 }}>
        {[0, 1, 2, 3].map(index => (
          <div
            key={index}
            className="skeleton-block"
            style={{ height: 168, borderRadius: 9 }}
          />
        ))}
      </div>
    </div>
  );
}
