import { parseMoney } from './finance';
import type { Budget, Goal } from './types';

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function parseThresholds(value: string) {
  const parts = value.split(',').map((part) => part.trim());
  if (
    parts.length > 10 ||
    parts.some((part) => !/^\d+$/.test(part) || Number(part) < 1 || Number(part) > 100)
  )
    throw new Error('Ambang peringatan harus 1–100%, maksimal 10 angka dipisahkan koma.');
  return [...new Set(parts.map(Number))].sort((a, b) => a - b);
}
export function validateBudget(budget: Budget) {
  if (!budget.name.trim() || budget.name.trim().length > 100)
    throw new Error('Nama anggaran harus 1–100 karakter.');
  parseMoney(budget.amount);
  if (
    !validDate(budget.start_date) ||
    !validDate(budget.end_date) ||
    budget.end_date < budget.start_date
  )
    throw new Error('Tanggal akhir anggaran harus sama atau setelah tanggal mulai.');
  parseThresholds(budget.warning_thresholds.join(','));
  const days =
    Math.round(
      (new Date(budget.end_date).getTime() - new Date(budget.start_date).getTime()) / 86400000,
    ) + 1;
  if (budget.cadence === 'weekly' && days !== 7)
    throw new Error('Anggaran mingguan harus mencakup 7 hari.');
  if (
    budget.cadence === 'monthly' &&
    (budget.start_date.slice(8) !== '01' ||
      budget.end_date !==
        new Date(
          Date.UTC(Number(budget.start_date.slice(0, 4)), Number(budget.start_date.slice(5, 7)), 0),
        )
          .toISOString()
          .slice(0, 10))
  )
    throw new Error('Anggaran bulanan harus mencakup satu bulan kalender.');
}
export function validateGoal(goal: Omit<Goal, 'saved'>) {
  if (!goal.title.trim() || goal.title.trim().length > 100)
    throw new Error('Nama target harus 1–100 karakter.');
  parseMoney(goal.target_amount);
  if (goal.deadline && !validDate(goal.deadline)) throw new Error('Tanggal target tidak valid.');
  if (goal.notes.length > 2000) throw new Error('Catatan maksimal 2.000 karakter.');
}
export function goalPlan(goal: Pick<Goal, 'target_amount' | 'saved' | 'deadline'>, today: string) {
  const remaining = Math.max(0, goal.target_amount - goal.saved);
  const overdue = Boolean(remaining && goal.deadline && goal.deadline < today);
  if (!remaining || !goal.deadline || overdue) return { remaining, overdue, monthly: null };
  const [year, month] = today.split('-').map(Number);
  const [endYear, endMonth] = goal.deadline.split('-').map(Number);
  const months = Math.max(1, (endYear - year) * 12 + endMonth - month + 1);
  return { remaining, overdue, monthly: Math.ceil(remaining / months) };
}
