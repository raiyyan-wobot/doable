//! macOS: AppKit's `NSColor.controlAccentColor`, the accent chosen in
//! System Settings › Appearance. Converted to sRGB before reading channels,
//! since system colors are stored in a catalog color space.

use objc2_app_kit::{NSColor, NSColorSpace};

use super::Rgb;

pub fn read() -> Option<Rgb> {
    let accent = NSColor::controlAccentColor();
    let srgb = accent.colorUsingColorSpace(&NSColorSpace::sRGBColorSpace())?;
    Rgb::from_unit(srgb.redComponent(), srgb.greenComponent(), srgb.blueComponent())
}
