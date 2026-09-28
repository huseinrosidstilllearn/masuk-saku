import { expect, it } from 'vitest';
import { parseLayout } from './DashboardWidgets';
it('keeps critical navigation available and fills unknown/missing preferences safely', () => {
  const result = parseLayout([
    { id: 'menu', visible: false },
    { id: 'menu', visible: true },
    { id: 'recent', visible: false },
    { id: 'unknown', visible: true },
  ]);
  expect(result.find((r) => r.id === 'menu')?.visible).toBe(true);
  expect(result.find((r) => r.id === 'recent')?.visible).toBe(false);
  expect(result).toHaveLength(8);
  expect(parseLayout({ not: 'array' })).toHaveLength(8);
});
