import type { Metadata } from "next";

export const SITE_URL = "https://geauxfind.vercel.app";
export const SITE_NAME = "GeauxFind";

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

export function buildMetadata({
  title,
  description,
  path,
  images = ["/og-image.png"],
}: {
  title: string;
  description: string;
  path: string;
  images?: string[];
}): Metadata {
  const canonical = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}
