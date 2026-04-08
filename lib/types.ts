export type Role = "admin" | "controller" | "user";
export type TransactionStatus = "pending" | "approved" | "rejected";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface CapitalSource {
  id: string;
  name: string;
  amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: UserProfile;
}

export interface Category {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  creator?: UserProfile;
}

export interface Trigger {
  id: string;
  category_id: string;
  name: string;
  price: number;
  created_by: string;
  created_at: string;
  category?: Category;
  creator?: UserProfile;
}

export interface Transaction {
  id: string;
  transaction_date: string;
  beneficiaries: string;
  description: string;
  amount: number;
  capital_source_id?: string;
  category_id: string;
  trigger_id?: string;
  balance_after?: number;
  created_by: string;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
  creator?: UserProfile;
  capital_source?: CapitalSource;
  category?: Category;
  trigger?: Trigger;
}

export interface ApprovalLog {
  id: string;
  transaction_id: string;
  reviewed_by: string;
  action: "approved" | "rejected";
  comment: string | null;
  created_at: string;
  reviewer?: UserProfile;
  transaction?: Transaction;
}
