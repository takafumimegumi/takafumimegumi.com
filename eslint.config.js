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
  // The dependency directions of the contact form (.claude/rules/frontend.md).
  {
    files: ["src/components/sections/Contact/ui/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/Contact/api", "**/Contact/hooks/**"],
              message:
                "A component in ui/ draws what it is given. It does not call the server or use the form's hooks.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/sections/Contact/hooks/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/Contact/ui/**"],
              allowTypeImports: true,
              message: "A hook does not draw. Import only types from ui/.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/sections/Contact/functions/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/Contact/ui/**", "**/Contact/hooks/**"],
              message:
                "functions/ holds pure functions and depends on nothing else in the form.",
            },
            {
              group: ["**/Contact/api"],
              allowTypeImports: true,
              message:
                "A pure function does not call the server. Import only types from api.",
            },
          ],
        },
      ],
    },
  },
]);
