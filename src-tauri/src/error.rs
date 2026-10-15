//! One error type for the whole backend.
//!
//! Every fallible function returns `AppResult<T>` (= `Result<T, AppError>`).
//! The `?` operator converts library errors (io, serde_json, csv) into
//! `AppError` automatically thanks to the `#[from]` attributes below.
//!
//! Tauri requires a command's error type to implement `serde::Serialize`,
//! because the error is sent to JavaScript, where `invoke()` rejects with it.
//! We serialize it as a plain string so the frontend can show it directly.

use serde::{Serialize, Serializer};
use uuid::Uuid;

// `thiserror::Error` derives the `std::error::Error` and `Display` traits for
// us. The `#[error("...")]` text becomes the `Display` output (`to_string()`).
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    // `#[from]` generates `impl From<std::io::Error> for AppError`,
    // which is what lets `?` convert the error for us.
    #[error("file error: {0}")]
    Io(#[from] std::io::Error),

    #[error("invalid JSON: {0}")]
    Json(#[from] serde_json::Error),

    #[error("invalid CSV: {0}")]
    Csv(#[from] csv::Error),

    #[error("task {0} not found")]
    NotFound(Uuid),

    // Bad user input (empty title, unsupported file type, ...).
    #[error("{0}")]
    Validation(String),
}

// Hand-written instead of derived: we want the frontend to receive
// `"task 123 not found"`, not `{ "NotFound": "123" }`.
impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

/// Shorthand used across the crate.
pub type AppResult<T> = Result<T, AppError>;
