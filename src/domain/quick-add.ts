import { parseMoney } from './finance';
import type { Wallet } from './types';
export function parseQuickAdd(input: string, wallets: Wallet[]) {
  const match = /^([+-])(\d+(?:[.,]\d+)?)(k|rb|ribu|jt|juta)?\s+(.+?)\s+@(.+)$/i.exec(input.trim());
  if (!match) throw new Error('Gunakan contoh: -27k makan @dana atau +2jt freelance @bca');
  const amount = parseMoney(
    Number(match[2].replace(',', '.')) *
      ({ k: 1000, rb: 1000, ribu: 1000, jt: 1000000, juta: 1000000 }[
        match[3]?.toLowerCase() as 'k'
      ] ?? 1),
  );
  const found = wallets.filter(
    (w) => w.active && w.name.toLowerCase().includes(match[5].toLowerCase()),
  );
  if (found.length !== 1)
    throw new Error('Dompet belum ditemukan atau nama ambigu. Tulis nama lebih lengkap.');
  return {
    type: match[1] === '-' ? ('expense' as const) : ('income' as const),
    amount,
    wallet_id: found[0].id,
    merchant: match[4],
  };
}
