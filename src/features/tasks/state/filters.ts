// Filter + sort state. It's sent to Rust as a `TaskQuery`; Rust does the
// actual filtering and sorting.
import { createMemo } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import type {
  DueFilter,
  DueFilterKind,
  Priority,
  SortBy,
  SortDir,
  StatusFilter,
  TaskQuery,
} from "../api/types";
import { VIEWS, type View } from "../config/views";

export interface Filters {
  search: string;
  status: StatusFilter;
  due: DueFilter;
  priority: Priority | null;
  tag: string | null;
  sortBy: SortBy;
  sortDir: SortDir;
}

export const DEFAULT_FILTERS: Filters = {
  search: "",
  status: "active",
  due: { kind: "any" },
  priority: null,
  tag: null,
  sortBy: "createdAt",
  sortDir: "desc",
};

export function createFilters() {
  const [values, set] = createStore<Filters>(structuredClone(DEFAULT_FILTERS));

  /** A fresh plain object whenever any filter changes. Spreading the store reads
   *  every field, so anything depending on `query` tracks all of them. */
  const query = createMemo<TaskQuery>(() => ({ ...values, due: { ...values.due } }));

  /** Replace the due filter. `reconcile` swaps the whole object; a plain set
   *  would *merge*, leaving stale `from`/`to` keys after leaving a range. */
  const setDue = (due: DueFilter) => set("due", reconcile(due));

  const setDueKind = (kind: DueFilterKind) =>
    setDue(kind === "range" ? { kind, from: null, to: null } : ({ kind } as DueFilter));

  const setRange = (edge: "from" | "to", value: string) => {
    const due = values.due;
    if (due.kind === "range") setDue({ ...due, [edge]: value || null });
  };

  const selectView = (view: View) => {
    set({ status: view.status, tag: null });
    setDue(view.due);
  };

  /** The sidebar view matching the current filters, if any. */
  const activeView = createMemo(() => {
    if (values.tag || values.due.kind === "range") return undefined;
    return VIEWS.find((v) => v.status === values.status && v.due.kind === values.due.kind);
  });

  /** Search, priority or tag narrowing applied on top of the current view. */
  const hasRefinements = () => values.search !== "" || values.priority !== null || values.tag !== null;
  const clearRefinements = () => set({ search: "", priority: null, tag: null });

  return {
    values,
    set,
    query,
    setDueKind,
    setRange,
    selectView,
    activeView,
    hasRefinements,
    clearRefinements,
  };
}

export type FiltersState = ReturnType<typeof createFilters>;
