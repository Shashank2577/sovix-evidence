/**
 * The ⌗ affordance every figure carries (SPEC §6.12, §1.1, §7.6).
 *
 * §1.1 requires the working to be "reachable from every rendering of every figure
 * via one tap/click/Enter". That is a promise about dozens of call sites — signal
 * cards, table rows, finding cards, the metric header — and the way it survives all
 * of them is that none of them build the URL themselves.
 *
 * It is an anchor, not a button, for three reasons that all matter at this surface:
 * ⌘-click opens the working in a new tab, "copy link address" hands someone the
 * evidence, and the browser's own status bar shows where it goes before you commit.
 * A `<button>` with an onClick would have none of that, and this is the product's
 * most link-worthy destination.
 *
 * On a card the whole card navigates to the metric page and this is the second tab
 * stop (§6.12), so it stops click propagation — otherwise the card's own handler
 * would fire underneath and the reader would land on the page they were trying to
 * avoid a trip to.
 */

import { Hash } from "lucide-react";
import { Link } from "wouter";

import { cn } from "@/lib/utils";
import * as copy from "@/copy";

import { useWorking } from "./useWorking";

export interface WorkingTriggerProps {
  metricId: string;
  /** The metric's label, for the accessible name. */
  label: string;
  /** `icon` is the corner ⌗; `text` spells it out where there is room. */
  variant?: "icon" | "text";
  className?: string;
}

export function WorkingTrigger({
  metricId,
  label,
  variant = "icon",
  className,
}: WorkingTriggerProps) {
  const { hrefFor } = useWorking();

  return (
    <Link
      className={cn("wk-trigger", `wk-trigger--${variant}`, className)}
      href={hrefFor(metricId)}
      aria-label={copy.fill(copy.working.triggerAria, { label })}
      data-testid="working-trigger"
      onClick={event => event.stopPropagation()}
    >
      <Hash size={13} strokeWidth={2.2} aria-hidden="true" />
      {variant === "text" && <span>{copy.working.triggerLabel}</span>}
    </Link>
  );
}
