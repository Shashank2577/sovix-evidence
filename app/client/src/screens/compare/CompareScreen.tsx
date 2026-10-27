/**
 * Compare — `/compare?scopes=a,b,c` (SPEC §5.7, §1.5, §7.4, §10.6).
 *
 * Two or three scopes as columns, for a decision meeting. It compares *scopes*.
 * There is no contributor column here and no route to one (§1.4).
 *
 * **Compare is desktop-only, and that is a designed refusal rather than a gap.**
 * At 390px three numeric columns are below legibility, and a version that folded
 * them into a list would have stopped being a comparison while still calling
 * itself one. §1.5 puts an explanation card on the route instead, with links to
 * the scopes the URL named — each scope's own overview carries the same figures,
 * and those screens work at that width.
 *
 * Every column loads its own scope file, so a cell renders the scope's real
 * `Metric` — its display string, its tier, and the working behind it. One
 * column failing is a column-level error with its own retry; the others render
 * (§5.7).
 */

import { AlertTriangle, Hash, Plus, RotateCw, X } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";

import { scopeTabPath } from "@/app/routes";
import { initialsFor, repoTint, targetForKey } from "@/app/scope";
import { useIsMobileShell } from "@/app/useAppRoute";
import { NotAvailable, TierBadge } from "@/components/integrity";
import {
  useScope,
  type AsyncResource,
  type Edition,
  type FamilyGloss,
  type Metric,
  type ScopeKey,
  type ScopeReport,
  type ScopeSlug,
} from "@/data";
import { formatLongDay } from "@/shell/format";
import * as copy from "@/copy";

import { CompareWorkingHost } from "./CompareWorkingHost";
import { largestGaps, type GapColumn } from "./gaps";
import { ScopeSlotPicker } from "./ScopeSlotPicker";
import {
  compareHref,
  MAX_SLOTS,
  MIN_SLOTS,
  readCompareWorking,
  readScopeSlugs,
  withoutSlot,
  withSlot,
} from "./slots";
import "./compare.css";

interface Column {
  slug: ScopeSlug;
  /** `null` when the URL named a slug this edition does not publish. */
  key: ScopeKey | null;
  label: string;
  report: AsyncResource<ScopeReport>;
  metrics: Map<string, Metric>;
}

export function CompareScreen({ edition }: { edition: Edition }) {
  const search = useSearch();
  const [, navigate] = useLocation();
  const isMobile = useIsMobileShell();

  const slugs = useMemo(() => readScopeSlugs(search), [search]);
  const keys = slugs.map(slug => edition.keyBySlug[slug] ?? null);

  /*
   * Three fixed slots rather than a loop: hooks cannot be called conditionally,
   * and §5.7 caps the screen at three columns anyway. A slot with no scope
   * passes `null`, which `useScope` answers without a fetch.
   *
   * On mobile no column is loaded at all — the explanation card replaces the
   * comparison, so fetching three scope files to render a sentence would be
   * downloading evidence nobody is going to be shown (§1.5).
   */
  const wanted = isMobile ? [null, null, null] : slotSlugs(slugs, keys);
  const reports = [
    useScope(wanted[0]),
    useScope(wanted[1]),
    useScope(wanted[2]),
  ];

  const columns: Column[] = slugs.map((slug, index) => ({
    slug,
    key: keys[index],
    label: keys[index]
      ? (edition.scopeSummaries[keys[index]!]?.scope.label ?? slug)
      : slug,
    report: reports[index],
    metrics: new Map(
      (keys[index] ? reports[index].data?.metrics : undefined)?.map(metric => [
        metric.id,
        metric,
      ]) ?? []
    ),
  }));

  const setSlugs = (next: ScopeSlug[]) => navigate(compareHref(next));

  const working = useMemo(() => readCompareWorking(search), [search]);
  const workingColumn = working
    ? columns.find(column => column.slug === working.scopeSlug)
    : undefined;

  return (
    <div className="content-wrap">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" aria-hidden="true" />
            {`Snapshot · ${formatLongDay(edition.generated_at)}`}
          </div>
          <h1>
            {copy.compare.title}
            <span className="title-period">.</span>
          </h1>
          {/* The mobile card carries the explanation in full; a lede repeating it
              would put the same paragraph on screen twice. */}
          {!isMobile && <p className="heading-lede">{copy.compare.lede}</p>}
        </div>
      </div>

      {isMobile ? (
        <MobileExplanation edition={edition} columns={columns} />
      ) : (
        <>
          <SlotRow
            edition={edition}
            columns={columns}
            onChange={(index, slug) => setSlugs(withSlot(slugs, index, slug))}
            onRemove={index => setSlugs(withoutSlot(slugs, index))}
            onAdd={slug => setSlugs([...slugs, slug])}
          />

          {columns.length < MIN_SLOTS ? (
            <section className="state-panel cmp-empty">
              <h2>{copy.compare.emptyTitle}</h2>
              <p>{copy.compare.emptyBody}</p>
            </section>
          ) : (
            <>
              <GapStrip columns={columns} />
              <CompareTable
                edition={edition}
                columns={columns}
                slugs={slugs}
                workingMetricId={working?.metricId ?? null}
              />
            </>
          )}
        </>
      )}

      {/* §5.7: the ⌗ opens the working scoped to the column it was clicked in. */}
      {!isMobile && working && workingColumn?.key && (
        <CompareWorkingHost
          edition={edition}
          metric={workingColumn.metrics.get(working.metricId)}
          metricId={working.metricId}
          scopeKey={workingColumn.key}
          onClose={() => navigate(compareHref(slugs))}
        />
      )}
    </div>
  );
}

