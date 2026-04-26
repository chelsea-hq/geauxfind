import type { Metadata } from "next";

export const SITE_URL = "https://geauxfind.vercel.app";
export const SITE_NAME = "GeauxFind";

// Bump when the /api/og visual template changes so Facebook/Twitter/iMessage
// caches refetch the new art. Appended as ?v=N on dynamic OG URLs.
export const OG_CACHE_VERSION = 3;

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

export function dynamicOgUrl(opts: { title?: string; subtitle?: string; kicker?: string }): string {
  const params = new URLSearchParams();
  if (opts.title) params.set("title", opts.title);
  if (opts.subtitle) params.set("subtitle", opts.subtitle);
  if (opts.kicker) params.set("kicker", opts.kicker);
  params.set("v", String(OG_CACHE_VERSION));
  return `${SITE_URL}/api/og?${params.toString()}`;
}

type BuildMetaOptions = {
  title: string;
  description: string;
  path: string;
  // Static image override. If provided, dynamic OG is skipped.
  images?: string[];
  // Dynamic OG card customization (only used when images is not provided).
  ogTitle?: string;
  ogSubtitle?: string;
  ogKicker?: string;
};

export function buildMetadata({ title, description, path, images, ogTitle, ogSubtitle, ogKicker }: BuildMetaOptions): Metadata {
  const canonical = absoluteUrl(path);
  const staticFallback = "/og-image.png";

  // Resolve primary image:
  //  1. caller's `images[0]` (explicit override)
  //  2. dynamic /api/og render if ogTitle/Subtitle/Kicker passed
  //  3. static /og-image.png fallback
  let primary: string;
  const callerImage = images?.[0];
  if (callerImage && callerImage.trim().length > 0) {
    primary = callerImage;
  } else if (ogTitle || ogSubtitle || ogKicker) {
    primary = dynamicOgUrl({
      title: ogTitle ?? title.replace(/\s*\|\s*GeauxFind.*$/i, "").slice(0, 110),
      subtitle: ogSubtitle ?? description.slice(0, 180),
      kicker: ogKicker ?? "GEAUXFIND",
    });
  } else {
    primary = staticFallback;
  }

  // Always include the static fallback as a secondary image so social
  // scrapers that fail to fetch the dynamic endpoint still get a preview.
  const imageList = primary === staticFallback ? [staticFallback] : [primary, staticFallback];

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      images: imageList.map((url) => ({ url, width: 1200, height: 630, alt: title, type: "image/png" as const })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageList,
    },
  };
}
