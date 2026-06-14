'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo, Chip } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

const NAV = [
  { href: '/dashboard',  label: 'Dashboard',  icon: 'home' },
  { href: '/timeline',   label: 'Timeline',   icon: 'receipt' },
  { href: '/accounts',   label: 'Accounts',   icon: 'wallet' },
  { href: '/budgets',    label: 'Budgets',    icon: 'target' },
  { href: '/goals',      label: 'Goals',      icon: 'sparkles' },
  { href: '/reports',    label: 'Reports',    icon: 'trending-up' },
] as const

const FOOTER_NAV = [
  { href: '/settings/billing', label: 'Billing',  icon: 'credit-card' },
  { href: '/settings',         label: 'Settings', icon: 'settings' },
] as const

export function Sidebar({ planTier = 'free' as string }) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-border bg-surface-glass backdrop-blur-xl">
      {/* Brand */}
      <div className="h-16 flex items-center gap-2.5 px-5">
        <Logo size={30} />
        <div>
          <p className="text-sm font-semibold tracking-tight">FinFlow</p>
          <p className="text-[10px] text-subtle leading-none mt-0.5">Money, on a timeline</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition relative',
                active
                  ? 'bg-accent-soft text-accent font-medium'
                  : 'text-muted hover:text-tx hover:bg-surface-alt',
              )}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
              {active && <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-current" />}
            </Link>
          )
        })}
      </nav>

      {/* Plan card */}
      <div className="px-3 pb-3">
        <Link
          href="/settings/billing"
          className="block rounded-2xl p-4 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white relative overflow-hidden group"
        >
          <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/15 blur-xl group-hover:scale-125 transition" />
          <div className="relative">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-80">
              <Icon name="sparkles" size={11} />
              {planTier === 'free' ? 'Free plan' : `${planTier} plan`}
            </div>
            <p className="text-sm font-semibold mt-1 leading-tight">
              {planTier === 'free' ? 'Unlock unlimited accounts' : 'Manage subscription'}
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {planTier === 'free' ? 'Go Pro — ₦2,500/mo' : 'View billing & plan'}
            </p>
          </div>
        </Link>
      </div>

      {/* Footer nav */}
      <div className="border-t border-border-soft px-3 py-3 space-y-0.5">
        {FOOTER_NAV.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm',
                active ? 'text-tx bg-surface-alt font-medium' : 'text-muted hover:text-tx hover:bg-surface-alt',
              )}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
