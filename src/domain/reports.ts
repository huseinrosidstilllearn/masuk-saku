import type { Snapshot, Transaction } from './types';
import { dateInJakarta } from './finance';
export interface TransactionFilters {
  search?: string;
  from?: string;
  to?: string;
  type?: string;
  status?: string;
  scope?: string;
  wallet?: string;
  actor?: string;
  minimum?: number;
  maximum?: number;
}
export function filterTransactions(
  data: Snapshot,
  f: TransactionFilters,
  wallets: Set<string>,
  trash = false,
) {
  return data.transactions
    .filter((t) => {
      if (
        t.parent_transaction_id ||
        Boolean(t.deleted_at) !== trash ||
        !(
          wallets.has(t.wallet_id) ||
          (t.destination_wallet_id && wallets.has(t.destination_wallet_id))
        )
      )
        return false;
      const day = dateInJakarta(t.occurred_at);
      if (
        (f.from && day < f.from) ||
        (f.to && day > f.to) ||
        (f.type && t.type !== f.type) ||
        (f.status && t.status !== f.status) ||
        (f.scope && t.transaction_scope !== f.scope) ||
        (f.actor && t.transaction_actor !== f.actor) ||
        (f.wallet && t.wallet_id !== f.wallet && t.destination_wallet_id !== f.wallet) ||
        (f.minimum !== undefined && t.amount < f.minimum) ||
        (f.maximum !== undefined && t.amount > f.maximum)
      )
        return false;
      const search = (f.search ?? '').trim().toLocaleLowerCase('id-ID');
      const haystack = [
        t.merchant,
        t.notes,
        t.transaction_scope,
        t.status,
        t.occurred_at,
        data.wallets.find((w) => w.id === t.wallet_id)?.name,
        data.wallets.find((w) => w.id === t.destination_wallet_id)?.name,
        data.categories.find((c) => c.id === t.category_id)?.name,
        ...data.splits
          .filter((s) => s.transaction_id === t.id)
          .map((s) => data.categories.find((c) => c.id === s.category_id)?.name),
        data.members.find((m) => m.user_id === t.transaction_actor)?.display_name,
        ...data.transactionTags
          .filter((link) => link.transaction_id === t.id)
          .map((link) => data.tags.find((tag) => tag.id === link.tag_id)?.name),
      ]
        .join(' ')
        .toLocaleLowerCase('id-ID');
      return haystack.includes(search);
    })
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || a.id.localeCompare(b.id));
}
const DAY = 86400000;
export function dateOrdinal(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw Error('Tanggal belum valid.');
  const milliseconds = Date.parse(day + 'T00:00:00Z');
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString().slice(0, 10) !== day)
    throw Error('Tanggal belum valid.');
  return milliseconds / DAY;
}
export function previousPeriod(from: string, to: string) {
  const start = dateOrdinal(from),
    end = dateOrdinal(to);
  if (end < start) throw Error('Tanggal akhir harus sesudah tanggal mulai.');
  const format = (ordinal: number) => new Date(ordinal * DAY).toISOString().slice(0, 10);
  const prior = { from: format(start - (end - start + 1)), to: format(start - 1) };
  dateOrdinal(prior.from);
  dateOrdinal(prior.to);
  return prior;
}
export function categoryTotals(data: Snapshot, rows: Transaction[]) {
  const categories = new Map<string, number>();
  for (const t of rows.filter(
    (t) => t.type === 'expense' && t.status === 'completed' && !t.deleted_at,
  )) {
    const splits = data.splits.filter((s) => s.transaction_id === t.id);
    for (const item of splits.length
      ? splits
      : [{ category_id: t.category_id, amount: t.amount }]) {
      const name = data.categories.find((c) => c.id === item.category_id)?.name ?? 'Tanpa kategori';
      categories.set(name, (categories.get(name) ?? 0) + item.amount);
    }
  }
  return [...categories.entries()].sort((a, b) => b[1] - a[1]);
}
export function periodReport(data: Snapshot, from: string, to: string, wallets: Set<string>) {
  previousPeriod(from, to);
  const rows = data.transactions.filter(
    (t) =>
      !t.deleted_at &&
      t.status === 'completed' &&
      wallets.has(t.wallet_id) &&
      dateInJakarta(t.occurred_at) >= from &&
      dateInJakarta(t.occurred_at) <= to,
  );
  const sum = (type: Transaction['type']) =>
    rows.filter((t) => t.type === type).reduce((n, t) => n + t.amount, 0);
  const income = sum('income'),
    expense = sum('expense');
  return {
    income,
    expense,
    net: income - expense,
    categories: categoryTotals(data, rows),
  };
}
