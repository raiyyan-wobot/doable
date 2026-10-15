// Due dates travel as "YYYY-MM-DD" strings (Rust's NaiveDate). These helpers
// treat them as *local* calendar dates; `new Date("2026-10-15")` would parse
// as UTC midnight and show the wrong day in timezones west of UTC.

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Whole days from today to `iso`: 0 = today, 1 = tomorrow, -1 = yesterday. */
export function daysFromToday(iso: string, now = new Date()): number {
  const today = parseISODate(toISODate(now));
  // Math.round absorbs the 23h/25h days around daylight-saving changes.
  return Math.round((parseISODate(iso).getTime() - today.getTime()) / DAY_MS);
}

/** Human label: "Today", "Tomorrow", "Yesterday", "Mon, 20 Oct", "3 Jan 2027". */
export function formatDue(iso: string, now = new Date()): string {
  const diff = daysFromToday(iso, now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  const date = parseISODate(iso);
  return date.toLocaleDateString(undefined, {
    weekday: Math.abs(diff) < 7 ? "short" : undefined,
    day: "numeric",
    month: "short",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

/** Long form for fields: "Sun, 1 Nov 2026" (locale-formatted). */
export function formatLongDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---- Calendar math (used by components/ui/date-picker.tsx) ----

/** `iso` moved by `days` (may be negative). */
export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** `iso` moved by `months`, clamping the day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(iso: string, months: number): string {
  const d = parseISODate(iso);
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  return toISODate(target);
}

/** Days since Monday: Mon = 0 … Sun = 6 (weeks start on Monday, like the backend's "This week"). */
export function weekdayIndex(iso: string): number {
  return (parseISODate(iso).getDay() + 6) % 7;
}

/**
 * The 6×7 grid of ISO dates shown for the month containing `iso`, starting on
 * the Monday on or before the 1st. Six rows always, so the picker never
 * changes height while navigating.
 */
export function monthGrid(iso: string): string[] {
  const first = `${iso.slice(0, 8)}01`;
  const start = addDays(first, -weekdayIndex(first));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Short weekday names starting Monday, e.g. ["M", "T", "W", …] in the user's locale. */
export function weekdayLabels(style: "narrow" | "short" | "long" = "narrow"): string[] {
  // 2024-01-01 was a Monday.
  return Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(undefined, { weekday: style }),
  );
}

/** "October 2026" for the month containing `iso`. */
export function formatMonth(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
