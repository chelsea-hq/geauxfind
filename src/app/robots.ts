import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/claim?", "/*?business="],
    },
    sitemap: "https://geauxfind.vercel.app/sitemap.xml",
    host: "https://geauxfind.vercel.app",
  };
}
