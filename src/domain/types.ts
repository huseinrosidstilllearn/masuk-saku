export type Role = 'owner' | 'member';
export interface Member {
  user_id: string;
  household_id: string;
  role: Role;
  display_name: string;
  active?: boolean;
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
  icon?: string;
  color?: string;
  account_identifier?: string | null;
  version?: number;
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
  recurring_template_id?: string | null;
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
  active?: boolean;
  cadence?: 'weekly' | 'monthly' | 'custom';
  auto_continue?: boolean;
  predecessor_id?: string | null;
  closed_at?: string | null;
  closed_spent?: number | null;
  automation_error?: string | null;
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
  recurring?: RecurringTemplate[];
  occurrences?: RecurringOccurrence[];
}
export interface RecurringTemplate {
  id: string;
  household_id: string;
  created_by: string;
  name: string;
  mode: 'ask' | 'auto_create';
  cadence: 'weekly' | 'monthly';
  anchor_date: string;
  next_run: string;
  end_date: string | null;
  run_time: string;
  active: boolean;
  occurrence_index: number;
  version: number;
  transaction_template: TransactionInput;
}
export interface RecurringOccurrence {
  id: string;
  template_id: string;
  household_id: string;
  scheduled_date: string;
  status: 'pending' | 'created' | 'skipped' | 'error';
  input: TransactionInput;
  transaction_id: string | null;
  error_reason: string | null;
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
