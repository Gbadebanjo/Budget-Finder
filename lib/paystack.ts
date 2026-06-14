/**
 * Thin Paystack REST wrapper. Stubbed when PAYSTACK_SECRET_KEY missing.
 */
const API = 'https://api.paystack.co'

export function isPaystackConfigured() {
  return !!process.env.PAYSTACK_SECRET_KEY
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const sk = process.env.PAYSTACK_SECRET_KEY
  if (!sk) throw new Error('Paystack not configured (PAYSTACK_SECRET_KEY)')
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${sk}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.status) {
    throw new Error(json.message || `Paystack ${res.status}`)
  }
  return json.data as T
}

export function initializeTransaction(opts: {
  email: string
  amount: number // in kobo
  metadata?: Record<string, unknown>
  callback_url?: string
  plan?: string
}) {
  return call<{ authorization_url: string; access_code: string; reference: string }>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify(opts),
  })
}

export function verifyTransaction(reference: string) {
  return call<{ status: string; amount: number; customer: { email: string }; metadata: Record<string, unknown> }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  )
}
