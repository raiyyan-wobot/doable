//! App entry point: declares the modules and wires everything into Tauri.
//!
//! Layers, from the inside out (each one depends only on the ones above it):
//!
//!   error     → `AppError`, the one error type every function returns
//!   domain/   → `Task` + validation, and filtering/sorting/stats (pure logic)
//!   store     → in-memory task list mirrored to an atomic JSON file
//!   transfer/ → JSON/CSV import & export and merge logic (pure, no I/O)
//!   system/   → OS integration (system accent color, UI font size)
//!   commands/ → `#[tauri::command]` functions: the thin bridge to the frontend
//!
//! Each `mod x;` loads either `src/x.rs` or `src/x/mod.rs`.

mod commands;
mod domain;
mod error;
mod store;
mod system;
mod transfer;

#[cfg(test)]
mod ipc_tests;

use std::path::PathBuf;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

// `Manager` is a trait. Importing it adds methods like `.path()` and `.manage()`
// to `app`. In Rust, trait methods are only callable when the trait is in scope.
use tauri::{AppHandle, Manager, Runtime};

use commands::{files, system as system_commands, tasks};
use store::Store;

const SAVE_FILE_NAME: &str = "tasks.json";

/// Set this env var to store data somewhere else (portable installs, E2E tests).
/// Example: `DOABLE_DATA_DIR=/tmp/doable pnpm tauri dev`
const DATA_DIR_ENV: &str = "DOABLE_DATA_DIR";

/// The main window starts hidden (tauri.conf.json `"visible": false`) and the
/// frontend shows it after its first themed paint, so there is no flash of a
/// blank or wrongly colored window. If that never happens (a frontend crash),
/// show it anyway after this long so the app can't be stuck invisible.
const SHOW_WINDOW_FAILSAFE: Duration = Duration::from_secs(3);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        // Logs go to stdout and to a file in the OS log folder, e.g. on Linux
        // ~/.local/share/com.raiyyan.doable/logs/. Use `log::info!` etc. anywhere.
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        // `setup` runs once at startup, before any window loads the frontend.
        // Returning `Err` here aborts startup with that error.
        .setup(|app| {
            let path = data_dir(app.handle())?.join(SAVE_FILE_NAME);
            let store = Store::load(path.clone())?;
            log::info!("loaded {} tasks from {}", store.tasks().len(), path.display());

            // Hand the state to Tauri. Any command can then ask for it with
            // `state: State<'_, AppState>`. The type must match exactly: Mutex<Store>.
            app.manage(Mutex::new(store));

            // Push OS accent-color changes to the frontend (Linux portal).
            system::accent::watch(app.handle().clone());

            if let Some(window) = app.get_webview_window("main") {
                thread::spawn(move || {
                    thread::sleep(SHOW_WINDOW_FAILSAFE);
                    if !window.is_visible().unwrap_or(true) {
                        log::warn!("frontend didn't show the window; showing it now");
                        let _ = window.show();
                    }
                });
            }
            Ok(())
        });

    with_commands(builder)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Register every command the frontend may call. A command missing from this
/// list makes `invoke()` reject with "command not found".
///
/// It's a separate function, generic over the Tauri `Runtime`, so the IPC tests
/// (`ipc_tests.rs`) can register the exact same commands on Tauri's mock runtime.
fn with_commands<R: Runtime>(builder: tauri::Builder<R>) -> tauri::Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
        tasks::list_tasks,
        tasks::get_stats,
        tasks::list_tags,
        tasks::create_task,
        tasks::update_task,
        tasks::set_completed,
        tasks::delete_task,
        tasks::clear_completed,
        files::export_tasks,
        files::import_tasks,
        system_commands::get_accent_color,
        system_commands::get_system_font_px,
    ])
}

/// Where the save file lives. By default it's the OS per-app data folder, built
/// from `identifier` in tauri.conf.json:
///   Linux:   ~/.local/share/com.raiyyan.doable/
///   macOS:   ~/Library/Application Support/com.raiyyan.doable/
///   Windows: %APPDATA%\com.raiyyan.doable\
fn data_dir<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<PathBuf> {
    match std::env::var_os(DATA_DIR_ENV) {
        Some(dir) => Ok(PathBuf::from(dir)),
        None => app.path().app_data_dir(),
    }
}