/** Slot slugs padded to three, with unknown slugs left unfetched. */
function slotSlugs(
  slugs: ScopeSlug[],
  keys: (ScopeKey | null)[]
): (ScopeSlug | null)[] {
  return [0, 1, 2].map(index =>
    keys[index] ? (slugs[index] ?? null) : null
  );
}

/* ------------------------------------------------------------ slot row */

function SlotRow({
  edition,
  columns,
  onChange,
  onRemove,
  onAdd,
}: {
  edition: Edition;
  columns: Column[];
  onChange: (index: number, slug: ScopeSlug) => void;
  onRemove: (index: number) => void;
  onAdd: (slug: ScopeSlug) => void;
}) {
  const takenKeys = columns
    .map(column => column.key)
    .filter((key): key is ScopeKey => key !== null);

  const firstFree = edition.scopeOrder.find(key => !takenKeys.includes(key));

  return (
    <div className="cmp-slots">
      {columns.map((column, index) => (
        <div className="cmp-slot" key={`${column.slug}-${index}`}>
          <span className="cmp-slot__label">
            {copy.fill(copy.compare.slotLabel, { index: index + 1 })}
          </span>
          <div className="cmp-slot__controls">
            <ScopeSlotPicker
              edition={edition}
              index={index + 1}
              currentKey={column.key}
              takenKeys={takenKeys}
              onChoose={slug => onChange(index, slug)}
            >
              <span
                className="scope-avatar"
                style={{
                  background: column.key
                    ? repoTint(column.label)
                    : "var(--ornament)",
                }}
                aria-hidden="true"
              >
                {column.key ? initialsFor(column.label) : "··"}
              </span>
              <span className="cmp-slot__name">{column.label}</span>
            </ScopeSlotPicker>

            {/* Removing below two columns is allowed: the instruction card is a
                better answer than a comparison of one. */}
            <button
              type="button"
              className="icon-button cmp-slot__remove"
              onClick={() => onRemove(index)}
              aria-label={copy.fill(copy.compare.slotRemove, {
                index: index + 1,
              })}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
          {column.key === null && (
            <p className="cmp-slot__unknown">
              {copy.fill(copy.compare.unknownSlotBody, { slug: column.slug })}
            </p>
          )}
        </div>
      ))}

      {columns.length < MAX_SLOTS && firstFree && (
        <button
          type="button"
          className="cmp-slot__add"
          onClick={() => onAdd(edition.slugByKey[firstFree])}
        >
          <Plus size={14} aria-hidden="true" />
          {copy.compare.slotAdd}
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- gaps strip */

function GapStrip({ columns }: { columns: Column[] }) {
  const ready = columns.filter(
    column => column.key !== null && column.report.status === "ready"
  );

  const gaps = useMemo(() => {
    if (ready.length < MIN_SLOTS) return [];
    const inputs: GapColumn[] = ready.map(column => ({
      scopeKey: column.key!,
      scopeLabel: column.label,
      metrics: column.report.data?.metrics ?? [],
    }));
    return largestGaps(inputs);
  }, [ready]);

  if (ready.length < MIN_SLOTS) return null;

  return (
    <section className="cmp-gaps">
      <div className="section-kicker">{copy.compare.gapsHeading}</div>
      <p className="cmp-gaps__caption">{copy.compare.gapsCaption}</p>
      {gaps.length === 0 ? (
        <p className="cmp-gaps__none">{copy.compare.gapsNone}</p>
      ) : (
        <ul className="cmp-gaps__list">
          {gaps.map(gap => (
            <li className="cmp-gap" key={gap.metricId}>
              <span className="cmp-gap__label">{gap.label}</span>
              <span className="cmp-gap__ends">
                <span className="cmp-gap__end">
                  {copy.fill(copy.compare.gapExtreme, {
                    label: gap.low.scopeLabel,
                    display: gap.low.display,
                  })}
                </span>
                <span className="cmp-gap__end">
                  {copy.fill(copy.compare.gapExtreme, {
                    label: gap.high.scopeLabel,
                    display: gap.high.display,
                  })}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* --------------------------------------------------------------- table */

function CompareTable({
  edition,
  columns,
  slugs,
  workingMetricId,
}: {
  edition: Edition;
  columns: Column[];
  slugs: ScopeSlug[];
  workingMetricId: string | null;
}) {
  const families = Object.entries(edition.glossary.families);
  const allReady = columns.every(
    column => column.key !== null && column.report.status === "ready"
  );

  return (
    <div
      className="cmp-table"
      style={{ ["--cmp-columns" as string]: columns.length }}
    >
      <div className="cmp-head" role="presentation">
        <span className="cmp-head__metric">{copy.compare.metricColumn}</span>
        {columns.map((column, index) => (
          <ColumnHead key={`${column.slug}-${index}`} column={column} />
        ))}
      </div>

      {families.map(([familyId, family]) => (
        <FamilySection
          key={familyId}
          family={family}
          columns={columns}
          slugs={slugs}
          allReady={allReady}
          workingMetricId={workingMetricId}
        />
      ))}
    </div>
  );
}

function ColumnHead({ column }: { column: Column }) {
  const failed = column.key !== null && column.report.status === "error";

  return (
    <div
      className="cmp-head__column"
      aria-label={copy.fill(copy.compare.columnAria, { label: column.label })}
    >
      <span className="cmp-head__name">{column.label}</span>
      {failed && (
        <span className="cmp-head__error">
          <AlertTriangle size={12} aria-hidden="true" />
          {copy.compare.columnErrorTitle}
          <button
            type="button"
            className="cmp-head__retry"
            onClick={column.report.retry}
          >
            <RotateCw size={11} aria-hidden="true" />
            {copy.compare.columnRetry}
          </button>
        </span>
      )}
      {column.key !== null && column.report.status === "loading" && (
        <span className="cmp-head__loading">{copy.compare.columnLoading}</span>
      )}
    </div>
  );
}

function FamilySection({
  family,
  columns,
  slugs,
  allReady,
  workingMetricId,
}: {
  family: FamilyGloss;
  columns: Column[];
  slugs: ScopeSlug[];
  allReady: boolean;
  workingMetricId: string | null;
}) {
  /*
   * §5.7: rows where every selected scope is NA collapse behind a per-family
   * disclosure. The split is only made once every column has answered — until
   * then "all NA" is a statement about what has loaded, not about the scopes,
   * and hiding a row on that basis would be hiding it for the wrong reason.
   */
  const present: string[] = [];
  const absent: string[] = [];
  for (const metricId of family.metric_ids) {
    const readings = columns.map(column => column.metrics.get(metricId));
    const allNA =
      allReady && readings.every(reading => !reading || reading.isNA);
    (allNA ? absent : present).push(metricId);
  }

  return (
    <section className="cmp-family">
      <div className="cmp-family__head">
        <h3>{family.label}</h3>
        {/* The dataset's own blurb, verbatim (§9.8). */}
        <p>{family.blurb}</p>
      </div>

      {present.map(metricId => (
        <CompareRow
          key={metricId}
          metricId={metricId}
          columns={columns}
          slugs={slugs}
          workingMetricId={workingMetricId}
        />
      ))}

      {absent.length > 0 && (
        <details className="cmp-absent">
          <summary>
            {copy.fill(copy.compare.naDisclosure, { count: absent.length })}
          </summary>
          <div className="cmp-absent__rows">
            {absent.map(metricId => (
              <CompareRow
                key={metricId}
                metricId={metricId}
                columns={columns}
                slugs={slugs}
                workingMetricId={workingMetricId}
              />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

function CompareRow({
  metricId,
  columns,
  slugs,
  workingMetricId,
}: {
  metricId: string;
  columns: Column[];
  slugs: ScopeSlug[];
  workingMetricId: string | null;
}) {
  /* Every column publishes the same 57 metrics, so the label is the same in all
     of them; the first column that has loaded supplies it. */
  const label =
    columns.map(column => column.metrics.get(metricId)?.label).find(Boolean) ??
    metricId;

  return (
    <div className="cmp-row" role="row" data-open={workingMetricId === metricId}>
      <div className="cmp-row__metric" role="rowheader">
        <span className="cmp-row__label">{label}</span>
        <span className="cmp-row__id">{metricId}</span>
      </div>
      {columns.map((column, index) => (
        <ValueCell
          key={`${column.slug}-${index}`}
          column={column}
          metricId={metricId}
          slugs={slugs}
        />
      ))}
    </div>
  );
}

function ValueCell({
  column,
  metricId,
  slugs,
}: {
  column: Column;
  metricId: string;
  slugs: ScopeSlug[];
}) {
  const metric = column.metrics.get(metricId);

  if (!metric) {
    /* Loading, failed, or a slug this edition does not publish. The column head
       already says which; an empty cell under a stated reason is honest, and a
       placeholder figure here would not be. */
    return (
      <div className="cmp-cell cmp-cell--pending" role="cell">
        <span className="sr-only">{copy.compare.cellPending}</span>
        {column.report.status === "loading" && column.key !== null && (
          <span className="cmp-cell__skeleton" aria-hidden="true" />
        )}
      </div>
    );
  }

  return (
    <div className="cmp-cell" role="cell">
      {metric.isNA ? (
        <NotAvailable metric={metric} size="chip" />
      ) : (
        <span className="cmp-cell__value">{metric.display}</span>
      )}
      <span className="cmp-cell__meta">
        <TierBadge tier={metric.tier} confidence={metric.confidence} compact />
        <Link
          className="wk-trigger wk-trigger--icon"
          href={compareHref(slugs, { metricId, scopeSlug: column.slug })}
          aria-label={copy.fill(copy.working.triggerAria, {
            label: `${metric.label} · ${column.label}`,
          })}
        >
          <Hash size={13} strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------- mobile */

/**
 * §1.5, §10.6. The route exists at 390px; the comparison does not. The card says
 * so and hands the reader the scopes the URL named, whose own screens carry the
 * same figures and do work at this width.
 */
function MobileExplanation({
  edition,
  columns,
}: {
  edition: Edition;
  columns: Column[];
}) {
  const named = columns.filter(column => column.key !== null);

  return (
    <section className="state-panel cmp-mobile">
      <h2>{copy.compare.mobileTitle}</h2>
      <p>{copy.compare.mobileBody}</p>
      <p className="cmp-mobile__hint">{copy.compare.mobileLinks}</p>
      <div className="state-links">
        {(named.length > 0
          ? named.map(column => ({
              key: column.key!,
              label: column.label,
            }))
          : [
              {
                key: edition.root_scope,
                label: edition.navigation.org.label,
              },
            ]
        ).map(entry => (
          <Link
            key={entry.key}
            href={scopeTabPath(targetForKey(edition, entry.key), "metrics")}
          >
            {entry.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
