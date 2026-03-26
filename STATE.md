# GeauxFind — Project State
*Luna: READ THIS EVERY SESSION before touching GeauxFind. No exceptions.*
*Last updated: 2026-03-26 5:39 PM CT*

## Live Site
- **URL:** https://geauxfind.com
- **Deploy:** `cd /Users/luna/.openclaw/workspace/geauxfind && npx vercel --prod --yes`
- **Vercel account:** Separate free account (NOT Chelsea's Pro)
- **Git push does NOT auto-deploy.** Must run Vercel CLI manually.

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

## Header (Updated 2026-03-26)
- Desktop nav now uses grouped discovery dropdowns:
  - Food & Drink: Happy Hours, Daily Specials, Late Night, Coffee, Breweries, Food Trucks, Brunch, Kids Eat Free
  - Things to Do: Live Music, Dance Halls, Festivals, Outdoor, Photo Spots, Date Night
- Top-level keeps: Who's Got It, Crawfish, Deals, Community (plus Home + Ask Geaux CTA)
- Mobile nav mirrors the same grouped sections
