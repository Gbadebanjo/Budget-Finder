import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserTable from './UserTable'
import InviteForm from './InviteForm'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tx">User Management</h1>
          <p className="text-muted text-sm mt-1">Manage roles and access for all users.</p>
        </div>
        <InviteForm />
      </div>

      <UserTable users={users ?? []} currentUserId={user!.id} />
    </div>
  )
}
