import { describe, expect, it } from 'vitest';
import {
  calendarDays,
  dateLabel,
  displayDate,
  moveDay,
  moveMonth,
  parseDisplayDate,
  toWibInstant,
  validDate,
  wibDateTime,
} from '../src/domain/date-time';

describe('Indonesian transaction date and 24-hour WIB', () => {
  it('rejects impossible dates and accepts Gregorian leap days', () => {
    expect(parseDisplayDate('29/02/2024')).toBe('2024-02-29');
    for (const text of [
      '29/02/2023',
      '31/02/2026',
      '31/04/2026',
      '01/13/2026',
      '1/01/2026',
      '01/01/0000',
    ])
      expect(parseDisplayDate(text)).toBeNull();
    expect(displayDate('2026-09-27')).toBe('27/09/2026');
    expect(dateLabel('2026-09-27')).toBe('Minggu, 27 September 2026');
  });
  it('converts midnight, noon and late evening explicitly to UTC', () => {
    for (const [local, utc] of [
      ['2026-09-27T00:15', '2026-09-26T17:15:00.000Z'],
      ['2026-09-27T12:00', '2026-09-27T05:00:00.000Z'],
      ['2026-09-27T23:59', '2026-09-27T16:59:00.000Z'],
    ]) {
      expect(toWibInstant(local)).toBe(utc);
      expect(wibDateTime(utc)).toBe(local);
    }
    for (const value of [
      '2026-09-27T24:00',
      '2026-09-27T12:60',
      '2026-02-30T12:00',
      '2026-09-27T12:00T01:00',
    ])
      expect(() => toWibInstant(value)).toThrow();
  });
  it('keeps month/year navigation valid and clamps the last day', () => {
    expect(moveMonth('2024-01-31', 1)).toBe('2024-02-29');
    expect(moveMonth('2023-01-31', 1)).toBe('2023-02-28');
    expect(moveDay('2026-12-31', 1)).toBe('2027-01-01');
    expect(moveDay('0001-01-01', -1)).toBe('0001-01-01');
    expect(moveMonth('9999-12-31', 1)).toBe('9999-12-31');
    expect(validDate('0001-01-01')).toBe(true);
  });
  it('builds a consecutive Monday-first six-week calendar', () => {
    const days = calendarDays('2026-09');
    expect(days).toHaveLength(42);
    expect(days[0].iso).toBe('2026-08-31');
    expect(days[41].iso).toBe('2026-10-11');
    days.slice(1).forEach((day, index) => expect(day.iso).toBe(moveDay(days[index].iso, 1)));
  });
});
