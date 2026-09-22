import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Flex, HStack, Text, useColorMode } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useLocalizedData } from '@/hooks/useLocalizedData'
import { terminalPalette } from '@/config/theme'
import { landPoints } from './worldMask'

/* ── Types ─────────────────────────────────────────────────────── */
interface Pin {
  lat: number
  lon: number
  country?: string
  city?: string
  count?: number
  self?: boolean
}

interface VisitorStats {
  total: number
  countries: number
  pins: Pin[]
  self?: Pin
}

/* ── Geometry ──────────────────────────────────────────────────── */
const DEG = Math.PI / 180

/** Unit-sphere coordinates, y up, with lon 0 facing the viewer at spin 0. */
const toSphere = (lon: number, lat: number) => {
  const p = lat * DEG
  const l = lon * DEG
  return { x: Math.cos(p) * Math.sin(l), y: Math.sin(p), z: Math.cos(p) * Math.cos(l) }
}

const TILT = -20 * DEG // lean the north pole towards the viewer

const VisitorGlobe: React.FC = () => {
  const { t } = useTranslation()
  const { colorMode } = useColorMode()
  const isDark = colorMode === 'dark'
  const { siteConfig } = useLocalizedData()

  const cfg = (siteConfig as Record<string, unknown>).visitorGlobe as
    | { endpoint?: string }
    | undefined
  const endpoint = cfg?.endpoint?.replace(/\/$/, '')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stats, setStats] = useState<VisitorStats | null>(null)
  const [hover, setHover] = useState<Pin | null>(null)

  const land = useMemo(() => landPoints().map(p => ({ ...toSphere(p.lon, p.lat) })), [])

  /* ── Record this visit, then read the roster back ───────────── */
  useEffect(() => {
    if (!endpoint) return
    let cancelled = false
    fetch(`${endpoint}/visit`, { method: 'POST' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(d => { if (!cancelled) setStats(d) })
      .catch(() => { /* the globe still spins without data */ })
    return () => { cancelled = true }
  }, [endpoint])

  /* ── Draw loop ──────────────────────────────────────────────── */
  const statsRef = useRef<VisitorStats | null>(null)
  statsRef.current = stats
  const hitsRef = useRef<{ x: number; y: number; pin: Pin }[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const dotColor = isDark ? 'rgba(136,192,208,' : 'rgba(42,118,156,'
    const pinColor = terminalPalette.rainbow?.[0] ?? '#bf616a'
    const selfColor = isDark ? '#a3be8c' : '#36805a'

    let raf = 0
    let spin = 0
    let last = performance.now()

    const render = (now: number) => {
      const dt = Math.min(now - last, 100)
      last = now
      if (!reduced) spin += dt * 0.00012

      const dpr = window.devicePixelRatio || 1
      const size = canvas.clientWidth
      if (canvas.width !== size * dpr) {
        canvas.width = size * dpr
        canvas.height = size * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)

      const cx = size / 2
      const cy = size / 2
      const R = size * 0.46
      const cosT = Math.cos(TILT)
      const sinT = Math.sin(TILT)
      const cosS = Math.cos(spin)
      const sinS = Math.sin(spin)

      // Rotate about the polar axis, then tilt towards the viewer.
      const project = (p: { x: number; y: number; z: number }) => {
        const x = p.x * cosS + p.z * sinS
        const z0 = -p.x * sinS + p.z * cosS
        const y = p.y * cosT - z0 * sinT
        const z = p.y * sinT + z0 * cosT
        return { sx: cx + x * R, sy: cy - y * R, z }
      }

      // Land dots — fade with depth, hide the far hemisphere.
      const r = Math.max(1, size / 190)
      for (let i = 0; i < land.length; i++) {
        const { sx, sy, z } = project(land[i])
        if (z <= 0.03) continue
        ctx.fillStyle = `${dotColor}${(0.18 + z * 0.62).toFixed(3)})`
        ctx.fillRect(sx - r / 2, sy - r / 2, r, r)
      }

      // Visitor pins.
      const s = statsRef.current
      const hits: { x: number; y: number; pin: Pin }[] = []
      const pulse = 0.6 + 0.4 * Math.sin(now * 0.003)
      const drawPin = (pin: Pin, color: string, scale: number) => {
        const { sx, sy, z } = project(toSphere(pin.lon, pin.lat))
        if (z <= 0.02) return
        hits.push({ x: sx, y: sy, pin })
        const rad = (size / 90) * scale
        ctx.globalAlpha = 0.22 * z * pulse
        ctx.beginPath()
        ctx.arc(sx, sy, rad * 2.6, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.globalAlpha = Math.min(1, 0.45 + z * 0.55)
        ctx.beginPath()
        ctx.arc(sx, sy, rad, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.globalAlpha = 1
      }
      s?.pins?.forEach(p => drawPin(p, pinColor, 1))
      if (s?.self) drawPin(s.self, selfColor, 1.35)
      hitsRef.current = hits

      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [land, isDark])

  /* ── Hover read-out ─────────────────────────────────────────── */
  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    let best: Pin | null = null
    let bestD = 14
    for (const h of hitsRef.current) {
      const d = Math.hypot(h.x - mx, h.y - my)
      if (d < bestD) { bestD = d; best = h.pin }
    }
    setHover(best)
  }

  const label = (p: Pin) => [p.city, p.country].filter(Boolean).join(', ') || '—'
  const termText = isDark ? '#d8dee9' : '#4c566a'
  const termDim = isDark ? '#8b949e' : '#6c757d'

  return (
    <Flex direction="column" align="center" w="full" fontFamily="mono">
      <Box
        as="canvas"
        ref={canvasRef as never}
        w={['220px', '260px', '300px']}
        h={['220px', '260px', '300px']}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        sx={{ touchAction: 'none' }}
      />

      <Box minH="18px" mt={1}>
        <Text fontSize="2xs" color={termDim}>
          {hover ? `// ${label(hover)}${hover.count && hover.count > 1 ? ` ×${hover.count}` : ''}` : ''}
        </Text>
      </Box>

      <HStack spacing={2} fontSize="xs" color={termText} mt={1} flexWrap="wrap" justify="center">
        <Text color={termDim}>[</Text>
        <Text>
          <Text as="span" fontWeight="bold">{stats ? stats.total.toLocaleString() : '—'}</Text>{' '}
          <Text as="span" color={termDim}>{t('visitors.visitors', 'visitors')}</Text>
        </Text>
        <Text color={termDim}>·</Text>
        <Text>
          <Text as="span" fontWeight="bold">{stats ? stats.countries : '—'}</Text>{' '}
          <Text as="span" color={termDim}>{t('visitors.countries', 'countries')}</Text>
        </Text>
        <Text color={termDim}>]</Text>
      </HStack>
    </Flex>
  )
}

export default VisitorGlobe
