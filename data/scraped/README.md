# GeauxFind Scraped Data (Lafayette/Acadiana)

Generated: 2026-03-30 (UTC)

## Files Collected

- `eventbrite-events.json` — **5 events** from Eventbrite Lafayette listing
- `lafayette-travel-events.json` — **3 events/festival records** from Lafayette Travel event pages
- `krvs-events.json` — KRVS community calendar attempted; details not extractable via `web_fetch`
- `ul-lafayette-events.json` — **2 event titles** detected (limited extraction from UL calendar pages)
- `yelp-restaurants.json` — **4 Yelp restaurant records** + Advocate/Daily Advertiser/Lafayette Travel food sources
- `acadiana-news.json` — **5 headline records** (primarily KATC; The Advocate/KLFY with extraction limitations)
- `happy-hours.json` — **4 happy hour/specials leads** (Lafayette Travel + Reddit)
- `farmers-markets.json` — **2 market records** (Moncus Park + Breaux Bridge listing)
- `music-venues.json` — **6 venue records** (Blue Moon, Artmosphere, Wurst, Rock'n'Bowl, La Poussiere, Randol's)
- `reddit-recommendations.json` — compiled recommendations from **4 r/Acadiana threads**
- `outdoor-recreation.json` — **4 outdoor/activity records** (Acadiana Park, Vermilionville, Lake Martin tours)

## Data Quality Notes

1. **Web-fetch only constraint respected**: no browser automation used.
2. **Blocked / limited sites**:
   - Yelp blocks full page extraction without JS; used search snippets and partial records.
   - KRVS calendar and UL LiveWhale pages expose limited structured detail in readability output.
   - KLFY and some Advocate pages had extraction/paywall/rendering limits.
3. **Breadth-first collection**: prioritized broad source coverage and preserving source URLs for downstream enrichment.
4. **Schema consistency**: event objects include core fields where available (`name`, `date`, `time`, `venue`, `address`, `description`, `url`, `category`, `price`). Missing data is left null/omitted and noted.

## Next Enrichment Pass (recommended)

- Add API/browser-assisted extraction for KLFY/Advocate/Yelp full structured records.
- Normalize date/time formats and geocode addresses.
- Expand Eventbrite to full 30-day window with pagination.
- Pull full vendor directories and categories into normalized tables.
