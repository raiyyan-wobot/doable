# Installing Doable

Doable runs entirely on your computer. It never needs an internet connection,
and your tasks never leave your machine.

Download the file for your system, then follow the steps for it below.

| System | File |
|---|---|
| Windows 10 / 11 | `Doable_<version>_x64-setup.exe` (recommended) or `Doable_<version>_x64_en-US.msi` |
| macOS 11 or later (Intel and Apple silicon) | `Doable_<version>_universal.dmg` |
| Ubuntu, Debian, Linux Mint, Pop!_OS | `Doable_<version>_amd64.deb` |
| Fedora, openSUSE, RHEL | `Doable-<version>-1.x86_64.rpm` |
| Arch, Manjaro, EndeavourOS, CachyOS | `doable-<version>-1-x86_64.pkg.tar.zst` |
| Any other Linux | `Doable_<version>_amd64.AppImage` |

## Windows

1. Double-click `Doable_<version>_x64-setup.exe`.
2. If Windows shows **"Windows protected your PC"**, select **More info**, then
   **Run anyway**. This appears because the installer isn't code-signed yet; it
   doesn't mean anything is wrong with the file.
3. Follow the installer. It installs for your user account only, so you don't
   need administrator rights.

Doable needs Microsoft Edge WebView2, which is already part of Windows 11 and
up-to-date Windows 10. If it's missing, the installer adds it automatically.
That one step needs an internet connection; Doable itself never does.

**Uninstall:** Settings › Apps › Installed apps › Doable › Uninstall.

## macOS

1. Open `Doable_<version>_universal.dmg`.
2. Drag **Doable** into **Applications**.
3. The first time, open Doable from Applications. If macOS says it **"can't be
   opened"** or **"cannot verify the developer"**:
   1. Open **System Settings › Privacy & Security**.
   2. Scroll down to the message about Doable and select **Open Anyway**.
   3. Confirm with **Open**.

   This appears because the app isn't notarized by Apple yet. You only need to
   do it once.

**Uninstall:** drag Doable from Applications to the Trash.

## Linux

Each package declares what it needs, so your package manager installs any
missing system libraries (the WebKitGTK web engine and GTK) automatically.

**Ubuntu, Debian and derivatives:**

```sh
sudo apt install ./Doable_<version>_amd64.deb
```

Use `apt install ./file.deb`, not `dpkg -i`: only apt fetches missing
dependencies.

**Fedora, openSUSE, RHEL:**

```sh
sudo dnf install ./Doable-<version>-1.x86_64.rpm
```

**Arch and derivatives:**

```sh
sudo pacman -U doable-<version>-1-x86_64.pkg.tar.zst
```

**Any other distribution (AppImage, no install needed):**

```sh
chmod +x Doable_<version>_amd64.AppImage
./Doable_<version>_amd64.AppImage
```

If it doesn't start and mentions FUSE, either install `libfuse2` (it may be
named `fuse2` or `fuse-libs`), or run it with `--appimage-extract-and-run`.

After installing a package, Doable appears in your app launcher.

**Uninstall:** `sudo apt remove doable`, `sudo dnf remove doable`, or
`sudo pacman -R doable`. For the AppImage, delete the file.

### Matching your desktop's colors and text size

Doable takes its colors from your system accent color, and its text size from
your system font, through the XDG desktop portal (`xdg-desktop-portal`). GNOME
and KDE Plasma include it. Without it, Doable uses its default colors and text
size, and everything else works the same.

## Where your tasks are stored

| System | Folder |
|---|---|
| Windows | `%APPDATA%\com.raiyyan.doable\` |
| macOS | `~/Library/Application Support/com.raiyyan.doable/` |
| Linux | `~/.local/share/com.raiyyan.doable/` |

Tasks are saved in `tasks.json` in that folder. Uninstalling Doable doesn't
delete them. To keep a copy somewhere else, use **⋮ › Export as JSON** inside
the app, and **Import** to restore it.
