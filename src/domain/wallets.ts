import { MAX_MONEY } from './finance';
import type { Member, Wallet } from './types';

export const walletIcons = ['wallet', 'bank', 'income', 'expense', 'goal'] as const;
export function parseOpeningBalance(value: string): number {
  if (!/^-?\d+$/.test(value))
    throw new Error('Saldo awal harus berupa rupiah bulat, boleh negatif.');
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || Math.abs(amount) > MAX_MONEY)
    throw new Error('Saldo awal maksimal Rp9 triliun, termasuk nilai negatif.');
  return amount;
}
export function validateWallet(wallet: Wallet, members?: Member[]) {
  if (!wallet.name.trim() || wallet.name.trim().length > 100)
    throw new Error('Nama dompet harus 1–100 karakter.');
  parseOpeningBalance(String(wallet.initial_balance));
  if (!['bank', 'cash', 'e_wallet'].includes(wallet.type))
    throw new Error('Jenis dompet tidak valid.');
  if (wallet.ownership === 'shared' ? wallet.wallet_owner !== null : !wallet.wallet_owner)
    throw new Error('Pemilik dompet tidak sesuai dengan lingkup.');
  if (
    wallet.wallet_owner &&
    members &&
    !members.some(
      (m) =>
        m.user_id === wallet.wallet_owner &&
        m.household_id === wallet.household_id &&
        m.active !== false,
    )
  )
    throw new Error('Pilih anggota aktif sebagai pemilik dompet.');
  if (wallet.color && !/^#[0-9a-f]{6}$/i.test(wallet.color))
    throw new Error('Warna dompet tidak valid.');
  if (wallet.icon && !walletIcons.includes(wallet.icon as (typeof walletIcons)[number]))
    throw new Error('Ikon dompet tidak valid.');
  if ((wallet.account_identifier?.length ?? 0) > 60)
    throw new Error('Identitas rekening maksimal 60 karakter.');
}
