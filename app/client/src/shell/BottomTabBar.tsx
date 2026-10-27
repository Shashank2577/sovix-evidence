/**
 * Bottom tab bar — SPEC §3.4, §7.2. Replaces the sidebar below 781px.
 *
 * Five slots: the four tabs the four audiences reach for (glance → findings →
 * figure → working), and "More" for everything that isn't a one-thumb move:
 * Repositories, Evidence, Methodology, the snapshot line and the coverage card.
 *
 * A hamburger would put Findings two taps away. That is the whole argument.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import {
  BookOpen,
  GitBranch,
  MoreHorizontal,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

import {
  EVIDENCE_PATH,
  METHODOLOGY_PATH,
  TAB_LABELS,
  scopeTabPath,
  tabExistsAt,
  type RouteMatch,
  type ScopeTarget,
} from "@/app/routes";
import type { Edition } from "@/data";
import { ease } from "@/lib/motion";

import { BOTTOM_TABS, PRIMARY_NAV, isEntryActive } from "./nav";
import { CoverageCard, SnapshotList } from "./Sidebar";

function iconFor(tabId: string): LucideIcon {
  const entry = PRIMARY_NAV.find(item => item.kind === "tab" && item.id === tabId);
  return entry ? entry.icon : MoreHorizontal;
}

export default function BottomTabBar({
  edition,
  target,
  match,
  location,
}: {
  edition: Edition | undefined;
  target: ScopeTarget;
  match: RouteMatch;
  /** Closes the More sheet when the route changes under it. */
  location: string;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const findingCount = edition?.headlines.length ?? 0;

  useEffect(() => {
    setMoreOpen(false);
  }, [location]);

  /* "More" is the active slot whenever the current route lives inside it. */
  const moreActive =
    match.kind === "evidence" ||
    match.kind === "methodology" ||
    match.kind === "compare" ||
    (match.kind === "scope" && match.tab === "repositories");

  return (
    <>
      <nav className="bottom-tabs" aria-label="Primary">
        {BOTTOM_TABS.map(tab => {
          const Icon = iconFor(tab);
          const active =
            !moreActive && match.kind === "scope" && match.tab === tab;
          return (
            <Link
              key={tab}
              href={scopeTabPath(target, tab)}
              className="bottom-tab"
              data-active={active}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="bottom-tab-indicator"
                  className="bottom-tab-indicator"
                  transition={{ duration: 0.22, ease: ease.out }}
                />
              )}
              <Icon size={19} strokeWidth={active ? 2.1 : 1.7} aria-hidden="true" />
              <span className="bottom-tab-label">{TAB_LABELS[tab]}</span>
              {tab === "findings" && findingCount > 0 && (
                <span className="bottom-tab-badge">{findingCount}</span>
              )}
            </Link>
          );
        })}

        <button
          className="bottom-tab"
          data-active={moreActive}
          onClick={() => setMoreOpen(true)}
          aria-label="More screens"
          aria-haspopup="dialog"
        >
          {moreActive && (
            <motion.span
              layoutId="bottom-tab-indicator"
              className="bottom-tab-indicator"
              transition={{ duration: 0.22, ease: ease.out }}
            />
          )}
          <MoreHorizontal size={19} strokeWidth={moreActive ? 2.1 : 1.7} aria-hidden="true" />
          <span className="bottom-tab-label">More</span>
        </button>
      </nav>

      <MoreSheet
        edition={edition}
        target={target}
        match={match}
        open={moreOpen}
        onOpenChange={setMoreOpen}
      />
    </>
  );
}

function MoreSheet({
  edition,
  target,
  match,
  open,
  onOpenChange,
}: {
  edition: Edition | undefined;
  target: ScopeTarget;
  match: RouteMatch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const showRepositories = tabExistsAt(target.level, "repositories");
  const evidenceEntry = PRIMARY_NAV.find(entry => entry.id === "evidence")!;
  const methodologyEntry = PRIMARY_NAV.find(entry => entry.id === "methodology")!;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-backdrop" />
        <Dialog.Content className="sheet-panel" aria-describedby={undefined}>
          <div className="sheet-grabber" aria-hidden="true" />
          <div className="sheet-head">
            <Dialog.Title asChild>
              <h2>More</h2>
            </Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Close">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="sheet-body">
            <div className="sheet-nav">
              {showRepositories && (
                <Link
                  href={scopeTabPath(target, "repositories")}
                  data-active={match.kind === "scope" && match.tab === "repositories"}
                >
                  <GitBranch size={18} aria-hidden="true" />
                  {TAB_LABELS.repositories}
                </Link>
              )}
              <Link
                href={EVIDENCE_PATH}
                data-active={isEntryActive(evidenceEntry, match)}
              >
                <BookOpen size={18} aria-hidden="true" />
                Evidence
              </Link>
              <Link
                href={METHODOLOGY_PATH}
                data-active={isEntryActive(methodologyEntry, match)}
              >
                <ShieldCheck size={18} aria-hidden="true" />
                Methodology
              </Link>
            </div>

            <div className="sheet-section-label">Snapshots</div>
            <SnapshotList edition={edition} />

            <div className="sheet-section-label">Coverage</div>
            <CoverageCard edition={edition} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
