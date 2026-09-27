import { supabase } from './supabase';
import { loadDemo, reviseDemo, revisionHistoryDemo } from './demo';
import type { Snapshot, Transaction, TransactionInput } from '../domain/types';

export interface Revision {
  id: string;
  actor_id: string;
  created_at: string;
  resulting_version: number;
  before_snapshot: {
    transaction: Transaction;
    fees: Transaction[];
    splits: Snapshot['splits'];
    tags?: Snapshot['transactionTags'];
  };
  after_snapshot: {
    transaction: Transaction;
    fees: Transaction[];
    splits: Snapshot['splits'];
    tags?: Snapshot['transactionTags'];
  };
}
export function transactionInput(data: Snapshot, tx: Transaction): TransactionInput {
  return {
    type: tx.type,
    amount: tx.amount,
    wallet_id: tx.wallet_id,
    destination_wallet_id: tx.destination_wallet_id,
    transaction_actor: tx.transaction_actor,
    transaction_scope: tx.transaction_scope,
    scope_member_id: tx.scope_member_id,
    status: tx.status,
    occurred_at: tx.occurred_at,
    category_id: tx.category_id,
    merchant: tx.merchant,
    notes: tx.notes,
    tag_ids: data.transactionTags.filter((t) => t.transaction_id === tx.id).map((t) => t.tag_id),
    fee_amount: data.transactions
      .filter((t) => t.parent_transaction_id === tx.id && !t.deleted_at)
      .reduce((n, t) => n + t.amount, 0),
    splits: data.splits
      .filter((s) => s.transaction_id === tx.id)
      .map(({ category_id, amount }) => ({ category_id, amount })),
  };
}
export async function reviseTransaction(tx: Transaction, input: TransactionInput, key: string) {
  if (!supabase) return reviseDemo(tx.id, tx.version ?? 1, input, key);
  const r = await supabase.rpc('revise_transaction', {
    p_id: tx.id,
    p_expected_version: tx.version ?? 1,
    p_input: { ...input, household_id: tx.household_id },
    p_request_key: key,
  });
  if (r.error)
    throw new Error(
      /version conflict/.test(r.error.message)
        ? 'Transaksi sudah berubah. Tutup editor lalu muat ulang sebelum mengedit kembali.'
        : r.error.message,
    );
}
export async function transactionHistory(id: string): Promise<Revision[]> {
  if (!supabase) {
    loadDemo();
    return revisionHistoryDemo(id);
  }
  const r = await supabase
    .from('transaction_revisions')
    .select('*')
    .eq('transaction_id', id)
    .order('resulting_version', { ascending: false })
    .limit(100);
  if (r.error) throw new Error(r.error.message);
  return r.data as Revision[];
}
