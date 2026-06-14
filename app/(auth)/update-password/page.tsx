'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GlassCard, Button, Field, PasswordInput } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pw !== confirm) { setError('Passwords don\'t match.'); return }
    if (pw.length < 8) { setError('Password must be at least 8 characters.'); return }

    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: pw })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted mt-1.5">
          Pick something strong. You'll use this to sign in next time.
        </p>
      </div>

      <GlassCard strong>
        {done ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-success-soft text-success grid place-items-center">
              <Icon name="check" size={22} />
            </div>
            <p className="font-medium">Password updated</p>
            <p className="text-sm text-muted">Sending you to the dashboard…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-danger-soft bg-danger-soft text-danger text-sm px-3 py-2.5">
                {error}
              </div>
            )}
            <Field label="New password" hint="At least 8 characters">
              <PasswordInput
                required
                minLength={8}
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <PasswordInput
                required
                minLength={8}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Update password
            </Button>
          </form>
        )}
      </GlassCard>
    </div>
  )
}
