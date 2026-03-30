#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SEED_PATH = path.join(ROOT, "scripts", "seed-data.json");

const ZIP_TO_NEIGHBORHOOD = {
  "70592": "Youngsville",
  "70518": "Broussard",
  "70583": "Scott",
  "70517": "Breaux Bridge",
  "70520": "Carencro",
};

const STREET_RULES = [
  { match: /(e\.?|w\.?)?\s*vermilion|jefferson|lee\s+ave|main\s+st|parc\s+international|downtown/i, neighborhood: "Downtown Lafayette" },
  { match: /kaliste\s+saloom|camellia|settlers\s+trace|river\s+ranch/i, neighborhood: "River Ranch" },
  { match: /heymann|ochsner\s+boulevard|south\s+college/i, neighborhood: "Oil Center" },
  { match: /freetown|port\s*rico|taft|polk\s+st/i, neighborhood: "Freetown/Port Rico" },
  { match: /i-?10|n\.?\s*university|moss\s+st|evangeline\s+thruway|pont\s+des\s+mouton|gloria\s+switch/i, neighborhood: "North Lafayette" },
];

function extractZip(address = "") {
  const m = String(address).match(/\b(\d{5})(?:-\d{4})?\b/);
  return m ? m[1] : null;
}

function normalize(s = "") {
  return String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function assignNeighborhood(place) {
  const address = String(place?.address || "");
  const city = normalize(place?.city || "");
  const zip = extractZip(address);

  if (zip && ZIP_TO_NEIGHBORHOOD[zip]) return ZIP_TO_NEIGHBORHOOD[zip];

  if (city.includes("youngsville")) return "Youngsville";
  if (city.includes("broussard")) return "Broussard";
  if (city.includes("scott")) return "Scott";
  if (city.includes("breaux bridge")) return "Breaux Bridge";
  if (city.includes("carencro")) return "Carencro";

  for (const rule of STREET_RULES) {
    if (rule.match.test(address)) return rule.neighborhood;
  }

  return "Other / Unassigned";
}

async function main() {
  const raw = await fs.readFile(SEED_PATH, "utf8");
  const places = JSON.parse(raw);
  if (!Array.isArray(places)) throw new Error("seed-data.json is not an array");

  const updated = places.map((p) => ({ ...p, neighborhood: assignNeighborhood(p) }));

  await fs.writeFile(SEED_PATH, JSON.stringify(updated, null, 2), "utf8");

  const summary = updated.reduce((acc, p) => {
    acc[p.neighborhood] = (acc[p.neighborhood] || 0) + 1;
    return acc;
  }, {});

  console.log("Assigned neighborhoods for", updated.length, "places");
  console.log(summary);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
