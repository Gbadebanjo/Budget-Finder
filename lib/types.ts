// ─── Enums (mirror schema) ──────────────────────────────────
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'
export type AccountKind = 'bank' | 'cash' | 'wallet' | 'card' | 'savings' | 'investment' | 'manual'
export type AccountProvider = 'manual' | 'mono' | 'okra' | 'plaid'
export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'failed' | 'reauth_required'
export type TxDirection = 'debit' | 'credit'
export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type GoalStatus = 'active' | 'paused' | 'reached' | 'archived'
export type PlanTier = 'free' | 'pro' | 'family' | 'business'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused'

// ─── Entities ──────────────────────────────────────────────
export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  display_currency: string
  locale: string
  created_at: string
}

export interface Workspace {
  id: string
  name: string
  owner_id: string
  is_personal: boolean
  display_currency: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  joined_at: string
  profile?: UserProfile
}

export interface Account {
  id: string
  workspace_id: string
  name: string
  institution: string | null
  kind: AccountKind
  provider: AccountProvider
  currency: string
  account_mask: string | null
  current_balance: number
  available_balance: number | null
  color: string
  icon: string | null
  is_archived: boolean
  sync_status: SyncStatus
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface LinkedAccount {
  id: string
  workspace_id: string
  account_id: string
  provider: AccountProvider
  external_id: string
  last_cursor: string | null
  last_synced_at: string | null
  next_sync_at: string | null
  reauth_required: boolean
  metadata: Record<string, unknown>
}

export interface Category {
  id: string
  workspace_id: string
  name: string
  icon: string
  color: string
  parent_id: string | null
  is_system: boolean
  sort_order: number
}

export interface Merchant {
  id: string
  workspace_id: string
  name: string
  logo_url: string | null
  default_category_id: string | null
}

export interface Tag {
  id: string
  workspace_id: string
  name: string
  color: string
}

export interface Transaction {
  id: string
  workspace_id: string
  account_id: string
  category_id: string | null
  merchant_id: string | null
  transaction_date: string
  posted_at: string | null
  direction: TxDirection
  amount: number
  currency: string
  fx_amount: number | null
  fx_currency: string | null
  description: string
  note: string | null
  balance_after: number | null
  is_pending: boolean
  is_recurring: boolean
  is_transfer: boolean
  transfer_pair_id: string | null
  external_id: string | null
  receipt_url: string | null
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_at: string

  // Joined
  account?: Account
  category?: Category
  merchant?: Merchant
  tags?: Tag[]
}

export interface Budget {
  id: string
  workspace_id: string
  category_id: string
  period: BudgetPeriod
  amount: number
  rollover: boolean
  alert_at: number
  starts_on: string
  category?: Category
  spent?: number
}

export interface Goal {
  id: string
  workspace_id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  account_id: string | null
  status: GoalStatus
  color: string
  icon: string
  created_at: string
}

export interface RecurringRule {
  id: string
  workspace_id: string
  account_id: string | null
  merchant_id: string | null
  category_id: string | null
  description_pattern: string | null
  amount: number | null
  cadence_days: number
  next_due_on: string | null
  confidence: number | null
  is_user_defined: boolean
}

export interface Subscription {
  workspace_id: string
  plan: PlanTier
  status: SubscriptionStatus
  paystack_customer_code: string | null
  paystack_subscription_code: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

export interface Notification {
  id: string
  workspace_id: string
  user_id: string | null
  kind: string
  title: string
  body: string | null
  href: string | null
  read_at: string | null
  created_at: string
}
