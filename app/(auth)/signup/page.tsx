'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GlassCard, Button, Field, Input, PasswordInput } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // 'signed-in'  — got an immediate session (email confirmation OFF)
  // 'check-email' — user created but session is null (email confirmation ON)
  const [stage, setStage] = useState<'form' | 'signed-in' | 'check-email'>('form')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    setLoading(false)
    if (error) { setError(error.message); return }

    if (data.session) {
      setStage('signed-in')
      setTimeout(() => router.push('/dashboard'), 1200)
    } else {
      // Email confirmation is enabled on the Supabase project.
      // The user has to click the link before they can sign in.
      setStage('check-email')
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Start tracking in 30 seconds</h1>
        <p className="text-sm text-muted mt-1.5">Free forever for one account. No card required.</p>
      </div>

      <GlassCard strong>
        {stage === 'signed-in' ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-success-soft text-success grid place-items-center">
              <Icon name="check" size={22} />
            </div>
            <p className="font-medium">You're in. Setting up your workspace…</p>
          </div>
        ) : stage === 'check-email' ? (
          <div className="py-6 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-info-soft text-info grid place-items-center">
              <Icon name="bell" size={22} />
            </div>
            <p className="font-medium">Check your inbox</p>
            <p className="text-sm text-muted">
              We sent a confirmation link to <span className="text-tx font-medium">{email}</span>.
              Click it, then come back and sign in.
            </p>
            <p className="text-xs text-subtle">
              Didn't get the email? Check spam, or disable email confirmation in your Supabase project
              (Authentication → Sign In / Up) for instant access in dev.
            </p>
            <Link href="/login" className="inline-block text-sm text-accent font-medium pt-2">
              Go to sign in →
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && <div className="rounded-xl border border-danger-soft bg-danger-soft text-danger text-sm px-3 py-2.5">{error}</div>}
            <Field label="Full name"><Input required value={name} onChange={e => setName(e.target.value)} placeholder="Oluwagbogo" autoComplete="name" /></Field>
            <Field label="Email"><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" autoComplete="email" /></Field>
            <Field label="Password" hint="At least 8 characters">
              <PasswordInput required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </Field>
            <Button type="submit" loading={loading} className="w-full" size="lg">Create my workspace</Button>
            <p className="text-[10px] text-subtle text-center">
              By signing up you agree to our terms and privacy policy.
            </p>
          </form>
        )}
      </GlassCard>

      <p className="text-center text-xs text-muted mt-5">
        Already have an account? <Link href="/login" className="text-accent font-medium">Sign in</Link>
      </p>
    </div>
  )
}
