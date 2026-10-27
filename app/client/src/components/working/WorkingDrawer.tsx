/**
 * The two shells the working renders inside (SPEC §5.10, §8.4, §10.4).
 *
 * This is the chunk's load-bearing decision, so it is worth stating plainly: the
 * working is **a drawer, never a modal over the figure**. On desktop it takes
 * `min(470px, 100%)` off the right edge and leaves the page — and the number the
 * reader is asking about — visible beside it. On mobile it is a bottom sheet that
 * opens at 62%, which is the same promise in the only form 390px allows: the figure
 * stays on screen above the sheet, and the sheet's own header repeats it.
 *
 * Every previous attempt at this product failed here, by sending the reader to
 * another page or by covering the figure with a dialog. Both break the one thing
 * this surface is for: reading the working *of something you can still see*.
 *
 * Under the hood both are Radix Dialog — vaul is Radix Dialog with a drag handle —
 * so focus trap, Escape, scroll lock and `aria-labelledby` are the same mechanism on
 * both, and there is no second accessibility story to keep in sync.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { Drawer as Vaul } from "vaul";

import { duration, ease, spring } from "@/lib/motion";
import * as copy from "@/copy";

const easeOut = ease.out as unknown as [number, number, number, number];
const drawerSpring = spring.drawer as unknown as Record<string, unknown>;

/** §10.4. Opens at 62% — header, value, plain English, the start of the formula. */
export const SHEET_SNAP_POINTS = [0.62, 1] as const;

export interface WorkingShellSlots {
  titleAs: ElementType;
  descriptionAs: ElementType;
}

export interface WorkingDrawerProps {
  open: boolean;
  onClose: () => void;
  /** ≤780px gets the sheet (§10.4); above it, the right drawer. */
  isMobile: boolean;
  /**
   * Rendered with the `Title` and `Description` components the shell needs in its
   * tree. §5.10 asks for `aria-labelledby` the metric label, and this is how it is
   * wired: the primitives issue the ids and point the dialog at them, which is both
   * correct and the only arrangement they will not warn about.
   */
  children: (slots: WorkingShellSlots) => ReactNode;
}

const RADIX_SLOTS: WorkingShellSlots = {
  titleAs: Dialog.Title,
  descriptionAs: Dialog.Description,
};

const VAUL_SLOTS: WorkingShellSlots = {
  titleAs: Vaul.Title,
  descriptionAs: Vaul.Description,
};

export function WorkingDrawer(props: WorkingDrawerProps) {
  return props.isMobile ? (
    <WorkingSheet {...props} />
  ) : (
    <WorkingSideDrawer {...props} />
  );
}

/* ----------------------------------------------------------- ≥781px */

function WorkingSideDrawer({ open, onClose, children }: WorkingDrawerProps) {
  const reduced = useReducedMotion();

  return (
    <Dialog.Root open={open} onOpenChange={next => !next && onClose()}>
      {/* `forceMount` hands the exit animation to AnimatePresence; Radix would
          otherwise unmount the moment `open` flips and there would be no exit. */}
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="wk-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.base, ease: easeOut }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount>
              <motion.aside
                className="wk-drawer"
                /*
                 * §8.4: x 24→0 with `spring.drawer`, exiting faster than it enters.
                 * §8.10 collapses the transform to opacity alone — the panel is a
                 * large moving surface and the motion is the part that costs a
                 * reader who asked not to have it.
                 */
                initial={reduced ? { opacity: 0 } : { x: 24, opacity: 0.7 }}
                animate={reduced ? { opacity: 1 } : { x: 0, opacity: 1 }}
                exit={
                  reduced
                    ? { opacity: 0, transition: { duration: 0.16 } }
                    : {
                        x: 16,
                        opacity: 0,
                        transition: { duration: 0.16, ease: easeOut },
                      }
                }
                transition={reduced ? { duration: 0.16 } : drawerSpring}
              >
                {children(RADIX_SLOTS)}
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/* ----------------------------------------------------------- ≤780px */

function WorkingSheet({ open, onClose, children }: WorkingDrawerProps) {
  const [snap, setSnap] = useState<number | string | null>(
    SHEET_SNAP_POINTS[0]
  );

  /* Every open starts at the trust preview, whatever the last one ended at. */
  useEffect(() => {
    if (open) setSnap(SHEET_SNAP_POINTS[0]);
  }, [open]);

  const expanded = snap === SHEET_SNAP_POINTS[1];

  return (
    <Vaul.Root
      open={open}
      onOpenChange={next => !next && onClose()}
      snapPoints={[...SHEET_SNAP_POINTS]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <Vaul.Portal>
        <Vaul.Overlay className="wk-backdrop" />
        <Vaul.Content className="wk-sheet">
          {/*
           * §0.1 and §10.3: the drag is never the only way to do this. The grabber
           * is a real button — tap or Enter toggles between the two snap points —
           * so a reader who cannot drag, or does not know they can, still reaches
           * full height. The gesture is the shortcut, not the mechanism.
           */}
          <button
            type="button"
            className="wk-grabber"
            aria-label={copy.working.sheetGrabber}
            aria-expanded={expanded}
            onClick={() =>
              setSnap(expanded ? SHEET_SNAP_POINTS[0] : SHEET_SNAP_POINTS[1])
            }
          >
            <span className="wk-grabber__bar" aria-hidden="true" />
          </button>
          {children(VAUL_SLOTS)}
        </Vaul.Content>
      </Vaul.Portal>
    </Vaul.Root>
  );
}
