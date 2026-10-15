//! Which tasks match a query.

use chrono::{Datelike, Duration, NaiveDate};

use super::{DueFilter, StatusFilter, TaskQuery};
use crate::domain::Task;

impl TaskQuery {
    /// True if `task` passes every active filter.
    pub(super) fn matches(&self, task: &Task, today: NaiveDate) -> bool {
        self.status.matches(task)
            && self.matches_priority(task)
            && self.matches_tag(task)
            && self.matches_search(task)
            && self.due.matches(task, today)
    }

    fn matches_priority(&self, task: &Task) -> bool {
        // `Option<Priority>`: None means "don't filter by priority".
        self.priority.is_none_or(|p| task.priority == p)
    }

    fn matches_tag(&self, task: &Task) -> bool {
        // `.as_deref()` turns `&Option<String>` into `Option<&str>` for easy comparison.
        self.tag
            .as_deref()
            .is_none_or(|tag| task.tags.iter().any(|t| t == tag))
    }

    fn matches_search(&self, task: &Task) -> bool {
        match self.search.as_deref().map(str::trim) {
            None | Some("") => true,
            Some(needle) => {
                let needle = needle.to_lowercase();
                task.title.to_lowercase().contains(&needle)
                    || task.description.to_lowercase().contains(&needle)
                    || task.tags.iter().any(|t| t.contains(&needle))
            }
        }
    }
}

impl StatusFilter {
    fn matches(self, task: &Task) -> bool {
        match self {
            StatusFilter::All => true,
            StatusFilter::Active => !task.completed,
            StatusFilter::Completed => task.completed,
        }
    }
}

impl DueFilter {
    /// Does a task pass this due-date filter?
    /// `match` must handle every variant: add a new variant and the compiler
    /// points you at every place that needs updating.
    fn matches(&self, task: &Task, today: NaiveDate) -> bool {
        match self {
            DueFilter::Any => true,
            DueFilter::NoDate => task.due_date.is_none(),
            DueFilter::Overdue => is_overdue(task, today),
            DueFilter::Today => task.due_date == Some(today),
            DueFilter::ThisWeek => {
                // `weekday().num_days_from_monday()`: Mon = 0 ... Sun = 6
                let monday = today - Duration::days(today.weekday().num_days_from_monday() as i64);
                let sunday = monday + Duration::days(6);
                // `is_some_and` = "is Some AND the closure returns true".
                task.due_date.is_some_and(|d| d >= monday && d <= sunday)
            }
            DueFilter::Range { from, to } => match task.due_date {
                // A task without a due date can't be inside a date range.
                None => false,
                // `map_or(true, ..)`: an open end (`None`) always passes.
                Some(d) => from.map_or(true, |f| d >= f) && to.map_or(true, |t| d <= t),
            },
        }
    }
}

/// Not done and due before today. Shared with `stats`.
pub(super) fn is_overdue(task: &Task, today: NaiveDate) -> bool {
    !task.completed && task.due_date.is_some_and(|d| d < today)
}

#[cfg(test)]
mod tests {
    use super::super::fixtures::{date, sample, task, today};
    use super::super::{SortBy, SortDir, run};
    use super::*;
    use crate::domain::Priority;

    /// Run with only a due filter, sorted by title for stable assertions.
    fn titles_for(due: DueFilter) -> Vec<String> {
        let q = TaskQuery { due, sort_by: SortBy::Title, sort_dir: SortDir::Asc, ..Default::default() };
        run(&sample(), &q, today()).into_iter().map(|t| t.title).collect()
    }

    #[test]
    fn overdue_excludes_completed_tasks() {
        assert_eq!(titles_for(DueFilter::Overdue), vec!["late"]);
    }

    #[test]
    fn this_week_is_monday_to_sunday() {
        // today() is Thursday 15 Oct → week is Mon 12 .. Sun 18.
        assert_eq!(titles_for(DueFilter::ThisWeek), vec!["done-yesterday", "sunday", "today"]);
    }

    #[test]
    fn range_is_inclusive_and_ends_may_be_open() {
        let from_15 = DueFilter::Range { from: Some(date(15)), to: None };
        assert_eq!(titles_for(from_15), vec!["next-week", "sunday", "today"]);

        let until_14 = DueFilter::Range { from: None, to: Some(date(14)) };
        assert_eq!(titles_for(until_14), vec!["done-yesterday", "late"]);
    }

    #[test]
    fn no_date_and_today() {
        assert_eq!(titles_for(DueFilter::NoDate), vec!["someday"]);
        assert_eq!(titles_for(DueFilter::Today), vec!["today"]);
    }

    #[test]
    fn search_is_case_insensitive_over_title_description_and_tags() {
        let mut t = task("Buy milk", None, Priority::Low, 1);
        t.description = "From the Corner shop".into();
        t.tags = vec!["errands".into()];
        let q = |s: &str| TaskQuery { search: Some(s.into()), ..Default::default() };

        assert!(q("MILK").matches(&t, today()));
        assert!(q("corner").matches(&t, today()));
        assert!(q("errand").matches(&t, today()));
        assert!(q("   ").matches(&t, today())); // blank search = no filter
        assert!(!q("bread").matches(&t, today()));
    }

    #[test]
    fn priority_tag_and_status_filters() {
        let mut t = task("x", None, Priority::High, 1);
        t.tags = vec!["work".into()];

        let by_priority = |p| TaskQuery { priority: Some(p), ..Default::default() };
        assert!(by_priority(Priority::High).matches(&t, today()));
        assert!(!by_priority(Priority::Low).matches(&t, today()));

        let by_tag = |tag: &str| TaskQuery { tag: Some(tag.into()), ..Default::default() };
        assert!(by_tag("work").matches(&t, today()));
        assert!(!by_tag("wor").matches(&t, today())); // exact match, not substring

        let by_status = |status| TaskQuery { status, ..Default::default() };
        assert!(by_status(StatusFilter::Active).matches(&t, today()));
        assert!(!by_status(StatusFilter::Completed).matches(&t, today()));
    }
}
