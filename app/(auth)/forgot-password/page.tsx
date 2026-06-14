'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GlassCard, Button, Field, Input } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const supabase = createClient()
    // Sends a one-time link that lands on /auth/confirm; that handler
    // verifies the OTP and redirects to /update-password with a session.
    const redirectTo = `${window.location.origin}/auth/confirm?next=/update-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted mt-1.5">
          Enter your email and we'll send a one-time link.
        </p>
      </div>

      <GlassCard strong>
        {sent ? (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-success-soft text-success grid place-items-center">
              <Icon name="check" size={22} />
            </div>
            <p className="font-medium">Link sent</p>
            <p className="text-sm text-muted">
              Check <span className="text-tx font-medium">{email}</span> for a message from Supabase.
              Click the link to set a new password.
            </p>
            <p className="text-xs text-subtle">
              Not seeing it? Check spam, or wait a minute. Supabase's default SMTP can be slow.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-danger-soft bg-danger-soft text-danger text-sm px-3 py-2.5">
                {error}
              </div>
            )}
            <Field label="Email">
              <Input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Send reset link
            </Button>
          </form>
        )}
      </GlassCard>

      <p className="text-center text-xs text-muted mt-5">
        Remembered it? <Link href="/login" className="text-accent font-medium">Sign in</Link>
      </p>
    </div>
  )
}
