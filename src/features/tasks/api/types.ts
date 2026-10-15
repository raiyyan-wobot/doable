// Types shared with the Rust backend. Each one mirrors a Rust type (serde
// renames fields to camelCase); the Rust file is noted next to each group.
// Keep the two sides in sync. The contract tests in client.test.ts and
// src-tauri/src/ipc_tests.rs fail if they drift apart.

// ---- domain/task.rs ----

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  /** Local calendar date, "YYYY-MM-DD". */
  dueDate: string | null;
  tags: string[];
  /** RFC 3339 timestamps in UTC. */
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

/** The user-editable fields, sent on create and update. */
export interface TaskInput {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
  tags: string[];
}

// ---- domain/query ----

export type StatusFilter = "all" | "active" | "completed";

/** Rust enum with `#[serde(tag = "kind")]` → a discriminated union on `kind`. */
export type DueFilter =
  | { kind: "any" }
  | { kind: "overdue" }
  | { kind: "today" }
  | { kind: "thisWeek" }
  | { kind: "noDate" }
  | { kind: "range"; from: string | null; to: string | null };

export type DueFilterKind = DueFilter["kind"];
export type DueRange = Extract<DueFilter, { kind: "range" }>;

export type SortBy = "createdAt" | "updatedAt" | "dueDate" | "priority" | "title";
export type SortDir = "asc" | "desc";

/** Every field is optional on the Rust side (`#[serde(default)]`). */
export interface TaskQuery {
  search?: string;
  status?: StatusFilter;
  priority?: Priority | null;
  tag?: string | null;
  due?: DueFilter;
  sortBy?: SortBy;
  sortDir?: SortDir;
}

export interface Stats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  dueToday: number;
}

// ---- transfer/ ----

export type FileFormat = "json" | "csv";
export type ImportMode = "merge" | "replace";

export interface ImportSummary {
  added: number;
  updated: number;
  skipped: number;
}
