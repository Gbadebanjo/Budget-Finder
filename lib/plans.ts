import type { PlanTier } from './types'

export interface Plan {
  id: PlanTier
  name: string
  tagline: string
  /** Monthly price in NGN. */
  monthly: number
  /** Yearly price in NGN. */
  yearly: number
  features: string[]
  cta: string
  highlight?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Forever free, no card.',
    monthly: 0,
    yearly: 0,
    features: [
      '1 linked account',
      '60 days of history',
      '3 budgets, 1 goal',
      'Manual entry & CSV import',
      'Mobile + dark mode',
    ],
    cta: 'Current plan',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For everyone tracking real money.',
    monthly: 2_500,
    yearly: 25_000,
    features: [
      'Unlimited linked accounts',
      'Full transaction history',
      'All charts & insights',
      'Unlimited budgets & goals',
      'Recurring detection',
      'Weekly digest email',
      'CSV + PDF exports',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    id: 'family',
    name: 'Family',
    tagline: 'Money for the whole household.',
    monthly: 4_500,
    yearly: 45_000,
    features: [
      'Everything in Pro',
      'Up to 5 members',
      'Shared workspace',
      'Per-member spend limits',
      'Family dashboard',
    ],
    cta: 'Upgrade to Family',
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'For ministries, NGOs and SMBs.',
    monthly: 12_000,
    yearly: 120_000,
    features: [
      'Everything in Family',
      'Audit log',
      'Departments & approval flows',
      'API access',
      'Donor-ready reports',
      'Priority support',
    ],
    cta: 'Talk to sales',
  },
]
