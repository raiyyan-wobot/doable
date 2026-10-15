// End-to-end tests: WebdriverIO drives the real app through tauri-driver
// (Tauri docs: Develop › Tests › WebDriver). On Linux tauri-driver talks to
// WebKitWebDriver, so the full stack runs: webview + Rust backend + disk.
//
// Prerequisites: `cargo install tauri-driver --locked`, and WebKitWebDriver
// (Arch: webkit2gtk-4.1, Debian/Ubuntu: webkit2gtk-driver).
// Run: `pnpm test:e2e` (set E2E_SKIP_BUILD=1 to reuse the last debug build).
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const application = path.join(root, "src-tauri/target/debug/doable");
const tauriDriverPath = path.join(os.homedir(), ".cargo/bin/tauri-driver");

/** @type {import("node:child_process").ChildProcess | undefined} */
let tauriDriver;
let exiting = false;
let dataDir = "";

function closeTauriDriver() {
  exiting = true;
  tauriDriver?.kill();
}

export const config = {
  host: "127.0.0.1",
  logLevel: "warn",
  port: 4444,
  specs: ["./specs/**/*.e2e.js"],
  maxInstances: 1,
  capabilities: [{ maxInstances: 1, "tauri:options": { application } }],
  reporters: ["spec"],
  framework: "mocha",
  mochaOpts: { ui: "bdd", timeout: 60_000 },

  // Build a debug binary with the frontend embedded, before any session starts.
  onPrepare: () => {
    mkdirSync(path.join(root, "e2e/screenshots"), { recursive: true });
    if (process.env.E2E_SKIP_BUILD) return;
    const result = spawnSync("pnpm", ["tauri", "build", "--debug", "--no-bundle"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
    if (result.status !== 0) throw new Error("tauri build failed");
  },

  // Each session gets a fresh, throwaway data folder (see DOABLE_DATA_DIR in
  // src-tauri/src/lib.rs), so tests never touch real tasks.
  beforeSession: () => {
    dataDir = mkdtempSync(path.join(os.tmpdir(), "doable-e2e-"));
    process.env.DOABLE_DATA_DIR = dataDir; // readable from specs
    tauriDriver = spawn(tauriDriverPath, [], {
      stdio: [null, process.stdout, process.stderr],
      env: { ...process.env, DOABLE_DATA_DIR: dataDir },
    });
    tauriDriver.on("error", (error) => {
      console.error("tauri-driver error:", error);
      process.exit(1);
    });
    tauriDriver.on("exit", (code) => {
      if (!exiting) {
        console.error("tauri-driver exited with code:", code);
        process.exit(1);
      }
    });
  },

  afterSession: () => {
    closeTauriDriver();
    rmSync(dataDir, { recursive: true, force: true });
  },
};

// Don't leave tauri-driver running if the test process is interrupted.
for (const signal of ["exit", "SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    closeTauriDriver();
    if (signal !== "exit") process.exit();
  });
}
