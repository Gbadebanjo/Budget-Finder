'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GlassCard, Chip, Button, EmptyState, Section, Input, Select } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'
import { NewTransactionSheet } from './NewTransactionSheet'
import { formatMoney, formatDate, relativeDay } from '@/lib/format'
import type { Account, Category, Transaction } from '@/lib/types'
import { cn } from '@/lib/cn'

interface Props {
  workspaceId: string
  currency: string
  accounts: Account[]
  categories: Category[]
  initialTransactions: Transaction[]
}

function groupByPeriod(txs: Transaction[]) {
  const groups = new Map<string, Transaction[]>()
  const now = new Date()
  const toKey = (d: Date) => {
    const diff = Math.floor((+now - +d) / 86_400_000)
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return 'This week'
    if (diff < 30) return 'This month'
    return `${d.toLocaleString('en-NG', { month: 'long' })} ${d.getFullYear()}`
  }
  for (const t of txs) {
    const k = toKey(new Date(t.transaction_date))
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(t)
  }
  return Array.from(groups.entries())
}

export function TimelineClient({
  workspaceId, currency, accounts, categories, initialTransactions,
}: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [newOpen, setNewOpen] = useState(false)

  useEffect(() => {
    if (params.get('new') === '1') setNewOpen(true)
  }, [params])

  const [accountId, setAccountId] = useState<string>('all')
  const [categoryId, setCategoryId] = useState<string>('all')
  const [direction, setDirection] = useState<'all' | 'credit' | 'debit'>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return initialTransactions.filter(t => {
      if (accountId !== 'all' && t.account_id !== accountId) return false
      if (categoryId !== 'all' && t.category_id !== categoryId) return false
      if (direction !== 'all' && t.direction !== direction) return false
      if (search && !`${t.description ?? ''} ${t.merchant?.name ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [initialTransactions, accountId, categoryId, direction, search])

  const stats = useMemo(() => {
    let income = 0, spend = 0
    for (const t of filtered) {
      if (t.is_transfer) continue
      if (t.direction === 'credit') income += Number(t.amount)
      else spend += Number(t.amount)
    }
    return { income, spend, net: income - spend, count: filtered.length }
  }, [filtered])

  const groups = useMemo(() => groupByPeriod(filtered), [filtered])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
          <p className="text-sm text-muted mt-1">Every money move, in order.</p>
        </div>
        <Button icon="plus" onClick={() => setNewOpen(true)}>Add transaction</Button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted">Transactions</p>
          <p className="text-xl font-semibold tabular mt-1">{stats.count}</p>
        </GlassCard>
        <GlassCard className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted">Income</p>
          <p className="text-xl font-semibold tabular text-money-up mt-1">{formatMoney(stats.income, currency, { compact: stats.income > 1e6 })}</p>
        </GlassCard>
        <GlassCard className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted">Spend</p>
          <p className="text-xl font-semibold tabular text-money-down mt-1">{formatMoney(stats.spend, currency, { compact: stats.spend > 1e6 })}</p>
        </GlassCard>
        <GlassCard className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted">Net</p>
          <p className={cn('text-xl font-semibold tabular mt-1', stats.net >= 0 ? 'text-money-up' : 'text-money-down')}>
            {formatMoney(stats.net, currency, { sign: true, compact: Math.abs(stats.net) > 1e6 })}
          </p>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard className="!p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px] relative">
            <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search description, merchant…"
              className="!h-9 pl-9"
            />
          </div>
          <Select value={accountId} onChange={e => setAccountId(e.target.value)} className="!h-9 w-auto">
            <option value="all">All accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="!h-9 w-auto">
            <option value="all">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <div className="flex rounded-xl p-1 bg-surface-alt">
            {(['all', 'credit', 'debit'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={cn(
                  'px-3 h-7 text-xs font-medium rounded-lg capitalize',
                  direction === d ? 'bg-surface shadow-sm' : 'text-muted',
                )}
              >
                {d === 'credit' ? 'Income' : d === 'debit' ? 'Spend' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Groups */}
      {filtered.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon="receipt"
            title="Nothing matches"
            description="Try a wider date range or a different filter."
          />
        </GlassCard>
      ) : (
        <div className="space-y-5">
          {groups.map(([label, items]) => {
            const dayTotal = items.reduce((s, t) => s + (t.direction === 'credit' ? Number(t.amount) : -Number(t.amount)), 0)
            return (
              <section key={label}>
                <header className="flex items-end justify-between px-1 mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</h3>
                  <span className={cn('text-xs tabular font-medium', dayTotal >= 0 ? 'text-money-up' : 'text-money-down')}>
                    Net {formatMoney(dayTotal, currency, { sign: true, compact: Math.abs(dayTotal) > 1e6 })}
                  </span>
                </header>
                <GlassCard padded={false}>
                  <ul className="divide-y divide-border-soft">
                    {items.map(t => <TimelineRow key={t.id} tx={t} /> )}
                  </ul>
                </GlassCard>
              </section>
            )
          })}
        </div>
      )}

      <NewTransactionSheet
        open={newOpen}
        onClose={() => { setNewOpen(false); router.replace('/timeline') }}
        workspaceId={workspaceId}
        accounts={accounts}
        categories={categories}
      />
    </div>
  )
}

function TimelineRow({ tx }: { tx: Transaction }) {
  const credit = tx.direction === 'credit'
  return (
    <li className="flex items-center gap-4 px-4 sm:px-5 py-3 hover:bg-surface-alt transition group">
      <span
        className="h-10 w-10 rounded-xl grid place-items-center shrink-0"
        style={{ background: tx.category?.color ? `${tx.category.color}22` : 'var(--surface-alt)' }}
      >
        <Icon name={tx.category?.icon ?? 'tag'} size={16} style={{ color: tx.category?.color ?? 'var(--text-muted)' }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{tx.description || tx.merchant?.name || 'Transaction'}</p>
          {tx.is_recurring && <Chip tone="info" icon="repeat">Recurring</Chip>}
          {tx.is_pending && <Chip tone="warning" dot>Pending</Chip>}
        </div>
        <p className="text-xs text-muted truncate">
          {tx.category?.name ?? 'Uncategorised'} · {tx.account?.name ?? ''} · {relativeDay(new Date(tx.transaction_date))}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={cn('text-sm font-semibold tabular', credit ? 'text-money-up' : 'text-tx')}>
          {credit ? '+' : '−'}{formatMoney(Math.abs(Number(tx.amount)), tx.currency)}
        </p>
        {tx.balance_after !== null && tx.balance_after !== undefined && (
          <p className="text-[10px] text-subtle tabular">bal {formatMoney(tx.balance_after, tx.currency, { compact: true })}</p>
        )}
      </div>
    </li>
  )
}
