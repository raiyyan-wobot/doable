// Material 3 dynamic color: seed color → every color role, as CSS variables.
//
// Uses Google's material-color-utilities (the same code Android uses for
// dynamic color) with the 2025 color spec that ships with M3 Expressive.
//
// Imported by both the app (theme/ThemeProvider.tsx) and the token generator
// (scripts/generate-tokens.mjs), so it must stay free of path aliases and
// non-erasable TypeScript syntax: Node runs it with type stripping.
import {
  DynamicColor,
  DynamicScheme,
  Hct,
  MaterialDynamicColors,
  SchemeContent,
  SchemeTonalSpot,
  SchemeVibrant,
  argbFromHex,
  hexFromArgb,
} from "@material/material-color-utilities";

/** The M3 baseline seed. Used when the OS reports no accent color. */
export const BASELINE_SEED = "#6750a4";

/**
 * How the palette is derived from the seed (M3 "scheme variants"):
 * - content    → keeps the accent's own hue and saturation (primary container ≈
 *                the accent itself), with analogous secondary/tertiary hues.
 *                Default: on desktop the accent is a deliberate choice, so the
 *                app should look like it.
 * - tonalSpot  → Android's default: desaturated, calm pastel tones
 * - vibrant    → more saturated surfaces and containers
 *
 * M3's "expressive" variant is deliberately not offered: it rotates the
 * secondary hue ~100° away from the seed, so the UI stops matching the system
 * accent (half the controls in the accent, half in another hue). Every style
 * here keeps primary, secondary and surfaces on the accent's hue; the test
 * "every style keeps the main roles on the accent hue" enforces that.
 */
export type ColorStyle = "content" | "tonalSpot" | "vibrant";

export const COLOR_STYLES: ColorStyle[] = ["content", "tonalSpot", "vibrant"];

export const DEFAULT_COLOR_STYLE: ColorStyle = "content";

/** CSS custom property → value, e.g. `{"--md-sys-color-primary": "#415f91"}`. */
export type SchemeVars = Record<string, string>;

const SCHEMES = {
  content: SchemeContent,
  tonalSpot: SchemeTonalSpot,
  vibrant: SchemeVibrant,
} satisfies Record<ColorStyle, new (...args: never[]) => DynamicScheme>;

/** Roles that `allColors` doesn't include but components use. */
const EXTRA_ROLES = [
  MaterialDynamicColors.scrim,
  MaterialDynamicColors.shadow,
  MaterialDynamicColors.surfaceVariant,
  MaterialDynamicColors.surfaceTint,
];

const toKebab = (name: string) =>
  name
    .replace(/_/g, "-")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();

export function createSchemeVars(seedHex: string, isDark: boolean, style: ColorStyle): SchemeVars {
  const Scheme = SCHEMES[style];
  const seed = Hct.fromInt(argbFromHex(seedHex));
  const scheme = new Scheme(seed, isDark, 0, "2025");
  const roles: DynamicColor[] = [...new MaterialDynamicColors().allColors, ...EXTRA_ROLES];

  const vars: SchemeVars = {};
  for (const role of roles) {
    vars[`--md-sys-color-${toKebab(role.name)}`] = hexFromArgb(role.getArgb(scheme));
  }
  return vars;
}

/** Serialize for a `<style>` rule or `style.cssText`. */
export function schemeVarsToCss(vars: SchemeVars): string {
  return Object.entries(vars)
    .map(([name, value]) => `${name}: ${value};`)
    .join(" ");
}
