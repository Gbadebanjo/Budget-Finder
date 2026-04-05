'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Payment {
  id: string
  description: string
  amount: number
  created_at: string
  creator?: { full_name: string; email: string } | null
}

export default function PendingApprovals({
  payments,
  reviewerId,
}: {
  payments: Payment[]
  reviewerId: string
}) {
  const router = useRouter()
  // expanded[id] = 'approve' | 'reject' | undefined
  const [expanded, setExpanded] = useState<Record<string, 'approve' | 'reject'>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function submit(paymentId: string, action: 'approved' | 'rejected') {
    setLoading(paymentId)
    setErrors(prev => ({ ...prev, [paymentId]: '' }))

    const supabase = createClient()

    const { error: updateErr } = await supabase
      .from('payments')
      .update({ status: action })
      .eq('id', paymentId)

    if (updateErr) {
      setErrors(prev => ({ ...prev, [paymentId]: updateErr.message }))
      setLoading(null)
      return
    }

    const { error: logErr } = await supabase
      .from('approval_logs')
      .insert({
        payment_id: paymentId,
        reviewed_by: reviewerId,
        action,
        comment: comments[paymentId]?.trim() || null,
      })

    if (logErr) {
      setErrors(prev => ({ ...prev, [paymentId]: logErr.message }))
      setLoading(null)
      return
    }

    setLoading(null)
    setExpanded(prev => { const n = { ...prev }; delete n[paymentId]; return n })
    router.refresh()
  }

  if (payments.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl px-6 py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-green-600 dark:text-green-400">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-tx">All caught up!</p>
        <p className="text-xs text-muted mt-1">No payments awaiting your review.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="divide-y divide-border-soft">
        {payments.map(p => {
          const mode = expanded[p.id]
          const isLoading = loading === p.id

          return (
            <div key={p.id} className="p-5 space-y-3">
              {/* Payment info row */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/payments/${p.id}`}
                      className="text-sm font-semibold text-tx hover:text-accent transition-colors truncate"
                    >
                      {p.description}
                    </Link>
                    <span className="text-sm font-bold text-tx shrink-0">
                      ${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Submitted by{' '}
                    <span className="font-medium text-tx">
                      {p.creator?.full_name || p.creator?.email || 'Unknown'}
                    </span>
                    {' · '}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Action buttons — hidden when already expanded */}
                {!mode && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [p.id]: 'reject' }))}
                      className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [p.id]: 'approve' }))}
                      className="px-3 py-1.5 rounded-lg bg-green-600 dark:bg-green-700 text-xs font-semibold text-white hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>

              {/* Inline confirmation panel */}
              {mode && (
                <div className={`rounded-lg border p-4 space-y-3 ${
                  mode === 'approve'
                    ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20'
                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20'
                }`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {mode === 'approve' ? 'Approving payment' : 'Rejecting payment'} — add a comment (optional)
                  </p>

                  <textarea
                    rows={2}
                    value={comments[p.id] ?? ''}
                    onChange={e => setComments(prev => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="Leave a note for the submitter…"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-tx placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none transition"
                  />

                  {errors[p.id] && (
                    <p className="text-xs text-red-600 dark:text-red-400">{errors[p.id]}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpanded(prev => { const n = { ...prev }; delete n[p.id]; return n })}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted hover:text-tx hover:bg-surface-alt transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submit(p.id, mode === 'approve' ? 'approved' : 'rejected')}
                      disabled={isLoading}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                        mode === 'approve'
                          ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
                          : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                      }`}
                    >
                      {isLoading
                        ? `${mode === 'approve' ? 'Approving' : 'Rejecting'}…`
                        : `Confirm ${mode === 'approve' ? 'Approval' : 'Rejection'}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
