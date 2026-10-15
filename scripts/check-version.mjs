// Fails if package.json and src-tauri/Cargo.toml disagree on the version.
// (tauri.conf.json reads package.json directly, so it can't drift.)
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
const cargo = /^version\s*=\s*"([^"]+)"/m.exec(
  readFileSync(new URL("../src-tauri/Cargo.toml", import.meta.url), "utf8"),
)?.[1];

if (pkg !== cargo) {
  console.error(`Version mismatch: package.json ${pkg} vs src-tauri/Cargo.toml ${cargo}`);
  process.exit(1);
}
console.log(`version ${pkg} ✓`);
