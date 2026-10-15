import { render, screen, waitFor } from "@solidjs/testing-library";
import { emit } from "@tauri-apps/api/event";
import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";
import { describe, expect, it } from "vitest";
import { ThemeProvider, useTheme, type ColorStyle, type ThemeMode } from ".";
import { BASELINE_SEED, DEFAULT_COLOR_STYLE, createSchemeVars } from "./scheme";

function Probe() {
  const theme = useTheme();
  return (
    <div>
      <span data-testid="resolved">{theme.resolved()}</span>
      <span data-testid="seed">{theme.seed()}</span>
      {(["system", "light", "dark"] as ThemeMode[]).map((mode) => (
        <button onClick={() => theme.setMode(mode)}>{mode}</button>
      ))}
      {(["tonalSpot", "vibrant"] as ColorStyle[]).map((style) => (
        <button onClick={() => theme.setColorStyle(style)}>{style}</button>
      ))}
    </div>
  );
}

function renderTheme() {
  render(() => (
    <ThemeProvider>
      <Probe />
    </ThemeProvider>
  ));
}

const rootVar = (name: string) => document.documentElement.style.getPropertyValue(`--md-sys-color-${name}`);

/** Pretend to run inside Tauri, with a fake backend for the theme's IPC calls. */
function mockTauri(options: { accent: string | null; osTheme?: "light" | "dark"; fontPx?: number }) {
  (globalThis as { isTauri?: boolean }).isTauri = true;
  mockWindows("main");
  const calls: { cmd: string; args: unknown }[] = [];
  mockIPC(
    (cmd, args) => {
      calls.push({ cmd, args });
      if (cmd === "get_accent_color") return options.accent;
      if (cmd === "get_system_font_px") return options.fontPx ?? null;
      if (cmd === "plugin:window|theme") return options.osTheme ?? "light";
      return null;
    },
    { shouldMockEvents: true },
  );
  return calls;
}

describe("ThemeProvider: light/dark", () => {
  it("defaults to the OS theme and applies the dark class when switched", () => {
    renderTheme();
    // matchMedia is stubbed to "light" in src/test/setup.ts.
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");

    screen.getByText("dark").click();
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("doable.theme")).toBe("dark");
  });

  it("restores the saved mode", () => {
    localStorage.setItem("doable.theme", "dark");
    renderTheme();
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("syncs the native window theme inside Tauri (null = follow the OS)", async () => {
    const calls = mockTauri({ accent: null, osTheme: "dark" });
    renderTheme();

    await waitFor(() => expect(screen.getByTestId("resolved")).toHaveTextContent("dark"));
    expect(calls).toContainEqual({ cmd: "plugin:window|set_theme", args: { label: "main", value: null } });

    screen.getByText("light").click();
    await waitFor(() =>
      expect(calls).toContainEqual({ cmd: "plugin:window|set_theme", args: { label: "main", value: "light" } }),
    );
  });
});

describe("ThemeProvider: dynamic color", () => {
  it("uses the M3 baseline seed outside Tauri", () => {
    renderTheme();
    expect(screen.getByTestId("seed")).toHaveTextContent(BASELINE_SEED);
    expect(rootVar("primary")).toBe(createSchemeVars(BASELINE_SEED, false, DEFAULT_COLOR_STYLE)["--md-sys-color-primary"]);
  });

  it("generates the scheme from the system accent", async () => {
    mockTauri({ accent: "#3584e4" });
    renderTheme();

    await waitFor(() => expect(screen.getByTestId("seed")).toHaveTextContent("#3584e4"));
    expect(rootVar("primary")).toBe(createSchemeVars("#3584e4", false, DEFAULT_COLOR_STYLE)["--md-sys-color-primary"]);
  });

  it("follows live accent changes pushed by Rust", async () => {
    mockTauri({ accent: "#3584e4" });
    renderTheme();
    await waitFor(() => expect(screen.getByTestId("seed")).toHaveTextContent("#3584e4"));

    await emit("accent-color-changed", "#e01b24");
    await waitFor(() => expect(screen.getByTestId("seed")).toHaveTextContent("#e01b24"));
    expect(rootVar("primary")).toBe(createSchemeVars("#e01b24", false, DEFAULT_COLOR_STYLE)["--md-sys-color-primary"]);
  });

  it("switching color style regenerates and persists", () => {
    renderTheme();
    screen.getByText("vibrant").click();
    expect(rootVar("primary-container")).toBe(
      createSchemeVars(BASELINE_SEED, false, "vibrant")["--md-sys-color-primary-container"],
    );
    expect(localStorage.getItem("doable.colorStyle")).toBe("vibrant");
  });

  it("caches the applied scheme for the pre-paint script", () => {
    renderTheme();
    const cached = JSON.parse(localStorage.getItem("doable.scheme")!);
    expect(cached.dark).toBe(false);
    expect(cached.css).toContain("--md-sys-color-primary:");
  });
});

describe("ThemeProvider: text size", () => {
  const rootFont = () => parseFloat(document.documentElement.style.fontSize);

  it("matches the system UI font, so body text equals the desktop's", async () => {
    mockTauri({ accent: null, fontPx: 14.6667 }); // GNOME "Geist 11"
    renderTheme();
    await waitFor(() => expect(rootFont() * 0.875).toBeCloseTo(14.67, 1));
  });

  it("restores the saved text size preference", () => {
    localStorage.setItem("doable.textSize", "large");
    renderTheme();
    expect(rootFont()).toBeCloseTo(18.4, 1);
  });
});
