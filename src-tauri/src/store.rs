//! Persistence: keeps tasks in memory and mirrors them to a JSON file.
//!
//! Design:
//! - The whole task list lives in memory (`Vec<Task>`). Reads never touch disk.
//! - Every change goes through `Store::mutate`, which writes the file after the change.
//! - Writes are *atomic*: we write `tasks.json.tmp` first, then rename it over
//!   `tasks.json`. A rename is all-or-nothing on the same filesystem, so a crash
//!   mid-write can't leave a half-written save file.
//!
//! A todo list holds hundreds or a few thousand tasks, so rewriting the whole
//! file on every change takes microseconds. A database (SQLite) would only be
//! worth it at much larger sizes.

use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::domain::Task;
use crate::error::AppResult;

/// Current save-file format version. Bump it if the shape of `Task` changes in
/// a way old files can't be read as-is, and add a migration in `load`.
pub const FORMAT_VERSION: u32 = 1;

/// On-disk shape: `{ "version": 1, "tasks": [...] }`.
/// The version field tells future code how to read an old file.
/// Export files use the same shape, so an export can be imported again later.
#[derive(Debug, Serialize, Deserialize)]
pub struct SaveFile {
    pub version: u32,
    pub tasks: Vec<Task>,
}

pub struct Store {
    path: PathBuf,
    tasks: Vec<Task>,
}

impl Store {
    /// Load from disk, or start empty if the file doesn't exist yet (first launch).
    pub fn load(path: PathBuf) -> AppResult<Store> {
        if !path.exists() {
            return Ok(Store { path, tasks: Vec::new() });
        }

        let content = fs::read_to_string(&path)?;
        let tasks = match serde_json::from_str::<SaveFile>(&content) {
            Ok(file) => file.tasks,
            Err(err) => {
                // Don't crash, and don't overwrite the user's data either: move the
                // broken file aside so it can be recovered by hand, then start empty.
                let backup = path.with_extension("json.corrupt");
                log::warn!("save file unreadable ({err}); moved to {}", backup.display());
                fs::rename(&path, &backup)?;
                Vec::new()
            }
        };
        Ok(Store { path, tasks })
    }

    /// Read-only access. Returning `&[Task]` (a slice) instead of `&Vec<Task>`
    /// is idiomatic: callers can read but can't push or remove.
    pub fn tasks(&self) -> &[Task] {
        &self.tasks
    }

    /// Run a change against the task list, then save it. All-or-nothing:
    /// if the closure fails *or* the save fails, the in-memory list is restored,
    /// so memory and disk never disagree.
    ///
    /// Generics:
    /// - `T` is whatever the closure returns (the created Task, a count, ...).
    /// - `impl FnOnce(&mut Vec<Task>) -> AppResult<T>` accepts any closure that
    ///   takes a mutable borrow of the list. `FnOnce` = it's called exactly once.
    ///
    /// Usage: `store.mutate(|tasks| { tasks.push(t); Ok(()) })`
    pub fn mutate<T>(&mut self, change: impl FnOnce(&mut Vec<Task>) -> AppResult<T>) -> AppResult<T> {
        // Cloning the whole list is fine at todo-list sizes and gives us a simple rollback.
        let snapshot = self.tasks.clone();

        let result = change(&mut self.tasks).and_then(|value| {
            self.save()?;
            Ok(value)
        });

        if result.is_err() {
            self.tasks = snapshot;
        }
        result
    }

    fn save(&self) -> AppResult<()> {
        // Make sure the app-data folder exists (first save on a fresh machine).
        if let Some(dir) = self.path.parent() {
            fs::create_dir_all(dir)?;
        }
        let file = SaveFile { version: FORMAT_VERSION, tasks: self.tasks.clone() };
        let json = serde_json::to_string_pretty(&file)?;

        let tmp = self.path.with_extension("json.tmp");
        fs::write(&tmp, json)?;
        fs::rename(&tmp, &self.path)?; // atomic replace
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::{Priority, TaskInput};
    use crate::error::AppError;

    /// A fresh temp dir per test; it's deleted when the `TempDir` is dropped.
    fn temp_store_path() -> (tempfile::TempDir, PathBuf) {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("tasks.json");
        (dir, path)
    }

    fn new_task(title: &str) -> Task {
        Task::new(TaskInput {
            title: title.into(),
            description: String::new(),
            priority: Priority::Low,
            due_date: None,
            tags: vec![],
        })
        .unwrap()
    }

    #[test]
    fn saves_and_reloads() {
        let (_dir, path) = temp_store_path();
        let mut store = Store::load(path.clone()).unwrap();
        store
            .mutate(|tasks| {
                tasks.push(new_task("a"));
                Ok(())
            })
            .unwrap();

        let reloaded = Store::load(path).unwrap();
        assert_eq!(reloaded.tasks().len(), 1);
        assert_eq!(reloaded.tasks()[0].title, "a");
    }

    #[test]
    fn failed_mutation_rolls_back() {
        let (_dir, path) = temp_store_path();
        let mut store = Store::load(path).unwrap();
        let result: AppResult<()> = store.mutate(|tasks| {
            tasks.push(new_task("never saved"));
            Err(AppError::Validation("nope".into()))
        });
        assert!(result.is_err());
        assert!(store.tasks().is_empty());
    }

    #[test]
    fn corrupt_file_is_moved_aside() {
        let (_dir, path) = temp_store_path();
        fs::write(&path, "{ not json").unwrap();

        let store = Store::load(path.clone()).unwrap();
        assert!(store.tasks().is_empty());
        assert!(path.with_extension("json.corrupt").exists());
    }

    #[test]
    fn first_save_creates_missing_folders_and_leaves_no_temp_file() {
        let (dir, _) = temp_store_path();
        let path = dir.path().join("nested").join("tasks.json");
        let mut store = Store::load(path.clone()).unwrap();
        store
            .mutate(|tasks| {
                tasks.push(new_task("a"));
                Ok(())
            })
            .unwrap();

        assert!(path.exists());
        assert!(!path.with_extension("json.tmp").exists());
    }

    #[test]
    fn save_file_has_a_version() {
        let (_dir, path) = temp_store_path();
        let mut store = Store::load(path.clone()).unwrap();
        store.mutate(|_| Ok(())).unwrap();

        let file: serde_json::Value = serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap();
        assert_eq!(file["version"], FORMAT_VERSION);
        assert_eq!(file["tasks"], serde_json::json!([]));
    }
}
