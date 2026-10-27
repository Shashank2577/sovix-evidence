/**
 * 03 Assumptions & caveats (SPEC §5.10.6), and the box the drawer also uses for
 * `no_sources_reason` (§5.10.8).
 *
 * Two icons, one treatment: an assumption is something the measurement took for
 * granted, a caveat is something it could not see. Both are the dataset's own
 * prose, rendered verbatim — this is where a figure tells you what it is not
 * claiming, and a paraphrase would be us softening it on the edition's behalf.
 *
 * The label is text, not just an icon colour, so the distinction survives
 * greyscale, print and a screen reader.
 */

import { CircleHelp, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import * as copy from "@/copy";

export interface CaveatBoxProps {
  kind: "assumption" | "caveat";
  /** The dataset's sentence. Never trimmed: a truncated caveat is a false one. */
  text: string;
  className?: string;
}

export function CaveatBox({ kind, text, className }: CaveatBoxProps) {
  const Icon = kind === "assumption" ? CircleHelp : Info;
  const label =
    kind === "assumption"
      ? copy.working.assumptionLabel
      : copy.working.caveatLabel;

  return (
    <div
      className={cn("wk-caveat", `wk-caveat--${kind}`, className)}
      data-testid={`working-${kind}`}
    >
      <Icon
        className="wk-caveat__icon"
        size={15}
        strokeWidth={1.9}
        aria-hidden="true"
      />
      <div className="wk-caveat__body">
        <span className="wk-caveat__label">{label}</span>
        <p className="wk-caveat__text">{text}</p>
      </div>
    </div>
  );
}
