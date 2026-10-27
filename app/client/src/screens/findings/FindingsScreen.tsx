/**
 * Findings — `/findings`, scoped (SPEC §5.2).
 *
 * The product's alarm surface: every threshold the rulebook crossed in this
 * scope's subtree, each one with the rule that fired it and a route to the
 * evidence underneath.
 *
 * Two structural decisions come straight from §5.2 and are worth restating,
 * because both are the kind of thing a later "improvement" would undo:
 *
 *   - **Nothing is hidden behind a click.** Eight cards is one page. No
 *     pagination, no accordion, no "show more" — a finding the reader has to
 *     discover is a finding the product failed to raise.
 *   - **The severity filter is chips, not tabs.** The counts are the point: a
 *     scope with one critical and five warnings has said something before you
 *     touch anything. Tabs would separate the severities and hide the tally.
 *
 * A severity chip with a count of zero renders, disabled. "Critical 0" is a real
 * statement about this scope and it costs nothing to make it; what it must not
 * do is accept a click that leads to an empty list.
 *
 * The screen needs no fetch of its own: findings live in `edition.json`, which
 * the app has already gated first paint on (§9.1), so there is no loading state
 * here that the shell has not already rendered.
 */

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

import { METHODOLOGY_PATH, scopeTabPath } from "@/app/routes";
import { targetForKey, type ResolvedScope } from "@/app/scope";
import type { Edition, Headline, Severity } from "@/data";
import { duration, ease, stagger, staggerDelay } from "@/lib/motion";
import { formatCount, formatLongDay } from "@/shell/format";
import * as copy from "@/copy";

import { FindingCard } from "./FindingCard";
import {
  countBySeverity,
  filterBySeverity,
  orderBySeverity,
  SEVERITY_ORDER,
} from "./severity";
import "./findings.css";

const easeOut = ease.out as unknown as [number, number, number, number];

