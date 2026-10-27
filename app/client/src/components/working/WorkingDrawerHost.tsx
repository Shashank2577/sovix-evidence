/**
 * The working, bound to the address bar (SPEC §1.3, §5.10, §10.4).
 *
 * Mounted once, beside the route outlet. It takes no props and holds no "is it
 * open" state of its own: the URL says which metric, the route says which scope,
 * and this resolves both and renders. That is what makes `?working=` a contract
 * rather than a convenience — a link into the drawer and a click into the drawer
 * arrive by the same code path, so there is no second path that can drift.
 *
 * The four behaviours §12's C5 row asks for, and where each one lives:
 *   - a deep link opens the right metric at the right scope → `useWorking` +
 *     `resolveScope` below, with §1.3's 150 ms settle;
 *   - Escape and swipe close it → Radix and vaul, in `WorkingDrawer`;
 *   - a metric with no eligible records renders its stated reason → `NotAvailable`
 *     and `no_sources_reason`, in `WorkingBody` and `WorkingSections`;
 *   - the URL round-trips → `withWorking`, in `useWorking`.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { scopeTabPath } from "@/app/routes";
import { resolveScope } from "@/app/scope";
import { useAppRoute, useIsMobileShell } from "@/app/useAppRoute";
import { useEdition, useScope, type DataFetchError } from "@/data";

import { WorkingBody } from "./WorkingBody";
import { WorkingDrawer, type WorkingShellSlots } from "./WorkingDrawer";
import { WorkingError, WorkingSkeleton, WorkingUnknown } from "./WorkingStates";
import { DEEP_LINK_DELAY_MS, useWorking } from "./useWorking";

import "./working.css";

export function WorkingDrawerHost() {
  const { metricId, close } = useWorking();
  const match = useAppRoute();
  const edition = useEdition();
  const isMobile = useIsMobileShell();

  /*
   * §1.3: `?working=` is valid on a scoped route and only there. The edition-level
   * screens (evidence, methodology, compare) have no scope, so there is no sample
   * the drawer could be about — a drawer there would have to pick a scope on the
   * reader's behalf, which is the silent evidence-swap §5.10 forbids.
   */
  const scope = useMemo(
    () =>
      edition.data && match.kind === "scope"
        ? resolveScope(edition.data, match.target)
        : null,
    [edition.data, match]
  );

  const wanted = scope ? metricId : null;

  /*
   * §1.3: on load with the param the drawer opens "after first paint (150 ms delay
   * so the page settles first)". Armed once, for the initial URL only — a click
   * afterwards must feel immediate, and delaying it would read as lag.
   */
  const deepLinked = useRef(metricId !== null);
  const [armed, setArmed] = useState(!deepLinked.current);
  useEffect(() => {
    if (armed) return;
    const timer = window.setTimeout(() => setArmed(true), DEEP_LINK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [armed]);

  const open = wanted !== null && armed;

  /* Only fetch the scope file when the drawer actually wants it (SPEC §9.6). */
  const report = useScope(open && scope ? scope.slug : null);

  /*
   * §5.10: "changing scope in the switcher while open closes it (different sample =
   * different working; silently swapping evidence under the reader is forbidden)."
   *
   * In practice the switcher navigates to a bare scope path and the param falls off
   * on its own. This is the guard for every other way a scope could change while
   * the query survives — a breadcrumb, a future link, a hand-edited URL.
   */
  const openedAt = useRef<string | null>(null);
  useEffect(() => {
    if (wanted === null) {
      openedAt.current = null;
      return;
    }
    const key = scope?.key ?? null;
    if (key === null) return;
    if (openedAt.current === null) {
      openedAt.current = key;
      return;
    }
    if (openedAt.current !== key) {
      openedAt.current = null;
      close();
    }
  }, [wanted, scope?.key, close]);

  if (!open || !scope || metricId === null) return null;

  const summary = edition.data?.scopeSummaries[scope.key]?.metrics.find(
    row => row.id === metricId
  );
  const metric = report.data?.metrics.find(row => row.id === metricId);
  const fullPagePath = scopeTabPath(scope.target, "metrics", metricId);

  const content = (slots: WorkingShellSlots) => {
    if (report.status === "error") {
      const error = report.error as DataFetchError | undefined;
      return (
        <WorkingError
          metricId={metricId}
          reason={error?.message ?? ""}
          variant={isMobile ? "sheet" : "drawer"}
          onClose={close}
          onRetry={report.retry}
          titleAs={slots.titleAs}
          descriptionAs={slots.descriptionAs}
        />
      );
    }

    if (report.status === "loading") {
      return (
        <WorkingSkeleton
          summary={summary}
          metricId={metricId}
          variant={isMobile ? "sheet" : "drawer"}
          onClose={close}
          titleAs={slots.titleAs}
          descriptionAs={slots.descriptionAs}
        />
      );
    }

    /* The scope loaded and does not publish this id — a mistyped or stale link. */
    if (!metric) {
      return (
        <WorkingUnknown
          metricId={metricId}
          variant={isMobile ? "sheet" : "drawer"}
          onClose={close}
          titleAs={slots.titleAs}
          descriptionAs={slots.descriptionAs}
        />
      );
    }

    return (
      <WorkingBody
        metric={metric}
        scopeSlug={scope.slug}
        variant={isMobile ? "sheet" : "drawer"}
        tierLegend={edition.data?.data_quality.tier_legend[metric.tier]}
        fullPagePath={fullPagePath}
        onClose={close}
        titleAs={slots.titleAs}
        descriptionAs={slots.descriptionAs}
      />
    );
  };

  return (
    <WorkingDrawer open={open} onClose={close} isMobile={isMobile}>
      {content}
    </WorkingDrawer>
  );
}
