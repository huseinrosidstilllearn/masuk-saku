import type { Budget, Category, Role, Split, Transaction, Wallet } from './types';
export const MAX_MONEY = 9_000_000_000_000;
export function parseMoney(value: string | number): number {
  if (typeof value === 'string' && !/^\d+$/.test(value))
    throw new Error('Nominal harus berupa rupiah bulat.');
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0 || n > MAX_MONEY)
    throw new Error('Nominal harus antara Rp1 dan Rp9 triliun.');
  return n;
}
export function money(n: number, hide = false): string {
  return hide
    ? 'Rp ••••••'
    : new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(n);
}
export function monthInJakarta(date: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date(date));
  return (
    parts.find((p) => p.type === 'year')!.value + '-' + parts.find((p) => p.type === 'month')!.value
  );
}
export function dateInJakarta(date: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(date));
  return ['year', 'month', 'day'].map((k) => parts.find((p) => p.type === k)!.value).join('-');
}
export function balances(wallets: Wallet[], rows: Transaction[]): Record<string, number> {
  const result = Object.fromEntries(wallets.map((w) => [w.id, w.initial_balance]));
  for (const t of rows) {
    if (t.deleted_at || t.status !== 'completed') continue;
    if (t.wallet_id in result) result[t.wallet_id] += t.type === 'income' ? t.amount : -t.amount;
    if (t.type === 'transfer' && t.destination_wallet_id && t.destination_wallet_id in result)
      result[t.destination_wallet_id] += t.amount;
  }
  return result;
}
export function dashboard(wallets: Wallet[], rows: Transaction[], owner: string, month: string) {
  const selected = wallets.filter(
    (w) => w.active && (owner === 'family' || w.wallet_owner === owner),
  );
  const ids = new Set(selected.map((w) => w.id));
  const all = balances(wallets, rows);
  const relevant = rows.filter(
    (t) =>
      ids.has(t.wallet_id) &&
      !t.deleted_at &&
      t.status === 'completed' &&
      monthInJakarta(t.occurred_at) === month,
  );
  return {
    balance: selected.reduce((n, w) => n + all[w.id], 0),
    income: relevant.filter((t) => t.type === 'income').reduce((n, t) => n + t.amount, 0),
    expense: relevant.filter((t) => t.type === 'expense').reduce((n, t) => n + t.amount, 0),
    wallets: selected,
    rows: relevant,
  };
}
export function canTrash(t: Transaction, user: string, role: Role) {
  return role === 'owner' || t.created_by === user;
}
export function confidenceWarning(score: number | null | undefined) {
  return score != null && score >= 0.9
    ? null
    : score != null && score >= 0.7
      ? 'Periksa kembali'
      : 'Wajib dipilih kembali';
}
export function validateTransaction(
  t: Pick<Transaction, 'type' | 'amount' | 'wallet_id' | 'destination_wallet_id'>,
  wallets: Wallet[],
  splits: Split[],
) {
  parseMoney(t.amount);
  if (!wallets.some((w) => w.id === t.wallet_id && w.active))
    throw new Error('Pilih dompet aktif.');
  if (
    t.type === 'transfer' &&
    (!wallets.some((w) => w.id === t.destination_wallet_id && w.active) ||
      t.wallet_id === t.destination_wallet_id)
  )
    throw new Error('Dompet tujuan harus berbeda dan aktif.');
  if (t.type !== 'transfer' && t.destination_wallet_id)
    throw new Error('Tujuan hanya untuk transfer.');
  if (
    splits.length &&
    (t.type === 'transfer' ||
      splits.some((s) => !Number.isSafeInteger(s.amount) || s.amount <= 0) ||
      splits.reduce((n, s) => n + s.amount, 0) !== t.amount)
  )
    throw new Error('Jumlah split harus sama dengan nominal.');
}
export function budgetSpent(
  b: Budget,
  rows: Transaction[],
  splits: (Split & { transaction_id: string })[],
  ownerWallets?: Set<string>,
  categories: Category[] = [],
) {
  const matching = new Set(b.category_id ? [b.category_id] : []);
  for (let index = 0; index < categories.length; index++) {
    let added = false;
    for (const category of categories)
      if (category.parent_id && matching.has(category.parent_id) && !matching.has(category.id)) {
        matching.add(category.id);
        added = true;
      }
    if (!added) break;
  }
  return rows
    .filter(
      (t) =>
        !t.deleted_at &&
        t.status === 'completed' &&
        t.type === 'expense' &&
        (!b.wallet_id || t.wallet_id === b.wallet_id) &&
        (!ownerWallets || ownerWallets.has(t.wallet_id)) &&
        dateInJakarta(t.occurred_at) >= b.start_date &&
        dateInJakarta(t.occurred_at) <= b.end_date,
    )
    .reduce((n, t) => {
      const items = splits.filter((s) => s.transaction_id === t.id);
      return (
        n +
        (!b.category_id
          ? t.amount
          : items.length
            ? items.filter((s) => matching.has(s.category_id)).reduce((x, s) => x + s.amount, 0)
            : t.category_id && matching.has(t.category_id)
              ? t.amount
              : 0)
      );
    }, 0);
}
