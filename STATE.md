# GeauxFind — Project State
*Luna: READ THIS EVERY SESSION before touching GeauxFind. No exceptions.*
*Last updated: 2026-03-29 11:10 PM CT*

## Real Data Pipelines Upgrade (2026-03-29)

### ✅ New weekend events aggregator
- Added `scripts/scrape-weekend-events.js` to collect real events from free/public sources:
  - Eventbrite API (uses `EVENTBRITE_API_TOKEN` if provided)
  - Facebook public pages/events (cached HTML scrape)
  - Do337 public listing scrape
  - KRVS public site scrape
- Writes normalized output to `data/weekend-events.json` with schema:
  - `{ events: [{ title, date, venue, address, description, source, url, category }] }`
- Includes date-window filtering for this weekend + next 7 days and title-similarity dedupe.
- Added script command: `npm run scrape:weekend-events`

### ✅ Real weather API route
- Added `src/app/api/weather/route.ts`
- Uses Open-Meteo Lafayette endpoint (no key): 3-day daily max/min/precip forecast
- Returns formatted weather payload for Lafayette, LA
- 1-hour in-memory cache + Next fetch revalidation

### ✅ Real local specials verification pipeline
- Added `scripts/scrape-specials.js`
- Reads restaurants from `scripts/seed-data.json` and deals from `data/deals.json`
- Performs web search evidence checks (Brave API when key exists; DuckDuckGo fallback)
- Verifies specials with scoring and writes to `data/verified-deals.json`
- Unverified items are explicitly marked `"verified": false`
- Added script command: `npm run scrape:specials`

### ✅ Real Reddit local API route
- Added `src/app/api/reddit-local/route.ts`
- Pulls hot posts from:
  - `r/Acadiana`
  - `r/lafayette`
- Filters to food/restaurants/events/things-to-do relevance keywords
- Returns top ranked relevant posts
- Adds 30-minute in-memory cache + Next fetch revalidation

### ✅ Neighborhood assignment pipeline
- Added `scripts/assign-neighborhoods.js`
- Uses zip (primary) + street/city heuristics (secondary) to assign neighborhood labels:
  - Downtown Lafayette, River Ranch, Youngsville, Broussard, Scott, Breaux Bridge, Carencro, North Lafayette, Oil Center, Freetown/Port Rico, Other / Unassigned
- Script was executed and `scripts/seed-data.json` now includes `neighborhood` on all records (742 places)
- Added script command: `npm run assign:neighborhoods`

### ✅ Open-now utility library
- Added `src/lib/open-now.ts`
- Exports:
  - `isOpenNow(hours)`
  - `getNextOpenTime(hours)`
- Handles common/edge formats:
  - standard day/time ranges
  - 24-hour entries
  - closed days
  - missing hours
  - overnight ranges crossing midnight

### ✅ Build verification
- `npx next build` passes with new routes/scripts in place.

## Supabase Schema + Seed + API Migration (2026-03-28)

### ✅ Schema migration rebuilt
- Replaced `supabase/migrations/001_initial_schema.sql` with full schema for all typed tables:
  - `profiles`, `places`, `events`, `recipes`, `reviews`, `best_of_lists`, `questions`, `answers`, `intake_dumps`, `crawfish_prices`, `live_music_venues`
- Added new `newsletter_subscribers` table.
- Added slug/email/date/place_id indexes and a GIN full-text index using generated `places.fts` tsvector.
- Added `updated_at` trigger function + triggers for mutable tables.
- Enabled RLS on all tables with policies for:
  - anon read (`places`, `events`, `recipes`, `crawfish_prices`, `live_music_venues`, `best_of_lists`)
  - authenticated community flow (`reviews`, `questions`, `answers`)
  - `service_role` full access on all tables
- Converted `supabase/migrations/002_rls_policies.sql` to a no-op because RLS is now consolidated in 001.

