//! Build script: Tauri's codegen, plus Windows manifest handling.
//!
//! By default tauri-build embeds the Windows app manifest into the app binary
//! only. Test binaries then lack Common Controls v6 and crash on start
//! (STATUS_ENTRYPOINT_NOT_FOUND). So on Windows we turn that off and embed
//! the manifest ourselves via linker arguments, which apply to every binary,
//! tests included. (Tauri docs: Develop › Tests.)

fn main() {
    let windows_msvc = std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows")
        && std::env::var("CARGO_CFG_TARGET_ENV").as_deref() == Ok("msvc");

    let mut attributes = tauri_build::Attributes::new();
    if windows_msvc {
        attributes = attributes.windows_attributes(
            tauri_build::WindowsAttributes::new_without_app_manifest()
                // `new_without_app_manifest` also clears the exe icon; set it back.
                .window_icon_path("icons/icon.ico"),
        );
        let manifest = std::env::current_dir()
            .expect("build script has a working directory")
            .join("windows-app-manifest.xml");
        println!("cargo:rerun-if-changed=windows-app-manifest.xml");
        println!("cargo:rustc-link-arg=/MANIFEST:EMBED");
        println!("cargo:rustc-link-arg=/MANIFESTINPUT:{}", manifest.display());
        // Treat linker warnings as errors, so a manifest problem fails the build.
        println!("cargo:rustc-link-arg=/WX");
    }
    tauri_build::try_build(attributes).expect("failed to run tauri-build");
}
