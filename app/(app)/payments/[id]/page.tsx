import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import ApprovalForm from './ApprovalForm'
import type { PaymentStatus } from '@/lib/types'

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: payment } = await supabase
    .from('payments')
    .select('*, creator:user_profiles!payments_created_by_fkey(id, full_name, email)')
    .eq('id', id)
    .single()

  if (!payment) notFound()

  const { data: logs } = await supabase
    .from('approval_logs')
    .select('*, reviewer:user_profiles!approval_logs_reviewed_by_fkey(full_name, email)')
    .eq('payment_id', id)
    .order('created_at', { ascending: false })

  const isPrivileged = profile?.role === 'admin' || profile?.role === 'controller'
  const isOwnPayment = payment.created_by === user!.id
  const canApprove   = isPrivileged && !isOwnPayment && payment.status === 'pending'

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back link */}
      <Link href="/payments" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-tx transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to payments
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tx">{payment.description}</h1>
          <p className="text-subtle text-xs mt-1 font-mono">ID: {payment.id}</p>
        </div>
        <StatusBadge status={payment.status as PaymentStatus} />
      </div>

      {/* Details card */}
      <div className="bg-surface border border-border rounded-xl divide-y divide-border-soft overflow-hidden">
        {([
          ['Amount',       `$${Number(payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
          ['Submitted by', payment.creator?.full_name || payment.creator?.email],
          ['Created',      new Date(payment.created_at).toLocaleString()],
          ['Last updated', new Date(payment.updated_at).toLocaleString()],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-muted">{label}</span>
            <span className="text-sm font-semibold text-tx">{value}</span>
          </div>
        ))}
      </div>

      {/* Approval action */}
      {canApprove && <ApprovalForm paymentId={payment.id} />}

      {/* Cannot approve own payment notice */}
      {isPrivileged && isOwnPayment && payment.status === 'pending' && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4 text-sm text-amber-700 dark:text-amber-400">
          You cannot approve or reject your own payment.
        </div>
      )}

      {/* Audit log */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-tx text-sm">Audit Log</h2>
        </div>
        <div className="divide-y divide-border-soft">
          {/* Created event */}
          <div className="px-6 py-4 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-subtle mt-1.5 shrink-0" />
            <div>
              <p className="text-sm text-tx">
                <span className="font-semibold">{payment.creator?.full_name || payment.creator?.email}</span>
                {' '}submitted this payment
              </p>
              <p className="text-xs text-muted mt-0.5">{new Date(payment.created_at).toLocaleString()}</p>
            </div>
          </div>

          {(logs ?? []).map((log: any) => (
            <div key={log.id} className="px-6 py-4 flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                log.action === 'approved' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="text-sm text-tx">
                  <span className="font-semibold">{log.reviewer?.full_name || log.reviewer?.email}</span>
                  {' '}{log.action} this payment
                  {log.comment && (
                    <span className="text-muted"> — &ldquo;{log.comment}&rdquo;</span>
                  )}
                </p>
                <p className="text-xs text-muted mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}

          {(logs ?? []).length === 0 && payment.status === 'pending' && (
            <p className="px-6 py-4 text-sm text-muted">Awaiting review.</p>
          )}
        </div>
      </div>
    </div>
  )
}