### ✅ Seeder rebuilt (`scripts/seed-supabase.mjs`)
- Rewrote seeder to use `@supabase/supabase-js` + service role env vars.
- Reads and maps:
  - `data/places/*.json` (with fallback to `scripts/seed-data.json`)
  - `data/events.json` and `data/events/*.json`
  - `data/recipes.json` (if present)
  - `data/crawfish-prices.json`
  - `data/community-recs.json` → `best_of_lists`
  - `data/live-music.json` → `live_music_venues`
- Uses idempotent `upsert(..., { onConflict: 'slug' })`.
- Added `--only <target>` support matching package scripts.
- Final log format: `Seeded X places, Y events, ...`.

### ✅ API updates
- `src/app/api/newsletter/route.ts`
  - now writes to Supabase `newsletter_subscribers`
  - keeps JSON fallback (`data/newsletter-subscribers.json`) if Supabase write fails
- `src/app/api/community/ingest/route.ts`
  - still writes `data/community-recs.json`
  - now also inserts into `intake_dumps` (best effort, logs on failure)

### ✅ Build status
- `npm run build` passes clean after updates.

## Discord Dump Auto-Ingest Pipeline (2026-03-28)

### ✅ Shared parser extracted
- Added `src/lib/dump-parser.ts` as the single parsing engine used by both API and scripts.
- Moved FB dump parsing + mention counting logic into shared exports (`topicFromInput`, `topicFromDumpFilename`, `upsertTopicFromContent`, etc.).
- Parser now explicitly handles edge cases:
  - empty content (returns zero segments / zero matches)
  - no known business matches
  - duplicate topic upserts (topic is updated by slug, not duplicated)

### ✅ New ingest API route
- Added `POST /api/community/ingest` at `src/app/api/community/ingest/route.ts`
- Request body: `{ topic, content, source? }`
- Requires `x-api-key` header matching `GEAUXFIND_INGEST_KEY`
- Reads/writes `data/community-recs.json` and returns:
  - `{ success: true, topic, placesFound, newMentions }`

### ✅ Script compatibility preserved
- Refactored `scripts/parse-fb-dumps.mjs` to consume `src/lib/dump-parser.ts`
- Existing CLI flags still work: `--dry-run`, `--file`, `--verbose`
- Existing output structure in `data/community-recs.json` remains compatible

### ✅ New Discord watcher script
- Added `scripts/discord-dump-watcher.mjs`
- Usage:
  - `node scripts/discord-dump-watcher.mjs --topic "best boudin" --text "..."`
- Calls ingest endpoint (`GEAUXFIND_INGEST_URL` or `http://localhost:3000/api/community/ingest`)
- Uses `GEAUXFIND_INGEST_KEY` (or `--api-key`) for auth

### ✅ Env placeholder added
- Added `.env.local.example` with:
  - `GEAUXFIND_INGEST_KEY`
  - optional `GEAUXFIND_INGEST_URL`

### Build status
- `npm run build` passes (TypeScript clean)
- Existing unrelated `<img>` lint warnings remain unchanged

## Business Claim Portal (2026-03-26)

### ✅ New claim pages shipped
- `/claim` rebuilt as business-claim search portal using **all 742 places** from `scripts/seed-data.json`
  - Hero copy: “Own a business in Acadiana? Claim your free listing.”
  - Live search/filter by name/city/cuisine/address
  - Results render business cards + **Claim This Business** CTA to `/claim/[slug]`
  - “Don’t see your business? Add it!” CTA to `/claim/new`
- `/claim/[slug]` added as a 4-step claim flow:
  1) verification,
  2) listing updates (logo/cover upload fields, description, hours, website, social links),
  3) first deal/special,
  4) plan choice (Free vs Premium $29/mo preview)
- `/claim/[slug]/confirmation` added with “We’ll review your claim within 24 hours” message
- `/claim/new` added full new-business submission form
- `/claim/premium` added pricing preview page:
  - Free ($0), Premium ($29/mo), Featured ($99/mo)
  - premium/featured cards show **Coming Soon** badges
  - includes waitlist email capture UI

