# GeauxFind Data Source Research (Acadiana)

Generated: 2026-03-25

## Places & Businesses

1. **Yelp Fusion API**
- Script: `scripts/scrape-yelp.mjs`
- Output: `data/yelp.json`
- Key: `YELP_API_KEY`
- Notes: Yelp limits have changed across account generations; verify quota in Yelp dashboard.

2. **Foursquare Places API**
- Script: `scripts/scrape-foursquare.mjs`
- Output: `data/foursquare.json`
- Key: `FOURSQUARE_API_KEY`
- Notes: QPS throttles are documented; field access/quota depends on plan.

3. **Google Places API**
- Script: `scripts/scrape-google-places-enrich.mjs`
- Output: `data/google-places-enrichment.json`
- Key: `GOOGLE_PLACES_API_KEY`
- Notes: enriches phone/website/hours/photos + additional discovered places.

4. **TripAdvisor**
- Script: `scripts/scrape-tripadvisor.mjs`
- Output: `data/tripadvisor.json`
- Key: `TRIPADVISOR_API_KEY` (partner)
- Notes: official Content API is partnership-based; fallback link scraping included.

## Events

5. **DO337**
- Script: `scripts/scrape-do337.mjs`
- Output: `data/do337-events.json`

6. **LafayetteTravel Events**
- Script: `scripts/scrape-lafayette-travel-events.mjs`
- Output: `data/lafayette-travel-events.json`

7. **DevelopingLafayette Events**
- Script: `scripts/scrape-developing-lafayette-events.mjs`
- Output: `data/developing-lafayette-events.json`

8. **Facebook Events (Graph)**
- Script: `scripts/scrape-facebook-events-public.mjs`
- Output: `data/facebook-events-graph.json`
- Key: `FACEBOOK_GRAPH_TOKEN`
- Notes: broad event access may require app review + permissions.

9. **PredictHQ**
- Script: `scripts/scrape-predicthq.mjs`
- Output: `data/predicthq-events.json`
- Key: `PREDICTHQ_API_TOKEN`

10. **Ticketmaster Discovery API**
- Script: `scripts/scrape-ticketmaster.mjs`
- Output: `data/ticketmaster-events.json`
- Key: `TICKETMASTER_API_KEY`
- Notes: public keys are typically quota + QPS limited.

## Food & Dining Specific

11-14. **Crawfish app / menus / happy hour / food trucks**
- Script: `scripts/scrape-food-signals.mjs`
- Output: `data/food-signals.json`
- Notes: currently captures discovery links/signals; source-specific API connectors can be added next (DoorDash/Grubhub/SinglePlatform if credentials become available).

## Local Content

15. **Reddit (r/Acadiana, r/Lafayette)**
- Script: `scripts/scrape-reddit.mjs`
- Output: `data/reddit.json`

16. **Instagram feasibility**
- Script: `scripts/scrape-instagram-feasibility.mjs`
- Output: `data/instagram-feasibility.json`
- Notes: official hashtag discovery requires Meta Graph API scopes and app review.

17. **Local blogs**
- Script: `scripts/scrape-local-blogs.mjs`
- Output: `data/local-blogs.json`

18. **Google Trends**
- Script: `scripts/scrape-google-trends.mjs`
- Output: `data/google-trends.json`
- Notes: currently via public RSS; official API access availability may depend on enrollment/alpha access.

## Enrichment

- Script: `scripts/merge-sources.mjs`
- Inputs: `data/yelp.json`, `data/foursquare.json`, `data/google-places-enrichment.json`, `scripts/seed-data.json`
- Outputs:
  - updated `scripts/seed-data.json`
  - `data/merge-report.json` with conflicts
