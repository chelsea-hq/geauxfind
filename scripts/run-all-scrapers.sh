#!/usr/bin/env bash
# Run all GeauxFind scrapers locally.
# Each scraper runs independently — failures are logged but don't stop the run.
# Usage: bash scripts/run-all-scrapers.sh
#        npm run scrape:all
#
# Required env vars (set in .env.local or export before running):
#   TICKETMASTER_API_KEY, PREDICTHQ_API_TOKEN, FACEBOOK_GRAPH_TOKEN,
#   YELP_API_KEY, FOURSQUARE_API_KEY, GOOGLE_PLACES_API_KEY,
#   APIFY_API_KEY, TRIPADVISOR_API_KEY (optional)

set -euo pipefail

PASS=0
FAIL=0
FAILED_SCRIPTS=()

run() {
  local label="$1"
  local cmd="$2"
  printf '\n\033[1;34m══ %s\033[0m\n' "$label"
  if eval "$cmd"; then
    printf '\033[0;32m✓ %s\033[0m\n' "$label"
    ((PASS++))
  else
    printf '\033[0;31m✗ %s failed (continuing)\033[0m\n' "$label"
    FAILED_SCRIPTS+=("$label")
    ((FAIL++))
  fi
}

echo "GeauxFind — running all scrapers"
echo "================================="
date

# ── Daily / fast-changing data ────────────────────────────────────────────────
run "Crawfish prices"              "node scripts/scrape-crawfish-prices.mjs"
run "DO337 events"                 "node scripts/scrape-do337.mjs"
run "Lafayette Travel events"      "node scripts/scrape-lafayette-travel-events.mjs"
run "Developing Lafayette events"  "node scripts/scrape-developing-lafayette-events.mjs"
run "Reddit (Acadiana + Lafayette)" "node scripts/scrape-reddit.mjs"
run "What's New"                   "node scripts/scrape-whats-new.mjs"
run "Google Trends"                "node scripts/scrape-google-trends.mjs"
run "Ticketmaster events"          "node scripts/scrape-ticketmaster.mjs"
run "PredictHQ events"             "node scripts/scrape-predicthq.mjs"
run "Facebook events (Graph API)"  "node scripts/scrape-facebook-events-public.mjs"

# ── Weekly / slower-changing data ─────────────────────────────────────────────
run "Yelp venues"                  "node scripts/scrape-yelp.mjs"
run "Foursquare places"            "node scripts/scrape-foursquare.mjs"
run "Google Places enrichment"     "node scripts/scrape-google-places-enrich.mjs"
run "TripAdvisor attractions"      "node scripts/scrape-tripadvisor.mjs"
run "Local blogs"                  "node scripts/scrape-local-blogs.mjs"
run "Food signals"                 "node scripts/scrape-food-signals.mjs"
run "Facebook public groups"       "node scripts/scrape-facebook.mjs"
run "Apify Facebook pipeline"      "node scripts/apify-facebook-pipeline.mjs"

# ── Post-scrape processing ─────────────────────────────────────────────────────
run "Merge sources"                "node scripts/merge-sources.mjs"
run "Generate smart tags"          "node scripts/generate-smart-tags.mjs"

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo "================================="
printf "Done. \033[0;32m%d passed\033[0m, \033[0;31m%d failed\033[0m\n" "$PASS" "$FAIL"

if [ "${#FAILED_SCRIPTS[@]}" -gt 0 ]; then
  echo "Failed:"
  for s in "${FAILED_SCRIPTS[@]}"; do
    printf "  • %s\n" "$s"
  done
fi
