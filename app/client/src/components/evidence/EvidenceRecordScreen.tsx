/**
 * The evidence record — `/evidence/:recordId` (SPEC §5.9).
 *
 * One commit, pull request, file, release, branch or collection, and everything it
 * proves. This is the inversion the product is built on: everywhere else a figure
 * produces its evidence, and here a record names its figures. An engineer who finds
 * their own pull request can read, in one card, every reading in the edition that
 * counted it and what each one made of it.
 *
 * Two rules shape the card more than anything else on this screen:
 *
 *   - **It links out.** Every record that exists on GitHub carries a primary button
 *     to it — the product's spine is that a reader can always leave and check. The
 *     ten collection records have no address out there, and they say so rather than
 *     offering a button that goes nowhere.
 *   - **It names work, never a person's standing.** `values.author` renders as a
 *     fact of the record, in the same typeface as `lines` and `reviews`, and is not
 *     a link to anything: there are no contributor pages in this build and this
 *     screen is not the back door into one (§1.4).
 */

import { motion, useReducedMotion } from "framer-motion";
import { CircleSlash, ExternalLink, Hash } from "lucide-react";
import { Link } from "wouter";

import {
  EVIDENCE_PATH,
  scopeBasePath,
  scopeTabPath,
  withWorking,
} from "@/app/routes";
import { targetForKey } from "@/app/scope";
import { FloorFigure, TierBadge } from "@/components/integrity";
import type {
  Edition,
  EvidenceCitation,
  EvidenceRecord,
  MetricSummary,
} from "@/data";
import { duration, ease } from "@/lib/motion";
import { formatCount } from "@/shell/format";
import * as copy from "@/copy";

import { KIND_ICON } from "./EvidenceRow";
import {
  absoluteTime,
  distinctCitations,
  factKeys,
  factValue,
  humanKey,
  kindLabel,
  recordLines,
  recordTitle,
  relativeTime,
} from "./format";

export interface EvidenceRecordScreenProps {
  edition: Edition;
  record: EvidenceRecord;
}

