import { useState } from "react";
import type { Confidence, Tier } from "@/data";
import { cn } from "@/lib/utils";
import * as copy from "@/copy";
import "./integrity.css";

/**
 * SPEC §6.2 — the evidence tier that travels with every figure.
 *
 * Text plus colour, never colour alone: the tier is spelled out at every size, and
 * the dot is a second channel rather than the only one.
 *
 * `compact` is the micro-context form named in §6.2 (a sparkline card may drop to
 * dot + tier) — the confidence is then obliged to appear in that figure's Working
 * drawer, which renders the full badge.
 *
 * `legend` turns the badge into a disclosure carrying the sentence from
 * `data_quality.tier_legend`. It is a click/tap/keyboard disclosure rather than a
 * hover tooltip: §0.1 forbids content that exists only on hover. The same sentences
 * also live on the Methodology screen, so nothing depends on finding this badge.
 */
export interface TierBadgeProps {
  tier: Tier;
  confidence: Confidence;
  /** Tinted pill behind the badge. Off by default — inline with a figure it is bare. */
  boxed?: boolean;
  /** Dot + tier only, for micro-contexts (§6.2). */
  compact?: boolean;
  /** The scope's `data_quality.tier_legend[tier]` sentence, rendered verbatim. */
  legend?: string;
  className?: string;
}

export function TierBadge({
  tier,
  confidence,
  boxed = false,
  compact = false,
  legend,
  className,
}: TierBadgeProps) {
  const [open, setOpen] = useState(false);

  const label = copy.tier[tier];
  const ariaLabel = compact
    ? copy.fill(copy.tier.ariaCompact, { tier: label })
    : copy.fill(copy.tier.aria, { tier: label, confidence: copy.confidence[confidence] });

  const body = (
    <span
      className={cn(
        "tier-badge",
        `tier-badge--${tier}`,
        boxed && "tier-badge--boxed",
        className
      )}
      data-tier={tier}
      data-confidence={confidence}
      aria-label={ariaLabel}
      role="img"
    >
      <span className="tier-badge__dot" aria-hidden="true" />
      <span className="tier-badge__text">{label}</span>
      {!compact && " "}
      {!compact && (
        <span className="tier-badge__confidence">
          {"·"} {copy.confidence[confidence]}
        </span>
      )}
    </span>
  );

  if (!legend) return body;

  return (
    <span className="tier-badge-group">
      <button
        type="button"
        className="tier-badge__toggle"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        {body}
        <span className="sr-only">
          {open
            ? copy.tier.legendClose
            : copy.fill(copy.tier.legendToggle, { tier: label })}
        </span>
      </button>
      {open && <span className="tier-badge__legend">{legend}</span>}
    </span>
  );
}
