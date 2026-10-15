import { For, Show } from "solid-js";
import { Checkbox } from "~/components/ui/checkbox";
import { IconButton } from "~/components/ui/icon-button";
import { Pill } from "~/components/ui/pill";
import { daysFromToday, formatDue } from "~/lib/dates";
import { cn } from "~/lib/utils";
import type { Priority, Task } from "../api/types";
import { PRIORITY_LABELS } from "../config/options";
import { useTasks } from "../state/context";
import type { IconName } from "~/components/ui/icons";

/** Priority → M3 container role, so the colors follow the dynamic scheme. */
const PRIORITY_TONE: Record<Priority, "error" | "tertiary" | "secondary"> = {
  high: "error",
  medium: "tertiary",
  low: "secondary",
};

const PRIORITY_ICON: Record<Priority, IconName> = {
  high: "chevrons-up",
  medium: "equal",
  low: "chevrons-down",
};

/**
 * One task as an M3 list item: leading checkbox, headline (body-large),
 * supporting text (body-medium), metadata, trailing actions.
 * Lives in a segmented list (see TaskList): each item is its own surface.
 */
export function TaskItem(props: { task: Task }) {
  const { filters, dialogs, actions } = useTasks();

  const dueIn = () => (props.task.dueDate ? daysFromToday(props.task.dueDate) : null);
  const overdue = () => !props.task.completed && (dueIn() ?? 0) < 0;

  return (
    <li
      data-testid="task-item"
      class={cn(
        "group/item state-layer grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-2 bg-surface-container py-3 pr-3 pl-2 text-on-surface",
        // Segmented list shape: large outer corners, extra-small inner ones.
        "rounded-xs first:rounded-t-lg last:rounded-b-lg",
        "transition-[border-radius] motion-fast-spatial hover:rounded-lg",
      )}
    >
      <Checkbox
        class="-my-2"
        aria-label={`Mark "${props.task.title}" as ${props.task.completed ? "not done" : "done"}`}
        checked={props.task.completed}
        onChange={(checked) => actions.setCompleted(props.task, checked)}
      />

      <div class="flex min-w-0 flex-col gap-1 py-px">
        <p
          class={cn(
            "truncate text-body-large transition-colors motion-default-effects",
            props.task.completed && "text-on-surface-variant line-through",
          )}
        >
          {props.task.title}
        </p>
        <Show when={props.task.description}>
          <p class="line-clamp-2 text-body-medium text-on-surface-variant">{props.task.description}</p>
        </Show>

        <div class="mt-1 flex flex-wrap items-center gap-1.5">
          <Pill tone={PRIORITY_TONE[props.task.priority]} icon={PRIORITY_ICON[props.task.priority]}>
            {PRIORITY_LABELS[props.task.priority]}
          </Pill>
          <Show when={props.task.dueDate}>
            {(due) => (
              <Pill
                tone="plain"
                icon={overdue() ? "calendar-x" : "calendar"}
                title={due()}
                class={cn("ml-1", overdue() && "text-error", dueIn() === 0 && !props.task.completed && "text-primary")}
              >
                {formatDue(due())}
              </Pill>
            )}
          </Show>
          <For each={props.task.tags}>
            {(tag) => (
              <button
                type="button"
                onClick={() => filters.set("tag", tag)}
                class="state-layer focus-ring inline-flex h-6 cursor-pointer items-center rounded-sm border border-outline-variant px-2 text-label-medium text-on-surface-variant"
              >
                #{tag}
              </button>
            )}
          </For>
        </div>
      </div>

      <div class="-my-1 flex items-center opacity-0 transition-opacity motion-fast-effects group-focus-within/item:opacity-100 group-hover/item:opacity-100">
        <IconButton icon="pencil" label="Edit" onClick={() => dialogs.openEdit(props.task)} />
        <IconButton icon="trash" label="Delete" onClick={() => actions.remove(props.task)} />
      </div>
    </li>
  );
}
