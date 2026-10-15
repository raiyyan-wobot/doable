// Node ESM resolve hook: retry extensionless relative imports with ".js".
// Needed because @material/material-color-utilities 0.4.0 ships one import
// without an extension (dynamiccolor/color_spec_2025.js). Vite tolerates that,
// Node's strict ESM loader doesn't. Used only by scripts/generate-tokens.mjs.
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (error?.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !specifier.endsWith(".js")) {
        return nextResolve(`${specifier}.js`, context);
      }
      throw error;
    }
  },
});
