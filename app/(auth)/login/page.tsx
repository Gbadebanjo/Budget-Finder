'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GlassCard, Button, Field, Input, PasswordInput } from '@/components/ui/primitives'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') ?? '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Supabase deliberately returns "Invalid login credentials" both for
      // wrong password AND for unconfirmed email. Give a hint covering both.
      const msg = error.message === 'Invalid login credentials'
        ? "Wrong email or password — or if you just signed up, click the confirmation link in your email first."
        : error.message
      setError(msg)
      setLoading(false)
      return
    }
    router.push(next)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-danger-soft bg-danger-soft text-danger text-sm px-3 py-2.5">{error}</div>
      )}
      <Field label="Email"><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></Field>
      <Field label="Password">
        <PasswordInput required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
      </Field>
      <Button type="submit" loading={loading} className="w-full" size="lg">Sign in</Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted mt-1.5">Sign in to keep your money on track.</p>
      </div>
      <GlassCard strong>
        <Suspense fallback={<div className="text-sm text-muted text-center py-6">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </GlassCard>
      <p className="text-center text-xs text-muted mt-5">
        New here? <Link href="/signup" className="text-accent font-medium">Create an account</Link>
      </p>
    </div>
  )
}
