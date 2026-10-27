/**
 * One row of the evidence index (SPEC §5.8, §7.4).
 *
 * Kind icon, `repo ref` in DM Mono bold, the `detail` sentence, when it happened,
 * and the count of figures that counted it. The whole row is a link to the record —
 * one target, no second affordance to aim at, because the row's only destination is
 * the record screen and a split row at 390px would be two 22px targets instead of
 * one 72px one.
 *
 * It renders a thousand times over a scroll, so it stays cheap: no motion (§8.8
 * forbids row-level scroll animation at this count anyway), no per-row state, no
 * layout that depends on measuring anything. `contain` in the stylesheet keeps a
 * row's style and layout work inside the row.
 */

import {
  Database,
  FileCode2,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Tag,
} from "lucide-react";
import { memo, type ComponentType } from "react";
import { Link } from "wouter";

import { evidenceRecordPath } from "@/app/routes";
import type { EvidenceRecord, SourceKind } from "@/data";
import * as copy from "@/copy";

import {
  absoluteTime,
  citedLabel,
  distinctCitations,
  kindLabel,
  recordLines,
  relativeTime,
} from "./format";

export const KIND_ICON: Record<
  SourceKind,
  ComponentType<{ size?: number; strokeWidth?: number }>
> = {
  commit: GitCommitHorizontal,
  pull_request: GitPullRequest,
  file: FileCode2,
  release: Tag,
  branch: GitBranch,
  dataset: Database,
};

export interface EvidenceRowProps {
  record: EvidenceRecord;
  height: number;
  /** Position in the *unfiltered-by-window* list, for assistive tech. */
  position: number;
  setSize: number;
  /** Passed in rather than read per row, so 24 rows agree on one "now". */
  now: number;
}

function Row({ record, height, position, setSize, now }: EvidenceRowProps) {
  const Icon = KIND_ICON[record.kind] ?? Database;
  const { primary, secondary } = recordLines(record);
  const cited = citedLabel(distinctCitations(record).length);
  /* The row's accessible name is spelled out on the link, so the two visual
     renderings of the time below (column at ≥511, inline at ≤510 — §7.4) are not
     announced twice: `aria-label` replaces the descendants' text entirely. */
  const when = record.occurred_at
    ? relativeTime(record.occurred_at, now)
    : copy.evidence.undated;

  return (
    <div
      className="ev-row-slot"
      role="listitem"
      aria-setsize={setSize}
      aria-posinset={position}
      style={{ height }}
    >
      <Link
        className="ev-row"
        href={evidenceRecordPath(record.id)}
        aria-label={copy.fill(copy.evidence.rowAria, {
          ref: primary,
          when,
          cited,
        })}
      >
        <span
          className={`ev-row__icon ev-row__icon--${record.kind}`}
          title={kindLabel(record.kind, 1)}
        >
          <Icon size={14} strokeWidth={1.9} />
        </span>

        <span className="ev-row__main">
          <span className="ev-row__ref">{primary}</span>
          {/* At ≤510 the detail gives way to the time (§7.4); both are in the DOM
              at every width and the stylesheet decides which line shows, so the
              row's accessible name never depends on the viewport. */}
          <span className="ev-row__sub">
            {secondary && <span className="ev-row__detail">{secondary}</span>}
            <Occurred at={record.occurred_at} now={now} compact />
          </span>
        </span>

        <Occurred at={record.occurred_at} now={now} />

        <span className="ev-row__cited">{cited}</span>
      </Link>
    </div>
  );
}

/**
 * Relative, with the exact timestamp as the `title` (§5.8).
 *
 * 255 of the records have no `occurred_at` — a file is counted for its lines, not
 * for a moment — and those say so. An empty cell would read as a rendering fault
 * rather than as a fact about the record (§0.1).
 */
function Occurred({
  at,
  now,
  compact = false,
}: {
  at: string | null;
  now: number;
  compact?: boolean;
}) {
  const className = compact ? "ev-row__when ev-row__when--inline" : "ev-row__when";
  if (!at) return <span className={`${className} ev-row__when--none`}>{copy.evidence.undated}</span>;
  return (
    <time className={className} dateTime={at} title={absoluteTime(at)}>
      {relativeTime(at, now)}
    </time>
  );
}

export const EvidenceRow = memo(Row);
