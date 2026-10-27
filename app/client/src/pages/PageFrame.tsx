/**
 * The page frame every screen opens with (SPEC §5, §8.2).
 *
 * Eyebrow, Fraunces h1 with its accent full stop, and an optional lede — the
 * heading block C2 established on the placeholder screens. It lives in its own
 * module rather than inside one screen so that every screen shares one heading
 * instead of six near-copies drifting apart.
 */

import type { ReactNode } from "react";

export function PageFrame({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <div className="content-wrap">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" aria-hidden="true" />
            {eyebrow}
          </div>
          <h1>
            {title}
            <span className="title-period">.</span>
          </h1>
          {lede && <p className="heading-lede">{lede}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
