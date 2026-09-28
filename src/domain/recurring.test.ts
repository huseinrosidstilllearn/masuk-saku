import { expect, it } from 'vitest';
import { nextOccurrence } from './recurring';

it('monthly schedules keep the original day after short months and weekly dates cross WIB calendar years', () => {
  expect(nextOccurrence('2027-01-31', 'monthly', 1)).toBe('2027-02-28');
  expect(nextOccurrence('2027-01-31', 'monthly', 2)).toBe('2027-03-31');
  expect(nextOccurrence('2028-01-31', 'monthly', 1)).toBe('2028-02-29');
  expect(nextOccurrence('2026-12-28', 'weekly', 1)).toBe('2027-01-04');
  expect(() => nextOccurrence('2027-02-30', 'monthly', 1)).toThrow();
  expect(() => nextOccurrence('2027-01-31', 'monthly', -1)).toThrow();
});
