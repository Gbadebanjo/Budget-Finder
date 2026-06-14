import Link from 'next/link'
import { Logo, Button, GlassCard, Chip } from '@/components/ui/primitives'
import { Icon } from '@/components/ui/Icon'
import { AreaChart, DonutChart, HeatmapCalendar } from '@/components/ui/charts'
import { PLANS } from '@/lib/plans'
import { formatMoney } from '@/lib/format'

export const dynamic = 'force-static'

/**
 * Demo data MUST be deterministic so SSR output matches client hydration.
 * No Math.random(), no Date.now() at module scope — both differ between
 * the server and client bundles. Anchor date is fixed; "randomness" comes
 * from a sin/cos seed based on index.
 */
const ANCHOR = new Date('2026-06-01T00:00:00Z')

function isoOffset(daysAgo: number) {
  const d = new Date(ANCHOR.getTime() - daysAgo * 86_400_000)
  return d.toISOString().slice(0, 10)
}
function seededNoise(i: number) {
  // Deterministic 0..1 from index
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const demoSeries = Array.from({ length: 60 }, (_, i) => ({
  x: isoOffset(60 - i),
  y: 1_500_000 + Math.sin(i / 6) * 120_000 + i * 12_000 + seededNoise(i) * 40_000,
}))
const demoBreakdown = [
  { label: 'Food', value: 84_200, color: '#f59e0b' },
  { label: 'Transport', value: 62_100, color: '#0ea5e9' },
  { label: 'Rent', value: 250_000, color: '#a855f7' },
  { label: 'Shopping', value: 41_800, color: '#8b5cf6' },
  { label: 'Subscriptions', value: 18_600, color: '#06b6d4' },
]
const demoHeat = Array.from({ length: 120 }, (_, i) => {
  const n = seededNoise(i + 7)
  return {
    date: isoOffset(i),
    value: n > 0.3 ? n * 15_000 : 0,
  }
})

const FEATURES = [
  { icon: 'link', title: 'Link every bank',          body: 'Mono-powered sync for GTBank, Kuda, Access, Wema and the rest. Read-only and CBN-regulated.' },
  { icon: 'receipt', title: 'Beautiful timeline',    body: 'Every naira, every kobo, on a vertical journal you can scroll, search, and zoom.' },
  { icon: 'target', title: 'Budgets that breathe',    body: 'Envelope budgets per category with progress rings and friendly alerts at 80% and 100%.' },
  { icon: 'sparkles', title: 'Goals & forecasts',     body: 'Save for what matters with progress tracking and projected completion dates.' },
  { icon: 'trending-up', title: 'Charts that speak', body: 'Net worth, cashflow, category donuts and a GitHub-style spending heatmap.' },
  { icon: 'repeat', title: 'Recurring detection',     body: 'We learn your Netflix, Spotify, rent, salary — and forecast next month for you.' },
]

export default function Landing() {
  return (
    <div className="app-backdrop min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-surface-glass border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-semibold tracking-tight">FinFlow</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted">
            <a href="#features" className="hover:text-tx">Features</a>
            <a href="#pricing" className="hover:text-tx">Pricing</a>
            <a href="#faq" className="hover:text-tx">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" href="/login" size="sm">Sign in</Button>
            <Button href="/signup" size="sm" icon="arrow-up-right">Start free</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-12">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <Chip tone="accent" icon="sparkles" className="mx-auto">For Nigeria · NGN-first</Chip>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            Your money,<br />
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">on a timeline.</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            FinFlow ties together every Nigerian bank account into one calm, beautiful place — with charts that tell you exactly where every naira went.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" href="/signup" icon="arrow-up-right">Get started — free</Button>
            <Button size="lg" variant="secondary" href="#features">See it in action</Button>
          </div>
          <p className="text-xs text-subtle">No card required · 14-day Pro trial · Built with Mono</p>
        </div>

        {/* Mock dashboard preview */}
        <div className="max-w-6xl mx-auto mt-14">
          <GlassCard strong className="!p-0 overflow-hidden">
            <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <GlassCard className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted">Net worth</p>
                    <p className="text-2xl font-semibold tabular">{formatMoney(2_481_300, 'NGN')}</p>
                  </div>
                  <Chip tone="success" icon="trending-up">+4.1%</Chip>
                </div>
                <AreaChart data={demoSeries} height={200} />
              </GlassCard>
              <GlassCard>
                <p className="text-xs text-muted mb-2">Where it went</p>
                <DonutChart data={demoBreakdown} size={200} centerLabel="Spend" centerValue={456_700} />
              </GlassCard>
              <GlassCard className="lg:col-span-3">
                <p className="text-xs text-muted mb-2">Spending heatmap · 4 months</p>
                <HeatmapCalendar data={demoHeat} weeks={18} endDate={isoOffset(0)} />
              </GlassCard>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Everything you need. Nothing you don't.</h2>
          <p className="text-muted mt-2">Six pillars, one calm interface.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <GlassCard key={f.title} hover>
              <div className="h-10 w-10 rounded-xl bg-accent-soft text-accent grid place-items-center mb-3">
                <Icon name={f.icon} size={18} />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted mt-1">{f.body}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Simple Naira pricing.</h2>
          <p className="text-muted mt-2">Free forever for the basics. Upgrade when you're ready.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(p => (
            <GlassCard key={p.id} className={p.highlight ? 'ring-2 ring-accent shadow-lg relative' : ''}>
              {p.highlight && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2"><Chip tone="accent" icon="sparkles">Most popular</Chip></div>}
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-xs text-muted">{p.tagline}</p>
              <p className="mt-3 text-3xl font-semibold tabular">{p.monthly === 0 ? 'Free' : formatMoney(p.monthly, 'NGN', { decimals: 0 })}</p>
              {p.monthly !== 0 && <p className="text-xs text-muted">per month</p>}
              <ul className="mt-4 space-y-1.5 text-sm">
                {p.features.slice(0, 5).map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-success-soft text-success grid place-items-center mt-0.5 shrink-0"><Icon name="check" size={10} /></span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button href="/signup" variant={p.highlight ? 'primary' : 'secondary'} className="w-full mt-5">
                {p.id === 'free' ? 'Start free' : p.cta}
              </Button>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <GlassCard strong className="max-w-4xl mx-auto text-center !p-12">
          <h2 className="text-3xl font-semibold tracking-tight">See where your money's going.</h2>
          <p className="text-muted mt-2 max-w-md mx-auto">Link your first bank in under a minute. No commitment.</p>
          <div className="flex justify-center gap-3 mt-6">
            <Button size="lg" href="/signup" icon="arrow-up-right">Start free</Button>
            <Button size="lg" variant="secondary" href="/login">Sign in</Button>
          </div>
        </GlassCard>
      </section>

      <footer className="px-6 py-10 border-t border-border-soft">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span>FinFlow · Built in Lagos</span>
          </div>
          <p>© {new Date().getFullYear()} FinFlow. NGN-first. Powered by Mono & Paystack.</p>
        </div>
      </footer>
    </div>
  )
}
