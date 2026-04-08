import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Role } from '@/lib/types'

export async function POST(request: Request) {
  // Verify the caller is an authenticated admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const email: string = (body.email ?? '').trim().toLowerCase()
  const full_name: string = (body.full_name ?? '').trim()
  const role: Role = ['admin', 'controller', 'user'].includes(body.role) ? body.role : 'user'

  if (!email) {
    return Response.json({ error: 'Email is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Invite creates the auth.users row; the DB trigger auto-creates user_profiles
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name },
    redirectTo: `${appUrl}/auth/confirm`,
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 400 })
  }

  // Update the profile with intended role and full_name
  if (data.user) {
    await admin
      .from('user_profiles')
      .update({ role, full_name })
      .eq('id', data.user.id)
  }

  return Response.json({ success: true })
}
