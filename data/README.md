# Guides Data Migration

As of this refactor, curated guide content is centralized in:

- `data/guides.json`

## Unified Guide Categories

- happy-hour
- daily-special
- late-night
- food-truck
- date-night
- brewery
- coffee
- farmers-market
- festival
- outdoor
- dance-hall
- photo-spot
- kids-eat-free
- weekend-brunch
- live-music
- whos-got-it

## Deprecated (kept as backup)

The following files are **deprecated** and retained only for backup/reference during migration:

- `happy-hours.json`
- `daily-specials.json`
- `late-night.json`
- `food-trucks.json`
- `date-night.json`
- `breweries.json`
- `coffee-shops.json`
- `farmers-markets.json`
- `festivals.json`
- `outdoor.json`
- `dance-halls.json`
- `photo-spots.json`
- `kids-eat-free.json`
- `weekend-brunch.json`
- `live-music.json`
- `whos-got-it.json`

New UI/API code should read from `guides.json` only.
