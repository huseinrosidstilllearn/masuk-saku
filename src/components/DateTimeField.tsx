import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  calendarDays,
  dateLabel,
  displayDate,
  moveDay,
  moveMonth,
  parseDisplayDate,
  validDate,
  wibDateTime,
} from '../domain/date-time';
import { Icon } from './Icon';

const months = Array.from({ length: 12 }, (_, month) =>
  new Date(Date.UTC(2000, month, 1)).toLocaleDateString('id-ID', {
    month: 'long',
    timeZone: 'UTC',
  }),
);
const weekdays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const values = (count: number) =>
  Array.from({ length: count }, (_, value) => String(value).padStart(2, '0'));

export function DateTimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId(),
    today = wibDateTime().slice(0, 10);
  const [date, time = '00:00'] = value.split('T');
  const [hour = '00', minute = '00'] = time.split(':');
  const selected = validDate(date) ? date : today;
  const [text, setText] = useState(displayDate(date)),
    [open, setOpen] = useState(false),
    [focused, setFocused] = useState(selected),
    [month, setMonth] = useState(selected.slice(0, 7)),
    [touched, setTouched] = useState(false);
  const input = useRef<HTMLInputElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    grid = useRef<HTMLTableElement>(null),
    focusRequested = useRef(false);
  useLayoutEffect(() => {
    setText(displayDate(date));
  }, [date]);
  useLayoutEffect(() => {
    input.current?.setCustomValidity(
      parseDisplayDate(text) ? '' : 'Masukkan tanggal valid dengan format DD/MM/YYYY.',
    );
  }, [text]);
  useLayoutEffect(() => {
    if (open && focusRequested.current) {
      grid.current?.querySelector<HTMLButtonElement>(`button[data-date="${focused}"]`)?.focus();
      focusRequested.current = false;
    }
  }, [open, focused, month]);

  function close(restore = true) {
    setOpen(false);
    if (restore) trigger.current?.focus();
  }
  function choose(next: string) {
    setText(displayDate(next));
    setTouched(false);
    onChange(`${next}T${hour}:${minute}`);
    close();
  }
  function navigate(next: string, focus = false) {
    setMonth(next.slice(0, 7));
    setFocused(next);
    focusRequested.current = focus;
  }
  function key(event: KeyboardEvent<HTMLButtonElement>, day: string) {
    const weekday = (new Date(day + 'T12:00:00Z').getUTCDay() + 6) % 7;
    const next = (
      {
        ArrowLeft: () => moveDay(day, -1),
        ArrowRight: () => moveDay(day, 1),
        ArrowUp: () => moveDay(day, -7),
        ArrowDown: () => moveDay(day, 7),
        Home: () => moveDay(day, -weekday),
        End: () => moveDay(day, 6 - weekday),
        PageUp: () => moveMonth(day, event.shiftKey ? -12 : -1),
        PageDown: () => moveMonth(day, event.shiftKey ? 12 : 1),
      } as Record<string, () => string>
    )[event.key];
    if (next) {
      event.preventDefault();
      navigate(next(), true);
    }
  }
  const days = calendarDays(month),
    invalid = touched && !parseDisplayDate(text);
  const monthLabel = new Date(month + '-01T12:00:00Z').toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return (
    <fieldset
      className="date-time-field t-acc"
      data-open={String(open)}
      onKeyDownCapture={(event) => {
        if (open && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          close();
        }
      }}
      onBlur={(event) => {
        if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) close(false);
      }}
    >
      <legend>Tanggal &amp; waktu (WIB)</legend>
      <label htmlFor={id + '-date'} className="sr-only">
        Tanggal transaksi
      </label>
      <div className="date-input-row">
        <input
          ref={input}
          id={id + '-date'}
          type="text"
          inputMode="numeric"
          required
          placeholder="DD/MM/YYYY"
          value={text}
          aria-describedby={id + '-hint'}
          aria-invalid={invalid || undefined}
          onBlur={() => setTouched(true)}
          onChange={(event) => {
            setText(event.target.value);
            const next = parseDisplayDate(event.target.value);
            event.target.setCustomValidity(
              next ? '' : 'Masukkan tanggal valid dengan format DD/MM/YYYY.',
            );
            if (next) onChange(`${next}T${hour}:${minute}`);
          }}
        />
        <button
          ref={trigger}
          type="button"
          aria-label="Pilih tanggal transaksi"
          aria-expanded={open}
          aria-controls={id + '-calendar'}
          onClick={() => {
            if (open) close();
            else {
              navigate(parseDisplayDate(text) ?? today, true);
              setOpen(true);
            }
          }}
        >
          <Icon name="calendar" />
        </button>
      </div>
      <div className="time-input-row">
        <Icon name="clock" />
        <label>
          Jam
          <select
            aria-label="Jam"
            value={hour}
            onChange={(event) => onChange(`${date}T${event.target.value}:${minute}`)}
          >
            {values(24).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <span aria-hidden="true">:</span>
        <label>
          Menit
          <select
            aria-label="Menit"
            value={minute}
            onChange={(event) => onChange(`${date}T${hour}:${event.target.value}`)}
          >
            {values(60).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <span className="time-zone">
          WIB
          <br />
          <small>24 jam</small>
        </span>
      </div>
      <p id={id + '-hint'} className={invalid ? 'date-hint error' : 'date-hint'}>
        {invalid ? 'Tanggal tidak valid. Gunakan DD/MM/YYYY.' : 'DD/MM/YYYY · Jam 00:00–23:59'}
      </p>
      <div className="t-acc-panel" id={id + '-calendar'} aria-hidden={!open} inert={!open}>
        <div className="t-acc-panel-inner">
          <fieldset
            disabled={!open}
            className="date-calendar-panel"
            aria-label="Kalender transaksi"
          >
            <div className="date-calendar-header">
              <button
                type="button"
                aria-label="Bulan sebelumnya"
                onClick={() => navigate(moveMonth(focused, -1))}
              >
                <Icon name="chevronLeft" />
              </button>
              <div className="date-month-select">
                <select
                  aria-label="Bulan kalender"
                  value={Number(month.slice(5)) - 1}
                  onChange={(event) =>
                    navigate(
                      `${month.slice(0, 4)}-${String(Number(event.target.value) + 1).padStart(2, '0')}-01`,
                    )
                  }
                >
                  {months.map((label, index) => (
                    <option key={label} value={index}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Tahun kalender"
                  type="number"
                  min="1"
                  max="9999"
                  value={Number(month.slice(0, 4))}
                  onChange={(event) => {
                    const year = Number(event.target.value);
                    if (Number.isInteger(year) && year >= 1 && year <= 9999)
                      navigate(`${String(year).padStart(4, '0')}-${month.slice(5)}-01`);
                  }}
                />
              </div>
              <button
                type="button"
                aria-label="Bulan berikutnya"
                onClick={() => navigate(moveMonth(focused, 1))}
              >
                <Icon name="chevronRight" />
              </button>
            </div>
            <span className="sr-only" id={id + '-month'} aria-live="polite">
              {monthLabel}
            </span>
            <table
              ref={grid}
              role="grid"
              className="date-calendar"
              aria-labelledby={id + '-month'}
              aria-describedby={id + '-keys'}
            >
              <thead>
                <tr>
                  {weekdays.map((day) => (
                    <th scope="col" abbr={day} key={day}>
                      {day.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }, (_, row) => (
                  <tr key={row}>
                    {days.slice(row * 7, row * 7 + 7).map((day) => (
                      <td key={day.iso} aria-selected={day.iso === date}>
                        <button
                          type="button"
                          data-date={day.iso}
                          tabIndex={day.iso === focused ? 0 : -1}
                          disabled={!validDate(day.iso)}
                          aria-label={dateLabel(day.iso)}
                          aria-current={day.iso === today ? 'date' : undefined}
                          className={
                            (day.iso === date ? 'selected ' : '') +
                            (day.iso.slice(0, 7) !== month ? 'outside-month' : '')
                          }
                          onFocus={() => setFocused(day.iso)}
                          onKeyDown={(event) => key(event, day.iso)}
                          onClick={() => choose(day.iso)}
                        >
                          {day.day}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="date-calendar-footer">
              <button type="button" onClick={() => choose(today)}>
                Hari ini
              </button>
              <button type="button" onClick={() => close()}>
                Tutup kalender
              </button>
            </div>
            <p id={id + '-keys'} className="sr-only">
              Panah untuk berpindah hari. Page Up atau Page Down untuk bulan. Enter untuk memilih.
              Escape untuk menutup kalender.
            </p>
          </fieldset>
        </div>
      </div>
      <button
        type="button"
        className="date-now"
        onClick={() => {
          const now = wibDateTime();
          setText(displayDate(now.slice(0, 10)));
          onChange(now);
          setTouched(false);
          close(false);
        }}
      >
        <Icon name="clock" size={14} /> Waktu sekarang
      </button>
    </fieldset>
  );
}
