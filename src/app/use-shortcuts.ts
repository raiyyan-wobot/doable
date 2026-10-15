import { onCleanup } from "solid-js";

/** Map of single keys (as in `KeyboardEvent.key`) to handlers. */
export type ShortcutMap = Record<string, () => void>;

/** True when focus is in a text field, so single-key shortcuts don't hijack typing. */
function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/**
 * Register app-wide single-key shortcuts for the lifetime of the calling
 * component. Ignored while typing, with modifier keys held, or when `enabled`
 * returns false (e.g. while a dialog is open).
 */
export function useShortcuts(shortcuts: ShortcutMap, enabled: () => boolean = () => true) {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTyping(event.target) || !enabled()) return;
    const handler = shortcuts[event.key];
    if (!handler) return;
    event.preventDefault();
    handler();
  };

  document.addEventListener("keydown", onKeyDown);
  onCleanup(() => document.removeEventListener("keydown", onKeyDown));
}
