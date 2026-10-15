//! OS integration that Tauri's plugins don't cover.
//!
//! - `accent` → the user's system accent color, which drives the Material 3 color scheme
//! - `font`   → the desktop's UI font size, so the app's text matches the system

pub mod accent;
pub mod font;
