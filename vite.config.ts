/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig({
  plugins: [solid(), tailwindcss()],
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // Unit + component tests (Vitest). E2E tests live in e2e/ and use WebdriverIO.
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    server: {
      deps: {
        // Bundle through Vite instead of Node: this package's 0.4.0 release
        // has an extensionless import that Node's ESM resolver rejects.
        inline: ["@material/material-color-utilities"],
      },
    },
  },
});
