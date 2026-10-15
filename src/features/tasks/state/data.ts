// Server data: resources fetched from Rust.
import { createResource, type Accessor } from "solid-js";
import { createDeepSignal } from "~/lib/reactivity";
import { tasksApi } from "../api/client";
import type { TaskQuery } from "../api/types";

export function createTasksData(query: Accessor<TaskQuery>) {
  // Refetches whenever `query` changes. `createDeepSignal` keeps row identity
  // stable across refetches (see lib/reactivity.ts).
  const [tasks, { refetch: refetchTasks }] = createResource(query, tasksApi.listTasks, {
    storage: createDeepSignal,
  });
  const [stats, { refetch: refetchStats }] = createResource(tasksApi.getStats);
  const [tags, { refetch: refetchTags }] = createResource(tasksApi.listTags, { initialValue: [] });

  /** Reload everything after a mutation. */
  const refresh = () => Promise.all([refetchTasks(), refetchStats(), refetchTags()]);

  return { tasks, stats, tags, refresh };
}

export type TasksData = ReturnType<typeof createTasksData>;
