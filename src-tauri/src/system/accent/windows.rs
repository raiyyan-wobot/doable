//! Windows: WinRT `UISettings::GetColorValue(UIColorType::Accent)`, the accent
//! chosen in Settings › Personalization › Colors.

use windows::UI::ViewManagement::{UIColorType, UISettings};

use super::Rgb;

pub fn read() -> Option<Rgb> {
    let settings = UISettings::new().ok()?;
    let color = settings.GetColorValue(UIColorType::Accent).ok()?;
    Some(Rgb { r: color.R, g: color.G, b: color.B })
}
