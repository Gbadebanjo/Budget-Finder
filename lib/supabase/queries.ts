/**
 * Server-side helpers for workspace-scoped queries.
 *
 * `getSession` and `getCurrentWorkspace` are wrapped in React.cache() so the
 * layout + page + nested children share one Supabase Auth roundtrip per
 * request — instead of each calling getUser() independently.
 */

import { cache } from 'react'
import { createClient } from './server'
import type {
  Account, Budget, Category, Goal, Subscription, Transaction, Workspace, UserProfile,
} from '@/lib/types'

export const getSession = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getCurrentWorkspace = cache(async (): Promise<Workspace | null> => {
  const user = await getSession()
  if (!user) return null

  const supabase = await createClient()
  // RLS already restricts workspaces to ones the user is a member of, so no join needed.
  const { data } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (data) return data as Workspace

  // Self-heal: auth user exists but profile/workspace got wiped (e.g. schema reset).
  // The RPC is SECURITY DEFINER and idempotent — creates everything they need.
  await supabase.rpc('ensure_my_workspace')
  const { data: healed } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return (healed ?? null) as Workspace | null
})

export const getCurrentProfile = cache(async (): Promise<UserProfile | null> => {
  const user = await getSession()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  return data as UserProfile | null
})

export async function getAccounts(workspaceId: string): Promise<Account[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('accounts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true })
  return (data ?? []) as Account[]
}

export async function getCategories(workspaceId: string): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('sort_order')
  return (data ?? []) as Category[]
}

export async function getTransactions(
  workspaceId: string,
  opts: {
    from?: string
    to?: string
    accountId?: string
    categoryId?: string
    limit?: number
    search?: string
  } = {},
): Promise<Transaction[]> {
  const supabase = await createClient()
  let q = supabase
    .from('transactions')
    .select('*, account:accounts(*), category:categories(*), merchant:merchants(*)')
    .eq('workspace_id', workspaceId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (opts.from) q = q.gte('transaction_date', opts.from)
  if (opts.to)   q = q.lte('transaction_date', opts.to)
  if (opts.accountId)  q = q.eq('account_id', opts.accountId)
  if (opts.categoryId) q = q.eq('category_id', opts.categoryId)
  if (opts.search)     q = q.ilike('description', `%${opts.search}%`)
  if (opts.limit)      q = q.limit(opts.limit)

  const { data } = await q
  return (data ?? []) as Transaction[]
}

export async function getBudgets(workspaceId: string): Promise<Budget[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('workspace_id', workspaceId)
  return (data ?? []) as Budget[]
}

export async function getGoals(workspaceId: string): Promise<Goal[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('goals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
  return (data ?? []) as Goal[]
}

export const getSubscription = cache(async (workspaceId: string): Promise<Subscription | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  return data as Subscription | null
})
