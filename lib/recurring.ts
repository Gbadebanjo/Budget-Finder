/**
 * Detect recurring transactions: group by description token + amount band,
 * look for steady cadence (7d, 14d, 30d±3).
 */
import type { Transaction } from './types'

export interface RecurringDetection {
  signature: string
  description: string
  cadenceDays: number
  amount: number
  confidence: number
  lastDate: string
  nextDueOn: string
  occurrences: number
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 2 && !['the','and','for','from','transaction','transfer'].includes(w))
    .slice(0, 3)
    .join(' ')
}

export function detectRecurring(txs: Transaction[]): RecurringDetection[] {
  const groups = new Map<string, Transaction[]>()
  for (const t of txs) {
    if (t.direction !== 'debit') continue
    if (t.is_transfer) continue
    const sig = `${normalize(t.description || t.merchant?.name || '')}::${Math.round(Number(t.amount) / 50) * 50}`
    if (!groups.has(sig)) groups.set(sig, [])
    groups.get(sig)!.push(t)
  }

  const found: RecurringDetection[] = []
  for (const [sig, items] of groups) {
    if (items.length < 3) continue
    const sorted = items.sort((a, b) => +new Date(a.transaction_date) - +new Date(b.transaction_date))
    const gaps: number[] = []
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(Math.round((+new Date(sorted[i].transaction_date) - +new Date(sorted[i - 1].transaction_date)) / 86_400_000))
    }
    const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length
    const variance = gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length
    const sd = Math.sqrt(variance)

    if (mean < 5 || mean > 95) continue
    const cadence = [7, 14, 30].reduce((best, c) => Math.abs(c - mean) < Math.abs(best - mean) ? c : best, 30)
    const confidence = Math.max(0, Math.min(1, 1 - sd / cadence))
    if (confidence < 0.5) continue

    const last = sorted[sorted.length - 1]
    const nextDate = new Date(last.transaction_date)
    nextDate.setDate(nextDate.getDate() + cadence)

    found.push({
      signature: sig,
      description: last.description || last.merchant?.name || sig,
      cadenceDays: cadence,
      amount: Number(last.amount),
      confidence,
      lastDate: last.transaction_date,
      nextDueOn: nextDate.toISOString().slice(0, 10),
      occurrences: sorted.length,
    })
  }
  return found.sort((a, b) => b.confidence - a.confidence)
}

/** Naive cashflow forecast: project net daily change for the next N days. */
export function forecastCashflow(txs: Transaction[], days = 30) {
  const sample = txs.filter(t => !t.is_transfer)
  const oldest = sample.reduce<Date | null>((acc, t) => {
    const d = new Date(t.transaction_date)
    return !acc || d < acc ? d : acc
  }, null)
  const span = oldest ? Math.max(1, (Date.now() - +oldest) / 86_400_000) : 30
  const net = sample.reduce((s, t) => s + (t.direction === 'credit' ? Number(t.amount) : -Number(t.amount)), 0)
  const dailyAvg = net / span
  const points: { x: string; y: number }[] = []
  let running = 0
  for (let i = 1; i <= days; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    running += dailyAvg
    points.push({ x: d.toISOString().slice(0, 10), y: running })
  }
  return { dailyAvg, points }
}
