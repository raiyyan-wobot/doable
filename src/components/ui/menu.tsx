import * as MenuPrimitive from "@kobalte/core/dropdown-menu";
import { Show, type JSX, type ParentProps } from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";
import type { IconName } from "./icons";

/**
 * M3 Expressive menu (Compose StandardMenuTokens): surface-container-low,
 * elevation 2, large rounded container; items 48dp with on-surface labels and
 * on-surface-variant icons; the selected item is tertiary-container.
 */
/**
 * Non-modal by default (WAI-ARIA menu button pattern): a modal menu hides the
 * rest of the page from assistive tech with aria-hidden while focusable
 * elements stay reachable (axe: aria-hidden-focus), and blocks pointer events.
 */
export function Menu(props: ParentProps<{ modal?: boolean }>) {
  return <MenuPrimitive.Root modal={props.modal ?? false}>{props.children}</MenuPrimitive.Root>;
}
export const MenuGroup = MenuPrimitive.Group;
export const MenuRadioGroup = MenuPrimitive.RadioGroup;

export function MenuTrigger(props: ParentProps<{ class?: string; "aria-label"?: string }>) {
  return (
    <MenuPrimitive.Trigger class={props.class} aria-label={props["aria-label"]}>
      {props.children}
    </MenuPrimitive.Trigger>
  );
}

export function MenuContent(props: ParentProps<{ class?: string }>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        class={cn(
          "z-50 flex min-w-[12rem] max-w-[17.5rem] flex-col gap-0.5 rounded-lg bg-surface-container-low p-1 shadow-2 outline-none",
          "origin-(--kb-menu-content-transform-origin) motion-fast-spatial",
          "data-[expanded]:animate-in data-[expanded]:fade-in data-[expanded]:zoom-in-90",
          "data-[closed]:animate-out data-[closed]:fade-out data-[closed]:zoom-out-95",
          props.class,
        )}
      >
        {props.children}
      </MenuPrimitive.Content>
    </MenuPrimitive.Portal>
  );
}

const itemClass = [
  "state-layer flex h-12 cursor-pointer items-center gap-3 rounded-md px-3 text-label-large text-on-surface outline-none select-none",
  "[&_.icon]:text-on-surface-variant",
  "data-[checked]:bg-tertiary-container data-[checked]:text-on-tertiary-container data-[checked]:[&_.icon]:text-on-tertiary-container",
  "data-[disabled]:pointer-events-none data-[disabled]:opacity-38",
].join(" ");

interface MenuItemProps {
  onSelect: () => void;
  icon?: IconName;
  children: JSX.Element;
  /** Destructive items use the error color. */
  tone?: "error";
}

export function MenuItem(props: MenuItemProps) {
  return (
    <MenuPrimitive.Item
      onSelect={props.onSelect}
      class={cn(itemClass, props.tone === "error" && "text-error [&_.icon]:text-error")}
    >
      <Show when={props.icon}>{(name) => <Icon name={name()} size={24} />}</Show>
      <span class="flex-1">{props.children}</span>
    </MenuPrimitive.Item>
  );
}

export function MenuRadioItem(props: { value: string; icon?: IconName; children: JSX.Element }) {
  return (
    // Single-choice menus close once a choice is made (Kobalte keeps radio menus open by default).
    <MenuPrimitive.RadioItem value={props.value} closeOnSelect class={itemClass}>
      <Show when={props.icon}>{(name) => <Icon name={name()} size={24} />}</Show>
      <span class="flex-1">{props.children}</span>
      <MenuPrimitive.ItemIndicator class="flex">
        <Icon name="check" size={24} />
      </MenuPrimitive.ItemIndicator>
    </MenuPrimitive.RadioItem>
  );
}

/** Section header inside a menu. */
export function MenuLabel(props: ParentProps) {
  return (
    <MenuPrimitive.GroupLabel class="flex h-8 items-center px-3 text-label-medium text-on-surface-variant">
      {props.children}
    </MenuPrimitive.GroupLabel>
  );
}

/** M3 divider: 1dp outline-variant. */
export function MenuDivider() {
  return <MenuPrimitive.Separator class="mx-3 my-1 h-px border-none bg-outline-variant" />;
}
