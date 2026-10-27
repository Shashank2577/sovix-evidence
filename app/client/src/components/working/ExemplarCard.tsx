/**
 * 04 Exemplars (SPEC §5.10.7, §6.10).
 *
 * A percentage is an argument nobody can check. An exemplar is the same argument
 * with a name on it: *fastapi/fastapi #16210, 1,936 lines, merged with no review.*
 * This card is where the drawer stops describing a figure and starts showing the
 * reader the thing the figure is about.
 *
 * Two constraints the design answers:
 *   - Rank 1 is expanded on arrival, the rest are collapsed to their headline
 *     (§5.10.7). Five open cards at once is a wall; one open card with four
 *     headlines under it is a ranked list a reader can walk.
 *   - The rank badge reads "Strongest" for rank 1, `#n` after (§6.10) — except on
 *     the `people` family, where `showRank` turns it off. See the note on that prop:
 *     this is §0.1 overriding §6.10, deliberately.
 */

import { ExternalLink } from "lucide-react";

import type { Exemplar } from "@/data";
import { cn } from "@/lib/utils";
import { formatCount } from "@/shell/format";
import * as copy from "@/copy";

import { Disclosure } from "./Disclosure";

export interface ExemplarCardProps {
  exemplar: Exemplar;
  /** Rank 1 arrives open; the rest arrive collapsed to their headline. */
  defaultOpen?: boolean;
  /**
   * Show the "Strongest" / `#n` rank badge. **Off for the `people` family**, and
   * this is the one place in the chunk where §6.10's literal text loses to a rule.
   *
   * §6.10 asks every exemplar card for a rank badge. On 50 of the 57 metrics the
   * rank is about a pull request, a file or a commit, and the badge is exactly the
   * useful signal it was specified to be. On the seven `people.*` metrics the
   * exemplars *are* named contributors ordered by their own line counts — so
   * "Strongest · Sebastián Ramírez", "#2 · Yurii Motov", "#3 · Nils-Hero Lindemann"
   * is a leaderboard of real people, rendered by us, in a product whose first
   * release-blocking rule is **never rank people** and whose banned-word list
   * contains the word "leaderboard" (§0.1, §6.5).
   *
   * The cards themselves stay: bus factor is unauditable without them, and §0.1
   * explicitly permits contributor names "inside source records and exemplar
   * prose". What goes is the ornament we add on top — the numbering that turns the
   * dataset's evidence ordering into a standing we appear to have awarded.
   */
  showRank?: boolean;
  className?: string;
}

export function ExemplarCard({
  exemplar,
  defaultOpen = false,
  showRank = true,
  className,
}: ExemplarCardProps) {
  const { source } = exemplar;
  const strongest = exemplar.rank === 1;
  const rankLabel = strongest
    ? copy.working.exemplarStrongest
    : copy.fill(copy.working.exemplarRank, { rank: exemplar.rank });

  return (
    <div
      className={cn(
        "wk-exemplar",
        /* The emphasised border is rank ornament too, so it goes with the badge. */
        showRank && strongest && "wk-exemplar--strongest",
        className
      )}
      data-testid="working-exemplar"
      data-rank={exemplar.rank}
      data-ranked={showRank}
    >
      <Disclosure
        variant="plain"
        className="wk-exemplar__disclosure"
        defaultOpen={defaultOpen}
        leading={
          showRank ? (
            <span className="wk-exemplar__rank">{rankLabel}</span>
          ) : null
        }
        /* The headline is the label, so the collapsed card still says which record
           it is — a row reading only "#3" would make the reader open all four to
           find the one they wanted. */
        label={
          <span className="wk-exemplar__headline">{exemplar.headline}</span>
        }
      >
        <p className="wk-exemplar__prose">{exemplar.why_this_proves_it}</p>

        <div className="wk-exemplar__meta">
          <span className="wk-exemplar__weight">
            {formatCount(exemplar.weight)} {exemplar.weight_unit}
          </span>
          {/* `null` means the dataset published no share for this exemplar, which is
              not the same as 0% — so the chip is absent rather than zeroed (§0.1). */}
          {exemplar.share_of_total_pct !== null && (
            <span className="wk-exemplar__share">
              {copy.fill(copy.working.exemplarShare, {
                pct: exemplar.share_of_total_pct,
              })}
            </span>
          )}
        </div>

        {/* Same rule as the source rows: 501 of this edition's 1,551 exemplar
            sources are aggregates with no URL, and a link to nowhere is worse than
            no link. The weight line above already says what the record is. */}
        {source.url && source.repo && (
          <a
            className="wk-exemplar__link"
            href={source.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            <span>
              {source.repo} {source.ref}
            </span>
            <ExternalLink size={13} strokeWidth={1.9} aria-hidden="true" />
          </a>
        )}
      </Disclosure>
    </div>
  );
}
