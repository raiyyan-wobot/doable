// Typed wrappers around the Rust commands (src-tauri/src/commands/).
// This is the only file that calls `invoke`. Argument names must match the
// Rust parameter names (Tauri maps camelCase ↔ snake_case).
//
// A command returning `Err(AppError)` makes the promise reject with the error
// message string.
import { invoke } from "@tauri-apps/api/core";
import type {
  FileFormat,
  ImportMode,
  ImportSummary,
  Stats,
  Task,
  TaskInput,
  TaskQuery,
} from "./types";

export const tasksApi = {
  // commands/tasks.rs
  listTasks: (query: TaskQuery) => invoke<Task[]>("list_tasks", { query }),
  getStats: () => invoke<Stats>("get_stats"),
  listTags: () => invoke<string[]>("list_tags"),
  createTask: (input: TaskInput) => invoke<Task>("create_task", { input }),
  updateTask: (id: string, input: TaskInput) => invoke<Task>("update_task", { id, input }),
  setCompleted: (id: string, completed: boolean) =>
    invoke<Task>("set_completed", { id, completed }),
  deleteTask: (id: string) => invoke<null>("delete_task", { id }),
  clearCompleted: () => invoke<number>("clear_completed"),

  // commands/files.rs. Both resolve to null if the user cancels the file dialog.
  exportTasks: (format: FileFormat) => invoke<string | null>("export_tasks", { format }),
  importTasks: (mode: ImportMode) => invoke<ImportSummary | null>("import_tasks", { mode }),
};
