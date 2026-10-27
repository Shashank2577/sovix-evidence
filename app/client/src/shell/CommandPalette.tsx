/**
 * Command palette — SPEC §3.3. cmdk inside a Radix Dialog; ⌘K / Ctrl-K
 * anywhere, and on mobile the search icon opens the same thing full-screen.
 *
 * Four groups: Metrics (all 57, fuzzy on label, id and family), Scopes (10),
 * Findings (8) and Screens. Selecting a metric goes to its detail page *in the
 * scope you are standing in*; ⌘-Enter opens its working drawer in place
 * instead — the lateral move (§1.1), one keystroke from anywhere.
 */

import * as Dialog from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CornerDownLeft,
  Layers3,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

import {
  COMPARE_PATH,
  EVIDENCE_PATH,
  METHODOLOGY_PATH,
  scopeTabPath,
  withWorking,
  type ScopeTarget,
  type TabId,
} from "@/app/routes";
import { scopeRows, targetForKey } from "@/app/scope";
import type { Edition } from "@/data";

const RECENTS_KEY = "sovix:palette:recents";
const RECENTS_LIMIT = 5;

type Entry = {
  /** Stable identity, used for recents and as cmdk's `value`. */
  key: string;
  group: "Metrics" | "Scopes" | "Findings" | "Screens";
  title: string;
  subtitle: string;
  tag?: string;
  /** Extra words cmdk should match on (id, family, aliases). */
  keywords: string[];
  href: string;
  /** Metrics only: what ⌘-Enter opens the working drawer for (SPEC §3.3). */
  workingMetricId?: string;
  icon: typeof Search;
};

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    /* A private-mode or quota failure must not take the palette down. */
    return [];
  }
}

function writeRecents(keys: string[]): void {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(keys.slice(0, RECENTS_LIMIT)));
  } catch {
    /* Recents are a convenience; losing them is not an error worth showing. */
  }
}

const SCREEN_ICONS: Record<string, typeof Search> = {
  overview: Activity,
  findings: AlertTriangle,
  metrics: SlidersHorizontal,
  trends: TrendingUp,
};

function buildEntries(
  edition: Edition,
  target: ScopeTarget,
  scopeLabel: string
): Entry[] {
  const entries: Entry[] = [];

  for (const definition of edition.glossary.definitions) {
    const href = scopeTabPath(target, "metrics", definition.id);
    entries.push({
      key: `metric:${definition.id}`,
      group: "Metrics",
      title: definition.label,
      subtitle: definition.id,
      tag: definition.family_label,
      keywords: [
        definition.id,
        definition.family,
        definition.family_label,
        ...definition.also_known_as,
      ],
      href,
      workingMetricId: definition.id,
      icon: SlidersHorizontal,
    });
  }

  for (const row of scopeRows(edition)) {
    entries.push({
      key: `scope:${row.key}`,
      group: "Scopes",
      title: row.label,
      subtitle:
        row.level === "org"
          ? "Organisation"
          : row.level === "project"
            ? "Project"
            : "Repository",
      keywords: [row.key],
      href: scopeTabPath(row.target, "overview"),
      icon: Layers3,
    });
  }

  edition.headlines.forEach((headline, index) => {
    const headlineTarget = targetForKey(edition, headline.scope_key);
    entries.push({
      key: `finding:${index}`,
      group: "Findings",
      title: headline.title,
      subtitle: `${headline.value_display} · ${edition.scopeSummaries[headline.scope_key]?.scope.label ?? headline.scope_key}`,
      tag: headline.severity,
      keywords: [headline.metric_id, headline.ruleset_version, headline.scope_key],
      href: scopeTabPath(headlineTarget, "findings"),
      icon: AlertTriangle,
    });
  });

  const tabs: TabId[] = ["overview", "findings", "metrics", "trends", "repositories"];
  for (const tab of tabs) {
    if (tab === "repositories" && target.level === "repo") continue;
    entries.push({
      key: `screen:${tab}`,
      group: "Screens",
      title:
        tab === "overview"
          ? `Overview — ${scopeLabel}`
          : `${tab[0].toUpperCase()}${tab.slice(1)} — ${scopeLabel}`,
      subtitle: "In the current scope",
      keywords: [tab],
      href: scopeTabPath(target, tab),
      icon: SCREEN_ICONS[tab] ?? Activity,
    });
  }
  entries.push(
    {
      key: "screen:evidence",
      group: "Screens",
      title: "Evidence index",
      subtitle: `${edition.evidenceCounts.total.toLocaleString("en-GB")} cited records`,
      keywords: ["evidence", "records", "sources"],
      href: EVIDENCE_PATH,
      icon: BookOpen,
    },
    {
      key: "screen:methodology",
      group: "Screens",
      title: "Methodology & data quality",
      subtitle: "How every figure was produced",
      keywords: ["methodology", "quality", "governance", "limits"],
      href: METHODOLOGY_PATH,
      icon: ShieldCheck,
    },
    {
      key: "screen:compare",
      group: "Screens",
      title: "Compare scopes",
      subtitle: "Up to three scopes side by side",
      keywords: ["compare", "side by side"],
      href: COMPARE_PATH,
      icon: Layers3,
    }
  );

  return entries;
}

