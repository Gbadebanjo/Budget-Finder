import { redirect } from 'next/navigation'
import { getCurrentWorkspace, getGoals } from '@/lib/supabase/queries'
import { GoalsClient } from './GoalsClient'

export const dynamic = 'force-dynamic'

export default async function GoalsPage() {
  const ws = await getCurrentWorkspace()
  if (!ws) redirect('/login')
  const goals = await getGoals(ws.id)
  return <GoalsClient workspaceId={ws.id} currency={ws.display_currency} goals={goals} />
}
