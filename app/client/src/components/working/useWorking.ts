/**
 * The `?working=` URL contract (SPEC §1.3, §5.10, §10.4).
 *
 * The drawer has no open/closed state of its own. It is open when the address bar
 * says it is open, and on exactly the metric the address bar names. That is not a
 * stylistic preference — §1.3 requires that "every view a CTO might quote must be a
 * link", and the drawer is the view most worth quoting: it is where a figure stops
 * being a claim and becomes something a reader can check.
 *
 * Consequences the rest of the chunk depends on:
 *   - Opening is a navigation, so Back closes and Forward reopens without anything
 *     here listening for it.
 *   - A deep link and a click land in identical state; there is no second code path
 *     for "restored from URL" to diverge from.
 *   - Copying the address mid-read hands someone else the same evidence, at the
 *     same scope, with nothing reconstructed on their side.
 *
 * `routes.ts` (C2) owns the parameter's name and its read/write helpers; this module
 * owns what the application does with them.
 */

import { useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";

import { readWorkingParam, withWorking } from "@/app/routes";

/**
 * The Evidence index, pre-filtered to the records one metric cited at one scope
 * (SPEC §5.10.8 — the "All {n} source records" link).
 *
 * Re-exported, not defined here. The drawer writes this URL and the Evidence index
 * (C11) reads it back, so it belongs in the route table beside `readEvidenceFilter`
 * — one module owning both halves, rather than two modules agreeing about two
 * string literals until someone renames a param in one of them.
 *
 * The call sites in this chunk keep importing it from here, so the move cost them
 * nothing.
 */
export { evidenceFilterPath } from "@/app/routes";

export interface WorkingControls {
  /** The metric the URL currently asks for, or `null` when the drawer is shut. */
  metricId: string | null;
  /** Open the drawer on a metric, at the scope the current route already names. */
  open: (metricId: string) => void;
  close: () => void;
  /** The href a link-shaped affordance should carry, so middle-click works. */
  hrefFor: (metricId: string) => string;
}

/**
 * Read and write the working parameter.
 *
 * Both open and close *push* rather than replace. Replacing would make Back jump
 * past the drawer to the previous screen, which reads as the drawer having eaten
 * the gesture; pushing makes Back mean "shut the working" and Forward mean "open it
 * again", which is what a reader who has just been reading it expects.
 */
export function useWorking(): WorkingControls {
  const [location, navigate] = useLocation();
  const search = useSearch();

  const metricId = useMemo(() => readWorkingParam(search), [search]);

  const hrefFor = useCallback(
    (id: string) => withWorking(location, id, search),
    [location, search]
  );

  const open = useCallback(
    (id: string) => navigate(withWorking(location, id, search)),
    [location, navigate, search]
  );

  const close = useCallback(
    () => navigate(withWorking(location, null, search)),
    [location, navigate, search]
  );

  return { metricId, open, close, hrefFor };
}

/**
 * §1.3: a deep link opens the drawer "after first paint (150 ms delay so the page
 * settles first)".
 *
 * The delay is for the reader, not the renderer. Landing on a scope you have never
 * seen with a panel already covering it gives you no idea what you are looking at;
 * a beat of the page first means the drawer arrives *over* a context you have
 * registered, which is the entire difference between this and a modal.
 */
export const DEEP_LINK_DELAY_MS = 150;
