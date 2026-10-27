/**
 * AppShell — SPEC §3, §7.2.
 *
 * The grid: fixed sidebar + top bar + content at ≥781px; top bar + content +
 * bottom tab bar below that. The shell itself never animates on navigation
 * (§8.3) — only the content area does — so it is deliberately outside the
 * route transition.
 *
 * The shell renders whether or not the edition loaded. When it hasn't, the
 * chrome is present but honest: no counts, no coverage figures, and the
 * content area carries the error (§4.2). We never fill the shell with
 * plausible-looking numbers from a cache we can't vouch for.
 */

import { MotionConfig } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";

import { ORG_TARGET, type RouteMatch, type ScopeTarget, type TabId } from "@/app/routes";
import type { ResolvedScope } from "@/app/scope";
import { useIsMobileShell } from "@/app/useAppRoute";
import { WorkingDrawerHost } from "@/components/working";
import type { Edition } from "@/data";

import BottomTabBar from "./BottomTabBar";
import CommandPalette from "./CommandPalette";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({
  edition,
  scope,
  match,
  onEditionChanged,
  children,
}: {
  edition: Edition | undefined;
  scope: ResolvedScope | null;
  match: RouteMatch;
  onEditionChanged: () => void;
  children: ReactNode;
}) {
  const [location] = useLocation();
  const isMobile = useIsMobileShell();
  const [paletteOpen, setPaletteOpen] = useState(false);

  /* The scope every piece of chrome links against. An unresolvable scope still
     has to produce working links, so the chrome falls back to org rather than
     rendering dead hrefs. */
  const target: ScopeTarget = useMemo(() => {
    if (scope) return scope.target;
    return match.kind === "scope" && edition === undefined
      ? match.target
      : ORG_TARGET;
  }, [scope, match, edition]);

  /* The tab a scope change should land on (SPEC §3.1). */
  const tab: TabId = match.kind === "scope" ? match.tab : "overview";

  const openPalette = useCallback(() => setPaletteOpen(true), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey))
        return;
      event.preventDefault();
      setPaletteOpen(open => !open);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>

        {!isMobile && (
          <Sidebar edition={edition} scope={scope} match={match} tab={tab} />
        )}

        <div className="main-content">
          <TopBar
            edition={edition}
            scope={scope}
            match={match}
            tab={tab}
            isMobile={isMobile}
            onOpenPalette={openPalette}
            onEditionChanged={onEditionChanged}
          />
          <div className="route-outlet" id="main-content" tabIndex={-1}>
            {children}
          </div>
        </div>

        {isMobile && (
          <BottomTabBar
            edition={edition}
            target={target}
            match={match}
            location={location}
          />
        )}

        {/* The working drawer (C5, SPEC §5.10). Mounted once, beside the outlet
            rather than inside it, so it survives a route transition and is never
            re-created by one. It takes no props: it reads `?working=` itself. */}
        <WorkingDrawerHost />

        <CommandPalette
          edition={edition}
          target={target}
          scopeLabel={scope?.label ?? edition?.org_label ?? "this edition"}
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
        />
      </div>
    </MotionConfig>
  );
}
