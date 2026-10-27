/**
 * 05 Source records (SPEC §5.10.8, §6.11).
 *
 * The end of the chain. Above this row a reader has the formula, the sample and the
 * exclusions; this is the actual pull request, on GitHub, that the figure counted.
 * If a number cannot produce one of these, it does not get published — so the row's
 * job is to make the last step trivial rather than to summarise it.
 *
 * **Two destinations, two tab stops** (§6.11). The row body goes to this edition's
 * evidence record — what we recorded, and every other figure that counted the same
 * artefact. The ↗ goes to GitHub — the artefact itself, outside our claims entirely.
 * Those are different questions and merging them into one target would force the
 * reader to guess which one they were about to get.
 *
 * Both are real anchors, so middle-click, ⌘-click and "copy link" all behave.
 */

import {
  Database,
  ExternalLink,
  FileCode2,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Tag,
} from "lucide-react";
import type { ComponentType } from "react";
import { Link } from "wouter";

import { evidenceRecordPath } from "@/app/routes";
import type { SourceKind, SourceRecord } from "@/data";
import { cn } from "@/lib/utils";
import * as copy from "@/copy";

const KIND_ICON: Record<
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

/**
 * What the two lines of a row say.
 *
 * A third of this edition's source records are `dataset` kind: an aggregate the
 * collector computed rather than an artefact sitting on GitHub. Those carry no
 * `repo` and no `url`, and their `ref` is an internal handle
 * (`"repo:repo:fastapi/fastapi"`) that means nothing to a reader — so for them the
 * `detail` sentence *is* the record, and it takes the top line instead of being
 * demoted under a heading built out of nulls.
 *
 * Note the runtime shape is wider than `SourceRecord` declares: `repo` and `url` are
 * typed `string` but are `null` on all 1,456 dataset records. The guards below are
 * against the data, not against the type.
 */
export function sourceLines(source: SourceRecord): {
  primary: string;
  secondary: string | null;
} {
  const linkable = Boolean(source.repo) && Boolean(source.url);
  return linkable
    ? { primary: `${source.repo} ${source.ref}`, secondary: source.detail }
    : { primary: source.detail, secondary: null };
}

export interface SourceRecordRowProps {
  source: SourceRecord;
  /**
   * Called after the evidence link is followed — the drawer uses it to shut itself,
   * since the reader has left the page the drawer was covering (§5.10.9).
   */
  onOpenRecord?: (evidenceId: string) => void;
  className?: string;
}

export function SourceRecordRow({
  source,
  onOpenRecord,
  className,
}: SourceRecordRowProps) {
  const Icon = KIND_ICON[source.kind] ?? Database;
  const { primary, secondary } = sourceLines(source);

  const body = (
    <>
      <span
        className={cn("wk-source__icon", `wk-source__icon--${source.kind}`)}
      >
        <Icon size={15} strokeWidth={1.9} />
      </span>
      <span className="wk-source__text">
        <span
          className={cn("wk-source__ref", !secondary && "wk-source__ref--wrap")}
        >
          {primary}
        </span>
        {secondary && <span className="wk-source__detail">{secondary}</span>}
      </span>
    </>
  );

  return (
    <li className={cn("wk-source", className)} data-testid="working-source">
      {/*
       * An exemplar's source can sit outside the evidence index (it was cited for
       * its prose, not counted), and then there is no record page to open. The row
       * stays — the artefact is still real and the ↗ still reaches it — it simply
       * is not a link to a page that does not exist.
       */}
      {source.evidenceId ? (
        <Link
          className="wk-source__body"
          href={evidenceRecordPath(source.evidenceId)}
          aria-label={copy.fill(copy.working.sourceOpenRecord, {
            ref: primary,
          })}
          onClick={() => onOpenRecord?.(source.evidenceId!)}
        >
          {body}
        </Link>
      ) : (
        <span className="wk-source__body wk-source__body--static">{body}</span>
      )}

      {/*
       * No URL, no ↗. An anchor without an href is an icon that looks like a way
       * out and isn't one — and on a surface whose promise is "here is the actual
       * record", a link-shaped thing that goes nowhere is the worst possible
       * affordance. A dataset aggregate has no page on GitHub, so the row says so
       * by not offering one.
       */}
      {source.url && (
        <a
          className="wk-source__external"
          href={source.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={copy.fill(copy.working.sourceOpenExternal, {
            ref: primary,
          })}
        >
          <ExternalLink size={14} strokeWidth={1.9} aria-hidden="true" />
        </a>
      )}
    </li>
  );
}
