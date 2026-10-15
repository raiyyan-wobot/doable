import { For, Match, Switch, type JSX } from "solid-js";
import { Icon } from "~/components/ui/icon";
import { CookieShape } from "~/components/ui/shape";
import { useTasks } from "../state/context";
import { TaskItem } from "./TaskItem";
import type { IconName } from "~/components/ui/icons";

export function TaskList() {
  const { data } = useTasks();
  // `.latest` keeps showing the previous list while a refetch is in flight,
  // so the list doesn't flash empty on every keystroke in the search box.
  const tasks = () => data.tasks.latest ?? [];

  // pb-28 keeps the last item clear of the floating action button.
  return (
    <section class="min-h-0 flex-1 overflow-y-auto px-2 pb-28 @2xl/pane:px-6" aria-label="Tasks">
      <Switch>
        <Match when={data.tasks.error}>
          <EmptyState icon="circle-alert" title="Couldn't load tasks">
            <p>{String(data.tasks.error)}</p>
          </EmptyState>
        </Match>
        <Match when={tasks().length > 0}>
          {/* M3 Expressive segmented list: 2dp gaps between item surfaces. */}
          <ul class="flex flex-col gap-0.5">
            <For each={tasks()}>{(task) => <TaskItem task={task} />}</For>
          </ul>
        </Match>
        <Match when={!data.tasks.loading && data.stats()?.total === 0}>
          {/* No second "New task" button: the FAB is the screen's one primary action. */}
          <EmptyState icon="circle-check" title="No tasks yet">
            <p>
              Add your first one with <span class="font-medium text-on-surface">New task</span> or press{" "}
              <kbd class="rounded-xs border border-outline-variant px-1.5 font-sans text-label-medium">N</kbd>.
            </p>
          </EmptyState>
        </Match>
        <Match when={!data.tasks.loading}>
          <EmptyState icon="search-x" title="Nothing here">
            <p>No tasks match the current filters.</p>
          </EmptyState>
        </Match>
      </Switch>
    </section>
  );
}

function EmptyState(props: { icon: IconName; title: string; children: JSX.Element }) {
  return (
    <div class="flex h-full min-h-80 flex-col items-center justify-center text-center">
      <CookieShape class="mb-6 size-28 text-on-tertiary-container" shapeClass="bg-tertiary-container">
        <Icon name={props.icon} size={48} filled />
      </CookieShape>
      <h2 class="text-headline-small text-on-surface">{props.title}</h2>
      <div class="mt-2 flex flex-col items-center text-body-large text-on-surface-variant">{props.children}</div>
    </div>
  );
}
