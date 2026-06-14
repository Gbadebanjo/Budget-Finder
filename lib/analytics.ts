/**
 * Pure transformations over Transaction[] for charts and tiles.
 * No I/O — easy to test, easy to swap.
 */
import type { Account, Category, Transaction } from './types'
import { toISODate } from './format'

export interface MonthBucket {
  key: string
  label: string
  income: number
  spend: number
  net: number
}

export function monthlyBuckets(txs: Transaction[], months = 6): MonthBucket[] {
  const now = new Date()
  const buckets: MonthBucket[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('en-NG', { month: 'short' })
    buckets.push({ key, label, income: 0, spend: 0, net: 0 })
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]))

  for (const t of txs) {
    if (t.is_transfer) continue
    const d = new Date(t.transaction_date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const i = idx.get(key)
    if (i === undefined) continue
    if (t.direction === 'credit') buckets[i].income += Number(t.amount)
    else buckets[i].spend += Number(t.amount)
  }
  for (const b of buckets) b.net = b.income - b.spend
  return buckets
}

/** Daily net-worth series from current account balances by replaying tx. */
export function netWorthSeries(
  accounts: Account[],
  txs: Transaction[],
  days = 90,
): { x: string; y: number }[] {
  const totalNow = accounts.reduce((s, a) => s + Number(a.current_balance), 0)
  const series: { x: string; y: number }[] = []
  const now = new Date()
  const dayMap = new Map<string, number>()

  for (const t of txs) {
    if (t.is_transfer) continue
    const key = t.transaction_date
    const delta = t.direction === 'credit' ? Number(t.amount) : -Number(t.amount)
    dayMap.set(key, (dayMap.get(key) ?? 0) + delta)
  }

  // Walk forward from oldest, but display oldest -> today
  let running = totalNow
  // Build last `days` days
  const todayKey = toISODate(now)
  const future = new Date(now)
  const past = new Date(now); past.setDate(now.getDate() - days)

  // We replay backward from today to get historical balances
  const dailyArr: { date: Date; iso: string; delta: number }[] = []
  for (let i = 0; i <= days; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const iso = toISODate(d)
    dailyArr.push({ date: d, iso, delta: dayMap.get(iso) ?? 0 })
  }

  // dailyArr[0] is today.  running = totalNow at end of today.
  // value AT START of day i = running − sum(delta of days < i, walking backward)
  let acc = running
  for (let i = 0; i < dailyArr.length; i++) {
    series.push({ x: dailyArr[i].iso, y: acc })
    acc -= dailyArr[i].delta
  }
  return series.reverse()
}

export interface CategorySlice { label: string; value: number; color: string; categoryId: string | null }
export function categoryBreakdown(
  txs: Transaction[],
  categories: Category[],
  opts: { direction?: 'debit' | 'credit'; sinceDays?: number } = {},
): CategorySlice[] {
  const { direction = 'debit', sinceDays = 30 } = opts
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - sinceDays)
  const cIso = toISODate(cutoff)

  const catMap = new Map(categories.map(c => [c.id, c]))
  const sums = new Map<string, number>()

  for (const t of txs) {
    if (t.direction !== direction) continue
    if (t.transaction_date < cIso) continue
    if (t.is_transfer) continue
    const k = t.category_id ?? 'uncategorised'
    sums.set(k, (sums.get(k) ?? 0) + Number(t.amount))
  }

  return Array.from(sums.entries())
    .map(([id, value]) => {
      const c = catMap.get(id)
      return {
        categoryId: c?.id ?? null,
        label: c?.name ?? 'Uncategorised',
        color: c?.color ?? '#94a3b8',
        value,
      }
    })
    .sort((a, b) => b.value - a.value)
}

export function dailyHeatmap(txs: Transaction[], days = 182): { date: string; value: number }[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const map = new Map<string, number>()
  for (const t of txs) {
    if (t.direction !== 'debit') continue
    if (t.is_transfer) continue
    if (new Date(t.transaction_date) < cutoff) continue
    map.set(t.transaction_date, (map.get(t.transaction_date) ?? 0) + Number(t.amount))
  }
  return Array.from(map.entries()).map(([date, value]) => ({ date, value }))
}

export function topMerchants(txs: Transaction[], limit = 5) {
  const map = new Map<string, { name: string; total: number; count: number }>()
  for (const t of txs) {
    if (t.direction !== 'debit' || t.is_transfer) continue
    const name = t.merchant?.name ?? t.description ?? 'Unknown'
    const prev = map.get(name) ?? { name, total: 0, count: 0 }
    prev.total += Number(t.amount)
    prev.count++
    map.set(name, prev)
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, limit)
}

export function totals(txs: Transaction[], sinceDays = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - sinceDays)
  const cIso = toISODate(cutoff)
  let income = 0
  let spend = 0
  let count = 0
  for (const t of txs) {
    if (t.is_transfer) continue
    if (t.transaction_date < cIso) continue
    if (t.direction === 'credit') income += Number(t.amount)
    else spend += Number(t.amount)
    count++
  }
  return { income, spend, net: income - spend, count }
}

export function percentDelta(curr: number, prev: number) {
  if (prev === 0) return curr === 0 ? 0 : 100
  return ((curr - prev) / Math.abs(prev)) * 100
}
