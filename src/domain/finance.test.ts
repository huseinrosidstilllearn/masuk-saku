import { describe, expect, it } from 'vitest';
import {
  balances,
  dashboard,
  canTrash,
  parseMoney,
  validateTransaction,
  confidenceWarning,
} from './finance';
import { parseQuickAdd } from './quick-add';
import type { Transaction, Wallet } from './types';
const wallets: Wallet[] = [
  {
    id: 'a',
    household_id: 'h',
    name: 'BCA',
    type: 'bank',
    ownership: 'personal',
    wallet_owner: 'husband',
    initial_balance: 1000000,
    active: true,
  },
  {
    id: 'b',
    household_id: 'h',
    name: 'DANA',
    type: 'e_wallet',
    ownership: 'personal',
    wallet_owner: 'wife',
    initial_balance: 200000,
    active: true,
  },
  {
    id: 'c',
    household_id: 'h',
    name: 'Cash Rumah',
    type: 'cash',
    ownership: 'shared',
    wallet_owner: null,
    initial_balance: 100000,
    active: true,
  },
];
const tx = (over: Partial<Transaction> = {}): Transaction => ({
  id: 't',
  household_id: 'h',
  type: 'expense',
  amount: 50000,
  wallet_id: 'a',
  destination_wallet_id: null,
  transaction_actor: 'wife',
  transaction_scope: 'family',
  scope_member_id: null,
  status: 'completed',
  occurred_at: '2026-09-10T12:00:00+07:00',
  category_id: null,
  merchant: 'Makan',
  notes: '',
  created_by: 'husband',
  deleted_at: null,
  ...over,
});
describe('ledger integrity', () => {
  it('actor cannot shift expense to a personal dashboard', () => {
    expect(dashboard(wallets, [tx()], 'husband', '2026-09').expense).toBe(50000);
    expect(dashboard(wallets, [tx()], 'wife', '2026-09').expense).toBe(0);
  });
  it('transfer conserves principal; linked fee is one expense', () => {
    const rows = [
      tx({ type: 'transfer', amount: 100000, destination_wallet_id: 'b' }),
      tx({ id: 'fee', amount: 2500, parent_transaction_id: 't' }),
    ];
    expect(balances(wallets, rows)).toEqual({ a: 897500, b: 300000, c: 100000 });
    expect(dashboard(wallets, rows, 'family', '2026-09').expense).toBe(2500);
  });
  it('does not count pending, cancelled or trash', () => {
    expect(
      balances(wallets, [
        tx({ status: 'pending' }),
        tx({ status: 'cancelled' }),
        tx({ deleted_at: '2026-09-11T00:00:00Z' }),
      ]).a,
    ).toBe(1000000);
  });
  it('shared balances appear only in family view', () => {
    expect(dashboard(wallets, [], 'family', '2026-09').balance).toBe(1300000);
    expect(dashboard(wallets, [], 'wife', '2026-09').balance).toBe(200000);
  });
  it('uses Jakarta month even when UTC month differs', () => {
    expect(
      dashboard(wallets, [tx({ occurred_at: '2026-08-31T18:00:00Z' })], 'family', '2026-09')
        .expense,
    ).toBe(50000);
  });
  it('delete depends on creator not actor', () => {
    expect(canTrash(tx(), 'wife', 'member')).toBe(false);
    expect(canTrash(tx(), 'husband', 'member')).toBe(true);
    expect(canTrash(tx(), 'wife', 'owner')).toBe(true);
  });
  it.each(['0', '1.5', '-1', '9000000000001', 'NaN', '1e9'])('rejects unsafe amount %s', (v) =>
    expect(() => parseMoney(v)).toThrow(),
  );
  it('accepts integer rupiah', () => expect(parseMoney('27000')).toBe(27000));
  it('rejects transfer same wallet and wrong split sum', () => {
    expect(() =>
      validateTransaction(tx({ type: 'transfer', destination_wallet_id: 'a' }), wallets, []),
    ).toThrow();
    expect(() =>
      validateTransaction(tx(), wallets, [{ category_id: 'food', amount: 1 }]),
    ).toThrow();
  });
  it('keeps high confidence quiet and flags missing/low values', () => {
    expect(confidenceWarning(0.95)).toBe(null);
    expect(confidenceWarning(0.8)).toBe('Periksa kembali');
    expect(confidenceWarning(null)).toBe('Wajib dipilih kembali');
  });
});
describe('offline quick add', () => {
  it('parses rupiah units and keeps actor separate', () => {
    expect(parseQuickAdd('-27k makan @dana', wallets)).toMatchObject({
      type: 'expense',
      amount: 27000,
      wallet_id: 'b',
    });
    expect(parseQuickAdd('+2jt freelance @bca', wallets)).toMatchObject({
      type: 'income',
      amount: 2000000,
      wallet_id: 'a',
    });
  });
  it('supports decimal multiplier but rejects ambiguous wallet', () => {
    expect(parseQuickAdd('-2,5k kopi @dana', wallets).amount).toBe(2500);
    expect(() =>
      parseQuickAdd('-20k belanja @cash', [
        ...wallets,
        { ...wallets[0], id: 'd', name: 'Cash Pribadi' },
      ]),
    ).toThrow();
  });
  it('requires explicit sign and positive amount', () => {
    expect(() => parseQuickAdd('makan 27k', wallets)).toThrow();
    expect(() => parseQuickAdd('-0 makan @dana', wallets)).toThrow();
  });
});
