import fs from "node:fs/promises";
import path from "node:path";

const filePath = path.join(process.cwd(), "scripts", "seed-data.json");

const raw = await fs.readFile(filePath, "utf8");
const data = JSON.parse(raw);

if (!Array.isArray(data)) {
  throw new Error("Expected scripts/seed-data.json to be an array of places.");
}

let removed = 0;

for (const place of data) {
  if (!Array.isArray(place.reviews)) continue;

  const before = place.reviews.length;
  place.reviews = place.reviews.filter((review) => {
    const author = typeof review?.author === "string" ? review.author : "";
    const comment = typeof review?.comment === "string" ? review.comment : "";
    return !(author === "Local Explorer" && comment.trim() === "");
  });
  removed += before - place.reviews.length;
}

await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

console.log(`Removed ${removed} empty Local Explorer review stubs.`);
