//! Tauri commands: the functions JavaScript can call with `invoke("name", args)`.
//!
//! How a call flows:
//!   JS  invoke("create_task", { input: {...} })
//!   →   Tauri deserializes the args object into the Rust parameters by name
//!       (JS camelCase keys map to Rust snake_case params automatically)
//!   →   the function runs
//!   →   `Ok(value)` is serialized to JSON and resolves the JS Promise;
//!       `Err(AppError)` is serialized (as a string) and rejects it.
//!
//! Commands are kept thin: lock the state, call into `domain` / `transfer`,
//! return. The business logic lives in those modules, which don't know Tauri exists.
//!
//! - `tasks`  → CRUD, listing, stats
//! - `files`  → import / export via native file dialogs
//! - `system` → OS integration (accent color)

pub mod files;
pub mod system;
pub mod tasks;

use std::sync::{Mutex, MutexGuard};

use chrono::{Local, NaiveDate};

use crate::store::Store;

/// The shared app state, registered once in `lib.rs` with `app.manage(...)`.
///
/// Why a `Mutex`? Tauri can run several commands at the same time on different
/// threads. Rust refuses to compile code where two threads could mutate the same
/// data unsynchronized. `Mutex` lets one thread at a time hold the lock.
/// `.lock()` returns a guard, and the lock is released when the guard goes out
/// of scope (end of the block or function).
pub type AppState = Mutex<Store>;

/// Lock the store.
///
/// `.lock()` only fails if another thread panicked while holding the lock
/// ("poisoned"). `Store::mutate` restores the list on any error, so the data is
/// still consistent and recovering it with `into_inner()` is safe.
fn lock(state: &AppState) -> MutexGuard<'_, Store> {
    state.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
}

/// The user's local calendar date. "Today" and "overdue" depend on the user's
/// timezone, not UTC, so this is the one place the clock is read.
fn today() -> NaiveDate {
    Local::now().date_naive()
}
