/// <reference types="node" />
// Runs before every test file (see `test.setupFiles` in vite.config.ts).
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@solidjs/testing-library";
import { clearMocks } from "@tauri-apps/api/mocks";
import { randomFillSync } from "node:crypto";
import { afterEach, beforeAll } from "vitest";

beforeAll(() => {
  // jsdom doesn't come with a WebCrypto implementation, which Tauri's IPC mocks
  // use (recommended in the Tauri docs: Develop › Tests › Mocking).
  if (!window.crypto?.getRandomValues) {
    Object.defineProperty(window, "crypto", {
      value: { getRandomValues: (buffer: Uint8Array) => randomFillSync(buffer) },
    });
  }

  // jsdom doesn't implement matchMedia. Answer width queries from
  // window.innerWidth (tests can change it), and report a light OS theme.
  window.matchMedia ??= (query: string) => {
    const minWidth = /min-width:\s*(\d+)px/.exec(query);
    return {
      matches: minWidth ? window.innerWidth >= Number(minWidth[1]) : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  };
});

afterEach(async () => {
  cleanup(); // unmount components rendered by @solidjs/testing-library
  // Tauri's unlisten() completes asynchronously; let it run before the mocks go.
  await new Promise((resolve) => setTimeout(resolve, 0));
  clearMocks(); // undo mockIPC / mockWindows so tests don't leak into each other
  localStorage.clear();
  document.documentElement.className = "";
  document.documentElement.removeAttribute("style");
  delete (globalThis as { isTauri?: boolean }).isTauri;
  setWindowWidth(1024); // jsdom's default: the "expanded" layout
});

/** Simulate a window width (drives the matchMedia stub above). */
export function setWindowWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
}
