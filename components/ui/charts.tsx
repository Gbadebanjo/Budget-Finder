'use client'

import { cn } from '@/lib/cn'
import { useId, useState } from 'react'
import { formatMoney, formatDate } from '@/lib/format'

const STROKE = 'var(--accent)'
const STROKE_DOWN = 'var(--money-down)'
const STROKE_UP = 'var(--money-up)'

// ────────────────────────────────────────────────────────────
// Sparkline — tiny inline line chart
// ────────────────────────────────────────────────────────────
export function Sparkline({
  data,
  width = 120,
  height = 36,
  stroke = STROKE,
  fill = true,
  className,
}: {
  data: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: boolean
  className?: string
}) {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className={cn('rounded bg-surface-alt', className)} />
  }
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2
  const step = (width - pad * 2) / (data.length - 1)

  const pts = data.map((v, i) => {
    const x = pad + i * step
    const y = pad + (1 - (v - min) / range) * (height - pad * 2)
    return [x, y] as const
  })
  const path = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${path} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`
  const id = useId()

  return (
    <svg width={width} height={height} className={cn('overflow-visible', className)}>
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${id})`} />
        </>
      )}
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ────────────────────────────────────────────────────────────
// AreaChart — responsive area chart with hover tooltip
// ────────────────────────────────────────────────────────────
type AreaPoint = { x: string | Date; y: number }
export function AreaChart({
  data,
  height = 240,
  currency = 'NGN',
  stroke = STROKE,
  showGrid = true,
}: {
  data: AreaPoint[]
  height?: number
  currency?: string
  stroke?: string
  showGrid?: boolean
}) {
  const [hover, setHover] = useState<number | null>(null)
  const id = useId()
  if (!data || data.length < 2) {
    return <div style={{ height }} className="rounded-xl bg-surface-alt grid place-items-center text-xs text-subtle">No data yet</div>
  }

  const W = 800
  const H = height
  const padL = 50
  const padR = 12
  const padT = 16
  const padB = 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const ys = data.map(d => d.y)
  const yMin = Math.min(...ys, 0)
  const yMax = Math.max(...ys)
  const range = yMax - yMin || 1

  const x = (i: number) => padL + (i * innerW) / (data.length - 1)
  const y = (v: number) => padT + (1 - (v - yMin) / range) * innerH

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(d.y).toFixed(2)}`).join(' ')
  const area = `${path} L${x(data.length - 1)},${y(yMin)} L${x(0)},${y(yMin)} Z`

  const ticks = 4
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => yMin + (range * i) / ticks)

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-full"
        onMouseMove={e => {
          const rect = (e.target as SVGSVGElement).getBoundingClientRect()
          const px = ((e.clientX - rect.left) / rect.width) * W
          const idx = Math.max(0, Math.min(data.length - 1, Math.round(((px - padL) / innerW) * (data.length - 1))))
          setHover(idx)
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.32" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {showGrid && yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--border-soft)" strokeWidth="1" />
            <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--text-subtle)">
              {formatMoney(t, currency, { compact: true, decimals: 0 })}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${id})`} />
        <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="var(--border)" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(data[hover].y)} r="4" fill={stroke} stroke="var(--surface)" strokeWidth="2" />
          </g>
        )}

        {/* X labels: first, last, ~4 between */}
        {[0, Math.floor(data.length * 0.25), Math.floor(data.length * 0.5), Math.floor(data.length * 0.75), data.length - 1].map(i => (
          <text key={i} x={x(i)} y={H - 8} fontSize="10" textAnchor="middle" fill="var(--text-subtle)">
            {formatDate(typeof data[i].x === 'string' ? data[i].x : (data[i].x as Date), 'short')}
          </text>
        ))}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute glass-strong rounded-lg px-3 py-2 text-xs"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            top: 8,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-muted">{formatDate(typeof data[hover].x === 'string' ? data[hover].x : (data[hover].x as Date), 'long')}</div>
          <div className="font-semibold tabular">{formatMoney(data[hover].y, currency)}</div>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// WaterfallChart — income vs spend per period
