// Native theming: light/dark follows the OS, and the whole Material 3 color
// scheme is generated from the OS accent color.
//
// - Mode "system" follows the OS live. Inside Tauri the source of truth is the
//   window theme (`theme()` + `onThemeChanged`); "light"/"dark" also call
//   `window.setTheme()` so the native title bar matches.
// - The seed is the OS accent (theme/accent.ts) or the M3 baseline color. Every
//   change regenerates the scheme (theme/scheme.ts) and writes it to :root as
//   --md-sys-color-* variables, which Tailwind's colors point at.
//
// Requires `core:window:allow-set-theme` (src-tauri/capabilities/default.json).
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  createContext,
  createEffect,
  createMemo,
  createRenderEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
  type ParentProps,
} from "solid-js";
import { readAccent, watchAccent } from "./accent";
import { BASELINE_SEED, createSchemeVars, schemeVarsToCss, type ColorStyle } from "./scheme";
import {
  mediaTheme,
  readStoredColorStyle,
  readStoredMode,
  readStoredTextSize,
  storeColorStyle,
  storeMode,
  storeSchemeCache,
  storeTextSize,
} from "./storage";
import { readSystemFontPx, rootFontPx, type TextSize } from "./text-size";
import type { ResolvedTheme, ThemeContextValue, ThemeMode } from "./types";

export const ThemeContext = createContext<ThemeContextValue>();

export function ThemeProvider(props: ParentProps) {
  const [mode, setMode] = createSignal<ThemeMode>(readStoredMode());
  const [colorStyle, setColorStyle] = createSignal<ColorStyle>(readStoredColorStyle());
  const [osTheme, setOsTheme] = createSignal<ResolvedTheme>(mediaTheme());
  const [systemAccent, setSystemAccent] = createSignal<string | null>(null);
  const [textSize, setTextSize] = createSignal<TextSize>(readStoredTextSize());
  const [systemFontPx, setSystemFontPx] = createSignal<number | null>(null);

  const resolved = () => {
    const current = mode();
    return current === "system" ? osTheme() : current;
  };
  const seed = () => systemAccent() ?? BASELINE_SEED;
  const scheme = createMemo(() => createSchemeVars(seed(), resolved() === "dark", colorStyle()));

  const fontSize = () => `${rootFontPx(systemFontPx(), textSize()).toFixed(2)}px`;

  // Apply before paint (render effect), and cache for the next launch.
  createRenderEffect(() => {
    const root = document.documentElement;
    const dark = resolved() === "dark";
    root.classList.toggle("dark", dark);
    for (const [name, value] of Object.entries(scheme())) root.style.setProperty(name, value);
    root.style.fontSize = fontSize();
    storeSchemeCache(dark, `${schemeVarsToCss(scheme())} font-size: ${fontSize()};`);
  });

  createEffect(on(colorStyle, storeColorStyle));
  createEffect(on(textSize, storeTextSize));

  // Persist the mode and sync the native window chrome.
  createEffect(
    on(mode, async (current) => {
      storeMode(current);
      if (!isTauri()) return;
      const win = getCurrentWindow();
      await win.setTheme(current === "system" ? null : current);
      if (current === "system") setOsTheme((await win.theme()) ?? mediaTheme());
    }),
  );

  // Follow OS light/dark changes. Outside Tauri (browser, tests) use the media query.
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMediaChange = () => !isTauri() && setOsTheme(mediaTheme());
  media.addEventListener("change", onMediaChange);
  onCleanup(() => media.removeEventListener("change", onMediaChange));

  // Native listeners are set up asynchronously. If the provider unmounts while
  // setup is still in flight, stop, and release any listener that arrives late.
  let disposed = false;
  const cleanups: (() => void)[] = [];
  const keep = (cleanup: () => void) => (disposed ? cleanup() : cleanups.push(cleanup));
  onCleanup(() => {
    disposed = true;
    cleanups.forEach((cleanup) => cleanup());
  });

  onMount(async () => {
    // Subscribe before reading, so a change during startup can't be missed.
    keep(await watchAccent(setSystemAccent));
    const [accent, fontPx] = await Promise.all([readAccent(), readSystemFontPx()]);
    if (disposed) return;
    setSystemAccent(accent);
    setSystemFontPx(fontPx);
    if (!isTauri()) return;

    const win = getCurrentWindow();
    // The font size has no change signal; re-read when the window regains focus.
    keep(
      await win.onFocusChanged(async ({ payload: focused }) => {
        if (focused) setSystemFontPx(await readSystemFontPx());
      }),
    );
    if (disposed) return;
    keep(
      await win.onThemeChanged(({ payload }) => {
        if (mode() === "system") setOsTheme(payload);
      }),
    );
  });

  return (
    <ThemeContext.Provider
      value={{ mode, setMode, resolved, colorStyle, setColorStyle, systemAccent, seed, textSize, setTextSize }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
}
