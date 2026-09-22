/**
 * Visitor globe backend — Cloudflare Worker.
 *
 * This runs on Cloudflare's edge, not on your machine and not on GitHub Pages.
 * GitHub Pages only serves static files, so it cannot receive a POST, persist
 * anything, or see the caller's location — hence a separate tiny backend.
 *
 * Cloudflare already resolves the caller's coarse location and hands it to the
 * Worker on `request.cf`, so no third-party IP-geolocation service is involved
 * and no raw IP address is ever stored.
 *
 * Privacy notes:
 *   - Raw IPs are never written to KV. They are only used, salted and hashed,
 *     to build a rotating per-day visitor id so repeat views are not counted
 *     twice. The hash cannot be reversed back to an address.
 *   - Coordinates are rounded to ~1 degree (roughly 100 km) before storage.
 *   - Raise MIN_PER_CELL to 2+ so a place only appears once at least that many
 *     distinct visitors share it, and no one is individually pinpointed.
 *
 * Routes:
 *   POST /visit     record this visit, return the current roster
 *   GET  /visitors  return the current roster without recording
 *
 * KV layout — the whole roster lives in ONE key so a page view costs a couple
 * of reads rather than one read per location, which matters on the free tier
 * (100k reads/day, 1k writes/day).
 *
 *   roster             { total, cells: { "lat:lon": { lat, lon, country, city, count } } }
 *   seen:<day>:<hash>  per-day dedupe marker, expires after 48h
 */

const MIN_PER_CELL = 1 // raise to 2+ to only show places with repeat visitors
const CELL = 1 // coordinate rounding, in degrees
const MAX_CELLS = 600 // keep the roster key small; least-visited are dropped

const cors = origin => ({
  'access-control-allow-origin': origin || '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
})

const json = (data, origin, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...cors(origin),
    },
  })

/** Only answer for sites you own. Empty ALLOWED_ORIGINS = allow all. */
function allowedOrigin(request, env) {
  const origin = request.headers.get('origin')
  if (!origin) return null
  const allow = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
  if (allow.length === 0) return origin
  return allow.includes(origin) ? origin : false
}

async function visitorHash(request, env) {
  const ip = request.headers.get('cf-connecting-ip') || ''
  const ua = request.headers.get('user-agent') || ''
  const day = new Date().toISOString().slice(0, 10)
  const salt = env.SALT || 'change-me'
  const buf = new TextEncoder().encode(`${salt}|${day}|${ip}|${ua}`)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(digest).slice(0, 12)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

const loadRoster = async env =>
  (await env.VISITORS.get('roster', 'json')) || { total: 0, cells: {} }

/** Shape the stored roster into what the globe draws. */
function publicRoster(roster) {
  const pins = Object.values(roster.cells)
    .filter(c => c.count >= MIN_PER_CELL)
    .map(({ lat, lon, country, city, count }) => ({ lat, lon, country, city, count }))
  const countries = new Set(pins.map(p => p.country).filter(Boolean)).size
  return { total: roster.total, countries, pins }
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env)
    if (origin === false) return new Response('Forbidden', { status: 403 })

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origin) })
    }

    const { pathname } = new URL(request.url)

    if (request.method === 'GET' && pathname === '/visitors') {
      return json(publicRoster(await loadRoster(env)), origin)
    }

    if (request.method === 'POST' && pathname === '/visit') {
      const cf = request.cf || {}
      const lat = Number(cf.latitude)
      const lon = Number(cf.longitude)
      const hasGeo = Number.isFinite(lat) && Number.isFinite(lon)
      const self = hasGeo
        ? { lat, lon, country: cf.country, city: cf.city, self: true }
        : undefined

      const day = new Date().toISOString().slice(0, 10)
      const seenKey = `seen:${day}:${await visitorHash(request, env)}`
      const [seen, roster] = await Promise.all([
        env.VISITORS.get(seenKey),
        loadRoster(env),
      ])

      if (seen) return json({ ...publicRoster(roster), self }, origin)

      // First view from this visitor today — count it.
      roster.total += 1
      if (hasGeo) {
        const key = `${Math.round(lat / CELL) * CELL}:${Math.round(lon / CELL) * CELL}`
        const cell = roster.cells[key] || {
          lat: Math.round(lat / CELL) * CELL,
          lon: Math.round(lon / CELL) * CELL,
          country: cf.country,
          city: cf.city,
          count: 0,
        }
        cell.count += 1
        roster.cells[key] = cell

        const keys = Object.keys(roster.cells)
        if (keys.length > MAX_CELLS) {
          const keep = keys
            .sort((a, b) => roster.cells[b].count - roster.cells[a].count)
            .slice(0, MAX_CELLS)
          roster.cells = Object.fromEntries(keep.map(k => [k, roster.cells[k]]))
        }
      }

      await Promise.all([
        env.VISITORS.put(seenKey, '1', { expirationTtl: 60 * 60 * 48 }),
        env.VISITORS.put('roster', JSON.stringify(roster)),
      ])

      return json({ ...publicRoster(roster), self }, origin)
    }

    return new Response('Not found', { status: 404, headers: cors(origin) })
  },
}
