/**
 * The shell's navigation model (SPEC §3.1 primary nav, §3.4 bottom tabs).
 *
 * One list, two renderings. An entry is either a *tab* — the same five-tab
 * template applied to whatever scope you are in — or an *edition-level* screen,
 * which is the same wherever you stand.
 */

import {
  Activity,
  AlertTriangle,
  BookOpen,
  GitBranch,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import {
  EVIDENCE_PATH,
  METHODOLOGY_PATH,
  TAB_LABELS,
  type RouteMatch,
  type TabId,
} from "@/app/routes";

export type NavEntry =
  | {
      kind: "tab";
      id: TabId;
      label: string;
      icon: LucideIcon;
      /** Findings carries `headlines.length` as a count badge (SPEC §3.1). */
      badge?: "findings";
    }
  | {
      kind: "edition";
      id: string;
      label: string;
      icon: LucideIcon;
      path: string;
    };

export const PRIMARY_NAV: NavEntry[] = [
  { kind: "tab", id: "overview", label: TAB_LABELS.overview, icon: Activity },
  {
    kind: "tab",
    id: "findings",
    label: TAB_LABELS.findings,
    icon: AlertTriangle,
    badge: "findings",
  },
  {
    kind: "tab",
    id: "metrics",
    label: TAB_LABELS.metrics,
    icon: SlidersHorizontal,
  },
  { kind: "tab", id: "trends", label: TAB_LABELS.trends, icon: TrendingUp },
  {
    kind: "tab",
    id: "repositories",
    label: TAB_LABELS.repositories,
    icon: GitBranch,
  },
  {
    kind: "edition",
    id: "evidence",
    label: "Evidence",
    icon: BookOpen,
    path: EVIDENCE_PATH,
  },
  {
    kind: "edition",
    id: "methodology",
    label: "Methodology",
    icon: ShieldCheck,
    path: METHODOLOGY_PATH,
  },
];

/** The four scope tabs the thumb gets; the fifth slot is "More" (SPEC §3.4). */
export const BOTTOM_TABS: TabId[] = [
  "overview",
  "findings",
  "metrics",
  "trends",
];

export function isEntryActive(entry: NavEntry, match: RouteMatch): boolean {
  if (entry.kind === "tab")
    return match.kind === "scope" && match.tab === entry.id;
  if (entry.id === "evidence") return match.kind === "evidence";
  if (entry.id === "methodology") return match.kind === "methodology";
  return false;
}
