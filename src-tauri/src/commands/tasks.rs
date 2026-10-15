//! Task CRUD, listing and stats commands.

use tauri::State;
use uuid::Uuid;

use super::{AppState, lock, today};
use crate::domain::query::{self, Stats, TaskQuery};
use crate::domain::{Task, TaskInput};
use crate::error::{AppError, AppResult};

// ---------- reads ----------

// `#[tauri::command]` generates the glue that turns the JSON args into these
// parameters. `State<'_, AppState>` is injected by Tauri, not sent from JS.
#[tauri::command]
pub fn list_tasks(state: State<'_, AppState>, query: TaskQuery) -> Vec<Task> {
    query::run(lock(&state).tasks(), &query, today())
}

#[tauri::command]
pub fn get_stats(state: State<'_, AppState>) -> Stats {
    query::stats(lock(&state).tasks(), today())
}

#[tauri::command]
pub fn list_tags(state: State<'_, AppState>) -> Vec<String> {
    query::all_tags(lock(&state).tasks())
}

// ---------- writes ----------
// Every write goes through `Store::mutate`, which saves to disk and rolls back
// the in-memory list on any error.

#[tauri::command]
pub fn create_task(state: State<'_, AppState>, input: TaskInput) -> AppResult<Task> {
    // Validate before taking the lock: no reason to block other commands for it.
    let task = Task::new(input)?;
    lock(&state).mutate(|tasks| {
        tasks.push(task.clone());
        Ok(task)
    })
}

/// `id: Uuid`: the JS string is parsed into a Uuid automatically. A malformed id
/// is rejected by Tauri before this code runs.
#[tauri::command]
pub fn update_task(state: State<'_, AppState>, id: Uuid, input: TaskInput) -> AppResult<Task> {
    lock(&state).mutate(|tasks| {
        let task = find(tasks, id)?;
        task.apply(input)?;
        Ok(task.clone())
    })
}

#[tauri::command]
pub fn set_completed(state: State<'_, AppState>, id: Uuid, completed: bool) -> AppResult<Task> {
    lock(&state).mutate(|tasks| {
        let task = find(tasks, id)?;
        task.set_completed(completed);
        Ok(task.clone())
    })
}

#[tauri::command]
pub fn delete_task(state: State<'_, AppState>, id: Uuid) -> AppResult<()> {
    lock(&state).mutate(|tasks| {
        let before = tasks.len();
        tasks.retain(|t| t.id != id); // keep everything except this id
        if tasks.len() == before {
            return Err(AppError::NotFound(id));
        }
        Ok(())
    })
}

/// Returns how many tasks were removed.
#[tauri::command]
pub fn clear_completed(state: State<'_, AppState>) -> AppResult<usize> {
    lock(&state).mutate(|tasks| {
        let before = tasks.len();
        tasks.retain(|t| !t.completed);
        Ok(before - tasks.len())
    })
}

/// Find a task by id, or return a NotFound error.
/// The returned `&mut Task` borrows from `tasks`, which the lifetime elision
/// rules express without us writing `'a` explicitly.
fn find(tasks: &mut [Task], id: Uuid) -> AppResult<&mut Task> {
    tasks.iter_mut().find(|t| t.id == id).ok_or(AppError::NotFound(id))
}
