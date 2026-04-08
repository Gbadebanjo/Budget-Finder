import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verify caller is an admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Prevent self-deletion
  if (id === user.id) {
    return Response.json({ error: 'You cannot delete your own account.' }, { status: 400 })
  }

  // Only allow deleting inactive users
  const { data: target } = await supabase
    .from('user_profiles')
    .select('is_active')
    .eq('id', id)
    .single()

  if (target?.is_active) {
    return Response.json({ error: 'Deactivate the user before deleting.' }, { status: 400 })
  }

  // Delete from auth.users — cascades to user_profiles
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) return Response.json({ error: error.message }, { status: 400 })

  return Response.json({ success: true })
}
