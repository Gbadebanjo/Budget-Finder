import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Mono sends `mono_webhook_secret` header; verify match before processing.
 * Events we care about: mono.events.account_updated, mono.events.account_reauthorisation_required
 * https://docs.mono.co/docs/webhooks
 */
export async function POST(req: Request) {
  const signature = req.headers.get('mono-webhook-secret')
  if (!signature || signature !== process.env.MONO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const payload = await req.json().catch(() => null) as {
    event?: string
    data?: { account?: { _id?: string } }
  } | null
  if (!payload?.event) return NextResponse.json({ error: 'malformed' }, { status: 400 })

  const admin = createAdminClient()
  const externalId = payload.data?.account?._id

  if (!externalId) return NextResponse.json({ ok: true })

  if (payload.event === 'mono.events.account_reauthorisation_required') {
    await admin.from('linked_accounts').update({ reauth_required: true }).eq('external_id', externalId)
    await admin.from('accounts').update({ sync_status: 'reauth_required' })
      .in('id', (await admin.from('linked_accounts').select('account_id').eq('external_id', externalId)).data?.map(r => r.account_id) ?? [])
  }

  // For account_updated we'd trigger a sync edge function here. Stubbed for v1.
  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ status: 'mono webhook ready' })
}
