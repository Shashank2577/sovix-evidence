/**
 * `WorkHeatmap` (SPEC §6.9, §7.5, §8.5).
 *
 * Seven rows of hours, coloured in five steps rather than a continuous ramp —
 * steps are legible, a gradient is not. A cell of zero commits renders as
 * `--surface-3` and that is correct here: over a 54-week window, "nobody committed
 * at 03:00 on a Sunday" is an observed zero, not a missing measurement. This is the
 * one chart in the kit where zero is data.
 *
 * **The band collapse.** Below 781px the 24 hourly columns become 12 two-hour
 * bands, and below 431px six four-hour bands. Bands **sum** their hours; they never
 * sample one and drop the rest. A summed band is still a true count, where a
 * scrolling grid would hide half the picture and a rotated one would be unreadable.
 * The full resolution stays reachable: selecting a band offers its hours as a
 * detail grid beneath.
 *
 * Nothing here is hover-only: every cell is a tab-reachable grid cell with a full
 * text label, arrow keys walk the grid, and the selection is read out in a
 * persistent strip.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

import type { Heatmap } from "@/data";
import { cn } from "@/lib/utils";

import { formatNumber, hourLabel, hourRangeLabel } from "./format";
import { useMediaQuery } from "./hooks";

/** Hours summed into one column, by width (§7.5). */
export type BandSize = 1 | 2 | 4;

/** §8.5: column-sweep stagger of 8ms, total under 400ms. */
const COLUMN_STAGGER_MS = 8;

export interface WorkHeatmapProps {
  heatmap: Heatmap;
  /** Force a band size; by default it follows the viewport. */
  bandSize?: BandSize;
  className?: string;
}

interface Cell {
  /** First hour of the band. */
  hour: number;
  value: number;
}

