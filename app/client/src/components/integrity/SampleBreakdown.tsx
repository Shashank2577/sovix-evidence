import type { Sample } from "@/data";
import { cn } from "@/lib/utils";
import * as copy from "@/copy";
import "./integrity.css";

/**
 * SPEC §6.6 — the sample, its coverage, and everything that was set aside.
 *
 * The section that makes a figure auditable: how many records were counted, out of
 * how many, and the named reason for each one that was not. Reasons are sentences
 * and they wrap in full — truncating one destroys the only thing the line is for.
 */
export interface SampleBreakdownProps {
  sample: Sample;
  className?: string;
}

const NUMBER = new Intl.NumberFormat("en-US");

export interface SampleTotals {
  /** Σ of the dataset's itemised exclusion counts. */
  excludedTotal: number;
  /** The shortfall the collector did not itemise, carried by the build (§9.5). */
  unaccounted: number;
  /** `n + Σexcluded + unaccounted === population`. */
  balances: boolean;
}

/**
 * The arithmetic the breakdown displays, in one place so the component and its test
 * read the same numbers.
 *
 * Summing the dataset's own exclusion counts is presentation, not derivation — the
 * total is shown so the reader can check the lines add up, which is the whole point
 * of showing the lines.
 */
export function sampleTotals(sample: Sample): SampleTotals {
  const excludedTotal = Object.values(sample.excluded).reduce(
    (total, count) => total + count,
    0
  );
  return {
    excludedTotal,
    unaccounted: sample.unaccounted,
    balances:
      sample.n + excludedTotal + sample.unaccounted === sample.population,
  };
}

export function SampleBreakdown({ sample, className }: SampleBreakdownProps) {
  const { excludedTotal, unaccounted, balances } = sampleTotals(sample);

  /*
   * §6.6's assertion. The build validator is the gate that fails a release; this is
   * the developer-facing echo of it, so a breakdown that stops adding up during
   * local work is noticed at the surface that displays it rather than in a log.
   */
  if (import.meta.env?.DEV && !balances) {
    // eslint-disable-next-line no-console
    console.error(
      `[SampleBreakdown] sample does not balance: n=${sample.n} + excluded=${excludedTotal} + unaccounted=${unaccounted} !== population=${sample.population}`
    );
  }

  const lines: { key: string; reason: string; count: number; kind: "excluded" | "unaccounted" }[] =
    Object.entries(sample.excluded)
      .sort(([, a], [, b]) => b - a)
      .map(([reason, count]) => ({
        key: reason,
        reason,
        count,
        kind: "excluded" as const,
      }));

  if (unaccounted > 0) {
    // Named rather than swallowed: a breakdown that silently fell short of the
    // population would be a quiet under-report (§0.1 — absence is never silent).
    lines.push({
      key: "__unaccounted__",
      reason: copy.sample.unaccountedReason,
      count: unaccounted,
      kind: "unaccounted",
    });
  }

  const barPct = Math.max(0, Math.min(100, sample.coverage_pct));

  return (
    <div className={cn("sample-breakdown", className)} data-testid="sample-breakdown">
      <div className="sample-breakdown__tiles">
        <SampleTile label={copy.sample.eligibleLabel} value={sample.n} />
        <SampleTile label={copy.sample.populationLabel} value={sample.population} />
        <SampleTile label={copy.sample.excludedLabel} value={excludedTotal + unaccounted} />
      </div>

      <p className="sample-breakdown__unit">
        {copy.fill(copy.sample.unitLine, { unit: sample.unit })}
      </p>

      <div>
        <div className="sample-breakdown__coverage-head">
          <span>{copy.sample.coverageLabel}</span>
          <b>{copy.fill(copy.sample.coverageValue, { pct: sample.coverage_pct })}</b>
        </div>
        <div
          className="coverage-bar"
          role="img"
          aria-label={copy.fill(copy.sample.coverageAria, {
            n: NUMBER.format(sample.n),
            population: NUMBER.format(sample.population),
            unit: sample.unit,
            pct: sample.coverage_pct,
          })}
        >
          <div
            className="coverage-bar__fill"
            style={{ width: `${barPct}%` }}
            data-testid="coverage-fill"
          />
        </div>
        <div className="sample-breakdown__legend">
          <span className="sample-legend-item sample-legend-item--included">
            <span className="sample-legend-item__dot" aria-hidden="true" />
            {copy.sample.includedLegend}
          </span>
          <span className="sample-legend-item sample-legend-item--excluded">
            <span className="sample-legend-item__dot" aria-hidden="true" />
            {copy.sample.excludedLegend}
          </span>
        </div>
      </div>

      <div>
        <p className="sample-breakdown__heading">{copy.sample.exclusionsHeading}</p>
        {lines.length === 0 ? (
          <p className="sample-breakdown__empty">
            {sample.population === 0
              ? copy.sample.emptySample
              : copy.sample.noExclusions}
          </p>
        ) : (
          <ul className="exclusion-lines">
            {lines.map(line => (
              <li
                key={line.key}
                className={cn("exclusion-line", `exclusion-line--${line.kind}`)}
              >
                <span className="exclusion-line__dot" aria-hidden="true" />
                <span className="exclusion-line__reason">{line.reason}</span>
                <span className="exclusion-line__count">
                  {NUMBER.format(line.count)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SampleTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="sample-tile">
      <span className="sample-tile__label">{label}</span>
      <span className="sample-tile__value">{NUMBER.format(value)}</span>
    </div>
  );
}
