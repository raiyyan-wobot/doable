import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  daysFromToday,
  formatDue,
  monthGrid,
  parseISODate,
  toISODate,
  weekdayIndex,
  weekdayLabels,
} from "./dates";

// Thursday 15 Oct 2026, 23:30 local time: late in the day on purpose, to catch
// code that accidentally treats "YYYY-MM-DD" as UTC.
const NOW = new Date(2026, 9, 15, 23, 30);

describe("toISODate / parseISODate", () => {
  it("round-trips a local calendar date", () => {
    expect(toISODate(parseISODate("2026-01-05"))).toBe("2026-01-05");
  });

  it("pads month and day", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("daysFromToday", () => {
  it.each([
    ["2026-10-15", 0],
    ["2026-10-16", 1],
    ["2026-10-14", -1],
    ["2026-11-15", 31],
  ])("%s → %i", (iso, expected) => {
    expect(daysFromToday(iso, NOW)).toBe(expected);
  });
});

describe("formatDue", () => {
  it("uses relative words for nearby days", () => {
    expect(formatDue("2026-10-15", NOW)).toBe("Today");
    expect(formatDue("2026-10-16", NOW)).toBe("Tomorrow");
    expect(formatDue("2026-10-14", NOW)).toBe("Yesterday");
  });

  it("includes the weekday within a week", () => {
    const expected = new Date(2026, 9, 19).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    expect(formatDue("2026-10-19", NOW)).toBe(expected);
  });

  it("includes the year only for other years", () => {
    expect(formatDue("2026-12-25", NOW)).not.toMatch(/2026/);
    expect(formatDue("2027-01-03", NOW)).toMatch(/2027/);
  });
});

describe("calendar math", () => {
  it("addDays crosses month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("addMonths clamps to the last day of shorter months", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29"); // leap year
    expect(addMonths("2026-03-15", -3)).toBe("2025-12-15");
  });

  it("weekdayIndex counts from Monday", () => {
    expect(weekdayIndex("2026-10-12")).toBe(0); // Monday
    expect(weekdayIndex("2026-10-18")).toBe(6); // Sunday
  });

  it("monthGrid is 6 weeks starting on the Monday on or before the 1st", () => {
    const grid = monthGrid("2026-10-15"); // 1 Oct 2026 is a Thursday
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe("2026-09-28");
    expect(grid[3]).toBe("2026-10-01");
    expect(grid[41]).toBe("2026-11-08");
    expect(grid.every((d, i) => i === 0 || d === addDays(grid[i - 1], 1))).toBe(true);
  });

  it("weekday labels start on Monday", () => {
    expect(weekdayLabels("short")[0]).toBe(new Date(2026, 9, 12).toLocaleDateString(undefined, { weekday: "short" }));
  });
});
