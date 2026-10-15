import { For, Show } from "solid-js";
import { NavRail, NavRailItem, NavRailSection } from "~/components/ui/nav-rail";
import { VIEWS } from "../config/views";
import { useTasks } from "../state/context";

interface TasksNavProps {
  /** Collapsed 80dp rail (medium windows): icons with short labels, no tag list. */
  collapsed?: boolean;
  /** Called after a destination is chosen, e.g. to close a modal drawer. */
  onNavigate?: () => void;
}

/** Navigation rail destinations: the smart views, then one item per tag. */
export function TasksNav(props: TasksNavProps) {
  const { filters, data } = useTasks();
  const navigate = (action: () => void) => {
    action();
    props.onNavigate?.();
  };

  return (
    <>
      <NavRail aria-label="Views" class={props.collapsed ? "gap-1" : undefined}>
        <For each={VIEWS}>
          {(view) => (
            <NavRailItem
              collapsed={props.collapsed}
              icon={view.icon}
              label={view.label}
              active={filters.activeView()?.id === view.id}
              tone={view.tone}
              count={view.count && data.stats() ? view.count(data.stats()!) : undefined}
              onClick={() => navigate(() => filters.selectView(view))}
            />
          )}
        </For>
      </NavRail>

      <Show when={!props.collapsed && data.tags().length > 0}>
        <NavRail aria-label="Tags">
          <NavRailSection title="Tags">
            <For each={data.tags()}>
              {(tag) => (
                <NavRailItem
                  icon="tag"
                  label={tag}
                  active={filters.values.tag === tag}
                  onClick={() => navigate(() => filters.set("tag", filters.values.tag === tag ? null : tag))}
                />
              )}
            </For>
          </NavRailSection>
        </NavRail>
      </Show>
    </>
  );
}
