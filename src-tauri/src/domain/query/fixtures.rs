//! Shared test data for the query tests. Only compiled for `cargo test`.

use chrono::{NaiveDate, TimeZone, Utc};
use uuid::Uuid;

use crate::domain::{Priority, Task};

/// Thursday 15 October 2026.
pub fn today() -> NaiveDate {
    date(15)
}

/// A day in October 2026.
pub fn date(day: u32) -> NaiveDate {
    NaiveDate::from_ymd_opt(2026, 10, day).unwrap()
}

pub fn task(title: &str, due: Option<NaiveDate>, priority: Priority, created_day: u32) -> Task {
    let created = Utc.with_ymd_and_hms(2026, 10, created_day, 9, 0, 0).unwrap();
    Task {
        id: Uuid::new_v4(),
        title: title.into(),
        description: String::new(),
        completed: false,
        priority,
        due_date: due,
        tags: vec![],
        created_at: created,
        updated_at: created,
        completed_at: None,
    }
}

/// Six tasks covering every due-date bucket relative to `today()`.
pub fn sample() -> Vec<Task> {
    let mut done = task("done-yesterday", Some(date(14)), Priority::Low, 1);
    done.set_completed(true);
    vec![
        task("late", Some(date(10)), Priority::High, 2),
        task("today", Some(today()), Priority::Medium, 3),
        task("sunday", Some(date(18)), Priority::Low, 4),
        task("next-week", Some(date(20)), Priority::High, 5),
        task("someday", None, Priority::Medium, 6),
        done,
    ]
}

pub fn titles(tasks: &[Task]) -> Vec<&str> {
    tasks.iter().map(|t| t.title.as_str()).collect()
}
