import { expect, it } from 'vitest';
import { previewImport } from './import';
import { loadDemo } from '../lib/demo';
const envelope = () => ({ schema_version: 1, kind: 'household_snapshot', data: loadDemo() });
it('validates exported references and rejects incompatible versions, duplicates and broken splits', () => {
  expect(previewImport(envelope()).wallets.length).toBeGreaterThan(0);
  expect(() => previewImport({ ...envelope(), schema_version: 2 })).toThrow('versi 1');
  const broken = envelope();
  broken.data.wallets.push(broken.data.wallets[0]);
  expect(() => previewImport(broken)).toThrow('duplikat');
  const split = envelope();
  const t = split.data.transactions.find((t) => t.type === 'expense')!;
  split.data.splits.push({
    transaction_id: t.id,
    category_id: split.data.categories[0].id,
    amount: 1,
  });
  expect(() => previewImport(split)).toThrow('split');
  const cross = envelope();
  cross.data.wallets[0].household_id = 'foreign';
  expect(() => previewImport(cross)).toThrow('dompet');
});
