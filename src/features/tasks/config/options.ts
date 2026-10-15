// Option lists for the <Select> controls in the filter bar and task editor.
import type { SelectOption } from "~/components/ui/select";
import type { DueFilterKind, Priority, SortBy, StatusFilter } from "../api/types";

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const PRIORITY_OPTIONS: SelectOption<Priority>[] = [
  { value: "low", label: PRIORITY_LABELS.low },
  { value: "medium", label: PRIORITY_LABELS.medium },
  { value: "high", label: PRIORITY_LABELS.high },
];

/** "any" is a UI-only value; it's sent to Rust as `priority: null`. */
export const PRIORITY_FILTER_OPTIONS: SelectOption<Priority | "any">[] = [
  { value: "any", label: "Any priority" },
  { value: "high", label: PRIORITY_LABELS.high },
  { value: "medium", label: PRIORITY_LABELS.medium },
  { value: "low", label: PRIORITY_LABELS.low },
];

export const STATUS_OPTIONS: SelectOption<StatusFilter>[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

export const DUE_OPTIONS: SelectOption<DueFilterKind>[] = [
  { value: "any", label: "Any due date" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "thisWeek", label: "Due this week" },
  { value: "noDate", label: "No due date" },
  { value: "range", label: "Date range" },
];

export const SORT_OPTIONS: SelectOption<SortBy>[] = [
  { value: "createdAt", label: "Date created" },
  { value: "updatedAt", label: "Last updated" },
  { value: "dueDate", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "title", label: "Title" },
];
