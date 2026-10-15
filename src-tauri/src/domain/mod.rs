//! Domain layer: the business rules of the app.
//!
//! Nothing in here knows about Tauri, files or the UI. That keeps it easy to
//! test (plain `cargo test`) and easy to reuse if you ever add a CLI or sync server.
//!
//! - `task`  → the `Task` entity and its validation rules
//! - `query` → filtering, sorting and stats over a list of tasks

pub mod query;
pub mod task;

// Re-exports: other modules can write `use crate::domain::Task` instead of
// `use crate::domain::task::Task`. The folder layout stays an internal detail.
pub use task::{Priority, Task, TaskInput};
