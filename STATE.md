# GeauxFind — Project State
*Luna: READ THIS EVERY SESSION before touching GeauxFind. No exceptions.*
*Last updated: 2026-03-26 8:05 PM CT*

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
