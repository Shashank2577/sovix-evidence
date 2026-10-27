/**
 * Everything inside the working, above the five numbered sections (SPEC §5.10.1–3,
 * §5.10.9).
 *
 * The order is the whole argument of this surface. Kicker, label, figure, tier —
 * then plain English, then how to read it, and only then the arithmetic. §5.10 is
 * explicit that this is an audience decision: the project manager outnumbers the
 * engineer here, and the engineer is one scroll from the formula either way. The
 * reverse order would cost the majority reader the answer they came for.
 *
 * Presentation only. It takes a `Metric` and renders it; it fetches nothing,
 * derives nothing, and decides nothing about when it is on screen.
 */

import { ArrowUpRight, X } from "lucide-react";
import type { ElementType } from "react";
import { Link } from "wouter";

import { FloorFigure, NotAvailable, TierBadge } from "@/components/integrity";
import type { Metric } from "@/data";
import { cn } from "@/lib/utils";
import { formatDay } from "@/shell/format";
import * as copy from "@/copy";

import { WorkingSections, type WorkingVariant } from "./WorkingSections";

export interface WorkingBodyProps {
  metric: Metric;
  scopeSlug: string;
  variant: WorkingVariant;
  /** `data_quality.tier_legend[metric.tier]`, verbatim — the badge's disclosure. */
  tierLegend?: string;
  /** Route to this metric's full page. The footer's promotion (§5.10.9). */
  fullPagePath: string;
  onClose: () => void;
  /**
   * The elements the heading and the scope line render as.
   *
   * Radix (desktop) and vaul (mobile) each need their own `Title` and `Description`
   * inside the dialog: that is how the panel gets `aria-labelledby` pointed at the
   * metric's label (§5.10) and `aria-describedby` at the scope line. Passing the
   * components in, rather than adding a second visually-hidden title, keeps exactly
   * one heading in the document — a duplicate would be announced twice.
   *
   * They also own the ids. Overriding them is what breaks the wiring: Radix looks
   * its own title up by the id it issued, so a hand-written `id` leaves the dialog
   * unlabelled *and* logs about it.
   */
  titleAs?: ElementType;
  descriptionAs?: ElementType;
}

export function WorkingBody({
  metric,
  scopeSlug,
  variant,
  tierLegend,
  fullPagePath,
  onClose,
  titleAs: Title = "h2",
  descriptionAs: Description = "p",
}: WorkingBodyProps) {
  const isSheet = variant === "sheet";

  const valueRow = (
    <div className="wk-value-row" data-testid="working-value">
      {metric.isNA ? (
        /* §0.1: absence is never zero. `NotAvailable` at `stat` size carries the
           reason line with it, so the drawer states why there is no figure in the
           same breath as the fact that there isn't one. */
        <NotAvailable metric={metric} size="stat" />
      ) : (
        /* Every figure rendering routes through FloorFigure, including the ones
           that need no `≥` — the call site never gets to decide (§6.3). */
        <FloorFigure
          className="wk-value"
          display={metric.display}
          metricId={metric.id}
        />
      )}
      <TierBadge
        tier={metric.tier}
        confidence={metric.confidence}
        boxed
        legend={tierLegend}
      />
    </div>
  );

  return (
    <div className={cn("wk-panel", `wk-panel--${variant}`)}>
      <header className="wk-head">
        <div className="wk-head__titles">
          <p className="wk-kicker">
            <span className="wk-live" aria-hidden="true" />
            {copy.working.kicker}
          </p>
          <Title className="wk-title">{metric.label}</Title>
          {/*
           * Which scope's sample this is. §5.10 forbids swapping evidence under the
           * reader when the scope changes; naming the scope is the visible half of
           * that promise — a drawer that could be the org's or one repository's,
           * with no way to tell, would be exactly the ambiguity the rule exists for.
           */}
          <Description className="wk-scope">
            {copy.fill(copy.working.scopeLine, {
              label: metric.scope.label,
              since: formatDay(metric.scope.since),
              until: formatDay(metric.scope.until),
            })}
          </Description>
        </div>
        <button
          type="button"
          className="wk-close"
          onClick={onClose}
          aria-label={copy.working.closeIcon}
        >
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>
        {isSheet && valueRow}
      </header>

      <div className="wk-scroll">
        {!isSheet && valueRow}

        <div className="wk-prose">
          <p className="wk-prose__label">{copy.working.plainEnglishHeading}</p>
          <p className="wk-prose__text">{metric.plain_english}</p>
        </div>

        {/* §1.6 puts `how_to_read` in the drawer's lead alongside `plain_english`:
            it is the sentence that turns a figure into something the reader can act
            on, and it is the dataset's own, not ours. */}
        <div className="wk-howto">
          <p className="wk-howto__label">{copy.working.howToReadHeading}</p>
          <p className="wk-howto__text">{metric.how_to_read}</p>
        </div>

        <WorkingSections
          metric={metric}
          scopeSlug={scopeSlug}
          variant={variant}
        />
      </div>

      <footer className="wk-footer">
        <button
          type="button"
          className="wk-button wk-button--quiet"
          onClick={onClose}
        >
          {copy.working.close}
        </button>
        {/*
         * The drawer-to-page promotion (§5.10.9): "drawer closes, route changes".
         *
         * It needs no closing code. `fullPagePath` carries no `?working=`, and the
         * drawer is open only while the URL says it is — so arriving on the metric
         * page *is* the close. Every link that leads out of the drawer inherits the
         * same property, which is the second dividend of putting the state in the
         * URL rather than in a `useState` somewhere.
         *
         * A real link, so ⌘-click opens the full page in a new tab and leaves this
         * reader where they were.
         */}
        <Link
          className="wk-button wk-button--primary"
          href={fullPagePath}
          aria-label={copy.fill(copy.working.openFullPageAria, {
            label: metric.label,
          })}
        >
          {copy.working.openFullPage}
          <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
