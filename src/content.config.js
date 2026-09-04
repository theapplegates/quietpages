import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { parseUnsplashCredit } from "./lib/unsplash-credit.js";

const explicitImageCredit = z.object({
  caption: z.string().optional(),
  author: z.string(),
  authorUrl: z.string().url(),
  source: z.string().default("Unsplash"),
  sourceUrl: z.string().url(),
});

const copiedUnsplashCredit = z
  .object({
    caption: z.string().optional(),
    credit: z.string().min(1),
  })
  .transform((value, context) => {
    try {
      return { caption: value.caption, ...parseUnsplashCredit(value.credit) };
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Invalid Unsplash credit.",
        path: ["credit"],
      });
      return z.NEVER;
    }
  });

const blog = defineCollection({
  loader: glob({
    pattern: "**/index.mdx",
    base: "./src/content/blog",
    generateId: ({ entry }) => entry.replace(/[\\/]index\.mdx$/, "").replace(/\\/g, "/"),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      excerpt: z.string(),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
      canonical: z.string().url().optional(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      readingTime: z.number().int().positive().optional(),
      category: z.string(),
      tags: z.array(z.string()).default([]),
      author: z.string(),
      thumbnail: image(),
      thumbnailAlt: z.string().default(""),
      imageCredit: z.union([copiedUnsplashCredit, explicitImageCredit]).optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
