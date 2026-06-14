/**
 * Money & date formatters. NGN-first, multi-currency aware.
 */

const CURRENCY_SYMBOL: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  KES: 'KSh',
  GHS: 'GH₵',
  ZAR: 'R',
}

const CURRENCY_LOCALE: Record<string, string> = {
  NGN: 'en-NG',
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'de-DE',
  KES: 'en-KE',
  GHS: 'en-GH',
  ZAR: 'en-ZA',
}

export function currencySymbol(code = 'NGN') {
  return CURRENCY_SYMBOL[code] ?? code + ' '
}

/** Default NGN formatter, no decimals when whole, 2dp otherwise. */
export function formatMoney(
  amount: number | string | null | undefined,
  currency = 'NGN',
  opts: { compact?: boolean; sign?: boolean; decimals?: 0 | 2 | 'auto' } = {},
) {
  const n = Number(amount ?? 0)
  const { compact, sign = false, decimals = 'auto' } = opts
  const sym = currencySymbol(currency)
  const locale = CURRENCY_LOCALE[currency] ?? 'en-NG'

  if (compact && Math.abs(n) >= 1000) {
    const abs = Math.abs(n)
    const [val, suf] =
      abs >= 1e9 ? [n / 1e9, 'B'] :
      abs >= 1e6 ? [n / 1e6, 'M'] :
      abs >= 1e3 ? [n / 1e3, 'K'] : [n, '']
    const formatted = val.toLocaleString(locale, { maximumFractionDigits: 1 })
    return `${sign && n > 0 ? '+' : ''}${sym}${formatted}${suf}`
  }

  const maxDp = decimals === 0 ? 0 : decimals === 2 ? 2 : (n % 1 === 0 ? 0 : 2)
  const formatted = Math.abs(n).toLocaleString(locale, {
    minimumFractionDigits: maxDp,
    maximumFractionDigits: maxDp,
  })
  const prefix = n < 0 ? '−' : sign && n > 0 ? '+' : ''
  return `${prefix}${sym}${formatted}`
}

/** Legacy alias used in old codepaths. */
export const formatNaira = (n: number | string) => formatMoney(n, 'NGN', { decimals: 2 })

export function formatPercent(p: number, decimals = 0) {
  return `${p > 0 ? '+' : ''}${p.toFixed(decimals)}%`
}

// ─── Dates ─────────────────────────────────────────────────
const monthShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const monthLong  = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function formatDate(date: string | Date, fmt: 'short' | 'long' | 'time' | 'rel' = 'short') {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''

  if (fmt === 'time') {
    return d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })
  }
  if (fmt === 'long') {
    return `${monthLong[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  }
  if (fmt === 'rel') return relativeDay(d)
  return `${monthShort[d.getMonth()]} ${d.getDate()}`
}

export function relativeDay(date: Date) {
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`
  if (diffDays >= 7 && diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${monthShort[date.getMonth()]} ${date.getDate()}`
}

export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
export function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
}
export function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}
export function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
