//! Linux: the XDG desktop portal's `org.freedesktop.appearance accent-color`
//! setting, read over D-Bus with the `ashpd` crate. Supported by GNOME 47+,
//! KDE Plasma 6 and other desktops that ship xdg-desktop-portal.

use futures_util::StreamExt;
use tauri::{AppHandle, Emitter, Runtime};

use super::{CHANGED_EVENT, Rgb};
use ashpd::desktop::settings::Settings;

pub async fn read() -> Option<Rgb> {
    // Any failure (no portal running, old desktop) just means "no accent".
    let settings = Settings::new().await.ok()?;
    let color = settings.accent_color().await.ok()?;
    Rgb::from_unit(color.red(), color.green(), color.blue())
}

/// Forward every accent change to the frontend until the app exits.
pub async fn watch<R: Runtime>(app: AppHandle<R>) {
    // `settings` must outlive `changes`: the stream borrows the D-Bus proxy,
    // so both live in this function for as long as the loop runs.
    let settings = match Settings::new().await {
        Ok(settings) => settings,
        Err(err) => {
            log::info!("accent color portal not available: {err}");
            return;
        }
    };
    let mut changes = match settings.receive_accent_color_changed().await {
        Ok(changes) => changes,
        Err(err) => {
            log::info!("accent color changes not available: {err}");
            return;
        }
    };

    // `StreamExt::next` is the async equivalent of `Iterator::next`.
    while let Some(color) = changes.next().await {
        let hex = Rgb::from_unit(color.red(), color.green(), color.blue()).map(Rgb::to_hex);
        log::info!("system accent color changed: {hex:?}");
        if let Err(err) = app.emit(CHANGED_EVENT, hex) {
            log::warn!("failed to emit {CHANGED_EVENT}: {err}");
        }
    }
}
