//! JSON import/export. Exports use the same `{ version, tasks }` shape as the
//! save file, so an export can be imported back with nothing lost.

use serde::Deserialize;

use crate::domain::Task;
use crate::error::AppResult;
use crate::store::{FORMAT_VERSION, SaveFile};

pub fn encode(tasks: &[Task]) -> AppResult<String> {
    let file = SaveFile { version: FORMAT_VERSION, tasks: tasks.to_vec() };
    Ok(serde_json::to_string_pretty(&file)?)
}

/// Accept both our `{ version, tasks }` file and a bare `[ ...tasks ]` array.
/// `#[serde(untagged)]` makes serde try each variant in order until one parses.
#[derive(Deserialize)]
#[serde(untagged)]
enum Incoming {
    File(SaveFile),
    Bare(Vec<Task>),
}

pub fn decode(content: &str) -> AppResult<Vec<Task>> {
    Ok(match serde_json::from_str::<Incoming>(content)? {
        Incoming::File(file) => file.tasks,
        Incoming::Bare(tasks) => tasks,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::transfer::sample_task;

    #[test]
    fn round_trip() {
        let tasks = vec![sample_task("a"), sample_task("b")];
        assert_eq!(decode(&encode(&tasks).unwrap()).unwrap(), tasks);
    }

    #[test]
    fn bare_array_is_accepted() {
        let text = serde_json::to_string(&vec![sample_task("a")]).unwrap();
        assert_eq!(decode(&text).unwrap().len(), 1);
    }

    #[test]
    fn broken_json_is_an_error() {
        assert!(decode("{ nope").is_err());
    }
}
