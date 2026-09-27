import { expect, it } from 'vitest';
import { createDemo, loadDemo, reviseDemo, revisionHistoryDemo } from './demo';
import { transactionInput } from './transaction-revisions';
import { balances } from '../domain/finance';
it('demo revision is exact-once, preserves creator and refuses stale update', () => {
  const data = loadDemo(),
    initial = transactionInput(
      data,
      data.transactions.find((t) => t.type === 'expense')!,
    );
  const id = crypto.randomUUID();
  createDemo(initial, id);
  const before = loadDemo();
  const tx = before.transactions.find((t) => t.id === id)!;
  const edit = { ...initial, amount: initial.amount + 5000 };
  const key = crypto.randomUUID();
  reviseDemo(id, 1, edit, key);
  reviseDemo(id, 1, edit, key);
  const after = loadDemo();
  expect(after.transactions.find((t) => t.id === id)!.created_by).toBe(tx.created_by);
  expect(balances(after.wallets, after.transactions)[tx.wallet_id]).toBe(
    balances(before.wallets, before.transactions)[tx.wallet_id] - 5000,
  );
  expect(revisionHistoryDemo(id)).toHaveLength(1);
  expect(() => reviseDemo(id, 1, { ...edit, amount: 1 }, key)).toThrow(/payload mismatch/);
  expect(() => reviseDemo(id, 1, edit, crypto.randomUUID())).toThrow(/sudah berubah/);
});
