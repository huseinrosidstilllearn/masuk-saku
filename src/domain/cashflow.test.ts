import { describe, expect, it } from 'vitest';
import { weeklyCashflow } from './cashflow';
import type { Transaction } from './types';
const row = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'transaction',
  household_id: 'household',
  type: 'expense',
  amount: 100,
  wallet_id: 'wallet',
  destination_wallet_id: null,
  transaction_actor: 'member',
  transaction_scope: 'family',
  scope_member_id: null,
  status: 'completed',
  occurred_at: '2024-02-01T00:00:00+07:00',
  category_id: null,
  merchant: '',
  notes: '',
  created_by: 'member',
  deleted_at: null,
  ...overrides,
});
describe('weekly cashflow presentation', () => {
  it('uses Jakarta dates, including leap day and month boundaries', () => {
    const weeks = weeklyCashflow(
      [
        row({ type: 'income', amount: 250, occurred_at: '2024-01-31T17:00:00Z' }),
        row({ occurred_at: '2024-02-28T17:00:00Z' }),
        row({ amount: 999, occurred_at: '2024-02-29T17:00:00Z' }),
      ],
      '2024-02',
    );
    expect(weeks).toHaveLength(5);
    expect(weeks[0].income).toBe(250);
    expect(weeks[4]).toEqual({ label: '29', income: 0, expense: 100 });
    expect(weeks.reduce((sum, week) => sum + week.expense, 0)).toBe(100);
  });
  it('excludes transfer, pending, cancelled and trash, but includes completed fee entries', () => {
    const weeks = weeklyCashflow(
      [
        row(),
        row({ type: 'transfer', amount: 900 }),
        row({ status: 'pending' }),
        row({ status: 'cancelled' }),
        row({ deleted_at: '2024-02-02T00:00:00Z' }),
        row({ parent_transaction_id: 'transfer', amount: 20 }),
      ],
      '2024-02',
    );
    expect(weeks[0]).toEqual({ label: '1–7', income: 0, expense: 120 });
  });
  it('renders empty month buckets with actual month lengths', () => {
    expect(weeklyCashflow([], '2023-02')).toHaveLength(4);
    expect(weeklyCashflow([], '2024-04').at(-1)).toEqual({ label: '29–30', income: 0, expense: 0 });
  });
});
