// @ts-check
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://oroya-animate.vercel.app",
  integrations: [react(), sitemap()],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es", "ja"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["three", "three-csg-ts", "@joroya/renderer-three", "@joroya/renderer-canvas2d", "@joroya/physics", "cannon-es"],
    },
  },
  markdown: {
    shikiConfig: {
      theme: "night-owl",
    },
  },
});
