import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const site =
  process.env.SITE_URL || process.env.PUBLIC_SITE_URL || "https://quiet.paulapplegate.com";

export default defineConfig({
  site,
  integrations: [mdx(), react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["astro-cloudinary", "@radix-ui/*"]
    },
    optimizeDeps: {
      exclude: ["astro-cloudinary"]
    },
    build: {
      cssMinify: true,
      minify: "esbuild"
    }
  }
});
