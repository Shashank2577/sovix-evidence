/**
 * Scope switcher — SPEC §3.1 (sidebar popover) and §3.4 (mobile full-screen
 * sheet). Renders `navigation`: the org row, then each project with its repos
 * indented beneath it.
 *
 * Selecting a scope keeps you on the tab you were reading, falling to Overview
 * where that tab doesn't exist at the new altitude (Repositories at repo
 * level) — `scopeTabPath` enforces that, so it cannot drift.
 */

import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Layers3, X } from "lucide-react";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";

import { scopeTabPath, type TabId } from "@/app/routes";
import {
  initialsFor,
  repoTint,
  scopeRows,
  type ResolvedScope,
  type ScopeRow,
} from "@/app/scope";
import type { Edition } from "@/data";

interface TreeProps {
  edition: Edition;
  currentKey: string | null;
  tab: TabId;
  onNavigate: () => void;
}

/**
 * The tree itself. Every row is a real link (so it can be opened in a new tab),
 * with roving arrow-key focus over the flat row order — which is the reading
 * order of the tree, org → project → its repos.
 */
function ScopeTree({ edition, currentKey, tab, onNavigate }: TreeProps) {
  const rows = scopeRows(edition);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      const focusAt = (next: number) => {
        event.preventDefault();
        const clamped = Math.max(0, Math.min(rows.length - 1, next));
        refs.current[clamped]?.focus();
      };
      switch (event.key) {
        case "ArrowDown":
          return focusAt(index + 1);
        case "ArrowUp":
          return focusAt(index - 1);
        case "Home":
          return focusAt(0);
        case "End":
          return focusAt(rows.length - 1);
        case "ArrowRight": {
          /* Into the first child of a project; repos have no children. */
          if (rows[index].level !== "repo" && rows[index + 1]?.level === "repo")
            return focusAt(index + 1);
          if (rows[index].level === "org" && rows[index + 1])
            return focusAt(index + 1);
          return;
        }
        case "ArrowLeft": {
          /* Out to the nearest shallower ancestor above. */
          const level = rows[index].level;
          if (level === "org") return;
          for (let i = index - 1; i >= 0; i -= 1) {
            if (
              (level === "repo" && rows[i].level !== "repo") ||
              (level === "project" && rows[i].level === "org")
            )
              return focusAt(i);
          }
          return;
        }
        default:
          return;
      }
    },
    [rows]
  );

  return (
    <div className="scope-tree" role="tree" aria-label="Scopes in this edition">
      {rows.map((row, index) => (
        <ScopeTreeRow
          key={row.key}
          row={row}
          index={index}
          tab={tab}
          current={row.key === currentKey}
          onNavigate={onNavigate}
          onKeyDown={onKeyDown}
          register={element => {
            refs.current[index] = element;
          }}
        />
      ))}
    </div>
  );
}

function ScopeTreeRow({
  row,
  index,
  tab,
  current,
  onNavigate,
  onKeyDown,
  register,
}: {
  row: ScopeRow;
  index: number;
  tab: TabId;
  current: boolean;
  onNavigate: () => void;
  onKeyDown: (event: React.KeyboardEvent, index: number) => void;
  register: (element: HTMLAnchorElement | null) => void;
}) {
  const sublabel =
    row.level === "repo"
      ? "Repository"
      : row.repoCount === null
        ? ""
        : `${row.repoCount} ${row.repoCount === 1 ? "repository" : "repositories"}`;

  return (
    <Link
      href={scopeTabPath(row.target, tab)}
      ref={register}
      className={`scope-row level-${row.level}`}
      data-current={current}
      role="treeitem"
      aria-level={row.level === "org" ? 1 : row.level === "project" ? 2 : 3}
      aria-selected={current}
      onClick={onNavigate}
      onKeyDown={event => onKeyDown(event, index)}
    >
      <span
        className="scope-avatar"
        style={{
          background: row.level === "org" ? "var(--accent-ink)" : repoTint(row.label),
        }}
        aria-hidden="true"
      >
        {row.level === "org" ? <Layers3 size={13} /> : initialsFor(row.label)}
      </span>
      <span className="scope-row-copy">
        <strong>{row.label}</strong>
        {sublabel && <small>{sublabel}</small>}
      </span>
      {current && <Check size={14} aria-hidden="true" />}
    </Link>
  );
}

/* ------------------------------------------------------------- desktop */

interface SwitcherProps {
  edition: Edition | undefined;
  scope: ResolvedScope | null;
  tab: TabId;
  /** Inner content of the trigger button; the sidebar and filter row differ. */
  children: ReactNode;
  triggerClassName?: string;
  triggerLabel: string;
}

export function ScopeSwitcher({
  edition,
  scope,
  tab,
  children,
  triggerClassName = "workspace-switcher",
  triggerLabel,
}: SwitcherProps) {
  const [open, setOpen] = useState(false);

  /* Before the edition loads there is no tree to show, so the trigger renders
     as an inert button rather than a popover that opens onto nothing. */
  if (!edition)
    return (
      <button className={triggerClassName} disabled aria-label={triggerLabel}>
        {children}
      </button>
    );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className={triggerClassName} aria-label={triggerLabel}>
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="scope-popover"
          align="start"
          sideOffset={7}
          collisionPadding={12}
        >
          <div className="scope-popover-label">Scope · this edition</div>
          <ScopeTree
            edition={edition}
            currentKey={scope?.key ?? null}
            tab={tab}
            onNavigate={() => setOpen(false)}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** Contents of the sidebar's trigger — brand-adjacent, as in the reference. */
export function ScopeSwitcherFace({ scope }: { scope: ResolvedScope | null }) {
  const label = scope?.label ?? "Unknown scope";
  /* The org's label already *is* "All repositories", so naming the level is
     the only sublabel that adds anything. */
  const kicker =
    scope === null
      ? "Not in this edition"
      : scope.summary.scope.level === "repo"
        ? "Repository"
        : scope.summary.scope.level === "project"
          ? "Project"
          : "Organisation";
  return (
    <>
      <span
        className="workspace-avatar"
        style={{ background: scope ? repoTint(label) : "var(--ornament)" }}
        aria-hidden="true"
      >
        {scope ? initialsFor(label) : "··"}
      </span>
      <span className="workspace-copy">
        <strong>{label}</strong>
        <small>{kicker}</small>
      </span>
      <ChevronDown size={14} />
    </>
  );
}

/* -------------------------------------------------------------- mobile */

export function ScopeSheet({
  edition,
  scope,
  tab,
  open,
  onOpenChange,
}: {
  edition: Edition | undefined;
  scope: ResolvedScope | null;
  tab: TabId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-backdrop" />
        <Dialog.Content className="sheet-panel full" aria-describedby={undefined}>
          <div className="sheet-head">
            <Dialog.Title asChild>
              <h2>Choose a scope</h2>
            </Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Close scope list">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="sheet-body">
            {edition && (
              <ScopeTree
                edition={edition}
                currentKey={scope?.key ?? null}
                tab={tab}
                onNavigate={() => onOpenChange(false)}
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
