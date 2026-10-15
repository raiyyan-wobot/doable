//! Counts and the tag list shown in the sidebar.

use std::collections::BTreeSet;

use chrono::NaiveDate;
use serde::Serialize;

use super::filter::is_overdue;
use crate::domain::Task;

/// Always computed over *all* tasks, not the filtered list.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Stats {
    pub total: usize,
    pub active: usize,
    pub completed: usize,
    pub overdue: usize,
    pub due_today: usize,
}

pub fn stats(tasks: &[Task], today: NaiveDate) -> Stats {
    // `fold` is `reduce` with an initial value. `Stats::default()` is all zeros.
    tasks.iter().fold(Stats::default(), |mut s, t| {
        s.total += 1;
        if t.completed {
            s.completed += 1;
        } else {
            s.active += 1;
            if t.due_date == Some(today) {
                s.due_today += 1;
            }
        }
        if is_overdue(t, today) {
            s.overdue += 1;
        }
        s
    })
}

/// Every distinct tag in use, sorted, for the tag list.
pub fn all_tags(tasks: &[Task]) -> Vec<String> {
    // BTreeSet keeps items sorted and unique.
    let set: BTreeSet<&str> = tasks
        .iter()
        .flat_map(|t| t.tags.iter().map(String::as_str))
        .collect();
    set.into_iter().map(String::from).collect()
}

#[cfg(test)]
mod tests {
    use super::super::fixtures::{sample, task, today};
    use super::*;
    use crate::domain::Priority;

    #[test]
    fn counts() {
        assert_eq!(
            stats(&sample(), today()),
            Stats { total: 6, active: 5, completed: 1, overdue: 1, due_today: 1 }
        );
    }

    #[test]
    fn empty_list_is_all_zeros() {
        assert_eq!(stats(&[], today()), Stats::default());
    }

    #[test]
    fn tags_are_unique_and_sorted() {
        let mut a = task("a", None, Priority::Low, 1);
        a.tags = vec!["work".into(), "home".into()];
        let mut b = task("b", None, Priority::Low, 2);
        b.tags = vec!["home".into(), "errands".into()];
        assert_eq!(all_tags(&[a, b]), vec!["errands", "home", "work"]);
    }
}
