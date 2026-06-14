import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/queries'
import { initializeTransaction, isPaystackConfigured } from '@/lib/paystack'
import { PLANS } from '@/lib/plans'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const ws = await getCurrentWorkspace()
  if (!ws) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  if (!isPaystackConfigured()) {
    return NextResponse.json({ error: 'Paystack not configured (PAYSTACK_SECRET_KEY)' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({})) as { plan?: string; cycle?: 'monthly' | 'yearly' }
  const plan = PLANS.find(p => p.id === body.plan)
  const cycle = body.cycle === 'yearly' ? 'yearly' : 'monthly'
  if (!plan || plan.id === 'free') return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const amountNaira = cycle === 'monthly' ? plan.monthly : plan.yearly
  const amountKobo = amountNaira * 100

  try {
    const data = await initializeTransaction({
      email: user.email!,
      amount: amountKobo,
      metadata: { workspace_id: ws.id, plan: plan.id, cycle },
      callback_url: new URL('/settings/billing', req.url).toString(),
    })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
