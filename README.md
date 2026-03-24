# GeauxFind

Cajun-themed, AI-curated local discovery hub for Acadiana, Louisiana.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- shadcn/ui-compatible setup (`components.json`, `cn` util, button primitive)
- Mock static data (Supabase-ready later)

## Run locally
```bash
npm install
npm run dev
```

## Pages
- `/`
- `/food`, `/events`, `/music`, `/recipes`, `/finds`
- `/place/[slug]`
- `/event/[slug]`
- `/recipe/[slug]`
- `/search`
- `/ask`
- `/this-weekend`
- `/about`

## Deploy
Optimized for Vercel. Includes:
- Open Graph metadata
- robots + sitemap
- `manifest.json` + service worker placeholder for PWA readiness
