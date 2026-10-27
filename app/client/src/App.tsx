/**
 * The application root and the route table's one mounting point (SPEC §1.3).
 *
 * `parseAppPath` decides what a URL means; this decides what to render for it.
 * The shell wraps every outcome — including "no such route" and "the edition
 * didn't load" — because a reader who mistyped a URL still needs the way out
 * that the chrome provides.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { Redirect, useLocation } from "wouter";

import { ORG_TARGET } from "@/app/routes";
import { useAppRoute } from "@/app/useAppRoute";
import { resolveScope } from "@/app/scope";
import { Toaster } from "@/components/ui/sonner";
import { EvidenceScreen } from "@/components/evidence";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEdition, type DataFetchError } from "@/data";
import { duration, ease } from "@/lib/motion";
import AppShell from "@/shell/AppShell";
import { ThemeProvider } from "next-themes";

import ErrorBoundary from "./components/ErrorBoundary";
import {
  CompareScreen,
  EditionError,
  MethodologyScreen,
  RouteNotFound,
  ScopeNotFound,
  ScopeScreen,
  ShellSkeleton,
} from "./pages/Screens";

function Routed() {
  const [location] = useLocation();
  const match = useAppRoute();
  const edition = useEdition();

  const scope = useMemo(() => {
    if (!edition.data) return null;
    /* Evidence, Methodology and Compare are edition-level, but the reader is
       still standing somewhere: the chrome shows the org rather than claiming
       the scope is unknown. A *scoped* route that doesn't resolve stays null —
       "not in this edition" is the answer there, and the shell says so. */
    if (match.kind !== "scope") return resolveScope(edition.data, ORG_TARGET);
    return resolveScope(edition.data, match.target);
  }, [edition.data, match]);

  /* A new route starts at the top of itself; wouter leaves scroll alone. */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);

  /* `/org/...` is the org route written the long way — resolve it before the
     shell renders, so the canonical URL is what ends up in history. */
  if (match.kind === "redirect") return <Redirect to={match.to} replace />;

  return (
    <AppShell
      edition={edition.data}
      scope={scope}
      match={match}
      onEditionChanged={() => window.location.reload()}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{
            opacity: 0,
            transition: { duration: duration.fast, ease: ease.out },
          }}
          transition={{ duration: 0.2, delay: 0.04, ease: ease.out }}
        >
          <Screen edition={edition} scope={scope} match={match} />
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}

function Screen({
  edition,
  scope,
  match,
}: {
  edition: ReturnType<typeof useEdition>;
  scope: ReturnType<typeof resolveScope>;
  match: ReturnType<typeof useAppRoute>;
}) {
  if (edition.status === "loading") return <ShellSkeleton />;
  if (edition.status === "error" || !edition.data) {
    const error = edition.error as DataFetchError | undefined;
    return (
      <EditionError
        reason={error?.message ?? "The edition file could not be read."}
        onRetry={edition.retry}
      />
    );
  }

  const data = edition.data;

  switch (match.kind) {
    case "scope":
      return scope ? (
        <ScopeScreen
          edition={data}
          scope={scope}
          tab={match.tab}
          metricId={match.metricId}
        />
      ) : (
        <ScopeNotFound edition={data} match={match} />
      );
    case "compare":
      return <CompareScreen edition={data} />;
    case "evidence":
      return <EvidenceScreen edition={data} recordId={match.recordId} />;
    case "methodology":
      return <MethodologyScreen edition={data} />;
    default:
      return <RouteNotFound edition={data} />;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <TooltipProvider>
          <Toaster />
          <Routed />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
