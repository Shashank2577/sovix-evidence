/**
 * The evidence index — `/evidence` (SPEC §5.8).
 *
 * The engineer's way in, and the bottom rung of the altitude ladder: every commit,
 * pull request, file, release, branch and collection that any figure in this edition
 * counted, listed as itself rather than as an input to something. Somebody searches
 * for their own pull request, finds it, and opens it — and the record tells them
 * every figure it was counted in and in what capacity.
 *
 * Three filters, all of them narrowing rather than ranking: there is no ordering
 * control on this screen and no "most cited first" default, because a list of
 * records sorted by how much they weigh is a leaderboard of the people who wrote
 * them (§0.1, §1.4). The order is the edition's own — the order the collector
 * emitted, repository by repository — and it does not move.
 */

import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";

import { EVIDENCE_PATH } from "@/app/routes";
import type { Edition, EvidenceIndex, SourceKind } from "@/data";
import { formatCount } from "@/shell/format";
import * as copy from "@/copy";

import { EvidenceRow, KIND_ICON } from "./EvidenceRow";
import {
  EMPTY_CONTROLS,
  KIND_ANY,
  REPO_ANY,
  REPO_NONE,
  controlsAreEmpty,
  filterRecords,
  kindCounts,
  parseCitationFilter,
  repoOptions,
  unattachedCount,
  type CitationFilter,
  type EvidenceControls,
} from "./filters";
import { KIND_ORDER, indexLede, kindLabel } from "./format";
import { useRowHeight, useWindowRows } from "./useWindowRows";

export interface EvidenceIndexScreenProps {
  edition: Edition;
  index: EvidenceIndex;
  /** `?metric=…&scope=…`, as the working drawer writes it (§5.10.8). */
  search: string;
}

