//! The OS accent color. The frontend generates its whole Material 3 color
//! scheme from it.
//!
//! The webview can't see the accent color (CSS has no portable way to read
//! it), so Rust asks the OS directly. One backend per platform, chosen at
//! compile time with `#[cfg(...)]`:
//!
//! - `linux.rs`   → XDG desktop portal (GNOME 47+, KDE Plasma 6, ...), with live updates
//! - `windows.rs` → WinRT `UISettings`
//! - `macos.rs`   → AppKit `NSColor.controlAccentColor`
//!
//! Every backend returns `None` when the OS has no accent set; the frontend
//! then falls back to the Material baseline color.

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "macos")]
mod macos;
#[cfg(windows)]
mod windows;

use tauri::{AppHandle, Runtime};

/// Event emitted to the frontend when the accent changes. Payload: `"#rrggbb"`.
/// Only emitted on Linux (see `watch`), but it's part of the frontend contract.
#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
pub const CHANGED_EVENT: &str = "accent-color-changed";

/// An 8-bit sRGB color.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Rgb {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

impl Rgb {
    /// Build from 0.0–1.0 channels, the way most OS APIs report colors.
    /// Returns `None` if any channel is out of range: the XDG portal spec uses
    /// out-of-range values to mean "no accent color set".
    /// (Windows reports 8-bit channels directly, so it doesn't need this.)
    #[cfg_attr(windows, allow(dead_code))]
    pub fn from_unit(r: f64, g: f64, b: f64) -> Option<Rgb> {
        let channel = |v: f64| (0.0..=1.0).contains(&v).then(|| (v * 255.0).round() as u8);
        Some(Rgb { r: channel(r)?, g: channel(g)?, b: channel(b)? })
    }

    /// CSS hex notation, e.g. `#3584e4`.
    pub fn to_hex(self) -> String {
        format!("#{:02x}{:02x}{:02x}", self.r, self.g, self.b)
    }
}

/// Read the current accent color, if the platform has one.
pub async fn read() -> Option<Rgb> {
    #[cfg(target_os = "linux")]
    return linux::read().await;

    #[cfg(windows)]
    return windows::read();

    #[cfg(target_os = "macos")]
    return macos::read();

    #[allow(unreachable_code)]
    None
}

/// Start pushing accent changes to the frontend as `CHANGED_EVENT`.
///
/// Only Linux has a cheap change signal (the portal's `SettingChanged`). On
/// Windows and macOS the frontend re-reads the accent when the window regains
/// focus, which covers "changed it in System Settings, came back to the app".
pub fn watch<R: Runtime>(app: AppHandle<R>) {
    #[cfg(target_os = "linux")]
    tauri::async_runtime::spawn(linux::watch(app));

    #[cfg(not(target_os = "linux"))]
    let _ = app;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_unit_channels_to_hex() {
        // GNOME's default blue, as the portal reports it.
        let rgb = Rgb::from_unit(0.207843, 0.517647, 0.894118).unwrap();
        assert_eq!(rgb, Rgb { r: 0x35, g: 0x84, b: 0xe4 });
        assert_eq!(rgb.to_hex(), "#3584e4");
    }

    #[test]
    fn out_of_range_means_unset() {
        assert_eq!(Rgb::from_unit(-1.0, 0.5, 0.5), None);
        assert_eq!(Rgb::from_unit(0.5, 1.5, 0.5), None);
    }

    #[test]
    fn edges_are_inclusive() {
        assert_eq!(Rgb::from_unit(0.0, 1.0, 0.0).unwrap().to_hex(), "#00ff00");
    }
}
