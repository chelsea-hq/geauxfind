/**
 * Shared scraper reliability helpers.
 *
 * fetchWithRetry  - fetch with exponential backoff on transient failures
 * writeJsonGuarded - refuse to clobber a healthy data file with a near-empty
 *                    scrape result; keeps the old data and logs loudly instead
 *                    (stale data on the site beats no data). Never throws for
 *                    a guard refusal, so cron pipelines keep their
 *                    "one broken source never fails the run" property.
 */
import { readFile, writeFile } from "node:fs/promises";

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * fetch() that retries transient failures (network errors, 429, 5xx).
 * Returns the first successful (or non-retryable) Response.
 */
export async function fetchWithRetry(url, options = {}, { retries = 3, baseDelayMs = 1000, timeoutMs = 30000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), ...options });
      if (!RETRYABLE_STATUS.has(res.status)) return res;
      lastError = new Error(`HTTP ${res.status} from ${new URL(url).host}`);
      // Honor Retry-After when the server provides one.
      const retryAfter = Number(res.headers.get("retry-after"));
      if (attempt < retries) {
        await sleep(retryAfter > 0 ? retryAfter * 1000 : baseDelayMs * 2 ** attempt);
        continue;
      }
      return res; // out of retries: hand back the failing response
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt);
        continue;
      }
    }
  }
  throw lastError;
}

function countRecords(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) {
      if (Array.isArray(v)) return v.length;
    }
  }
  return null;
}

/**
 * Write JSON to disk unless the new payload looks like a failed scrape:
 * an existing file with a healthy record count being replaced by one that
 * lost more than `maxShrinkRatio` of its records. Override with
 * GEAUXFIND_ALLOW_SHRINK=1 for intentional purges.
 *
 * Returns true when the file was written, false when the guard kept old data.
 */
export async function writeJsonGuarded(filePath, data, { maxShrinkRatio = 0.7, minOldRecords = 10, allowShrink = false } = {}) {
  const newCount = countRecords(data);

  if (newCount !== null && !allowShrink && process.env.GEAUXFIND_ALLOW_SHRINK !== "1") {
    let oldCount = null;
    try {
      oldCount = countRecords(JSON.parse(await readFile(filePath, "utf8")));
    } catch {
      // No existing file or unparseable: nothing to protect.
    }
    if (
      oldCount !== null &&
      oldCount >= minOldRecords &&
      newCount < oldCount * (1 - maxShrinkRatio)
    ) {
      console.error(
        `⚠️  writeJsonGuarded: refusing to write ${filePath} - record count would drop ` +
          `${oldCount} -> ${newCount}. Keeping existing data. ` +
          `Set GEAUXFIND_ALLOW_SHRINK=1 if this shrink is intentional.`
      );
      return false;
    }
  }

  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return true;
}
