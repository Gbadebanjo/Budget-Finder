import { redirect } from 'next/navigation'
import {
  getCurrentWorkspace, getBudgets, getCategories, getTransactions,
} from '@/lib/supabase/queries'
import { BudgetsClient } from './BudgetsClient'

export const dynamic = 'force-dynamic'

export default async function BudgetsPage() {
  const ws = await getCurrentWorkspace()
  if (!ws) redirect('/login')

  const [budgets, categories, txs] = await Promise.all([
    getBudgets(ws.id),
    getCategories(ws.id),
    getTransactions(ws.id, { limit: 1000 }),
  ])

  return (
    <BudgetsClient
      workspaceId={ws.id}
      currency={ws.display_currency}
      budgets={budgets}
      categories={categories}
      txs={txs}
    />
  )
}
