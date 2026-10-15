import { createSignal, onCleanup, type Accessor } from "solid-js";

/**
 * M3 window size classes (m3.material.io › Foundations › Layout):
 * compact < 600dp ≤ medium < 840dp ≤ expanded. Layout decisions (which
 * navigation to show, pane margins) key off this, not raw pixel widths.
 */
export type WindowSizeClass = "compact" | "medium" | "expanded";

const MEDIUM = "(min-width: 600px)";
const EXPANDED = "(min-width: 840px)";

function current(): WindowSizeClass {
  if (window.matchMedia(EXPANDED).matches) return "expanded";
  if (window.matchMedia(MEDIUM).matches) return "medium";
  return "compact";
}

/** The window's size class, updated live as the window is resized. */
export function useWindowSizeClass(): Accessor<WindowSizeClass> {
  const [sizeClass, setSizeClass] = createSignal(current());
  const update = () => setSizeClass(current());
  const queries = [MEDIUM, EXPANDED].map((query) => window.matchMedia(query));
  for (const query of queries) query.addEventListener("change", update);
  onCleanup(() => {
    for (const query of queries) query.removeEventListener("change", update);
  });
  return sizeClass;
}
