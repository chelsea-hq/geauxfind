import type { MetadataRoute } from "next";
import { events, places, recipes } from "@/data/mock-data";
import { CITIES } from "@/lib/cities";
import { DISHES } from "@/lib/dishes";
import { getFileUpdatedAt } from "@/lib/freshness";

const base = "https://geauxfind.vercel.app";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const eventsUpdated = getFileUpdatedAt("events.json") ?? now;
  const whatsNewUpdated = getFileUpdatedAt("whats-new.json") ?? now;
  const crawfishUpdated = getFileUpdatedAt("crawfish-prices.json") ?? now;
  const guidesUpdated = getFileUpdatedAt("guides.json") ?? now;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/tonight`, lastModified: eventsUpdated, changeFrequency: "hourly", priority: 0.95 },
    { url: `${base}/this-weekend`, lastModified: eventsUpdated, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/plan`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/ask`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/crawfish`, lastModified: crawfishUpdated, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/crawfish/prices`, lastModified: crawfishUpdated, changeFrequency: "hourly", priority: 0.95 },
    { url: `${base}/community`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/whos-got-it`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/whats-new`, lastModified: whatsNewUpdated, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/events`, lastModified: eventsUpdated, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/food`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/music`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/finds`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/recipes`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/city`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/best`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/live-music`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/live-music/tonight`, lastModified: guidesUpdated, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/live-music/this-weekend`, lastModified: guidesUpdated, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/kids-eat-free`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/weekend-brunch`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/deals`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/festivals`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/happy-hours`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.75 },
    { url: `${base}/daily-specials`, lastModified: guidesUpdated, changeFrequency: "daily", priority: 0.75 },
    { url: `${base}/late-night`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/coffee`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/breweries`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/food-trucks`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/dance-halls`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/outdoor`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/photo-spots`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.65 },
    { url: `${base}/date-night`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/farmers-markets`, lastModified: guidesUpdated, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/cajun-connection`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/claim`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/alerts`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Day-of-week splits (SEO long-tail)
  const daySplits: MetadataRoute.Sitemap = [
    ...DAYS.map((day) => ({
      url: `${base}/kids-eat-free/${day}`,
      lastModified: guidesUpdated,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...["saturday", "sunday"].map((day) => ({
      url: `${base}/weekend-brunch/${day}`,
      lastModified: guidesUpdated,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
  ];

  const cityRoutes: MetadataRoute.Sitemap = CITIES.map((c) => ({
    url: `${base}/city/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const dishRoutes: MetadataRoute.Sitemap = DISHES.map((d) => ({
    url: `${base}/best/${d.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  const placeRoutes = places.map((place) => ({
    url: `${base}/place/${place.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const todayMs = Date.now();
  const eventRoutes: MetadataRoute.Sitemap = events
    .filter((e) => {
      const t = new Date(`${e.endDate || e.date}T23:59:59`).getTime();
      return Number.isFinite(t) && t >= todayMs;
    })
    .map((event) => ({
      url: `${base}/event/${event.slug}`,
      lastModified: eventsUpdated,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  const recipeRoutes = recipes.map((recipe) => ({
    url: `${base}/recipe/${recipe.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  return [...staticRoutes, ...daySplits, ...cityRoutes, ...dishRoutes, ...placeRoutes, ...eventRoutes, ...recipeRoutes];
}
