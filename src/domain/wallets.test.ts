import { expect, it } from 'vitest';
import { parseOpeningBalance, validateWallet } from './wallets';
import { loadDemo } from '../lib/demo';

it('opening balances accept signed whole IDR but reject decimals, unsafe and excessive values', () => {
  expect(parseOpeningBalance('-15000')).toBe(-15000);
  expect(parseOpeningBalance('0')).toBe(0);
  expect(parseOpeningBalance('9000000000000')).toBe(9000000000000);
  for (const value of ['1.5', '1e3', '9000000000001', '--1', ''])
    expect(() => parseOpeningBalance(value)).toThrow();
});
it('wallet validation checks household ownership and only exposes a bounded optional identifier', () => {
  const data = loadDemo();
  const wallet = { ...data.wallets[0], initial_balance: -5000 };
  expect(() => validateWallet(wallet, data.members)).not.toThrow();
  expect(() => validateWallet({ ...wallet, wallet_owner: 'foreign' }, data.members)).toThrow();
  expect(() => validateWallet({ ...wallet, ownership: 'shared' }, data.members)).toThrow();
  expect(() =>
    validateWallet({ ...wallet, color: 'url(https://example.com)' }, data.members),
  ).toThrow();
  expect(() =>
    validateWallet({ ...wallet, account_identifier: 'x'.repeat(61) }, data.members),
  ).toThrow();
});
