import { supabase } from './supabase';
import * as demo from './demo';
import { validateBudget, validateGoal, validDate } from '../domain/planning';
import { parseMoney } from '../domain/finance';
import type { Budget, Goal, GoalContribution } from '../domain/types';

const conflict =
  'Data berubah atau aksesmu tidak tersedia. Tutup form dan muat ulang halaman sebelum mengedit kembali.';
export function samePlanningPayload(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
) {
  return Object.entries(expected).every(([key, value]) => {
    const current = actual[key];
    if (key === 'contributed_at')
      return new Date(String(current)).getTime() === new Date(String(value)).getTime();
    if (typeof value === 'number') return Number(current) === value;
    if (Array.isArray(value)) return JSON.stringify(current) === JSON.stringify(value);
    return current === value;
  });
}
export async function writePlanning(
  table: 'budgets' | 'savings_goals' | 'goal_contributions' | 'categories' | 'tags',
  payload: Record<string, unknown>,
  original?: Record<string, unknown>,
) {
  if (!original) {
    const result = await supabase!.from(table).insert(payload).select('id').single();
    if (result.error?.code === '23505') {
      const existing = await supabase!
        .from(table)
        .select('*')
        .eq('id', payload.id)
        .eq('household_id', payload.household_id)
        .maybeSingle();
      if (!existing.error && existing.data && samePlanningPayload(existing.data, payload)) return;
      throw new Error(
        'Permintaan ini sudah digunakan untuk data berbeda. Muat ulang halaman sebelum mencoba lagi.',
      );
    }
    if (result.error) throw new Error(result.error.message);
    return;
  }
  let query = supabase!
    .from(table)
    .update(payload)
    .eq('id', payload.id)
    .eq('household_id', payload.household_id);
  for (const [key, value] of Object.entries(original)) {
    query =
      value === null
        ? query.is(key, null)
        : query.eq(key, Array.isArray(value) ? `{${value.join(',')}}` : value);
  }
  const result = await query.select('id');
  if (result.error) throw new Error(result.error.message);
  if (result.data?.length) return;
  // A lost response may already have applied this exact update; retry safely.
  const existing = await supabase!
    .from(table)
    .select('*')
    .eq('id', payload.id)
    .eq('household_id', payload.household_id)
    .maybeSingle();
  if (!existing.error && existing.data && samePlanningPayload(existing.data, payload)) return;
  throw new Error(conflict);
}
export async function saveBudget(household: string, budget: Budget, original?: Budget) {
  validateBudget(budget);
  if (!supabase) return demo.budgetDemo(budget, original);
  const fields = ({
    closed_at: _closed,
    closed_spent: _spent,
    predecessor_id: _previous,
    rollover_amount: _roll,
    automation_error: _error,
    ...rest
  }: Budget) => rest;
  await writePlanning(
    'budgets',
    { ...fields(budget), household_id: household },
    original ? { ...fields(original) } : undefined,
  );
}
export async function closeBudget(id: string) {
  if (!supabase) return demo.closeBudgetDemo(id);
  const result = await supabase.rpc('close_budget_period', { p_id: id });
  if (result.error) throw new Error(result.error.message);
}
export async function saveGoal(household: string, goal: Goal, original?: Goal) {
  validateGoal(goal);
  const { saved: _saved, ...body } = goal;
  const old = original
    ? {
        title: original.title,
        target_amount: original.target_amount,
        deadline: original.deadline,
        notes: original.notes,
        status: original.status,
      }
    : undefined;
  if (!supabase) return demo.goalDemo(goal, original);
  await writePlanning('savings_goals', { ...body, household_id: household }, old);
}
export async function addGoalContribution(household: string, contribution: GoalContribution) {
  parseMoney(contribution.amount);
  if (!Number.isFinite(new Date(contribution.contributed_at).getTime()))
    throw new Error('Tanggal progres tidak valid.');
  if (!validDate(new Date(contribution.contributed_at).toISOString().slice(0, 10)))
    throw new Error('Tanggal progres tidak valid.');
  if (!supabase) return demo.contributionDemo(contribution);
  await writePlanning('goal_contributions', { ...contribution, household_id: household });
}
export async function removeGoalContribution(household: string, id: string) {
  if (!supabase) return demo.removeContributionDemo(id);
  const result = await supabase
    .from('goal_contributions')
    .delete()
    .eq('id', id)
    .eq('household_id', household)
    .select('id');
  if (result.error) throw new Error(result.error.message);
  if (!result.data?.length)
    throw new Error('Catatan progres tidak ditemukan atau kamu tidak berwenang menghapusnya.');
}
