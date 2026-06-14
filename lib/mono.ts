/**
 * Thin wrapper around Mono's REST API for token exchange + sync.
 * Stubbed when MONO_SECRET_KEY is missing so the UI still works.
 */

const API = 'https://api.withmono.com'

function key() {
  return process.env.MONO_SECRET_KEY ?? null
}

export function isMonoConfigured() {
  return !!key()
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const sk = key()
  if (!sk) throw new Error('Mono is not configured (set MONO_SECRET_KEY)')
  const res = await fetch(API + path, {
    ...init,
    headers: {
      'mono-sec-key': sk,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Mono ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

export interface MonoAuthResponse { id: string }
export interface MonoAccountResponse {
  account: {
    _id: string
    institution: { name: string; bankCode?: string; type?: string }
    name: string
    accountNumber: string
    type: string
    balance: number
    currency: string
  }
}
export interface MonoTransaction {
  _id: string
  amount: number
  date: string
  narration: string
  type: 'debit' | 'credit'
  category?: string
  balance?: number
}

export async function exchangeAuthCode(code: string) {
  return call<MonoAuthResponse>('/account/auth', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

export async function fetchMonoAccount(id: string) {
  return call<MonoAccountResponse>(`/accounts/${id}`)
}

export async function fetchMonoTransactions(id: string, opts: { start?: string; end?: string; paginate?: boolean } = {}) {
  const qs = new URLSearchParams()
  if (opts.start) qs.set('start', opts.start)
  if (opts.end) qs.set('end', opts.end)
  if (opts.paginate) qs.set('paginate', 'true')
  return call<{ data: MonoTransaction[] }>(`/accounts/${id}/transactions?${qs.toString()}`)
}