### ✅ New API routes shipped
- `POST /api/claims`
  - validates required claim fields
  - prevents duplicate pending claims for same slug
  - saves to `data/claims.json`
- `GET /api/claims/check?slug=xxx`
  - returns `{ slug, claimed }` based on pending claims
- `POST /api/submissions`
  - saves new-business submissions to `data/submissions.json`

### ✅ Data files initialized
- `data/claims.json` (empty array seed)
- `data/submissions.json` (empty array seed)

### ✅ Navigation / business-page updates
- Footer now includes **Claim Your Business** link to `/claim`
- Added subtle CTA banner on `/business/[slug]`:
  - “Is this your business? Claim it free” linking to `/claim/[slug]`

### Build status
- `npm run build` passes with 0 TypeScript errors
- Existing pre-existing `<img>` lint warnings remain in unrelated files

## Live Site
- **URL:** https://geauxfind.com
- **Deploy:** `cd /Users/luna/.openclaw/workspace/geauxfind && npx vercel --prod --yes`
- **Vercel account:** Separate free account (NOT Chelsea's Pro)
- **Git push does NOT auto-deploy.** Must run Vercel CLI manually.

## Consolidated Guides Refactor (2026-03-26)

### ✅ Unified architecture shipped
- Added `data/guides.json` with **324 normalized entries** across 16 guide categories:
  - happy-hour, daily-special, late-night, food-truck, date-night
  - brewery, coffee, farmers-market, festival, outdoor, dance-hall, photo-spot
  - kids-eat-free, weekend-brunch, live-music, whos-got-it
- Added `src/components/guides/GuideDirectory.tsx` reusable directory UI (search + grouping + cards + empty states)
- Added `src/components/guides/GuidePage.tsx` shared page wrapper
- Added `src/lib/guide-config.ts` as the config source of truth for categories, paths, nav labels/icons, and grouping behavior
- Added dynamic API endpoint: `src/app/api/guides/route.ts`
  - supports `?category=<slug>` and/or `?group=food-drink|things-to-do`
- Replaced **16 guide pages** with thin wrappers using config + shared directory:
  - `/happy-hours`, `/daily-specials`, `/late-night`, `/food-trucks`, `/date-night`
  - `/breweries`, `/coffee`, `/farmers-markets`, `/festivals`, `/outdoor`, `/dance-halls`, `/photo-spots`
  - `/kids-eat-free`, `/weekend-brunch`, `/live-music`, `/whos-got-it`
- Updated `SiteHeader.tsx` to use guide config for Food & Drink + Things to Do nav sections (no hardcoded guide arrays)

### ✅ Deprecated/removed
- Removed legacy per-guide directory components in `src/components/food-guides/*`
- Removed old specialized guide components:
  - `src/components/music/LiveMusicDirectory.tsx`
  - `src/components/kids/KidsEatFreeDirectory.tsx`
  - `src/components/brunch/WeekendBrunchDirectory.tsx`
- Removed old per-guide API routes:
  - `/api/happy-hours`, `/api/daily-specials`, `/api/late-night`, `/api/food-trucks`, `/api/date-night`
  - `/api/breweries`, `/api/coffee`, `/api/farmers-markets`, `/api/festivals`, `/api/outdoor`, `/api/dance-halls`, `/api/photo-spots`
- Kept all original JSON data files as backups and added migration note: `data/README.md`

### Build status
- `npm run build` passes (0 errors). Existing unrelated `<img>` lint warnings remain in non-guide files.

## Data Pipeline Status

### ✅ Working
- `data/cajun-connection.json` — 42 businesses, 12 fluencers, 15 categories (merged 2026-03-25)
- `data/events.json` — event data
- `data/whos-got-it.json` — 12 items (original seed data)
- `data/crawfish-prices.json` — crawfish pricing
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
