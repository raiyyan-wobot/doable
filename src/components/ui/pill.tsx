import { cva, type VariantProps } from "class-variance-authority";
import { Show, type JSX } from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";
import type { IconName } from "./icons";

/**
 * Small, non-interactive metadata label (priority, due date, tag) inside list
 * items. Sized like a compact M3 chip: 24dp tall, small (8dp) corners,
 * label-medium text, 16dp icon. Colors are M3 container roles, so they follow
 * the dynamic scheme.
 */
export const pillVariants = cva(
  "inline-flex h-6 shrink-0 items-center gap-1 rounded-sm px-2 text-label-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        primary: "bg-primary-container text-on-primary-container",
        secondary: "bg-secondary-container text-on-secondary-container",
        tertiary: "bg-tertiary-container text-on-tertiary-container",
        error: "bg-error-container text-on-error-container",
        outline: "border border-outline-variant text-on-surface-variant",
        plain: "px-0 text-on-surface-variant",
      },
    },
    defaultVariants: { tone: "outline" },
  },
);

interface PillProps extends VariantProps<typeof pillVariants> {
  icon?: IconName;
  children: JSX.Element;
  class?: string;
  title?: string;
}

export function Pill(props: PillProps) {
  return (
    <span title={props.title} class={cn(pillVariants({ tone: props.tone }), props.class)}>
      <Show when={props.icon}>{(name) => <Icon name={name()} size={16} />}</Show>
      {props.children}
    </span>
  );
}
