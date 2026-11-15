import { defineConfig } from "vitest/config";

// Covers the server logic and the form's plain functions. No test reaches a real service.
export default defineConfig({
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  test: {
    include: ["src/server/**/*.test.ts", "src/components/**/*.test.ts"],
    environment: "node",
  },
});
