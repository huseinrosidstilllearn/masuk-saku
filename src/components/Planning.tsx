import { useId, useState, type ReactNode, type FormEvent } from 'react';
import { useMotionDialog } from '../lib/motion';
import { budgetSpent, dateInJakarta, money, parseMoney } from '../domain/finance';
import { goalPlan, parseThresholds, validateBudget, validateGoal } from '../domain/planning';
import type { Budget, Goal, Snapshot } from '../domain/types';
import {
  addGoalContribution,
  removeGoalContribution,
  saveBudget,
  saveGoal,
} from '../lib/planning-repository';
import { Icon } from './Icon';

type Props = { data: Snapshot; hide: boolean; onSaved: (message: string) => Promise<void> };

export function EditorDialog({
  title,
  children,
  onClose,
  onSave,
  submitLabel = 'Simpan',
  note,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSave: () => Promise<void>;
  submitLabel?: string;
  note?: string;
}) {
  const { ref, close, isClosing } = useMotionDialog(onClose);
  const titleId = useId();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || isClosing) return;
    setBusy(true);
    setError('');
    try {
      await onSave();
      close();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Gagal menyimpan.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="planning-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) {
          close();
        }
      }}
    >
      <form onSubmit={submit}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">RENCANA KEUANGAN</span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            disabled={busy}
            onClick={() => {
              close();
            }}
          >
            <Icon name="close" />
          </button>
        </div>
        {note && (
          <p className="review-note">
            <Icon name="check" />
            {note}
          </p>
        )}
        <fieldset disabled={busy}>{children}</fieldset>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <footer>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              ref.current?.close();
              onClose();
            }}
          >
            Batal
          </button>
          <button className="primary" disabled={busy}>
            <Icon name="check" />
            {busy ? 'Menyimpan…' : submitLabel}
          </button>
        </footer>
      </form>
    </dialog>
  );
}

function BudgetEditor({
  data,
  original,
  onSaved,
  onClose,
  defaultWallet,
}: Omit<Props, 'hide'> & { original?: Budget; onClose: () => void; defaultWallet?: string }) {
  const today = dateInJakarta(new Date().toISOString());
  const [id] = useState(() => original?.id ?? crypto.randomUUID());
  const [name, setName] = useState(original?.name ?? '');
  const [amount, setAmount] = useState(String(original?.amount ?? ''));
  const [category, setCategory] = useState(original?.category_id ?? '');
  const [wallet, setWallet] = useState(original?.wallet_id ?? defaultWallet ?? '');
  const [start, setStart] = useState(original?.start_date ?? today.slice(0, 7) + '-01');
  const [end, setEnd] = useState(
    original?.end_date ??
      new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0))
        .toISOString()
        .slice(0, 10),
  );
  const [thresholds, setThresholds] = useState(
    (original?.warning_thresholds ?? [75, 90, 100]).join(', '),
  );
  return (
    <EditorDialog
      title={original ? 'Ubah anggaran' : 'Tambah anggaran'}
      onClose={onClose}
      onSave={async () => {
        const budget: Budget = {
          id,
          name: name.trim(),
          amount: parseMoney(amount),
          category_id: category || null,
          wallet_id: wallet || null,
          start_date: start,
          end_date: end,
          warning_thresholds: parseThresholds(thresholds),
          rollover: original?.rollover ?? 'reset',
          rollover_amount: original?.rollover_amount ?? 0,
        };
        validateBudget(budget);
        await saveBudget(data.household.id, budget, original);
        await onSaved('Anggaran disimpan.');
      }}
      note="Anggaran adalah batas perencanaan. Menyimpannya tidak mengubah saldo dompet."
    >
      <label>
        Nama anggaran
        <input
          required
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Contoh: Belanja bulanan"
        />
      </label>
      <label>
        Nominal anggaran (rupiah)
        <input
          required
          inputMode="numeric"
          pattern="[0-9]+"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </label>
      <div className="form-grid">
        <label>
          Kategori anggaran
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Semua kategori</option>
            {data.categories
              .filter((item) => item.kind !== 'income')
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Dompet anggaran
          <select value={wallet} onChange={(event) => setWallet(event.target.value)}>
            <option value="">Semua dompet</option>
            {data.wallets
              .filter((item) => item.active || item.id === original?.wallet_id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {!item.active ? ' (nonaktif)' : ''}
                </option>
              ))}
          </select>
        </label>
        <label>
          Mulai periode
          <input
            type="date"
            required
            value={start}
            onChange={(event) => setStart(event.target.value)}
          />
        </label>
        <label>
          Akhir periode
          <input
            type="date"
            required
            value={end}
            onChange={(event) => setEnd(event.target.value)}
          />
        </label>
      </div>
      <label>
        Ambang peringatan (%)
        <input
          required
          value={thresholds}
          onChange={(event) => setThresholds(event.target.value)}
          aria-describedby="threshold-help"
        />
      </label>
      <p className="field-help" id="threshold-help">
        Pisahkan dengan koma, misalnya 75, 90, 100. Peringatan tidak menghalangi pencatatan
        pengeluaran.
      </p>
      <p className="planning-note">
        Periode baru tidak otomatis membawa sisa anggaran sebelumnya. Perhitungan rollover otomatis
        belum tersedia.
      </p>
    </EditorDialog>
  );
}

