import { Show } from "solid-js";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";

interface SearchBarProps {
  value: string;
  onInput: (value: string) => void;
  placeholder: string;
  /** Keyboard shortcut hint shown while empty, e.g. "/". */
  shortcut?: string;
  ref?: (el: HTMLInputElement) => void;
  class?: string;
}

/**
 * M3 search bar (Compose SearchBarTokens): 56dp tall, full (pill) corners,
 * surface-container-high, body-large input, on-surface leading icon,
 * on-surface-variant trailing icon.
 */
export function SearchBar(props: SearchBarProps) {
  return (
    <div
      class={cn(
        "group/search relative flex h-14 items-center gap-4 rounded-full bg-surface-container-high pr-2 pl-4",
        "transition-shadow motion-fast-effects focus-within:shadow-1",
        props.class,
      )}
    >
      <Icon name="search" size={24} class="text-on-surface" />
      <input
        ref={props.ref}
        type="search"
        aria-label={props.placeholder}
        placeholder={props.placeholder}
        value={props.value}
        onInput={(e) => props.onInput(e.currentTarget.value)}
        onKeyDown={(e) => e.key === "Escape" && (props.value ? props.onInput("") : e.currentTarget.blur())}
        class="h-full min-w-0 flex-1 bg-transparent text-body-large text-on-surface outline-none placeholder:text-on-surface-variant [&::-webkit-search-cancel-button]:hidden"
      />
      <Show
        when={props.value}
        fallback={
          <Show when={props.shortcut}>
            <kbd class="mr-2 rounded-xs border border-outline-variant px-1.5 font-sans text-label-medium text-on-surface-variant">
              {props.shortcut}
            </kbd>
          </Show>
        }
      >
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => props.onInput("")}
          class="state-layer focus-ring flex size-10 cursor-pointer items-center justify-center rounded-full text-on-surface-variant"
        >
          <Icon name="x" size={24} />
        </button>
      </Show>
    </div>
  );
}
