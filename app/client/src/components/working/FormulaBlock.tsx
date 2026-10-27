/**
 * 01 Formula (SPEC §5.10.4).
 *
 * The single most important line in this chunk is the one that isn't here: **the
 * client never re-derives the arithmetic.** The dataset's `formula` string already
 * carries the real values — `"438 merged pull requests with a review / 639 merged =
 * 68.5%"` — and this renders it untouched.
 *
 * Recomputing it would be worse than redundant. Two renderings of the same
 * arithmetic can disagree (rounding, a unit, a definition of "merged"), and if they
 * ever did, the screen whose entire purpose is to let a reader check a number would
 * be showing them a number the edition never published. So: one source, rendered
 * verbatim, in mono, selectable and copyable.
 */

import { cn } from "@/lib/utils";
import * as copy from "@/copy";

export interface FormulaBlockProps {
  /** The dataset's `metric.formula`, rendered exactly as it arrived. */
  formula: string;
  className?: string;
}

export function FormulaBlock({ formula, className }: FormulaBlockProps) {
  return (
    <div className={cn("wk-formula", className)} data-testid="working-formula">
      {/* `code` rather than a styled span: this is arithmetic, it is monospaced for
          a reason, and an engineer checking it will want to select it cleanly. */}
      <code className="wk-formula__line">{formula}</code>
      <p className="wk-formula__caption">{copy.working.formulaCaption}</p>
    </div>
  );
}
