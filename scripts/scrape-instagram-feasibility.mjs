#!/usr/bin/env node
import { writeJson } from "./lib/source-utils.mjs";

/**
 * Instagram hashtag data feasibility note.
 * Instagram Basic Display API does not provide broad hashtag discovery for arbitrary public content.
 * Official route is Meta Graph API with Business accounts + permissions.
 */

await writeJson("data/instagram-feasibility.json", {
  generatedAt: new Date().toISOString(),
  ok: false,
  reason: "No broad public hashtag scrape path via official API without app review + business account scopes.",
  recommended: [
    "Use creator/business account and Graph API hashtag search endpoints",
    "Cache approved hashtags (#lafayette #acadiana #cajunfood)",
    "Fallback to curated creator list from manual onboarding"
  ]
});

console.log("Wrote data/instagram-feasibility.json");
