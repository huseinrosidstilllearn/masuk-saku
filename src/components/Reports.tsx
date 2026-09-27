import { useState } from 'react';
import type { Snapshot } from '../domain/types';
import { dateInJakarta, money } from '../domain/finance';
import { periodReport, previousPeriod } from '../domain/reports';
export function Reports({ data, owner, hide }: { data: Snapshot; owner: string; hide: boolean }) {
  const today = dateInJakarta(new Date().toISOString());
  const [period, setPeriod] = useState({ from: today.slice(0, 7) + '-01', to: today }),
    [draft, setDraft] = useState(period),
    [error, setError] = useState('');
  const wallets = new Set(
    data.wallets.filter((w) => owner === 'family' || w.wallet_owner === owner).map((w) => w.id),
  );
  const current = periodReport(data, period.from, period.to, wallets),
    prior = previousPeriod(period.from, period.to),
    previous = periodReport(data, prior.from, prior.to, wallets);
  const fmt = (n: number) => money(n, hide);
  return (
    <section className="panel reports-panel">
      <h2>Perbandingan periode</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          try {
            previousPeriod(draft.from, draft.to);
            setPeriod(draft);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Periode belum valid.');
          }
        }}
      >
        <div className="form-grid">
          <label>
            Mulai laporan (WIB)
            <input
              type="date"
              required
              value={draft.from}
              onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            />
          </label>
          <label>
            Akhir laporan (WIB)
            <input
              type="date"
              required
              value={draft.to}
              onChange={(e) => setDraft({ ...draft, to: e.target.value })}
            />
          </label>
        </div>
        <button>Tampilkan laporan</button>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </form>
      <p className="muted">Pokok transfer tidak dihitung sebagai pemasukan/pengeluaran.</p>
      <p>
        Periode ini: {period.from} – {period.to}. Pembanding {prior.from} – {prior.to}, dengan
        jumlah hari sama.
      </p>
      <div className="form-grid">
        {(
          [
            ['Pemasukan', 'income'],
            ['Pengeluaran', 'expense'],
            ['Arus kas bersih', 'net'],
          ] as const
        ).map(([label, key]) => (
          <article className="stat" key={key}>
            <span>{label}</span>
            <h3>{fmt(current[key])}</h3>
            <small>Sebelumnya: {fmt(previous[key])}</small>
            <p>Selisih: {fmt(current[key] - previous[key])}</p>
          </article>
        ))}
      </div>
      <h3>Pengeluaran menurut kategori</h3>
      {hide ? (
        <p className="muted">Tampilkan saldo untuk melihat rincian dan ringkasan pengeluaran.</p>
      ) : (
        <>
          {current.categories.length ? (
            <ul className="report-categories">
              {current.categories.map(([name, amount]) => (
                <li key={name}>
                  <span>{name}</span>
                  <strong>{fmt(amount)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>Belum ada pengeluaran selesai dalam periode ini.</p>
          )}
          {current.expense > current.income && (
            <p className="warning">Pengeluaran melebihi pemasukan pada periode ini.</p>
          )}
        </>
      )}
      <p className="field-help">
        Laporan mengikuti pemilik dompet pada pilihan lingkup. Pelaku pencatatan tetap terpisah.
        Dompet nonaktif tetap termasuk laporan historis; pending, batal dan sampah dikecualikan.
        Kontribusi target tabungan bersifat virtual.
      </p>
    </section>
  );
}
