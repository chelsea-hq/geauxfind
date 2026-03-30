# GeauxFind State

## ✅ Just Shipped (2026-03-29)
- Built full business verification & discovery toolchain:
  - `scripts/verify-businesses.mjs`
  - `scripts/discover-businesses.mjs`
  - `scripts/freshness-check.mjs`
  - `scripts/apply-verification.mjs`
- Added npm scripts:
  - `npm run verify:businesses`
  - `npm run discover:businesses`
  - `npm run freshness:check`
  - `npm run apply:verification`

### Verification Script Capabilities
- Reads `scripts/seed-data.json`
- Loads Google API key from env or `../.secrets.env` (`GOOGLE_PLACES_API_KEY` / `GOOGLE_API_KEY`)
- Verifies businesses via new Places API (`places:searchText`) with legacy Find Place fallback
- Enforces pacing:
  - 100ms between requests (<=10 req/sec)
  - Batches of 50
  - 5-second pause between batches
- Supports resumable execution using persisted `data/verification-results.json`
- Supports test runs via `--limit` (used with `--limit 20`)
- Updates seed data in-place with:
  - `last_verified`
  - `google_place_id`
  - `google_rating`
  - `google_review_count`
  - `status` for closed/temp-closed
- Writes outputs:
  - `data/verification-results.json`
  - `data/closed-businesses.json`
  - `data/verification-progress.json`

### Test Run Completed
- Executed: `node scripts/verify-businesses.mjs --limit 20`
- Result summary (first 20):
  - OPERATIONAL: 17
  - CLOSED_TEMPORARILY: 3
  - CLOSED_PERMANENTLY: 0
  - NOT_FOUND: 0
- Seed file and verification artifacts were successfully written.

### Discovery Script (Built, Not Run)
- Searches Nearby Search API around Lafayette center (30.2241,-92.0198, 25km)
- Covers required business types
- Dedupes existing entries by `place_id` and normalized name+address
- Saves review queue to `data/new-discoveries.json`
- No auto-insertion into seed data

### Freshness Script
- Reads verification timestamps from seed data
- Reports stale counts for >7 / >14 / >30 / >60 days
- Lists stale businesses (>30 days)
- No API calls required

### Apply Verification Script
- Reads `data/verification-results.json` + `scripts/seed-data.json`
- Removes CLOSED_PERMANENTLY businesses from:
  - `scripts/seed-data.json`
  - `data/guides.json`
  - `data/deals.json` (communityDeals)
  - `data/community-recs.json` (businesses + topic topBusinesses)
- Applies `status: temporarily_closed` for CLOSED_TEMPORARILY in seed data
- Writes audit log to `data/removal-log.json`

---

## Previous State Notes

- `data/kids-eat-free.json`, `data/live-music.json`, `data/weekend-brunch.json`
- NEW food/drink guides shipped 2026-03-26:
  - `data/happy-hours.json` (30 venues)
  - `data/daily-specials.json` (24 restaurants)
  - `data/late-night.json` (18 spots)
  - `data/food-trucks.json` (18 trucks)
  - `data/date-night.json` (24 ideas)

### ✅ Just Shipped (2026-03-26)
- Wave 1 food/drink guides:
  - Pages: `/happy-hours`, `/daily-specials`, `/late-night`, `/food-trucks`, `/date-night`
  - APIs: `/api/happy-hours`, `/api/daily-specials`, `/api/late-night`, `/api/food-trucks`, `/api/date-night`
- Wave 2 expansion guides:
  - Pages: `/breweries`, `/coffee`, `/farmers-markets`, `/festivals`, `/outdoor`, `/dance-halls`, `/photo-spots`
  - APIs: `/api/breweries`, `/api/coffee`, `/api/farmers-markets`, `/api/festivals`, `/api/outdoor`, `/api/dance-halls`, `/api/photo-spots`
  - Data files: `breweries.json` (18), `coffee-shops.json` (20), `farmers-markets.json` (10), `festivals.json` (37), `outdoor.json` (18), `dance-halls.json` (12), `photo-spots.json` (16)
