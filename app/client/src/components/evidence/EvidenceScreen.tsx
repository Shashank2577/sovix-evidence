/**
 * `/evidence` and `/evidence/:recordId`, and the fetch they share (SPEC §5.8, §5.9).
 *
 * `evidence.json` is ~500 KB and is the only file in the edition that is not needed
 * to render anything else, so it is fetched on first entry to either route and then
 * held forever (§9.6). Both screens are gated on it together — a record *is* a row of
 * the index, and splitting the fetch would mean two caches disagreeing about the same
 * 1,104 records.
 *
 * The page heading is built here rather than inside either screen so that the
 * loading state can show the right heading before the records arrive: the index
 * knows its own lede from `edition.json` alone (§9.1 puts the counts there for
 * exactly this), and a record shows a neutral heading until it can name itself.
 */

import { RotateCw } from "lucide-react";
import { useMemo } from "react";
import { useSearch } from "wouter";

import type { Edition, EvidenceIndex } from "@/data";
import { useEvidence } from "@/data";
import { PageFrame } from "@/pages/Screens";
import { formatLongDay } from "@/shell/format";
import * as copy from "@/copy";

import { EvidenceIndexScreen } from "./EvidenceIndexScreen";
import {
  EvidenceRecordScreen,
  EvidenceRecordUnknown,
} from "./EvidenceRecordScreen";
import { indexLede, kindLabel, recordLines, recordTitle } from "./format";
import { ROW_HEIGHT_WIDE } from "./useWindowRows";
import "./evidence.css";

export interface EvidenceScreenProps {
  edition: Edition;
  /** `null` on the index route; a record id on the record route. */
  recordId: string | null;
}

export function EvidenceScreen({ edition, recordId }: EvidenceScreenProps) {
  const evidence = useEvidence();
  const search = useSearch();

  return recordId === null ? (
    <IndexRoute edition={edition} evidence={evidence} search={search} />
  ) : (
    <RecordRoute edition={edition} evidence={evidence} recordId={recordId} />
  );
}

type EvidenceResource = ReturnType<typeof useEvidence>;

function editionEyebrow(edition: Edition): string {
  return `Snapshot · ${formatLongDay(edition.generated_at)}`;
}

/* ----------------------------------------------------------------- index */

function IndexRoute({
  edition,
  evidence,
  search,
}: {
  edition: Edition;
  evidence: EvidenceResource;
  search: string;
}) {
  const lede = useMemo(
    () =>
      indexLede(edition.evidenceCounts.total, edition.evidenceCounts.byKind),
    [edition]
  );

  return (
    <PageFrame
      eyebrow={editionEyebrow(edition)}
      title={copy.evidence.indexTitle}
      lede={lede}
    >
      {evidence.status === "loading" && <IndexSkeleton />}
      {evidence.status === "error" && (
        <EvidenceError
          reason={evidence.error?.message ?? ""}
          onRetry={evidence.retry}
        />
      )}
      {evidence.status === "ready" && evidence.data && (
        <EvidenceIndexScreen
          edition={edition}
          index={evidence.data}
          search={search}
        />
      )}
    </PageFrame>
  );
}

/** §5.8 loading — ten list rows, at the height the real rows will occupy. */
function IndexSkeleton() {
  return (
    <div
      className="ev-skeleton-list"
      aria-busy="true"
      aria-label={copy.evidence.loading}
    >
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          className="skeleton-block"
          style={{ height: ROW_HEIGHT_WIDE - 8 }}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- record */

function RecordRoute({
  edition,
  evidence,
  recordId,
}: {
  edition: Edition;
  evidence: EvidenceResource;
  recordId: string;
}) {
  const index: EvidenceIndex | undefined = evidence.data;
  const record = useMemo(
    () => index?.records.find(candidate => candidate.id === recordId),
    [index, recordId]
  );

  const heading = record ? recordTitle(record) : null;
  const lines = record ? recordLines(record) : null;

  return (
    <PageFrame
      eyebrow={
        record
          ? `${copy.evidence.recordTitle} · ${kindLabel(record.kind, 1)}`
          : copy.evidence.recordTitle
      }
      title={heading ?? lines?.primary ?? copy.evidence.recordTitle}
    >
      {evidence.status === "loading" && <RecordSkeleton />}
      {evidence.status === "error" && (
        <EvidenceError
          reason={evidence.error?.message ?? ""}
          onRetry={evidence.retry}
        />
      )}
      {evidence.status === "ready" &&
        (record ? (
          <EvidenceRecordScreen edition={edition} record={record} />
        ) : (
          <EvidenceRecordUnknown recordId={recordId} />
        ))}
    </PageFrame>
  );
}

/** §5.9 loading — two card skeletons, in the proportions of the cards themselves. */
function RecordSkeleton() {
  return (
    <div aria-busy="true" aria-label={copy.evidence.loading}>
      <div
        className="skeleton-block ev-skeleton-card"
        style={{ height: 260 }}
      />
      <div
        className="skeleton-block ev-skeleton-card"
        style={{ height: 200 }}
      />
    </div>
  );
}

/* ----------------------------------------------------------------- error */

/**
 * §5.8 error — inline, and scoped to what actually failed.
 *
 * The heading and the lede above this panel come from `edition.json`, which loaded;
 * only the record list did not. Saying so is the difference between "this screen is
 * broken" and "one file of it is missing", and it tells the reader that retrying
 * costs them nothing else on the page.
 */
function EvidenceError({
  reason,
  onRetry,
}: {
  reason: string;
  onRetry: () => void;
}) {
  return (
    <section className="state-panel">
      <h2>{copy.evidence.errorTitle}</h2>
      {reason !== "" && <code className="state-reason">{reason}</code>}
      <p>{copy.evidence.errorBody}</p>
      <div className="state-actions">
        <button type="button" className="primary-button" onClick={onRetry}>
          <RotateCw size={14} aria-hidden="true" />
          {copy.evidence.errorRetry}
        </button>
      </div>
    </section>
  );
}
