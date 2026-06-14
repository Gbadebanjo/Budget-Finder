import { redirect } from 'next/navigation'
import {
  getCurrentWorkspace, getAccounts, getCategories, getTransactions,
} from '@/lib/supabase/queries'
import { TimelineClient } from './TimelineClient'

export const dynamic = 'force-dynamic'

export default async function TimelinePage() {
  const ws = await getCurrentWorkspace()
  if (!ws) redirect('/login')

  const [accounts, categories, txs] = await Promise.all([
    getAccounts(ws.id),
    getCategories(ws.id),
    getTransactions(ws.id, { limit: 500 }),
  ])

  return (
    <TimelineClient
      workspaceId={ws.id}
      currency={ws.display_currency}
      accounts={accounts}
      categories={categories}
      initialTransactions={txs}
    />
  )
}
