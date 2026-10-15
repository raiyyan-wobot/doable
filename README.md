# Doable

A calm, local-first task manager for Windows, macOS and Linux. Built with
[Tauri 2](https://tauri.app) (Rust backend) and [SolidJS](https://solidjs.com),
in Google's Material 3 Expressive design language.

- **Offline by design.** Tasks live in a JSON file on your machine. Fonts and
  icons are bundled, and a strict Content-Security-Policy blocks every remote
  request.
- **Native feel.** Colors come from the OS accent color, light/dark and text
  size follow the system, and the layout adapts to the window size.
- **Tested end to end.** Unit and IPC-contract tests in Rust, component tests
  in Vitest, and WebDriver tests that drive the real app, including a WCAG 2.1
  AA audit.

Users: see [docs/INSTALL.md](docs/INSTALL.md).

## Development

Requirements: Node 24 (`.node-version`), pnpm (version pinned in
`package.json`), Rust stable, and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS (on
Linux: WebKitGTK 4.1 and GTK 3 development packages).

```sh
pnpm install
pnpm tauri dev          # run the app with hot reload
```

| Command | What it does |
|---|---|
| `pnpm typecheck` | TypeScript 7 type check (app and build config) |
| `pnpm test` | Frontend tests (Vitest + Solid Testing Library) |
| `pnpm test:rust` | Backend tests (`cargo test`), including IPC contract tests |
| `pnpm test:e2e` | Builds the app and drives it with WebdriverIO + tauri-driver: user journeys, axe accessibility audit, responsive layouts. Needs `cargo install tauri-driver --locked` and WebKitWebDriver (Linux) |
| `pnpm test:all` | All three test suites |
| `pnpm tokens` | Regenerate design tokens (spring motion, fallback color scheme) |
| `pnpm icon` | Regenerate every app icon size from the logo geometry |
| `pnpm tauri build` | Release build and installers for the current OS |
| `pnpm package:arch` | Arch Linux package from the release `.deb` |
| `pnpm check:version` | Check that `package.json` and `Cargo.toml` versions match |

Set `DOABLE_DATA_DIR=/some/dir` to keep data out of your real app-data folder
while developing. The E2E tests do this automatically.

## Architecture

```
src-tauri/src/            Rust backend
├── domain/               Task model + validation; query (filter, sort, stats)
├── store.rs              In-memory list, mirrored to tasks.json with atomic writes
├── transfer/             JSON/CSV import & export, merge logic
├── system/               OS integration: accent color, UI font size
├── commands/             #[tauri::command] functions: the bridge to the UI
└── ipc_tests.rs          Commands called through Tauri's real invoke pipeline

src/                      SolidJS frontend
├── app/                  Shell layout, window size classes, shortcuts, crash screen, logo
├── components/ui/        Material 3 Expressive components (Kobalte + Tailwind)
├── features/tasks/       api/ (types + invoke client) · state/ · config/ · components/
├── theme/                Dynamic color from the accent, light/dark, text size
├── styles/               Design tokens: color roles, type scale, shapes, elevation, motion
└── lib/                  Small shared helpers (dates, class names, reactivity)

e2e/                      WebdriverIO specs against the built app
scripts/                  Token, icon, version and packaging scripts
packaging/arch/           PKGBUILD
.github/workflows/        CI (Linux, Windows, macOS) and Release builds
```

Data flow: the UI sends a `TaskQuery` to Rust (`list_tasks`). Rust filters
and sorts, and every change goes through `Store::mutate`, which saves
atomically and rolls back on error. The TypeScript types in
`features/tasks/api/types.ts` mirror the Rust structs, and contract tests on
both sides keep them in sync.

## Releasing

See [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md). In short: bump the
version, update [CHANGELOG.md](CHANGELOG.md), push a `v*` tag, and the Release
workflow builds every installer into a draft GitHub Release.

## License

[MIT](LICENSE)
