'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, Role } from '@/lib/types'

const ROLES: Role[] = ['admin', 'controller', 'user']

const roleBadge: Record<Role, string> = {
  admin:      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  controller: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  user:       'bg-surface-alt text-muted',
}

export default function UserTable({
  users,
  currentUserId,
  unconfirmedIds,
}: {
  users: UserProfile[]
  currentUserId: string
  unconfirmedIds: Set<string>
}) {
  const router = useRouter()
  const [updating, setUpdating]   = useState<string | null>(null)
  const [error, setError]         = useState('')
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [resending, setResending] = useState<string | null>(null)
  const [resent, setResent]       = useState<string | null>(null)

  async function updateRole(userId: string, role: Role) {
    setUpdating(userId + 'role')
    setError('')
    const supabase = createClient()
    const { error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId)
    if (error) setError(error.message)
    setUpdating(null)
    router.refresh()
  }

  async function resendInvite(userId: string, email: string) {
    setResending(userId)
    setError('')
    const res = await fetch('/api/invite/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const json = await res.json()
    if (!res.ok) setError(json.error)
    else { setResent(userId); setTimeout(() => setResent(null), 3000) }
    setResending(null)
  }

  async function deleteUser(userId: string) {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return
    setDeleting(userId)
    setError('')
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) setError(json.error)
    setDeleting(null)
    router.refresh()
  }

  async function toggleActive(userId: string, is_active: boolean) {
    setUpdating(userId + 'active')
    setError('')
    const supabase = createClient()
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: !is_active })
      .eq('id', userId)
    if (error) setError(error.message)
    setUpdating(null)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-alt">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-surface-alt transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-tx">{u.full_name || '—'}</p>
                    <p className="text-xs text-muted mt-0.5">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    {u.id === currentUserId ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge[u.role]}`}>
                        {u.role}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={updating === u.id + 'role'}
                        onChange={e => updateRole(u.id, e.target.value as Role)}
                        className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-surface-alt text-tx focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 transition"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                        u.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {unconfirmedIds.has(u.id) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                          Pending setup
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {u.id !== currentUserId && (
                      <div className="flex items-center justify-end gap-2">
                        {unconfirmedIds.has(u.id) && (
                          <button
                            onClick={() => resendInvite(u.id, u.email)}
                            disabled={resending === u.id}
                            title="Resend invitation email"
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-accent hover:bg-accent-light disabled:opacity-50 transition-colors"
                          >
                            {resending === u.id ? '…' : resent === u.id ? 'Sent!' : 'Resend Invite'}
                          </button>
                        )}
                        <button
                          onClick={() => toggleActive(u.id, u.is_active)}
                          disabled={updating === u.id + 'active'}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            u.is_active
                              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                              : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30'
                          }`}
                        >
                          {updating === u.id + 'active' ? '…' : u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        {!u.is_active && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            disabled={deleting === u.id}
                            title="Delete user permanently"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 transition-colors"
                          >
                            {deleting === u.id ? (
                              <span className="text-xs">…</span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
