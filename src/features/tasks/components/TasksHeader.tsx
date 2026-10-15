import { Show } from "solid-js";
import { Icon } from "~/components/ui/icon";
import { IconButton, iconButtonVariants } from "~/components/ui/icon-button";
import {
  Menu,
  MenuContent,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuTrigger,
} from "~/components/ui/menu";
import { SearchBar } from "~/components/ui/search-bar";
import { ThemeMenu } from "~/theme";
import { useTasks } from "../state/context";

interface TasksHeaderProps {
  /** Receives the search input so the "/" shortcut can focus it. */
  searchRef?: (el: HTMLInputElement) => void;
  /** When set, a menu button opens the navigation drawer (compact windows). */
  onOpenNavigation?: () => void;
}

/** Search app bar + page title. */
export function TasksHeader(props: TasksHeaderProps) {
  const { filters, data, actions } = useTasks();

  const title = () =>
    filters.values.tag ? `#${filters.values.tag}` : (filters.activeView()?.label ?? "Filtered tasks");

  return (
    <header class="flex shrink-0 flex-col gap-4 px-4 pt-4 @2xl/pane:px-6">
      <div class="flex items-center gap-2">
        <Show when={props.onOpenNavigation}>
          {(open) => <IconButton icon="menu" label="Open navigation" onClick={() => open()()} />}
        </Show>
        <SearchBar
          ref={props.searchRef}
          class="min-w-0 max-w-[45rem] flex-1"
          placeholder="Search tasks"
          shortcut="/"
          value={filters.values.search}
          onInput={(value) => filters.set("search", value)}
        />
        <div class="ml-auto flex items-center gap-1">
          <ThemeMenu />
          <Menu>
            <MenuTrigger aria-label="More actions" class={iconButtonVariants()}>
              <Icon name="ellipsis-vertical" size={24} />
            </MenuTrigger>
            <MenuContent>
              <MenuGroup>
                <MenuLabel>Export</MenuLabel>
                <MenuItem icon="braces" onSelect={() => actions.exportAs("json")}>
                  Export as JSON
                </MenuItem>
                <MenuItem icon="table" onSelect={() => actions.exportAs("csv")}>
                  Export as CSV
                </MenuItem>
              </MenuGroup>
              <MenuDivider />
              <MenuGroup>
                <MenuLabel>Import .json or .csv</MenuLabel>
                <MenuItem icon="merge" onSelect={() => actions.importFile("merge")}>
                  Import and merge…
                </MenuItem>
                <MenuItem icon="folder-open" onSelect={() => actions.importFile("replace")}>
                  Import and replace all…
                </MenuItem>
              </MenuGroup>
              <MenuDivider />
              <MenuItem icon="brush-cleaning" tone="error" onSelect={actions.clearCompleted}>
                Clear completed
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>

      <div class="flex items-baseline gap-3 px-2">
        {/* Expressive: emphasized headline for the page title. */}
        <h1 class="truncate text-headline-small font-medium text-on-surface @2xl/pane:text-headline-medium">{title()}</h1>
        <Show when={data.tasks.latest}>
          {(tasks) => (
            <span class="text-title-medium text-on-surface-variant tabular-nums" aria-label="Task count">
              {tasks().length}
            </span>
          )}
        </Show>
      </div>
    </header>
  );
}
