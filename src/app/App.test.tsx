// User-flow tests for the whole app against the fake backend: render <App />,
// interact like a user would, assert on what's on screen and what was sent to Rust.
import { render, screen, waitFor, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "~/App";
import { formatLongDate, toISODate } from "~/lib/dates";
import { installFakeBackend, makeTask } from "~/test/fake-backend";
import { setWindowWidth } from "~/test/setup";

function setup(...tasks: ReturnType<typeof makeTask>[]) {
  const backend = installFakeBackend(tasks);
  const user = userEvent.setup();
  render(() => <App />);
  return { backend, user };
}

const taskTitles = () =>
  screen.queryAllByTestId("task-item").map((li) => li.querySelector("p")?.textContent);

describe("task list", () => {
  it("shows an empty state on first launch", async () => {
    setup();
    expect(await screen.findByText("No tasks yet")).toBeInTheDocument();
  });

  it("lists active tasks with priority, due date and tags", async () => {
    setup(makeTask({ title: "Pay rent", priority: "high", dueDate: toISODate(new Date()), tags: ["home"] }));

    const item = await screen.findByTestId("task-item");
    expect(within(item).getByText("Pay rent")).toBeInTheDocument();
    expect(within(item).getByText("High")).toBeInTheDocument();
    expect(within(item).getByText("Today")).toBeInTheDocument();
    expect(within(item).getByRole("button", { name: "#home" })).toBeInTheDocument();
  });

  it("marks overdue tasks with the error color", async () => {
    setup(makeTask({ title: "Late", dueDate: "2020-01-01" }));
    const item = await screen.findByTestId("task-item");
    expect(within(item).getByTitle("2020-01-01")).toHaveClass("text-error");
  });
});

describe("creating and editing", () => {
  it("creates a task from the dialog", async () => {
    const { backend, user } = setup();
    await screen.findByText("No tasks yet");

    await user.click(screen.getAllByRole("button", { name: /new task/i })[0]);
    const dialog = within(await screen.findByRole("dialog", { name: "New task" }));
    await user.type(dialog.getByLabelText("Title"), "  Buy milk ");
    await user.type(dialog.getByLabelText("Tags"), "Errands, home");
    await user.click(dialog.getByRole("button", { name: "Add task" }));

    await waitFor(() => expect(taskTitles()).toEqual(["Buy milk"]));
    expect(backend.callsTo("create_task")).toEqual([
      {
        input: {
          title: "  Buy milk ",
          description: "",
          priority: "medium",
          dueDate: null,
          tags: ["Errands", " home"],
        },
      },
    ]);
    // The dialog closes and a toast confirms.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await screen.findByText("Task added")).toBeInTheDocument();
  });

  it("opens the editor with the N shortcut", async () => {
    const { user } = setup();
    await screen.findByText("No tasks yet");
    await user.keyboard("n");
    expect(await screen.findByRole("dialog", { name: "New task" })).toBeInTheDocument();
  });

  it("pre-fills the form when editing and sends an update", async () => {
    const { backend, user } = setup(makeTask({ title: "Draft", tags: ["work"], dueDate: "2026-11-01" }));

    await user.click(await screen.findByRole("button", { name: "Edit" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Edit task" }));
    const title = dialog.getByLabelText("Title");
    expect(title).toHaveValue("Draft");
    expect(dialog.getByLabelText("Tags")).toHaveValue("work");
    expect(dialog.getByRole("button", { name: /^Due date:/ })).toHaveTextContent(formatLongDate("2026-11-01"));

    await user.clear(title);
    await user.type(title, "Final");
    await user.click(dialog.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(taskTitles()).toEqual(["Final"]));
    expect(backend.callsTo("update_task")[0]).toMatchObject({ input: { title: "Final" } });
  });

  it("shows backend validation errors as a toast and keeps the dialog open", async () => {
    const { backend, user } = setup();
    backend.failures.set("create_task", "title is longer than 200 characters");
    await screen.findByText("No tasks yet");

    await user.keyboard("n");
    await user.type(await screen.findByLabelText("Title"), "x");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(await screen.findByText("title is longer than 200 characters")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("completing and deleting", () => {
  it("completing a task removes it from the Active view", async () => {
    const { backend, user } = setup(makeTask({ title: "Water plants" }));

    await user.click(await screen.findByRole("checkbox", { name: 'Mark "Water plants" as done' }));

    await waitFor(() => expect(taskTitles()).toEqual([]));
    expect(backend.callsTo("set_completed")[0]).toMatchObject({ completed: true });
  });

  it("deletes a task", async () => {
    const { backend, user } = setup(makeTask({ title: "Old" }), makeTask({ title: "Keep" }));
    await screen.findAllByTestId("task-item");

    const old = screen.getAllByTestId("task-item").find((li) => li.textContent?.includes("Old"))!;
    await user.click(within(old).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(taskTitles()).toEqual(["Keep"]));
    expect(backend.callsTo("delete_task")).toHaveLength(1);
  });
});

describe("filters", () => {
  it("sends the search text to the backend", async () => {
    const { backend, user } = setup(makeTask({ title: "Buy milk" }), makeTask({ title: "Call mom" }));
    await screen.findAllByTestId("task-item");

    await user.type(screen.getByRole("searchbox", { name: "Search tasks" }), "milk");

    await waitFor(() => expect(taskTitles()).toEqual(["Buy milk"]));
    expect(backend.lastQuery()?.search).toBe("milk");
  });

  it("sidebar views set the status and due filters", async () => {
    const { backend, user } = setup(makeTask({ title: "Done", completed: true }));
    const views = await screen.findByRole("navigation", { name: "Views" });

    await user.click(within(views).getByRole("button", { name: /Completed/ }));
    await waitFor(() => expect(taskTitles()).toEqual(["Done"]));
    expect(backend.lastQuery()).toMatchObject({ status: "completed", due: { kind: "any" } });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Completed");

    await user.click(within(views).getByRole("button", { name: /Today/ }));
    await waitFor(() =>
      expect(backend.lastQuery()).toMatchObject({ status: "active", due: { kind: "today" } }),
    );
  });

  it("clicking a tag filters by it, and the chip clears it", async () => {
    const { backend, user } = setup(
      makeTask({ title: "Report", tags: ["work"] }),
      makeTask({ title: "Groceries", tags: ["home"] }),
    );
    await screen.findAllByTestId("task-item");

    await user.click(screen.getByRole("button", { name: "#work" }));
    await waitFor(() => expect(taskTitles()).toEqual(["Report"]));
    expect(backend.lastQuery()?.tag).toBe("work");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("#work");

    await user.click(screen.getByRole("button", { name: "Remove tag filter work" }));
    await waitFor(() => expect(taskTitles()).toHaveLength(2));
  });

  it("toggles the sort direction", async () => {
    const { backend, user } = setup(makeTask());
    await screen.findByTestId("task-item");
    expect(backend.lastQuery()?.sortDir).toBe("desc");

    await user.click(screen.getByRole("button", { name: "Descending" }));
    await waitFor(() => expect(backend.lastQuery()?.sortDir).toBe("asc"));
  });
});

describe("responsive layout (M3 window size classes)", () => {
  it("expanded (≥ 840px): full navigation rail with tags", async () => {
    setup(makeTask({ title: "x", tags: ["home"] }));
    expect(await screen.findByRole("navigation", { name: "Tags" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open navigation" })).not.toBeInTheDocument();
  });

  it("medium (600–839px): collapsed rail, full rail in a drawer", async () => {
    setWindowWidth(700);
    const { user } = setup(makeTask({ title: "x", tags: ["home"] }));
    const views = await screen.findByRole("navigation", { name: "Views" });
    // Collapsed items are still labelled, and there's no tag list in the rail.
    expect(within(views).getByRole("button", { name: /^Active/ })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Tags" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const drawer = await screen.findByRole("dialog", { name: "Navigation" });
    expect(within(drawer).getByRole("navigation", { name: "Tags" })).toBeInTheDocument();
  });

  it("compact (< 600px): no rail; the drawer navigates and closes", async () => {
    setWindowWidth(400);
    const { backend, user } = setup(makeTask({ title: "Done", completed: true }));
    await screen.findByText("Nothing here");
    expect(screen.queryByRole("navigation", { name: "Views" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const drawer = await screen.findByRole("dialog", { name: "Navigation" });
    await user.click(within(drawer).getByRole("button", { name: /Completed/ }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Navigation" })).not.toBeInTheDocument());
    await waitFor(() => expect(taskTitles()).toEqual(["Done"]));
    expect(backend.lastQuery()?.status).toBe("completed");
  });
});
