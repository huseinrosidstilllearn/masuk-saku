import { snapshotSchema } from '../lib/snapshot-schema';
import type { Snapshot } from './types';
import { validateBudget, validateGoal } from './planning';
import { validateTransaction } from './finance';
export function previewImport(value: unknown): Snapshot {
  if (
    !value ||
    typeof value !== 'object' ||
    !('schema_version' in value) ||
    value.schema_version !== 1 ||
    !('kind' in value) ||
    value.kind !== 'household_snapshot' ||
    !('data' in value)
  )
    throw new Error('Gunakan ekspor JSON Masuk Saku versi 1.');
  const data = snapshotSchema.parse(value.data);
  const lists = [
    data.wallets,
    data.categories,
    data.tags,
    data.transactions,
    data.budgets,
    data.goals,
    data.contributions,
  ];
  for (const list of lists)
    if (list.length > 1000 || new Set(list.map((r) => r.id)).size !== list.length)
      throw new Error('Maksimal 1.000 baris per jenis, tanpa ID duplikat.');
  if (data.transactions.filter((t) => !t.parent_transaction_id && !t.deleted_at).length > 500)
    throw new Error('Impor maksimal 500 transaksi utama sekali jalan.');
  const has = (list: { id: string }[], id: string | null | undefined) =>
    !id || list.some((r) => r.id === id);
  for (const c of data.categories)
    if (
      !has(data.categories, c.parent_id) ||
      c.parent_id === c.id ||
      data.categories.find((r) => r.id === c.parent_id)?.parent_id
    )
      throw new Error('Struktur kategori tidak valid.');
  for (const w of data.wallets)
    if (
      w.household_id !== data.household.id ||
      (w.ownership === 'personal' && !data.members.some((m) => m.user_id === w.wallet_owner))
    )
      throw new Error('Pemilik dompet tidak valid.');
  for (const t of data.transactions) {
    if (
      t.household_id !== data.household.id ||
      !has(data.categories, t.category_id) ||
      !has(data.transactions, t.parent_transaction_id) ||
      !data.members.some((m) => m.user_id === t.transaction_actor) ||
      (t.transaction_scope === 'personal' &&
        !data.members.some((m) => m.user_id === t.scope_member_id))
    )
      throw new Error('Referensi transaksi tidak valid.');
    validateTransaction(
      t,
      data.wallets.map((w) => ({ ...w, active: true })),
      data.splits.filter((s) => s.transaction_id === t.id),
    );
  }
  for (const s of data.splits)
    if (!has(data.transactions, s.transaction_id) || !has(data.categories, s.category_id))
      throw new Error('Referensi split tidak valid.');
  for (const s of data.transactionTags)
    if (!has(data.transactions, s.transaction_id) || !has(data.tags, s.tag_id))
      throw new Error('Referensi tag tidak valid.');
  for (const b of data.budgets) {
    validateBudget(b);
    if (!has(data.categories, b.category_id) || !has(data.wallets, b.wallet_id))
      throw new Error('Referensi anggaran tidak valid.');
  }
  for (const g of data.goals) validateGoal(g);
  for (const c of data.contributions)
    if (!has(data.goals, c.goal_id)) throw new Error('Referensi tabungan tidak valid.');
  return data;
}
