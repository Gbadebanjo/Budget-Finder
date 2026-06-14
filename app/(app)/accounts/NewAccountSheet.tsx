'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sheet } from '@/components/ui/Sheet'
import { Button, Field, Input, Select } from '@/components/ui/primitives'
import { toast } from '@/components/ui/Toast'

const COLORS = ['#4f46e5','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6','#ef4444','#14b8a6']
const KINDS = [
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'card', label: 'Card' },
  { value: 'savings', label: 'Savings' },
  { value: 'investment', label: 'Investment' },
] as const

export function NewAccountSheet({
  open, onClose, workspaceId,
}: { open: boolean; onClose: () => void; workspaceId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [kind, setKind] = useState<typeof KINDS[number]['value']>('bank')
  const [balance, setBalance] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('accounts').insert({
      workspace_id: workspaceId,
      name,
      institution: institution || null,
      kind,
      provider: 'manual',
      currency,
      current_balance: Number(balance || 0),
      color,
    })
    setSaving(false)
    if (error) {
      toast({ tone: 'danger', title: 'Could not create account', description: error.message })
      return
    }
    toast({ tone: 'success', title: 'Account added' })
    onClose()
    setName(''); setInstitution(''); setBalance('')
    router.refresh()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add account" description="Add a manual account. To sync a bank, use Link bank.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name"><Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. GTBank Savings" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Institution"><Input value={institution} onChange={e => setInstitution(e.target.value)} placeholder="GTBank" /></Field>
          <Field label="Kind">
            <Select value={kind} onChange={e => setKind(e.target.value as typeof kind)}>
              {KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Opening balance">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₦</span>
              <Input type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" className="pl-8 tabular" />
            </div>
          </Field>
          <Field label="Currency">
            <Select value={currency} onChange={e => setCurrency(e.target.value)}>
              <option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option>
            </Select>
          </Field>
        </div>
        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                style={{ background: c }}
                className={`h-8 w-8 rounded-lg ring-offset-2 ring-offset-surface ring-brand transition ${color === c ? 'ring-4 ring-accent-soft' : ''}`}
                aria-label={c}
              />
            ))}
          </div>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving} icon="check">Add account</Button>
        </div>
      </form>
    </Sheet>
  )
}
