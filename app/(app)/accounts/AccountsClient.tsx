'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GlassCard, Section, Stat, Button, Chip, EmptyState } from '@/components/ui/primitives'
import { Sparkline } from '@/components/ui/charts'
import { Icon } from '@/components/ui/Icon'
import { NewAccountSheet } from './NewAccountSheet'
import { LinkBankSheet } from './LinkBankSheet'
import { formatMoney, relativeDay } from '@/lib/format'
import type { Account, Transaction } from '@/lib/types'

export function AccountsClient({
  workspaceId, currency, accounts, recent,
}: { workspaceId: string; currency: string; accounts: Account[]; recent: Transaction[] }) {
  const router = useRouter()
  const params = useSearchParams()
  const [newOpen, setNewOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)

  useEffect(() => {
    if (params.get('link') === '1') setLinkOpen(true)
    if (params.get('new') === '1') setNewOpen(true)
  }, [params])

  const total = useMemo(() => accounts.reduce((s, a) => s + Number(a.current_balance), 0), [accounts])
  const byAccount = useMemo(() => {
    const map = new Map<string, number[]>()
    for (const a of accounts) {
      const series = [Number(a.current_balance)]
      const txs = recent.filter(t => t.account_id === a.id).slice(0, 30)
      let bal = Number(a.current_balance)
      for (const t of txs) {
        bal -= t.direction === 'credit' ? Number(t.amount) : -Number(t.amount)
        series.unshift(bal)
      }
      map.set(a.id, series.length > 1 ? series : [bal * 0.9, bal])
    }
    return map
  }, [accounts, recent])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted mt-1">All your money, in one place.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon="plus" onClick={() => setNewOpen(true)}>Add manual</Button>
          <Button icon="link" onClick={() => setLinkOpen(true)}>Link bank</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard>
          <Stat label="Total balance" value={formatMoney(total, currency, { compact: total > 1e6 })} icon="wallet" />
        </GlassCard>
        <GlassCard>
          <Stat label="Accounts" value={accounts.length} icon="building" hint={`${accounts.filter(a => a.provider !== 'manual').length} linked · ${accounts.filter(a => a.provider === 'manual').length} manual`} />
        </GlassCard>
        <GlassCard>
          <Stat
            label="Last sync"
            value={accounts.find(a => a.last_synced_at)
              ? relativeDay(new Date(Math.max(...accounts.filter(a => a.last_synced_at).map(a => +new Date(a.last_synced_at!)))))
              : '—'}
            icon="refresh"
          />
        </GlassCard>
      </div>

      {accounts.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon="wallet"
            title="No accounts yet"
            description="Link a bank for live sync, or add a manual account for cash and wallets."
            action={
              <div className="flex justify-center gap-2">
                <Button icon="link" onClick={() => setLinkOpen(true)}>Link bank</Button>
                <Button variant="secondary" icon="plus" onClick={() => setNewOpen(true)}>Add manual</Button>
              </div>
            }
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map(a => {
            const series = byAccount.get(a.id) ?? [0, 0]
            return (
              <GlassCard key={a.id} hover className="!p-0 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-11 w-11 rounded-2xl grid place-items-center text-white font-semibold shrink-0" style={{ background: a.color }}>
                        {a.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{a.name}</p>
                        <p className="text-xs text-muted truncate">{a.institution ?? a.kind}{a.account_mask ? ` · ••${a.account_mask}` : ''}</p>
                      </div>
                    </div>
                    {a.provider === 'manual'
                      ? <Chip tone="neutral">Manual</Chip>
                      : <Chip tone="info" icon="link">{a.provider}</Chip>}
                  </div>
                  <div className="mt-5">
                    <p className="text-2xl font-semibold tabular tracking-tight">
                      {formatMoney(a.current_balance, a.currency, { compact: a.current_balance > 1e6 })}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted">
                      <span>{a.currency} · {a.kind}</span>
                      <span>{a.last_synced_at ? `Synced ${relativeDay(new Date(a.last_synced_at))}` : 'Never synced'}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border-soft px-3 py-1.5">
                  <Sparkline data={series} width={320} height={48} stroke={a.color} />
                </div>
                <div className="border-t border-border-soft flex items-center text-xs">
                  <button className="flex-1 py-2.5 text-muted hover:text-tx flex items-center justify-center gap-1.5 transition">
                    <Icon name="refresh" size={13} /> Sync
                  </button>
                  <span className="w-px h-4 bg-border" />
                  <button className="flex-1 py-2.5 text-muted hover:text-tx flex items-center justify-center gap-1.5 transition">
                    <Icon name="settings" size={13} /> Edit
                  </button>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      <NewAccountSheet open={newOpen} onClose={() => { setNewOpen(false); router.replace('/accounts') }} workspaceId={workspaceId} />
      <LinkBankSheet open={linkOpen} onClose={() => { setLinkOpen(false); router.replace('/accounts') }} />
    </div>
  )
}