export function WorkHeatmap({
  heatmap,
  bandSize,
  className,
}: WorkHeatmapProps) {
  const narrow = useMediaQuery("(max-width: 780px)");
  const verySmall = useMediaQuery("(max-width: 430px)");
  const span: BandSize = bandSize ?? (verySmall ? 4 : narrow ? 2 : 1);

  const rows = useMemo(
    () => bandRows(heatmap.grid, span),
    [heatmap.grid, span]
  );
  const columns = rows[0]?.length ?? 0;

  const values = useMemo(() => rows.flat().map(cell => cell.value), [rows]);
  const max = values.length === 0 ? 0 : Math.max(...values);
  const min = values.length === 0 ? 0 : Math.min(...values);

  const [selected, setSelected] = useState<{
    day: number;
    column: number;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  /* A different band size renumbers the columns; the old coordinate is meaningless. */
  useEffect(() => {
    setSelected(null);
    setExpanded(false);
  }, [span]);

  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { once: true, margin: "-10%" });
  const reduced = useReducedMotion();

  const focusCell = (day: number, column: number) => {
    const next = gridRef.current?.querySelector<HTMLButtonElement>(
      `[data-day="${day}"][data-column="${column}"]`
    );
    next?.focus();
  };

  const onKeyDown = (
    event: React.KeyboardEvent,
    day: number,
    column: number
  ) => {
    let nextDay = day;
    let nextColumn = column;
    switch (event.key) {
      case "ArrowLeft":
        nextColumn = Math.max(0, column - 1);
        break;
      case "ArrowRight":
        nextColumn = Math.min(columns - 1, column + 1);
        break;
      case "ArrowUp":
        nextDay = Math.max(0, day - 1);
        break;
      case "ArrowDown":
        nextDay = Math.min(rows.length - 1, day + 1);
        break;
      case "Home":
        nextColumn = 0;
        break;
      case "End":
        nextColumn = columns - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    setSelected({ day: nextDay, column: nextColumn });
    focusCell(nextDay, nextColumn);
  };

  /* One tab stop for the whole grid: the selected cell, or the first one (§6.9). */
  const roving = selected ?? { day: 0, column: 0 };

  const selectedCell = selected ? rows[selected.day][selected.column] : null;
  const bandLabel = (hour: number) =>
    span === 1
      ? `${hourLabel(hour)}–${hourLabel((hour + 1) % 24)}`
      : hourRangeLabel(hour, span);

  return (
    <figure className={cn("work-heatmap", className)} data-band={span}>
      <div
        className="wh-frame"
        style={{ "--columns": columns } as React.CSSProperties}
      >
        <div className="wh-hours" aria-hidden="true">
          {rows[0]?.map((cell, column) =>
            column % (span === 1 ? 3 : span === 2 ? 2 : 1) === 0 ? (
              <span key={cell.hour} style={{ gridColumn: column + 1 }}>
                {String(cell.hour).padStart(2, "0")}
              </span>
            ) : null
          )}
        </div>

        <div className="wh-body">
          <div className="wh-days" aria-hidden="true">
            {heatmap.weekdays.map(day => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div
            ref={gridRef}
            className="wh-grid"
            role="grid"
            aria-label={`Commits by weekday and hour${
              span === 1 ? "" : `, summed into ${span}-hour bands`
            }. ${formatNumber(heatmap.total)} commits in total. Use the arrow keys to move between cells.`}
          >
            {rows.map((cells, day) => (
              <div className="wh-row" role="row" key={heatmap.weekdays[day]}>
                {cells.map((cell, column) => {
                  const isSelected =
                    selected?.day === day && selected?.column === column;
                  return (
                    <button
                      type="button"
                      role="gridcell"
                      key={cell.hour}
                      data-day={day}
                      data-column={column}
                      data-step={colourStep(cell.value, max)}
                      data-selected={isSelected ? "" : undefined}
                      className="wh-cell"
                      tabIndex={
                        roving.day === day && roving.column === column ? 0 : -1
                      }
                      style={
                        {
                          "--column": column,
                          animationDelay: reduced
                            ? "0ms"
                            : `${column * COLUMN_STAGGER_MS}ms`,
                        } as React.CSSProperties
                      }
                      data-revealed={inView ? "" : undefined}
                      aria-label={`${heatmap.weekdays[day]} ${bandLabel(
                        cell.hour
                      )}, ${formatNumber(cell.value)} ${
                        cell.value === 1 ? "commit" : "commits"
                      }`}
                      onClick={() => {
                        setSelected({ day, column });
                        setExpanded(false);
                      }}
                      onKeyDown={event => onKeyDown(event, day, column)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="wh-strip" aria-live="polite">
        {selectedCell === null ? (
          <p className="wh-readout wh-readout-idle">
            Select a cell — by tap, click, or the arrow keys — to read its
            count.
          </p>
        ) : (
          <p className="wh-readout">
            <strong>
              {plural(heatmap.weekdays[selected!.day])}{" "}
              {bandLabel(selectedCell.hour)}
            </strong>
            <span className="wh-readout-value">
              {formatNumber(selectedCell.value)}{" "}
              {selectedCell.value === 1 ? "commit" : "commits"}
            </span>
            {span === 1 ? null : (
              <button
                type="button"
                className="wh-expand"
                aria-expanded={expanded}
                onClick={() => setExpanded(value => !value)}
              >
                {expanded ? "Hide" : "Show"} the {span} hours in this band
              </button>
            )}
          </p>
        )}
      </div>

      {expanded && selectedCell !== null && span !== 1 ? (
        <BandDetail
          grid={heatmap.grid}
          weekdays={heatmap.weekdays}
          startHour={selectedCell.hour}
          span={span}
        />
      ) : null}

      <div className="wh-legend">
        {/*
          The leftmost swatch is the zero colour, so it is labelled zero. Labelling
          it with the quietest observed cell — which at org scope is 1, not 0 —
          would put a number under a swatch that does not mean that number.
        */}
        <span className="wh-legend-min">0</span>
        <span className="wh-legend-steps" title={stepRanges(max)}>
          {[0, 1, 2, 3, 4].map(stepIndex => (
            <i key={stepIndex} data-step={stepIndex} />
          ))}
        </span>
        <span className="wh-legend-max">{formatNumber(max)} commits</span>
        <span className="wh-legend-note">
          {span === 1
            ? "one cell = one hour"
            : `one cell = ${span} hours, summed`}
        </span>
      </div>

      {/*
        §6.9 asks the legend for min and max. The max sits beside the swatches; the
        min lives here instead, because putting it under the leftmost swatch would
        label the zero colour with a number that is not zero. Both are stated, and
        the step ranges spell out what each colour means in counts — colour is never
        the only carrier of a value.
      */}
      <figcaption className="wh-caption">
        {heatmap.note} {formatNumber(heatmap.total)} commits in the window, from{" "}
        {formatNumber(min)} to {formatNumber(max)} per{" "}
        {span === 1 ? "hour" : "band"}. Colour steps: {stepRanges(max)}.
      </figcaption>
    </figure>
  );
}

/**
 * The band's own hours at full resolution, 7 rows × `span` columns. This is what
 * keeps the collapse honest: the summed view is the default on a narrow screen,
 * and the hours it summed are one tap away rather than gone.
 */
function BandDetail({
  grid,
  weekdays,
  startHour,
  span,
}: {
  grid: number[][];
  weekdays: string[];
  startHour: number;
  span: BandSize;
}) {
  const hours = Array.from({ length: span }, (_, offset) => startHour + offset);
  return (
    <table className="wh-detail">
      <caption>
        The {span} hours inside {hourRangeLabel(startHour, span)}
      </caption>
      <thead>
        <tr>
          <th scope="col">Day</th>
          {hours.map(hour => (
            <th scope="col" key={hour}>
              {hourLabel(hour)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weekdays.map((day, index) => (
          <tr key={day}>
            <th scope="row">{day}</th>
            {hours.map(hour => (
              <td key={hour}>{formatNumber(grid[index][hour])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Sum adjacent hours into bands. Summing, never sampling: a band that reported one
 * of its hours would be a smaller number than the truth, presented as the truth.
 */
export function bandRows(grid: number[][], span: BandSize): Cell[][] {
  return grid.map(row => {
    const cells: Cell[] = [];
    for (let hour = 0; hour < 24; hour += span) {
      let total = 0;
      for (let offset = 0; offset < span; offset += 1) {
        total += row[hour + offset] ?? 0;
      }
      cells.push({ hour, value: total });
    }
    return cells;
  });
}

/**
 * Five steps, not a continuous ramp (§6.9). Step 0 is a true zero and gets the
 * inert surface colour; 1–4 split the observed range into quarters.
 */
export function colourStep(value: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (value === 0 || max === 0) return 0;
  const quarter = Math.ceil((value / max) * 4);
  return Math.min(4, Math.max(1, quarter)) as 1 | 2 | 3 | 4;
}

/**
 * The five steps spelled out, for the legend's title and the caption. Colour alone
 * is never the only carrier of a value here — §6.9's legend row exists for exactly
 * this, and a reader who cannot separate the two palest violets can read the count.
 */
export function stepRanges(max: number): string {
  if (max === 0) return "0 only";
  const parts = ["0"];
  for (const step of [1, 2, 3, 4]) {
    /* The inverse of `colourStep`: step k holds ⌊(k−1)·max/4⌋+1 … ⌊k·max/4⌋. */
    const from = Math.floor(((step - 1) * max) / 4) + 1;
    const to = Math.floor((step * max) / 4);
    /* Always five slots, so a swatch and its label never drift out of step. */
    parts.push(
      from > to
        ? "–"
        : from === to
          ? formatNumber(from)
          : `${formatNumber(from)}–${formatNumber(to)}`
    );
  }
  return parts.join(" · ");
}

/** "Tue" → "Tuesdays", the wording §6.9 specifies for the readout. */
const FULL_DAYS: Record<string, string> = {
  Mon: "Mondays",
  Tue: "Tuesdays",
  Wed: "Wednesdays",
  Thu: "Thursdays",
  Fri: "Fridays",
  Sat: "Saturdays",
  Sun: "Sundays",
};

function plural(weekday: string): string {
  return FULL_DAYS[weekday] ?? `${weekday}s`;
}
