import { Hct, argbFromHex } from "@material/material-color-utilities";
import { describe, expect, it } from "vitest";
import { BASELINE_SEED, COLOR_STYLES, createSchemeVars, schemeVarsToCss } from "./scheme";

const HEX = /^#[0-9a-f]{6}$/;

/** WCAG relative luminance of "#rrggbb". */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("createSchemeVars", () => {
  const light = createSchemeVars("#3584e4", false, "tonalSpot");
  const dark = createSchemeVars("#3584e4", true, "tonalSpot");

  it("produces every role the Tailwind theme maps", () => {
    for (const role of [
      "primary", "on-primary", "primary-container", "on-primary-container",
      "secondary-container", "tertiary-container", "error", "error-container",
      "surface", "on-surface", "on-surface-variant", "surface-container-lowest",
      "surface-container-low", "surface-container", "surface-container-high",
      "surface-container-highest", "inverse-surface", "inverse-on-surface",
      "inverse-primary", "outline", "outline-variant", "scrim", "shadow",
    ]) {
      expect(light[`--md-sys-color-${role}`], role).toMatch(HEX);
    }
  });

  it("meets M3 contrast for text on its container roles (≥ 4.5:1)", () => {
    for (const scheme of [light, dark]) {
      expect(contrast(scheme["--md-sys-color-on-primary"], scheme["--md-sys-color-primary"])).toBeGreaterThanOrEqual(4.5);
      expect(contrast(scheme["--md-sys-color-on-surface"], scheme["--md-sys-color-surface"])).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(scheme["--md-sys-color-on-secondary-container"], scheme["--md-sys-color-secondary-container"]),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("dark schemes have dark surfaces", () => {
    expect(luminance(light["--md-sys-color-surface"])).toBeGreaterThan(0.7);
    expect(luminance(dark["--md-sys-color-surface"])).toBeLessThan(0.05);
  });

  it("follows the seed: a blue accent gives a blue-ish primary, not the purple baseline", () => {
    const baseline = createSchemeVars(BASELINE_SEED, false, "tonalSpot");
    expect(light["--md-sys-color-primary"]).not.toBe(baseline["--md-sys-color-primary"]);
    const primary = light["--md-sys-color-primary"];
    const [r, , b] = [1, 3, 5].map((i) => parseInt(primary.slice(i, i + 2), 16));
    expect(b).toBeGreaterThan(r);
  });

  it("color styles change the palette", () => {
    const vibrant = createSchemeVars("#3584e4", false, "vibrant");
    expect(vibrant["--md-sys-color-primary-container"]).not.toBe(light["--md-sys-color-primary-container"]);
  });

  it("serializes to CSS declarations", () => {
    expect(schemeVarsToCss({ "--a": "#000000", "--b": "#ffffff" })).toBe("--a: #000000; --b: #ffffff;");
  });
});

describe("accent fidelity", () => {
  const hue = (hex: string) => Hct.fromInt(argbFromHex(hex)).hue;
  const hueDistance = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

  // Seeds across the wheel: GNOME blue, red, green, orange, purple.
  it.each(["#3584e4", "#e01b24", "#2ec27e", "#ff7800", "#9141ac"])(
    "every style keeps the main roles on the accent hue (%s)",
    (seed) => {
      for (const style of COLOR_STYLES) {
        for (const dark of [false, true]) {
          const v = createSchemeVars(seed, dark, style);
          for (const role of ["primary-container", "secondary-container", "surface-container"]) {
            const distance = hueDistance(hue(v[`--md-sys-color-${role}`]), hue(seed));
            expect(distance, `${style} ${dark ? "dark" : "light"} ${role}`).toBeLessThan(25);
          }
        }
      }
    },
  );
});

describe("WCAG contrast of the pairs the UI uses", () => {
  // Text pairs need 4.5:1 (WCAG AA, normal text). Each pair is
  // [foreground, background, where it's used].
  const TEXT_PAIRS: [string, string, string][] = [
    ["on-primary", "primary", "filled buttons, selected days"],
    ["on-primary-container", "primary-container", "FAB"],
    ["on-secondary-container", "secondary-container", "nav pill, selected chips"],
    ["on-tertiary-container", "tertiary-container", "selected menu items, medium priority"],
    ["on-error-container", "error-container", "high priority"],
    ["on-surface", "surface", "body text"],
    ["on-surface", "surface-container", "list item titles"],
    ["on-surface-variant", "surface", "supporting text"],
    ["on-surface-variant", "surface-container", "metadata in list items"],
    ["on-surface-variant", "surface-container-high", "search placeholder, dialog text"],
    ["primary", "surface", "text buttons, today in the calendar"],
    ["primary", "surface-container-high", "text buttons in dialogs"],
    ["error", "surface-container", "overdue dates"],
    ["inverse-on-surface", "inverse-surface", "snackbars, tooltips"],
    ["inverse-primary", "inverse-surface", "snackbar actions"],
  ];
  // Non-text UI (field borders, checkbox outlines) needs 3:1 (WCAG 1.4.11).
  const UI_PAIRS: [string, string, string][] = [
    ["outline", "surface", "text field border"],
    ["outline", "surface-container-high", "text field border in dialogs"],
    ["on-surface-variant", "surface-container", "unchecked checkbox"],
  ];

  // GNOME's nine accent colors (what Linux users actually get), plus a bright
  // yellow and green, the hardest seeds for contrast.
  const SEEDS = [
    "#3584e4", "#2190a4", "#3a944a", "#c88800", "#ed5b00",
    "#e62d42", "#d56199", "#9141ac", "#6f8396", "#f6d32d", "#2ec27e",
  ];

  it.each(SEEDS)("all styles, light and dark, pass for accent %s", (seed) => {
    const failures: string[] = [];
    for (const style of COLOR_STYLES) {
      for (const dark of [false, true]) {
        const v = createSchemeVars(seed, dark, style);
        const check = (pairs: [string, string, string][], min: number) => {
          for (const [fg, bg, use] of pairs) {
            const ratio = contrast(v[`--md-sys-color-${fg}`], v[`--md-sys-color-${bg}`]);
            if (ratio < min) failures.push(`${style}/${dark ? "dark" : "light"} ${fg} on ${bg} (${use}): ${ratio.toFixed(2)}`);
          }
        };
        check(TEXT_PAIRS, 4.5);
        check(UI_PAIRS, 3);
      }
    }
    expect(failures).toEqual([]);
  });
});
