# GeauxFind — Project State
*Luna: READ THIS EVERY SESSION before touching GeauxFind. No exceptions.*
*Last updated: 2026-03-25 1:17 PM CT*

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

### ✅ Just Shipped (2026-03-25)
- `data/community-recs.json` — 87 businesses, 571 mentions, 5 topics from FB dumps
- Who's Got It page now shows Community Rankings panel per topic
- Topics: Chicken Salad (25), Sushi (21), Mexican (14), Seafood Gumbo (17), Crawfish Dine-In (10)

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
| /explore | aggregates multiple sources | ✅ |

## Header (Updated 2026-03-25)
- 5 top-level items: Home, Explore (dropdown), Plan, Community, Cajun Connection
- Explore dropdown: Explore, Who's Got It, Kids Eat Free, Live Music, Brunch, Crawfish
- No emoji in nav labels
- Mobile: full 10-item vertical list
