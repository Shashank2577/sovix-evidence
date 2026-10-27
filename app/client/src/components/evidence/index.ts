/**
 * The evidence surface (SPEC §5.8, §5.9) — C11.
 *
 * The bottom rung of the altitude ladder and the engineer's way in: 1,104 cited
 * records, and for each one every figure in the edition that counted it. One screen
 * is exported — `EvidenceScreen` owns both routes, because a record is a row of the
 * index and the two share one lazily fetched file.
 */

export { EvidenceScreen, type EvidenceScreenProps } from "./EvidenceScreen";
export {
  filterRecords,
  kindCounts,
  parseCitationFilter,
  repoOptions,
  unattachedCount,
  EMPTY_CONTROLS,
  KIND_ANY,
  REPO_ANY,
  REPO_NONE,
  type CitationFilter,
  type EvidenceControls,
} from "./filters";
export {
  KIND_ORDER,
  absoluteTime,
  citedLabel,
  distinctCitations,
  factKeys,
  factValue,
  humanKey,
  indexLede,
  kindCount,
  kindLabel,
  recordLines,
  recordTitle,
  relativeTime,
} from "./format";
export {
  INITIAL_ROWS,
  ROW_HEIGHT_COMPACT,
  ROW_HEIGHT_WIDE,
  useWindowRows,
} from "./useWindowRows";
