import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GlassCard, Section, Stat, Chip, Button, EmptyState } from '@/components/ui/primitives'
import { AreaChart, WaterfallChart, DonutChart, HeatmapCalendar, Sparkline } from '@/components/ui/charts'
import { Icon } from '@/components/ui/Icon'
import {
  getCurrentWorkspace,
  getAccounts,
  getCategories,
  getTransactions,
} from '@/lib/supabase/queries'
import {
  monthlyBuckets, netWorthSeries, categoryBreakdown,
  dailyHeatmap, topMerchants, totals, percentDelta,
} from '@/lib/analytics'
import { formatMoney, formatDate, toISODate } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const ws = await getCurrentWorkspace()
  if (!ws) redirect('/login')

  // Widest window any dashboard chart shows is 6 months (heatmap).
  // No reason to drag in older rows + their joins.
  const sixMonthsAgo = toISODate(new Date(Date.now() - 182 * 86_400_000))

  const [accounts, categories, txs] = await Promise.all([
    getAccounts(ws.id),
    getCategories(ws.id),
    getTransactions(ws.id, { from: sixMonthsAgo, limit: 500 }),
  ])

  const ccy = ws.display_currency
  const netWorth = accounts.reduce((s, a) => s + Number(a.current_balance), 0)
  const this30 = totals(txs, 30)
  const prev30 = totals(txs.filter(t => new Date(t.transaction_date) < new Date(Date.now() - 30 * 86_400_000)), 30)

  const buckets = monthlyBuckets(txs, 6)
  const nwSeries = netWorthSeries(accounts, txs, 90)
  const breakdown = categoryBreakdown(txs, categories, { direction: 'debit', sinceDays: 30 })
  const heatmap = dailyHeatmap(txs, 182)
  const top = topMerchants(txs, 5)
  const recent = txs.slice(0, 6)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const hasData = accounts.length > 0 || txs.length > 0

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl glass-strong p-6 sm:p-8">
        <div className="absolute inset-0 hero-grid opacity-40" aria-hidden />
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-sm text-muted">{greeting}</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-0.5">
              Here's how your money's flowing.
            </h1>
            <p className="text-sm text-muted mt-1.5">
              {formatDate(new Date(), 'long')} · {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button href="/timeline?new=1" icon="plus">Add transaction</Button>
            <Button href="/accounts?link=1" variant="secondary" icon="link">Link bank</Button>
          </div>
        </div>
      </header>

      {!hasData ? (
        <GlassCard>
          <EmptyState
            icon="sparkles"
            title="Welcome to FinFlow"
            description="Add an account or link your bank to see your timeline come alive."
            action={
              <div className="flex justify-center gap-2">
                <Button href="/accounts?link=1" icon="link">Link a bank</Button>
                <Button href="/accounts?new=1" variant="secondary" icon="plus">Add manually</Button>
              </div>
            }
          />
        </GlassCard>
      ) : (
        <>
          {/* Stat grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard>
              <Stat
                label="Net worth"
                value={formatMoney(netWorth, ccy, { compact: netWorth > 1e6 })}
                icon="wallet"
                delta={{ value: percentDelta(netWorth, netWorth - this30.net), label: 'vs 30d ago' }}
              />
            </GlassCard>
            <GlassCard>
              <Stat
                label="Income · 30d"
                value={formatMoney(this30.income, ccy, { compact: this30.income > 1e6 })}
                icon="arrow-down-circle"
                accent="up"
                delta={{ value: percentDelta(this30.income, prev30.income) }}
              />
            </GlassCard>
            <GlassCard>
              <Stat
                label="Spend · 30d"
                value={formatMoney(this30.spend, ccy, { compact: this30.spend > 1e6 })}
                icon="trending-down"
                accent="down"
                delta={{ value: percentDelta(this30.spend, prev30.spend) }}
              />
            </GlassCard>
            <GlassCard>
              <Stat
                label="Net flow · 30d"
                value={formatMoney(this30.net, ccy, { compact: Math.abs(this30.net) > 1e6, sign: true })}
                icon={this30.net >= 0 ? 'trending-up' : 'trending-down'}
                accent={this30.net >= 0 ? 'up' : 'down'}
                hint={`${this30.count} transactions`}
              />
            </GlassCard>
          </div>

          {/* Net worth + Cashflow */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <GlassCard className="lg:col-span-2">
              <Section
                title="Net worth"
                description="All accounts, last 90 days"
                action={<Chip tone="accent" icon="trending-up">Live</Chip>}
              >
                <AreaChart data={nwSeries} currency={ccy} height={260} />
              </Section>
            </GlassCard>

            <GlassCard>
              <Section title="Cashflow" description="Last 6 months">
                <WaterfallChart data={buckets} currency={ccy} height={220} />
                <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-money-up" /> Income</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-money-down" /> Spend</span>
                </div>
              </Section>
            </GlassCard>
          </div>

          {/* Categories + Accounts + Top merchants */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <GlassCard>
              <Section title="Where it went" description="By category · 30 days">
                <DonutChart data={breakdown} centerLabel="Spend" centerValue={this30.spend} currency={ccy} />
              </Section>
            </GlassCard>

            <GlassCard className="lg:col-span-2">
              <Section
                title="Accounts"
                action={<Link href="/accounts" className="text-xs text-accent font-medium">Manage →</Link>}
              >
                <ul className="divide-y divide-border-soft">
                  {accounts.slice(0, 5).map(a => (
                    <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span
                        className="h-9 w-9 rounded-xl grid place-items-center text-white text-xs font-semibold shrink-0"
                        style={{ background: a.color }}
                      >
                        {a.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        <p className="text-xs text-muted truncate">
                          {a.institution ?? a.kind} · {a.account_mask ? '••' + a.account_mask : a.provider}
                        </p>
                      </div>
                      <Sparkline
                        data={Array.from({ length: 12 }, () => Number(a.current_balance) * (0.9 + Math.random() * 0.2))}
                        width={80}
                        height={28}
                      />
                      <div className="text-right shrink-0 w-28">
                        <p className="text-sm font-semibold tabular">{formatMoney(a.current_balance, a.currency, { compact: a.current_balance > 1e6 })}</p>
                        <p className="text-[10px] text-subtle">{a.currency}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Section>
            </GlassCard>
          </div>

          {/* Heatmap + Top merchants */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <GlassCard className="lg:col-span-2">
              <Section title="Spending heatmap" description="Daily spend intensity · last 6 months">
                <HeatmapCalendar data={heatmap} currency={ccy} weeks={26} />
              </Section>
            </GlassCard>

            <GlassCard>
              <Section title="Top merchants" description="30 days">
                {top.length === 0 ? (
                  <EmptyState icon="receipt" title="No spend yet" />
                ) : (
                  <ul className="space-y-3">
                    {top.map((m, i) => (
                      <li key={m.name} className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded-lg bg-surface-alt grid place-items-center text-xs font-semibold text-muted shrink-0">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{m.name}</p>
                          <p className="text-xs text-muted">{m.count}× this month</p>
                        </div>
                        <p className="tabular font-semibold text-sm">{formatMoney(m.total, ccy, { compact: m.total > 1e6 })}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </GlassCard>
          </div>

          {/* Recent activity */}
          <GlassCard padded={false}>
            <div className="px-5 sm:px-6 pt-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Recent activity</h2>
                <p className="text-xs text-muted mt-0.5">Latest transactions across all accounts</p>
              </div>
              <Link href="/timeline" className="text-xs text-accent font-medium">
                View timeline →
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-border-soft">
              {recent.map(t => {
                const credit = t.direction === 'credit'
                return (
                  <li key={t.id} className="flex items-center gap-4 px-5 sm:px-6 py-3 hover:bg-surface-alt transition">
                    <span
                      className="h-9 w-9 rounded-xl grid place-items-center shrink-0"
                      style={{ background: t.category?.color ? `${t.category.color}22` : 'var(--surface-alt)' }}
                    >
                      <Icon
                        name={t.category?.icon ?? 'tag'}
                        size={15}
                        style={{ color: t.category?.color }}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{t.description || t.merchant?.name || 'Transaction'}</p>
                      <p className="text-xs text-muted truncate">
                        {t.category?.name ?? 'Uncategorised'} · {t.account?.name} · {formatDate(t.transaction_date, 'rel')}
                      </p>
                    </div>
                    <p className={`tabular font-semibold text-sm shrink-0 ${credit ? 'text-money-up' : 'text-tx'}`}>
                      {credit ? '+' : '−'}{formatMoney(Math.abs(Number(t.amount)), t.currency)}
                    </p>
                  </li>
                )
              })}
            </ul>
          </GlassCard>
        </>
      )}
    </div>
  )
}
