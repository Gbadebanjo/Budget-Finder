'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GlassCard, Section, Button, Field, Input, Select, EmptyState, Chip } from '@/components/ui/primitives'
import { ProgressRing } from '@/components/ui/charts'
import { Sheet } from '@/components/ui/Sheet'
import { Icon } from '@/components/ui/Icon'
import { toast } from '@/components/ui/Toast'
import { formatMoney, toISODate } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Budget, Category, Transaction } from '@/lib/types'

export function BudgetsClient({
  workspaceId, currency, budgets, categories, txs,
}: {
  workspaceId: string
  currency: string
  budgets: Budget[]
  categories: Category[]
  txs: Transaction[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const monthStart = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0)
    return toISODate(d)
  }, [])

  const enriched = useMemo(() => budgets.map(b => {
    const spent = txs
      .filter(t => t.category_id === b.category_id && t.direction === 'debit' && t.transaction_date >= monthStart && !t.is_transfer)
      .reduce((s, t) => s + Number(t.amount), 0)
    return { ...b, spent, frac: b.amount > 0 ? spent / Number(b.amount) : 0 }
  }), [budgets, txs, monthStart])

  const totals = useMemo(() => {
    const allocated = enriched.reduce((s, b) => s + Number(b.amount), 0)
    const spent = enriched.reduce((s, b) => s + b.spent, 0)
    return { allocated, spent, left: allocated - spent }
  }, [enriched])

  const overBudget = enriched.filter(b => b.frac >= 1).length
  const warning = enriched.filter(b => b.frac >= 0.8 && b.frac < 1).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted mt-1">Envelope budgets that reset every month.</p>
        </div>
        <Button icon="plus" onClick={() => setOpen(true)}>New budget</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassCard className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted">Allocated</p>
          <p className="text-xl font-semibold tabular mt-1">{formatMoney(totals.allocated, currency, { compact: totals.allocated > 1e6 })}</p>
        </GlassCard>
        <GlassCard className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted">Spent</p>
          <p className="text-xl font-semibold tabular mt-1 text-money-down">{formatMoney(totals.spent, currency, { compact: totals.spent > 1e6 })}</p>
        </GlassCard>
        <GlassCard className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted">Left</p>
          <p className={cn('text-xl font-semibold tabular mt-1', totals.left >= 0 ? 'text-money-up' : 'text-money-down')}>
            {formatMoney(totals.left, currency, { sign: true, compact: Math.abs(totals.left) > 1e6 })}
          </p>
        </GlassCard>
        <GlassCard className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted">Alerts</p>
          <div className="flex gap-2 mt-1.5">
            {warning > 0 && <Chip tone="warning">{warning} at 80%</Chip>}
            {overBudget > 0 && <Chip tone="danger">{overBudget} over</Chip>}
            {warning === 0 && overBudget === 0 && <Chip tone="success" dot>All good</Chip>}
          </div>
        </GlassCard>
      </div>

      {enriched.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon="target"
            title="No budgets yet"
            description="Set a monthly cap on any category and we'll keep score."
            action={<Button icon="plus" onClick={() => setOpen(true)}>Create your first budget</Button>}
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enriched.map(b => {
            const cat = b.category ?? categories.find(c => c.id === b.category_id)
            const pct = Math.round(b.frac * 100)
            const left = Number(b.amount) - b.spent
            return (
              <GlassCard key={b.id}>
                <div className="flex items-center gap-4">
                  <ProgressRing value={b.frac} size={68} stroke={7}>
                    <span className="text-xs font-semibold tabular">{Math.min(pct, 999)}%</span>
                  </ProgressRing>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-lg grid place-items-center" style={{ background: cat?.color ? `${cat.color}22` : 'var(--surface-alt)' }}>
                        <Icon name={cat?.icon ?? 'tag'} size={13} style={{ color: cat?.color }} />
                      </span>
                      <p className="font-medium truncate">{cat?.name ?? 'Category'}</p>
                    </div>
                    <p className="text-xs text-muted mt-1">{b.period} · resets monthly</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <div className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        background: b.frac >= 1 ? 'var(--danger)' : b.frac >= 0.8 ? 'var(--warning)' : 'var(--accent)',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs tabular">
                    <span className="text-muted">{formatMoney(b.spent, currency)} spent</span>
                    <span className="font-medium">{formatMoney(Number(b.amount), currency)} cap</span>
                  </div>
                </div>

                <p className={cn('mt-3 text-xs font-medium tabular', left < 0 ? 'text-money-down' : 'text-muted')}>
                  {left < 0
                    ? `${formatMoney(Math.abs(left), currency)} over budget`
                    : `${formatMoney(left, currency)} left this month`}
                </p>
              </GlassCard>
            )
          })}
        </div>
      )}

      <NewBudgetSheet
        open={open}
        onClose={() => setOpen(false)}
        workspaceId={workspaceId}
        categories={categories}
        existing={budgets}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}

function NewBudgetSheet({
  open, onClose, workspaceId, categories, existing, onSaved,
}: {
  open: boolean
  onClose: () => void
  workspaceId: string
  categories: Category[]
  existing: Budget[]
  onSaved: () => void
}) {
  const used = new Set(existing.map(b => b.category_id))
  const avail = categories.filter(c => !used.has(c.id) && c.name !== 'Income' && c.name !== 'Transfers')

  const [categoryId, setCategoryId] = useState(avail[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [rollover, setRollover] = useState(false)
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('budgets').insert({
      workspace_id: workspaceId,
      category_id: categoryId,
      amount: Number(amount),
      period,
      rollover,
    })
    setSaving(false)
    if (error) {
      toast({ tone: 'danger', title: 'Could not save', description: error.message })
      return
    }
    toast({ tone: 'success', title: 'Budget set' })
    onSaved()
    onClose()
    setAmount('')
  }

  return (
    <Sheet open={open} onClose={onClose} title="New budget" description="Cap your monthly spend in any category.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Category">
          <Select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
            {avail.length === 0 && <option>No categories left</option>}
            {avail.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Monthly cap">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₦</span>
            <Input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="50,000" className="pl-8 text-lg tabular" />
          </div>
        </Field>
        <Field label="Period">
          <Select value={period} onChange={e => setPeriod(e.target.value as typeof period)}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </Select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={rollover} onChange={e => setRollover(e.target.checked)} />
          Roll unused balance to next month
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving} icon="check" disabled={!categoryId || avail.length === 0}>Create budget</Button>
        </div>
      </form>
    </Sheet>
  )
}
