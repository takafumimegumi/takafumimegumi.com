import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import astro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default defineConfig([
  // Build output and folders that git does not track.
  globalIgnores(["dist/", ".astro/", ".wrangler/", "private/", "tmp/"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
]);
