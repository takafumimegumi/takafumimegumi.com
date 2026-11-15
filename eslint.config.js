import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  // Build output and folders that git does not track.
  globalIgnores(["dist/", ".astro/", ".wrangler/", "private/", "tmp/"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    // These scripts run in Node.js, not in the Workers runtime.
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
  // The dependency directions of src/server/ (.claude/rules/server.md).
  {
    files: ["src/server/usecases/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/clients/**"],
              allowTypeImports: true,
              message:
                "A use case takes external calls as arguments. Import only types from clients/.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/functions/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/clients/**", "**/usecases/**"],
              message:
                "functions/ holds pure functions and depends on nothing else in src/server/.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/clients/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/usecases/**"],
              message: "A client does not depend on a use case.",
            },
          ],
        },
      ],
    },
  },
]);
