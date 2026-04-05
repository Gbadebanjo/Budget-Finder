export type Role = 'admin' | 'controller' | 'user'
export type PaymentStatus = 'pending' | 'approved' | 'rejected'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: Role
  is_active: boolean
  created_at: string
}

export interface Payment {
  id: string
  created_by: string
  amount: number
  description: string
  status: PaymentStatus
  created_at: string
  updated_at: string
  creator?: UserProfile
}

export interface ApprovalLog {
  id: string
  payment_id: string
  reviewed_by: string
  action: 'approved' | 'rejected'
  comment: string | null
  created_at: string
  reviewer?: UserProfile
  payment?: Payment
}
