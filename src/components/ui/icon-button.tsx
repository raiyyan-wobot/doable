import * as TooltipPrimitive from "@kobalte/core/tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";
import { Ripple } from "./ripple";
import { tooltipClass } from "./tooltip";
import type { IconName } from "./icons";

/**
 * M3 Expressive icon button (Compose IconButtonSmall tokens): 40dp container,
 * 24dp icon, round shape that morphs to small (8dp) corners while pressed.
 */
export const iconButtonVariants = cva(
  [
    "state-layer focus-ring inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full",
    "shape-motion active:rounded-sm",
    "disabled:pointer-events-none disabled:text-on-surface/38",
  ],
  {
    variants: {
      variant: {
        standard: "text-on-surface-variant",
        filled: "bg-primary text-on-primary disabled:bg-on-surface/12",
        tonal: "bg-secondary-container text-on-secondary-container disabled:bg-on-surface/12",
        outlined: "border border-outline-variant text-on-surface-variant",
      },
      size: {
        xs: "size-8", // 32dp, 20dp icon
        sm: "size-10", // 40dp, 24dp icon
      },
      /** Toggle buttons: selected standard icon buttons use `primary`. */
      selected: { true: "", false: "" },
    },
    compoundVariants: [{ variant: "standard", selected: true, class: "text-primary" }],
    defaultVariants: { variant: "standard", size: "sm", selected: false },
  },
);

interface IconButtonProps extends VariantProps<typeof iconButtonVariants> {
  /** Icon from the registry (components/ui/icons.ts). */
  icon: IconName;
  /** Accessible name, also shown as a tooltip (icon-only controls need both). */
  label: string;
  /** Show the filled glyph (M3 does this for selected toggles). */
  filled?: boolean;
  disabled?: boolean;
  class?: string;
  onClick?: (event: MouseEvent) => void;
}

export function IconButton(props: IconButtonProps) {
  return (
    <TooltipPrimitive.Root openDelay={500} gutter={4}>
      <TooltipPrimitive.Trigger
        aria-label={props.label}
        aria-pressed={props.selected ?? undefined}
        disabled={props.disabled}
        onClick={props.onClick}
        class={cn(
          iconButtonVariants({ variant: props.variant, size: props.size, selected: props.selected }),
          props.class,
        )}
      >
        <Ripple />
        <Icon name={props.icon} filled={props.filled ?? props.selected ?? false} size={props.size === "xs" ? 20 : 24} />
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content class={tooltipClass}>{props.label}</TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
