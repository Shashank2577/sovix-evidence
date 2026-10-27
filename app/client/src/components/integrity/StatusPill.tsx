import { useState } from "react";
import { deriveStatus, type Headline, type StatusLevel } from "@/data";
import { cn } from "@/lib/utils";
import * as copy from "@/copy";
import "./integrity.css";

/**
 * SPEC §5.6, §6.15 — the scope table's status, derived and never stored.
 *
 * Rule §0.1 forbids a score, a grade or an index. This pill is none of those: it
 * restates which rules from the edition's ruleset fired against this scope, and
 * nothing else. `critical` if a critical finding targets the scope, `watch` if a
 * warning does, `healthy` otherwise — info alone stays healthy, because an info
 * finding is a note, not a rule breach.
 *
 * There is deliberately no `status` prop. The input is the scope's `Headline[]` and
 * the severity is computed here, so no call site can pass in a judgement of its own.
 * "Healthy" means only "no rule fired"; it is not praise and there is no scale it
 * sits on.
 *
 * The footnote is a disclosure, not a tooltip — pointer, touch, keyboard and print
 * all reach the name of the finding that put the pill where it is (§0.1).
 */
export interface StatusPillProps {
  /** The findings that fired for this scope. The only input; there is no override. */
  headlines: Headline[];
  /** Render the "Why?" disclosure. Off in dense table cells that footnote elsewhere. */
  withFootnote?: boolean;
  className?: string;
}

const RANK: Record<Headline["severity"], number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

const ARIA: Record<StatusLevel, string> = {
  critical: copy.status.ariaCritical,
  watch: copy.status.ariaWatch,
  healthy: copy.status.ariaHealthy,
};

/**
 * The finding that decides the pill: the first of the worst severity present, in the
 * order the edition published them. `null` at a healthy scope, and also at a scope
 * whose only findings are info — the pill is healthy there, so naming an info finding
 * as its cause would be inventing a link the derivation does not make.
 */
export function statusDriver(headlines: Headline[]): Headline | null {
  const status = deriveStatus(headlines);
  if (status === "healthy") return null;
  const wanted = status === "critical" ? RANK.critical : RANK.warning;
  return headlines.find(headline => RANK[headline.severity] === wanted) ?? null;
}

export function StatusPill({
  headlines,
  withFootnote = true,
  className,
}: StatusPillProps) {
  const [open, setOpen] = useState(false);

  const status = deriveStatus(headlines);
  const driver = statusDriver(headlines);

  const pill = (
    <span
      className={cn("status-pill", `status-pill--${status}`, className)}
      data-status={status}
      role="img"
      aria-label={ARIA[status]}
    >
      <span className="status-pill__dot" aria-hidden="true" />
      {copy.status[status]}
    </span>
  );

  if (!withFootnote) return pill;

  return (
    <span className="status-pill-group">
      <button
        type="button"
        className="status-pill__toggle"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        {pill}
        <span>{open ? copy.status.footnoteClose : copy.status.footnoteToggle}</span>
      </button>
      {open && (
        <span className="status-pill__footnote" data-testid="status-footnote">
          {driver ? (
            <>
              {copy.fill(copy.status.footnoteDriver, {
                severity: copy.severity[driver.severity],
                title: driver.title,
              })}
              <span className="status-pill__rule">
                {copy.fill(copy.status.footnoteRule, {
                  comparison: driver.rule_comparison,
                  threshold: driver.rule_threshold,
                  ruleset: driver.ruleset_version,
                })}
              </span>
            </>
          ) : (
            copy.status.footnoteHealthy
          )}
        </span>
      )}
    </span>
  );
}
