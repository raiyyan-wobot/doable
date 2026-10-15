//! CSV import/export, for spreadsheets.
//!
//! CSV is flat, so a `Task` maps to a `CsvRow` where `tags` is one
//! `"work;home"` string. On import, `id` and the timestamps are optional, so a
//! sheet someone typed by hand (just title, dueDate, ...) still imports.

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::{Priority, Task};
use crate::error::AppResult;

const TAG_SEPARATOR: &str = ";";

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CsvRow {
    #[serde(default)]
    id: Option<Uuid>,
    title: String,
    #[serde(default)]
    description: String,
    #[serde(default)]
    completed: bool,
    #[serde(default)]
    priority: Priority,
    #[serde(default)]
    due_date: Option<NaiveDate>,
    #[serde(default)]
    tags: String,
    #[serde(default)]
    created_at: Option<DateTime<Utc>>,
    #[serde(default)]
    updated_at: Option<DateTime<Utc>>,
    #[serde(default)]
    completed_at: Option<DateTime<Utc>>,
}

// `From` is Rust's standard conversion trait. Implementing it lets us write
// `CsvRow::from(&task)` and `Task::from(row)` (or `.into()`).
impl From<&Task> for CsvRow {
    fn from(t: &Task) -> Self {
        CsvRow {
            id: Some(t.id),
            title: t.title.clone(),
            description: t.description.clone(),
            completed: t.completed,
            priority: t.priority,
            due_date: t.due_date,
            tags: t.tags.join(TAG_SEPARATOR),
            created_at: Some(t.created_at),
            updated_at: Some(t.updated_at),
            completed_at: t.completed_at,
        }
    }
}

impl From<CsvRow> for Task {
    fn from(r: CsvRow) -> Self {
        let created_at = r.created_at.unwrap_or_else(Utc::now);
        Task {
            // A missing id gets a fresh one, so the row imports as a new task.
            id: r.id.unwrap_or_else(Uuid::new_v4),
            title: r.title,
            description: r.description,
            completed: r.completed,
            priority: r.priority,
            due_date: r.due_date,
            tags: r.tags.split(TAG_SEPARATOR).map(String::from).collect(),
            created_at,
            updated_at: r.updated_at.unwrap_or(created_at),
            completed_at: r.completed_at,
        }
    }
}

pub fn encode(tasks: &[Task]) -> AppResult<String> {
    // Write into an in-memory buffer (`Vec<u8>`) instead of a file.
    let mut writer = csv::Writer::from_writer(Vec::new());
    for task in tasks {
        writer.serialize(CsvRow::from(task))?; // the header row is written automatically
    }
    let bytes = writer.into_inner().map_err(|e| e.into_error())?;
    // Everything written came from Rust `String`s, which are always valid UTF-8.
    Ok(String::from_utf8(bytes).expect("csv output is valid UTF-8"))
}

pub fn decode(content: &str) -> AppResult<Vec<Task>> {
    let mut reader = csv::Reader::from_reader(content.as_bytes());
    // `collect::<Result<Vec<_>, _>>()` stops at the first error and returns it,
    // otherwise it gives the full Vec. A structurally broken CSV is a hard error.
    let rows: Vec<CsvRow> = reader.deserialize().collect::<Result<_, _>>()?;
    Ok(rows.into_iter().map(Task::from).collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::transfer::sample_task;

    #[test]
    fn round_trip() {
        // `sample_task` has a comma in its description, which exercises CSV quoting.
        let tasks = vec![sample_task("a"), sample_task("b")];
        assert_eq!(decode(&encode(&tasks).unwrap()).unwrap(), tasks);
    }

    #[test]
    fn hand_written_csv_with_only_some_columns() {
        let csv = "title,priority,dueDate,tags\nPay rent,high,2026-11-01,home;Money\n";
        let tasks = decode(csv).unwrap();
        assert_eq!(tasks[0].title, "Pay rent");
        assert_eq!(tasks[0].priority, Priority::High);
        assert_eq!(tasks[0].due_date, NaiveDate::from_ymd_opt(2026, 11, 1));
        // Not normalized yet: that happens in `transfer::parse` via `Task::sanitized`.
        assert_eq!(tasks[0].tags, vec!["home", "Money"]);
    }
}
