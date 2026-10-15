//! Querying tasks: the query types the frontend sends, plus filtering, sorting
//! and stats over a task list.
//!
//! - `mod.rs`   → the query types, and `run` (filter, then sort)
//! - `filter`   → which tasks match a query
//! - `sort`     → how matching tasks are ordered
//! - `stats`    → counts and tag list for the sidebar
//!
//! Everything here is a *pure function*: data in, data out, no disk or Tauri.
//! "Today" is passed in as a parameter instead of read from the clock inside,
//! which is what makes these functions easy to unit test.

mod filter;
mod sort;
mod stats;

#[cfg(test)]
mod fixtures;

use chrono::NaiveDate;
use serde::Deserialize;

use super::task::{Priority, Task};

pub use stats::{Stats, all_tags, stats};

/// The filter + sort options the frontend sends with `list_tasks`.
/// Every field has a default, so the frontend can send `{}` and get
/// "all tasks, default sort".
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)] // `default` here = all fields default
pub struct TaskQuery {
    /// Case-insensitive text search over title, description and tags.
    pub search: Option<String>,
    pub status: StatusFilter,
    pub priority: Option<Priority>,
    pub tag: Option<String>,
    pub due: DueFilter,
    pub sort_by: SortBy,
    pub sort_dir: SortDir,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum StatusFilter {
    #[default]
    All,
    Active,
    Completed,
}

/// Rust enums can carry data per variant (`Range` has `from` and `to`).
/// TypeScript has no direct equivalent, so we choose a JSON shape:
/// `#[serde(tag = "kind")]` produces an "internally tagged" object:
///
/// ```json
/// { "kind": "any" }
/// { "kind": "overdue" }
/// { "kind": "range", "from": "2026-10-01", "to": "2026-10-31" }
/// ```
///
/// On the TS side this maps to a discriminated union on `kind`.
#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum DueFilter {
    #[default]
    Any,
    /// Due before today and not done yet.
    Overdue,
    Today,
    /// Monday to Sunday of the current week.
    ThisWeek,
    /// Tasks with no due date.
    NoDate,
    /// Inclusive range. Either end may be open (`null`), e.g. "everything after X".
    Range {
        from: Option<NaiveDate>,
        to: Option<NaiveDate>,
    },
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SortBy {
    #[default]
    CreatedAt,
    UpdatedAt,
    DueDate,
    Priority,
    Title,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SortDir {
    Asc,
    #[default]
    Desc,
}

/// Filter + sort. Takes a slice (`&[Task]`, a borrowed view of the store's Vec)
/// and returns a new owned Vec, cloning only the tasks that matched.
pub fn run(tasks: &[Task], query: &TaskQuery, today: NaiveDate) -> Vec<Task> {
    let mut out: Vec<Task> = tasks
        .iter()
        .filter(|t| query.matches(t, today)) // filter.rs
        .cloned()
        .collect();

    // `sort_by` takes a comparator closure returning `Ordering` (Less/Equal/Greater),
    // like JS's `arr.sort((a, b) => ...)` but with an enum instead of a number.
    // It's a stable sort, so equal elements keep their relative order.
    out.sort_by(|a, b| sort::compare(a, b, query.sort_by, query.sort_dir));
    out
}

#[cfg(test)]
mod tests {
    use super::fixtures::{date, sample, titles, today};
    use super::*;

    #[test]
    fn query_json_from_frontend_deserializes() {
        let json = r#"{"status":"active","due":{"kind":"range","from":"2026-10-01","to":null},"sortBy":"dueDate"}"#;
        let q: TaskQuery = serde_json::from_str(json).unwrap();
        assert_eq!(q.status, StatusFilter::Active);
        assert_eq!(q.due, DueFilter::Range { from: Some(date(1)), to: None });
        assert_eq!(q.sort_by, SortBy::DueDate);
        assert_eq!(q.sort_dir, SortDir::Desc); // default
    }

    #[test]
    fn empty_query_returns_everything() {
        let q: TaskQuery = serde_json::from_str("{}").unwrap();
        assert_eq!(run(&sample(), &q, today()).len(), sample().len());
    }

    #[test]
    fn run_filters_then_sorts() {
        let q = TaskQuery {
            status: StatusFilter::Active,
            sort_by: SortBy::Title,
            sort_dir: SortDir::Asc,
            ..Default::default()
        };
        let out = run(&sample(), &q, today());
        assert_eq!(titles(&out), vec!["late", "next-week", "someday", "sunday", "today"]);
    }
}
