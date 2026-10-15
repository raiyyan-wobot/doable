//! Import / export commands, with native file dialogs opened from Rust.
//!
//! Why are these `async`? Tauri runs plain (sync) commands on the main thread,
//! which also runs the UI event loop. The dialog plugin's `blocking_*` calls wait
//! for the user, which would freeze the window. `async` commands run on a
//! background thread pool, where blocking is fine.
//!
//! Rule of thumb: never hold the store's Mutex while waiting on the user or the
//! disk. Pick the file first, *then* lock only for the quick in-memory part.

use std::fs;
use std::path::PathBuf;

use tauri::{AppHandle, Runtime, State};
use tauri_plugin_dialog::{DialogExt, FilePath};

use super::{AppState, lock, today};
use crate::error::{AppError, AppResult};
use crate::transfer::{self, FileFormat, ImportMode, ImportSummary};

/// Returns the saved path, or `None` if the user cancelled the dialog.
///
/// Generic over `R: Runtime` (instead of the default `AppHandle<Wry>`) so the
/// same command also compiles against Tauri's mock runtime in tests.
#[tauri::command]
pub async fn export_tasks<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, AppState>,
    format: FileFormat,
) -> AppResult<Option<String>> {
    let ext = format.extension();
    let picked = app
        .dialog()
        .file()
        .add_filter(ext.to_uppercase(), &[ext])
        .set_file_name(format!("tasks-{}.{ext}", today())) // e.g. tasks-2026-10-15.json
        .blocking_save_file();

    // `let ... else`: destructure, or run the else branch, which must exit.
    let Some(picked) = picked else { return Ok(None) };
    let path = to_local_path(picked)?;

    // The lock lives only inside this block; it's released before the disk write.
    let content = {
        let store = lock(&state);
        transfer::export(store.tasks(), format)?
    };
    fs::write(&path, content)?;

    log::info!("exported tasks to {}", path.display());
    Ok(Some(path.display().to_string()))
}

/// Returns `None` if the user cancelled the dialog.
#[tauri::command]
pub async fn import_tasks<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, AppState>,
    mode: ImportMode,
) -> AppResult<Option<ImportSummary>> {
    let picked = app
        .dialog()
        .file()
        .add_filter("Tasks", &["json", "csv"])
        .blocking_pick_file();

    let Some(picked) = picked else { return Ok(None) };
    let path = to_local_path(picked)?;

    // Read and parse *before* locking. A bad file fails here and the store is untouched.
    let format = FileFormat::from_path(&path)?;
    let content = fs::read_to_string(&path)?;
    let (incoming, dropped) = transfer::parse(&content, format)?;

    let mut summary = lock(&state).mutate(|tasks| Ok(transfer::merge(tasks, incoming, mode)))?;
    summary.skipped += dropped;

    log::info!("imported {} ({mode:?}): {summary:?}", path.display());
    Ok(Some(summary))
}

/// On desktop the dialog returns a filesystem path. On mobile it may return a
/// content URL, which `std::fs` can't open, so that case becomes an error.
fn to_local_path(picked: FilePath) -> AppResult<PathBuf> {
    picked
        .into_path()
        .map_err(|e| AppError::Validation(format!("unsupported file location: {e}")))
}
