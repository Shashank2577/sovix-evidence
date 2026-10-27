/**
 * Window virtualization for the evidence list (SPEC §5.8).
 *
 * 1,104 rows of card markup mounted at once is the jank this screen was specified
 * to avoid: on a mid-tier phone the layout pass alone costs more than a frame, and
 * every subsequent scroll pays style recalculation on a thousand subtrees it cannot
 * see. So only the rows inside the viewport (plus a small overscan) are mounted, and
 * a spacer of the full list height keeps the scrollbar honest.
 *
 * **Why this rather than `@tanstack/react-virtual`**, which §5.8 names as the one
 * allowed new dependency: the package is not installed in this workspace, and
 * installing it would rewrite a `node_modules` tree that several agents are building
 * against concurrently. Fixed-height rows need none of what the library is good at
 * (dynamic measurement, sticky items, horizontal lists) — the whole mechanism is the
 * forty lines below. If a later chunk needs measured rows, swapping this hook for
 * the library is a local change: nothing outside it knows how the range is decided.
 *
 * **Why the window rather than an inner scroll container**: the page scrolls, and a
 * nested scroller inside it would break the shell's scroll-to-top on navigation,
 * strand the mobile URL bar, and give C13's pull-to-refresh a second scroll origin
 * to fight with. The list stays part of the document.
 *
 * Scroll work per frame: one `getBoundingClientRect`, two divisions, and a state
 * write only when the visible range actually changes — which is once every
 * `rowHeight` pixels, not once per scroll event.
 */

import { useEffect, useRef, useState, type RefObject } from "react";

export interface RowRange {
  start: number;
  /** Exclusive. */
  end: number;
}

/**
 * Rows rendered before the first measurement — which is what a server render and
 * the first paint get. Enough to fill a tall viewport, few enough that the initial
 * mount is cheap and a test can prove the other thousand are absent.
 */
export const INITIAL_ROWS = 24;

/**
 * Rows per step of the window, and the reason this hook keeps 60fps on a throttled
 * phone rather than merely mounting fewer rows.
 *
 * Recomputing the range to the exact row means React re-renders the list every time
 * the scroll crosses one row boundary — at a flick's speed, every single frame, and
 * a render on every frame is precisely the budget this screen does not have. Quantized
 * to a block, the window moves once every eight rows: roughly seven frames in eight
 * do no React work at all, and the browser is left to do the one thing it is good at,
 * which is scrolling a page whose content did not change.
 *
 * A block of overscan at each end covers the span between updates, so nothing blank
 * is ever on screen.
 */
const BLOCK = 8;

export function useWindowRows(
  count: number,
  rowHeight: number
): { listRef: RefObject<HTMLDivElement | null>; range: RowRange } {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [range, setRange] = useState<RowRange>({
    start: 0,
    end: Math.min(count, INITIAL_ROWS),
  });

  useEffect(() => {
    let frame = 0;
    /* The list's offset within the document, cached: reading an element's rect on
       every scroll frame forces the layout React has just invalidated, which is the
       other half of the per-frame cost. `window.scrollY` needs no layout at all. */
    let offsetTop = 0;

    const remeasureOffset = () => {
      const element = listRef.current;
      if (element)
        offsetTop = element.getBoundingClientRect().top + window.scrollY;
    };

    const measure = () => {
      frame = 0;
      if (listRef.current === null) return;

      /* Distance the list's top edge has travelled above the viewport. Negative
         while the list is still below the fold, which clamps to row 0. */
      const scrolled = window.scrollY - offsetTop;
      const viewport = window.innerHeight;

      const firstRow = Math.floor(scrolled / rowHeight);
      const lastRow = Math.ceil((scrolled + viewport) / rowHeight);
      const start = Math.max(0, (Math.floor(firstRow / BLOCK) - 1) * BLOCK);
      const end = Math.min(count, (Math.ceil(lastRow / BLOCK) + 1) * BLOCK);

      setRange(previous => {
        if (previous.start === start && previous.end === end) return previous;
        /* The window only moves every few hundred pixels, so this is the cheap
           moment to correct a cached offset that a reflow above the list — a
           wrapped chip row, a banner appearing — may have moved. */
        remeasureOffset();
        return { start, end };
      });
    };

    /* Scroll events outrun frames on a trackpad and on iOS momentum alike; doing
       the arithmetic once per frame is the difference between smooth and not. */
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    const onResize = () => {
      remeasureOffset();
      onScroll();
    };

    remeasureOffset();
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [count, rowHeight]);

  /* A filter that shortens the list can leave the range pointing past its end —
     clamped here rather than in an effect, so no frame ever renders the gap. */
  const end = Math.min(range.end, count);
  const start = Math.min(range.start, Math.max(0, end - 1));
  return { listRef, range: { start, end } };
}

/** Desktop row: one line (§5.8). */
export const ROW_HEIGHT_WIDE = 56;
/** ≤780px: two lines, and a 72px target comfortably over the 44px floor (§7.6). */
export const ROW_HEIGHT_COMPACT = 72;

/**
 * The row height in force, as a number rather than a CSS value: the virtualizer does
 * arithmetic with it and the row is sized from the same constant, so the two cannot
 * drift into a list whose scrollbar lies about its length.
 */
export function useRowHeight(): number {
  const [height, setHeight] = useState(ROW_HEIGHT_WIDE);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 780px)");
    const apply = () =>
      setHeight(query.matches ? ROW_HEIGHT_COMPACT : ROW_HEIGHT_WIDE);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return height;
}
