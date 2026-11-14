import { defineConfig } from "vitest/config";

// Covers the server logic only. External calls are passed in, so no test reaches a real service.
export default defineConfig({
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  test: {
    include: ["src/server/**/*.test.ts"],
    environment: "node",
  },
});
