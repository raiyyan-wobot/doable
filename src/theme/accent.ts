// The OS accent color, read by Rust (src-tauri/src/system/accent/).
import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

/** Mirrors `system::accent::CHANGED_EVENT` in Rust. */
export const ACCENT_CHANGED_EVENT = "accent-color-changed";

/** "#rrggbb", or null outside Tauri / when the OS has no accent color. */
export async function readAccent(): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<string | null>("get_accent_color");
  } catch {
    return null;
  }
}

/**
 * Call `onChange` whenever the accent may have changed:
 * - Linux pushes changes live through the portal (Rust emits an event);
 * - Windows/macOS have no cheap change signal, so re-read on window focus.
 * Resolves to a cleanup function.
 */
export async function watchAccent(onChange: (accent: string | null) => void): Promise<() => void> {
  if (!isTauri()) return () => {};
  const unlistenEvent = await listen<string | null>(ACCENT_CHANGED_EVENT, (event) =>
    onChange(event.payload),
  );
  const unlistenFocus = await getCurrentWindow().onFocusChanged(async ({ payload: focused }) => {
    if (focused) onChange(await readAccent());
  });
  return () => {
    unlistenEvent();
    unlistenFocus();
  };
}
