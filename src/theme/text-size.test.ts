import { describe, expect, it } from "vitest";
import { rootFontPx } from "./text-size";

describe("rootFontPx", () => {
  it("makes body text (0.875rem) equal the system UI font", () => {
    // GNOME "Geist 11" = 11pt = 14.67px → root 16.76px → body-medium 14.67px.
    const root = rootFontPx(14.6667, "default");
    expect(root * 0.875).toBeCloseTo(14.6667, 3);
  });

  it("keeps M3's stock 16px root when the OS reports nothing", () => {
    expect(rootFontPx(null, "default")).toBe(16);
  });

  it("applies the user's preference on top", () => {
    expect(rootFontPx(null, "large")).toBeCloseTo(18.4);
    expect(rootFontPx(null, "small")).toBeCloseTo(14.4);
  });
});