const GROUP_ORDER: Entry["group"][] = ["Metrics", "Scopes", "Findings", "Screens"];

/* ------------------------------------------------------------- scoring */

/**
 * cmdk's built-in scorer is a subsequence fuzz: for the query "review" it
 * ranks "Days per week with any activity" above "…with a recorded review",
 * because r-e-v-i-e-w happens to appear in order somewhere in the longer
 * sentence. Over 57 metric ids and their prose that is the wrong default.
 *
 * So: every word of the query must actually appear in the item's searchable
 * text. Matches at a word boundary beat mid-word ones, and earlier matches
 * beat later ones. The cost is that a transposed letter finds nothing rather
 * than something — which is why §3.3 specifies empty-state copy that names a
 * real metric id, and why the id is in every item's search text.
 */
export function scoreEntry(haystack: string, search: string): number {
  const text = haystack.toLowerCase();
  const query = search.trim().toLowerCase();
  if (!query) return 1;

  const terms = query.split(/\s+/);
  let total = 0;
  for (const term of terms) {
    const at = text.indexOf(term);
    if (at === -1) return 0;
    const boundary = at === 0 || /[^a-z0-9]/.test(text[at - 1]) ? 1 : 0.55;
    total += boundary * (1 / (1 + at / 40));
  }
  return Math.min(1, 0.1 + (total / terms.length) * 0.9);
}

