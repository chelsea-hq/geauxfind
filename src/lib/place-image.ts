// Normalize any photo URL that might be a raw Google Places reference
// (e.g. "places/ChIJ.../photos/ATCDN...") into a proxied /api/photo URL.
// Seed data contains a mix of already-wrapped /api/photo URLs and raw
// Google Places refs — this function handles both so components don't
// need to care which format they got.

export function normalizePlacePhoto(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Already an absolute URL or data URL — pass through
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed;

  // Already a local path (SVG placeholders, /api/photo, /uploads/...) — pass through
  if (trimmed.startsWith("/")) return trimmed;

  // Raw Google Places photo reference like "places/ChIJ.../photos/ATCDN..."
  if (/^places\/[^/]+\/photos\//i.test(trimmed)) {
    return `/api/photo?ref=${encodeURIComponent(trimmed)}`;
  }

  // Unknown format — safe fallback to not break the page
  return null;
}
