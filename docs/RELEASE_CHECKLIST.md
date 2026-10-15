# Release checklist

Work through this list for every release. Items marked *(automated)* are
enforced by tests or CI. The others are manual.

## 1. Prepare

- [ ] Bump `version` in `package.json` and `src-tauri/Cargo.toml` to the same
      value. `tauri.conf.json` reads `package.json`, and `pnpm check:version`
      (run in CI) fails if the two disagree.
- [ ] Add a section to `CHANGELOG.md` for the new version.
- [ ] If the save-file format changed, bump `FORMAT_VERSION` in
      `src-tauri/src/store.rs` and add a migration in `Store::load`.
- [ ] If the logo changed (`src/lib/shapes.ts`), run `pnpm icon`: it
      regenerates every icon size and the favicon.

## 2. Verify

- [ ] `pnpm typecheck` passes (frontend and build config).
- [ ] `pnpm test` passes: components, the color system and the WCAG contrast
      checks for every accent *(automated)*.
- [ ] `pnpm test:rust` passes: domain logic, storage, import/export and the
      IPC contract *(automated)*.
- [ ] `pnpm test:e2e` passes against the real app: user journeys, the axe
      WCAG 2.1 AA audit in light and dark, minimum text size, and the
      compact/medium/expanded layouts *(automated on Linux in CI)*.
- [ ] Launch the release build on each OS you ship and check the
      [smoke test](#smoke-test).

## 3. Build

- [ ] Push a tag (`git tag v<version> && git push --tags`). The Release
      workflow builds Windows, macOS and Linux installers plus the Arch package
      and attaches them to a **draft** GitHub Release.
- [ ] Or build Linux locally: `pnpm tauri build` (deb, rpm, AppImage), then
      `pnpm package:arch` (Arch).

## 4. Sign (recommended before sharing widely)

Unsigned installers work, but users have to click through a warning
(see `docs/INSTALL.md`).

- [ ] **macOS:** with an Apple Developer account, add the `APPLE_*` secrets
      listed in `.github/workflows/release.yml`. tauri-action then signs and
      notarizes the app.
- [ ] **Windows:** with a code-signing certificate, set
      `bundle.windows.certificateThumbprint` (or `signCommand`) in
      `tauri.conf.json`.

## 5. Publish

- [ ] Download each artifact from the draft release and install it (a clean VM
      is ideal).
- [ ] Publish the release, and share `docs/INSTALL.md` with the download.

## Smoke test

On each platform, with the installed build:

1. The app launches with no white flash. Light/dark and the accent color match
   the OS.
2. Create a task with a due date, tags and priority. Restart the app and check
   the task is still there.
3. Complete, edit and delete a task. Check search, the filters and the sidebar
   views.
4. Export as JSON and as CSV, then import the JSON back in merge mode.
5. Resize the window narrow, medium and wide. The navigation adapts.
6. Change the OS accent color or theme, then switch back to the app. It
   follows.

## Already covered by the codebase

| Area | Where |
|---|---|
| Strict CSP: no remote code, fonts or requests (offline by construction) | `src-tauri/tauri.conf.json` › `app.security.csp` |
| Minimal capabilities: core, set-theme, show-window | `src-tauri/capabilities/default.json` |
| Optimized, stripped release binary (LTO, `panic = "abort"`) | `src-tauri/Cargo.toml` › `[profile.release]` |
| Atomic saves; a corrupt save file is moved aside, not overwritten | `src-tauri/src/store.rs` |
| Logs to a file for bug reports | `tauri-plugin-log`; folder per OS under the app's data dir |
| Crash screen instead of a blank window | `src/app/CrashScreen.tsx` |
| No flash on launch: hidden until the first themed paint, with a 3 s fallback | `src/index.tsx`, `src-tauri/src/lib.rs` |
| Installer metadata, license, dependencies (deb/rpm/Arch), WebView2 bootstrapper | `src-tauri/tauri.conf.json` › `bundle`, `packaging/arch/PKGBUILD` |
