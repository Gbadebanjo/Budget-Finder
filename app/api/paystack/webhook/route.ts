import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { PlanTier } from '@/lib/types'

/**
 * Paystack webhook — events:
 *  charge.success            → activate subscription
 *  subscription.create       → store codes
 *  subscription.disable      → mark canceled / past_due
 *  invoice.payment_failed    → past_due
 * https://paystack.com/docs/payments/webhooks
 */
export async function POST(req: Request) {
  const sig = req.headers.get('x-paystack-signature')
  const secret = process.env.PAYSTACK_SECRET_KEY
  const raw = await req.text()

  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })
  const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex')
  if (sig !== expected) return NextResponse.json({ error: 'bad signature' }, { status: 401 })

  const payload = JSON.parse(raw) as { event: string; data: Record<string, unknown> }
  const admin = createAdminClient()

  switch (payload.event) {
    case 'charge.success': {
      const meta = (payload.data.metadata as { workspace_id?: string; plan?: PlanTier; cycle?: string } | undefined) ?? {}
      if (!meta.workspace_id || !meta.plan) break

      const periodMs = meta.cycle === 'yearly' ? 365 * 86_400_000 : 31 * 86_400_000
      await admin.from('subscriptions').upsert({
        workspace_id: meta.workspace_id,
        plan: meta.plan,
        status: 'active',
        current_period_end: new Date(Date.now() + periodMs).toISOString(),
        paystack_customer_code: (payload.data.customer as { customer_code?: string } | undefined)?.customer_code ?? null,
      })
      break
    }
    case 'subscription.create': {
      const customer = (payload.data as { customer?: { customer_code?: string } }).customer
      const subscription_code = (payload.data as { subscription_code?: string }).subscription_code
      if (customer?.customer_code) {
        await admin
          .from('subscriptions')
          .update({ paystack_subscription_code: subscription_code ?? null })
          .eq('paystack_customer_code', customer.customer_code)
      }
      break
    }
    case 'subscription.disable':
    case 'invoice.payment_failed': {
      const code = (payload.data as { subscription_code?: string }).subscription_code
      if (code) {
        await admin
          .from('subscriptions')
          .update({ status: payload.event === 'subscription.disable' ? 'canceled' : 'past_due' })
          .eq('paystack_subscription_code', code)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
