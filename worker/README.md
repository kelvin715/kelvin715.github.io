# Visitor globe backend

A single Cloudflare Worker backing the rotating globe on the home page.

**This does not run on your machine and it cannot run on GitHub Pages.**
`wrangler deploy` uploads it to Cloudflare's edge network, which runs it 24/7
for free. GitHub Pages only serves static files, so it cannot receive a POST,
persist anything, or see the caller's location — that is why the globe needs
this separate piece.

Free tier: 100,000 requests/day, 100,000 KV reads/day and 1,000 KV writes/day.
A page view costs ~2 reads; only the *first* view from a given visitor on a
given day costs 2 writes. That works out to roughly 500 new visitors/day and
tens of thousands of page views/day before any limit is reached.

## Why Cloudflare

Cloudflare resolves the visitor's coarse location at the edge and hands it to
the Worker on `request.cf`. That means no third-party IP-geolocation API, no
API keys, and no raw IP address is ever stored.

## What is stored

| Key | Value |
| --- | --- |
| `roster` | `{ total, cells: { "lat:lon": { lat, lon, country, city, count } } }` |
| `seen:<day>:<hash>` | per-day dedupe marker, expires after 48h |

The whole roster lives in one key on purpose: a page view then costs two KV
reads instead of one read per location, which keeps it well inside the free
tier. Coordinates are rounded to ~1° (about 100 km).

Raw IPs are never written. They are only salted and hashed to build a rotating
per-day id so one person reloading the page is not counted repeatedly, and the
hash cannot be reversed. Coordinates are rounded to roughly 100 km.

## Deploy

```bash
cd worker
npx wrangler login
npx wrangler kv namespace create VISITORS   # copy the printed id
#   → paste it into wrangler.toml as kv_namespaces[0].id
npx wrangler secret put SALT                # any long random string
npx wrangler deploy
```

`wrangler deploy` prints a URL such as
`https://visitor-globe.<your-subdomain>.workers.dev`.

## Connect the site

Put that URL in `content/site.json` (and `content/zh/site.json`):

```json
"visitorGlobe": { "endpoint": "https://visitor-globe.<your-subdomain>.workers.dev" }
```

Leave it empty and the globe still renders and spins — it just shows no pins
and `—` for the counts.

## Options

- `ALLOWED_ORIGINS` in `wrangler.toml` — restrict which sites may call the
  Worker. Empty allows any origin.
- `MIN_PER_CELL` in `visitor-globe.js` — raise to `2` so a location only
  appears once at least two distinct visitors share it.
