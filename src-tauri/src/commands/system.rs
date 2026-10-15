//! OS integration commands.

use crate::system::accent::{self, Rgb};
use crate::system::font;

/// The OS accent color as `"#rrggbb"`, or `None` when the OS has none.
/// Live changes arrive as the `accent-color-changed` event (see `system::accent`).
#[tauri::command]
pub async fn get_accent_color() -> Option<String> {
    accent::read().await.map(Rgb::to_hex)
}

/// The desktop UI font size in CSS pixels (system font size × text scaling),
/// or `None` when the platform doesn't report one.
#[tauri::command]
pub async fn get_system_font_px() -> Option<f64> {
    font::read_ui_font_px().await
}
