// Text size: match the desktop's UI font, then apply the user's preference.
//
// Every type token is in rem (styles/tokens/typography.css), so setting the
// root font size scales the whole M3 type scale. The root is chosen so M3
// body-medium (0.875rem), the app's main UI text, equals the system UI font.
import { invoke, isTauri } from "@tauri-apps/api/core";

export type TextSize = "small" | "default" | "large" | "larger";

export const TEXT_SIZES: { value: TextSize; label: string; scale: number }[] = [
  { value: "small", label: "Small", scale: 0.9 },
  { value: "default", label: "Default", scale: 1 },
  { value: "large", label: "Large", scale: 1.15 },
  { value: "larger", label: "Larger", scale: 1.3 },
];

/** M3 body-medium in rem: the size that should equal the system UI font. */
const BODY_MEDIUM_REM = 0.875;
/** Used when the OS doesn't report a font size: keeps M3's stock 16px root. */
const FALLBACK_UI_FONT_PX = 14;

/** Root font size in px for a system UI font size and a user preference. */
export function rootFontPx(systemUiFontPx: number | null, size: TextSize): number {
  const scale = TEXT_SIZES.find((s) => s.value === size)?.scale ?? 1;
  return ((systemUiFontPx ?? FALLBACK_UI_FONT_PX) / BODY_MEDIUM_REM) * scale;
}

/** The desktop UI font size in px (Rust: system::font), or null if unknown. */
export async function readSystemFontPx(): Promise<number | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<number | null>("get_system_font_px");
  } catch {
    return null;
  }
}
