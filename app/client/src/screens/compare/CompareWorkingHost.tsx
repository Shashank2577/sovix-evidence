/**
 * Compare's own working drawer (SPEC §5.7, §5.10).
 *
 * The shell's `WorkingDrawerHost` deliberately declines to open on `/compare`:
 * the route names no scope, so `?working=` alone would have it pick a sample on
 * the reader's behalf — the silent evidence-swap §5.10 forbids. §5.7 still
 * requires each cell's ⌗ to open the working "scoped to that column's scope",
 * and a column *does* name one.
 *
 * So this mounts the same drawer C5 built — `WorkingDrawer` shell, `WorkingBody`
 * content — over a `Metric` the column has already loaded. Nothing is
 * re-implemented and nothing about the shell's contract changes: this host reads
 * `?working=` together with `?workingScope=`, and refuses to render without both.
 */

import { scopeTabPath } from "@/app/routes";
import { targetForKey } from "@/app/scope";
import { useIsMobileShell } from "@/app/useAppRoute";
import { WorkingBody, WorkingDrawer, WorkingUnknown } from "@/components/working";
import type { Edition, Metric, ScopeKey } from "@/data";

export function CompareWorkingHost({
  edition,
  metric,
  metricId,
  scopeKey,
  onClose,
}: {
  edition: Edition;
  /** `undefined` when the column has the scope but not this reading. */
  metric: Metric | undefined;
  metricId: string;
  scopeKey: ScopeKey;
  onClose: () => void;
}) {
  const isMobile = useIsMobileShell();
  const target = targetForKey(edition, scopeKey);
  const slug = edition.slugByKey[scopeKey];

  return (
    <WorkingDrawer open onClose={onClose} isMobile={isMobile}>
      {slots =>
        metric ? (
          <WorkingBody
            metric={metric}
            scopeSlug={slug}
            variant={isMobile ? "sheet" : "drawer"}
            tierLegend={edition.data_quality.tier_legend[metric.tier]}
            fullPagePath={scopeTabPath(target, "metrics", metricId)}
            onClose={onClose}
            titleAs={slots.titleAs}
            descriptionAs={slots.descriptionAs}
          />
        ) : (
          <WorkingUnknown
            metricId={metricId}
            variant={isMobile ? "sheet" : "drawer"}
            onClose={onClose}
            titleAs={slots.titleAs}
            descriptionAs={slots.descriptionAs}
          />
        )
      }
    </WorkingDrawer>
  );
}
