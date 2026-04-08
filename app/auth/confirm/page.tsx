'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from '@/components/ThemeToggle'

export default function ConfirmPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Hash fragments are only available in the browser
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)

    const accessToken  = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type         = params.get('type')

    if (!accessToken || !refreshToken || type !== 'invite') {
      setError('Invalid or expired invite link.')
      return
    }

    // Establish the session from the tokens in the hash
    const supabase = createClient()
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setError('This invite link is invalid or has expired.')
        } else {
          setReady(true)
        }
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-tx">FinanceTracker</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-tx">Set your password</h1>
            <p className="text-muted text-sm mt-2">Choose a password to activate your account.</p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-8 space-y-5 shadow-sm">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {!ready && !error && (
              <p className="text-center text-muted text-sm">Verifying invite link…</p>
            )}

            {ready && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-muted uppercase tracking-wide">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                    placeholder="Min. 8 characters"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-muted uppercase tracking-wide">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-alt px-3 py-2.5 text-sm text-tx placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                    placeholder="Repeat your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Activating account…' : 'Activate Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
