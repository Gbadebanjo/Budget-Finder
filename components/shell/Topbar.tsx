'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Icon } from '@/components/ui/Icon'
import { Avatar, Button } from '@/components/ui/primitives'
import { cn } from '@/lib/cn'

interface TopbarProps {
  profileName: string | null
  profileEmail: string
  workspaceName: string | null
}

export function Topbar({ profileName, profileEmail, workspaceName }: TopbarProps) {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [menuOpen, setMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const initial = (localStorage.getItem('theme') as 'light' | 'dark' | null)
      ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setTheme(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
      }
      if (e.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 flex items-center justify-between gap-3 border-b border-border bg-surface-glass backdrop-blur-xl">
        {/* Workspace label — no chevron until shared workspaces ship. */}
        <div className="hidden sm:flex items-center gap-2 h-9 px-2.5 text-sm">
          <span className="h-6 w-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 grid place-items-center text-white text-[10px] font-bold">
            {(workspaceName ?? 'P').slice(0, 1).toUpperCase()}
          </span>
          <span className="font-medium max-w-[160px] truncate">{workspaceName ?? 'Personal'}</span>
        </div>

        {/* Search / palette */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex-1 max-w-md h-9 inline-flex items-center gap-2 px-3 rounded-xl border border-border bg-surface text-muted text-sm hover:bg-surface-alt transition"
        >
          <Icon name="search" size={15} />
          <span className="flex-1 text-left">Search or jump to…</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-subtle font-mono px-1.5 py-0.5 rounded border border-border">
            ⌘K
          </kbd>
        </button>

        {/* Right cluster */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Theme">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Icon name="bell" size={16} />
          </Button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="ml-1 flex items-center gap-2 px-1.5 py-1 rounded-full hover:bg-surface-alt"
            >
              <Avatar name={profileName || profileEmail} size={28} />
              <Icon name="chevron-down" size={13} className="text-muted hidden sm:block" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 glass-strong rounded-2xl p-2 z-40 shadow-md fade-in">
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-semibold truncate">{profileName || 'Account'}</p>
                    <p className="text-xs text-muted truncate">{profileEmail}</p>
                  </div>
                  <div className="h-px bg-border-soft my-1" />
                  <MenuLink href="/settings" icon="settings">Settings</MenuLink>
                  <MenuLink href="/settings/billing" icon="credit-card">Billing</MenuLink>
                  <div className="h-px bg-border-soft my-1" />
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted hover:text-tx hover:bg-surface-alt"
                  >
                    <Icon name="log-out" size={15} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </>
  )
}

function MenuLink({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  return (
    <a href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-surface-alt">
      <Icon name={icon} size={15} className="text-muted" />
      {children}
    </a>
  )
}

const PALETTE_ITEMS = [
  { label: 'Dashboard',            href: '/dashboard', icon: 'home' },
  { label: 'Timeline',             href: '/timeline',  icon: 'receipt' },
  { label: 'Add transaction',      href: '/timeline?new=1', icon: 'plus' },
  { label: 'Accounts',             href: '/accounts',  icon: 'wallet' },
  { label: 'Link a bank (Mono)',   href: '/accounts?link=1', icon: 'link' },
  { label: 'Budgets',              href: '/budgets',   icon: 'target' },
  { label: 'Goals',                href: '/goals',     icon: 'sparkles' },
  { label: 'Reports',              href: '/reports',   icon: 'trending-up' },
  { label: 'Upgrade to Pro',       href: '/settings/billing', icon: 'credit-card' },
  { label: 'Settings',             href: '/settings',  icon: 'settings' },
]

function CommandPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('')
  const router = useRouter()

  const items = PALETTE_ITEMS.filter(i =>
    i.label.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="fixed inset-0 z-50 grid place-items-start justify-center pt-[12vh] px-4 fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl glass-strong rounded-2xl overflow-hidden shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Icon name="search" size={16} className="text-muted" />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search pages, actions…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
          />
          <kbd className="text-[10px] text-subtle font-mono px-1.5 py-0.5 rounded border border-border">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted">Nothing matches.</li>
          )}
          {items.map((item, i) => (
            <li key={item.href}>
              <button
                onClick={() => { router.push(item.href); onClose() }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left',
                  i === 0 ? 'bg-surface-alt' : 'hover:bg-surface-alt',
                )}
              >
                <Icon name={item.icon} size={15} className="text-muted" />
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] text-subtle font-mono">{item.href}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
