import { redirect } from 'next/navigation'
import {
  getSession,
  getCurrentWorkspace,
  getCurrentProfile,
  getSubscription,
} from '@/lib/supabase/queries'
import { Sidebar } from '@/components/shell/Sidebar'
import { Topbar } from '@/components/shell/Topbar'
import { BottomNav } from '@/components/shell/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // All four helpers below share a single createClient() and single
  // auth.getUser() roundtrip via React cache(). One auth call, not four.
  const user = await getSession()
  if (!user) redirect('/login')

  const [profile, workspace] = await Promise.all([
    getCurrentProfile(),
    getCurrentWorkspace(),
  ])
  const sub = workspace ? await getSubscription(workspace.id) : null

  return (
    <div className="app-backdrop min-h-screen flex">
      <Sidebar planTier={sub?.plan ?? 'free'} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          profileName={profile?.full_name ?? null}
          profileEmail={user.email ?? ''}
          workspaceName={workspace?.name ?? null}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10 max-w-[1500px] w-full mx-auto">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
