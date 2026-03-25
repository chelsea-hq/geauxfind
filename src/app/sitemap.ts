import type { MetadataRoute } from "next";
import { events, places, recipes } from "@/data/mock-data";

const base = "https://geauxfind.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/plan`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/ask`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/crawfish`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/community`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/whos-got-it`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/trending`, lastModified: now, changeFrequency: "daily", priority: 0.75 },
    { url: `${base}/whats-new`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/this-weekend`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/events`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/food`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/music`, lastModified: now, changeFrequency: "daily", priority: 0.75 },
    { url: `${base}/finds`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/recipes`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/claim`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/alerts`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const placeRoutes = places.map((place) => ({
    url: `${base}/place/${place.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const eventRoutes = events.map((event) => ({
    url: `${base}/event/${event.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const recipeRoutes = recipes.map((recipe) => ({
    url: `${base}/recipe/${recipe.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...placeRoutes, ...eventRoutes, ...recipeRoutes];
}
