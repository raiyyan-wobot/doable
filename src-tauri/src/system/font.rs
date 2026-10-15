//! The desktop's UI font size, so the app's text matches the rest of the system.
//!
//! Linux: read through the XDG desktop portal (the same channel as the accent
//! color): `org.gnome.desktop.interface font-name` (e.g. "Geist 11") and
//! `text-scaling-factor` (GNOME's "Large Text" setting). Other platforms
//! return `None` and the frontend keeps its default size.

// The parsing helpers are only called on Linux (and in tests).
/// CSS pixels per typographic point (96 dpi / 72 pt per inch).
#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
const PX_PER_PT: f64 = 96.0 / 72.0;

/// The point size at the end of a Pango font description:
/// "Geist 11" → 11, "Cantarell Bold 10.5" → 10.5, "Sans" → None.
#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
pub fn parse_font_size_pt(font_name: &str) -> Option<f64> {
    let size: f64 = font_name.split_whitespace().last()?.parse().ok()?;
    (size > 0.0).then_some(size)
}

/// Font size in pt × scaling factor → CSS pixels.
#[cfg_attr(not(target_os = "linux"), allow(dead_code))]
pub fn to_css_px(points: f64, scaling_factor: f64) -> f64 {
    points * PX_PER_PT * scaling_factor
}

/// The UI font size in CSS pixels, if the platform reports one.
pub async fn read_ui_font_px() -> Option<f64> {
    #[cfg(target_os = "linux")]
    {
        use ashpd::desktop::settings::Settings;
        const NAMESPACE: &str = "org.gnome.desktop.interface";

        let settings = Settings::new().await.ok()?;
        let font_name: String = settings.read(NAMESPACE, "font-name").await.ok()?;
        let scaling: f64 = settings.read(NAMESPACE, "text-scaling-factor").await.unwrap_or(1.0);
        parse_font_size_pt(&font_name).map(|pt| to_css_px(pt, scaling))
    }

    #[cfg(not(target_os = "linux"))]
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_the_trailing_size() {
        assert_eq!(parse_font_size_pt("Geist 11"), Some(11.0));
        assert_eq!(parse_font_size_pt("Cantarell Bold 10.5"), Some(10.5));
        assert_eq!(parse_font_size_pt("Sans"), None);
        assert_eq!(parse_font_size_pt(""), None);
        assert_eq!(parse_font_size_pt("Broken 0"), None);
    }

    #[test]
    fn converts_points_to_css_pixels_with_scaling() {
        assert!((to_css_px(11.0, 1.0) - 14.6667).abs() < 0.001);
        assert!((to_css_px(11.0, 1.25) - 18.3333).abs() < 0.001); // GNOME "Large Text"
    }
}
