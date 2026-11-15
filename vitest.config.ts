import { defineConfig } from "vitest/config";

// Covers the server logic and the plain functions of the form and the scripts. No test reaches a real service.
export default defineConfig({
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  test: {
    include: [
      "src/server/**/*.test.ts",
      "src/components/**/*.test.ts",
      "src/scripts/**/*.test.ts",
    ],
    environment: "node",
  },
});