export function FindingsScreen({
  edition,
  scope,
}: {
  edition: Edition;
  scope: ResolvedScope;
}) {
  const [severity, setSeverity] = useState<Severity | null>(null);
  const reduced = useReducedMotion();

  /* §5.2: "at project/repo scope, show only findings in the subtree". The
     subtree index is derived at build (§9.2) — this reads it, it does not walk
     the tree itself, so the screen and the status pills cannot disagree. */
  const inScope = useMemo(
    () =>
      orderBySeverity(
        scope.summary.subtreeFindingIndices.map(index => edition.headlines[index])
      ),
    [edition.headlines, scope.summary.subtreeFindingIndices]
  );

  const counts = useMemo(() => countBySeverity(inScope), [inScope]);
  const shown = useMemo(
    () => filterBySeverity(inScope, severity),
    [inScope, severity]
  );

  const elsewhere = edition.headlines.length - inScope.length;
  const ruleset = edition.headlines[0]?.ruleset_version ?? null;

  return (
    <div className="content-wrap">
      <motion.div
        className="page-heading"
        initial={{ opacity: 0, y: reduced ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.enter, ease: easeOut }}
      >
        <div>
          <div className="eyebrow">
            <span className="live-dot" aria-hidden="true" />
            {ruleset
              ? copy.fill(copy.findings.kicker, { ruleset })
              : `Snapshot · ${formatLongDay(edition.generated_at)}`}
          </div>
          <h1>
            {copy.findings.title}
            <span className="title-period">.</span>
          </h1>
          <p className="heading-lede">
            {copy.fill(copy.findings.lede, {
              count: formatCount(edition.headlines.length),
            })}
          </p>
        </div>
      </motion.div>

      {inScope.length > 0 && (
        <SeverityChips
          counts={counts}
          total={inScope.length}
          active={severity}
          onChange={setSeverity}
        />
      )}

      {inScope.length === 0 ? (
        <EmptyFindings scope={scope} />
      ) : shown.length === 0 ? (
        <FilteredEmpty onClear={() => setSeverity(null)} />
      ) : (
        <div className="fx-list">
          {shown.map((headline, index) => (
            <motion.div
              key={`${headline.scope_key}|${headline.metric_id}`}
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: duration.slow,
                ease: easeOut,
                delay: staggerDelay(index, stagger.card),
              }}
            >
              <FindingCard
                headline={headline}
                scopeTarget={targetForKey(edition, headline.scope_key)}
                scopeLabel={labelFor(edition, headline)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {elsewhere > 0 && (
        <p className="fx-elsewhere">
          {elsewhere === 1
            ? copy.findings.elsewhereOne
            : copy.fill(copy.findings.elsewhere, {
                count: formatCount(elsewhere),
              })}
          <Link
            href={scopeTabPath(
              targetForKey(edition, edition.root_scope),
              "findings"
            )}
          >
            {edition.navigation.org.label}
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </p>
      )}
    </div>
  );
}

/**
 * A scope key the edition does not summarise cannot happen in a validated
 * edition — the build's own validator rejects a headline pointing at an unknown
 * scope. The fallback prints the key rather than inventing a label for it.
 */
function labelFor(edition: Edition, headline: Headline): string {
  return (
    edition.scopeSummaries[headline.scope_key]?.scope.label ?? headline.scope_key
  );
}

/* --------------------------------------------------------------- filter */

function SeverityChips({
  counts,
  total,
  active,
  onChange,
}: {
  counts: Record<Severity, number>;
  total: number;
  active: Severity | null;
  onChange: (next: Severity | null) => void;
}) {
  return (
    <div className="fx-filter" role="group" aria-label={copy.findings.filterLegend}>
      <Chip
        label={copy.findings.filterAll}
        count={total}
        selected={active === null}
        onSelect={() => onChange(null)}
      />
      {SEVERITY_ORDER.map(level => (
        <Chip
          key={level}
          label={copy.severity[level]}
          count={counts[level]}
          tone={level}
          selected={active === level}
          onSelect={() => onChange(active === level ? null : level)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  count,
  tone,
  selected,
  onSelect,
}: {
  label: string;
  count: number;
  tone?: Severity;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="fx-chip"
      data-tone={tone ?? "all"}
      aria-pressed={selected}
      aria-label={copy.fill(copy.findings.filterAria, { label })}
      disabled={count === 0}
      onClick={onSelect}
    >
      {tone && <span className={`fx-chip__dot fx-chip__dot--${tone}`} aria-hidden="true" />}
      <span>{label}</span>
      <span className="fx-chip__count">{formatCount(count)}</span>
    </button>
  );
}

/* ---------------------------------------------------------------- states */

/**
 * §5.2's empty state, plus the rule that came nearest.
 *
 * "The rulebook still ran" is a claim, and `nearestThreshold` is the evidence
 * for it: the same derivation the Overview hero's empty variant uses (§5.1.3,
 * §9.2). Naming the rule and the reading turns "nothing fired" into something a
 * reader can check, which is the whole posture of the product.
 */
function EmptyFindings({ scope }: { scope: ResolvedScope }) {
  const nearest = scope.summary.nearestThreshold;

  return (
    <section className="state-panel fx-empty">
      <h2>{copy.findings.emptyTitle}</h2>
      <p>{copy.findings.emptyBody}</p>
      {nearest && (
        <p className="fx-empty__nearest">
          {copy.fill(copy.findings.emptyNearest, {
            label: nearest.label,
            comparison: nearest.comparison,
            threshold: nearest.threshold,
            display: nearest.display,
          })}
        </p>
      )}
      <div className="state-actions">
        <Link href={METHODOLOGY_PATH} className="primary-button">
          {copy.findings.emptyAction}
        </Link>
      </div>
    </section>
  );
}

function FilteredEmpty({ onClear }: { onClear: () => void }) {
  return (
    <section className="state-panel fx-empty">
      <h2>{copy.findings.filteredEmptyTitle}</h2>
      <p>{copy.findings.filteredEmptyBody}</p>
      <div className="state-actions">
        <button type="button" className="quiet-button" onClick={onClear}>
          {copy.findings.filteredEmptyAction}
        </button>
      </div>
    </section>
  );
}
