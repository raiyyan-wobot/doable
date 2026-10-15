// An in-memory stand-in for the Rust commands, installed with Tauri's `mockIPC`.
//
// It implements just enough behaviour (status/search/tag filtering, CRUD, stats)
// for component tests to exercise real user flows. The real filtering/sorting
// logic is tested in Rust; tests here mostly assert *what the UI sends*
// (via `calls`) and *what it shows*.
import { mockIPC } from "@tauri-apps/api/mocks";
import type { Stats, Task, TaskInput, TaskQuery } from "~/features/tasks/api/types";

export interface FakeBackend {
  tasks: Task[];
  calls: { cmd: string; args: Record<string, unknown> }[];
  /** Commands named here reject with the given message (simulates a Rust `Err`). */
  failures: Map<string, string>;
  lastQuery(): TaskQuery | undefined;
  callsTo(cmd: string): Record<string, unknown>[];
}

let nextId = 1;

export function makeTask(overrides: Partial<Task> = {}): Task {
  const now = new Date(2026, 9, 15, 9, nextId).toISOString();
  return {
    id: `00000000-0000-4000-8000-${String(nextId++).padStart(12, "0")}`,
    title: "Task",
    description: "",
    completed: false,
    priority: "medium",
    dueDate: null,
    tags: [],
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    ...overrides,
  };
}

function applyInput(input: TaskInput) {
  const title = input.title.trim();
  if (!title) throw "title cannot be empty";
  const tags = [...new Set(input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))].sort();
  return { ...input, title, tags };
}

function matches(task: Task, q: TaskQuery): boolean {
  if (q.status === "active" && task.completed) return false;
  if (q.status === "completed" && !task.completed) return false;
  if (q.tag && !task.tags.includes(q.tag)) return false;
  if (q.priority && task.priority !== q.priority) return false;
  const needle = q.search?.trim().toLowerCase();
  if (needle && !task.title.toLowerCase().includes(needle)) return false;
  return true;
}

export function installFakeBackend(initial: Task[] = []): FakeBackend {
  const backend: FakeBackend = {
    tasks: [...initial],
    calls: [],
    failures: new Map(),
    lastQuery: () => backend.callsTo("list_tasks").at(-1)?.query as TaskQuery | undefined,
    callsTo: (cmd) => backend.calls.filter((c) => c.cmd === cmd).map((c) => c.args),
  };

  const find = (id: unknown) => {
    const task = backend.tasks.find((t) => t.id === id);
    if (!task) throw `task ${String(id)} not found`;
    return task;
  };

  // Real IPC serializes results to JSON, so the UI always gets fresh objects.
  // Clone to match; returning live references would hide reactivity bugs.
  mockIPC((cmd, rawArgs) => {
    const result = handle(cmd, rawArgs);
    return result === undefined ? null : structuredClone(result);
  });

  function handle(cmd: string, rawArgs: unknown): unknown {
    const args = (rawArgs ?? {}) as Record<string, any>;
    backend.calls.push({ cmd, args });

    const failure = backend.failures.get(cmd);
    if (failure) throw failure;

    switch (cmd) {
      case "list_tasks":
        // Newest first, like the default Rust sort.
        return backend.tasks.filter((t) => matches(t, args.query)).reverse();
      case "get_stats":
        return {
          total: backend.tasks.length,
          active: backend.tasks.filter((t) => !t.completed).length,
          completed: backend.tasks.filter((t) => t.completed).length,
          overdue: 0,
          dueToday: 0,
        } satisfies Stats;
      case "list_tags":
        return [...new Set(backend.tasks.flatMap((t) => t.tags))].sort();
      case "create_task": {
        const task = makeTask(applyInput(args.input));
        backend.tasks.push(task);
        return task;
      }
      case "update_task":
        return Object.assign(find(args.id), applyInput(args.input));
      case "set_completed":
        return Object.assign(find(args.id), { completed: args.completed });
      case "delete_task":
        find(args.id);
        backend.tasks = backend.tasks.filter((t) => t.id !== args.id);
        return null;
      case "clear_completed": {
        const before = backend.tasks.length;
        backend.tasks = backend.tasks.filter((t) => !t.completed);
        return before - backend.tasks.length;
      }
      case "export_tasks":
        return `/home/user/tasks.${args.format}`;
      case "import_tasks":
        return { added: 2, updated: 1, skipped: 0 };
      default:
        // Window/theme plugin calls etc. Resolve quietly.
        if (cmd.startsWith("plugin:")) return null;
        throw new Error(`fake backend: unhandled command "${cmd}"`);
    }
  }

  return backend;
}
