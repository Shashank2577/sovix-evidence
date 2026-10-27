/**
 * Methodology — `/methodology` (SPEC §5.11) — chunk C12.
 *
 * The trust document, and the one screen whose whole content is the edition talking
 * about itself. Every figure, sentence and legend below is read from `edition.json`
 * and rendered as it was written; what this module contributes is the order, the
 * headings, and the one-line gloss beside each threshold — the dataset states those
 * as a name and a number, and a number with no sentence beside it is a rule the
 * reader cannot check.
 *
 * Two passages are load-bearing and are printed exactly as given:
 *
 *   - **`llm_calls: 0`.** It gets its own stat and the standing line "No language
 *     model touches a calculation." A zero is the whole claim here, so it is stated
 *     as a figure rather than buried in a sentence about API usage.
 *   - **`governance_note`, verbatim.** The dataset's own statement about what
 *     per-person publication does to the people in it. §1.4's decision is that this
 *     build publishes no contributor scopes, and surfacing the note beside that
 *     decision is what makes the absence read as a stance rather than an omission.
 *     It is quoted, not summarised: it is the dataset's position, not ours.
 */

import { Info } from "lucide-react";
import { useMemo } from "react";

import { TierBadge } from "@/components/integrity";
import { Disclosure } from "@/components/working";
import * as copy from "@/copy";
import type {
  Confidence,
  Edition,
  ExclusionPath,
  Tier,
} from "@/data";
import { formatCount, formatLongDay } from "@/shell/format";

import { PageFrame } from "./PageFrame";
import "./methodology.css";

const TIER_ORDER: Tier[] = ["measured", "proxy", "inferred"];
const CONFIDENCE_ORDER: Confidence[] = ["high", "medium", "low"];

/** How many exclusion reasons stand in the open before the tail folds away. */
const EXCLUSION_ROWS_SHOWN = 12;
/** How many of the largest single files are listed. */
const EXCLUSION_PATHS_SHOWN = 12;

export function MethodologyScreen({ edition }: { edition: Edition }) {
  return (
    <PageFrame
      eyebrow={`Snapshot · ${formatLongDay(edition.generated_at)}`}
      title={copy.methodology.title}
      lede={copy.methodology.lede}
    >
      <div className="mt-measure">
        <HowItWasMade edition={edition} />
        <Legends edition={edition} />
        <StructuralLimits edition={edition} />
        <Exclusions edition={edition} />
        <Rulebook edition={edition} />
        <Governance edition={edition} />
        <CoverageNotes edition={edition} />
      </div>
    </PageFrame>
  );
}

function Section({
  index,
  heading,
  children,
}: {
  index: number;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-section">
      <div className="mt-section-head">
        <span className="mt-section-index">
          {String(index).padStart(2, "0")}
        </span>
        <h2>{heading}</h2>
      </div>
      {children}
    </section>
  );
}

/* ---------------------------------------------------- 01 how it was made */

