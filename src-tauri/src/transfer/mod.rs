//! Import / export: converting tasks to and from files, and merging imported
//! tasks into the existing list.
//!
//! No disk or dialog access happens here. `commands::files` does the I/O and
//! passes plain strings in and out, which keeps this module unit-testable.
//!
//! - `json_file` → JSON encode/decode
//! - `csv_file`  → CSV encode/decode (flat rows)
//! - `merge`     → combining imported tasks with existing ones
//!
//! (The submodules are not named `json` / `csv` because `csv` would shadow
//! the `csv` crate inside this module.)

mod csv_file;
mod json_file;
mod merge;

use std::path::Path;

use serde::Deserialize;

use crate::domain::Task;
use crate::error::{AppError, AppResult};

pub use merge::{ImportMode, ImportSummary, merge};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")] // JSON: "json" | "csv"
pub enum FileFormat {
    Json,
    Csv,
}

impl FileFormat {
    pub fn extension(self) -> &'static str {
        match self {
            FileFormat::Json => "json",
            FileFormat::Csv => "csv",
        }
    }

    /// Detect the format from a file's extension (used when importing).
    pub fn from_path(path: &Path) -> AppResult<FileFormat> {
        // Chain of Options: extension() → OsStr → &str → lowercase String.
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .map(str::to_lowercase);
        match ext.as_deref() {
            Some("json") => Ok(FileFormat::Json),
            Some("csv") => Ok(FileFormat::Csv),
            _ => Err(AppError::Validation(
                "only .json and .csv files can be imported".into(),
            )),
        }
    }
}

/// Serialize tasks into the text content of an export file.
pub fn export(tasks: &[Task], format: FileFormat) -> AppResult<String> {
    match format {
        FileFormat::Json => json_file::encode(tasks),
        FileFormat::Csv => csv_file::encode(tasks),
    }
}

/// Parse an import file into tasks.
///
/// A malformed *file* (broken JSON/CSV) is an error. A malformed *task* inside
/// a valid file (e.g. empty title) is dropped and counted instead, so one bad
/// row doesn't block the whole import.
///
/// Returns `(valid tasks, number of dropped rows)`.
pub fn parse(content: &str, format: FileFormat) -> AppResult<(Vec<Task>, usize)> {
    let raw = match format {
        FileFormat::Json => json_file::decode(content)?,
        FileFormat::Csv => csv_file::decode(content)?,
    };

    let total = raw.len();
    // `filter_map` + `.ok()`: keep the Ok values, drop the Errs.
    let valid: Vec<Task> = raw.into_iter().filter_map(|t| t.sanitized().ok()).collect();
    let dropped = total - valid.len();
    Ok((valid, dropped))
}

/// Shared helper for the tests in the submodules.
#[cfg(test)]
pub(crate) fn sample_task(title: &str) -> Task {
    use crate::domain::{Priority, TaskInput};
    Task::new(TaskInput {
        title: title.into(),
        description: "desc, with comma".into(),
        priority: Priority::High,
        due_date: chrono::NaiveDate::from_ymd_opt(2026, 10, 20),
        tags: vec!["work".into(), "urgent".into()],
    })
    .unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rows_with_empty_titles_are_dropped_and_counted() {
        let csv = "title,priority\nPay rent,high\n   ,low\n";
        let (tasks, dropped) = parse(csv, FileFormat::Csv).unwrap();
        assert_eq!(tasks.len(), 1);
        assert_eq!(dropped, 1);
    }

    #[test]
    fn format_from_extension() {
        assert_eq!(FileFormat::from_path(Path::new("a/B.JSON")).unwrap(), FileFormat::Json);
        assert_eq!(FileFormat::from_path(Path::new("x.csv")).unwrap(), FileFormat::Csv);
        assert!(FileFormat::from_path(Path::new("x.txt")).is_err());
    }
}
