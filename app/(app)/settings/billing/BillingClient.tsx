'use client'

import { useState } from 'react'
import { GlassCard, Section, Button, Chip } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'
import { toast } from '@/components/ui/Toast'
import { formatMoney } from '@/lib/format'
import { PLANS } from '@/lib/plans'
import { cn } from '@/lib/cn'
import type { Subscription } from '@/lib/types'

export function BillingClient({ subscription }: { subscription: Subscription | null }) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly')
  const current = subscription?.plan ?? 'free'
  const [pending, setPending] = useState<string | null>(null)

  async function upgrade(planId: string) {
    setPending(planId)
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        body: JSON.stringify({ plan: planId, cycle }),
      })
      const json = await res.json()
      if (!res.ok || !json.authorization_url) {
        toast({ tone: 'danger', title: 'Could not start checkout', description: json.error || 'Try again' })
        return
      }
      window.location.href = json.authorization_url
    } catch (err) {
      toast({ tone: 'danger', title: 'Network error' })
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
          <p className="text-sm text-muted mt-1">Plans priced in Naira, billed via Paystack.</p>
        </div>
        <div className="flex rounded-xl p-1 bg-surface-alt">
          <button
            onClick={() => setCycle('monthly')}
            className={cn('px-3 h-8 text-xs font-medium rounded-lg', cycle === 'monthly' ? 'bg-surface shadow-sm' : 'text-muted')}
          >Monthly</button>
          <button
            onClick={() => setCycle('yearly')}
            className={cn('px-3 h-8 text-xs font-medium rounded-lg', cycle === 'yearly' ? 'bg-surface shadow-sm' : 'text-muted')}
          >
            Yearly <span className="ml-1 text-[10px] text-success">save 17%</span>
          </button>
        </div>
      </div>

      {/* Current plan banner */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Current plan</p>
            <p className="text-xl font-semibold mt-0.5 capitalize">{current}</p>
            {subscription?.current_period_end && (
              <p className="text-xs text-muted mt-1">Renews {new Date(subscription.current_period_end).toLocaleDateString('en-NG')}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {subscription?.status && <Chip tone={subscription.status === 'active' ? 'success' : 'warning'} dot>{subscription.status}</Chip>}
            <Chip tone="accent" icon="sparkles">Paystack</Chip>
          </div>
        </div>
      </GlassCard>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map(plan => {
          const isCurrent = current === plan.id
          const price = cycle === 'monthly' ? plan.monthly : plan.yearly
          return (
            <GlassCard
              key={plan.id}
              className={cn(
                'relative flex flex-col',
                plan.highlight && 'ring-2 ring-accent shadow-lg',
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Chip tone="accent" icon="sparkles">Most popular</Chip>
                </div>
              )}
              <div>
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="text-xs text-muted mt-0.5">{plan.tagline}</p>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-semibold tabular tracking-tight">
                  {price === 0 ? 'Free' : formatMoney(price, 'NGN', { decimals: 0 })}
                </p>
                {price !== 0 && (
                  <p className="text-xs text-muted">per {cycle === 'monthly' ? 'month' : 'year'}</p>
                )}
              </div>
              <ul className="mt-4 space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="h-4 w-4 rounded-full bg-success-soft text-success grid place-items-center mt-0.5 shrink-0">
                      <Icon name="check" size={10} />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {isCurrent ? (
                  <Button variant="secondary" className="w-full" disabled>Current plan</Button>
                ) : plan.id === 'business' ? (
                  <Button variant="secondary" className="w-full" href="mailto:sales@finflow.app">Contact sales</Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.highlight ? 'primary' : 'secondary'}
                    loading={pending === plan.id}
                    onClick={() => upgrade(plan.id)}
                  >
                    {plan.cta}
                  </Button>
                )}
              </div>
            </GlassCard>
          )
        })}
      </div>

      <p className="text-xs text-muted text-center">
        All prices in NGN. Cancel anytime. By upgrading, you agree to our terms.
      </p>
    </div>
  )
}
