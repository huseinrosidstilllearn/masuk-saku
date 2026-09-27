import { dateInJakarta } from './finance';
import type { Transaction } from './types';

export function weeklyCashflow(rows: Transaction[], month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const weeks = Array.from({ length: Math.ceil(days / 7) }, (_, index) => ({
    label:
      index * 7 + 1 === days ? String(days) : `${index * 7 + 1}–${Math.min(index * 7 + 7, days)}`,
    income: 0,
    expense: 0,
  }));
  for (const row of rows) {
    if (row.deleted_at || row.status !== 'completed' || row.type === 'transfer') continue;
    const date = dateInJakarta(row.occurred_at);
    if (!date.startsWith(month + '-')) continue;
    const week = weeks[Math.floor((Number(date.slice(-2)) - 1) / 7)];
    week[row.type] += row.amount;
  }
  return weeks;
}
