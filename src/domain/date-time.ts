const pad = (value: number) => String(value).padStart(2, '0');
const utcDay = (value: string) => new Date(value + 'T12:00:00Z');

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1) return false;
  const date = utcDay(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function displayDate(value: string) {
  if (!validDate(value)) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function parseDisplayDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  return validDate(iso) ? iso : null;
}

export function wibDateTime(instant: string = new Date().toISOString()) {
  const date = new Date(instant);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part('year').padStart(4, '0')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

export function toWibInstant(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error('Tanggal dan waktu tidak valid.');
  const [date, time] = value.split('T');
  if (!validDate(date ?? '') || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time ?? ''))
    throw new Error('Periksa tanggal dan jam. Gunakan tanggal valid dan jam 00:00–23:59 WIB.');
  return new Date(`${date}T${time}:00+07:00`).toISOString();
}

export function dateLabel(value: string) {
  return utcDay(value).toLocaleDateString('id-ID', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function moveDay(value: string, amount: number) {
  const date = utcDay(value);
  date.setUTCDate(date.getUTCDate() + amount);
  const next = date.toISOString().split('T')[0];
  return validDate(next) ? next : value;
}

export function moveMonth(value: string, amount: number) {
  const date = utcDay(value),
    day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + amount);
  if (date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999) return value;
  const nextMonth = `${String(date.getUTCFullYear()).padStart(4, '0')}-${pad(date.getUTCMonth() + 1)}`;
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return `${nextMonth}-${pad(Math.min(day, date.getUTCDate()))}`;
}

export function calendarDays(month: string) {
  const first = utcDay(month + '-01');
  const offset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(1 + index - offset);
    return { iso: date.toISOString().split('T')[0], day: date.getUTCDate() };
  });
}
