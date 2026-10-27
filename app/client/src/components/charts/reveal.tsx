/**
 * Chart reveal (SPEC §8.5) — the fixed rule, in one place.
 *
 * The rule this file exists to enforce: **a chart never animates its data up from
 * zero.** A bar growing out of nothing draws a sequence of values nobody ever
 * observed, in a product whose whole claim is that every figure on screen is
 * defensible. So geometry is final from the first painted frame and the reveal is
 * purely presentational — a wipe that uncovers a truth already there.
 *
 * `prefers-reduced-motion` collapses the wipe to a plain opacity fade (§8.10).
 *
 * The wipe is driven from a motion value rather than declared with `whileInView`,
 * for a reason worth recording. Framer hands `clip-path` to the browser's
 * accelerated animation path, and when that animation finishes there is a single
 * frame where the style attribute repaints before the final value is committed —
 * a one-frame flash of a fully clipped, and therefore empty, chart at the end of
 * every reveal. Measured, not assumed: one frame at ~485ms of a 480ms wipe, on the
 * same DOM node, every time. Driving the value ourselves keeps it on the main
 * thread, where there is no handoff to flash through.
 */

import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  motion,
} from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

import { duration, ease } from "@/lib/motion";

/** Framer wants a mutable 4-tuple; `motion.ts` freezes its tokens with `as const`. */
export const easeOut = ease.out as unknown as [number, number, number, number];

/** §8.5 viewport rule: once, with a −10% margin so it fires just before the edge. */
export const REVEAL_VIEWPORT = { once: true, margin: "-10%" } as const;

export interface ChartRevealProps {
  children: ReactNode;
  className?: string;
  /** Skip the reveal — an already-revealed context, e.g. a re-render in a drawer. */
  disabled?: boolean;
}

export function ChartReveal({
  children,
  className,
  disabled = false,
}: ChartRevealProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, REVEAL_VIEWPORT);

  /** 0 = not yet revealed, 1 = fully revealed. */
  const progress = useMotionValue(disabled ? 1 : 0);
  const clipPath = useTransform(
    progress,
    value => `inset(0% ${(1 - value) * 100}% 0% 0%)`
  );

  useEffect(() => {
    if (disabled) {
      progress.set(1);
      return;
    }
    if (!inView) return;
    const controls = animate(
      progress,
      1,
      reduced ? { duration: 0.16 } : { duration: duration.chart, ease: easeOut }
    );
    return () => controls.stop();
  }, [disabled, inView, reduced, progress]);

  /*
    The observed element and the clipped element must not be the same element.
    A `clip-path` collapses the target's own intersection rectangle, so a chart
    waiting to be revealed is, as far as IntersectionObserver is concerned, a
    zero-width sliver — and whether that sliver counts as "in view" depends on
    where it happens to sit inside the −10% root margin. Measured: identical code
    revealed at 1440 and stayed permanently invisible at 780 and 390, because at
    the narrower widths the sliver fell outside the inset root. Observing an
    unclipped wrapper removes the circularity entirely.
  */
  return (
    <div ref={ref} className={className}>
      <motion.div
        className="chart-reveal-clip"
        style={reduced ? { opacity: progress } : { clipPath }}
      >
        {children}
      </motion.div>
    </div>
  );
}
