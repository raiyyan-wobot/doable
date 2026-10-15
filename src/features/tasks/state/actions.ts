// User actions that change data: each calls Rust, refreshes, and reports the
// outcome with a toast.
import { toast } from "~/components/ui/snackbar";
import { tasksApi } from "../api/client";
import type { FileFormat, ImportMode, Task, TaskInput } from "../api/types";
import type { TasksData } from "./data";
import type { DialogsState } from "./dialogs";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function createTaskActions(data: TasksData, dialogs: DialogsState) {
  /**
   * Run a backend call, refresh on success, and turn a rejection (the Rust
   * `AppError` message) into an error toast. Resolves `undefined` on failure.
   */
  async function run<T>(call: () => Promise<T>): Promise<T | undefined> {
    try {
      const result = await call();
      await data.refresh();
      return result;
    } catch (error) {
      toast.error(String(error));
      return undefined;
    }
  }

  async function importNow(mode: ImportMode) {
    const summary = await run(() => tasksApi.importTasks(mode));
    if (summary) {
      toast.success("Import complete", {
        description: `${summary.added} added · ${summary.updated} updated · ${summary.skipped} skipped`,
      });
    }
  }

  return {
    /** Create or update, depending on what the editor holds. Resolves true on success. */
    async save(input: TaskInput): Promise<boolean> {
      const editing = dialogs.editor().task;
      const saved = await run(() =>
        editing ? tasksApi.updateTask(editing.id, input) : tasksApi.createTask(input),
      );
      if (saved) toast.success(editing ? "Task updated" : "Task added");
      return saved !== undefined;
    },

    setCompleted: (task: Task, completed: boolean) =>
      run(() => tasksApi.setCompleted(task.id, completed)),

    async remove(task: Task) {
      // delete_task resolves `null` on success, `undefined` means it failed.
      const result = await run(() => tasksApi.deleteTask(task.id));
      if (result !== undefined) toast.success(`Deleted "${task.title}"`);
    },

    clearCompleted() {
      const count = data.stats()?.completed ?? 0;
      if (count === 0) {
        toast.info("There are no completed tasks to clear.");
        return;
      }
      dialogs.requestConfirm({
        title: "Clear completed tasks?",
        description: `This permanently deletes ${plural(count, "completed task")}.`,
        confirmLabel: "Delete",
        onConfirm: async () => {
          const removed = await run(tasksApi.clearCompleted);
          if (removed !== undefined) toast.success(`Deleted ${plural(removed, "task")}`);
        },
      });
    },

    async exportAs(format: FileFormat) {
      const path = await run(() => tasksApi.exportTasks(format));
      if (path) toast.success("Export complete", { description: path });
    },

    importFile(mode: ImportMode) {
      if (mode === "merge") {
        void importNow(mode);
        return;
      }
      dialogs.requestConfirm({
        title: "Replace all tasks?",
        description:
          "Every current task is deleted and replaced by the tasks in the file. Export first if you want a backup.",
        confirmLabel: "Choose file",
        onConfirm: () => void importNow(mode),
      });
    },
  };
}

export type TaskActions = ReturnType<typeof createTaskActions>;
