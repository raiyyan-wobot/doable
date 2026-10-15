//! How matching tasks are ordered.

use std::cmp::Ordering;

use super::{SortBy, SortDir};
use crate::domain::Task;

impl SortDir {
    /// Flip an ordering for descending sorts.
    fn apply(self, ord: Ordering) -> Ordering {
        match self {
            SortDir::Asc => ord,
            SortDir::Desc => ord.reverse(),
        }
    }
}

/// Comparator for `sort_by`.
pub(super) fn compare(a: &Task, b: &Task, by: SortBy, dir: SortDir) -> Ordering {
    let primary = match by {
        // Tasks without a due date always go last, whatever the direction,
        // so we only apply `dir` when both dates exist.
        SortBy::DueDate => match (a.due_date, b.due_date) {
            (Some(x), Some(y)) => dir.apply(x.cmp(&y)),
            (Some(_), None) => Ordering::Less,
            (None, Some(_)) => Ordering::Greater,
            (None, None) => Ordering::Equal,
        },
        SortBy::Priority => dir.apply(a.priority.cmp(&b.priority)), // uses the derived Ord
        SortBy::Title => dir.apply(a.title.to_lowercase().cmp(&b.title.to_lowercase())),
        SortBy::CreatedAt => dir.apply(a.created_at.cmp(&b.created_at)),
        SortBy::UpdatedAt => dir.apply(a.updated_at.cmp(&b.updated_at)),
    };
    // Tie-breaker so the order is deterministic: newest first.
    primary.then_with(|| b.created_at.cmp(&a.created_at))
}

#[cfg(test)]
mod tests {
    use super::super::fixtures::{sample, titles, today};
    use super::super::{TaskQuery, run};
    use super::*;

    fn sorted(sort_by: SortBy, sort_dir: SortDir) -> Vec<crate::domain::Task> {
        run(&sample(), &TaskQuery { sort_by, sort_dir, ..Default::default() }, today())
    }

    #[test]
    fn due_date_sort_puts_undated_last_in_both_directions() {
        for dir in [SortDir::Asc, SortDir::Desc] {
            assert_eq!(sorted(SortBy::DueDate, dir).last().unwrap().title, "someday");
        }
    }

    #[test]
    fn due_date_ascending() {
        assert_eq!(
            titles(&sorted(SortBy::DueDate, SortDir::Asc)),
            vec!["late", "done-yesterday", "today", "sunday", "next-week", "someday"]
        );
    }

    #[test]
    fn priority_desc_then_newest_first() {
        assert_eq!(
            titles(&sorted(SortBy::Priority, SortDir::Desc)),
            vec!["next-week", "late", "someday", "today", "sunday", "done-yesterday"]
        );
    }

    #[test]
    fn title_sort_ignores_case() {
        let out = sorted(SortBy::Title, SortDir::Asc);
        assert_eq!(out.first().unwrap().title, "done-yesterday");
        assert_eq!(out.last().unwrap().title, "today");
    }

    #[test]
    fn created_at_default_is_newest_first() {
        assert_eq!(sorted(SortBy::CreatedAt, SortDir::Desc)[0].title, "someday");
    }
}
