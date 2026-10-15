// Generates the app icon source, src-tauri/icons/app-icon.svg, from the same
// geometry as the in-app logo (src/lib/shapes.ts). Then renders every
// platform size with `tauri icon`.
//
// Run with `pnpm icon`. In-app the logo follows the system accent; an OS icon
// can't, so it uses fixed brand colors. Mobile icon sets are deleted
// afterwards: this is a desktop app.
import { spawnSync } from "node:child_process";
import { copyFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LOGO, cardTransform } from "../src/lib/shapes.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "src-tauri/icons/app-icon.svg");

const SIZE = 1024;
const PADDING = 0.04; // breathing room so the tilted card isn't clipped by OS masks

const card = (c, fill) =>
  `<rect x="${c.x}" y="${c.y}" width="${c.width}" height="${c.height}" rx="${c.radius}" transform="${cardTransform(c)}" fill="${fill}"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="front" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4d7cfe"/>
      <stop offset="1" stop-color="#5b3fd9"/>
    </linearGradient>
  </defs>
  <g transform="translate(${SIZE * PADDING} ${SIZE * PADDING}) scale(${SIZE * (1 - 2 * PADDING)})">
    ${card(LOGO.backCard, "#b9c8ff")}
    ${card(LOGO.frontCard, "url(#front)")}
    <path d="${LOGO.check}" fill="none" stroke="#ffffff" stroke-width="${LOGO.checkWidth}"
          stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
`;

writeFileSync(out, svg);
copyFileSync(out, join(root, "public/favicon.svg")); // the webview's favicon
console.log(`wrote ${out} and public/favicon.svg`);

const result = spawnSync("pnpm", ["tauri", "icon", out], { cwd: root, stdio: "inherit", shell: true });
for (const mobile of ["android", "ios"]) {
  rmSync(join(root, "src-tauri/icons", mobile), { recursive: true, force: true });
}
process.exit(result.status ?? 1);
