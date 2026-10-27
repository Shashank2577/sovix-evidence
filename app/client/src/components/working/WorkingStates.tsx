/**
 * What the working shows when it cannot yet show the working (SPEC §5.10 loading /
 * error, §4.2, §4.3).
 *
 * A deep link arrives before the scope file does, and the reader who followed it is
 * owed something honest in the meantime. Two rules shape all three states here:
 *
 *   1. **Never a plausible-looking number.** The skeleton shows the figure and its
 *      tier — because `edition.json` really does carry them, and the shell has
 *      already loaded it — and greys only the parts that are genuinely still in
 *      flight. It does not grey the value and then fill it in, which would make the
 *      reader wait for something we already had.
 *   2. **Never a dead end.** Failure states carry a retry and a close; the unknown
 *      metric names what was asked for rather than blaming the reader.
 */

import { CircleSlash, RotateCw, X } from "lucide-react";
import type { ElementType, ReactNode } from "react";

import { FloorFigure, TierBadge } from "@/components/integrity";
import type { MetricSummary } from "@/data";
import { cn } from "@/lib/utils";
import * as copy from "@/copy";

import type { WorkingVariant } from "./WorkingSections";

interface FrameProps {
  title: string;
  variant: WorkingVariant;
  onClose: () => void;
  titleAs?: ElementType;
  descriptionAs?: ElementType;
  /** Always a real sentence: it is the dialog's `aria-describedby` target. */
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

function Frame({
  title,
  variant,
  onClose,
  titleAs: Title = "h2",
  descriptionAs: Description = "p",
  description,
  children,
  footer,
}: FrameProps) {
  return (
    <div className={cn("wk-panel", `wk-panel--${variant}`)}>
      <header className="wk-head">
        <div className="wk-head__titles">
          <p className="wk-kicker">
            <span className="wk-live" aria-hidden="true" />
            {copy.working.kicker}
          </p>
          <Title className="wk-title">{title}</Title>
          <Description className="wk-scope">{description}</Description>
        </div>
        <button
          type="button"
          className="wk-close"
          onClick={onClose}
          aria-label={copy.working.closeIcon}
        >
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>
      <div className="wk-scroll">{children}</div>
      <footer className="wk-footer">
        <button
          type="button"
          className="wk-button wk-button--quiet"
          onClick={onClose}
        >
          {copy.working.close}
        </button>
        {footer}
      </footer>
    </div>
  );
}

/* ---------------------------------------------------------------- loading */

export interface WorkingSkeletonProps {
  /**
   * The metric's row from `edition.json`. Always present in practice — the shell
   * cannot have rendered without the edition — so the label, the figure and the
   * tier are real from the first frame and only the working itself is pending.
   */
  summary?: MetricSummary;
  metricId: string;
  variant: WorkingVariant;
  onClose: () => void;
  titleAs?: ElementType;
  descriptionAs?: ElementType;
}

export function WorkingSkeleton({
  summary,
  metricId,
  variant,
  onClose,
  titleAs,
  descriptionAs,
}: WorkingSkeletonProps) {
  return (
    <Frame
      title={summary?.label ?? metricId}
      variant={variant}
      onClose={onClose}
      titleAs={titleAs}
      descriptionAs={descriptionAs}
      description={copy.working.loading}
    >
      <div className="wk-value-row" data-testid="working-skeleton">
        {summary && !summary.isNA && (
          <FloorFigure
            className="wk-value"
            display={summary.display}
            metricId={metricId}
          />
        )}
        {summary?.isNA && (
          <span className="wk-value wk-value--na">
            <CircleSlash size={15} strokeWidth={1.75} aria-hidden="true" />
            {copy.notAvailable.label}
          </span>
        )}
        {summary && (
          <TierBadge
            tier={summary.tier}
            confidence={summary.confidence}
            boxed
          />
        )}
      </div>

      {/* Three rects for the three sections that carry the most height. The pulse
          freezes at 0.7 opacity under reduced motion — the CSS, not a prop (§8.10). */}
      <div className="wk-skeleton" aria-hidden="true">
        <span className="wk-skeleton__rect wk-skeleton__rect--short" />
        <span className="wk-skeleton__rect" />
        <span className="wk-skeleton__rect" />
        <span className="wk-skeleton__rect wk-skeleton__rect--tall" />
      </div>
      <p className="sr-only" role="status">
        {copy.working.loading}
      </p>
    </Frame>
  );
}

/* ------------------------------------------------------------------ error */

export function WorkingError({
  metricId,
  reason,
  variant,
  onClose,
  onRetry,
  titleAs,
  descriptionAs,
}: {
  metricId: string;
  reason: string;
  variant: WorkingVariant;
  onClose: () => void;
  onRetry: () => void;
  titleAs?: ElementType;
  descriptionAs?: ElementType;
}) {
  return (
    <Frame
      title={copy.working.errorTitle}
      variant={variant}
      onClose={onClose}
      titleAs={titleAs}
      descriptionAs={descriptionAs}
      description={metricId}
      footer={
        <button
          type="button"
          className="wk-button wk-button--primary"
          onClick={onRetry}
        >
          <RotateCw size={14} strokeWidth={2} aria-hidden="true" />
          {copy.working.errorRetry}
        </button>
      }
    >
      {/* The reason verbatim: "HTTP 404" and "the network went away" are different
          problems, and collapsing them into one sentence helps nobody (§4.2). */}
      <p className="wk-state-reason">{reason}</p>
    </Frame>
  );
}

/* ---------------------------------------------------------------- unknown */

export function WorkingUnknown({
  metricId,
  variant,
  onClose,
  titleAs,
  descriptionAs,
}: {
  metricId: string;
  variant: WorkingVariant;
  onClose: () => void;
  titleAs?: ElementType;
  descriptionAs?: ElementType;
}) {
  return (
    <Frame
      title={copy.working.unknownTitle}
      variant={variant}
      onClose={onClose}
      titleAs={titleAs}
      descriptionAs={descriptionAs}
      description={metricId}
    >
      <p className="wk-state-reason">
        {copy.fill(copy.working.unknownBody, { metricId })}
      </p>
    </Frame>
  );
}