export function BudgetPage({ data, hide, onSaved, owner }: Props & { owner: string }) {
  const [editing, setEditing] = useState<Budget | 'new' | null>(null);
  const [periodFilter, setPeriodFilter] = useState('all');
  const today = dateInJakarta(new Date().toISOString());
  const rows = data.budgets.filter(
    (budget) =>
      (owner === 'family' ||
        data.wallets.some(
          (wallet) => wallet.id === budget.wallet_id && wallet.wallet_owner === owner,
        )) &&
      (periodFilter === 'all' || (budget.start_date <= today && budget.end_date >= today)),
  );
  return (
    <>
      <div className="planning-toolbar">
        <div>
          <h2>Rencana pengeluaran</h2>
          <p>Atur periode dan batas yang sesuai kebutuhanmu.</p>
        </div>
        <button className="primary" onClick={() => setEditing('new')}>
          <Icon name="plus" />
          Tambah anggaran
        </button>
      </div>
      <label className="planning-filter">
        Periode anggaran
        <select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)}>
          <option value="all">Semua periode</option>
          <option value="active">Aktif hari ini</option>
        </select>
      </label>
      <div className="planning-grid">
        {rows.map((budget) => {
          const spent = budgetSpent(budget, data.transactions, data.splits),
            limit = budget.amount + budget.rollover_amount;
          const ratio = (spent / limit) * 100;
          const percentage = Math.round(ratio);
          const warning = budget.warning_thresholds
            .filter((threshold) => ratio >= threshold)
            .at(-1);
          return (
            <article className="panel planning-card" key={budget.id}>
              <div className="section-heading">
                <span className="wallet-symbol">
                  <Icon name="budget" />
                </span>
                <button
                  className="text-button"
                  aria-label={'Ubah anggaran ' + budget.name}
                  onClick={() => setEditing(budget)}
                >
                  <Icon name="edit" />
                  Ubah
                </button>
              </div>
              <h3>{budget.name}</h3>
              <p className="planning-description">
                {data.categories.find((category) => category.id === budget.category_id)?.name ??
                  'Semua kategori'}{' '}
                ·{' '}
                {data.wallets.find((wallet) => wallet.id === budget.wallet_id)?.name ??
                  'Semua dompet'}
              </p>
              <div className="planning-amount">
                {money(spent, hide)}
                <small>dari {money(limit, hide)}</small>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-label={'Penggunaan anggaran ' + budget.name}
                aria-valuenow={Math.min(percentage, 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span
                  style={{ width: Math.min(percentage, 100) + '%' }}
                  className={warning ? 'caution' : ''}
                />
              </div>
              <div className="planning-meta">
                <span>{percentage}% terpakai</span>
                <strong className={spent > limit ? 'negative' : ''}>
                  {spent > limit
                    ? 'Melebihi ' + money(spent - limit, hide)
                    : 'Sisa ' + money(limit - spent, hide)}
                </strong>
              </div>
              {warning && (
                <p className="planning-warning">
                  Ambang {warning}% sudah tercapai. Kamu tetap bisa mencatat pengeluaran.
                </p>
              )}
              <p className="planning-date">
                {budget.start_date} sampai {budget.end_date}
              </p>
            </article>
          );
        })}
      </div>
      {!rows.length && (
        <div className="empty empty-panel">
          <Icon name="budget" />
          <strong>Belum ada anggaran di pilihan ini.</strong>
          <p>Tambahkan anggaran atau pilih periode dan lingkup lain.</p>
        </div>
      )}
      <p className="planning-note">
        Anggaran yang tumpang tindih adalah beberapa batas perencanaan, bukan pembagian saldo
        dompet.
      </p>
      {editing && (
        <BudgetEditor
          data={data}
          defaultWallet={
            owner === 'family'
              ? undefined
              : data.wallets.find((wallet) => wallet.active && wallet.wallet_owner === owner)?.id
          }
          original={editing === 'new' ? undefined : editing}
          onSaved={onSaved}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function GoalEditor({
  data,
  original,
  onSaved,
  onClose,
}: Omit<Props, 'hide'> & { original?: Goal; onClose: () => void }) {
  const [id] = useState(() => original?.id ?? crypto.randomUUID());
  const [title, setTitle] = useState(original?.title ?? ''),
    [amount, setAmount] = useState(String(original?.target_amount ?? '')),
    [deadline, setDeadline] = useState(original?.deadline ?? ''),
    [notes, setNotes] = useState(original?.notes ?? ''),
    [status, setStatus] = useState(original?.status ?? 'active');
  return (
    <EditorDialog
      title={original ? 'Ubah target tabungan' : 'Tambah target tabungan'}
      onClose={onClose}
      onSave={async () => {
        const goal: Goal = {
          id,
          title: title.trim(),
          target_amount: parseMoney(amount),
          deadline: deadline || null,
          notes,
          status,
          saved: original?.saved ?? 0,
        };
        validateGoal(goal);
        await saveGoal(data.household.id, goal, original);
        await onSaved('Target tabungan disimpan.');
      }}
      note="Target dan progres adalah catatan virtual. Saldo dompet tidak berubah."
    >
      <label>
        Nama target
        <input
          required
          maxLength={100}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Contoh: Dana pendidikan"
        />
      </label>
      <label>
        Nominal target (rupiah)
        <input
          required
          inputMode="numeric"
          pattern="[0-9]+"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </label>
      <div className="form-grid">
        <label>
          Tanggal target (opsional)
          <input
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
        </label>
        <label>
          Status target
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as Goal['status'])}
          >
            <option value="active">Aktif</option>
            <option value="completed">Selesai</option>
            <option value="archived">Arsip</option>
          </select>
        </label>
      </div>
      <label>
        Catatan target
        <textarea
          maxLength={2000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>
    </EditorDialog>
  );
}

function ContributionEditor({
  data,
  goal,
  user,
  onSaved,
  onClose,
}: Omit<Props, 'hide'> & { goal: Goal; user: string; onClose: () => void }) {
  const [id] = useState(() => crypto.randomUUID());
  const [amount, setAmount] = useState(''),
    [date, setDate] = useState(dateInJakarta(new Date().toISOString()));
  return (
    <EditorDialog
      title={'Catat progres: ' + goal.title}
      submitLabel="Konfirmasi progres"
      onClose={onClose}
      onSave={async () => {
        await addGoalContribution(data.household.id, {
          id,
          goal_id: goal.id,
          amount: parseMoney(amount),
          created_by: user,
          contributed_at: new Date(date + 'T12:00:00+07:00').toISOString(),
        });
        await onSaved('Progres virtual dicatat. Saldo dompet tetap.');
      }}
      note="Ini hanya mencatat progres target. Tidak mengambil uang dari dompet atau membuat transaksi transfer."
    >
      <label>
        Nominal progres (rupiah)
        <input
          required
          inputMode="numeric"
          pattern="[0-9]+"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </label>
      <label>
        Tanggal progres (WIB)
        <input
          required
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>
    </EditorDialog>
  );
}

export function GoalsPage({ data, hide, onSaved, user }: Props & { user: string }) {
  const [editing, setEditing] = useState<Goal | 'new' | null>(null),
    [contributing, setContributing] = useState<Goal | null>(null),
    [history, setHistory] = useState<string | null>(null),
    [filter, setFilter] = useState('active'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const today = dateInJakarta(new Date().toISOString());
  const rows = data.goals.filter((goal) => filter === 'all' || goal.status !== 'archived');
  const historyGoal = data.goals.find((goal) => goal.id === history);
  const contributions = data.contributions
    .filter((item) => item.goal_id === history)
    .sort((a, b) => b.contributed_at.localeCompare(a.contributed_at));
  return (
    <>
      <div className="planning-toolbar">
        <div>
          <h2>Tujuan keluarga</h2>
          <p>Catat progres tanpa memindahkan uang antar-dompet.</p>
        </div>
        <button className="primary" onClick={() => setEditing('new')}>
          <Icon name="plus" />
          Tambah target
        </button>
      </div>
      <label className="planning-filter">
        Tampilkan target
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="active">Aktif & selesai</option>
          <option value="all">Termasuk arsip</option>
        </select>
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="planning-grid">
        {rows.map((goal) => {
          const plan = goalPlan(goal, today),
            percentage = Math.round((goal.saved / goal.target_amount) * 100);
          return (
            <article className="panel planning-card" key={goal.id}>
              <div className="section-heading">
                <span className="goal-symbol">
                  <Icon name="goal" />
                </span>
                <span className="badge">
                  {{ active: 'Aktif', completed: 'Selesai', archived: 'Arsip' }[goal.status]}
                </span>
              </div>
              <h3>{goal.title}</h3>
              {goal.notes && <p className="planning-description">{goal.notes}</p>}
              <div className="planning-amount">
                {money(goal.saved, hide)}
                <small>dari {money(goal.target_amount, hide)}</small>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-label={'Progres target ' + goal.title}
                aria-valuenow={Math.min(percentage, 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: Math.min(percentage, 100) + '%' }} />
              </div>
              <div className="planning-meta">
                <span>{percentage}% tercatat</span>
                <strong>
                  {plan.remaining === 0 ? 'Target tercapai' : 'Sisa ' + money(plan.remaining, hide)}
                </strong>
              </div>
              <p className="planning-date">
                {goal.deadline ? 'Target ' + goal.deadline : 'Tanpa tenggat'}
              </p>
              {goal.status === 'active' && plan.monthly !== null && (
                <p className="planning-recommendation">
                  Rencana kontribusi {money(plan.monthly, hide)}/bulan, termasuk bulan ini.
                </p>
              )}
              {goal.status === 'active' && plan.overdue && (
                <p className="planning-warning">
                  Tenggat sudah lewat. Tinjau kembali target atau catat progres terbaru.
                </p>
              )}
              <div className="planning-actions">
                <button aria-label={'Ubah target ' + goal.title} onClick={() => setEditing(goal)}>
                  <Icon name="edit" />
                  Ubah
                </button>
                <button
                  aria-label={'Riwayat progres ' + goal.title}
                  onClick={() => setHistory(goal.id)}
                >
                  <Icon name="history" />
                  Riwayat
                </button>
                {goal.status === 'active' && (
                  <button
                    className="primary"
                    aria-label={'Catat progres ' + goal.title}
                    onClick={() => setContributing(goal)}
                  >
                    <Icon name="plus" />
                    Catat progres
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!rows.length && (
        <div className="empty empty-panel">
          <Icon name="goal" />
          <strong>Belum ada target di pilihan ini.</strong>
          <p>Mulai dari tujuan keluarga yang paling penting.</p>
        </div>
      )}
      {historyGoal && (
        <section className="panel contribution-history">
          <div className="section-heading">
            <div>
              <h2>Riwayat: {historyGoal.title}</h2>
              <p>Catatan virtual, bukan mutasi saldo dompet.</p>
            </div>
            <button onClick={() => setHistory(null)} aria-label="Tutup riwayat">
              <Icon name="close" />
            </button>
          </div>
          {!contributions.length && <p className="muted">Belum ada progres yang dicatat.</p>}
          {contributions.map((item) => (
            <div className="history-row" key={item.id}>
              <div>
                <strong>{money(item.amount, hide)}</strong>
                <small>
                  {dateInJakarta(item.contributed_at)} ·{' '}
                  {data.members.find((member) => member.user_id === item.created_by)
                    ?.display_name ?? 'Anggota'}
                </small>
              </div>
              {(item.created_by === user ||
                data.members.find((member) => member.user_id === user)?.role === 'owner') && (
                <button
                  disabled={busy}
                  aria-label={'Hapus progres ' + item.id}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        'Hapus catatan progres virtual ini? Saldo dompet tidak berubah.',
                      )
                    )
                      return;
                    setBusy(true);
                    setError('');
                    try {
                      await removeGoalContribution(data.household.id, item.id);
                      await onSaved('Catatan progres dihapus. Saldo dompet tetap.');
                    } catch (failure) {
                      setError(
                        failure instanceof Error ? failure.message : 'Gagal menghapus progres.',
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Icon name="trash" />
                  Hapus
                </button>
              )}
            </div>
          ))}
        </section>
      )}
      {editing && (
        <GoalEditor
          data={data}
          original={editing === 'new' ? undefined : editing}
          onSaved={onSaved}
          onClose={() => setEditing(null)}
        />
      )}
      {contributing && (
        <ContributionEditor
          data={data}
          goal={contributing}
          user={user}
          onSaved={onSaved}
          onClose={() => setContributing(null)}
        />
      )}
    </>
  );
}
