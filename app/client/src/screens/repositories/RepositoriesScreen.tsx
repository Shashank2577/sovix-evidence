/**
 * Repositories — `/repositories`, org and project (SPEC §5.6, §7.4, §10.6).
 *
 * "The CTO's twenty-at-once scan. Compares *scopes*, never people." Both halves
 * of that sentence are load-bearing:
 *
 *   - There is no contributor column here and no route to one (§1.4). The
 *     Contributors column counts the people who touched a repository; it is a
 *     property of the scope, and there is nothing to expand it into.
 *   - The Status column is a `StatusPill`, which derives its level from the
 *     findings that fired and takes no status prop (§6.15). It restates the
 *     rulebook. It is not a rating, and "healthy" means only "no rule fired".
 *
 * Three reflows, each from §7.4/§10.6 rather than invented here:
 *   - ≥781px: all six columns, the three metric columns sortable.
 *   - 511–780px: Repository · Review coverage · Status. Sorting is off — §10.6
 *     calls sorting a desk task, and a sort control that survived into a
 *     three-column view would be offering to reorder columns that aren't there.
 *   - ≤510px: cards, in the edition's own order.
 */

import { ArrowUpRight, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

import { comparePath } from "@/app/routes";
import { initialsFor, repoTint, type ResolvedScope } from "@/app/scope";
import { useIsMobileShell, useMediaQuery } from "@/app/useAppRoute";
import { CoverageBarCell, NotAvailable, StatusPill } from "@/components/integrity";
import type { Edition, MetricSummary } from "@/data";
import { formatCount, formatLongDay } from "@/shell/format";
import * as copy from "@/copy";

import {
  ariaSort,
  groupByProject,
  nextSort,
  repoRows,
  sortRows,
  type RepoRow,
  type SortColumn,
  type SortState,
} from "./rows";
import "./repositories.css";

const CARD_QUERY = "(max-width: 510px)";

const SORTABLE: { column: SortColumn; label: string }[] = [
  { column: "review", label: copy.repositories.colReview },
  { column: "lead", label: copy.repositories.colLeadTime },
  { column: "contributors", label: copy.repositories.colContributors },
];

export function RepositoriesScreen({
  edition,
  scope,
}: {
  edition: Edition;
  scope: ResolvedScope;
}) {
  const [sort, setSort] = useState<SortState | null>(null);
  const isMobile = useIsMobileShell();
  const asCards = useMediaQuery(CARD_QUERY);

  /* §10.6: no table sorting below 781px. A sort applied on a wide window and
     carried into a narrow one would leave the table in an order the reader can
     no longer see the reason for, so it is dropped at the boundary. */
  useEffect(() => {
    if (isMobile && sort !== null) setSort(null);
  }, [isMobile, sort]);

  const rows = useMemo(
    () => repoRows(edition, scope.key),
    [edition, scope.key]
  );
  const ordered = useMemo(() => sortRows(rows, sort), [rows, sort]);

  const projectCount =
    scope.summary.scope.level === "org"
      ? edition.navigation.projects.length
      : 1;

  const compareHref = comparePath(
    rows.slice(0, 2).map(row => edition.slugByKey[row.key] ?? "")
  );

  return (
    <div className="content-wrap">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" aria-hidden="true" />
            {`Snapshot · ${formatLongDay(edition.generated_at)}`}
          </div>
          <h1>
            {copy.repositories.title}
            <span className="title-period">.</span>
          </h1>
          <p className="heading-lede">
            {scope.summary.scope.level === "org"
              ? copy.fill(copy.repositories.ledeOrg, {
                  repos: formatCount(rows.length),
                  projects: formatCount(projectCount),
                })
              : copy.fill(copy.repositories.ledeProject, {
                  repos: formatCount(rows.length),
                  label: scope.label,
                })}
          </p>
        </div>

        {/* §5.6: hidden ≤780 — Compare does not exist there (§1.5). */}
        {!isMobile && rows.length >= 2 && (
          <div className="heading-actions">
            <Link
              className="quiet-button"
              href={compareHref}
              aria-label={copy.repositories.compareAria}
            >
              {copy.repositories.compare}
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <section className="state-panel rp-empty">
          <h2>{copy.repositories.empty}</h2>
          <p>{copy.repositories.emptyBody}</p>
        </section>
      ) : asCards ? (
        <RepoCards rows={ordered} />
      ) : (
        <>
          <div className="rp-toolbar">
            <p className="rp-toolbar__note">{copy.repositories.naSortNote}</p>
            {/* §5.6: the reset affordance appears only once the table is sorted. */}
            {sort !== null && (
              <button
                type="button"
                className="rp-reset"
                onClick={() => setSort(null)}
                aria-label={copy.repositories.resetOrderAria}
              >
                <RotateCcw size={12} aria-hidden="true" />
                {copy.repositories.resetOrder}
              </button>
            )}
          </div>
          <RepoTable
            rows={ordered}
            sort={sort}
            sortable={!isMobile}
            grouped={sort === null && scope.summary.scope.level === "org"}
            onSort={column => setSort(current => nextSort(current, column))}
          />
        </>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- table */

/**
 * An ARIA table rather than `<table>`: the row is a grid whose columns collapse
 * at each breakpoint, and the whole row is one link target. The roles carry the
 * semantics `<table>` would have — including `aria-sort` on the three sortable
 * headers — without fighting a table layout that has to become a card at 510px.
 */
function RepoTable({
  rows,
  sort,
  sortable,
  grouped,
  onSort,
}: {
  rows: RepoRow[];
  sort: SortState | null;
  sortable: boolean;
  /* Project subheads only survive the edition's own order: a table sorted across
     every repository has no project boundaries left to draw (§5.6). */
  grouped: boolean;
  onSort: (column: SortColumn) => void;
}) {
  const groups = grouped
    ? groupByProject(rows)
    : [{ key: "all", label: "", rows }];

  return (
    <div className="rp-table" role="table" aria-label={copy.repositories.title}>
      <div role="rowgroup">
        <div className="rp-row rp-row--head" role="row">
          <div role="columnheader" className="rp-cell rp-cell--repo">
            {copy.repositories.colRepository}
          </div>
          {SORTABLE.map(({ column, label }) => (
            <div
              key={column}
              role="columnheader"
              className={`rp-cell rp-cell--${column}`}
              aria-sort={sortable ? ariaSort(sort, column) : undefined}
            >
              {sortable ? (
                <button
                  type="button"
                  className="rp-sort"
                  data-active={sort?.column === column}
                  onClick={() => onSort(column)}
                  aria-label={sortLabel(sort, column, label)}
                >
                  {label}
                  <span className="rp-sort__glyph" aria-hidden="true">
                    {sort?.column === column
                      ? sort.direction === "asc"
                        ? "↑"
                        : "↓"
                      : "↕"}
                  </span>
                </button>
              ) : (
                label
              )}
            </div>
          ))}
          <div role="columnheader" className="rp-cell rp-cell--prs">
            {copy.repositories.colOpenPrs}
          </div>
          <div role="columnheader" className="rp-cell rp-cell--status">
            {copy.repositories.colStatus}
          </div>
        </div>
      </div>

      {groups.map(group => (
        <div role="rowgroup" key={group.key}>
          {group.label && (
            <div className="rp-row rp-row--subhead" role="row">
              <div role="cell" className="rp-subhead">
                {group.label}
                <span>
                  {formatCount(group.rows.length)}
                  {group.rows.length === 1 ? " repository" : " repositories"}
                </span>
              </div>
            </div>
          )}
          {group.rows.map(row => (
            <TableRow key={row.key} row={row} />
          ))}
        </div>
      ))}
    </div>
  );
}

function sortLabel(
  sort: SortState | null,
  column: SortColumn,
  label: string
): string {
  const active = sort?.column === column ? sort : null;
  if (active === null)
    return copy.fill(copy.repositories.sortAscending, { column: label });
  if (active.direction === "asc")
    return copy.fill(copy.repositories.sortDescending, { column: label });
  return copy.fill(copy.repositories.sortClear, { column: label });
}

function TableRow({ row }: { row: RepoRow }) {
  return (
    <div className="rp-row rp-row--body" role="row">
      <div role="cell" className="rp-cell rp-cell--repo">
        {/* The row's single link, stretched over the row by CSS. Everything
            interactive inside a later cell lifts itself above it. */}
        <Link
          className="rp-rowlink"
          href={row.path}
          aria-label={copy.fill(copy.repositories.rowAria, { label: row.label })}
        >
          <Avatar label={row.label} />
          <span className="rp-name">
            <strong>{row.label}</strong>
            <small>{row.projectLabel}</small>
          </span>
        </Link>
      </div>

      <div role="cell" className="rp-cell rp-cell--review">
        <Reading metric={row.metrics.review} withBar />
      </div>
      <div role="cell" className="rp-cell rp-cell--lead">
        <Reading metric={row.metrics.lead} />
      </div>
      <div role="cell" className="rp-cell rp-cell--contributors">
        <Reading metric={row.metrics.contributors} />
      </div>
      <div role="cell" className="rp-cell rp-cell--prs">
        <span className="rp-figure">{formatCount(row.openPullRequests)}</span>
      </div>
      <div role="cell" className="rp-cell rp-cell--status">
        <StatusPill headlines={row.headlines} />
      </div>
    </div>
  );
}

/**
 * One reading in a cell. A metric the scope does not publish renders the
 * `NotAvailable` chip with the reason the dataset gives — never a dash, never a
 * zero (§6.4).
 *
 * `withBar` is the Review coverage column (§5.6). **The bar draws the reading
 * beside it, not the sample's coverage.** Those are two different percentages,
 * and at fastapi they are 7.8% and 45%: a bar at 45% next to the figure 7.8%
 * would be two unlabelled quantities in one cell, with the larger one drawn.
 * Appendix A settles it — "range proof for coverage bars: 7.8% (fastapi) to
 * 99.3% (eslint)" are the review coverage readings. The bar is the figure.
 */
function Reading({
  metric,
  withBar = false,
}: {
  metric: MetricSummary | undefined;
  withBar?: boolean;
}) {
  /* A validated edition publishes all 57 metrics at every scope (§9.4), so a row
     the summary omits cannot occur here. Should one ever arrive, it is an absence
     like any other: words, never a zero and never a dash — and no reason, because
     we would not have one to state. */
  if (!metric) return <span className="rp-missing">{copy.notAvailable.label}</span>;
  if (metric.isNA) return <NotAvailable metric={metric} size="chip" />;
  if (withBar && typeof metric.value === "number")
    return (
      <CoverageBarCell
        coveragePct={metric.value}
        display={metric.display}
        width={46}
      />
    );
  return <span className="rp-figure">{metric.display}</span>;
}

function Avatar({ label }: { label: string }) {
  return (
    <span
      className="repo-avatar"
      style={{ background: repoTint(label) }}
      aria-hidden="true"
    >
      {initialsFor(label)}
    </span>
  );
}

/* ----------------------------------------------------------------- cards */

/** §7.4's ≤510px form. Navigation order, no sorting (§10.6). */
function RepoCards({ rows }: { rows: RepoRow[] }) {
  return (
    <div className="rp-cards">
      {rows.map(row => (
        <article className="rp-card" key={row.key}>
          <header className="rp-card__head">
            <Link
              className="rp-rowlink"
              href={row.path}
              aria-label={copy.fill(copy.repositories.rowAria, {
                label: row.label,
              })}
            >
              <Avatar label={row.label} />
              <span className="rp-name">
                <strong>{row.label}</strong>
                <small>{row.projectLabel}</small>
              </span>
            </Link>
            <StatusPill headlines={row.headlines} withFootnote={false} />
          </header>

          <div className="rp-card__coverage">
            <span className="rp-card__label">{copy.repositories.colReview}</span>
            <Reading metric={row.metrics.review} withBar />
          </div>

          <dl className="rp-card__facts">
            <div>
              <dt>{copy.repositories.colLeadTime}</dt>
              <dd>
                <Reading metric={row.metrics.lead} />
              </dd>
            </div>
            <div>
              <dt>{copy.repositories.colContributors}</dt>
              <dd>
                <Reading metric={row.metrics.contributors} />
              </dd>
            </div>
            <div>
              <dt>{copy.repositories.colOpenPrs}</dt>
              <dd>
                <span className="rp-figure">
                  {formatCount(row.openPullRequests)}
                </span>
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
