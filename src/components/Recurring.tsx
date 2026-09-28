import { useEffect, useState } from 'react';
import type { RecurringOccurrence, RecurringTemplate, Snapshot } from '../domain/types';
import { dateInJakarta, money } from '../domain/finance';
import { wibDateTime } from '../domain/date-time';
import {
  confirmRecurring,
  processRecurring,
  saveRecurring,
  skipRecurring,
} from '../lib/recurring-repository';
import { TransactionForm } from './TransactionForm';
import { EditorDialog } from './Planning';
import { Icon } from './Icon';

export function RecurringPage({
  data,
  user,
  role,
  hide,
  onSaved,
}: {
  data: Snapshot;
  user: string;
  role: string;
  hide: boolean;
  onSaved: (text: string) => Promise<void>;
}) {
  const [edit, setEdit] = useState<RecurringTemplate | 'new' | null>(null);
  const [review, setReview] = useState<RecurringOccurrence | null>(null);
  const [skip, setSkip] = useState<RecurringOccurrence | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const templates = data.recurring ?? [];
  const canManage = (id: string) =>
    role === 'owner' || templates.find((t) => t.id === id)?.created_by === user;
  async function process() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const count = await processRecurring(data.household.id);
      if (count) await onSaved(`${count} kejadian jadwal diperiksa.`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Gagal memeriksa jadwal.');
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void process();
  }, [data.household.id]);
  const pending = (data.occurrences ?? []).filter(
    (o) => o.status === 'pending' || o.status === 'error',
  );
  const history = (data.occurrences ?? [])
    .filter((o) => o.status === 'created' || o.status === 'skipped')
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date));
  return (
    <section className="recurring-page">
      <div className="panel-heading">
        <div>
          <h2>Transaksi berulang</h2>
          <p>Aturan yang kamu setujui untuk pemasukan atau pengeluaran rutin.</p>
        </div>
        <div className="row-actions">
          <button disabled={busy} onClick={() => void process()}>
            <Icon name="clock" /> Periksa jadwal
          </button>
          <button className="primary" onClick={() => setEdit('new')}>
            <Icon name="plus" /> Tambah jadwal
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <p className="review-note">
        Tinjau setiap kejadian untuk mencatat setelah konfirmasi. Mode otomatis mengikuti
        persetujuan awal; AI tidak memutuskan perubahan saldo. Jadwal mengikuti WIB.
      </p>
      <div className="recurring-grid">
        {templates.map((template) => (
          <article className="panel" key={template.id}>
            <span className="badge">
              {template.active ? 'Aktif' : 'Dijeda'} ·{' '}
              {template.mode === 'ask' ? 'Tinjau dahulu' : 'Otomatis'}
            </span>
            <h3>{template.name}</h3>
            <strong>{money(template.transaction_template.amount, hide)}</strong>
            <p>
              {template.cadence === 'weekly' ? 'Setiap minggu' : 'Setiap bulan'} ·{' '}
              {template.run_time} WIB
            </p>
            <small>
              Berikutnya: {template.next_run}
              {template.end_date ? ` · sampai ${template.end_date}` : ''}
            </small>
            {canManage(template.id) && (
              <button onClick={() => setEdit(template)}>
                <Icon name="edit" /> Edit atau jeda
              </button>
            )}
          </article>
        ))}
      </div>
      {!templates.length && (
        <div className="empty empty-panel">
          <Icon name="clock" />
          <strong>Belum ada jadwal berulang.</strong>
          <p>Buat aturan rutin tanpa mengubah transaksi yang sudah tercatat.</p>
        </div>
      )}
      <section className="panel">
        <h3>Menunggu tinjauan</h3>
        {!pending.length && <p>Tidak ada kejadian yang perlu diperiksa.</p>}
        {pending.map((occurrence) => (
          <article className="recurring-row" key={occurrence.id}>
            <div>
              <strong>
                {templates.find((t) => t.id === occurrence.template_id)?.name ?? 'Jadwal'}
              </strong>
              <p>
                {occurrence.scheduled_date} · {money(occurrence.input.amount, hide)}
              </p>
              {occurrence.error_reason && <p className="error">{occurrence.error_reason}</p>}
            </div>
            {canManage(occurrence.template_id) && (
              <div className="row-actions">
                <button onClick={() => setReview(occurrence)}>Tinjau transaksi</button>
                <button onClick={() => setSkip(occurrence)}>Lewati</button>
              </div>
            )}
          </article>
        ))}
      </section>
      <section className="panel">
        <h3>Riwayat jadwal</h3>
        {!history.length && <p>Belum ada kejadian selesai.</p>}
        {history.map((occurrence) => (
          <div className="recurring-row" key={occurrence.id}>
            <span>
              {templates.find((t) => t.id === occurrence.template_id)?.name} ·{' '}
              {occurrence.scheduled_date}
            </span>
            <span className="badge">
              {occurrence.status === 'created' ? 'Tercatat' : 'Dilewati'}
            </span>
          </div>
        ))}
      </section>
      {edit && (
        <RecurringEditor
          key={edit === 'new' ? 'new' : edit.id}
          data={data}
          user={user}
          original={edit === 'new' ? undefined : edit}
          onSaved={onSaved}
          onClose={() => setEdit(null)}
        />
      )}
      {review && (
        <TransactionForm
          data={data}
          user={user}
          initial={review.input}
          onClose={() => setReview(null)}
          onSave={async (input) => {
            await confirmRecurring(review.id, input);
            await onSaved('Kejadian jadwal dicatat.');
          }}
        />
      )}
      {skip && (
        <EditorDialog
          title="Lewati kejadian jadwal?"
          submitLabel="Ya, lewati"
          onClose={() => setSkip(null)}
          onSave={async () => {
            await skipRecurring(skip.id);
            await onSaved('Kejadian dilewati, saldo tidak berubah.');
          }}
        >
          <p>
            Kejadian tanggal {skip.scheduled_date} tidak akan dicatat. Jadwal berikutnya tetap
            berjalan.
          </p>
        </EditorDialog>
      )}
    </section>
  );
}
function RecurringEditor({
  data,
  user,
  original,
  onSaved,
  onClose,
}: {
  data: Snapshot;
  user: string;
  original?: RecurringTemplate;
  onSaved: (text: string) => Promise<void>;
  onClose: () => void;
}) {
  const [id] = useState(original?.id ?? crypto.randomUUID());
  const [name, setName] = useState(original?.name ?? '');
  const [mode, setMode] = useState<RecurringTemplate['mode']>(original?.mode ?? 'ask');
  const [cadence, setCadence] = useState<RecurringTemplate['cadence']>(
    original?.cadence ?? 'monthly',
  );
  const [end, setEnd] = useState(original?.end_date ?? '');
  const [active, setActive] = useState(original?.active ?? true);
  return (
    <TransactionForm
      data={data}
      user={user}
      purpose="template"
      initial={original?.transaction_template ?? {}}
      extraFields={
        <fieldset className="transaction-section">
          <legend>Aturan jadwal</legend>
          <div className="form-grid">
            <label>
              Nama jadwal
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Pengulangan
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value as typeof cadence)}
              >
                <option value="monthly">Bulanan</option>
                <option value="weekly">Mingguan</option>
              </select>
            </label>
            <label>
              Persetujuan
              <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
                <option value="ask">Tinjau setiap kejadian</option>
                <option value="auto_create">Setujui pencatatan otomatis</option>
              </select>
            </label>
            <label>
              Berakhir (opsional)
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
            <label>
              Jadwal
              <select
                value={active ? 'active' : 'paused'}
                onChange={(e) => setActive(e.target.value === 'active')}
              >
                <option value="active">Aktif</option>
                <option value="paused">Jeda</option>
              </select>
            </label>
          </div>
          <small>
            Tanggal & waktu di bawah adalah kejadian pertama. Jadwal tanggal 31 memakai hari
            terakhir pada bulan yang lebih pendek.
          </small>
        </fieldset>
      }
      onClose={onClose}
      onSave={async (input) => {
        const anchor = dateInJakarta(input.occurred_at);
        await saveRecurring(
          {
            id,
            household_id: data.household.id,
            created_by: original?.created_by ?? user,
            name,
            mode,
            cadence,
            anchor_date: anchor,
            next_run: original?.next_run ?? anchor,
            end_date: end || null,
            run_time: wibDateTime(input.occurred_at).slice(11),
            active,
            version: original?.version ?? 1,
            occurrence_index: original?.occurrence_index ?? 0,
            transaction_template: input,
          },
          original,
        );
        await processRecurring(data.household.id);
        await onSaved('Jadwal berulang disetujui.');
      }}
    />
  );
}
