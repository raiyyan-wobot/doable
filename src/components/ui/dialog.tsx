import * as DialogPrimitive from "@kobalte/core/dialog";
import { Show, type ParentProps } from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";
import type { IconName } from "./icons";

/**
 * M3 basic dialog (Compose DialogTokens): surface-container-high, extra-large
 * (28dp) corners, elevation 3, 24dp padding, headline-small title, body-medium
 * supporting text, scrim at 32%. Enters on the default spatial spring.
 */
export const Dialog = DialogPrimitive.Root;

export function DialogContent(props: ParentProps<{ class?: string }>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        class={cn(
          "fixed inset-0 z-50 bg-scrim/32 scrim-motion",
        )}
      />
      <div class="fixed inset-0 z-50 flex items-center justify-center p-6">
        <DialogPrimitive.Content
          class={cn(
            "flex max-h-full w-full min-w-[17.5rem] max-w-[35rem] flex-col gap-4 overflow-y-auto rounded-xl bg-surface-container-high p-6 shadow-3 outline-none",
            "dialog-motion",
            props.class,
          )}
        >
          {props.children}
        </DialogPrimitive.Content>
      </div>
    </DialogPrimitive.Portal>
  );
}

interface DialogHeaderProps {
  title: string;
  description?: string;
  /** Optional hero icon: centers the header, as M3 specifies for dialogs with icons. */
  icon?: IconName;
}

export function DialogHeader(props: DialogHeaderProps) {
  return (
    <div class={cn("flex flex-col gap-4", props.icon && "items-center text-center")}>
      <Show when={props.icon}>{(name) => <Icon name={name()} size={24} class="text-secondary" />}</Show>
      <DialogPrimitive.Title class="text-headline-small text-on-surface">{props.title}</DialogPrimitive.Title>
      <Show when={props.description}>
        <DialogPrimitive.Description class="text-body-medium text-on-surface-variant">
          {props.description}
        </DialogPrimitive.Description>
      </Show>
    </div>
  );
}

/** Actions row: right-aligned, 8dp apart, 24dp above (gap-4 + pt-2). */
export function DialogActions(props: ParentProps) {
  return <div class="flex flex-wrap justify-end gap-2 pt-2">{props.children}</div>;
}
