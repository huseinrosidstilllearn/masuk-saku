import { useState } from 'react';
import type { Snapshot } from '../domain/types';
import { dateOrdinal, type TransactionFilters as Filters } from '../domain/reports';
import { MAX_MONEY } from '../domain/finance';
import { Icon } from './Icon';
export function TransactionFilters({
  data,
  hide,
  onApply,
}: {
  data: Snapshot;
  hide: boolean;
  onApply: (filters: Filters) => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({}),
    [error, setError] = useState('');
  const field = (name: string, value: string) => setDraft({ ...draft, [name]: value });
  const select = (name: string, label: string, options: [string, string][]) => (
    <label key={name}>
      {label}
      <select value={draft[name] ?? ''} onChange={(e) => field(name, e.target.value)}>
        <option value="">Semua</option>
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <details className="transaction-filter-disclosure">
      <summary>
        <Icon name="chevronDown" /> Filter transaksi
      </summary>
      <form
        className="transaction-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          try {
            if (draft.from) dateOrdinal(draft.from);
            if (draft.to) dateOrdinal(draft.to);
            if (draft.from && draft.to && draft.to < draft.from)
              throw Error('Tanggal akhir harus sesudah tanggal mulai.');
            const value = (text: string | undefined) => {
              if (!text) return undefined;
              if (
                !/^\d+$/.test(text) ||
                !Number.isSafeInteger(Number(text)) ||
                Number(text) > MAX_MONEY
              )
                throw Error('Batas nominal harus berupa rupiah bulat.');
              return Number(text);
            };
            const minimum = value(draft.minimum),
              maximum = value(draft.maximum);
            if (minimum !== undefined && maximum !== undefined && minimum > maximum)
              throw Error('Nominal maksimum harus sama atau lebih besar dari minimum.');
            onApply({ ...draft, minimum, maximum });
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Filter belum valid.');
          }
        }}
      >
        <div className="form-grid">
          {select('type', 'Jenis transaksi', [
            ['income', 'Pemasukan'],
            ['expense', 'Pengeluaran'],
            ['transfer', 'Transfer'],
          ])}
          {select('status', 'Status transaksi', [
            ['completed', 'Selesai'],
            ['pending', 'Pending'],
            ['cancelled', 'Batal'],
          ])}
          {select('scope', 'Lingkup transaksi', [
            ['family', 'Keluarga'],
            ['personal', 'Personal'],
          ])}
          {select(
            'wallet',
            'Filter dompet',
            data.wallets.map((w) => [w.id, w.name]),
          )}
          {select(
            'actor',
            'Pelaku transaksi',
            data.members.map((m) => [m.user_id, m.display_name]),
          )}
          <label>
            Dari tanggal (WIB)
            <input
              type="date"
              value={draft.from ?? ''}
              onChange={(e) => field('from', e.target.value)}
            />
          </label>
          <label>
            Sampai tanggal (WIB)
            <input
              type="date"
              value={draft.to ?? ''}
              onChange={(e) => field('to', e.target.value)}
            />
          </label>
          <label>
            Nominal minimum
            <input
              type={hide ? 'password' : 'text'}
              inputMode="numeric"
              pattern="[0-9]*"
              value={draft.minimum ?? ''}
              onChange={(e) => field('minimum', e.target.value)}
            />
          </label>
          <label>
            Nominal maksimum
            <input
              type={hide ? 'password' : 'text'}
              inputMode="numeric"
              pattern="[0-9]*"
              value={draft.maximum ?? ''}
              onChange={(e) => field('maximum', e.target.value)}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="row">
          <button type="submit">Terapkan filter</button>
          <button
            type="button"
            onClick={() => {
              setDraft({});
              setError('');
              onApply({});
            }}
          >
            Reset filter
          </button>
        </div>
      </form>
    </details>
  );
}
