const UNSPLASH_HOSTS = new Set(["unsplash.com", "www.unsplash.com"]);
const CREDIT_PATTERN = /^Photo by\s+\[([^\]]+)]\(([^)]+)\)\s+on\s+\[Unsplash]\(([^)]+)\)\.?$/i;

const normalizeUnsplashUrl = (rawUrl, expectedPath, utmSource) => {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid Unsplash URL: "${rawUrl}".`);
  }

  if (url.protocol !== "https:" || !UNSPLASH_HOSTS.has(url.hostname)) {
    throw new Error(`Expected an HTTPS URL on unsplash.com, received "${rawUrl}".`);
  }
  if (!expectedPath.test(url.pathname)) {
    throw new Error(`Unexpected Unsplash URL path: "${url.pathname}".`);
  }

  url.hostname = "unsplash.com";
  url.searchParams.set("utm_source", utmSource);
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.delete("utm_content");
  return url.toString();
};

/**
 * Parse the Markdown copied from Unsplash's credit button and normalize its
 * tracking links for this site.
 */
export const parseUnsplashCredit = (input, { utmSource = "quiet_pages" } = {}) => {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("Paste the credit text copied from Unsplash.");
  }

  const match = input.trim().replace(/\s+/g, " ").match(CREDIT_PATTERN);
  if (!match) {
    throw new Error(
      "Expected: Photo by [Name](https://unsplash.com/@name) on [Unsplash](https://unsplash.com/photos/id).",
    );
  }

  const author = match[1].trim();
  if (!author) throw new Error("The Unsplash credit is missing the photographer's name.");

  return {
    author,
    authorUrl: normalizeUnsplashUrl(match[2], /^\/@[^/]+\/?$/, utmSource),
    source: "Unsplash",
    sourceUrl: normalizeUnsplashUrl(match[3], /^\/photos\/[^/]+\/?$/, utmSource),
  };
};

export const punctuateCaption = (caption = "") => {
  const trimmed = caption.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return /[.!?…]$/u.test(trimmed) ? trimmed : `${trimmed}.`;
};
