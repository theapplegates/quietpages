# Responsive images: JXL → AVIF → WebP

All displayed Cloudinary photos use this order, with a responsive `srcset` for each format:

1. `<source type="image/jxl">` — explicit `f_jxl` URLs.
2. `<source type="image/avif">` — explicit `f_avif` URLs.
3. `<source type="image/webp">` — explicit `f_webp` URLs.
4. `<img>` — WebP `src` and WebP `srcset` as the final fallback.

There is no `f_auto`. `q_auto` remains enabled for image quality. The browser chooses the first supported format, then an appropriate candidate width using `sizes` and display density. It does not download all three formats. A failed image request does not cause `<picture>` to retry the next format.

## Complete workflow

1. Run `npm install`. Use Node 22.12 or newer.

2. Create `.env.local` in the project root with:

   ```dotenv
   PUBLIC_CLOUDINARY_CLOUD_NAME=paulapplegate-com
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

   If you already have a `.env`, you can keep it. The uploader loads `.env`, then `.env.local`; values already in the terminal environment take priority. Only the cloud name has a `PUBLIC_` prefix. Both environment files are ignored by Git. The build and the browser do not need the key or secret.

3. Put a photograph in `src/images/blog/`, creating that folder if needed. For example, `src/images/blog/photo.jpg`.

4. Upload it and generate responsive breakpoints:

   ```bash
   npm run cloudinary:breakpoints -- "src/images/blog/photo.jpg" --alt="Describe your photo"
   ```

   This uploads as public ID `images/blog/photo`, asks Cloudinary to analyze **each format separately**, and saves its returned widths in `src/data/cloudinary-images.json`. No Sharp conversion is used. Cloudinary retains the generated breakpoint variants; this uses your Cloudinary transformation/storage allowance. Run uploads one at a time, including in batch loops.

5. Copy the `<cloudinary-picture ...></cloudinary-picture>` snippet printed by the command into a post under `src/content/blog/` (a post's `index.md` or `index.mdx`). Keep a blank line before and after it. **No import and no MDX conversion are needed.** Restart the dev server after generating a new manifest entry if it is already running.

   Once an image is in the manifest, this shorter Markdown form also works:

   ```markdown
   ![Describe your photo](cloudinary:images/blog/photo)
   ```

   That shorthand uses the configured default cloud. The printed HTML snippet includes the specific cloud name, dimensions, and sizes explicitly.

6. Preview and verify:

   ```bash
   npm run dev
   npm run check
   npm test
   npm run build
   ```

   Commit the post and `src/data/cloudinary-images.json` with your site changes. Upload credentials are unnecessary on the hosting service. If using another cloud, configure the same public cloud name when building there.

## Existing images and optional settings

To analyze an image already uploaded to Cloudinary:

```bash
npm run cloudinary:breakpoints -- "images/blog/photo" --existing --alt="Describe your photo"
```

To choose a different public ID, sizes hint, or maximum candidate width:

```bash
npm run cloudinary:breakpoints -- "src/images/blog/photo.jpg" --public-id="blog/my-photo" --sizes="100vw" --max-width=2160
```

Defaults are a minimum width of 50, maximum width of 1920, a 20,000-byte step, and up to 20 candidates per format. Cloudinary can return fewer widths and limits analysis to the original image's width. Other options are `--min-width`, `--bytes-step`, and `--max-images`.

Reusing an existing public ID does not overwrite the remote image by default. Use `--existing` to analyze it, or deliberately add `--overwrite` to replace it with your local file and save its new version. For a file outside the project, supply `--public-id` explicitly.

Without saved breakpoint data, an image still works when you provide dimensions. It uses standard candidate widths: 320, 480, 640, 800, 960, 1280, 1600, 1920. These are fallback widths, not claimed Cloudinary analysis. You can override them with `widths`.

## Using the Astro component

Use `CloudinaryImage` directly in `.astro` templates:

```astro
---
import CloudinaryImage from "@/components/CloudinaryImage.astro";
---

<CloudinaryImage
  publicId="images/blog/photo"
  alt="Describe your photo"
  width={1200}
  height={800}
  sizes="(max-width: 720px) calc(100vw - 3rem), 672px"
/>
```

`width` and `height` can be omitted when the manifest supplies them. They also set the desired crop proportions: a 16:9 image stays 16:9 at every candidate width. Options include `cloudName`, `widths`, `sizes`, `crop`, `gravity`, `blur`, `grayscale`, `loading`, `fetchpriority`, `class` for the image, and `pictureClass` for the wrapper. Use `loading="eager"` and `fetchpriority="high"` for the main above-the-fold photo.

The default prose `sizes` hint, `(max-width: 720px) calc(100vw - 3rem), 672px`, matches this theme's 42rem (672px) prose column. Use `sizes="100vw"` for a full-width image, or supply a hint matching your layout. Avoid separate WebP preload hints for a picture that may select JXL or AVIF; these can download an extra format.

## Social previews

`getOgImageUrl` in `src/lib/cloudinary.ts` builds one explicit JPEG URL for social metadata (`og:image` and `twitter:image`) for crawlers. This is separate from displayed blog images and is not an extra fallback in their `<picture>` elements. Post cards and heroes in this theme continue to use the local `thumbnail` frontmatter image through `astro:assets`.

## Files

| File                                        | Purpose                                                    |
| ------------------------------------------- | ---------------------------------------------------------- |
| `src/lib/cloudinary-core.mjs`               | Shared URL, format order, crop, and breakpoint logic       |
| `src/lib/cloudinary.ts`                     | Astro environment configuration and typed exports          |
| `src/data/cloudinary-images.json`           | Generated public image metadata and format-specific widths |
| `src/components/CloudinaryImage.astro`      | Responsive Astro picture component                         |
| `src/plugins/rehype-cloudinary-picture.mjs` | Import-free Markdown image support                         |
| `scripts/cloudinary-breakpoints.mjs`        | Upload and per-format breakpoint analysis                  |
| `astro.config.mjs`                          | Markdown plugin registration                               |
| `.env.example`                              | Configuration template                                     |
| `src/styles/global.css`                     | The `.cloudinary-picture` rules                            |
| `tests/cloudinary.test.mjs`                 | Format, crop, Markdown, and upload contract tests          |

Cloudinary references: [responsive breakpoint API](https://cloudinary.com/documentation/image_upload_api_reference#upload), [request signatures](https://cloudinary.com/documentation/authentication_signatures).
