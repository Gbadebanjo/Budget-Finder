'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GlassCard, Button, Field, Input, EmptyState, Chip } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { Icon } from '@/components/ui/Icon'
import { toast } from '@/components/ui/Toast'
import { formatMoney, formatDate, daysBetween } from '@/lib/format'
import type { Goal } from '@/lib/types'

const ICONS = ['target', 'sparkles', 'plane', 'home', 'car', 'piggy-bank', 'book-open', 'heart-pulse']
const COLORS = ['#10b981','#4f46e5','#0ea5e9','#f59e0b','#ec4899','#8b5cf6','#14b8a6','#ef4444']

export function GoalsClient({
  workspaceId, currency, goals,
}: { workspaceId: string; currency: string; goals: Goal[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="text-sm text-muted mt-1">Save for what matters — track progress in real time.</p>
        </div>
        <Button icon="plus" onClick={() => setOpen(true)}>New goal</Button>
      </div>

      {goals.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon="sparkles"
            title="Set your first savings goal"
            description="Dream big. Lagos rent? Wedding? MacBook? Pick a target, pick a date — we'll plot the path."
            action={<Button icon="plus" onClick={() => setOpen(true)}>Create a goal</Button>}
          />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(g => {
            const frac = Number(g.target_amount) > 0 ? Number(g.current_amount) / Number(g.target_amount) : 0
            const left = Number(g.target_amount) - Number(g.current_amount)
            const daysLeft = g.target_date ? daysBetween(new Date(), new Date(g.target_date)) : null
            return (
              <GlassCard key={g.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-11 w-11 rounded-2xl grid place-items-center text-white shadow-sm" style={{ background: g.color }}>
                      <Icon name={g.icon} size={20} />
                    </span>
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs text-muted">
                        {g.target_date ? `By ${formatDate(g.target_date, 'long')}` : 'No deadline'}
                      </p>
                    </div>
                  </div>
                  {frac >= 1
                    ? <Chip tone="success" icon="check">Reached</Chip>
                    : daysLeft !== null && daysLeft < 30
                      ? <Chip tone="warning">{daysLeft}d left</Chip>
                      : <Chip tone="neutral">{Math.round(frac * 100)}%</Chip>}
                </div>

                <div className="mt-5">
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-semibold tabular">{formatMoney(g.current_amount, currency, { compact: Number(g.current_amount) > 1e6 })}</span>
                    <span className="text-xs text-muted tabular">of {formatMoney(g.target_amount, currency, { compact: Number(g.target_amount) > 1e6 })}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${Math.min(100, frac * 100)}%`, background: g.color }} />
                  </div>
                  <p className="text-xs text-muted mt-2 tabular">
                    {left > 0 ? `${formatMoney(left, currency)} to go` : 'You hit it 🎉'}
                  </p>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      <NewGoalSheet open={open} onClose={() => setOpen(false)} workspaceId={workspaceId} onSaved={() => router.refresh()} />
    </div>
  )
}

function NewGoalSheet({
  open, onClose, workspaceId, onSaved,
}: { open: boolean; onClose: () => void; workspaceId: string; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('')
  const [date, setDate] = useState('')
  const [icon, setIcon] = useState(ICONS[0])
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('goals').insert({
      workspace_id: workspaceId,
      name,
      target_amount: Number(target),
      current_amount: Number(current || 0),
      target_date: date || null,
      icon,
      color,
    })
    setSaving(false)
    if (error) {
      toast({ tone: 'danger', title: 'Could not save', description: error.message })
      return
    }
    toast({ tone: 'success', title: 'Goal created' })
    onSaved(); onClose()
    setName(''); setTarget(''); setCurrent(''); setDate('')
  }

  return (
    <Sheet open={open} onClose={onClose} title="New goal" description="Name it. Target it. Hit it.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Goal name"><Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Japa fund 🇨🇦" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target amount">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₦</span>
              <Input required type="number" step="0.01" value={target} onChange={e => setTarget(e.target.value)} placeholder="2,000,000" className="pl-8 tabular" />
            </div>
          </Field>
          <Field label="Already saved">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₦</span>
              <Input type="number" step="0.01" value={current} onChange={e => setCurrent(e.target.value)} placeholder="0" className="pl-8 tabular" />
            </div>
          </Field>
        </div>
        <Field label="Target date (optional)">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </Field>
        <Field label="Icon">
          <div className="flex flex-wrap gap-2">
            {ICONS.map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={`h-9 w-9 rounded-lg grid place-items-center ${icon === i ? 'bg-accent-soft text-accent' : 'bg-surface-alt text-muted'}`}
              >
                <Icon name={i} size={16} />
              </button>
            ))}
          </div>
        </Field>
        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                style={{ background: c }}
                className={`h-8 w-8 rounded-lg ${color === c ? 'ring-4 ring-accent-soft' : ''}`}
              />
            ))}
          </div>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving} icon="check">Create goal</Button>
        </div>
      </form>
    </Sheet>
  )
}
