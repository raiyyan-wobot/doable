import { cn } from "~/lib/utils";
import { Icon } from "./icon";
import { Ripple } from "./ripple";
import type { IconName } from "./icons";

interface ExtendedFabProps {
  icon: IconName;
  label: string;
  class?: string;
  onClick?: () => void;
  /** Optional keyboard shortcut hint, rendered after the label. */
  shortcut?: string;
}

/**
 * M3 extended FAB, small size (Compose ExtendedFabSmallTokens): 56dp tall,
 * large (16dp) corners, 16dp side padding, 8dp icon gap, 24dp icon,
 * title-medium label. Tonal "primary container" colors, elevation 3 → 4 on hover.
 */
export function ExtendedFab(props: ExtendedFabProps) {
  return (
    <button
      type="button"
      aria-keyshortcuts={props.shortcut}
      onClick={() => props.onClick?.()}
      class={cn(
        "state-layer focus-ring inline-flex h-14 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-4",
        "bg-primary-container text-title-medium text-on-primary-container shadow-3 hover:shadow-4",
        "shape-motion active:rounded-xl",
        props.class,
      )}
    >
      <Ripple />
      <Icon name={props.icon} size={24} />
      <span>{props.label}</span>
      {props.shortcut && (
        <kbd class="ml-1 rounded-xs bg-on-primary-container/10 px-1.5 font-sans text-label-small">
          {props.shortcut}
        </kbd>
      )}
    </button>
  );
}
