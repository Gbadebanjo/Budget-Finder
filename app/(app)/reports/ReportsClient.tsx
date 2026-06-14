'use client'

import { useMemo, useState } from 'react'
import { GlassCard, Section, Button, Select, Field, Input, Chip, EmptyState } from '@/components/ui/primitives'
import { AreaChart, DonutChart, WaterfallChart } from '@/components/ui/charts'
import { Icon } from '@/components/ui/Icon'
import { formatMoney, formatDate, toISODate } from '@/lib/format'
import {
  monthlyBuckets, categoryBreakdown, totals, netWorthSeries, percentDelta,
} from '@/lib/analytics'
import type { Account, Category, Transaction } from '@/lib/types'
import { cn } from '@/lib/cn'

const RANGES = [
  { value: '7',  label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '180', label: 'Last 6 months' },
  { value: '365', label: 'Last year' },
  { value: 'all', label: 'All time' },
] as const

export function ReportsClient({
  currency, accounts, categories, txs,
}: {
  currency: string
  accounts: Account[]
  categories: Category[]
  txs: Transaction[]
}) {
  const [range, setRange] = useState<typeof RANGES[number]['value']>('30')
  const [accountId, setAccountId] = useState<string>('all')
  const [categoryId, setCategoryId] = useState<string>('all')

  const filtered = useMemo(() => {
    const sinceDays = range === 'all' ? 36500 : Number(range)
    const cutoff = toISODate(new Date(Date.now() - sinceDays * 86_400_000))
    return txs.filter(t =>
      t.transaction_date >= cutoff
      && (accountId === 'all' || t.account_id === accountId)
      && (categoryId === 'all' || t.category_id === categoryId),
    )
  }, [txs, range, accountId, categoryId])

  const t30 = useMemo(() => totals(filtered, 36500), [filtered])
  const buckets = useMemo(() => monthlyBuckets(filtered, 6), [filtered])
  const nwSeries = useMemo(() => netWorthSeries(accounts, filtered, 90), [accounts, filtered])
  const breakdown = useMemo(() => categoryBreakdown(filtered, categories, { direction: 'debit', sinceDays: 36500 }), [filtered, categories])

  function exportCsv() {
    const rows = [
      ['Date', 'Account', 'Category', 'Description', 'Direction', 'Amount', 'Currency'],
      ...filtered.map(t => [
        t.transaction_date,
        t.account?.name ?? '',
        t.category?.name ?? '',
        (t.description ?? '').replace(/,/g, ' '),
        t.direction,
        String(t.amount),
        t.currency,
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finflow-${range}-${toISODate(new Date())}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted mt-1">Slice your data any way you like, then export.</p>
        </div>
        <Button icon="download" variant="secondary" onClick={exportCsv}>Export CSV</Button>
      </div>

      {/* Filters */}
      <GlassCard className="!p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Range">
            <Select value={range} onChange={e => setRange(e.target.value as typeof range)}>
              {RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </Field>
          <Field label="Account">
            <Select value={accountId} onChange={e => setAccountId(e.target.value)}>
              <option value="all">All accounts</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="Category">
            <Select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        </div>
      </GlassCard>

      {filtered.length === 0 ? (
        <GlassCard><EmptyState icon="trending-up" title="No data in that range" description="Try a wider window or a different filter." /></GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <GlassCard className="!p-4"><p className="text-[10px] uppercase tracking-wider text-muted">Income</p><p className="text-xl font-semibold tabular text-money-up mt-1">{formatMoney(t30.income, currency, { compact: t30.income > 1e6 })}</p></GlassCard>
            <GlassCard className="!p-4"><p className="text-[10px] uppercase tracking-wider text-muted">Spend</p><p className="text-xl font-semibold tabular text-money-down mt-1">{formatMoney(t30.spend, currency, { compact: t30.spend > 1e6 })}</p></GlassCard>
            <GlassCard className="!p-4"><p className="text-[10px] uppercase tracking-wider text-muted">Net</p><p className={cn('text-xl font-semibold tabular mt-1', t30.net >= 0 ? 'text-money-up' : 'text-money-down')}>{formatMoney(t30.net, currency, { sign: true, compact: Math.abs(t30.net) > 1e6 })}</p></GlassCard>
            <GlassCard className="!p-4"><p className="text-[10px] uppercase tracking-wider text-muted">Transactions</p><p className="text-xl font-semibold tabular mt-1">{t30.count}</p></GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <GlassCard className="lg:col-span-2">
              <Section title="Balance over time">
                <AreaChart data={nwSeries} currency={currency} height={240} />
              </Section>
            </GlassCard>
            <GlassCard>
              <Section title="Cashflow"><WaterfallChart data={buckets} currency={currency} height={220} /></Section>
            </GlassCard>
          </div>

          <GlassCard>
            <Section title="Category breakdown">
              <DonutChart data={breakdown} centerLabel="Spend" centerValue={t30.spend} currency={currency} />
            </Section>
          </GlassCard>
        </>
      )}
    </div>
  )
}
