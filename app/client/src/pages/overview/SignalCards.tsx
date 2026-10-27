/**
 * The readout — SPEC §5.1.4, §6.12.
 *
 * Four cards, fixed per scope level, each carrying the dataset's own `display`
 * string, the metric's real monthly series, its evidence tier, and the sample the
 * figure was computed over. Two tab stops per card: the card navigates to the
 * metric's page, the ⌗ opens its working without leaving this screen.
 *
 * The delta chip is the one number on the screen that is not lifted whole from the
 * dataset, and it is a subtraction of two that are. There is exactly one edition,
 * so a "vs last edition" chip cannot exist; what this shows is last month against
 * the month before it, from the metric's own published points, labelled `m/m` so
 * the reader can see which two. A metric without a series shows no chip at all
 * rather than a dash that would read as a zero move.
 *
 * Colour follows direction, never judgement: a metric whose `direction` is neutral
 * renders gray whichever way it moved, and the copy says `+12 pts m/m` — it never
 * says the move was good or bad (§0.1).
 */

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

import { scopeTabPath, type ScopeTarget } from "@/app/routes";
import { Sparkline } from "@/components/charts";
import { FloorFigure, NotAvailable, TierBadge } from "@/components/integrity";
import { WorkingTrigger } from "@/components/working";
import * as copy from "@/copy";
import type { Edition, Metric } from "@/data";
import { ease, staggerDelay, stagger } from "@/lib/motion";
import { formatCount } from "@/shell/format";

/** The reference's five chart hues, in the order the mock used them. */
const ACCENTS = [
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-4)",
];

export interface SignalCardsProps {
  edition: Edition;
  target: ScopeTarget;
  metrics: Metric[];
}

export function SignalCards({ edition, target, metrics }: SignalCardsProps) {
  return (
    <div className="metric-grid">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.24,
            ease: ease.out,
            delay: staggerDelay(index, stagger.card),
          }}
          style={{ minWidth: 0 }}
        >
          <SignalCard
            edition={edition}
            target={target}
            metric={metric}
            accent={ACCENTS[index % ACCENTS.length]}
          />
        </motion.div>
      ))}
    </div>
  );
}

function SignalCard({
  edition,
  target,
  metric,
  accent,
}: {
  edition: Edition;
  target: ScopeTarget;
  metric: Metric;
  accent: string;
}) {
  const family =
    edition.glossary.families[metric.family]?.label ?? metric.family;

  return (
    /*
     * The whole card navigates and the ⌗ opens the working — two tab stops, both
     * real links (§6.12). They cannot nest: an anchor inside an anchor is invalid
     * markup and browsers resolve it by dropping one. So the card's link is an
     * overlay covering the card, and the ⌗ sits above it.
     */
    <div className="metric-card ov-card">
      <Link
        href={scopeTabPath(target, "metrics", metric.id)}
        className="ov-card-hit"
        aria-label={metric.label}
      />
      <div className="metric-card-top ov-card-head">
        <span>{family}</span>
        <WorkingTrigger metricId={metric.id} label={metric.label} />
      </div>

      <div className="metric-label">{metric.label}</div>

      {metric.isNA ? (
        <div className="ov-card-na">
          <NotAvailable metric={metric} size="chip" />
        </div>
      ) : (
        <div className="metric-value-row ov-card-value">
          <FloorFigure display={metric.display} metricId={metric.id} />
          <DeltaChip metric={metric} />
        </div>
      )}

      <div className="metric-chart">
        {metric.sparkline && metric.sparkline.length > 0 && (
          <Sparkline
            points={metric.sparkline}
            unit={metric.unit}
            label={metric.label}
            accent={accent}
          />
        )}
      </div>

      <div className="metric-card-bottom">
        <TierBadge tier={metric.tier} confidence={metric.confidence} />
        <span className="metric-sample">
          {copy.fill(copy.overview.sampleLine, {
            n: formatCount(metric.sample.n),
            population: formatCount(metric.sample.population),
            unit: metric.sample.unit,
          })}
        </span>
      </div>
    </div>
  );
}

function DeltaChip({ metric }: { metric: Metric }) {
  const mom = metric.mom;
  /* No series, or no two consecutive months with figures: no chip (§5.1.4). */
  if (!mom) return null;

  const tone = metric.direction === "neutral" ? "neutral" : mom.tone;
  const Icon =
    mom.delta > 0 ? ArrowUpRight : mom.delta < 0 ? ArrowDownRight : null;

  return (
    <span
      className={`delta delta--${tone}`}
      title={copy.fill(copy.overview.deltaAria, {
        display: mom.display,
        from: mom.from,
        to: mom.to,
      })}
    >
      {Icon && <Icon size={13} aria-hidden="true" />}
      {mom.display}{" "}
      <span className="delta__label">{copy.overview.deltaLabel}</span>
    </span>
  );
}
