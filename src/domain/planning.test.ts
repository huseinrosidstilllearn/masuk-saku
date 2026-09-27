import { describe, expect, it } from 'vitest';
import { goalPlan, parseThresholds, validateBudget, validateGoal, validDate } from './planning';
import type { Budget, Goal } from './types';
const budget: Budget = {
  id: 'budget',
  name: 'Makanan',
  category_id: null,
  wallet_id: null,
  amount: 100000,
  start_date: '2026-09-01',
  end_date: '2026-09-30',
  rollover: 'reset',
  rollover_amount: 0,
  warning_thresholds: [75, 90, 100],
};
const goal: Goal = {
  id: 'goal',
  title: 'Pendidikan',
  target_amount: 1000001,
  deadline: '2026-11-30',
  notes: '',
  status: 'active',
  saved: 0,
};
describe('planning inputs and virtual recommendations', () => {
  it('normalizes configurable thresholds and rejects unsupported values', () => {
    expect(parseThresholds('100, 75, 90, 75')).toEqual([75, 90, 100]);
    for (const input of ['', '0', '101', '75.5', '75,', '1,2,3,4,5,6,7,8,9,10,11'])
      expect(() => parseThresholds(input)).toThrow();
  });
  it('rejects reversed/impossible dates and noninteger money', () => {
    expect(validDate('2024-02-29')).toBe(true);
    expect(validDate('2023-02-29')).toBe(false);
    expect(() => validateBudget({ ...budget, end_date: '2026-08-31' })).toThrow();
    expect(() => validateBudget({ ...budget, amount: 1.5 })).toThrow();
    expect(() => validateBudget({ ...budget, name: '  ' })).toThrow();
    expect(() => validateGoal({ ...goal, deadline: '2026-09-31' })).toThrow();
    expect(() => validateGoal({ ...goal, target_amount: 0 })).toThrow();
  });
  it('rounds required monthly contribution upwards in whole rupiah without moving any money', () => {
    expect(goalPlan(goal, '2026-09-27')).toEqual({
      remaining: 1000001,
      monthly: 333334,
      overdue: false,
    });
    expect(goalPlan({ ...goal, saved: 1000002 }, '2026-09-27')).toEqual({
      remaining: 0,
      monthly: null,
      overdue: false,
    });
    expect(goalPlan({ ...goal, deadline: '2026-09-01' }, '2026-09-27')).toEqual({
      remaining: 1000001,
      monthly: null,
      overdue: true,
    });
    expect(goalPlan({ ...goal, deadline: null }, '2026-09-27').monthly).toBeNull();
    expect(goal.saved).toBe(0);
  });
});
