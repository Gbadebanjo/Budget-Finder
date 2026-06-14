import { redirect } from 'next/navigation'
import { getCurrentWorkspace, getAccounts, getTransactions } from '@/lib/supabase/queries'
import { AccountsClient } from './AccountsClient'

export const dynamic = 'force-dynamic'

export default async function AccountsPage() {
  const ws = await getCurrentWorkspace()
  if (!ws) redirect('/login')

  const [accounts, recent] = await Promise.all([
    getAccounts(ws.id),
    getTransactions(ws.id, { limit: 150 }),
  ])

  return (
    <AccountsClient
      workspaceId={ws.id}
      currency={ws.display_currency}
      accounts={accounts}
      recent={recent}
    />
  )
}
