import { Show, type ParentProps } from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";
import { Ripple } from "./ripple";
import type { IconName } from "./icons";

/**
 * M3 Expressive *expanded* navigation rail (Compose NavigationRailExpanded /
 * NavigationRailHorizontalItem tokens): 220–360dp wide, no container color,
 * 56dp items with a full-width pill active indicator in secondary-container,
 * 16dp leading space, 8dp icon-label gap, label-large text.
 */
export function NavRail(props: ParentProps<{ class?: string; "aria-label": string }>) {
  return (
    <nav aria-label={props["aria-label"]} class={cn("flex flex-col", props.class)}>
      {props.children}
    </nav>
  );
}

interface NavRailItemProps {
  icon: IconName;
  label: string;
  active: boolean;
  onClick: () => void;
  /** Trailing count (M3 "badge label text" for expanded navigation). */
  count?: number;
  /** Tint the icon with the error color (e.g. "Overdue"). */
  tone?: "error";
  /**
   * Collapsed rail layout (M3 NavigationRailVerticalItem): the active-indicator
   * pill (56×32dp) wraps only the icon, with a label-medium label below.
   * Used on medium windows, where the rail is 80dp wide.
   */
  collapsed?: boolean;
}

export function NavRailItem(props: NavRailItemProps) {
  return (
    <Show when={!props.collapsed} fallback={<CollapsedNavRailItem {...props} />}>
    <button
      type="button"
      aria-current={props.active ? "page" : undefined}
      onClick={() => props.onClick()}
      class={cn(
        "state-layer focus-ring flex h-14 w-full shrink-0 cursor-pointer items-center gap-2 rounded-full pr-6 pl-4 text-left text-label-large",
        "transition-[background-color,color] motion-fast-effects",
        props.active
          ? "bg-secondary-container font-bold text-on-secondary-container"
          : "text-on-surface-variant",
      )}
    >
      <Ripple />
      <Icon
        name={props.icon}
        filled={props.active}
        size={24}
        class={cn(props.tone === "error" && !props.active && "text-error")}
      />
      <span class="ml-1 flex-1 truncate">{props.label}</span>
      <Show when={props.count}>
        <span class="tabular-nums">{props.count}</span>
      </Show>
    </button>
    </Show>
  );
}

function CollapsedNavRailItem(props: NavRailItemProps) {
  return (
    <button
      type="button"
      aria-current={props.active ? "page" : undefined}
      onClick={() => props.onClick()}
      class={cn(
        "group/item focus-ring flex w-full shrink-0 cursor-pointer flex-col items-center gap-1 rounded-lg py-1.5",
        props.active ? "text-on-secondary-container" : "text-on-surface-variant",
      )}
    >
      <span
        class={cn(
          "state-layer relative flex h-8 w-14 items-center justify-center rounded-full",
          "transition-[background-color] motion-fast-effects",
          props.active && "bg-secondary-container",
        )}
      >
        <Ripple />
        <Icon
          name={props.icon}
          filled={props.active}
          size={24}
          class={cn(props.tone === "error" && !props.active && "text-error")}
        />
        <Show when={props.count}>
          {/* M3 large badge: 16dp tall, error container, label-small. Hidden from
              assistive tech; the count is announced after the label instead. */}
          <span aria-hidden="true" class="absolute -top-1 left-8 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-label-small text-on-error tabular-nums">
            {props.count}
          </span>
        </Show>
      </span>
      <span class={cn("max-w-full truncate px-1 text-label-medium", props.active && "font-bold")}>
        {props.label}
        <Show when={props.count}>
          <span class="sr-only">, {props.count}</span>
        </Show>
      </span>
    </button>
  );
}

/** Section header inside the rail: title-small, on-surface-variant. */
export function NavRailSection(props: ParentProps<{ title: string }>) {
  return (
    <section class="flex flex-col" aria-label={props.title}>
      <h2 class="flex h-14 items-center px-4 text-title-small text-on-surface-variant">{props.title}</h2>
      {props.children}
    </section>
  );
}
