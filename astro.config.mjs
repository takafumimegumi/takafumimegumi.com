// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://takafumimegumi.com",

  // Downloaded at build time and served from this site, so no visitor data goes to a font host.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Noto Sans",
      cssVariable: "--font-sans",
      weights: [400, 500, 700],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
  ],

  // Optimize images at build time instead of per request through Cloudflare Images.
  adapter: cloudflare({ imageService: "compile" }),

  // Sessions are unused. Leaving them on makes the adapter create a KV namespace.
  session: false,
});
