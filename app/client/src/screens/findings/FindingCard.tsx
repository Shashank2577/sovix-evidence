/**
 * One fired rule (SPEC §5.2, §6.13).
 *
 * The card's whole job is to make a threshold crossing checkable in one move. So
 * it states four things in a fixed order and adds nothing to them: which rule
 * fired and at what reading, the dataset's own sentence about it, the dataset's
 * own recommended action, and two ways to go and look.
 *
 * Three decisions worth naming:
 *
 *   - **The rule line is the card's spine.** `process.review_coverage < 50 ·
 *     fired at 7.8%` is rendered in DM Mono from four fields of the headline,
 *     never from prose. A reader who disagrees with the finding can disagree
 *     with a number and a threshold rather than with an adjective.
 *   - **"What to do" is the one prescriptive box in the product**, and the
 *     sentence inside it is `action` from the dataset, verbatim. We write the
 *     label; the rulebook writes the advice (§5.2).
 *   - **"Inspect the evidence" goes to the finding's own scope**, not the scope
 *     the reader is standing in. A finding at `repo:fastapi/fastapi` read from
 *     the org's Findings page is still a reading of fastapi's sample, and the
 *     working drawer is bound to the route's scope (§5.10). Landing on the
 *     repository's Findings tab with the drawer open keeps the evidence and the
 *     card that cited it on the same screen.
 */

import { ArrowUpRight, Hash } from "lucide-react";
import { Link } from "wouter";

import { scopeTabPath, withWorking, type ScopeTarget } from "@/app/routes";
import type { Headline } from "@/data";
import { cn } from "@/lib/utils";
import * as copy from "@/copy";

import "./findings.css";

export interface FindingCardProps {
  headline: Headline;
  /** The scope the finding was recorded at, resolved against the edition. */
  scopeTarget: ScopeTarget;
  scopeLabel: string;
  className?: string;
}

export function FindingCard({
  headline,
  scopeTarget,
  scopeLabel,
  className,
}: FindingCardProps) {
  const scopeFindings = scopeTabPath(scopeTarget, "findings");
  const inspectHref = withWorking(scopeFindings, headline.metric_id);

  const ruleVars = {
    metric: headline.metric_id,
    comparison: headline.rule_comparison,
    threshold: headline.rule_threshold,
    value: headline.value_display,
  };

  return (
    <article
      className={cn("fx-card", `fx-card--${headline.severity}`, className)}
      data-severity={headline.severity}
      aria-labelledby={`fx-${headline.metric_id}-${headline.scope_key}`}
    >
      {/* §5.2's 3px severity rail. Colour is the second channel here, never the
          only one: the severity is spelled out in the chip beside it. */}
      <span className="fx-card__rail" aria-hidden="true" />

      <div className="fx-card__body">
        <div className="fx-card__chips">
          <span className={`fx-sev fx-sev--${headline.severity}`}>
            {copy.severity[headline.severity]}
          </span>
          <Link
            className="fx-scope-chip"
            href={scopeTabPath(scopeTarget, "overview")}
            aria-label={copy.fill(copy.findings.scopeChipAria, {
              label: scopeLabel,
            })}
          >
            {scopeLabel}
          </Link>
        </div>

        <h3
          className="fx-card__title"
          id={`fx-${headline.metric_id}-${headline.scope_key}`}
        >
          {headline.title}
        </h3>

        <p
          className="fx-card__rule"
          aria-label={copy.fill(copy.findings.ruleAria, ruleVars)}
        >
          {copy.fill(copy.findings.ruleLine, ruleVars)}
        </p>

        {/* The dataset's sentence, rendered verbatim (§9.8). */}
        <p className="fx-card__detail">{headline.detail}</p>

        <div className="fx-action">
          <p className="fx-action__label">{copy.findings.actionHeading}</p>
          <p className="fx-action__text">{headline.action}</p>
        </div>

        <footer className="fx-card__foot">
          <Link
            className="primary-button"
            href={inspectHref}
            aria-label={copy.fill(copy.findings.inspectAria, {
              label: headline.title,
            })}
          >
            <Hash size={13} strokeWidth={2.2} aria-hidden="true" />
            {copy.findings.inspect}
          </Link>
          <Link className="quiet-button" href={scopeTabPath(scopeTarget, "overview")}>
            {copy.fill(copy.findings.openScope, { label: scopeLabel })}
            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </article>
  );
}
