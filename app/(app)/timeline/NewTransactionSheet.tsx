'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sheet } from '@/components/ui/Sheet'
import { Button, Field, Input, Select } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'
import { toISODate } from '@/lib/format'
import { toast } from '@/components/ui/Toast'
import type { Account, Category } from '@/lib/types'

export function NewTransactionSheet({
  open,
  onClose,
  workspaceId,
  accounts,
  categories,
}: {
  open: boolean
  onClose: () => void
  workspaceId: string
  accounts: Account[]
  categories: Category[]
}) {
  const router = useRouter()
  const today = toISODate(new Date())

  const [direction, setDirection] = useState<'debit' | 'credit'>('debit')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState(categories.find(c => c.name !== 'Income')?.id ?? '')
  const [date, setDate] = useState(today)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!accountId || !amount) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase.from('transactions').insert({
      workspace_id: workspaceId,
      account_id: accountId,
      category_id: categoryId || null,
      transaction_date: date,
      direction,
      amount: Number(amount),
      description,
      currency: accounts.find(a => a.id === accountId)?.currency ?? 'NGN',
    })

    setSaving(false)
    if (error) {
      toast({ tone: 'danger', title: 'Could not save', description: error.message })
      return
    }
    toast({ tone: 'success', title: 'Transaction added' })
    onClose()
    setAmount('')
    setDescription('')
    router.refresh()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add transaction" description="Quickly log what came in or went out.">
      <form onSubmit={submit} className="space-y-4">
        {/* Direction toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-alt">
          <button
            type="button"
            onClick={() => setDirection('debit')}
            className={`h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${
              direction === 'debit' ? 'bg-surface shadow-sm text-money-down' : 'text-muted'
            }`}
          >
            <Icon name="trending-down" size={15} />
            Spend
          </button>
          <button
            type="button"
            onClick={() => setDirection('credit')}
            className={`h-10 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${
              direction === 'credit' ? 'bg-surface shadow-sm text-money-up' : 'text-muted'
            }`}
          >
            <Icon name="trending-up" size={15} />
            Income
          </button>
        </div>

        <Field label="Amount">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₦</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="pl-8 text-lg tabular"
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Account">
            <Select value={accountId} onChange={e => setAccountId(e.target.value)} required>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </Field>
        </div>

        <Field label="Category">
          <Select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">Uncategorised</option>
            {categories.filter(c => direction === 'credit' ? c.name === 'Income' || c.name === 'Savings' : c.name !== 'Income').map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Description" hint="What was this for?">
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Bolt ride home"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving} icon="check">Save transaction</Button>
        </div>
      </form>
    </Sheet>
  )
}
