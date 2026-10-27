/**
 * Sidebar — SPEC §3.1. Fixed 248px at ≥781px; removed entirely below that
 * (§3.4), where the bottom tab bar takes over.
 *
 * Everything in it is real: the nav goes to routes, the findings badge is
 * `headlines.length`, the snapshot list shows the one edition this build ships
 * and says so, and the coverage card reads `span_weeks`, the repo count and
 * `generated_at` off the edition. The mock's 86% coverage bar was decorative;
 * the real bar is `repos_collected / (repos_collected + repos_failed)`.
 */

import { motion } from "framer-motion";
import { CircleHelp, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";

import {
  scopeTabPath,
  type RouteMatch,
  type TabId,
} from "@/app/routes";
import { tabExistsAt } from "@/app/routes";
import type { ResolvedScope } from "@/app/scope";
import type { Edition } from "@/data";
import { ease } from "@/lib/motion";

import { PRIMARY_NAV, isEntryActive } from "./nav";
import { ScopeSwitcher, ScopeSwitcherFace } from "./ScopeSwitcher";
import { formatDay, relativeTime } from "./format";

export function BrandLockup() {
  return (
    <Link href="/" className="brand-lockup" aria-label="Sovix — go to the org overview">
      <div className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div>
        <div className="brand-name">sovix</div>
        <div className="brand-subtitle">engineering evidence</div>
      </div>
    </Link>
  );
}

/**
 * The coverage card (SPEC §3.1). Also rendered inside the mobile "More" sheet,
 * so it lives as its own export.
 */
export function CoverageCard({ edition }: { edition: Edition | undefined }) {
  if (!edition) {
    return (
      <div className="coverage-card">
        <div className="coverage-head">
          <span>Data coverage</span>
        </div>
        <div className="skeleton-block" style={{ height: 24, marginTop: 8 }} />
        <div className="skeleton-block" style={{ height: 4, marginTop: 12 }} />
      </div>
    );
  }

  const org = edition.scopeSummaries[edition.root_scope];
  const { repos_collected, repos_failed } = edition.collection;
  const attempted = repos_collected + repos_failed;
  const collectedPct = attempted === 0 ? 0 : (repos_collected / attempted) * 100;
  const repoCount = org?.facts.repos.length ?? repos_collected;

  return (
    <div className="coverage-card">
      <div className="coverage-head">
        <span>Data coverage</span>
        <CircleHelp size={14} aria-hidden="true" />
      </div>
      <div className="coverage-value">
        {org ? Math.round(org.facts.span_weeks) : "—"} <small>weeks</small>
      </div>
      <div
        className="coverage-bar"
        role="img"
        aria-label={`${repos_collected} of ${attempted} repositories collected`}
      >
        <span style={{ width: `${collectedPct}%` }} />
      </div>
      <div className="coverage-meta">
        <span>
          {repoCount} {repoCount === 1 ? "repository" : "repositories"}
        </span>
        <span>Refreshed {relativeTime(edition.generated_at)}</span>
      </div>
    </div>
  );
}

/** The snapshot list (SPEC §3.1): one real edition, and an honest empty line. */
export function SnapshotList({ edition }: { edition: Edition | undefined }) {
  return (
    <>
      <div className="snapshot-list">
        <div className="snapshot-item current">
          <span className="snapshot-dot" aria-hidden="true" />
          <span>
            <strong>{edition ? formatDay(edition.generated_at) : "—"}</strong>
            <small>Current edition ✓</small>
          </span>
        </div>
      </div>
      <p className="snapshot-note">
        Earlier editions appear here after your next run.
      </p>
    </>
  );
}

interface SidebarProps {
  edition: Edition | undefined;
  scope: ResolvedScope | null;
  match: RouteMatch;
  tab: TabId;
}

export default function Sidebar({ edition, scope, match, tab }: SidebarProps) {
  const findingCount = edition?.headlines.length ?? 0;
  /* An unknown scope still has to produce links, so nav falls back to org. */
  const target = scope?.target ?? { level: "org" as const, slug: null, owner: null, name: null };

  const entries = PRIMARY_NAV.filter(
    entry =>
      entry.kind !== "tab" || tabExistsAt(target.level, entry.id)
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">
        <div className="sidebar-top">
          <BrandLockup />
          <ScopeSwitcher
            edition={edition}
            scope={scope}
            tab={tab}
            triggerLabel={`Change scope — currently ${scope?.label ?? "unknown"}`}
          >
            <ScopeSwitcherFace scope={scope} />
          </ScopeSwitcher>
        </div>

        <div className="nav-section-label">Workspace</div>
        <nav className="primary-nav" aria-label="Primary">
          {entries.map(entry => {
            const Icon = entry.icon;
            const active = isEntryActive(entry, match);
            const href =
              entry.kind === "tab" ? scopeTabPath(target, entry.id) : entry.path;
            return (
              <Link
                key={entry.id}
                href={href}
                className={`nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-nav-indicator"
                    className="nav-indicator"
                    transition={{ duration: 0.22, ease: ease.out }}
                  />
                )}
                <Icon size={17} strokeWidth={active ? 2.1 : 1.7} aria-hidden="true" />
                <span>{entry.label}</span>
                {entry.kind === "tab" && entry.badge === "findings" && findingCount > 0 && (
                  <span className="nav-count">{findingCount}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="nav-section-label snapshots-label">Snapshots</div>
        <SnapshotList edition={edition} />

        <div className="sidebar-bottom">
          <CoverageCard edition={edition} />
          <button className="user-menu" aria-label="Account menu">
            <span className="user-avatar" aria-hidden="true">
              RS
            </span>
            <span>
              <strong>Rowan Shah</strong>
              <small>Workspace owner</small>
            </span>
            <MoreHorizontal size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