export default function CommandPalette({
  edition,
  target,
  scopeLabel,
  open,
  onOpenChange,
}: {
  edition: Edition | undefined;
  target: ScopeTarget;
  scopeLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setRecents(readRecents());
    }
  }, [open]);

  const entries = useMemo(
    () => (edition ? buildEntries(edition, target, scopeLabel) : []),
    [edition, target, scopeLabel]
  );

  const byKey = useMemo(
    () => new Map(entries.map(entry => [entry.key, entry])),
    [entries]
  );

  const select = useCallback(
    (entry: Entry, working: boolean) => {
      const next = [entry.key, ...recents.filter(key => key !== entry.key)];
      writeRecents(next);
      setRecents(next.slice(0, RECENTS_LIMIT));
      onOpenChange(false);
      if (working && entry.workingMetricId) {
        /* "In place": the drawer opens over whatever you were already
           reading, so the URL keeps its pathname and gains one param. */
        navigate(
          withWorking(
            window.location.pathname + window.location.search,
            entry.workingMetricId
          )
        );
        return;
      }
      navigate(entry.href);
    },
    [navigate, onOpenChange, recents]
  );

  /* ⌘-Enter is a modifier on the *highlighted* item, which cmdk owns. We read
     the highlighted value off the list and dispatch ourselves. */
  const listRef = useRef<HTMLDivElement>(null);
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;
      const selected = listRef.current?.querySelector<HTMLElement>(
        '[cmdk-item][data-selected="true"]'
      );
      const key = selected?.getAttribute("data-entry-key");
      const entry = key ? byKey.get(key) : undefined;
      if (!entry?.workingMetricId) return;
      event.preventDefault();
      select(entry, true);
    },
    [byKey, select]
  );

  const trimmed = query.trim();
  const recentEntries = recents
    .map(key => byKey.get(key))
    .filter((entry): entry is Entry => entry !== undefined);

  /* Empty query shows recents, then Screens (SPEC §3.3) — not all 75 rows. */
  const visible = trimmed
    ? entries
    : entries.filter(entry => entry.group === "Screens");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="palette-backdrop" />
        <Dialog.Content
          className="palette-shell"
          aria-describedby={undefined}
          onOpenAutoFocus={event => {
            /* cmdk's input takes focus itself; letting Radix focus the panel
               first makes the first keystroke vanish. */
            event.preventDefault();
          }}
        >
          <Dialog.Title className="sr-only">Search this edition</Dialog.Title>
          <CommandPrimitive
            label="Search this edition"
            onKeyDown={onKeyDown}
            loop
            filter={(value, search, keywords) =>
              scoreEntry([value, ...(keywords ?? [])].join(" "), search)
            }
          >
            <div className="palette-input-row">
              <Search size={17} aria-hidden="true" />
              <CommandPrimitive.Input
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder="Search metrics, scopes, findings…"
              />
              <span className="palette-esc" aria-hidden="true">
                ESC
              </span>
            </div>

            <CommandPrimitive.List className="palette-list" ref={listRef}>
              <CommandPrimitive.Empty className="palette-empty">
                Nothing matches “{trimmed}”. Try a metric id like{" "}
                <code>process.review_coverage</code>.
              </CommandPrimitive.Empty>

              {!trimmed && recentEntries.length > 0 && (
                <CommandPrimitive.Group heading="Recent">
                  {recentEntries.map(entry => (
                    <PaletteItem
                      key={`recent-${entry.key}`}
                      entry={entry}
                      valueSuffix="recent"
                      onSelect={() => select(entry, false)}
                    />
                  ))}
                </CommandPrimitive.Group>
              )}

              {GROUP_ORDER.map(group => {
                const items = visible.filter(entry => entry.group === group);
                if (items.length === 0) return null;
                return (
                  <CommandPrimitive.Group key={group} heading={group}>
                    {items.map(entry => (
                      <PaletteItem
                        key={entry.key}
                        entry={entry}
                        onSelect={() => select(entry, false)}
                      />
                    ))}
                  </CommandPrimitive.Group>
                );
              })}
            </CommandPrimitive.List>

            <div className="palette-foot">
              <span>
                <CornerDownLeft size={11} aria-hidden="true" /> open
              </span>
              <span>
                <kbd>⌘</kbd>
                <kbd>↵</kbd> the working
              </span>
              <span>
                <ArrowRight size={11} aria-hidden="true" /> in {scopeLabel}
              </span>
            </div>
          </CommandPrimitive>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PaletteItem({
  entry,
  onSelect,
  valueSuffix,
}: {
  entry: Entry;
  onSelect: () => void;
  valueSuffix?: string;
}) {
  const Icon = entry.icon;
  return (
    <CommandPrimitive.Item
      className="palette-item"
      value={valueSuffix ? `${entry.key} ${valueSuffix}` : entry.key}
      keywords={[entry.title, entry.subtitle, ...entry.keywords]}
      data-entry-key={entry.key}
      onSelect={onSelect}
    >
      <Icon size={15} aria-hidden="true" />
      <span className="palette-item-copy">
        <strong>{entry.title}</strong>
        <small>{entry.subtitle}</small>
      </span>
      {entry.tag && <span className="palette-item-tag">{entry.tag}</span>}
    </CommandPrimitive.Item>
  );
}
