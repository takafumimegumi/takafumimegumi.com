// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  // Optimize images at build time instead of per request through Cloudflare Images.
  adapter: cloudflare({ imageService: "compile" }),

  // Sessions are unused. Leaving them on makes the adapter create a KV namespace.
  session: false,
});
