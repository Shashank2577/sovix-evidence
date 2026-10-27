/**
 * Top bar — SPEC §3.2 on desktop, §3.4 on mobile.
 *
 * Desktop: breadcrumb, search button, refresh, theme toggle, decorative avatar.
 * Mobile (≤780): the breadcrumb gives way to a compact scope button that opens
 * the full-screen scope sheet, and the search button becomes an icon. The
 * switcher's *content* is identical either way — a popover at desk width, a
 * sheet at thumb width, because a ten-row tree in a popover at 390px is a
 * scroll trap.
 *
 * The refresh button re-fetches `edition.json` and compares `generated_at`.
 * An unchanged edition is not a no-op to the reader — it is the answer to
 * "is there anything newer" — so it says so in a toast rather than silently
 * doing nothing.
 */

import { ChevronDown, Command, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { RouteMatch, TabId } from "@/app/routes";
import type { ResolvedScope } from "@/app/scope";
import { repoTint, initialsFor } from "@/app/scope";
import ThemeToggle from "@/components/ThemeToggle";
import { refreshEdition, type Edition } from "@/data";

import Breadcrumbs from "./Breadcrumbs";
import { formatDay } from "./format";
import { ScopeSheet } from "./ScopeSwitcher";

export default function TopBar({
  edition,
  scope,
  match,
  tab,
  isMobile,
  onOpenPalette,
  onEditionChanged,
}: {
  edition: Edition | undefined;
  scope: ResolvedScope | null;
  match: RouteMatch;
  tab: TabId;
  isMobile: boolean;
  onOpenPalette: () => void;
  onEditionChanged: () => void;
}) {
  const [scopeSheetOpen, setScopeSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const result = await refreshEdition();
      if (result.changed) {
        toast.success("A newer edition is available — reloading.");
        onEditionChanged();
      } else {
        toast(
          `Edition ${formatDay(result.edition.generated_at)} is current — snapshots are immutable.`
        );
      }
    } catch (error) {
      toast.error(
        `Could not check for a newer edition: ${(error as Error).message}`
      );
    } finally {
      setRefreshing(false);
    }
  };

  const scopeLabel = scope?.label ?? "Unknown scope";

  return (
    <header className="topbar">
      {isMobile ? (
        <>
          <button
            className="mobile-scope-button"
            onClick={() => setScopeSheetOpen(true)}
            aria-label={`Change scope — currently ${scopeLabel}`}
          >
            <span
              className="scope-avatar"
              style={{ background: scope ? repoTint(scopeLabel) : "var(--ornament)" }}
              aria-hidden="true"
            >
              {scope ? initialsFor(scopeLabel) : "··"}
            </span>
            <span className="mobile-scope-copy">
              <small>Scope</small>
              <strong>{scopeLabel}</strong>
            </span>
            <ChevronDown size={15} aria-hidden="true" />
          </button>
          <ScopeSheet
            edition={edition}
            scope={scope}
            tab={tab}
            open={scopeSheetOpen}
            onOpenChange={setScopeSheetOpen}
          />
        </>
      ) : (
        <Breadcrumbs match={match} scope={scope} edition={edition} />
      )}

      <div className="topbar-actions">
        {isMobile ? (
          <button
            className="icon-button"
            onClick={onOpenPalette}
            aria-label="Search this edition"
          >
            <Search size={18} aria-hidden="true" />
          </button>
        ) : (
          <button
            className="command-button"
            onClick={onOpenPalette}
            aria-label="Search this edition"
          >
            <Command size={14} aria-hidden="true" />
            <span>Search</span>
            <kbd>⌘ K</kbd>
          </button>
        )}
        <button
          className="icon-button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Check for a newer edition"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "is-spinning" : undefined}
            aria-hidden="true"
          />
        </button>
        <ThemeToggle />
        {!isMobile && (
          <span className="topbar-avatar" aria-hidden="true">
            RS
          </span>
        )}
      </div>
    </header>
  );
}
