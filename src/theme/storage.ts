// Persisted theme settings. Storage can throw or be empty (private mode,
// tests), so every access is guarded and falls back to a default.
import { COLOR_STYLES, DEFAULT_COLOR_STYLE, type ColorStyle } from "./scheme";
import { TEXT_SIZES, type TextSize } from "./text-size";
import type { ResolvedTheme, ThemeMode } from "./types";

const MODE_KEY = "doable.theme";
const STYLE_KEY = "doable.colorStyle";
const TEXT_SIZE_KEY = "doable.textSize";
/** Last applied scheme, read by the pre-paint script in index.html. */
const SCHEME_CACHE_KEY = "doable.scheme";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore: the setting just won't survive a restart
  }
}

export function readStoredMode(): ThemeMode {
  const value = read(MODE_KEY);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export const storeMode = (mode: ThemeMode) => write(MODE_KEY, mode);

export function readStoredColorStyle(): ColorStyle {
  const value = read(STYLE_KEY);
  return COLOR_STYLES.includes(value as ColorStyle) ? (value as ColorStyle) : DEFAULT_COLOR_STYLE;
}

export const storeColorStyle = (style: ColorStyle) => write(STYLE_KEY, style);

export function readStoredTextSize(): TextSize {
  const value = read(TEXT_SIZE_KEY);
  return TEXT_SIZES.some((s) => s.value === value) ? (value as TextSize) : "default";
}

export const storeTextSize = (size: TextSize) => write(TEXT_SIZE_KEY, size);

/** Cache the applied scheme (and root font size) so the next launch paints with it immediately. */
export function storeSchemeCache(dark: boolean, css: string): void {
  write(SCHEME_CACHE_KEY, JSON.stringify({ dark, css }));
}

/** The OS theme as the webview reports it (fallback outside Tauri). */
export function mediaTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
