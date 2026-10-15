import type { Theme } from "@tauri-apps/api/window";
import type { Accessor } from "solid-js";
import type { ColorStyle } from "./scheme";
import type { TextSize } from "./text-size";

/** The user's choice. "system" follows the OS. */
export type ThemeMode = "system" | Theme;

/** The theme actually on screen. */
export type ResolvedTheme = Theme;

export interface ThemeContextValue {
  mode: Accessor<ThemeMode>;
  setMode: (mode: ThemeMode) => void;
  resolved: Accessor<ResolvedTheme>;

  colorStyle: Accessor<ColorStyle>;
  setColorStyle: (style: ColorStyle) => void;
  /** The OS accent color ("#rrggbb"), or null when the OS has none. */
  systemAccent: Accessor<string | null>;
  /** The color the scheme is generated from: the system accent or the M3 baseline. */
  seed: Accessor<string>;

  textSize: Accessor<TextSize>;
  setTextSize: (size: TextSize) => void;
}
