import { expect, it } from 'vitest';
import { loadDemo } from '../lib/demo';
import { filterTransactions, periodReport, previousPeriod } from './reports';
it('filters WIB inclusive dates and owner wallet separately from actor, with deterministic paging order', () => {
  const data = loadDemo(),
    base = data.transactions[0],
    wallet = data.wallets[0].id;
  data.transactions = [
    {
      ...base,
      id: 'a',
      wallet_id: wallet,
      type: 'expense',
      transaction_actor: 'other',
      transaction_scope: 'family',
      status: 'completed',
      amount: 100,
      occurred_at: '2026-09-26T17:00:00Z',
      deleted_at: null,
    },
    {
      ...base,
      id: 'b',
      wallet_id: wallet,
      type: 'income',
      transaction_actor: 'other',
      status: 'pending',
      amount: 200,
      occurred_at: '2026-09-27T17:00:00Z',
      deleted_at: null,
    },
    {
      ...base,
      id: 'c',
      wallet_id: data.wallets[1].id,
      type: 'expense',
      transaction_actor: 'self',
      amount: 300,
      occurred_at: '2026-09-27T04:00:00Z',
      deleted_at: null,
    },
    {
      ...base,
      id: 'fee',
      wallet_id: wallet,
      type: 'expense',
      parent_transaction_id: 'a',
      amount: 10,
      occurred_at: '2026-09-27T04:00:00Z',
      deleted_at: null,
    },
  ];
  expect(
    filterTransactions(
      data,
      {
        from: '2026-09-27',
        to: '2026-09-27',
        actor: 'other',
        type: 'expense',
        minimum: 100,
        maximum: 100,
      },
      new Set([wallet]),
    ).map((t) => t.id),
  ).toEqual(['a']);
  expect(
    filterTransactions(data, { status: 'pending' }, new Set([wallet])).map((t) => t.id),
  ).toEqual(['b']);
  expect(filterTransactions(data, {}, new Set([wallet])).map((t) => t.id)).toEqual(['b', 'a']);
});
it('period report counts linked fees once, excludes transfer principal/pending/trash and compares equal prior days', () => {
  const data = loadDemo(),
    base = data.transactions[0],
    wallet = data.wallets[0].id;
  data.transactions = [
    {
      ...base,
      id: 'income',
      wallet_id: wallet,
      type: 'income',
      amount: 1000,
      occurred_at: '2026-09-27T04:00:00Z',
      status: 'completed',
      deleted_at: null,
    },
    {
      ...base,
      id: 'expense',
      wallet_id: wallet,
      type: 'expense',
      amount: 100,
      occurred_at: '2026-09-27T04:00:00Z',
      status: 'completed',
      deleted_at: null,
    },
    {
      ...base,
      id: 'transfer',
      wallet_id: wallet,
      type: 'transfer',
      amount: 500,
      occurred_at: '2026-09-27T04:00:00Z',
      status: 'completed',
      deleted_at: null,
    },
    {
      ...base,
      id: 'fee',
      wallet_id: wallet,
      type: 'expense',
      amount: 10,
      parent_transaction_id: 'transfer',
      occurred_at: '2026-09-27T04:00:00Z',
      status: 'completed',
      deleted_at: null,
    },
    {
      ...base,
      id: 'pending',
      wallet_id: wallet,
      type: 'expense',
      amount: 600,
      occurred_at: '2026-09-27T04:00:00Z',
      status: 'pending',
      deleted_at: null,
    },
    {
      ...base,
      id: 'trash',
      wallet_id: wallet,
      type: 'expense',
      amount: 700,
      occurred_at: '2026-09-27T04:00:00Z',
      status: 'completed',
      deleted_at: '2026-09-27T05:00:00Z',
    },
  ];
  const report = periodReport(data, '2026-09-27', '2026-09-27', new Set([wallet]));
  expect(report).toMatchObject({ income: 1000, expense: 110, net: 890 });
  expect(previousPeriod('2026-03-01', '2026-03-31')).toEqual({
    from: '2026-01-29',
    to: '2026-02-28',
  });
  expect(() => previousPeriod('2026-02-30', '2026-03-31')).toThrow();
  expect(() => previousPeriod('0001-01-01', '9999-12-31')).toThrow();
});
