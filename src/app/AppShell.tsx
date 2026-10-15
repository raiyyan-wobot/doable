import { createEffect, createSignal, Match, Switch } from "solid-js";
import { ExtendedFab } from "~/components/ui/fab";
import { IconButton } from "~/components/ui/icon-button";
import { ModalDrawer } from "~/components/ui/modal-drawer";
import { SnackbarHost } from "~/components/ui/snackbar";
import {
  ConfirmDialog,
  FilterBar,
  TaskEditor,
  TaskList,
  TasksHeader,
  TasksNav,
  useTasks,
} from "~/features/tasks";
import { cn } from "~/lib/utils";
import { Logo, LogoMark } from "./Logo";
import { useShortcuts } from "./use-shortcuts";
import { useWindowSizeClass } from "./use-window-size-class";

/** Expanded rail: 280dp (M3 allows 220–360dp). Collapsed rail: 80dp. */
const EXPANDED_RAIL_PX = 280;
const COLLAPSED_RAIL_PX = 80;

/**
 * Page layout, adapted to the M3 window size class:
 * - expanded: expanded navigation rail + content pane with 28dp corners
 * - medium:   collapsed 80dp rail; its menu button opens the full rail as a drawer
 * - compact:  no rail; a menu button in the search bar opens the drawer, and
 *             the content pane goes edge to edge
 * The primary action floats at the pane's bottom-right in every layout.
 */
export function AppShell() {
  const { dialogs } = useTasks();
  const sizeClass = useWindowSizeClass();
  const [drawerOpen, setDrawerOpen] = createSignal(false);
  const openDrawer = () => setDrawerOpen(true);
  // Growing to the expanded layout shows the full rail, so the drawer is redundant.
  createEffect(() => sizeClass() === "expanded" && setDrawerOpen(false));
  let searchInput: HTMLInputElement | undefined;

  useShortcuts(
    {
      n: dialogs.openNew,
      "/": () => searchInput?.focus(),
    },
    () => !dialogs.editor().open && dialogs.confirmRequest() === null,
  );

  // Snackbars align with the pane's leading edge.
  const snackbarLeft = () =>
    ({ expanded: EXPANDED_RAIL_PX + 24, medium: COLLAPSED_RAIL_PX + 24, compact: 16 })[sizeClass()];

  return (
    <div class="flex h-screen overflow-hidden bg-surface-container">
      <Switch>
        <Match when={sizeClass() === "expanded"}>
          <aside
            class="scrollbar-on-hover flex shrink-0 flex-col gap-6 overflow-y-auto px-3 pt-5 pb-4"
            style={{ width: `${EXPANDED_RAIL_PX}px` }}
            aria-label="Sidebar"
          >
            <div class="px-4">
              <Logo />
            </div>
            <TasksNav />
          </aside>
        </Match>
        <Match when={sizeClass() === "medium"}>
          <aside
            class="scrollbar-on-hover flex shrink-0 flex-col items-center gap-4 overflow-y-auto px-3 pt-4 pb-4"
            style={{ width: `${COLLAPSED_RAIL_PX}px` }}
            aria-label="Sidebar"
          >
            <IconButton icon="menu" label="Open navigation" onClick={openDrawer} />
            <LogoMark class="size-8" />
            <TasksNav collapsed />
          </aside>
        </Match>
      </Switch>

      <main
        class={cn(
          "@container/pane relative flex min-w-0 flex-1 flex-col overflow-hidden bg-surface",
          sizeClass() === "compact" ? "" : "my-2 mr-2 rounded-xl",
        )}
      >
        <TasksHeader
          searchRef={(el) => (searchInput = el)}
          onOpenNavigation={sizeClass() === "compact" ? openDrawer : undefined}
        />
        <FilterBar />
        <TaskList />
        <ExtendedFab
          class="absolute right-4 bottom-4 @2xl/pane:right-6 @2xl/pane:bottom-6"
          icon="plus"
          label="New task"
          shortcut="N"
          onClick={dialogs.openNew}
        />
      </main>

      <ModalDrawer label="Navigation" open={drawerOpen()} onOpenChange={setDrawerOpen}>
        <div class="px-4">
          <Logo />
        </div>
        <TasksNav onNavigate={() => setDrawerOpen(false)} />
      </ModalDrawer>

      <TaskEditor />
      <ConfirmDialog />
      <SnackbarHost leftOffset={snackbarLeft()} />
    </div>
  );
}
