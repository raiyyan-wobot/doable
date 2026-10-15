import * as DialogPrimitive from "@kobalte/core/dialog";
import type { ParentProps } from "solid-js";
import { cn } from "~/lib/utils";

interface ModalDrawerProps extends ParentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible name, e.g. "Navigation". */
  label: string;
}

/**
 * M3 modal expanded navigation rail (Compose NavigationRailExpanded tokens:
 * ModalContainerColor = surface-container, ModalContainerShape = large,
 * ModalContainerElevation = level 2). Slides in from the leading edge over a
 * scrim; used on compact and medium windows.
 */
export function ModalDrawer(props: ModalDrawerProps) {
  return (
    <DialogPrimitive.Root open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          class={cn(
            "fixed inset-0 z-40 bg-scrim/32 motion-default-effects",
            "data-[expanded]:animate-in data-[expanded]:fade-in data-[closed]:animate-out data-[closed]:fade-out",
          )}
        />
        <DialogPrimitive.Content
          aria-label={props.label}
          class={cn(
            "fixed inset-y-0 left-0 z-40 flex w-[min(20rem,85vw)] flex-col gap-6 overflow-y-auto rounded-r-lg bg-surface-container px-3 pt-5 pb-4 shadow-2 outline-none",
            "motion-default-spatial data-[expanded]:animate-in data-[expanded]:slide-in-from-left",
            "data-[closed]:animate-out data-[closed]:slide-out-to-left data-[closed]:motion-fast-effects",
          )}
        >
          {props.children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
