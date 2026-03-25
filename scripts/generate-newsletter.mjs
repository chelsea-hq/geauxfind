import { promises as fs } from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const seedPath = path.join(root, "scripts", "seed-data.json");
const mockDataPath = path.join(root, "src", "data", "mock-data.ts");
const newslettersDir = path.join(root, "data", "newsletters");
const featuredHistoryPath = path.join(newslettersDir, "featured-history.json");

const toDate = (date) => new Date(`${date}T12:00:00`);

function extractExportArray(tsSource, exportName) {
  const pattern = new RegExp(`export\\s+const\\s+${exportName}\\s*:[^=]+=[\\s\\n]*(\\[[\\s\\S]*?\\n\\]);`);
  const match = tsSource.match(pattern);
  if (!match?.[1]) return [];
  return vm.runInNewContext(`(${match[1]})`);
}

function formatDateLabel(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sectionList(items, renderItem) {
  if (!items.length) return "<p style=\"margin:0;color:#6b5b4f;\">Nothing new yet — check back next week.</p>";
  return `<ul style="margin:0;padding:0;list-style:none;display:grid;gap:12px;">${items.map(renderItem).join("")}</ul>`;
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function main() {
  const [seed, mockDataSource, featuredHistory] = await Promise.all([
    readJson(seedPath, []),
    fs.readFile(mockDataPath, "utf8"),
    readJson(featuredHistoryPath, []),
  ]);

  const events = extractExportArray(mockDataSource, "events");
  const recipes = extractExportArray(mockDataSource, "recipes");

  const places = Array.isArray(seed) ? seed : (Array.isArray(seed?.places) ? seed.places : []);
  const featuredSet = new Set(Array.isArray(featuredHistory) ? featuredHistory : []);

  const highlights = [...places]
    .filter((place) => typeof place?.slug === "string" && !featuredSet.has(place.slug))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 3);

  const newDiscoveries = places.filter((place) =>
    Array.isArray(place?.tags) && place.tags.some((tag) => String(tag).toLowerCase() === "new drop")
  );

  const today = new Date();
  const inSevenDays = new Date(today);
  inSevenDays.setDate(today.getDate() + 7);

  const weekendEvents = events
    .filter((event) => {
      const eventDate = toDate(event.date);
      return eventDate >= today && eventDate <= inSevenDays;
    })
    .sort((a, b) => toDate(a.date) - toDate(b.date));

  const recipeOfWeek = recipes[Math.floor(Math.random() * recipes.length)] ?? null;

  const issueDate = formatDateLabel(today);

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>The Weekly Geaux — ${issueDate}</title>
  </head>
  <body style="margin:0;padding:24px;background:#faf8f5;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid rgba(107,91,79,0.2);">
      <tr>
        <td style="background:#8B1A1A;padding:28px 24px;color:#FAF8F5;">
          <div style="font-size:30px;line-height:1;">⚜</div>
          <h1 style="margin:10px 0 4px;font-size:32px;line-height:1.1;">The Weekly Geaux</h1>
          <p style="margin:0;color:#f3e9df;">Your Friday guide to the best of Acadiana</p>
        </td>
      </tr>
      <tr><td style="padding:24px;display:block;">
        <h2 style="margin:0 0 12px;color:#8B1A1A;font-size:24px;">This Week's Highlights</h2>
        ${sectionList(
          highlights,
          (place) => `<li style="padding:12px;border:1px solid rgba(107,91,79,0.2);border-radius:12px;"><strong>${escapeHtml(place.name)}</strong><br/><span style="color:#6b5b4f;">${escapeHtml(place.city ?? "Acadiana")} · ${Number(place.rating ?? 0).toFixed(1)}★</span></li>`
        )}
      </td></tr>
      <tr><td style="padding:0 24px 24px;display:block;">
        <h2 style="margin:0 0 12px;color:#8B1A1A;font-size:24px;">New Discoveries</h2>
        ${sectionList(
          newDiscoveries.slice(0, 6),
          (place) => `<li style="padding:12px;border:1px solid rgba(107,91,79,0.2);border-radius:12px;"><strong>${escapeHtml(place.name)}</strong><br/><span style="color:#6b5b4f;">${escapeHtml(place.description ?? "Freshly spotted in Acadiana")}</span></li>`
        )}
      </td></tr>
      <tr><td style="padding:0 24px 24px;display:block;">
        <h2 style="margin:0 0 12px;color:#8B1A1A;font-size:24px;">This Weekend</h2>
        ${sectionList(
          weekendEvents,
          (event) => `<li style="padding:12px;border:1px solid rgba(107,91,79,0.2);border-radius:12px;"><strong>${escapeHtml(event.name)}</strong><br/><span style="color:#6b5b4f;">${escapeHtml(event.date)} · ${escapeHtml(event.time)} · ${escapeHtml(event.city)}</span></li>`
        )}
      </td></tr>
      <tr><td style="padding:0 24px 24px;display:block;">
        <h2 style="margin:0 0 12px;color:#8B1A1A;font-size:24px;">Recipe of the Week</h2>
        ${recipeOfWeek ? `<div style="padding:14px;border-radius:12px;background:#faf8f5;border:1px solid rgba(107,91,79,0.2);"><strong>${escapeHtml(recipeOfWeek.title)}</strong><br/><span style="color:#6b5b4f;">${escapeHtml(recipeOfWeek.prepTime)} prep · ${escapeHtml(recipeOfWeek.cookTime)} cook · ${Number(recipeOfWeek.rating ?? 0).toFixed(1)}★</span></div>` : "<p style=\"margin:0;color:#6b5b4f;\">Recipe coming next issue.</p>"}
      </td></tr>
      <tr><td style="padding:0 24px 28px;display:block;">
        <h2 style="margin:0 0 12px;color:#8B1A1A;font-size:24px;">Community Buzz</h2>
        <p style="margin:0;color:#6b5b4f;">Coming soon: crowd-sourced tips from locals, hidden gems, and where everyone's geauxing this week.</p>
      </td></tr>
      <tr>
        <td style="background:#1c1c1c;color:#cdbca8;padding:18px 24px;font-size:12px;">
          You’re receiving this because you subscribed to GeauxFind. <a href="{{unsubscribe_link}}" style="color:#D4A843;">Unsubscribe</a>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  await fs.mkdir(newslettersDir, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(newslettersDir, `${issueDate}.html`), html, "utf8"),
    fs.writeFile(featuredHistoryPath, JSON.stringify([...featuredSet, ...highlights.map((p) => p.slug)], null, 2), "utf8"),
  ]);

  console.log(`Generated newsletter issue: data/newsletters/${issueDate}.html`);
}

main().catch((error) => {
  console.error("Failed to generate newsletter:", error);
  process.exit(1);
});
