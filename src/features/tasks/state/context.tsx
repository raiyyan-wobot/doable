// Composes the task state slices and shares them through context, so any
// component can read what it needs with `useTasks()`.
//
//   filters → what to show       (filters.ts)
//   data    → what Rust returned (data.ts)
//   dialogs → editor + confirm   (dialogs.ts)
//   actions → mutations          (actions.ts)
import { createContext, useContext, type ParentProps } from "solid-js";
import { createTaskActions, type TaskActions } from "./actions";
import { createTasksData, type TasksData } from "./data";
import { createDialogs, type DialogsState } from "./dialogs";
import { createFilters, type FiltersState } from "./filters";

export interface TasksState {
  filters: FiltersState;
  data: TasksData;
  dialogs: DialogsState;
  actions: TaskActions;
}

const TasksContext = createContext<TasksState>();

export function TasksProvider(props: ParentProps) {
  const filters = createFilters();
  const data = createTasksData(filters.query);
  const dialogs = createDialogs();
  const actions = createTaskActions(data, dialogs);

  return (
    <TasksContext.Provider value={{ filters, data, dialogs, actions }}>
      {props.children}
    </TasksContext.Provider>
  );
}

export function useTasks(): TasksState {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used inside <TasksProvider>");
  return ctx;
}
