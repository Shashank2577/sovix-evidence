/**
 * Metrics index — SPEC §5.3, §7.4.
 *
 * All 57 readings at one altitude, grouped into the edition's eight families. The
 * engineer's and the EM's map, and the screen where the product's promise has to
 * hold at its densest: every row carries its evidence tier and its sample, and
 * every row's working is one keystroke away without leaving the page.
 *
 * Three decisions worth stating, because each one was a fork:
 *
 *   - **No sort control.** Sorting 57 rows by value would produce a ranking, and a
 *     ranking of measurements is one short step from a ranking of the people who
 *     produced them (§0.1). The order is the edition's own, and it never changes.
 *   - **The row is a link, not a button.** ⌘-click, middle-click and "copy link
 *     address" all work, Enter follows it without a key handler, and the ⌗ in the
 *     value cell keeps its own tab stop above the row's stretched overlay (§5.3).
 *   - **The scope file, not the summaries.** §9.1 powers tables from
 *     `edition.json`'s summaries, but the Trend column needs the metric's own
 *     sparkline and the NA cells need the caveat that explains the absence —
 *     neither survives the summary. The file is the same one the drawer opens, so
 *     the second read is free.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { motion } from "framer-motion";
import { RotateCw, Search, X } from "lucide-react";
import { Link } from "wouter";

import { scopeTabPath } from "@/app/routes";
import type { ResolvedScope } from "@/app/scope";
import { Sparkline } from "@/components/charts";
import {
  CoverageBarCell,
  FloorFigure,
  NotAvailable,
  TierBadge,
} from "@/components/integrity";
import { WorkingTrigger } from "@/components/working";
import type { DataFetchError, Edition, Metric, ScopeReport, Tier } from "@/data";
import { useScope } from "@/data";
import { duration, ease, stagger } from "@/lib/motion";
import { PageFrame } from "@/pages/PageFrame";
import { formatCount, formatLongDay } from "@/shell/format";
import * as copy from "@/copy";

import "./metrics.css";

const TIERS: Tier[] = ["measured", "proxy", "inferred"];

/* The sticky top bar (§3.2) plus the sticky jump nav — what a family header has
   to clear when it is scrolled to, and what the active-pill observer measures
   against. The nav's own height is published as `--mx-strip-height`. */
const TOP_BAR_HEIGHT = 64;
const TOP_BAR_HEIGHT_MOBILE = 58;

interface FamilyGroup {
  key: string;
  label: string;
  blurb: string;
  metrics: Metric[];
}

/** Families in the edition's own order, carrying only the rows that survived the filter. */
function groupByFamily(
  report: ScopeReport,
  edition: Edition,
  keep: (metric: Metric) => boolean
): FamilyGroup[] {
  const groups: FamilyGroup[] = [];
  const byKey = new Map<string, FamilyGroup>();

  for (const metric of report.metrics) {
    let group = byKey.get(metric.family);
    if (!group) {
      const gloss = edition.glossary.families[metric.family];
      group = {
        key: metric.family,
        label: gloss?.label ?? metric.family,
        blurb: gloss?.blurb ?? "",
        metrics: [],
      };
      byKey.set(metric.family, group);
      groups.push(group);
    }
    if (keep(metric)) group.metrics.push(metric);
  }

  return groups;
}

/* ------------------------------------------------------------ the screen */

