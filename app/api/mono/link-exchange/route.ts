import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { exchangeAuthCode, fetchMonoAccount, fetchMonoTransactions, isMonoConfigured } from '@/lib/mono'
import { getCurrentWorkspace } from '@/lib/supabase/queries'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const ws = await getCurrentWorkspace()
  if (!ws) return NextResponse.json({ error: 'No workspace' }, { status: 400 })

  const { code } = await req.json().catch(() => ({}))
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  if (!isMonoConfigured()) {
    return NextResponse.json({ error: 'Mono not configured on server (MONO_SECRET_KEY)' }, { status: 503 })
  }

  try {
    const { id: externalId } = await exchangeAuthCode(code)
    const { account } = await fetchMonoAccount(externalId)

    const admin = createAdminClient()
    const { data: acc, error: accErr } = await admin
      .from('accounts')
      .insert({
        workspace_id: ws.id,
        name: account.name,
        institution: account.institution.name,
        kind: 'bank',
        provider: 'mono',
        currency: account.currency || 'NGN',
        account_mask: account.accountNumber?.slice(-4) ?? null,
        current_balance: Number(account.balance) / 100,
        sync_status: 'syncing',
      })
      .select()
      .single()
    if (accErr) throw accErr

    await admin.from('linked_accounts').insert({
      workspace_id: ws.id,
      account_id: acc.id,
      provider: 'mono',
      external_id: externalId,
      metadata: { institution: account.institution },
    })

    // Backfill last 12 months (fire-and-forget)
    const start = new Date(); start.setMonth(start.getMonth() - 12)
    fetchMonoTransactions(externalId, { start: start.toISOString().slice(0, 10), paginate: true })
      .then(async ({ data }) => {
        const rows = data.map(t => ({
          workspace_id: ws.id,
          account_id: acc.id,
          transaction_date: t.date.slice(0, 10),
          direction: t.type,
          amount: Number(t.amount) / 100,
          currency: account.currency || 'NGN',
          description: t.narration,
          balance_after: t.balance ? Number(t.balance) / 100 : null,
          external_id: t._id,
        }))
        if (rows.length) await admin.from('transactions').upsert(rows, { onConflict: 'account_id,external_id' })
        await admin.from('accounts').update({ sync_status: 'ok', last_synced_at: new Date().toISOString() }).eq('id', acc.id)
      })
      .catch(async () => {
        await admin.from('accounts').update({ sync_status: 'failed' }).eq('id', acc.id)
      })

    return NextResponse.json({ ok: true, account_id: acc.id })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }
}
