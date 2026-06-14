import { redirect } from 'next/navigation'
import { getCurrentWorkspace, getSubscription } from '@/lib/supabase/queries'
import { BillingClient } from './BillingClient'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const ws = await getCurrentWorkspace()
  if (!ws) redirect('/login')
  const sub = await getSubscription(ws.id)
  return <BillingClient subscription={sub} />
}
