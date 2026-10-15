#!/usr/bin/env sh
# Build the Arch package from the release .deb, with pkgver taken from package.json.
set -eu
root="$(cd "$(dirname "$0")/.." && pwd)"
version="$(node -p "require('$root/package.json').version")"
deb="$root/src-tauri/target/release/bundle/deb/Doable_${version}_amd64.deb"
[ -f "$deb" ] || { echo "Missing $deb. Run: pnpm tauri build --bundles deb" >&2; exit 1; }
cd "$root/packaging/arch"
sed -i "s/^pkgver=.*/pkgver=${version}/" PKGBUILD
makepkg -cf
ls -1 "$root"/packaging/arch/*.pkg.tar.zst
