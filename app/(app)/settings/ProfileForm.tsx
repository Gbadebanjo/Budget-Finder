'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Field, Input, Select } from '@/components/ui/primitives'
import { toast } from '@/components/ui/Toast'

export function ProfileForm({
  userId, email, initial,
}: {
  userId: string
  email: string
  initial: { full_name: string; display_currency: string; locale: string }
}) {
  const router = useRouter()
  const [name, setName] = useState(initial.full_name)
  const [ccy, setCcy] = useState(initial.display_currency)
  const [locale, setLocale] = useState(initial.locale)
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: name, display_currency: ccy, locale })
      .eq('id', userId)
    setSaving(false)
    if (error) { toast({ tone: 'danger', title: 'Could not save', description: error.message }); return }
    toast({ tone: 'success', title: 'Saved' })
    router.refresh()
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <Field label="Email"><Input value={email} disabled /></Field>
      <Field label="Full name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Display currency">
          <Select value={ccy} onChange={e => setCcy(e.target.value)}>
            <option value="NGN">₦ Nigerian Naira</option>
            <option value="USD">$ US Dollar</option>
            <option value="GBP">£ British Pound</option>
            <option value="EUR">€ Euro</option>
          </Select>
        </Field>
        <Field label="Locale">
          <Select value={locale} onChange={e => setLocale(e.target.value)}>
            <option value="en-NG">English (Nigeria)</option>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
          </Select>
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={saving} icon="check">Save changes</Button>
      </div>
    </form>
  )
}