// ────────────────────────────────────────────────────────────
type WaterfallBucket = { label: string; income: number; spend: number }
export function WaterfallChart({
  data,
  height = 240,
  currency = 'NGN',
}: { data: WaterfallBucket[]; height?: number; currency?: string }) {
  if (!data?.length) return <div style={{ height }} className="rounded-xl bg-surface-alt grid place-items-center text-xs text-subtle">No data</div>

  const W = 800
  const H = height
  const padL = 50, padR = 12, padT = 12, padB = 30
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const max = Math.max(...data.flatMap(d => [d.income, d.spend]))
  const niceMax = max === 0 ? 1 : Math.ceil(max / 1000) * 1000

  const groupW = innerW / data.length
  const barW = Math.min(18, groupW / 3.2)

  const y = (v: number) => padT + (1 - v / niceMax) * innerH

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={padT + innerH * (1 - p)} y2={padT + innerH * (1 - p)} stroke="var(--border-soft)" />
          <text x={padL - 6} y={padT + innerH * (1 - p) + 4} fontSize="10" textAnchor="end" fill="var(--text-subtle)">
            {formatMoney(niceMax * p, currency, { compact: true, decimals: 0 })}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = padL + groupW * i + groupW / 2
        return (
          <g key={i}>
            <rect
              x={cx - barW - 2} y={y(d.income)} width={barW} height={Math.max(2, innerH - (y(d.income) - padT))}
              rx="4" fill="var(--money-up)" opacity="0.85"
            />
            <rect
              x={cx + 2} y={y(d.spend)} width={barW} height={Math.max(2, innerH - (y(d.spend) - padT))}
              rx="4" fill="var(--money-down)" opacity="0.85"
            />
            <text x={cx} y={H - 8} fontSize="10" textAnchor="middle" fill="var(--text-subtle)">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ────────────────────────────────────────────────────────────
// DonutChart — category breakdown
// ────────────────────────────────────────────────────────────
type DonutSlice = { label: string; value: number; color: string }
export function DonutChart({
  data,
  size = 240,
  currency = 'NGN',
  centerLabel,
  centerValue,
}: {
  data: DonutSlice[]
  size?: number
  currency?: string
  centerLabel?: string
  centerValue?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return <div style={{ height: size }} className="rounded-xl bg-surface-alt grid place-items-center text-xs text-subtle">No spend yet</div>

  const r = size / 2
  const stroke = r * 0.28
  const inner = r - stroke / 2
  const c = 2 * Math.PI * inner

  let acc = 0
  const segments = data.map((d) => {
    const frac = d.value / total
    const dasharray = `${frac * c} ${c}`
    const dashoffset = -acc * c
    acc += frac
    return { ...d, dasharray, dashoffset, frac }
  })

  const top = [...data].sort((a, b) => b.value - a.value).slice(0, 6)

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={r} cy={r} r={inner} fill="none" stroke="var(--border-soft)" strokeWidth={stroke} />
          {segments.map((s, i) => (
            <circle
              key={i}
              cx={r}
              cy={r}
              r={inner}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-[10px] uppercase tracking-wider text-muted">{centerLabel ?? 'Total'}</div>
          <div className="text-xl font-semibold tabular">{formatMoney(centerValue ?? total, currency, { compact: true })}</div>
        </div>
      </div>
      <ul className="space-y-2 text-sm flex-1 min-w-50">
        {top.map((s, i) => {
          const pct = ((s.value / total) * 100).toFixed(0)
          return (
            <li key={i} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="flex-1 truncate">{s.label}</span>
              <span className="tabular text-muted text-xs">{pct}%</span>
              <span className="tabular font-medium">{formatMoney(s.value, currency, { compact: true })}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// HeatmapCalendar — GitHub-style daily spend intensity
// ────────────────────────────────────────────────────────────
export function HeatmapCalendar({
  data,
  weeks = 26,
  currency = 'NGN',
  endDate,
}: {
  data: { date: string; value: number }[]
  weeks?: number
  currency?: string
  /** ISO date (YYYY-MM-DD). When omitted, defaults to today. Pin this for SSR'd demos to avoid hydration mismatch. */
  endDate?: string
}) {
  const map = new Map(data.map(d => [d.date, d.value]))
  const max = Math.max(...data.map(d => d.value), 1)

  // Build dates from UTC-noon to dodge timezone-edge drift around midnight.
  const anchor = endDate
    ? new Date(`${endDate}T12:00:00Z`)
    : new Date(new Date().toISOString().slice(0, 10) + 'T12:00:00Z')

  const start = new Date(anchor)
  start.setUTCDate(anchor.getUTCDate() - (weeks * 7 - 1))
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())

  const cells: { iso: string; label: string; value: number }[][] = []
  for (let w = 0; w < weeks; w++) {
    const col: { iso: string; label: string; value: number }[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setUTCDate(start.getUTCDate() + w * 7 + d)
      const iso = date.toISOString().slice(0, 10)
      col.push({ iso, label: iso, value: map.get(iso) ?? 0 })
    }
    cells.push(col)
  }

  const cellSize = 12
  const gap = 3
  const W = weeks * (cellSize + gap)
  const H = 7 * (cellSize + gap) + 16

  const intensity = (v: number) => v === 0 ? 0 : 0.15 + (v / max) * 0.85

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} className="block">
        {cells.map((col, w) => col.map((cell, d) => {
          const op = intensity(cell.value)
          return (
            <rect
              key={`${w}-${d}`}
              x={w * (cellSize + gap)}
              y={d * (cellSize + gap)}
              width={cellSize}
              height={cellSize}
              rx={3}
              fill={cell.value === 0 ? 'var(--surface-alt)' : 'var(--accent)'}
              opacity={cell.value === 0 ? 1 : op}
            >
              {/*
                Tooltip is plain text only: Intl number formatting can drift
                between Node's ICU and the browser's ICU and trigger
                hydration mismatches on the landing page. The currency arg
                is kept on the prop so callers don't have to change.
              */}
              <title>{cell.label}</title>
            </rect>
          )
        }))}
        <text x={0} y={H - 2} fontSize="10" fill="var(--text-subtle)">Less</text>
        <text x={W - 24} y={H - 2} fontSize="10" fill="var(--text-subtle)">More</text>
      </svg>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// ProgressRing — budget / goal completion
// ────────────────────────────────────────────────────────────
export function ProgressRing({
  value,
  size = 60,
  stroke = 6,
  color,
  bg = 'var(--surface-alt)',
  children,
}: { value: number; size?: number; stroke?: number; color?: string; bg?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.min(Math.max(value, 0), 1)
  const dash = c * clamped

  const auto =
    value >= 1 ? 'var(--danger)' :
    value >= 0.8 ? 'var(--warning)' :
    'var(--accent)'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color ?? auto}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  )
}
