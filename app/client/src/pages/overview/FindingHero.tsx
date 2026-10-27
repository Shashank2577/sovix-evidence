/**
 * The finding hero — SPEC §5.1.3, both variants.
 *
 * The strongest finding in this scope's subtree, or, where the rulebook ran and
 * nothing fired, the same periwinkle panel saying so and naming the rule that came
 * nearest. The empty variant is not a fallback: "no threshold fired here" is a
 * result, and a scope that produced it deserves the same real estate as one that
 * did not (§4.3).
 *
 * Two things the populated variant needs that `edition.json` cannot carry:
 *
 * The **strongest exemplar** belongs to the finding's own scope. At the
 * organisation the hero is usually a repository's finding, and the exemplar of the
 * org-level reading of the same metric is a different record over a different
 * sample. Showing it would be the silent evidence-swap §5.10 forbids, so the
 * finding's scope report is fetched and the stat waits in a reserved slot until it
 * arrives rather than shifting the pager when it does.
 *
 * And **"Inspect the evidence"** opens the working at the finding's scope, not the
 * one being read: `?working=` is scoped by the route it sits on (§1.3), so the link
 * carries both.
 */

import { ArrowUpRight, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";

import {
  METHODOLOGY_PATH,
  evidenceRecordPath,
  scopeBasePath,
  withWorking,
} from "@/app/routes";
import { targetForKey, type ResolvedScope } from "@/app/scope";
import { FloorFigure } from "@/components/integrity";
import * as copy from "@/copy";
import {
  useScope,
  type Edition,
  type Exemplar,
  type Headline,
  type NearestThreshold,
  type ScopeFacts,
} from "@/data";
import { duration, ease } from "@/lib/motion";
import { formatCount } from "@/shell/format";

import { heroFindings } from "./derive";

/**
 * §5.1.3: "crossfade 200 ms, no slide". Out then in, and the exit is the shorter
 * of the two — §8.4's rule that an exit is never slower than the entrance that
 * replaces it.
 */
const CROSSFADE_OUT = 0.08;

/** The first sentence of the dataset's `detail`, kept whole (§5.1.3). */
export function firstSentence(detail: string): string {
  const match = detail.match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (match ? match[0] : detail).trim();
}

/**
 * The scope's name, bolded wherever the dataset's own sentence says it (§5.1.3).
 * The sentence is rendered verbatim either way; this only marks it up.
 */
function withScopeBolded(sentence: string, scopeLabel: string) {
  const index = sentence.indexOf(scopeLabel);
  if (index === -1) return sentence;
  return (
    <>
      {sentence.slice(0, index)}
      <strong>{scopeLabel}</strong>
      {sentence.slice(index + scopeLabel.length)}
    </>
  );
}

export interface FindingHeroProps {
  edition: Edition;
  scope: ResolvedScope;
  facts: ScopeFacts;
}

export function FindingHero({ edition, scope, facts }: FindingHeroProps) {
  const findings = heroFindings(edition, scope.summary);
  const [index, setIndex] = useState(0);

  /* A scope change re-seeds the pager; the hero is about this scope, not the last. */
  useEffect(() => setIndex(0), [scope.key]);

  const step = useCallback(
    (delta: number) => {
      if (findings.length < 2) return;
      setIndex(
        current => (current + delta + findings.length) % findings.length
      );
    },
    [findings.length]
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  };

  const finding = findings[index];

  return (
    <section
      className="ov-hero"
      tabIndex={findings.length > 1 ? 0 : -1}
      onKeyDown={findings.length > 1 ? onKeyDown : undefined}
      aria-label={findings.length > 1 ? copy.overview.heroGroupAria : undefined}
    >
      {/* The crossfade is on the panel itself (§5.1.3: 200 ms, no slide). Wrapping
          it in a `display: contents` node would leave opacity with nothing to act
          on, so the grid *is* the animated element. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={finding ? `${finding.scope_key}|${finding.metric_id}` : "empty"}
          className="finding-hero"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: duration.fast, ease: ease.out },
          }}
          exit={{
            opacity: 0,
            transition: { duration: CROSSFADE_OUT, ease: ease.out },
          }}
        >
          {finding ? (
            <PopulatedHero
              edition={edition}
              finding={finding}
              index={index}
              total={findings.length}
              onStep={step}
            />
          ) : (
            <EmptyHero edition={edition} scope={scope} facts={facts} />
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------- populated */

function PopulatedHero({
  edition,
  finding,
  index,
  total,
  onStep,
}: {
  edition: Edition;
  finding: Headline;
  index: number;
  total: number;
  onStep: (delta: number) => void;
}) {
  const findingTarget = targetForKey(edition, finding.scope_key);
  const findingSlug = edition.slugByKey[finding.scope_key] ?? null;
  const scopeLabel =
    edition.scopeSummaries[finding.scope_key]?.scope.label ?? finding.scope_key;
  const findingPath = scopeBasePath(findingTarget);

  /* The reading's own scope, for the exemplar. Cached, and the same file the
     reader lands in the moment they follow either call to action. */
  const report = useScope(findingSlug);
  const metric = report.data?.metrics.find(
    entry => entry.id === finding.metric_id
  );
  const exemplar = metric?.exemplars.find(entry => entry.rank === 1) ?? null;

  const metricLabel =
    metric?.label ??
    edition.metricCatalog.find(entry => entry.id === finding.metric_id)
      ?.label ??
    finding.metric_id;

  return (
    <>
      <div className="finding-main">
        <div className="finding-label">
          <span
            className={`critical-bullet ov-bullet--${finding.severity}`}
            aria-hidden="true"
          />
          {copy.fill(copy.overview.heroSeverity, {
            severity: copy.severity[finding.severity],
          })}
          <span className="finding-rule">
            {copy.fill(copy.overview.heroRule, {
              ruleset: finding.ruleset_version,
            })}
          </span>
          <Link href={findingPath} className="ov-hero-scope">
            {scopeLabel}
          </Link>
        </div>
        <h2>{finding.title}.</h2>
        <p>{withScopeBolded(firstSentence(finding.detail), scopeLabel)}</p>
        <div className="finding-actions">
          <Link
            href={withWorking(findingPath, finding.metric_id)}
            className="dark-button"
          >
            {copy.overview.heroInspect}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <Link href={findingPath} className="text-button">
            {copy.fill(copy.overview.heroOpenScope, { scope: scopeLabel })}
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="finding-aside">
        <div className="finding-stat">
          <span>{metricLabel}</span>
          <strong>
            <FloorFigure
              display={finding.value_display}
              metricId={finding.metric_id}
            />
          </strong>
          <small>
            {copy.fill(copy.overview.heroStatRule, {
              comparison: finding.rule_comparison,
              threshold: finding.rule_threshold,
              ruleset: finding.ruleset_version,
            })}
          </small>
        </div>

        <div className="finding-stat-divider" aria-hidden="true" />

        <div className="finding-stat ov-hero-stat-slot">
          <span>{copy.overview.heroExemplarLabel}</span>
          {exemplar ? (
            <>
              <ExemplarStat exemplar={exemplar} />
              <small>{exemplar.source.detail}</small>
            </>
          ) : report.status === "ready" ? (
            <small>{copy.overview.heroExemplarNone}</small>
          ) : (
            <span className="ov-hero-pending" aria-hidden="true" />
          )}
        </div>

        {total > 1 && (
          <div className="finding-foot">
            <span
              className="finding-index"
              aria-label={copy.fill(copy.overview.heroPagerAria, {
                index: index + 1,
                total,
              })}
            >
              {String(index + 1).padStart(2, "0")}{" "}
              <span>/ {String(total).padStart(2, "0")}</span>
            </span>
            <span className="finding-nav">
              <button
                type="button"
                aria-label={copy.overview.heroPrev}
                onClick={() => onStep(-1)}
              >
                ←
              </button>
              <button
                type="button"
                aria-label={copy.overview.heroNext}
                onClick={() => onStep(1)}
              >
                →
              </button>
            </span>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * The exemplar, named by whatever identifies it.
 *
 * Most exemplars are a commit, a pull request, a branch or a file, and the honest
 * thing to show is the ref you can open on GitHub. Some are not: an exemplar of a
 * bus factor or a weekend share is a fact derived across the whole repository, and
 * the dataset gives it a `dataset` kind, no URL, and a synthetic ref that means
 * nothing to a reader. Those show their weight instead, and lead to the evidence
 * record where one exists — the figure is still one click from what produced it,
 * which is the promise; the GitHub link is only the usual way of keeping it.
 */
function ExemplarStat({ exemplar }: { exemplar: Exemplar }) {
  const { source } = exemplar;

  if (source.url) {
    return (
      <a
        className="ov-hero-exemplar"
        href={source.url}
        target="_blank"
        rel="noreferrer"
      >
        {source.ref}
      </a>
    );
  }

  const weight = formatCount(exemplar.weight);
  if (source.evidenceId) {
    return (
      <Link
        className="ov-hero-exemplar"
        href={evidenceRecordPath(source.evidenceId)}
      >
        {weight}
      </Link>
    );
  }
  return <strong className="ov-hero-exemplar">{weight}</strong>;
}

/* ----------------------------------------------------------------- empty */

function EmptyHero({
  edition,
  scope,
  facts,
}: {
  edition: Edition;
  scope: ResolvedScope;
  facts: ScopeFacts;
}) {
  const nearest: NearestThreshold | null = scope.summary.nearestThreshold;
  const ruleset =
    edition.headlines[0]?.ruleset_version ?? edition.schema_version;

  return (
    <>
      <div className="finding-main">
        <div className="finding-label">
          <span
            className="critical-bullet ov-bullet--none"
            aria-hidden="true"
          />
          {copy.overview.heroEmptyLabel}
        </div>
        <h2>{copy.overview.heroEmptyTitle}</h2>
        <p>
          {nearest
            ? copy.fill(copy.overview.heroEmptyBody, {
                ruleset,
                label: nearest.label,
                display: nearest.display,
                comparison: nearest.comparison,
                threshold: nearest.threshold,
              })
            : copy.fill(copy.overview.heroEmptyBodyNone, { ruleset })}
        </p>
        <div className="finding-actions">
          {nearest && (
            <Link
              href={withWorking(scope.path, nearest.metricId)}
              className="dark-button"
            >
              {copy.overview.heroEmptyOpenNearest}
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          )}
          <Link href={METHODOLOGY_PATH} className="text-button">
            {copy.overview.heroEmptyOpenMethodology}
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="finding-aside">
        <div className="ov-hero-empty-facts">
          <div>
            <span>{copy.overview.heroFactCommits}</span>
            <strong>{formatCount(facts.commits)}</strong>
          </div>
          <div>
            <span>{copy.overview.heroFactPullRequests}</span>
            <strong>{formatCount(facts.pull_requests)}</strong>
          </div>
          <div>
            <span>{copy.overview.heroFactContributors}</span>
            <strong>{formatCount(facts.contributors)}</strong>
          </div>
        </div>
      </div>
    </>
  );
}
