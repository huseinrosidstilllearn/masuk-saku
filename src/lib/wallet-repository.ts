import type { Wallet } from '../domain/types';
import { validateWallet } from '../domain/wallets';
import { supabase } from './supabase';
import { walletSaveDemo } from './demo';

export function walletPayload(wallet: Wallet) {
  return {
    id: wallet.id,
    household_id: wallet.household_id,
    name: wallet.name.trim(),
    type: wallet.type,
    ownership: wallet.ownership,
    wallet_owner: wallet.wallet_owner,
    initial_balance: wallet.initial_balance,
    active: wallet.active,
    icon: wallet.icon ?? 'wallet',
    color: wallet.color ?? '#164c3e',
    account_identifier: wallet.account_identifier?.trim() || null,
  };
}
export async function saveWallet(wallet: Wallet, original?: Wallet) {
  validateWallet(wallet);
  if (!supabase) return walletSaveDemo(wallet, original);
  const result = await supabase.rpc('save_wallet', {
    p_input: walletPayload(wallet),
    p_expected_version: original ? (original.version ?? 1) : null,
  });
  if (result.error)
    throw new Error(
      result.error.message.includes('wallet conflict')
        ? 'Dompet berubah. Muat ulang sebelum mengedit kembali.'
        : result.error.message,
    );
}
