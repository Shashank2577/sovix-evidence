import { CircleSlash } from "lucide-react";
import type { Metric, MetricSummary } from "@/data";
import { cn } from "@/lib/utils";
import * as copy from "@/copy";
import "./integrity.css";

/**
 * SPEC §6.4 — what a null reading looks like.
 *
 * Rule §0.1: absence is never zero. A `0` here would be a different claim and a
 * false one — "we measured none" instead of "we could not measure". So this renders
 * words, in italic DM Sans, against the mono numerals used everywhere else: at a
 * glance it cannot be mistaken for a figure. It never renders `0`, never a bare `—`,
 * never an empty cell.
 *
 * The `stat` size states the reason. Charts do not use this component at all; they
 * omit the point (§6.8).
 *
 * Two shapes of input, because a null reading turns up at two depths. Screens that
 * have loaded a scope file hand over the full `Metric`, which carries the caveats
 * and the sample the reason is read from. Screens fed by `edition.json` alone — the
 * scope table (§5.6) is one — hand over the `MetricSummary` row, which carries the
 * reading and its coverage but none of the prose. The rule is the same either way:
 * words, never a zero. What changes is how specific the reason can be, and the
 * summary form says so rather than inventing one.
 */
export type NotAvailableSubject = Metric | MetricSummary;

export interface NotAvailableProps {
  metric: NotAvailableSubject;
  /** `chip` in tables and cards; `stat` wherever the figure is the subject. */
  size: "chip" | "stat";
  className?: string;
}

/** A full metric carries its own working; a summary row does not. */
function isFullMetric(subject: NotAvailableSubject): subject is Metric {
  return "sample" in subject;
}

/**
 * Why this metric has no reading, in the dataset's own words where it has them.
 *
 * Preference order per §6.4: the first caveat that speaks to availability, else the
 * sample's own count sentence ("0 of 0 days of recorded telemetry"). The fallback is
 * the only place a zero appears, and it is a zero about the *sample*, not the
 * reading — which is exactly the distinction the rule is protecting.
 */
export function notAvailableReason(metric: NotAvailableSubject): string {
  /* A summary row has neither caveats nor a sample breakdown to quote. It does
     carry the coverage the reading was attempted over, which is a true statement
     about the absence and points at where the full reason is. */
  if (!isFullMetric(metric))
    return copy.fill(copy.notAvailable.summaryReason, {
      pct: metric.coverage_pct,
    });

  const caveat = metric.caveats.find(text =>
    /\b(not available|unavailable|no value|absent|could not be)\b/i.test(text)
  );
  if (caveat) return caveat;

  return copy.fill(copy.notAvailable.sampleReason, {
    n: metric.sample.n,
    population: metric.sample.population,
    unit: metric.sample.unit,
  });
}

export function NotAvailable({ metric, size, className }: NotAvailableProps) {
  const reason = notAvailableReason(metric);

  return (
    <span
      className={cn("not-available", `not-available--${size}`, className)}
      data-na="true"
      data-metric-id={metric.id}
    >
      <span className="not-available__figure" data-testid="na-figure">
        <CircleSlash
          className="not-available__icon"
          size={size === "stat" ? 15 : 12}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span
          className="not-available__label"
          aria-label={copy.fill(copy.notAvailable.aria, { reason })}
          role="img"
        >
          {copy.notAvailable.label}
        </span>
      </span>
      {/* A span rather than a p: this renders inline inside table cells and card
          headers, where a block element would be invalid markup. The flex column
          gives the reason its own line. */}
      {size === "stat" && (
        <span className="not-available__reason" data-testid="na-reason">
          {reason}
        </span>
      )}
    </span>
  );
}
