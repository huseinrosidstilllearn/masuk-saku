import { previewCapture } from './receipt-capture';
import { supabase } from './supabase';
import * as demo from './demo';
import { snapshotSchema } from './snapshot-schema';
import type { Snapshot, TransactionInput, Wallet } from '../domain/types';
function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}
export async function loadSnapshot(userId: string): Promise<Snapshot | null> {
  if (!supabase) return demo.loadDemo();
  const membership = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', userId)
    .order('household_id')
    .limit(1);
  check(membership.error);
  const h = membership.data?.[0]?.household_id;
  if (!h) return null;
  const names = [
    'households',
    'household_members',
    'wallets',
    'transactions',
    'categories',
    'tags',
    'transaction_tags',
    'transaction_splits',
    'budgets',
    'savings_goals',
    'goal_contributions',
  ] as const;
  const results = await Promise.all(
    names.map((n) =>
      supabase!
        .from(n)
        .select('*')
        .eq(n === 'households' ? 'id' : 'household_id', h)
        .limit(10000),
    ),
  );
  results.forEach((r) => {
    check(r.error);
    if ((r.data?.length ?? 0) >= 10000)
      throw new Error(
        'Data melebihi batas starter. Gunakan loader dengan paginasi untuk 10.000 baris atau lebih.',
      );
  });
  const rows = Object.fromEntries(names.map((n, i) => [n, results[i].data ?? []]));
  const num = (r: Record<string, unknown>, fields: string[]) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, fields.includes(k) ? Number(v) : v]));
  return snapshotSchema.parse({
    household: rows.households[0],
    members: rows.household_members,
    wallets: rows.wallets.map((r) => num(r, ['initial_balance'])),
    transactions: rows.transactions.map((r) => num(r, ['amount'])),
    categories: rows.categories.sort((a, b) => Number(a.sort_order) - Number(b.sort_order)),
    tags: rows.tags,
    transactionTags: rows.transaction_tags,
    splits: rows.transaction_splits.map((r) => num(r, ['amount'])),
    budgets: rows.budgets.map((r) => num(r, ['amount', 'rollover_amount'])),
    goals: rows.savings_goals.map((g) => ({
      ...num(g, ['target_amount']),
      saved: rows.goal_contributions
        .filter((c) => c.goal_id === g.id)
        .reduce((n, c) => n + Number(c.amount), 0),
    })),
    contributions: rows.goal_contributions.map((c) => num(c, ['amount'])),
  });
}
export async function createHousehold(name: string, display: string) {
  const r = await supabase!.rpc('create_household', { p_name: name, p_display_name: display });
  check(r.error);
}
export async function saveTransaction(
  h: string,
  input: TransactionInput,
  key: string,
  draftId?: string,
  ack: string[] = [],
) {
  if (!supabase) {
    demo.createDemo(input, key);
    return;
  }
  const r = draftId
    ? await supabase.functions.invoke('ai-confirm', {
        body: {
          draft_id: draftId,
          input: { ...input, household_id: h },
          acknowledged: ack,
          request_key: key,
        },
      })
    : await supabase.rpc('create_transaction', {
        p_input: { ...input, household_id: h },
        p_request_key: key,
      });
  check(r.error);
}
export async function trashTransaction(id: string) {
  if (!supabase) return demo.trashDemo(id);
  const r = await supabase.rpc('trash_transaction', { p_id: id });
  check(r.error);
}
export async function restoreTransaction(id: string) {
  if (!supabase) return demo.restoreDemo(id);
  const r = await supabase.rpc('restore_transaction', { p_id: id });
  check(r.error);
}
export async function createWallet(wallet: Wallet) {
  if (!supabase) return demo.walletDemo(wallet);
  const r = await supabase.from('wallets').insert(wallet);
  check(r.error);
}
export async function updateSettings(
  id: string,
  attachment_retention: string,
  session_lock_minutes: number,
) {
  if (!supabase) return demo.settingsDemo({ attachment_retention, session_lock_minutes });
  const r = await supabase
    .from('households')
    .update({ attachment_retention, session_lock_minutes })
    .eq('id', id);
  check(r.error);
}
export async function saveAiKey(household_id: string, api_key: string) {
  const r = await supabase!.functions.invoke('ai-credentials', {
    body: { household_id, api_key, provider: 'openrouter', model: 'openrouter/free' },
  });
  check(r.error);
}
export type AiCredentialStatus = { provider: string; model: string; updated_at: string };
export async function getMyAiCredentialStatus(
  household: string,
): Promise<AiCredentialStatus | null> {
  const r = await supabase!.rpc('get_my_ai_credential_status', { p_household: household });
  check(r.error);
  return r.data?.[0] ?? null;
}
export async function revokeMyAiCredential(household: string) {
  const r = await supabase!.rpc('revoke_my_ai_credential', { p_household: household });
  check(r.error);
}
export async function aiPreview(household_id: string, text: string) {
  return previewCapture(household_id, text);
}
