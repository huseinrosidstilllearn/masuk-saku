import { validDate } from './planning';

export function nextOccurrence(
  anchor: string,
  cadence: 'weekly' | 'monthly',
  index: number,
): string {
  if (!validDate(anchor) || !Number.isInteger(index) || index < 0 || index > 12000)
    throw new Error('Jadwal berulang tidak valid.');
  const [year, month, day] = anchor.split('-').map(Number);
  if (cadence === 'weekly')
    return new Date(Date.UTC(year, month - 1, day + index * 7)).toISOString().slice(0, 10);
  const first = new Date(Date.UTC(year, month - 1 + index, 1));
  const lastDay = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  first.setUTCDate(Math.min(day, lastDay));
  return first.toISOString().slice(0, 10);
}