export function EvidenceIndexScreen({
  edition,
  index,
  search,
}: EvidenceIndexScreenProps) {
  const [controls, setControls] = useState<EvidenceControls>(EMPTY_CONTROLS);

  const filter = useMemo(
    () => parseCitationFilter(search, edition),
    [search, edition]
  );

  const records = useMemo(
    () => filterRecords(index.records, controls, filter),
    [index.records, controls, filter]
  );
  const facets = useMemo(
    () => kindCounts(index.records, controls, filter),
    [index.records, controls, filter]
  );
  const repos = useMemo(
    () => repoOptions(index.records, edition),
    [index.records, edition]
  );
  const unattached = useMemo(
    () => unattachedCount(index.records),
    [index.records]
  );

  /* One clock for the whole list: 24 rows computing `Date.now()` independently
     would be 24 chances for two rows a pixel apart to disagree about "today". */
  const now = useMemo(() => Date.now(), []);

  const rowHeight = useRowHeight();
  const { listRef, range } = useWindowRows(records.length, rowHeight);

  /* Narrowing the list while scrolled deep into it leaves the reader looking at
     whatever happens to be at that offset now. Send them back to the top of the
     list — but only when they are actually below it, so typing in the search box
     with the controls on screen does not yank the page. */
  const previousCount = useRef(records.length);
  useEffect(() => {
    if (previousCount.current === records.length) return;
    previousCount.current = records.length;
    const element = listRef.current;
    if (!element) return;
    const top = element.getBoundingClientRect().top;
    if (top < 0) window.scrollTo({ top: window.scrollY + top, behavior: "auto" });
  }, [records.length, listRef]);

  const visible = records.slice(range.start, range.end);
  const showingAll = records.length === index.records.length;

  return (
    <>
      <CitationBanner filter={filter} />

      <div className="ev-controls">
        <div className="ev-search">
          <Search size={14} strokeWidth={2} aria-hidden="true" />
          <input
            type="search"
            value={controls.search}
            placeholder={copy.evidence.searchPlaceholder}
            aria-label={copy.evidence.searchLabel}
            onChange={event =>
              setControls(current => ({
                ...current,
                search: event.target.value,
              }))
            }
          />
          {controls.search !== "" && (
            <button
              type="button"
              className="ev-search__clear"
              aria-label={copy.evidence.searchClear}
              onClick={() =>
                setControls(current => ({ ...current, search: "" }))
              }
            >
              <X size={13} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="ev-facets">
          <div
            className="ev-chips"
            role="group"
            aria-label={copy.evidence.kindLegend}
          >
            <KindChip
              active={controls.kind === KIND_ANY}
              label={copy.evidence.kindAll}
              count={facets.total}
              onSelect={() =>
                setControls(current => ({ ...current, kind: KIND_ANY }))
              }
            />
            {KIND_ORDER.map(kind => (
              <KindChip
                key={kind}
                kind={kind}
                active={controls.kind === kind}
                label={kindLabel(kind, facets.byKind[kind] ?? 0)}
                count={facets.byKind[kind] ?? 0}
                onSelect={() => setControls(current => ({ ...current, kind }))}
              />
            ))}
          </div>

          <label className="ev-repo">
            <span className="filter-label">{copy.evidence.repoLabel}</span>
            <select
              value={controls.repo}
              onChange={event =>
                setControls(current => ({
                  ...current,
                  repo: event.target.value,
                }))
              }
            >
              <option value={REPO_ANY}>{copy.evidence.repoAll}</option>
              {repos.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} ({formatCount(option.count)})
                </option>
              ))}
              {unattached > 0 && (
                <option value={REPO_NONE}>
                  {copy.evidence.repoNone} ({formatCount(unattached)})
                </option>
              )}
            </select>
          </label>
        </div>

        <p className="ev-count" role="status">
          {showingAll
            ? copy.fill(copy.evidence.resultCountAll, {
                total: formatCount(index.records.length),
              })
            : copy.fill(copy.evidence.resultCount, {
                shown: formatCount(records.length),
                total: formatCount(index.records.length),
              })}
        </p>
      </div>

      {records.length === 0 ? (
        <EvidenceEmpty
          filter={filter}
          canClear={!controlsAreEmpty(controls)}
          onClear={() => setControls(EMPTY_CONTROLS)}
        />
      ) : (
        /*
         * The spacer carries the full height of every record, so the scrollbar
         * describes the real list; the inner window holds only the rows in view
         * and is translated into place. 1,104 rows are never mounted at once.
         */
        <div
          className="ev-list"
          ref={listRef}
          role="list"
          aria-label={copy.evidence.indexTitle}
          style={{ height: records.length * rowHeight }}
        >
          <div
            className="ev-list__window"
            style={{ transform: `translateY(${range.start * rowHeight}px)` }}
          >
            {visible.map((record, offset) => (
              <EvidenceRow
                key={record.id}
                record={record}
                height={rowHeight}
                position={range.start + offset + 1}
                setSize={records.length}
                now={now}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- controls */

function KindChip({
  kind,
  active,
  label,
  count,
  onSelect,
}: {
  kind?: SourceKind;
  active: boolean;
  label: string;
  count: number;
  onSelect: () => void;
}) {
  const Icon = kind ? KIND_ICON[kind] : null;
  return (
    <button
      type="button"
      className="ev-chip"
      aria-pressed={active}
      data-active={active}
      onClick={onSelect}
    >
      {Icon && <Icon size={12} strokeWidth={1.9} />}
      <span>{label}</span>
      <span className="ev-chip__count">{formatCount(count)}</span>
    </button>
  );
}

/**
 * The banner for a link that arrived from a working drawer (§5.10.8).
 *
 * It names both halves of the claim — the metric and the scope — because "records
 * counted in review coverage" is true of four different samples in this edition, and
 * a reader who cannot see which one is looking at the wrong number's evidence.
 */
function CitationBanner({ filter }: { filter: CitationFilter }) {
  if (filter.kind === "none") return null;

  if (filter.kind === "unknown-metric" || filter.kind === "unknown-scope") {
    return (
      <aside className="ev-banner ev-banner--absent">
        <p>
          {filter.kind === "unknown-metric"
            ? copy.fill(copy.evidence.filterUnknownMetric, {
                metricId: filter.metricId,
              })
            : copy.fill(copy.evidence.filterUnknownScope, {
                scope: filter.scopeSlug,
              })}
        </p>
        <Link href={EVIDENCE_PATH} className="quiet-button">
          {copy.evidence.filterClear}
        </Link>
      </aside>
    );
  }

  return (
    <aside className="ev-banner">
      <div>
        <span className="section-kicker">{copy.evidence.filterKicker}</span>
        <p>
          <strong>
            {copy.fill(copy.evidence.filterHeading, {
              metric: filter.metricLabel,
            })}
          </strong>{" "}
          {copy.fill(copy.evidence.filterScope, { scope: filter.scopeLabel })}
        </p>
      </div>
      <Link href={EVIDENCE_PATH} className="quiet-button">
        {copy.evidence.filterClear}
      </Link>
    </aside>
  );
}

/** §5.8 empty: "No records match." plus the way back. */
function EvidenceEmpty({
  filter,
  canClear,
  onClear,
}: {
  filter: CitationFilter;
  canClear: boolean;
  onClear: () => void;
}) {
  return (
    <section className="state-panel">
      <h2>{copy.evidence.emptyTitle}</h2>
      <p>{copy.evidence.emptyBody}</p>
      <div className="state-actions">
        {canClear && (
          <button type="button" className="primary-button" onClick={onClear}>
            {copy.evidence.emptyClear}
          </button>
        )}
        {filter.kind !== "none" && (
          <Link href={EVIDENCE_PATH} className="quiet-button">
            {copy.evidence.filterClear}
          </Link>
        )}
      </div>
    </section>
  );
}
