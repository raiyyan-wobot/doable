import { cva } from "class-variance-authority";
import { Show } from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";
import { Ripple } from "./ripple";
import type { IconName } from "./icons";

/**
 * M3 filter chip (Compose FilterChipTokens): 32dp tall, small (8dp) corners,
 * label-large text, 18dp icons. Unselected: 1dp outline-variant border.
 * Selected: secondary-container fill, no border.
 *
 * Exported as a class builder so a Kobalte trigger (menu, popover) can render
 * the chip itself. Use <ChipContent> for the inside.
 */
export const chipVariants = cva(
  [
    "state-layer focus-ring inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-sm text-label-large whitespace-nowrap select-none",
    "transition-[background-color,border-color,color] motion-fast-effects",
  ],
  {
    variants: {
      selected: {
        true: "border border-transparent bg-secondary-container text-on-secondary-container",
        false: "border border-outline-variant text-on-surface-variant",
      },
      // 16dp side padding, reduced to 8dp next to an icon.
      leading: { true: "pl-2", false: "pl-4" },
      trailing: { true: "pr-2", false: "pr-4" },
    },
    defaultVariants: { selected: false, leading: false, trailing: false },
  },
);

interface ChipContentProps {
  label: string;
  /** Leading icon. Selected chips show a checkmark in its place, as M3 specifies. */
  icon?: IconName;
  selected?: boolean;
  /** Trailing icon, e.g. "arrow_drop_down" for chips that open a menu. */
  trailingIcon?: IconName;
}

export function ChipContent(props: ChipContentProps) {
  return (
    <>
      <Ripple />
      <Show when={props.icon}>
        {(name) => (
          <Icon
            name={props.selected ? "check" : name()}
            size={18}
            class={props.selected ? "" : "text-primary"}
          />
        )}
      </Show>
      <span>{props.label}</span>
      <Show when={props.trailingIcon}>{(name) => <Icon name={name()} size={18} />}</Show>
    </>
  );
}

interface InputChipProps {
  label: string;
  icon?: IconName;
  onRemove: () => void;
  removeLabel: string;
}

/** M3 input chip: a removable value (e.g. an active tag filter). */
export function InputChip(props: InputChipProps) {
  return (
    <span
      class={cn(
        chipVariants({ selected: true, leading: Boolean(props.icon), trailing: true }),
        "cursor-default",
      )}
    >
      <Show when={props.icon}>{(name) => <Icon name={name()} size={18} />}</Show>
      <span>{props.label}</span>
      <button
        type="button"
        aria-label={props.removeLabel}
        onClick={() => props.onRemove()}
        class="state-layer focus-ring -mr-0.5 inline-flex size-6 cursor-pointer items-center justify-center rounded-full"
      >
        <Icon name="x" size={18} />
      </button>
    </span>
  );
}
