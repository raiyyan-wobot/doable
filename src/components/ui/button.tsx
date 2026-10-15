import { cva, type VariantProps } from "class-variance-authority";
import { Show, splitProps, type JSX } from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";
import { Ripple } from "./ripple";
import type { IconName } from "./icons";

/**
 * M3 Expressive common button (Compose tokens/ButtonSmallTokens.kt et al.).
 * Round by default; on press the corners morph to the "pressed shape" on the
 * fast spatial spring, which is the signature Expressive interaction.
 */
export const buttonVariants = cva(
  [
    "state-layer focus-ring inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none",
    "transition-[border-radius,background-color,color,box-shadow] motion-fast-spatial",
    "disabled:pointer-events-none disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:shadow-none",
  ],
  {
    variants: {
      variant: {
        filled: "bg-primary text-on-primary hover:shadow-1",
        tonal: "bg-secondary-container text-on-secondary-container hover:shadow-1",
        elevated: "bg-surface-container-low text-primary shadow-1 hover:shadow-2",
        outlined:
          "border border-outline-variant text-on-surface-variant disabled:border-on-surface/12 disabled:bg-transparent",
        text: "text-primary disabled:bg-transparent",
        // Not an M3 variant name: a text button in the error color, for
        // destructive confirmations in dialogs.
        danger: "text-error disabled:bg-transparent",
      },
      size: {
        // XSmall: 32dp tall, 12dp padding, 20dp icon, pressed → small (8dp)
        xs: "h-8 gap-1 rounded-full px-3 text-label-large active:rounded-sm",
        // Small (default): 40dp tall, 16dp padding, 8dp icon gap, 20dp icon, pressed → small (8dp)
        sm: "h-10 gap-2 rounded-full px-4 text-label-large active:rounded-sm",
        // Medium: 56dp tall, 24dp padding, 24dp icon, pressed → medium (12dp)
        md: "h-14 gap-2 rounded-full px-6 text-title-medium active:rounded-md",
      },
    },
    defaultVariants: { variant: "filled", size: "sm" },
  },
);

const ICON_SIZE = { xs: 20, sm: 20, md: 24 } as const;

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Leading icon. */
    icon?: IconName;
  };

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ["variant", "size", "icon", "class", "type", "children"]);
  return (
    <button
      type={local.type ?? "button"}
      class={cn(buttonVariants({ variant: local.variant, size: local.size }), local.class)}
      {...rest}
    >
      <Ripple />
      <Show when={local.icon}>{(name) => <Icon name={name()} size={ICON_SIZE[local.size ?? "sm"]} />}</Show>
      {local.children}
    </button>
  );
}
