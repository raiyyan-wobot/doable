// Contract tests: each wrapper must call the Rust command with exactly the
// argument names the `#[tauri::command]` function declares. The mirror-image
// test on the Rust side is src-tauri/src/ipc_tests.rs.
import { mockIPC } from "@tauri-apps/api/mocks";
import { describe, expect, it } from "vitest";
import { tasksApi as api } from "./client";
import type { TaskInput } from "./types";

function recordCalls() {
  const calls: { cmd: string; args: unknown }[] = [];
  mockIPC((cmd, args) => {
    calls.push({ cmd, args });
    return null;
  });
  return calls;
}

const input: TaskInput = {
  title: "Buy milk",
  description: "",
  priority: "low",
  dueDate: "2026-10-20",
  tags: ["errands"],
};

describe("tasksApi", () => {
  it.each([
    ["listTasks", () => api.listTasks({ status: "active" }), "list_tasks", { query: { status: "active" } }],
    ["getStats", () => api.getStats(), "get_stats", {}],
    ["listTags", () => api.listTags(), "list_tags", {}],
    ["createTask", () => api.createTask(input), "create_task", { input }],
    ["updateTask", () => api.updateTask("id-1", input), "update_task", { id: "id-1", input }],
    ["setCompleted", () => api.setCompleted("id-1", true), "set_completed", { id: "id-1", completed: true }],
    ["deleteTask", () => api.deleteTask("id-1"), "delete_task", { id: "id-1" }],
    ["clearCompleted", () => api.clearCompleted(), "clear_completed", {}],
    ["exportTasks", () => api.exportTasks("csv"), "export_tasks", { format: "csv" }],
    ["importTasks", () => api.importTasks("merge"), "import_tasks", { mode: "merge" }],
  ])("%s invokes the right command with the right args", async (_name, call, cmd, args) => {
    const calls = recordCalls();
    await call();
    expect(calls).toEqual([{ cmd, args }]);
  });

  it("rejects with the backend's error message", async () => {
    mockIPC(() => {
      throw "title cannot be empty";
    });
    await expect(api.createTask({ ...input, title: "" })).rejects.toBe("title cannot be empty");
  });
});
