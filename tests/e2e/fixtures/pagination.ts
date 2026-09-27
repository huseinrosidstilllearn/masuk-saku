import { createDemo, loadDemo } from '../../../src/lib/demo';
const base = loadDemo().transactions[0];
for (let i = 0; i < 260; i++)
  createDemo(
    {
      ...base,
      amount: i + 1,
      type: 'expense',
      fee_amount: 0,
      merchant: 'Fixture ' + String(i).padStart(3, '0'),
    },
    'fixture-' + String(i).padStart(3, '0'),
  );
await import('../../../src/main');