- Expanded `data/deals.json` community deals from 0 → 18 approved deals
- Header/nav reorganized into dropdowns: "Food & Drink" + "Things to Do"; top-level keeps Who's Got It, Crawfish, Deals, Community
- Homepage now includes side-by-side "Food & Drink Guides" and "Things to Do" discovery blocks
- Build passes (`npm run build`) with existing pre-existing `<img>` warnings only

### 🔧 In Progress
- FB dumps → site auto-pipeline (need to auto-process new #gf-dumps posts)

### ❌ Not Working
- `data/facebook-feed.json` — 0 items, all groups return `robots_blocked`
- `data/facebook-events-graph.json` — 0 records
- Automated FB scraping is dead. Chelsea provides manual dumps via Discord #gf-dumps.

## #gf-dumps Discord Channel (1486201498470977697)
**THIS IS A DATA SOURCE.** Chelsea pastes raw FB group posts here.
When she drops a new post: parse → save to data file → deploy.
DO NOT just reply in the channel without saving data.

### Dumps Received So Far
| Date | Topic | Raw File | Integrated? |
|------|-------|----------|-------------|
| 2026-03-25 | Chicken Salad | `data/fb-dumps/chicken-salad-raw.txt` | ✅ live |
| 2026-03-25 | Sushi | `data/fb-dumps/sushi-raw.txt` | ✅ live |
| 2026-03-25 | Mexican Food + Birria | `data/fb-dumps/mexican-food-raw.txt` | ✅ live |
| 2026-03-25 | Seafood Gumbo | `data/fb-dumps/seafood-gumbo-raw.txt` | ✅ live |
| 2026-03-25 | Crawfish Dine-In | (from Discord, in community-recs.json) | ✅ live |

### Key Business Notes
- **Cade's Market (St. Martinville)** = Chelsea's family store. Always feature prominently.
- **Fuji Sushi House** = Temporarily closed. Note on site.

## Pages & What Feeds Them
| Page | Data Source | Status |
|------|-----------|--------|
| /cajun-connection | `data/cajun-connection.json` + `src/lib/cajun-connection.ts` | ✅ |
| /whos-got-it | `data/whos-got-it.json` + soon `data/community-recs.json` | 🔧 |
| /crawfish | `data/crawfish-prices.json` + `data/crawfish-season.json` | ✅ |
| /kids-eat-free | `data/kids-eat-free.json` | ✅ |
| /live-music | `data/live-music.json` | ✅ |
| /weekend-brunch | `data/weekend-brunch.json` | ✅ |
| /happy-hours | `data/happy-hours.json` | ✅ |
| /daily-specials | `data/daily-specials.json` | ✅ |
| /late-night | `data/late-night.json` | ✅ |
| /food-trucks | `data/food-trucks.json` | ✅ |
| /date-night | `data/date-night.json` | ✅ |
| /explore | aggregates multiple sources | ✅ |

## Luna Dashboard Analytics Panel (2026-03-26)
- **Page:** `/geauxfind` route in luna-dashboard at http://localhost:3003
- **File:** `luna-dashboard/src/pages/GeauxFindPage.tsx`
- **API endpoint:** `GET /api/geauxfind/analytics` (added to `luna-dashboard/server/index.js`)
- **Shows:** Total places (742), events (31), Cajun Connection (100), deals (24), section entries (246)
- **Category breakdown:** animated bar chart (food 320, outdoors 131, finds 107, music 98, shopping 54, events 32)
- **New sections grid:** 12 section cards with counts
- **Supabase status:** shows connected (Pro plan env vars present)
- **Quick links:** geauxfind.com, GitHub, Vercel, Supabase console
- **Nav:** "🦐 GeauxFind" added to sidebar BUSINESSES group

## Header (Updated 2026-03-26)
- Desktop nav now uses grouped discovery dropdowns:
  - Food & Drink: Happy Hours, Daily Specials, Late Night, Coffee, Breweries, Food Trucks, Brunch, Kids Eat Free
  - Things to Do: Live Music, Dance Halls, Festivals, Outdoor, Photo Spots, Date Night
- Top-level keeps: Who's Got It, Crawfish, Deals, Community (plus Home + Ask Geaux CTA)
- Mobile nav mirrors the same grouped sections
