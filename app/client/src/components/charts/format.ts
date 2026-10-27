/**
 * Formatting for chart readouts (SPEC §9.8).
 *
 * `displays are law`: the client renders the dataset's `display` strings verbatim
 * and never reformats `value`. Series points carry no display string — only a
 * number and a unit — so the few formatters below exist for exactly that case and
 * nothing else. They group thousands and append the unit; they never round a
 * figure away (three fraction digits is more than this edition's data carries).
 */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const numberFormat = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 3,
});

/** `"2025-09"` → `"September 2025"`. A month label, which §9.8 permits us to form. */
export function monthLong(month: string): string {
  const [year, index] = month.split("-");
  return `${MONTH_NAMES[Number(index) - 1]} ${year}`;
}

/** `"2025-09"` → `"Sep"`, except January which carries the year: `"Jan 26"`. */
export function monthTick(month: string): string {
  const [year, index] = month.split("-");
  const short = MONTH_NAMES[Number(index) - 1].slice(0, 3);
  return index === "01" ? `${short} ${year.slice(2)}` : short;
}

/** `"2025-09"` → `"Sep 2025"`, for aria labels where context is not visual. */
export function monthShortWithYear(month: string): string {
  const [year, index] = month.split("-");
  return `${MONTH_NAMES[Number(index) - 1].slice(0, 3)} ${year}`;
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/**
 * A series value with its unit attached. `percent` takes the sign directly; every
 * other unit is a plural noun the dataset already supplies (`commits`, `lines`,
 * `people`, `hours`).
 */
export function formatValue(value: number, unit: string): string {
  if (unit === "percent") return `${formatNumber(value)}%`;
  if (unit === "hours") return `${formatNumber(value)} h`;
  return `${formatNumber(value)} ${unit}`;
}

/** Axis ticks are tighter than readouts: no unit noun, `%` and `h` only. */
export function formatAxisValue(value: number, unit: string): string {
  if (unit === "percent") return `${formatNumber(value)}%`;
  if (unit === "hours") return `${formatNumber(value)}h`;
  if (Math.abs(value) >= 10000)
    return `${formatNumber(Math.round(value / 1000))}k`;
  return formatNumber(value);
}

/** `"test_lines"` → `"test lines"`. Detail keys are snake_case in the dataset. */
export function humaniseKey(key: string): string {
  return key.replace(/_/g, " ");
}

/** `14` → `"14:00"`. */
export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** A band of `span` hours starting at `hour` → `"14:00–16:00"`. */
export function hourRangeLabel(hour: number, span: number): string {
  return `${hourLabel(hour)}–${hourLabel((hour + span) % 24)}`;
}
