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
}: {
  users: UserProfile[]
  currentUserId: string
}) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError]       = useState('')

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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                    }`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== currentUserId && (
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