export function EvidenceRecordScreen({
  edition,
  record,
}: EvidenceRecordScreenProps) {
  const Icon = KIND_ICON[record.kind];
  const { primary, secondary } = recordLines(record);
  const keys = factKeys(record);
  /*
   * The heading above this card is the record's title where it has one, and its
   * `repo ref` or its `detail` sentence where it does not (see `EvidenceScreen`).
   * The card carries what the heading did not, rather than echoing it: a titled
   * pull request needs its reference stated, a branch named by its reference needs
   * its sentence, and a collection record whose sentence *is* the heading needs
   * neither. The same three facts are on screen either way, each once.
   */
  const showRef = recordTitle(record) !== null && Boolean(record.repo);
  const citations = orderCitations(edition, distinctCitations(record));
  /* §8.10 — the transform collapses to an opacity fade under reduced motion. The
     app-wide `MotionConfig` lands in C14; this holds the rule until it does. */
  const reduced = useReducedMotion();

  return (
    <>
      {/* Card 1 — the record (§5.9). */}
      <section className="ev-card">
        <div className="ev-card__head">
          <span className={`ev-kind ev-kind--${record.kind}`}>
            {Icon && <Icon size={12} strokeWidth={1.9} />}
            {kindLabel(record.kind, 1)}
          </span>
          {showRef && <span className="ev-card__ref">{primary}</span>}
          {record.occurred_at && (
            <time
              className="ev-card__when"
              dateTime={record.occurred_at}
              title={absoluteTime(record.occurred_at)}
            >
              {relativeTime(record.occurred_at)} ·{" "}
              {absoluteTime(record.occurred_at)}
            </time>
          )}
          {!record.occurred_at && (
            <span className="ev-card__when ev-card__when--none">
              {copy.evidence.undated}
            </span>
          )}
        </div>

        {secondary && <p className="ev-card__detail">{secondary}</p>}

        {keys.length > 0 && (
          <>
            <h2 className="section-kicker ev-card__kicker">
              {copy.evidence.recordFactsHeading}
            </h2>
            {/*
             * Whatever keys the record has, rendered as they come (§5.9). No key is
             * dropped for being unrecognised — an unfamiliar key is still something
             * the collector wrote down, and this screen is where a reader goes when
             * they want all of it.
             */}
            <dl className="ev-facts">
              {keys.map(key => (
                <div key={key} className="ev-facts__row">
                  <dt>{humanKey(key)}</dt>
                  <dd>{factValue(record.values[key])}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        {record.url ? (
          <a
            className="primary-button ev-card__out"
            href={record.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={copy.fill(copy.evidence.recordOpenAria, {
              ref: primary,
            })}
          >
            {copy.evidence.recordOpen}
            <ExternalLink size={13} strokeWidth={2} aria-hidden="true" />
          </a>
        ) : (
          <p className="ev-card__nolink">{copy.evidence.recordNoLink}</p>
        )}
      </section>

      {/* Card 2 — counted in (§5.9). The reverse index, made visible. */}
      <motion.section
        className="ev-card ev-cited"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
        whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{
          duration: reduced ? 0.16 : duration.slow,
          ease: ease.out,
        }}
      >
        <div className="ev-card__head ev-card__head--stacked">
          <div>
            <span className="section-kicker">{copy.evidence.citedHeading}</span>
            <h2 className="ev-cited__title">
              {copy.fill(
                citations.length === 1
                  ? copy.evidence.citedFiguresOne
                  : copy.evidence.citedFigures,
                { count: formatCount(citations.length) }
              )}
            </h2>
          </div>
          <p className="ev-cited__lede">
            {citations.length === 1
              ? copy.evidence.citedLedeOne
              : copy.evidence.citedLede}
          </p>
        </div>

        <ul className="ev-cite-list">
          {citations.map(citation => (
            <CitationRow
              key={`${citation.scopeKey}|${citation.metricId}`}
              edition={edition}
              citation={citation}
            />
          ))}
        </ul>
      </motion.section>
    </>
  );
}

/* --------------------------------------------------------------- citations */

interface OrderedCitation extends EvidenceCitation {
  metricLabel: string;
  scopeLabel: string;
  summary: MetricSummary | undefined;
}

/**
 * Scope order first, then the catalog's own metric order.
 *
 * Not a ranking, and deliberately not one: sorting by anything that varied per
 * record — weight, share, recency — would turn a list of what counted a record into
 * a claim about which counting mattered most. The order here is the edition's own
 * and is the same for every record, so the 161 citations on a collection record read
 * as a structure rather than as a chart.
 */
function orderCitations(
  edition: Edition,
  citations: EvidenceCitation[]
): OrderedCitation[] {
  const scopeRank = new Map(edition.scopeOrder.map((key, i) => [key, i]));
  const metricRank = new Map(
    edition.metricCatalog.map((entry, i) => [entry.id, i])
  );

  return citations
    .map(citation => {
      const summary = edition.scopeSummaries[citation.scopeKey];
      const entry = edition.metricCatalog.find(
        item => item.id === citation.metricId
      );
      return {
        ...citation,
        metricLabel: entry?.label ?? citation.metricId,
        scopeLabel: summary?.scope.label ?? citation.scopeKey,
        summary: summary?.metrics.find(
          metric => metric.id === citation.metricId
        ),
      };
    })
    .sort((a, b) => {
      const scopes =
        (scopeRank.get(a.scopeKey) ?? Number.MAX_SAFE_INTEGER) -
        (scopeRank.get(b.scopeKey) ?? Number.MAX_SAFE_INTEGER);
      if (scopes !== 0) return scopes;
      return (
        (metricRank.get(a.metricId) ?? Number.MAX_SAFE_INTEGER) -
        (metricRank.get(b.metricId) ?? Number.MAX_SAFE_INTEGER)
      );
    });
}

/**
 * One citation: what counted this record, where, and what it read there.
 *
 * Three targets, in the order a reader needs them: the metric's own page, the figure
 * itself, and ⌗ for the working — the same affordance, at the same scope, that the
 * figure carries everywhere else in the product (§1.1). The ⌗ link is built against
 * the *citation's* scope rather than the current route, because the drawer is bound
 * to the scope in the URL and opening it here at the wrong one would show a reader a
 * different sample than the one that counted this record.
 */
function CitationRow({
  edition,
  citation,
}: {
  edition: Edition;
  citation: OrderedCitation;
}) {
  const target = targetForKey(edition, citation.scopeKey);
  const summary = citation.summary;

  return (
    <li className="ev-cite">
      <Link
        className="ev-cite__body"
        href={scopeTabPath(target, "metrics", citation.metricId)}
        aria-label={copy.fill(copy.evidence.citedMetricAria, {
          metric: citation.metricLabel,
          scope: citation.scopeLabel,
        })}
      >
        <span className="ev-cite__label">{citation.metricLabel}</span>
        <span className="ev-cite__scope">{citation.scopeLabel}</span>
      </Link>

      <span className="ev-cite__reading">
        {summary === undefined ? null : summary.isNA ? (
          /*
           * §6.4's chip, spelled here rather than through `NotAvailable`: that
           * primitive takes a full `Metric` (it derives the reason sentence from the
           * caveats), and this screen holds only the edition's summaries. The rule it
           * carries is what matters and is kept exactly — words, not a figure, never
           * a `0` or a dash — and the reason is one ⌗ away, where the reading's own
           * caveats are.
           */
          <span className="not-available not-available--chip" data-na="true">
            <span className="not-available__figure">
              <CircleSlash
                className="not-available__icon"
                size={12}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="not-available__label">
                {copy.notAvailable.label}
              </span>
            </span>
          </span>
        ) : (
          <FloorFigure
            display={summary.display}
            metricId={citation.metricId}
            className="ev-cite__value"
          />
        )}
        {summary && (
          <TierBadge
            tier={summary.tier}
            confidence={summary.confidence}
            compact
            className="ev-cite__tier"
          />
        )}
      </span>

      <Link
        className="wk-trigger wk-trigger--icon ev-cite__working"
        href={withWorking(scopeBasePath(target), citation.metricId)}
        aria-label={copy.fill(copy.evidence.citedWorkingAria, {
          metric: citation.metricLabel,
          scope: citation.scopeLabel,
        })}
      >
        <Hash size={13} strokeWidth={2.2} aria-hidden="true" />
      </Link>
    </li>
  );
}

/* ------------------------------------------------------------- unknown id */

/** §5.9 — the id is well-formed but this edition carries no such record. */
export function EvidenceRecordUnknown({ recordId }: { recordId: string }) {
  return (
    <section className="state-panel">
      <h2>{copy.evidence.unknownTitle}</h2>
      <code className="state-reason">{recordId}</code>
      <p>{copy.evidence.unknownBody}</p>
      <div className="state-actions">
        <Link href={EVIDENCE_PATH} className="primary-button">
          {copy.evidence.unknownSearch}
        </Link>
      </div>
    </section>
  );
}