export function MetricsIndex({
  edition,
  scope,
}: {
  edition: Edition;
  scope: ResolvedScope;
}) {
  const report = useScope(scope.slug);

  const [query, setQuery] = useState("");
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [openLegend, setOpenLegend] = useState<Tier | null>(null);

  const total = edition.metricCatalog.length;
  const familyCount = Object.keys(edition.glossary.families).length;

  const needle = query.trim().toLowerCase();
  const keep = useCallback(
    (metric: Metric) => {
      if (tiers.length > 0 && !tiers.includes(metric.tier)) return false;
      if (needle === "") return true;
      return (
        metric.label.toLowerCase().includes(needle) ||
        metric.id.toLowerCase().includes(needle)
      );
    },
    [needle, tiers]
  );

  const groups = useMemo(
    () => (report.data ? groupByFamily(report.data, edition, keep) : []),
    [report.data, edition, keep]
  );
  const shown = groups.reduce((count, group) => count + group.metrics.length, 0);
  const filtered = needle !== "" || tiers.length > 0;

  const toggleTier = (tier: Tier) =>
    setTiers(current =>
      current.includes(tier)
        ? current.filter(value => value !== tier)
        : [...current, tier]
    );

  const clearFilters = () => {
    setQuery("");
    setTiers([]);
  };

  return (
    /* The shared page frame (eyebrow, Fraunces h1, lede), so this screen's
       heading cannot drift from the other five. The entrance animation belongs
       to the route transition around it (§8.3), not to each screen. */
    <PageFrame
      eyebrow={`Snapshot · ${formatLongDay(edition.generated_at)}`}
      title={copy.fill(copy.metrics.title, { count: total })}
      lede={copy.fill(copy.metrics.lede, {
        scope: scope.label,
        families: familyCount,
      })}
    >
      <TierLegend
        counts={scope.summary.tierCounts}
        legend={edition.data_quality.tier_legend}
        open={openLegend}
        onToggle={tier => setOpenLegend(current => (current === tier ? null : tier))}
      />

      <div className="mx-controls">
        <div className="mx-control-group mx-search-group">
          <label className="mx-control-label" htmlFor="mx-search">
            {copy.metrics.searchLabel}
          </label>
          <span className="mx-search">
            <Search size={13} aria-hidden="true" />
            <input
              id="mx-search"
              type="search"
              value={query}
              placeholder={copy.metrics.searchPlaceholder}
              onChange={event => setQuery(event.target.value)}
            />
            {query !== "" && (
              <button
                type="button"
                className="mx-search__clear"
                aria-label={copy.metrics.searchClear}
                onClick={() => setQuery("")}
              >
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </span>
        </div>

        <div className="mx-control-group">
          <span className="mx-control-label" id="mx-tier-label">
            {copy.metrics.tierFilterLabel}
          </span>
          <div className="mx-tier-filter" role="group" aria-labelledby="mx-tier-label">
            {TIERS.map(tier => (
              <button
                key={tier}
                type="button"
                className="mx-tier-chip"
                data-tier={tier}
                aria-pressed={tiers.includes(tier)}
                aria-label={copy.fill(copy.metrics.tierFilterAria, {
                  tier: copy.tier[tier],
                })}
                onClick={() => toggleTier(tier)}
              >
                <span className="mx-tier-chip__dot" aria-hidden="true" />
                {copy.tier[tier]}
                <span className="mx-tier-chip__tick" aria-hidden="true">
                  ✓
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {report.status === "error" && (
        <IndexError
          reason={(report.error as DataFetchError | undefined)?.message ?? ""}
          onRetry={report.retry}
        />
      )}

      {report.status === "loading" && <IndexSkeleton />}

      {report.status === "ready" && report.data && (
        <IndexBody
          groups={groups}
          scope={scope}
          edition={edition}
          shown={shown}
          total={total}
          filtered={filtered}
          onClear={clearFilters}
        />
      )}
    </PageFrame>
  );
}

/* ------------------------------------------------------------ the legend */

function TierLegend({
  counts,
  legend,
  open,
  onToggle,
}: {
  counts: Record<Tier, number>;
  legend: Record<Tier, string>;
  open: Tier | null;
  onToggle: (tier: Tier) => void;
}) {
  return (
    <div className="mx-legend">
      <span className="mx-legend__label">{copy.metrics.legendLabel}</span>
      {TIERS.map(tier => (
        <button
          key={tier}
          type="button"
          className="mx-legend__chip"
          data-tier={tier}
          aria-expanded={open === tier}
          onClick={() => onToggle(tier)}
        >
          {copy.tier[tier]}
          <span className="mx-legend__count">{counts[tier]}</span>
          <span className="sr-only">
            {open === tier
              ? copy.metrics.legendClose
              : copy.fill(copy.metrics.legendToggle, { tier: copy.tier[tier] })}
          </span>
        </button>
      ))}
      {/* Tap/click/keyboard, never hover: §0.1. The same sentences are on the
          Methodology screen, so nothing depends on finding this chip. */}
      {open && <p className="mx-legend__sentence">{legend[open]}</p>}
    </div>
  );
}

/* ------------------------------------------------------------- the table */

function IndexBody({
  groups,
  scope,
  edition,
  shown,
  total,
  filtered,
  onClear,
}: {
  groups: FamilyGroup[];
  scope: ResolvedScope;
  edition: Edition;
  shown: number;
  total: number;
  filtered: boolean;
  onClear: () => void;
}) {
  const populated = groups.filter(group => group.metrics.length > 0);
  const navRef = useRef<HTMLElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = useActiveFamily(populated.map(group => group.key), navRef);

  /* The jump strip wraps to two rows at 390px, so the sticky family headers
     cannot hardcode the offset they must clear. Measure it and publish it as a
     custom property the stylesheet reads (the CSS carries a sensible default, so
     a frame before the measurement lands is not a broken layout). */
  useEffect(() => {
    const strip = navRef.current;
    const root = rootRef.current;
    if (!strip || !root || typeof ResizeObserver === "undefined") return;
    const publish = () =>
      root.style.setProperty("--mx-strip-height", `${strip.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [populated.length]);

  const jumpTo = (key: string) => {
    const heading = document.getElementById(`mx-family-${key}`);
    if (!heading) return;
    heading.scrollIntoView({ block: "start", behavior: "auto" });
    /* Scrolling without moving focus would leave a keyboard reader where they
       were; the heading takes focus so the next Tab lands in that family. */
    heading.focus({ preventScroll: true });
  };

  return (
    <div ref={rootRef}>
      <nav
        className="mx-familynav"
        ref={navRef}
        aria-label={copy.metrics.familyNavLabel}
      >
        {populated.map(group => (
          <button
            key={group.key}
            type="button"
            className="mx-familynav__pill"
            aria-current={active === group.key ? "true" : undefined}
            /* The visible text shortens at 390px so eight pills pin in two rows
               instead of four; the accessible name stays the family's full
               label at every width. */
            aria-label={group.label}
            onClick={() => jumpTo(group.key)}
          >
            <span className="mx-familynav__full" aria-hidden="true">
              {group.label}
            </span>
            <span className="mx-familynav__short" aria-hidden="true">
              {group.label.split(" ")[0]}
            </span>
            <span className="mx-familynav__count">{group.metrics.length}</span>
          </button>
        ))}
      </nav>

      {populated.length === 0 ? (
        <div className="mx-empty" role="status">
          <h2>{copy.metrics.emptyTitle}</h2>
          <p>{copy.metrics.emptyBody}</p>
          <button type="button" className="primary-button" onClick={onClear}>
            {copy.metrics.clearFilters}
          </button>
        </div>
      ) : (
        <>
          {filtered && (
            <p className="mx-count" role="status">
              {copy.fill(copy.metrics.matchCount, { shown, total })}
            </p>
          )}
          {populated.map((group, index) => (
            <FamilySection
              key={group.key}
              group={group}
              scope={scope}
              edition={edition}
              index={index}
            />
          ))}
        </>
      )}
    </div>
  );
}

function FamilySection({
  group,
  scope,
  edition,
  index,
}: {
  group: FamilyGroup;
  scope: ResolvedScope;
  edition: Edition;
  index: number;
}) {
  return (
    <section className="mx-family" aria-labelledby={`mx-family-${group.key}`}>
      {/* Deliberately outside the animated container: a transformed ancestor is
          the classic way to break `position: sticky` (§7.4 makes these headers
          sticky at 390px). */}
      <header className="mx-family__header">
        <h2
          className="mx-family__title"
          id={`mx-family-${group.key}`}
          tabIndex={-1}
        >
          {group.label}
        </h2>
        {group.blurb && <p className="mx-family__blurb">{group.blurb}</p>}
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{
          duration: duration.slow,
          ease: ease.out,
          delay: Math.min(index, stagger.cap - 1) * stagger.section,
        }}
      >
        <table className="mx-table" role="table">
          <thead role="rowgroup">
            <tr role="row">
              <th role="columnheader" scope="col" className="mx-col-metric">
                {copy.metrics.columnMetric}
              </th>
              <th
                role="columnheader"
                scope="col"
                className="mx-col-value"
                style={{ width: 168 }}
              >
                {copy.metrics.columnValue}
              </th>
              <th
                role="columnheader"
                scope="col"
                className="mx-col-trend"
                style={{ width: 88 }}
              >
                {copy.metrics.columnTrend}
              </th>
              <th
                role="columnheader"
                scope="col"
                className="mx-col-tier"
                style={{ width: 150 }}
              >
                {copy.metrics.columnTier}
              </th>
              <th
                role="columnheader"
                scope="col"
                className="mx-col-sample"
                style={{ width: 190 }}
              >
                {copy.metrics.columnSample}
              </th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            {group.metrics.map(metric => (
              <MetricRow
                key={metric.id}
                metric={metric}
                scope={scope}
                tierLegend={edition.data_quality.tier_legend[metric.tier]}
              />
            ))}
          </tbody>
        </table>
      </motion.div>
    </section>
  );
}

function MetricRow({
  metric,
  scope,
  tierLegend,
}: {
  metric: Metric;
  scope: ResolvedScope;
  tierLegend: string;
}) {
  const href = scopeTabPath(scope.target, "metrics", metric.id);

  return (
    <tr className="mx-row" role="row" data-metric-id={metric.id}>
      <td role="cell" className="mx-cell-metric">
        <Link className="mx-row__link" href={href}>
          <span className="mx-row__label">{metric.label}</span>
          <span className="mx-row__id">{metric.id}</span>
        </Link>
      </td>

      <td role="cell" className="mx-cell-value">
        <span className="mx-value">
          {metric.isNA ? (
            <NotAvailable metric={metric} size="chip" />
          ) : (
            <FloorFigure
              display={metric.display}
              metricId={metric.id}
              className="mx-value__figure"
            />
          )}
          {/* Always visible, never hover-only (§5.3, §0.1); its own tab stop. */}
          <WorkingTrigger metricId={metric.id} label={metric.label} />
        </span>
      </td>

      <td role="cell" className="mx-cell-trend">
        <span className="mx-trend">
          {metric.sparkline ? (
            <Sparkline
              points={metric.sparkline}
              unit={metric.unit}
              label={metric.label}
              height={24}
            />
          ) : (
            /* Never an empty cell: coverage is meaningful for every metric (§5.3). */
            <CoverageBarCell coveragePct={metric.sample.coverage_pct} width={64} />
          )}
        </span>
      </td>

      <td role="cell" className="mx-cell-tier">
        <TierBadge
          tier={metric.tier}
          confidence={metric.confidence}
          legend={tierLegend}
        />
      </td>

      <td role="cell" className="mx-cell-sample">
        <span className="mx-sample mx-sample--full">
          {copy.fill(copy.metrics.sampleLine, {
            n: formatCount(metric.sample.n),
            population: formatCount(metric.sample.population),
            unit: metric.sample.unit,
          })}
        </span>
        {/* §7.4: at 390px the sample line becomes the coverage line. Same sample,
            the shape that fits the width. */}
        <span className="mx-sample mx-sample--coverage">
          {copy.fill(copy.metrics.coverageLine, {
            pct: Math.round(metric.sample.coverage_pct),
            unit: metric.sample.unit,
          })}
        </span>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------- active family pill */

/**
 * Which family the reader is currently inside (§5.3: "active pill tracks scroll
 * position"). An IntersectionObserver over the headings, with the top margin set
 * to the sticky chrome so a heading counts as reached when it reaches the chrome,
 * not when it reaches the viewport's true top.
 */
function useActiveFamily(
  keys: string[],
  navRef: RefObject<HTMLElement | null>
): string | null {
  const [active, setActive] = useState<string | null>(keys[0] ?? null);
  const signature = keys.join("|");

  useEffect(() => {
    if (keys.length === 0 || typeof IntersectionObserver === "undefined") return;
    const chrome =
      (window.innerWidth <= 780 ? TOP_BAR_HEIGHT_MOBILE : TOP_BAR_HEIGHT) +
      (navRef.current?.offsetHeight ?? 0);
    const seen = new Map<string, boolean>();

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const key = entry.target.id.replace("mx-family-", "");
          seen.set(key, entry.isIntersecting);
        }
        const current = keys.find(key => seen.get(key));
        if (current) {
          setActive(current);
          return;
        }
        /* Nothing is in the band: either the reader is above the first family or
           between two headings. The active pill is then the last heading that has
           already passed under the chrome — never, as a stray fallback, the last
           family in the list while the reader is still at the top of the page. */
        const passed = keys.filter(key => {
          const node = document.getElementById(`mx-family-${key}`);
          return node ? node.getBoundingClientRect().top < chrome + 8 : false;
        });
        setActive(passed.length > 0 ? passed[passed.length - 1] : keys[0]);
      },
      { rootMargin: `-${chrome + 8}px 0px -55% 0px`, threshold: 0 }
    );

    for (const key of keys) {
      const node = document.getElementById(`mx-family-${key}`);
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
    /* `signature` stands in for `keys`, which is a fresh array on every render:
       depending on the array itself would tear down and rebuild the observer
       after every keystroke in the search box. */
  }, [signature, navRef]); // eslint-disable-line react-hooks/exhaustive-deps

  return active;
}

/* --------------------------------------------------------------- states */

/** §5.3 loading: two family sections of four skeleton rows. */
function IndexSkeleton() {
  return (
    <div aria-busy="true" aria-label={copy.metrics.loading}>
      {[0, 1].map(section => (
        <section className="mx-family" key={section}>
          <div className="mx-family__header">
            <div className="skeleton-block" style={{ width: 180, height: 20 }} />
            <div
              className="skeleton-block"
              style={{ width: "min(520px, 90%)", height: 12, marginTop: 10 }}
            />
          </div>
          {[0, 1, 2, 3].map(row => (
            <div className="mx-skeleton-row" key={row}>
              <div className="skeleton-block" style={{ flex: 1, height: 12 }} />
              <div className="skeleton-block" style={{ width: 74, height: 12 }} />
              <div className="skeleton-block" style={{ width: 64, height: 12 }} />
              <div className="skeleton-block" style={{ width: 104, height: 12 }} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

/** §4.2: a scope file failed — the shell and the tabs stay, the content says so. */
export function IndexError({
  reason,
  onRetry,
}: {
  reason: string;
  onRetry: () => void;
}) {
  return (
    <section className="mx-panel-error" role="alert">
      <h2>{copy.metrics.errorTitle}</h2>
      <p>{copy.metrics.errorBody}</p>
      {reason && <code>{reason}</code>}
      <div>
        <button type="button" className="primary-button" onClick={onRetry}>
          <RotateCw size={14} aria-hidden="true" />
          {copy.metrics.errorRetry}
        </button>
      </div>
    </section>
  );
}
