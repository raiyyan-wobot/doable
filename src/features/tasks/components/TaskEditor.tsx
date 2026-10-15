import { createEffect, createSignal, on } from "solid-js";
import { createStore } from "solid-js/store";
import { Button } from "~/components/ui/button";
import { DateField } from "~/components/ui/date-picker";
import { Dialog, DialogActions, DialogContent, DialogHeader } from "~/components/ui/dialog";
import { SelectField } from "~/components/ui/select";
import { TextField } from "~/components/ui/text-field";
import type { Priority, Task } from "../api/types";
import { PRIORITY_OPTIONS } from "../config/options";
import { useTasks } from "../state/context";

interface FormState {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  tags: string;
}

const toForm = (task: Task | null): FormState => ({
  title: task?.title ?? "",
  description: task?.description ?? "",
  priority: task?.priority ?? "medium",
  dueDate: task?.dueDate ?? "",
  tags: task?.tags.join(", ") ?? "",
});

/** Create / edit dialog. Opened through `dialogs.openNew()` / `dialogs.openEdit(task)`. */
export function TaskEditor() {
  const { dialogs, actions } = useTasks();
  const [form, setForm] = createStore<FormState>(toForm(null));
  const [saving, setSaving] = createSignal(false);
  const isEdit = () => dialogs.editor().task !== null;

  // Reset the form each time the dialog opens.
  createEffect(
    on(
      () => dialogs.editor().open,
      (open) => open && setForm(toForm(dialogs.editor().task)),
    ),
  );

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    setSaving(true);
    const ok = await actions.save({
      title: form.title,
      description: form.description,
      priority: form.priority,
      dueDate: form.dueDate || null,
      tags: form.tags.split(","), // Rust trims, lowercases and de-duplicates
    });
    setSaving(false);
    if (ok) dialogs.closeEditor();
  }

  return (
    <Dialog open={dialogs.editor().open} onOpenChange={(open) => !open && dialogs.closeEditor()}>
      <DialogContent>
        <DialogHeader title={isEdit() ? "Edit task" : "New task"} />

        <form id="task-form" class="@container flex flex-col gap-4 pt-2" onSubmit={submit}>
          <TextField
            label="Title"
            value={form.title}
            onInput={(e) => setForm("title", e.currentTarget.value)}
            maxLength={200}
            required
            autofocus
          />
          <TextField
            multiline
            label="Notes"
            value={form.description}
            onInput={(e) => setForm("description", e.currentTarget.value)}
          />
          {/* Side by side when the dialog is wide enough; stacked on narrow windows. */}
          <div class="grid grid-cols-1 gap-4 @sm:grid-cols-2">
            <SelectField
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={form.priority}
              onChange={(priority) => setForm("priority", priority)}
            />
            <DateField
              label="Due date"
              value={form.dueDate || null}
              onChange={(iso) => setForm("dueDate", iso ?? "")}
            />
          </div>
          <TextField
            label="Tags"
            supportingText="Separate tags with commas"
            value={form.tags}
            onInput={(e) => setForm("tags", e.currentTarget.value)}
          />
        </form>

        <DialogActions>
          <Button variant="text" onClick={dialogs.closeEditor}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" disabled={saving() || !form.title.trim()}>
            {isEdit() ? "Save" : "Add task"}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
