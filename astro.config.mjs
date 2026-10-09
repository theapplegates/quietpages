// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import process from "node:process";
import { siteConfig } from "./src/config/site.ts";
import rehypeCloudinaryPicture from "./src/plugins/rehype-cloudinary-picture.mjs";

const env = loadEnv(process.env.NODE_ENV || "production", process.cwd(), "PUBLIC_");

export default defineConfig({
  site: siteConfig.siteUrl,
  trailingSlash: "always",
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.endsWith(".json") && !page.endsWith(".xml") && !page.endsWith(".txt"),
    }),
  ],
  markdown: {
    rehypePlugins: [[rehypeCloudinaryPicture, { cloudName: env.PUBLIC_CLOUDINARY_CLOUD_NAME }]],
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark-default" },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
