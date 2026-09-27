import { expect, it, vi } from 'vitest';
vi.mock('./supabase', () => ({ supabase: null }));
import * as demo from './demo';
import { balances } from '../domain/finance';
import {
  addGoalContribution,
  saveGoal,
  saveBudget,
  samePlanningPayload,
} from './planning-repository';
it('compares numeric database strings and canonical timestamps for safe insert retries', () => {
  expect(
    samePlanningPayload(
      { amount: '100', contributed_at: '2026-09-27T05:00:00+00:00' },
      { amount: 100, contributed_at: '2026-09-27T12:00:00+07:00' },
    ),
  ).toBe(true);
  expect(samePlanningPayload({ amount: '101' }, { amount: 100 })).toBe(false);
});
it('retries one virtual contribution exactly once and goal editing preserves accrued progress', async () => {
  const initial = demo.loadDemo(),
    id = crypto.randomUUID();
  const goal = { ...initial.goals[0], id, title: 'Retry test', saved: 0 };
  await saveGoal('demo', goal);
  const contribution = {
    id: crypto.randomUUID(),
    goal_id: id,
    amount: 25000,
    created_by: demo.demoUser,
    contributed_at: '2026-09-27T05:00:00Z',
  };
  await addGoalContribution('demo', contribution);
  await addGoalContribution('demo', contribution);
  await expect(addGoalContribution('demo', { ...contribution, amount: 25001 })).rejects.toThrow();
  await saveGoal('demo', { ...goal, title: 'Changed' }, goal);
  const result = demo.loadDemo();
  expect(result.goals.find((item) => item.id === id)?.saved).toBe(25000);
  expect(result.contributions.filter((item) => item.id === contribution.id)).toHaveLength(1);
  expect(balances(result.wallets, result.transactions)).toEqual(
    balances(initial.wallets, initial.transactions),
  );
});
it('rejects stale budget edits instead of overwriting another edit', async () => {
  const budget = demo.loadDemo().budgets[0];
  await saveBudget('demo', { ...budget, amount: budget.amount + 1 }, budget);
  await expect(
    saveBudget('demo', { ...budget, amount: budget.amount + 2 }, budget),
  ).rejects.toThrow(/berubah/);
});
