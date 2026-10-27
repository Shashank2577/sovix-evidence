/**
 * The one disclosure in the drawer (SPEC §8.7).
 *
 * Exemplar cards, the "show the rest" groups and the mobile sheet's collapsed
 * sections all fold the same way, so the timing lives here rather than in four
 * places drifting apart.
 *
 * The rule this component is shaped around is §0.1's: **nothing may exist only on
 * hover**. So the affordance is a real button — reachable by touch, by Tab, and
 * legible in print (`aria-expanded` is what a screen reader announces, and the
 * collapsed content stays in the accessibility tree's reach via the button's
 * control relationship). Hover changes colour and nothing else.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

const easeOut = ease.out as unknown as [number, number, number, number];

export interface DisclosureProps {
  /** What the button says when shut, and (with `closeLabel`) when open. */
  label: ReactNode;
  closeLabel?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  /** Rendered inside the button, before the label — a rank badge, an icon. */
  leading?: ReactNode;
  /** Quiet text button (a "show 4 more" row) rather than a bordered card head. */
  variant?: "row" | "plain";
}

export function Disclosure({
  label,
  closeLabel,
  defaultOpen = false,
  children,
  className,
  leading,
  variant = "row",
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const reduced = useReducedMotion();
  const panelId = useId();

  return (
    <div
      className={cn("wk-disclosure", `wk-disclosure--${variant}`, className)}
    >
      <button
        type="button"
        className="wk-disclosure__button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(value => !value)}
      >
        {leading}
        <span className="wk-disclosure__label">
          {open && closeLabel ? closeLabel : label}
        </span>
        <motion.span
          className="wk-disclosure__chevron"
          aria-hidden="true"
          animate={{ rotate: open ? 180 : 0 }}
          transition={
            reduced ? { duration: 0 } : { duration: 0.2, ease: easeOut }
          }
        >
          <ChevronDown size={14} strokeWidth={2} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            className="wk-disclosure__panel"
            /* §8.10 collapses every transform/size animation to opacity. An
               auto-height animation is a size animation, so under reduced motion
               the panel simply is there, at 0.16s of fade. */
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={
              reduced
                ? { duration: 0.16 }
                : {
                    height: { duration: open ? 0.26 : 0.2, ease: easeOut },
                    /* Content fades in late on open and out first on close, so
                       the box never shows a half-height slab of text. */
                    opacity: open
                      ? { duration: 0.14, delay: 0.08 }
                      : { duration: 0.1 },
                  }
            }
            style={{ overflow: "hidden" }}
          >
            <div className="wk-disclosure__content">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
