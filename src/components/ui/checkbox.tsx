import * as CheckboxPrimitive from "@kobalte/core/checkbox";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  class?: string;
  "aria-label"?: string;
}

/**
 * M3 checkbox (Compose CheckboxTokens): 18dp box, 2dp corners, 2dp
 * on-surface-variant outline; selected = primary fill with an on-primary check.
 * The 40dp circular state layer is the hit target.
 */
export function Checkbox(props: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      checked={props.checked}
      onChange={props.onChange}
      class={cn("group/checkbox inline-flex", props.class)}
    >
      <CheckboxPrimitive.Input class="peer" aria-label={props["aria-label"]} />
      <CheckboxPrimitive.Control
        class={cn(
          "state-layer flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full",
          "text-on-surface data-[checked]:text-primary",
          "peer-focus-visible:outline-3 peer-focus-visible:outline-secondary",
        )}
      >
        <span
          class={cn(
            "flex size-[18px] items-center justify-center rounded-[2px] border-2 border-on-surface-variant",
            "transition-[background-color,border-color] motion-fast-effects",
            "group-hover/checkbox:border-on-surface",
            "group-data-[checked]/checkbox:border-primary group-data-[checked]/checkbox:bg-primary",
          )}
        >
          <CheckboxPrimitive.Indicator class="flex text-on-primary data-[checked]:animate-in data-[checked]:zoom-in-50 motion-fast-spatial">
            <Icon name="check" size={16} bold />
          </CheckboxPrimitive.Indicator>
        </span>
      </CheckboxPrimitive.Control>
    </CheckboxPrimitive.Root>
  );
}