function HowItWasMade({ edition }: { edition: Edition }) {
  const { collection } = edition;
  const identity = collection.identity_resolution;

  return (
    <Section index={1} heading={copy.methodology.madeHeading}>
      <p className="mt-lede">
        {copy.fill(copy.methodology.madeGeneratedAt, {
          day: formatLongDay(edition.generated_at),
        })}
      </p>

      <div className="mt-stats">
        <Stat
          label={copy.methodology.madeDuration}
          value={copy.fill(copy.methodology.madeDurationValue, {
            seconds: collection.duration_seconds,
          })}
        />
        <Stat
          label={copy.methodology.madeReposCollected}
          value={formatCount(collection.repos_collected)}
        />
        <Stat
          label={copy.methodology.madeReposFailed}
          value={formatCount(collection.repos_failed)}
        />
        <Stat
          label={copy.methodology.madeGraphql}
          value={formatCount(collection.graphql_calls)}
        />
        <Stat
          label={copy.methodology.madeRest}
          value={formatCount(collection.rest_calls)}
        />
      </div>

      {/*
        §5.11.1 asks for this one as its own highlighted stat. The figure is the
        argument: every number in this edition is arithmetic over records, and the
        zero is what says so.
      */}
      <div className="mt-llm" data-testid="llm-calls">
        <div className="mt-llm-figure">
          <strong>{formatCount(collection.llm_calls)}</strong>
          <span>{copy.methodology.llmLabel}</span>
        </div>
        <p className="mt-llm-standing">{copy.methodology.llmStanding}</p>
        <p className="mt-llm-cost">
          {copy.fill(copy.methodology.llmCost, {
            amount: `$${collection.llm_cost_usd}`,
          })}
        </p>
      </div>

      <h3 className="mt-subheading">{copy.methodology.identityHeading}</h3>
      <div className="mt-stats">
        <Stat
          label={copy.methodology.identityPeople}
          value={formatCount(identity.people)}
        />
        <Stat
          label={copy.methodology.identityBots}
          value={formatCount(identity.bots_excluded)}
        />
        <Stat
          label={copy.methodology.identityMerged}
          value={formatCount(identity.identities_merged)}
        />
      </div>

      {identity.merge_examples.length > 0 && (
        <Disclosure
          className="mt-disclosure"
          variant="plain"
          label={copy.fill(copy.methodology.identityMergesToggle, {
            count: identity.merge_examples.length,
          })}
          closeLabel={copy.methodology.identityMergesClose}
        >
          <ul
            className="mt-merges"
            aria-label={copy.methodology.identityMergeAria}
          >
            {identity.merge_examples.map(example => (
              <li key={example.person}>
                <strong>{example.person}</strong>
                <span>{example.emails.join("  ·  ")}</span>
              </li>
            ))}
          </ul>
        </Disclosure>
      )}
    </Section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-stat">
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

/* ------------------------------------------------- 02 tiers & confidence */

function Legends({ edition }: { edition: Edition }) {
  const { tier_legend, confidence_legend } = edition.data_quality;

  return (
    <Section index={2} heading={copy.methodology.legendHeading}>
      <p className="mt-lede">{copy.methodology.legendTierLead}</p>
      <dl className="mt-legend">
        {TIER_ORDER.map(tier => (
          <div className="mt-legend-row" key={tier}>
            <dt>
              {/* The same chip the figures carry — not a drawing of one. */}
              <TierBadge tier={tier} confidence="high" compact boxed />
            </dt>
            <dd>{tier_legend[tier]}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-lede">{copy.methodology.legendConfidenceLead}</p>
      <dl className="mt-legend">
        {CONFIDENCE_ORDER.map(level => (
          <div className="mt-legend-row" key={level}>
            <dt>
              <span className="mt-confidence-chip" data-confidence={level}>
                {copy.confidence[level]}
              </span>
            </dt>
            <dd>{confidence_legend[level]}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/* --------------------------------------------------- 03 structural limits */

function StructuralLimits({ edition }: { edition: Edition }) {
  const limits = edition.data_quality.structural_limits;

  return (
    <Section index={3} heading={copy.methodology.limitsHeading}>
      <p className="mt-lede">
        {copy.fill(copy.methodology.limitsLead, { count: limits.length })}
      </p>
      <div className="mt-limits">
        {limits.map(limit => (
          <article className="mt-limit" key={limit.title}>
            <h3>{limit.title}</h3>
            <p>{limit.detail}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------- 04 what was cut */

function Exclusions({ edition }: { edition: Edition }) {
  const { by_reason, lines_by_reason, total_lines_excluded, top_paths } =
    edition.exclusions;

  /* Ordered by lines, since lines are what an exclusion removes from a figure.
     Ordering is not a derivation of any published number (§9.2). */
  const reasons = useMemo(() => {
    return Object.keys(by_reason)
      .map(reason => ({
        reason,
        files: by_reason[reason],
        lines: lines_by_reason[reason] ?? 0,
      }))
      .sort((a, b) => b.lines - a.lines);
  }, [by_reason, lines_by_reason]);

  const shown = reasons.slice(0, EXCLUSION_ROWS_SHOWN);
  const rest = reasons.slice(EXCLUSION_ROWS_SHOWN);

  return (
    <Section index={4} heading={copy.methodology.exclusionsHeading}>
      <table className="mt-table mt-table--reasons">
        <thead>
          <tr>
            <th scope="col">{copy.methodology.exclusionsColumnReason}</th>
            <th scope="col">{copy.methodology.exclusionsColumnFiles}</th>
            <th scope="col">{copy.methodology.exclusionsColumnLines}</th>
          </tr>
        </thead>
        <tbody>
          {shown.map(row => (
            <ExclusionRow key={row.reason} {...row} />
          ))}
        </tbody>
      </table>

      {/*
        The tail folds, it is never dropped: 73 reasons is a long table and most of
        them are a single file type, but "every exclusion adds up" is only true if
        every one of them is here to be counted (§0.1).
      */}
      {rest.length > 0 && (
        <Disclosure
          className="mt-disclosure"
          variant="plain"
          label={copy.fill(copy.methodology.exclusionsMoreToggle, {
            count: rest.length,
          })}
          closeLabel={copy.methodology.exclusionsMoreClose}
        >
          <table className="mt-table mt-table--reasons">
            <tbody>
              {rest.map(row => (
                <ExclusionRow key={row.reason} {...row} />
              ))}
            </tbody>
          </table>
        </Disclosure>
      )}

      <p className="mt-total">
        {copy.fill(copy.methodology.exclusionsTotal, {
          lines: formatCount(total_lines_excluded),
        })}
      </p>

      <h3 className="mt-subheading">
        {copy.methodology.exclusionsPathsHeading}
      </h3>
      <ul className="mt-paths">
        {top_paths.slice(0, EXCLUSION_PATHS_SHOWN).map((path: ExclusionPath) => (
          <li key={path.path}>
            <code>{path.path}</code>
            <span>{formatCount(path.lines)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-caption">{copy.methodology.exclusionsCaption}</p>
    </Section>
  );
}

function ExclusionRow({
  reason,
  files,
  lines,
}: {
  reason: string;
  files: number;
  lines: number;
}) {
  return (
    <tr>
      <td>{reason}</td>
      <td className="mt-figure">
        {formatCount(files)}
        {/* Only visible once the columns stack; see methodology.css. */}
        <span className="mt-unit"> {copy.methodology.exclusionsUnitFiles}</span>
      </td>
      <td className="mt-figure">
        {formatCount(lines)}
        <span className="mt-unit"> {copy.methodology.exclusionsUnitLines}</span>
      </td>
    </tr>
  );
}

/* ---------------------------------------------------------- 05 rulebook */

function Rulebook({ edition }: { edition: Edition }) {
  const names = Object.keys(edition.thresholds);
  /* The ruleset the edition's rules were run under, as the headlines declare it. */
  const rulesets = useMemo(
    () =>
      edition.headlines
        .map(headline => headline.ruleset_version)
        .filter((id, index, all) => all.indexOf(id) === index),
    [edition.headlines]
  );

  return (
    <Section index={5} heading={copy.methodology.rulebookHeading}>
      <p className="mt-lede">{copy.methodology.rulebookLead}</p>

      <table className="mt-table mt-table--rules">
        <thead>
          <tr>
            <th scope="col">{copy.methodology.rulebookColumnName}</th>
            <th scope="col">{copy.methodology.rulebookColumnValue}</th>
            <th scope="col">{copy.methodology.rulebookColumnMeaning}</th>
          </tr>
        </thead>
        <tbody>
          {names.map(name => (
            <tr key={name}>
              <th scope="row">
                <code>{name}</code>
              </th>
              <td className="mt-figure">
                {formatCount(edition.thresholds[name])}
              </td>
              {/* A threshold with no gloss states nothing rather than a guess. */}
              <td>{copy.thresholdGloss[name] ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {rulesets.map(id => (
        <p className="mt-ruleset" key={id}>
          {copy.fill(copy.methodology.rulebookRuleset, { id })}
        </p>
      ))}
    </Section>
  );
}

/* -------------------------------------------------------- 06 governance */

function Governance({ edition }: { edition: Edition }) {
  return (
    <Section index={6} heading={copy.methodology.governanceHeading}>
      {/*
        Verbatim, in the quote treatment. This is the dataset speaking about what
        publishing per-person figures does to the people measured; paraphrasing it
        would be us deciding how strongly its own warning is put.
      */}
      <div className="evidence-quote mt-quote" data-testid="governance-note">
        <span className="quote-mark" aria-hidden="true">
          &ldquo;
        </span>
        <p>{edition.data_quality.governance_note}</p>
        <span className="quote-attribution">
          {copy.methodology.governanceAttribution}
        </span>
      </div>

      <div className="mt-stance">
        <strong>{copy.methodology.governanceStance}</strong>
        <p>{copy.methodology.governanceStanceDetail}</p>
      </div>
    </Section>
  );
}

/* ----------------------------------------------------- 07 coverage notes */

function CoverageNotes({ edition }: { edition: Edition }) {
  const { coverage, native_analytics } = edition.data_quality;

  const notes: string[] = [
    copy.fill(copy.methodology.coverageRepos, {
      collected: formatCount(coverage.repos_collected),
      failed: formatCount(coverage.repos_failed),
    }),
  ];

  const listed: [string, string[]][] = [
    [copy.methodology.coverageTruncated, coverage.pull_requests_truncated_in],
    [copy.methodology.coverageStructure, coverage.structure_scan_missing_in],
    [copy.methodology.coverageNoCi, coverage.no_ci_data_in],
    [copy.methodology.coverageNoReviews, coverage.no_review_records_in],
  ];
  for (const [template, repos] of listed) {
    /* An empty list is not a caveat: printing "missing in nothing" would be noise
       where the caveat boxes are supposed to be the things that need saying. */
    if (repos.length === 0) continue;
    notes.push(copy.fill(template, { list: repos.join(", ") }));
  }

  notes.push(
    copy.fill(copy.methodology.coverageGenerated, {
      lines: formatCount(coverage.total_lines_excluded_as_generated),
    })
  );

  if (native_analytics === null) {
    notes.push(copy.methodology.coverageNativeAnalytics);
  }

  return (
    <Section index={7} heading={copy.methodology.coverageHeading}>
      <div className="mt-notes">
        {notes.map(note => (
          <div className="caveat-box mt-note" key={note}>
            <Info size={15} strokeWidth={1.9} aria-hidden="true" />
            <p>{note}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
