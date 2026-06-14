'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'

const ITEMS = [
  { href: '/dashboard',  label: 'Home',     icon: 'home' },
  { href: '/timeline',   label: 'Timeline', icon: 'receipt' },
  { href: '/accounts',   label: 'Accounts', icon: 'wallet' },
  { href: '/budgets',    label: 'Budgets',  icon: 'target' },
  { href: '/settings',   label: 'Settings', icon: 'settings' },
] as const

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-surface-glass-strong backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2.5 text-[10px]',
                  active ? 'text-accent' : 'text-muted',
                )}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
