// Sidebar views: named shortcuts for common status + due-date filter combos.
import type { DueFilter, Stats, StatusFilter } from "../api/types";
import type { IconName } from "~/components/ui/icons";

export interface View {
  id: string;
  label: string;
  /** Shown in its "filled" (tinted) style while the view is active. */
  icon: IconName;
  status: StatusFilter;
  due: DueFilter;
  /** Which stat to show as the count, if any. */
  count?: (stats: Stats) => number;
  tone?: "error";
}

export const VIEWS: View[] = [
  { id: "active", label: "Active", icon: "inbox", status: "active", due: { kind: "any" }, count: (s) => s.active },
  { id: "today", label: "Today", icon: "sun", status: "active", due: { kind: "today" }, count: (s) => s.dueToday },
  { id: "week", label: "This week", icon: "calendar-range", status: "active", due: { kind: "thisWeek" } },
  { id: "overdue", label: "Overdue", icon: "calendar-x", status: "active", due: { kind: "overdue" }, count: (s) => s.overdue, tone: "error" },
  { id: "noDate", label: "No due date", icon: "calendar-off", status: "active", due: { kind: "noDate" } },
  { id: "completed", label: "Completed", icon: "circle-check", status: "completed", due: { kind: "any" }, count: (s) => s.completed },
  { id: "all", label: "All tasks", icon: "layers", status: "all", due: { kind: "any" }, count: (s) => s.total },
];
