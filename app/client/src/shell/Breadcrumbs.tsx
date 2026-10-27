/**
 * Breadcrumbs — SPEC §3.2: `{org_label} › {scope label} › {tab}`, every
 * ancestor a link.
 *
 * A repo sits inside a project, so the repo's trail names the project too —
 * the ancestor chain is the point, and skipping a level would make the middle
 * link unreachable from the chrome.
 */

import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { Link } from "wouter";

import {
  EVIDENCE_PATH,
  TAB_LABELS,
  scopeBasePath,
  scopeTabPath,
  type RouteMatch,
} from "@/app/routes";
import type { ResolvedScope } from "@/app/scope";
import type { Edition } from "@/data";

interface Crumb {
  label: string;
  href?: string;
}

export function crumbsFor(
  match: RouteMatch,
  scope: ResolvedScope | null,
  edition: Edition | undefined
): Crumb[] {
  const orgLabel = edition?.org_label ?? "All repositories";
  const crumbs: Crumb[] = [{ label: orgLabel, href: "/" }];

  switch (match.kind) {
    case "scope": {
      if (scope?.parent) {
        crumbs.push({
          label: scope.parent.label,
          href: scopeBasePath(scope.parent.target),
        });
      }
      if (match.target.level !== "org") {
        crumbs.push({
          label: scope?.label ?? match.target.slug ?? `${match.target.owner}/${match.target.name}`,
          href: scopeBasePath(match.target),
        });
      }
      if (match.tab === "metrics" && match.metricId) {
        crumbs.push({
          label: TAB_LABELS.metrics,
          href: scopeTabPath(match.target, "metrics"),
        });
        crumbs.push({ label: match.metricId });
      } else {
        crumbs.push({ label: TAB_LABELS[match.tab] });
      }
      break;
    }
    case "compare":
      crumbs.push({ label: "Compare" });
      break;
    case "evidence":
      if (match.recordId) {
        crumbs.push({ label: "Evidence", href: EVIDENCE_PATH });
        crumbs.push({ label: match.recordId });
      } else {
        crumbs.push({ label: "Evidence" });
      }
      break;
    case "methodology":
      crumbs.push({ label: "Methodology" });
      break;
    default:
      crumbs.push({ label: "Not found" });
  }

  /* At org scope the first crumb *is* the scope, so the trail reads
     "All repositories › Overview" rather than repeating itself. */
  return crumbs;
}

export default function Breadcrumbs({
  match,
  scope,
  edition,
}: {
  match: RouteMatch;
  scope: ResolvedScope | null;
  edition: Edition | undefined;
}) {
  const crumbs = crumbsFor(match, scope, edition);
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => (
        <Fragment key={`${crumb.label}-${index}`}>
          {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
          {crumb.href && index < crumbs.length - 1 ? (
            <Link href={crumb.href}>{crumb.label}</Link>
          ) : (
            <strong aria-current="page">{crumb.label}</strong>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
