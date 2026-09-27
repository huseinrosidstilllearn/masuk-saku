export type Role = 'owner' | 'member';
export interface Member {
  user_id: string;
  household_id: string;
  role: Role;
  display_name: string;
}
export interface Wallet {
  id: string;
  household_id: string;
  name: string;
  type: 'bank' | 'cash' | 'e_wallet';
  ownership: 'personal' | 'shared';
  wallet_owner: string | null;
  initial_balance: number;
  active: boolean;
}
export interface Transaction {
  id: string;
  household_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  wallet_id: string;
  destination_wallet_id: string | null;
  transaction_actor: string;
  transaction_scope: 'personal' | 'family';
  scope_member_id: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  occurred_at: string;
  category_id: string | null;
  merchant: string;
  notes: string;
  created_by: string;
  deleted_at: string | null;
  parent_transaction_id?: string | null;
  source?: string;
  version?: number;
}
export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  kind: 'income' | 'expense' | 'both';
  color?: string;
  icon?: string;
  sort_order?: number;
}
export interface Tag {
  id: string;
  name: string;
}
export interface Split {
  category_id: string;
  amount: number;
}
export interface Budget {
  id: string;
  name: string;
  category_id: string | null;
  wallet_id: string | null;
  amount: number;
  start_date: string;
  end_date: string;
  rollover: 'reset' | 'rollover';
  rollover_amount: number;
  warning_thresholds: number[];
}
export interface Goal {
  id: string;
  title: string;
  target_amount: number;
  deadline: string | null;
  saved: number;
  notes: string;
  status: 'active' | 'completed' | 'archived';
}
export interface GoalContribution {
  id: string;
  goal_id: string;
  amount: number;
  created_by: string;
  contributed_at: string;
}
export interface Snapshot {
  household: {
    id: string;
    name: string;
    attachment_retention: string;
    session_lock_minutes: number;
  };
  members: Member[];
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  tags: Tag[];
  transactionTags: { transaction_id: string; tag_id: string }[];
  splits: (Split & { transaction_id: string })[];
  budgets: Budget[];
  goals: Goal[];
  contributions: GoalContribution[];
}
export interface TransactionInput {
  type: Transaction['type'];
  amount: number;
  wallet_id: string;
  destination_wallet_id: string | null;
  transaction_actor: string;
  transaction_scope: Transaction['transaction_scope'];
  scope_member_id: string | null;
  status: Transaction['status'];
  occurred_at: string;
  category_id: string | null;
  merchant: string;
  notes: string;
  fee_amount: number;
  splits?: Split[];
  tag_ids?: string[];
}
