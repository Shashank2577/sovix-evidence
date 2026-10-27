/**
 * One column's scope picker (SPEC §5.7).
 *
 * The same tree the sidebar switcher shows, in the same markup, doing a
 * different job: the switcher's rows are links because choosing there is a
 * navigation, and these are buttons because choosing here sets one column of the
 * screen you are already on.
 *
 * A scope already in another column renders disabled with the reason spelled out
 * beside it, rather than being hidden. Removing rows would make the tree change
 * shape between slots, and a reader who cannot find `axios/axios` in the list
 * learns nothing about why.
 */

import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Layers3 } from "lucide-react";
import { useState } from "react";

import { initialsFor, repoTint, scopeRows } from "@/app/scope";
import type { Edition, ScopeKey, ScopeSlug } from "@/data";
import * as copy from "@/copy";

export function ScopeSlotPicker({
  edition,
  index,
  currentKey,
  takenKeys,
  onChoose,
  children,
}: {
  edition: Edition;
  /** 1-based, as the label reads it. */
  index: number;
  currentKey: ScopeKey | null;
  takenKeys: ScopeKey[];
  onChoose: (slug: ScopeSlug) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rows = scopeRows(edition);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className="cmp-slot__trigger"
        aria-label={copy.fill(copy.compare.slotChange, { index })}
      >
        {children}
        <ChevronDown size={14} aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="scope-popover"
          align="start"
          sideOffset={7}
          collisionPadding={12}
        >
          <div className="scope-popover-label">{copy.compare.slotChoose}</div>
          <div className="scope-tree" role="listbox">
            {rows.map(row => {
              const current = row.key === currentKey;
              const taken = !current && takenKeys.includes(row.key);
              return (
                <button
                  type="button"
                  key={row.key}
                  className={`scope-row level-${row.level}`}
                  role="option"
                  aria-selected={current}
                  data-current={current}
                  disabled={taken}
                  onClick={() => {
                    onChoose(edition.slugByKey[row.key]);
                    setOpen(false);
                  }}
                >
                  <span
                    className="scope-avatar"
                    style={{
                      background:
                        row.level === "org"
                          ? "var(--accent-ink)"
                          : repoTint(row.label),
                    }}
                    aria-hidden="true"
                  >
                    {row.level === "org" ? (
                      <Layers3 size={13} />
                    ) : (
                      initialsFor(row.label)
                    )}
                  </span>
                  <span className="scope-row-copy">
                    <strong>{row.label}</strong>
                    {taken && <small>{copy.compare.slotTaken}</small>}
                  </span>
                  {current && <Check size={14} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
