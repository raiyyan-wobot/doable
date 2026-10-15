import { Toaster } from "solid-sonner";

/**
 * M3 snackbar (Compose SnackbarTokens): inverse-surface container, extra-small
 * (4dp) corners, elevation 3, body-medium text, inverse-primary action.
 * Built on Sonner (`toast()` from "solid-sonner") with its own styling turned off.
 *
 * Placement per M3 on large screens: one at a time, leading-aligned in the
 * content pane (`left` = navigation rail width + gutter), clear of the FAB.
 * Mount once at the app root.
 */
export function SnackbarHost(props: { leftOffset: number }) {
  return (
    <Toaster
      position="bottom-left"
      visibleToasts={1}
      offset={{ left: props.leftOffset, bottom: 24 }}
      gap={8}
      toastOptions={{
        unstyled: true,
        classes: {
          toast:
            "flex min-h-12 w-[min(28rem,calc(100vw-2rem))] items-center gap-3 rounded-xs bg-inverse-surface px-4 py-3 text-inverse-on-surface shadow-3",
          content: "flex flex-1 flex-col",
          title: "text-body-medium",
          description: "text-body-medium text-inverse-on-surface/80",
          actionButton:
            "state-layer h-10 cursor-pointer rounded-full px-3 text-label-large text-inverse-primary",
          icon: "hidden",
        },
      }}
    />
  );
}

export { toast } from "solid-sonner";
