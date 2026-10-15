import type { Signal } from "solid-js";
import { createStore, reconcile, unwrap } from "solid-js/store";

/**
 * Storage for `createResource` that diffs each new result into the previous one
 * (matching array items by `key`) instead of replacing it. Unchanged items keep
 * their object identity, so `<For>` keeps their DOM nodes, and only the fields
 * that changed re-render.
 *
 * Pattern from the Solid docs: createResource › `storage` option.
 * Usage: `createResource(source, fetcher, { storage: createDeepSignal })`
 */
export function createDeepSignal<T>(value: T, key = "id"): Signal<T> {
  const [store, setStore] = createStore({ value });
  return [
    () => store.value,
    (next: unknown) => {
      const resolved = typeof next === "function" ? next(unwrap(store.value)) : next;
      setStore("value", reconcile(resolved, { key }));
      return store.value;
    },
  ] as Signal<T>;
}
