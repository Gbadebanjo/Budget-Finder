'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'
import { toast } from '@/components/ui/Toast'

declare global {
  interface Window { MonoConnect?: new (cfg: { key: string; onClose?: () => void; onSuccess: (data: { code: string }) => void; onLoad?: () => void }) => { setup: () => void; open: () => void } }
}

export function LinkBankSheet({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const monoKey = process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY

  // Load Mono Connect script on demand
  useEffect(() => {
    if (!open || !monoKey) return
    if (document.querySelector('script[src*="mono.co/connect"]')) return
    const s = document.createElement('script')
    s.src = 'https://connect.withmono.com/connect.js'
    s.async = true
    document.body.appendChild(s)
  }, [open, monoKey])

  async function startLink() {
    if (!monoKey) {
      toast({ tone: 'danger', title: 'Mono not configured', description: 'Set NEXT_PUBLIC_MONO_PUBLIC_KEY in .env.local' })
      return
    }
    if (!window.MonoConnect) {
      toast({ tone: 'info', title: 'Initializing Mono…' })
      return
    }
    setLoading(true)
    const connect = new window.MonoConnect({
      key: monoKey,
      onClose: () => setLoading(false),
      onSuccess: async ({ code }: { code: string }) => {
        const res = await fetch('/api/mono/link-exchange', {
          method: 'POST',
          body: JSON.stringify({ code }),
        })
        setLoading(false)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          toast({ tone: 'danger', title: 'Could not link account', description: err.error })
          return
        }
        toast({ tone: 'success', title: 'Bank linked', description: 'Initial sync queued.' })
        onClose()
        router.refresh()
      },
    })
    connect.setup()
    connect.open()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Link a bank account" description="Securely connect your bank via Mono.">
      <div className="space-y-5">
        <div className="rounded-2xl bg-surface-alt p-4 flex items-start gap-3">
          <span className="h-9 w-9 rounded-xl bg-accent-soft text-accent grid place-items-center"><Icon name="link" size={18} /></span>
          <div className="text-sm">
            <p className="font-medium">Powered by Mono</p>
            <p className="text-muted text-xs mt-0.5">
              We never see or store your bank password. Mono is regulated by the CBN and trusted by Cowrywise, Carbon, and more.
            </p>
          </div>
        </div>

        <ul className="space-y-2.5 text-sm">
          {[
            'Read-only access — we cannot move money',
            'Initial backfill of 12 months of transactions',
            'Daily resync · disconnect any time',
          ].map(t => (
            <li key={t} className="flex items-center gap-2.5">
              <span className="h-5 w-5 rounded-full bg-success-soft text-success grid place-items-center"><Icon name="check" size={12} /></span>
              <span>{t}</span>
            </li>
          ))}
        </ul>

        {!monoKey && (
          <div className="rounded-xl border border-warning-soft bg-warning-soft text-warning text-xs px-3 py-2.5">
            Add <code className="font-mono">NEXT_PUBLIC_MONO_PUBLIC_KEY</code> to <code className="font-mono">.env.local</code> to enable live linking. You can still demo with a manual account.
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="link" loading={loading} onClick={startLink}>Continue with Mono</Button>
        </div>
      </div>
    </Sheet>
  )
}
