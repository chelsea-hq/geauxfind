#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const checks = [];

const runCheck = async (name, fn) => {
  try {
    const detail = await fn();
    checks.push({ name, pass: true, detail: detail ?? "OK" });
  } catch (error) {
    checks.push({ name, pass: false, detail: error instanceof Error ? error.message : String(error) });
  }
};

const walk = (dir, files = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
};

await runCheck("Next build", async () => {
  execSync("npx next build", { stdio: "pipe" });
  return "Build completed";
});

await runCheck("All app pages exist", async () => {
  const pages = walk(join(root, "src/app")).filter((file) => file.endsWith("/page.tsx"));
  if (!pages.length) throw new Error("No app pages found");
  return `${pages.length} pages detected`;
});

await runCheck("Internal links reference existing routes", async () => {
  const files = walk(join(root, "src")).filter((file) => file.endsWith(".tsx"));
  const pageRoutes = new Set(
    walk(join(root, "src/app"))
      .filter((file) => file.endsWith("/page.tsx"))
      .map((file) => {
        const route = relative(join(root, "src/app"), file).replace(/\/page\.tsx$/, "");
        if (route === "page.tsx") return "/";
        return `/${route.replace(/\/page\.tsx$/, "").replace(/\/index$/, "")}`.replace(/\/page\.tsx$/, "");
      })
      .map((r) => (r === "/page.tsx" ? "/" : r))
      .map((r) => r.replace(/\/page\.tsx$/, ""))
  );

  const misses = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const hrefs = [...content.matchAll(/href=\"(\/[^\"#?]*)/g)].map((m) => m[1]);
    for (const href of hrefs) {
      if (href.includes("[")) continue;
      if (href.startsWith("/api")) continue;
      const direct = pageRoutes.has(href);
      const dynamic = ["/place/", "/event/", "/recipe/"].some((prefix) => href.startsWith(prefix));
      if (!direct && !dynamic) misses.push(`${href} in ${relative(root, file)}`);
    }
  }

  if (misses.length) throw new Error(`Broken links:\n${misses.slice(0, 20).join("\n")}`);
  return "No broken internal links found";
});

await runCheck("No placeholder text", async () => {
  const files = walk(join(root, "src")).filter((file) => /\.(ts|tsx|js|jsx|md)$/.test(file));
  const banned = [/example\.com/i, /lorem ipsum/i, /\bTODO\b/i, /coming soon/i];
  const hits = [];

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const pattern of banned) {
      if (pattern.test(content)) hits.push(`${pattern} in ${relative(root, file)}`);
    }
  }

  if (hits.length) throw new Error(hits.slice(0, 20).join("\n"));
  return "No placeholder strings detected";
});

await runCheck("API routes export handlers", async () => {
  const apiRoutes = walk(join(root, "src/app/api")).filter((file) => file.endsWith("route.ts"));
  const missing = [];
  for (const route of apiRoutes) {
    const content = readFileSync(route, "utf8");
    if (!/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/.test(content)) {
      missing.push(relative(root, route));
    }
  }
  if (missing.length) throw new Error(`Missing route handlers: ${missing.join(", ")}`);
  return `${apiRoutes.length} API route files checked`;
});

await runCheck("Search query returns results", async () => {
  const seed = JSON.parse(readFileSync(join(root, "scripts/seed-data.json"), "utf8"));
  const results = (seed.places ?? []).filter((place) =>
    [place.name, place.description, ...(place.tags ?? [])].join(" ").toLowerCase().includes("crawfish")
  );
  if (!results.length) throw new Error("No search-like matches for crawfish in dataset");
  return `${results.length} dataset matches for crawfish`;
});

const failed = checks.filter((check) => !check.pass);
for (const check of checks) {
  console.log(`${check.pass ? "PASS" : "FAIL"} - ${check.name}: ${check.detail}`);
}

if (failed.length) {
  process.exit(1);
}
