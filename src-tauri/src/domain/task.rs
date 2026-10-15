//! The `Task` entity: what a task *is*, plus its validation rules.
//!
//! These structs are serialized to JSON in two places:
//!   1. the save file on disk (`tasks.json`)
//!   2. the IPC boundary, as values returned to the frontend by `invoke()`
//!
//! `#[serde(rename_all = "camelCase")]` turns Rust's `due_date` into
//! `dueDate` in JSON, so TypeScript code keeps its usual naming.

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::{AppError, AppResult};

const MAX_TITLE_LEN: usize = 200;

/// Derives explained:
/// - `Clone, Copy`: the enum is tiny, so copying it is as cheap as passing an int.
/// - `PartialEq, Eq`: allows `==`.
/// - `PartialOrd, Ord`: allows `<` and sorting. Derived ordering follows the
///   declaration order, so `Low < Medium < High`. The sort code relies on it.
/// - `Default` + `#[default]`: `Priority::default()` returns `Medium`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")] // JSON: "low" | "medium" | "high"
pub enum Priority {
    Low,
    #[default]
    Medium,
    High,
}

/// A stored task.
///
/// `#[serde(default)]` on a field means "if the field is missing in the JSON,
/// use `Default::default()`". It lets us load older save files or hand-written
/// import files that omit optional fields.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: Uuid,
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub completed: bool,
    #[serde(default)]
    pub priority: Priority,
    /// Date only, no time: "2026-10-15". `Option` because tasks may have no due date.
    /// In JSON it's either a string or `null`.
    #[serde(default)]
    pub due_date: Option<NaiveDate>,
    #[serde(default)]
    pub tags: Vec<String>,
    /// Timestamps are stored in UTC. The frontend converts them to local time for display.
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(default)]
    pub completed_at: Option<DateTime<Utc>>,
}

/// What the frontend sends to create or edit a task: only the user-editable fields.
/// The backend owns `id`, timestamps and `completed`, so the client cannot fake them.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskInput {
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub priority: Priority,
    #[serde(default)]
    pub due_date: Option<NaiveDate>,
    #[serde(default)]
    pub tags: Vec<String>,
}

impl Task {
    /// Build a brand-new task from user input.
    /// Returns `Err` if the input is invalid (for example an empty title).
    pub fn new(input: TaskInput) -> AppResult<Task> {
        let now = Utc::now();
        Ok(Task {
            id: Uuid::new_v4(),
            title: normalize_title(&input.title)?, // `?` returns early on Err
            description: input.description.trim().to_string(),
            completed: false,
            priority: input.priority,
            due_date: input.due_date,
            tags: normalize_tags(input.tags),
            created_at: now,
            updated_at: now,
            completed_at: None,
        })
    }

    /// Overwrite the editable fields from user input.
    /// `&mut self` means we modify this task in place; nothing is copied.
    pub fn apply(&mut self, input: TaskInput) -> AppResult<()> {
        // Validate before changing anything, so a bad input leaves the task untouched.
        let title = normalize_title(&input.title)?;
        self.title = title;
        self.description = input.description.trim().to_string();
        self.priority = input.priority;
        self.due_date = input.due_date;
        self.tags = normalize_tags(input.tags);
        self.updated_at = Utc::now();
        Ok(())
    }

    pub fn set_completed(&mut self, completed: bool) {
        // Early return: toggling to the same state should not bump timestamps.
        if self.completed == completed {
            return;
        }
        self.completed = completed;
        self.completed_at = completed.then(Utc::now); // bool::then -> Some(..) if true, else None
        self.updated_at = Utc::now();
    }

    /// Clean up a task that came from an import file, which we don't trust.
    /// Consumes `self` and returns a fixed-up version (a common Rust "builder-ish" style).
    pub fn sanitized(mut self) -> AppResult<Task> {
        self.title = normalize_title(&self.title)?;
        self.description = self.description.trim().to_string();
        self.tags = normalize_tags(self.tags);
        // Keep the completed flag and completed_at consistent.
        match (self.completed, self.completed_at) {
            (true, None) => self.completed_at = Some(self.updated_at),
            (false, Some(_)) => self.completed_at = None,
            _ => {}
        }
        Ok(self)
    }
}

/// `&str` is a borrowed string slice: we only read it, then return a new owned `String`.
fn normalize_title(raw: &str) -> AppResult<String> {
    let title = raw.trim();
    if title.is_empty() {
        return Err(AppError::Validation("title cannot be empty".into()));
    }
    // `.chars().count()` counts characters; `.len()` would count bytes (wrong for emoji/Hindi/etc).
    if title.chars().count() > MAX_TITLE_LEN {
        return Err(AppError::Validation(format!(
            "title is longer than {MAX_TITLE_LEN} characters"
        )));
    }
    Ok(title.to_string())
}

/// Trim, lowercase, drop empties, de-duplicate and sort, so "Work", " work " and
/// "work" all become one tag.
/// Takes `Vec<String>` by value (ownership moves in) because we consume it.
fn normalize_tags(tags: Vec<String>) -> Vec<String> {
    let mut out: Vec<String> = tags
        .into_iter() // iterator that yields owned Strings
        .map(|t| t.trim().to_lowercase())
        .filter(|t| !t.is_empty())
        .collect();
    out.sort();
    out.dedup(); // removes *consecutive* duplicates, which is why we sort first
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input(title: &str) -> TaskInput {
        TaskInput {
            title: title.into(),
            description: String::new(),
            priority: Priority::High,
            due_date: None,
            tags: vec![" Work ".into(), "work".into(), "".into(), "Home".into()],
        }
    }

    #[test]
    fn new_task_trims_title_and_normalizes_tags() {
        let task = Task::new(input("  Buy milk  ")).unwrap();
        assert_eq!(task.title, "Buy milk");
        assert_eq!(task.tags, vec!["home", "work"]);
    }

    #[test]
    fn empty_title_is_rejected() {
        let err = Task::new(input("   ")).unwrap_err();
        assert_eq!(err.to_string(), "title cannot be empty");
    }

    #[test]
    fn completing_sets_and_clears_completed_at() {
        let mut task = Task::new(input("x")).unwrap();
        task.set_completed(true);
        assert!(task.completed_at.is_some());
        task.set_completed(false);
        assert_eq!(task.completed_at, None);
    }
}
