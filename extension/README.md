# GeauxFind Thread Capture (Chrome Extension)

One-click capture of Facebook threads — including private groups you're a
member of — directly into `data/community-recs.json` on the GeauxFind site.

## Why this exists

The most valuable "best of" content (where can I find the best gumbo, bread
pudding, sushi, etc.) lives in private FB groups. Industrial scrapers can't
reach those. This extension uses **your already-logged-in browser** to
capture thread text, and POSTs it to GeauxFind's admin API — same TOS risk
profile as scrolling FB normally.

## Install (developer mode)

1. Open `chrome://extensions`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extension/` folder in this repo

## First-time setup

1. Click the GeauxFind icon in your toolbar
2. Paste your `ADMIN_TOKEN` (must match `process.env.ADMIN_TOKEN` on the deployed site)
3. Endpoint defaults to `https://geauxfind.vercel.app/api/admin/parse-thread` — change to `http://localhost:3000/...` for local dev
4. Click **Save**

## Use it

1. Open any FB thread (post + comments) — works in private groups too
2. Click the floating **Send to GeauxFind** button (bottom-right of any FB page)
3. Confirm the topic name (auto-suggested from "best X" patterns in the post)
4. Watch the toast — you'll get top 3 results inline

The data flows into `data/community-recs.json` and renders at
`https://geauxfind.vercel.app/best-of/<topic-slug>`.

## Privacy / safety

- The extension does NOT exfiltrate cookies, send data anywhere except your
  configured endpoint, or interact with FB beyond reading the visible page.
- It does not click, like, comment, or otherwise simulate behavior. It only
  reads `document.innerText` of the current view.
- Treat the admin token like a password — it gates writes to `community-recs.json`.

## Files

- `manifest.json` — MV3 manifest, scoped to `*.facebook.com` and the GeauxFind API
- `content.js` — injects the capture button on FB pages
- `background.js` — service worker that POSTs to the API (cross-origin)
- `popup.html` / `popup.js` — settings UI for token + endpoint
