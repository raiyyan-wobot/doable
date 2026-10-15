//! Combining imported tasks with the existing list.

use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::Task;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")] // JSON: "merge" | "replace"
pub enum ImportMode {
    /// Add new tasks. For a task with the same id, keep whichever copy was updated last.
    Merge,
    /// Throw away current tasks and use the file's tasks.
    Replace,
}

/// Returned to the frontend so it can show "Imported 5, updated 2, skipped 1".
#[derive(Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSummary {
    pub added: usize,
    pub updated: usize,
    /// Invalid rows, plus rows older than the copy we already have.
    pub skipped: usize,
}

/// Merge `incoming` into `existing` in place.
pub fn merge(existing: &mut Vec<Task>, incoming: Vec<Task>, mode: ImportMode) -> ImportSummary {
    let mut summary = ImportSummary::default();

    if mode == ImportMode::Replace {
        existing.clear();
    }

    // Index existing tasks by id → position, for O(1) lookups instead of
    // scanning the whole Vec for every imported task.
    let mut index: HashMap<Uuid, usize> =
        existing.iter().enumerate().map(|(i, t)| (t.id, i)).collect();

    for task in incoming {
        match index.get(&task.id) {
            // Same id already exists: newer `updated_at` wins.
            Some(&i) => {
                if task.updated_at > existing[i].updated_at {
                    existing[i] = task;
                    summary.updated += 1;
                } else {
                    summary.skipped += 1;
                }
            }
            None => {
                index.insert(task.id, existing.len());
                existing.push(task);
                summary.added += 1;
            }
        }
    }
    summary
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::transfer::sample_task;

    #[test]
    fn newer_copy_wins_and_older_is_skipped() {
        let original = sample_task("original");
        let mut newer = original.clone();
        newer.title = "edited".into();
        newer.updated_at = original.updated_at + chrono::Duration::seconds(5);

        let mut existing = vec![original.clone()];
        let incoming = vec![newer, sample_task("brand new")];
        let summary = merge(&mut existing, incoming, ImportMode::Merge);
        assert_eq!(summary, ImportSummary { added: 1, updated: 1, skipped: 0 });
        assert_eq!(existing[0].title, "edited");

        // Importing the older copy again changes nothing.
        let summary = merge(&mut existing, vec![original], ImportMode::Merge);
        assert_eq!(summary, ImportSummary { added: 0, updated: 0, skipped: 1 });
    }

    #[test]
    fn duplicate_ids_inside_one_file_are_not_added_twice() {
        let task = sample_task("dup");
        let mut existing = vec![];
        let summary = merge(&mut existing, vec![task.clone(), task], ImportMode::Merge);
        assert_eq!(summary, ImportSummary { added: 1, updated: 0, skipped: 1 });
    }

    #[test]
    fn replace_drops_existing() {
        let mut existing = vec![sample_task("old")];
        let summary = merge(&mut existing, vec![sample_task("new")], ImportMode::Replace);
        assert_eq!(summary.added, 1);
        assert_eq!(existing.len(), 1);
        assert_eq!(existing[0].title, "new");
    }
}
