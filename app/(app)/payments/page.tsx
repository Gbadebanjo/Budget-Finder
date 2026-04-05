import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import type { PaymentStatus } from '@/lib/types'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const isPrivileged = profile?.role === 'admin' || profile?.role === 'controller'

  let query = supabase
    .from('payments')
    .select('*, creator:user_profiles!payments_created_by_fkey(full_name, email)')
    .order('created_at', { ascending: false })

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data: payments } = await query

  const filters = [
    { label: 'All',      value: '' },
    { label: 'Pending',  value: 'pending'  },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-tx">Payments</h1>
        <Link
          href="/payments/new"
          className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Payment
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface-alt border border-border p-1 rounded-lg w-fit">
        {filters.map(f => (
          <Link
            key={f.value}
            href={f.value ? `/payments?status=${f.value}` : '/payments'}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              (status ?? '') === f.value
                ? 'bg-surface shadow-sm text-tx'
                : 'text-muted hover:text-tx'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {(payments ?? []).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted text-sm">No payments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-alt">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Description</th>
                  {isPrivileged && (
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Submitted by</th>
                  )}
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {(payments ?? []).map((p: any) => (
                  <tr key={p.id} className="hover:bg-surface-alt transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/payments/${p.id}`} className="font-medium text-accent hover:text-accent-hover transition-colors">
                        {p.description}
                      </Link>
                    </td>
                    {isPrivileged && (
                      <td className="px-6 py-4 text-muted">
                        {p.creator?.full_name || p.creator?.email || '—'}
                      </td>
                    )}
                    <td className="px-6 py-4 font-semibold text-tx">
                      ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status as PaymentStatus} />
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
