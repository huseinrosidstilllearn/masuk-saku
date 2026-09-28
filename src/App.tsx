import { useCallback, useEffect, useRef, useState } from 'react';
import { Auth, Onboarding } from './components/Auth';
import { PasswordRecovery } from './components/PasswordRecovery';
import { RECOVERY_HASH } from './lib/password-recovery';
import { AccountUsername } from './components/AccountUsername';
import { AccountAvatar, Profile } from './components/Profile';
import { AiCredentials } from './components/AiCredentials';
import { ReceiptCapture } from './components/ReceiptCapture';
import { TransactionHistory } from './components/TransactionHistory';
import { reviseTransaction, transactionInput } from './lib/transaction-revisions';
import { TransactionForm } from './components/TransactionForm';
import { Icon, type IconName } from './components/Icon';
import { CaptureChoices } from './components/CaptureChoices';
import { CashflowChart } from './components/CashflowChart';
import { BudgetPulse } from './components/BudgetPulse';
import { MotionPage, MotionNotice, MotionLoadingText } from './components/Motion';
import { BudgetPage, GoalsPage } from './components/Planning';
import { Reports } from './components/Reports';
import { TransactionFilters } from './components/TransactionFilters';
import {
  filterTransactions,
  categoryTotals,
  type TransactionFilters as Filters,
} from './domain/reports';
import {
  balances,
  budgetSpent,
  canTrash,
  dashboard,
  money,
  monthInJakarta,
} from './domain/finance';
import { parseQuickAdd } from './domain/quick-add';
import { HouseholdManager } from './components/Household';
import { FamilyOverview } from './components/FamilyOverview';
import { WalletManager } from './components/WalletManager';
import { RecurringPage } from './components/Recurring';
import { ImportData } from './components/ImportData';
import { AiDrafts } from './components/AiDrafts';
import { DashboardWidgets } from './components/DashboardWidgets';
import { CommandPalette } from './components/CommandPalette';
import { Activity } from './components/Activity';
import { CatalogManager } from './components/Catalog';
import type { Snapshot, Transaction, TransactionInput } from './domain/types';
import { configured, supabase } from './lib/supabase';
import { subscribeHousehold } from './lib/household-realtime';
import { demoUser } from './lib/demo';
import {
  aiPreview,
  loadSnapshot,
  restoreTransaction,
  saveTransaction,
  trashTransaction,
  updateSettings,
} from './lib/repository';
import { download } from './lib/export';
type Page =
  | 'dashboard'
  | 'transactions'
  | 'wallets'
  | 'budgets'
  | 'goals'
  | 'recurring'
  | 'drafts'
  | 'activity'
  | 'trash'
  | 'settings'
  | 'reports'
  | 'profile';
const pages: { id: Page; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'transactions', label: 'Transaksi', icon: 'transfer' },
  { id: 'wallets', label: 'Dompet', icon: 'wallet' },
  { id: 'budgets', label: 'Anggaran', icon: 'budget' },
  { id: 'goals', label: 'Target tabungan', icon: 'goal' },
  { id: 'recurring', label: 'Transaksi berulang', icon: 'clock' },
  { id: 'drafts', label: 'Draf AI', icon: 'sparkle' },
  { id: 'activity', label: 'Aktivitas', icon: 'history' },
  { id: 'trash', label: 'Sampah', icon: 'trash' },
  { id: 'settings', label: 'Pengaturan', icon: 'settings' },
  { id: 'reports', label: 'Laporan', icon: 'budget' },
  { id: 'profile', label: 'Profil saya', icon: 'user' },
];
export default function App() {
  const [recovering, setRecovering] = useState(
    location.hash === RECOVERY_HASH ||
      new URLSearchParams(location.hash.slice(1)).get('type') === 'recovery',
  );
  const currentUser = useRef<string | null>(configured ? null : demoUser);
  const [filters, setFilters] = useState<Filters>({});
  const [profileVersion, setProfileVersion] = useState(0);
  const [inviteRequested, setInviteRequested] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [user, setUser] = useState<string | null>(configured ? null : demoUser),
    [authLoading, setAuthLoading] = useState(configured),
    [data, setData] = useState<Snapshot | null>(null),
    [loaded, setLoaded] = useState(false),
    [page, setPage] = useState<Page>('dashboard'),
    [captureOpen, setCaptureOpen] = useState(false),
    [receiptMode, setReceiptMode] = useState<'upload' | 'camera'>('upload'),
    [owner, setOwner] = useState('family'),
    [hide, setHide] = useState(false),
    [search, setSearch] = useState(''),
    [quick, setQuick] = useState(''),
    [message, setMessage] = useState(''),
    [messageKind, setMessageKind] = useState<'success' | 'error'>('success'),
    [busy, setBusy] = useState(false),
    [receiptOpen, setReceiptOpen] = useState(false),
    [history, setHistory] = useState<Transaction | null>(null),
    [preview, setPreview] = useState<{
      initial: Partial<TransactionInput>;
      key: string;
      edit?: Transaction;
      receiptFile?: File;
      draftId?: string;
      confidence?: Record<string, number | null>;
    } | null>(null);
  useEffect(() => setListPage(1), [search, owner, page, filters]);
  useEffect(() => {
    const route = () => {
      if (
        location.hash === RECOVERY_HASH ||
        new URLSearchParams(location.hash.slice(1)).get('type') === 'recovery'
      )
        setRecovering(true);
    };
    window.addEventListener('hashchange', route);
    return () => window.removeEventListener('hashchange', route);
  }, []);
  const refresh = useCallback(async () => {
    if (!user) return false;
    try {
      setData(await loadSnapshot(user));
      setLoaded(true);
      return true;
    } catch (e) {
      setMessageKind('error');
      setMessage(e instanceof Error ? e.message : 'Gagal memuat data.');
      return false;
    }
  }, [user]);
  useEffect(() => {
    if (!supabase) return;
    const updateSession = (nextUser: string | null) => {
      if (currentUser.current === nextUser) return;
      currentUser.current = nextUser;
      setUser(nextUser);
      setData(null);
      setPreview(null);
      setReceiptOpen(false);
      setCaptureOpen(false);
      setHistory(null);
      setLoaded(false);
    };
    supabase.auth.getSession().then(({ data }) => {
      updateSession(data.session?.user.id ?? null);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user.id ?? null;
      if (event === 'PASSWORD_RECOVERY') {
        setRecovering(true);
        if (nextUser)
          sessionStorage.setItem('masuk-saku:last-activity:' + nextUser, String(Date.now()));
      }
      // A successful new authentication starts a new inactivity window. Restoring
      // a saved session or repeated SIGNED_IN events must not bypass idle locking.
      if (event === 'SIGNED_IN' && nextUser && currentUser.current !== nextUser)
        sessionStorage.setItem('masuk-saku:last-activity:' + nextUser, String(Date.now()));
      if (event === 'SIGNED_OUT' && currentUser.current)
        sessionStorage.removeItem('masuk-saku:last-activity:' + currentUser.current);
      updateSession(nextUser);
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!recovering) void refresh();
  }, [refresh, recovering]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && user && data) {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [user, data]);
  useEffect(() => {
    if (!supabase || !user || !data?.household.id) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void refresh(), 250);
    };
    const stop = subscribeHousehold(supabase, data.household.id, user, schedule);
    const visible = () => {
      if (document.visibilityState === 'visible') schedule();
    };
    window.addEventListener('focus', schedule);
    document.addEventListener('visibilitychange', visible);
    return () => {
      clearTimeout(timer);
      stop();
      window.removeEventListener('focus', schedule);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [user, data?.household.id, refresh]);
  useEffect(() => {
    if (!configured || !user) return;
    let timer: ReturnType<typeof setTimeout>;
    const duration = (data?.household.session_lock_minutes ?? 15) * 60000;
    const activityKey = 'masuk-saku:last-activity:' + user;
    let lastActivity = Number(sessionStorage.getItem(activityKey)) || Date.now();
    const lockSession = () => {
      clearTimeout(timer);
      sessionStorage.removeItem(activityKey);
      setData(null);
      setPreview(null);
      void supabase!.auth.signOut({ scope: 'local' });
    };
    const reset = () => {
      if (Date.now() - lastActivity >= duration) {
        lockSession();
        return;
      }
      lastActivity = Date.now();
      sessionStorage.setItem(activityKey, String(lastActivity));
      clearTimeout(timer);
      timer = setTimeout(lockSession, duration);
    };
    const checkVisibility = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastActivity >= duration)
        lockSession();
    };
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, reset));
    document.addEventListener('visibilitychange', checkVisibility);
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
      document.removeEventListener('visibilitychange', checkVisibility);
    };
  }, [user, data?.household.session_lock_minutes]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPage('transactions');
        setTimeout(() => document.getElementById('search')?.focus(), 0);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  async function run(action: () => Promise<void>, success?: string) {
    setBusy(true);
    setMessage('');
    try {
      await action();
      const refreshed = await refresh();
      if (success && refreshed) {
        setMessageKind('success');
        setMessage(success);
      }
    } catch (e) {
      setMessageKind('error');
      setMessage(e instanceof Error ? e.message : 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  }
  if (authLoading)
    return (
      <main className="auth loading-state" role="status">
        <span className="spinner" aria-hidden="true" />
        <h1>
          <MotionLoadingText text="Memeriksa sesi…" />
        </h1>
        <p className="muted">Sebentar, kami siapkan sakumu.</p>
      </main>
    );
  if (recovering)
    return (
      <PasswordRecovery
        authenticated={!!user}
        onDone={() => {
          window.history.replaceState(null, '', '/masuk');
          setRecovering(false);
        }}
      />
    );
  if (!user) return <Auth />;
  if (!loaded)
    return (
      <main className="auth">
        {!message && <span className="spinner" aria-hidden="true" />}
        <h1>
          {message ? 'Sakumu belum bisa dimuat' : <MotionLoadingText text="Menyiapkan sakumu…" />}
        </h1>
        {message && <p role="alert">{message}</p>}
        {message && (
          <div className="button-row">
            <button className="primary" onClick={() => void refresh()}>
              Coba lagi
            </button>
            <button onClick={() => void supabase?.auth.signOut()}>Keluar</button>
          </div>
        )}
      </main>
    );
  if (!data) return <Onboarding done={() => void refresh()} />;
  const month = monthInJakarta(new Date().toISOString()),
    summary = dashboard(data.wallets, data.transactions, owner, month),
    balance = balances(data.wallets, data.transactions);
  const member = data.members.find((m) => m.user_id === user)!,
    role = member.role;
  const activeBudgets = data.budgets.filter(
    (b) =>
      b.active !== false &&
      !b.closed_at &&
      b.start_date <= month + '-31' &&
      b.end_date >= month + '-01' &&
      (owner === 'family' || (b.wallet_id && summary.wallets.some((w) => w.id === b.wallet_id))),
  );
  const selectedIds = owner === 'family' ? undefined : new Set(summary.wallets.map((w) => w.id));
  const familyGoals = data.goals.filter((goal) => goal.status !== 'archived');
  const budgetRemaining = activeBudgets.reduce(
    (n, b) =>
      n +
      b.amount +
      b.rollover_amount -
      budgetSpent(b, data.transactions, data.splits, selectedIds, data.categories),
    0,
  );
  const visible = filterTransactions(
    data,
    { ...(page === 'dashboard' ? {} : filters), search },
    new Set(
      data.wallets.filter((w) => owner === 'family' || w.wallet_owner === owner).map((w) => w.id),
    ),
    page === 'trash',
  );
  const totalPages = Math.max(1, Math.ceil(visible.length / 25)),
    currentListPage = Math.min(listPage, totalPages);
  const displayed =
    page === 'dashboard'
      ? visible.slice(0, 5)
      : visible.slice((currentListPage - 1) * 25, currentListPage * 25);
  const fmt = (n: number) => money(n, hide);
  const open = (initial: Partial<TransactionInput> = {}) => {
    setPreview({ initial, key: crypto.randomUUID() });
    setMessage('');
  };
  const quickSubmit = () => {
    try {
      open(parseQuickAdd(quick, data.wallets));
    } catch (e) {
      setMessageKind('error');
      setMessage(e instanceof Error ? e.message : 'Format belum dikenali.');
    }
  };
  const transactions = (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Transaksi</th>
            <th>Dompet / pelaku</th>
            <th>Nominal</th>
            <th>Status</th>
            <th>
              <span className="sr-only">Tindakan</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((t) => (
            <tr key={t.id}>
              <td>
                <strong>
                  {t.merchant ||
                    { expense: 'Pengeluaran', income: 'Pemasukan', transfer: 'Transfer' }[t.type]}
                </strong>
                <small>
                  {new Date(t.occurred_at).toLocaleDateString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    day: 'numeric',
                    month: 'short',
                  })}{' '}
                  ·{' '}
                  {data.categories.find((c) => c.id === t.category_id)?.name ??
                    (t.type === 'transfer' ? 'Antar-dompet' : 'Tanpa kategori')}
                </small>
              </td>
              <td>
                {data.wallets.find((w) => w.id === t.wallet_id)?.name}
                <small>
                  {data.members.find((m) => m.user_id === t.transaction_actor)?.display_name} ·{' '}
                  {t.transaction_scope === 'family' ? 'Keluarga' : 'Personal'}
                </small>
              </td>
              <td className={t.type === 'income' ? 'positive' : ''}>
                {t.type === 'expense' ? '−' : t.type === 'income' ? '+' : ''}
                {fmt(t.amount)}
              </td>
              <td>
                <span className={'badge ' + t.status}>
                  {page === 'trash'
                    ? 'Sampah'
                    : { completed: 'Selesai', pending: 'Pending', cancelled: 'Batal' }[t.status]}
                </span>
              </td>
              <td>
                {page !== 'trash' && !t.parent_transaction_id && canTrash(t, user, role) && (
                  <>
                    <button
                      className="text-button"
                      aria-label={'Ubah ' + t.merchant}
                      onClick={() =>
                        setPreview({
                          initial: transactionInput(data, t),
                          edit: structuredClone(t),
                          key: crypto.randomUUID(),
                        })
                      }
                    >
                      <Icon name="edit" /> Ubah
                    </button>
                    <button
                      className="text-button"
                      aria-label={'Riwayat ' + t.merchant}
                      onClick={() => setHistory(t)}
                    >
                      <Icon name="history" /> Riwayat
                    </button>
                  </>
                )}
                {page === 'trash'
                  ? role === 'owner' && (
                      <button
                        disabled={busy}
                        className="text-button"
                        onClick={() =>
                          void run(() => restoreTransaction(t.id), 'Transaksi dipulihkan.')
                        }
                      >
                        Pulihkan
                      </button>
                    )
                  : canTrash(t, user, role) && (
                      <button
                        disabled={busy}
                        className="text-button danger-action"
                        aria-label={'Hapus ' + t.merchant}
                        onClick={() => {
                          if (confirm('Pindahkan transaksi ke sampah selama 30 hari?'))
                            void run(() => trashTransaction(t.id), 'Transaksi masuk sampah.');
                        }}
                      >
                        Hapus
                      </button>
                    )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!visible.length && (
        <div className="empty">
          <span className="empty-icon">
            <Icon name={page === 'trash' ? 'trash' : 'transfer'} />
          </span>
          <strong>Belum ada transaksi di sini.</strong>
          <p>
            {search
              ? 'Coba kata kunci lain atau kosongkan pencarian.'
              : page === 'trash'
                ? 'Transaksi yang dihapus akan tersimpan di sini selama 30 hari.'
                : 'Mulai dengan mencatat pemasukan atau pengeluaran pertamamu.'}
          </p>
          {search && <button onClick={() => setSearch('')}>Kosongkan pencarian</button>}
        </div>
      )}
      {visible.length > 200 && page !== 'dashboard' && (
        <p>Menampilkan 200 transaksi pertama. Gunakan pencarian atau ekspor untuk seluruh data.</p>
      )}
    </div>
  );
  const wallets = (
    <div className="wallet-grid">
      {summary.wallets.map((w) => (
        <article className="wallet-card" key={w.id}>
          <span className="wallet-symbol">
            <Icon name={w.type === 'bank' ? 'bank' : 'wallet'} />
          </span>
          <span className="badge">
            {w.ownership === 'shared'
              ? 'Bersama'
              : data.members.find((m) => m.user_id === w.wallet_owner)?.display_name}
          </span>
          <h3>{w.name}</h3>
          <p>{fmt(balance[w.id])}</p>
          <small>
            {w.type === 'bank' ? 'Rekening bank' : w.type === 'cash' ? 'Uang tunai' : 'E-wallet'} ·
            IDR
          </small>
        </article>
      ))}
      {!summary.wallets.length && (
        <div className="empty empty-panel">
          <span className="empty-icon">
            <Icon name="wallet" />
          </span>
          <strong>Belum ada dompet di lingkup ini.</strong>
          <p>
            {role === 'owner'
              ? 'Buka Dompet untuk menambahkan tempat menyimpan uangmu.'
              : 'Minta Owner menambahkan dompet untuk keluarga.'}
          </p>
          {page === 'dashboard' && <button onClick={() => setPage('wallets')}>Lihat dompet</button>}
        </div>
      )}
    </div>
  );
  const budgets = (
    <div className="budget-list">
      {activeBudgets.map((b) => {
        const spent = budgetSpent(b, data.transactions, data.splits, selectedIds, data.categories),
          limit = b.amount + b.rollover_amount,
          pct = (spent / limit) * 100;
        return (
          <article key={b.id}>
            <div className="row">
              <strong>{b.name}</strong>
              <span className={pct >= 100 ? 'negative' : ''}>{Math.round(pct)}%</span>
            </div>
            <div
              className="progress"
              role="progressbar"
              aria-label={'Penggunaan anggaran ' + b.name}
              aria-valuenow={Math.round(Math.min(pct, 100))}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                style={{ width: Math.min(pct, 100) + '%' }}
                className={
                  b.warning_thresholds.some((threshold) => pct >= threshold) ? 'caution' : ''
                }
              />
            </div>
            <small>
              {fmt(spent)} <span className="muted">dari {fmt(limit)}</span>
            </small>
            {pct >= 100 && <p className="negative">Melebihi anggaran {fmt(spent - limit)}</p>}
          </article>
        );
      })}
      {!activeBudgets.length && (
        <p className="muted">Belum ada anggaran aktif untuk lingkup ini.</p>
      )}
    </div>
  );
  const goals = (
    <div className="goal-grid">
      {familyGoals.map((g) => (
        <article key={g.id} className="goal-card">
          <div className="row">
            <span className="goal-symbol">
              <Icon name="goal" />
            </span>
            <span className="muted">{Math.round((g.saved / g.target_amount) * 100)}%</span>
          </div>
          <h3>{g.title}</h3>
          <div
            className="progress"
            role="progressbar"
            aria-label={'Progres target ' + g.title}
            aria-valuenow={Math.round(Math.min((g.saved / g.target_amount) * 100, 100))}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: Math.min((g.saved / g.target_amount) * 100, 100) + '%' }} />
          </div>
          <p>
            {fmt(g.saved)} <small>dari {fmt(g.target_amount)}</small>
          </p>
          <small>
            {g.deadline
              ? 'Target ' +
                new Date(g.deadline).toLocaleDateString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  month: 'long',
                  year: 'numeric',
                })
              : 'Tanpa tenggat'}{' '}
            · Tracking virtual
          </small>
        </article>
      ))}
      {!familyGoals.length && (
        <div className="empty empty-panel">
          <span className="empty-icon">
            <Icon name="goal" />
          </span>
          <strong>Belum ada target tabungan.</strong>
          <p>Target keluarga akan tampil di sini ketika sudah tersedia.</p>
        </div>
      )}
    </div>
  );
  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Langsung ke konten
      </a>
      <aside>
        <div className="brand">
          <span className="brand-mark">
            <Icon name="wallet" />
          </span>
          <span>masuk saku</span>
        </div>
        <div className="household-card">
          <span>RUMAH TANGGA</span>
          <strong>{data.household.name}</strong>
          <small>{data.members.length} anggota · Satu tujuan bersama</small>
        </div>
        <nav aria-label="Navigasi utama">
          {[pages[0], pages[2], null, pages[1], pages[3], ...pages.slice(4)].map((p) =>
            p ? (
              <button
                key={p.id}
                className={[
                  page === p.id ? 'active' : '',
                  !['dashboard', 'transactions', 'wallets', 'budgets'].includes(p.id)
                    ? 'secondary-nav'
                    : '',
                ].join(' ')}
                aria-current={page === p.id ? 'page' : undefined}
                aria-label={p.label}
                title={p.label}
                onClick={() => setPage(p.id)}
              >
                <Icon name={p.icon} />
                <span className="nav-label">{p.label}</span>
              </button>
            ) : (
              <button
                key="capture"
                className="nav-capture"
                aria-label="Tambah transaksi"
                title="Tambah transaksi"
                aria-haspopup="dialog"
                aria-expanded={captureOpen}
                onClick={() => setCaptureOpen(true)}
              >
                <span className="nav-capture-icon">
                  <Icon name="plus" />
                  <Icon name="sparkle" className="nav-capture-spark" />
                </span>
                <span className="nav-label">Tambah</span>
              </button>
            ),
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="note">
            <strong>
              Sedikit demi sedikit,
              <br />
              lebih terarah.
            </strong>
            <p>Catatan hari ini membantu rencana besok.</p>
          </div>
          <div className="member">
            <button
              className="profile-open"
              aria-label="Profil akun"
              onClick={() => setPage('profile')}
            >
              <AccountAvatar userId={user} name={member.display_name} version={profileVersion} />
            </button>
            <div>
              <strong>{member.display_name}</strong>
              <small>{role === 'owner' ? 'Owner household' : 'Member household'}</small>
            </div>
            {configured && (
              <button
                aria-label="Keluar"
                onClick={() => void supabase!.auth.signOut({ scope: 'local' })}
              >
                <Icon name="logout" />
              </button>
            )}
          </div>
        </div>
      </aside>
      <div className="main">
        <header>
          <span className="breadcrumb">
            masuk saku / <strong>{pages.find((p) => p.id === page)!.label}</strong>
          </span>
          <div className="header-actions">
            <button
              className="header-search"
              onClick={() => {
                setPage('transactions');
                setTimeout(() => document.getElementById('search')?.focus(), 0);
              }}
              aria-label="Cari transaksi"
            >
              <Icon name="search" />
              <span>Cari transaksi</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button className="balance-toggle" onClick={() => setHide(!hide)} aria-pressed={hide}>
              <span className="t-icon-swap" data-state={hide ? 'b' : 'a'} aria-hidden="true">
                <span className="t-icon" data-icon="a">
                  <Icon name="eye" />
                </span>
                <span className="t-icon" data-icon="b">
                  <Icon name="eyeOff" />
                </span>
              </span>
              {hide ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            </button>
            <button
              className="profile-open"
              aria-label="Buka profil saya"
              onClick={() => setPage('profile')}
            >
              <AccountAvatar userId={user} name={member.display_name} version={profileVersion} />
            </button>
            {configured && (
              <button
                className="mobile-signout"
                aria-label="Keluar"
                title="Keluar"
                onClick={() => void supabase!.auth.signOut({ scope: 'local' })}
              >
                <Icon name="logout" />
              </button>
            )}
          </div>
        </header>
        <main id="main-content" tabIndex={-1} aria-busy={busy}>
          {!configured && (
            <div className="demo-banner">
              <strong>Mode demo</strong>
              <span>Data contoh di memori. Muat ulang untuk mengatur ulang.</span>
            </div>
          )}
          <div className="workspace-title">
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  {new Date()
                    .toLocaleDateString('id-ID', {
                      timeZone: 'Asia/Jakarta',
                      month: 'long',
                      year: 'numeric',
                    })
                    .toUpperCase()}
                </span>
                <h1>
                  {page === 'dashboard'
                    ? 'Ringkasan keuangan'
                    : pages.find((p) => p.id === page)!.label}
                </h1>
                <p>
                  {page === 'dashboard'
                    ? `${data.household.name} · Semua uang, dalam satu pandangan.`
                    : page === 'trash'
                      ? 'Transaksi tersimpan 30 hari. Owner dapat memulihkannya.'
                      : 'Satu saku, semua catatan keuangan.'}
                </p>
              </div>
            </div>
            <div className="toolbar">
              <div className="scope">
                <label className="sr-only" htmlFor="scope">
                  Lingkup dashboard
                </label>
                <select id="scope" value={owner} onChange={(e) => setOwner(e.target.value)}>
                  <option value="family">Keluarga</option>
                  {data.members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <span className="muted">Personal berdasarkan pemilik dompet</span>
              <span className="connection">
                <i />
                {configured ? 'Saku keluarga' : 'Demo lokal'}
              </span>
            </div>
          </div>
          {message && (
            <MotionNotice
              key={message}
              text={message}
              kind={messageKind}
              onDismiss={() => setMessage('')}
            />
          )}
          <MotionPage page={page}>
            {page === 'dashboard' && (
              <DashboardWidgets household={data.household.id} user={user}>
                <section
                  data-widget="overview"
                  className="overview"
                  aria-label="Ringkasan keuangan"
                >
                  <article className="stat featured balance-card">
                    <div className="balance-pocket">
                      <div className="balance-topline">
                        <span className="balance-label">
                          <Icon name="wallet" /> Total saldo
                        </span>
                        <span className="balance-currency">IDR</span>
                      </div>
                      <h2>{fmt(summary.balance)}</h2>
                      <small>{summary.wallets.length} dompet aktif · Saldo tercatat</small>
                      <div className="balance-card-signature" aria-hidden="true">
                        <span>masuk saku</span>
                        <Icon name="wallet" />
                      </div>
                      <button className="balance-wallet-link" onClick={() => setPage('wallets')}>
                        <span>
                          <small>Dompet dalam lingkup ini</small>
                          <strong>
                            {summary.wallets
                              .slice(0, 2)
                              .map((w) => w.name)
                              .join(' · ') || 'Belum ada dompet'}
                          </strong>
                        </span>
                        <Icon name="arrowRight" />
                      </button>
                      <section className="balance-shortcuts" aria-label="Aksi cepat">
                        <button onClick={() => open({ type: 'expense' })}>
                          <Icon name="expense" /> Catat pengeluaran
                        </button>
                        <button onClick={() => open({ type: 'income' })}>
                          <Icon name="income" /> Catat pemasukan
                        </button>
                        <button onClick={() => open({ type: 'transfer' })}>
                          <Icon name="transfer" /> Catat transfer
                        </button>
                      </section>
                    </div>
                    <div className="cashflow-panel">
                      <div className="section-heading">
                        <div>
                          <h3>Arus uang</h3>
                          <p>Pemasukan dan pengeluaran bulan ini</p>
                        </div>
                        <span className="badge">Bulanan</span>
                      </div>
                      <CashflowChart rows={summary.rows} month={month} hide={hide} />
                    </div>
                  </article>
                  <div className="planning-summary">
                    <article className="stat plan-summary-card">
                      <span className="plan-summary-icon">
                        <Icon name="budget" />
                      </span>
                      <div>
                        <span>Sisa anggaran</span>
                        <h2>{fmt(budgetRemaining)}</h2>
                        <small>{activeBudgets.length} anggaran aktif</small>
                        <BudgetPulse
                          limit={activeBudgets.reduce(
                            (n, b) => n + b.amount + b.rollover_amount,
                            0,
                          )}
                          remaining={budgetRemaining}
                          hide={hide}
                        />
                      </div>
                      <button
                        className="plan-summary-link"
                        onClick={() => setPage('budgets')}
                        aria-label="Lihat anggaran"
                      >
                        <Icon name="arrowRight" />
                      </button>
                    </article>
                    <article className="stat plan-summary-card">
                      <span className="plan-summary-icon savings">
                        <Icon name="goal" />
                      </span>
                      <div>
                        <span>Target tabungan</span>
                        <h2>{fmt(familyGoals.reduce((n, g) => n + g.saved, 0))}</h2>
                        <small>{familyGoals.length} target keluarga · Tracking virtual</small>
                      </div>
                      <button
                        className="plan-summary-link"
                        onClick={() => setPage('goals')}
                        aria-label="Lihat target tabungan"
                      >
                        <Icon name="arrowRight" />
                      </button>
                    </article>
                    <article className="stat plan-summary-card cockpit-count">
                      <span className="count-symbol" aria-hidden="true">
                        <Icon name="wallet" />
                      </span>
                      <span>Dompet aktif</span>
                      <strong>{summary.wallets.length}</strong>
                      <small>Dalam lingkup pilihan</small>
                    </article>
                    <article className="stat plan-summary-card cockpit-count">
                      <span className="count-symbol" aria-hidden="true">
                        <Icon name="transfer" />
                      </span>
                      <span>Transaksi bulan ini</span>
                      <strong>
                        {summary.rows.filter((row) => !row.parent_transaction_id).length}
                      </strong>
                      <small>Transaksi selesai tercatat</small>
                    </article>
                  </div>
                </section>
                <div data-widget="family">
                  <FamilyOverview
                    data={data}
                    balance={balance}
                    fmt={fmt}
                    owner={owner}
                    onSelect={setOwner}
                    isOwner={role === 'owner'}
                    onManage={() => {
                      setInviteRequested(false);
                      setPage('settings');
                    }}
                    onInvite={() => {
                      setInviteRequested(true);
                      setPage('settings');
                    }}
                  />
                </div>
                <section
                  data-widget="menu"
                  className="dashboard-more panel"
                  aria-labelledby="dashboard-more-title"
                >
                  <div className="section-heading">
                    <div>
                      <h3 id="dashboard-more-title">Lebih banyak di sakumu</h3>
                      <p>Rencana dan pengaturan keluarga, dalam satu tempat.</p>
                    </div>
                    <button onClick={() => setCommandOpen(true)}>
                      <Icon name="search" /> Pencarian cepat <small>Ctrl+K</small>
                    </button>
                  </div>
                  <div className="dashboard-more-grid">
                    {pages.slice(4).map((p) => (
                      <button
                        key={p.id}
                        aria-label={`Buka ${p.label.toLowerCase()}`}
                        onClick={() => setPage(p.id)}
                      >
                        <span className={`dashboard-more-icon ${p.id}`}>
                          <Icon name={p.icon} />
                        </span>
                        <strong>{p.label}</strong>
                        <small>
                          {
                            {
                              goals: 'Wujudkan rencana keluarga',
                              recurring: 'Atur pencatatan rutin',
                              drafts: 'Lanjutkan hasil pembacaan',
                              activity: 'Riwayat perubahan keluarga',
                              trash: 'Pulihkan dalam 30 hari',
                              reports: 'Bandingkan arus kas',
                              profile: 'Lengkapi identitasmu',
                              settings: 'Akun, keluarga, dan AI',
                            }[
                              p.id as Exclude<
                                Page,
                                'dashboard' | 'transactions' | 'wallets' | 'budgets'
                              >
                            ]
                          }
                        </small>
                        <Icon name="chevronRight" />
                      </button>
                    ))}
                  </div>
                </section>
                <section data-widget="quick" className="quick panel">
                  <span className="quick-icon">
                    <Icon name="sparkle" />
                  </span>
                  <div>
                    <strong>Catat secepat mengetik.</strong>
                    <small>Ketik singkat, periksa, lalu simpan.</small>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      quickSubmit();
                    }}
                  >
                    <label className="sr-only" htmlFor="quick">
                      Input Quick Add
                    </label>
                    <input
                      id="quick"
                      value={quick}
                      onChange={(e) => setQuick(e.target.value)}
                      placeholder="-27k makan @dana"
                    />
                    <button type="submit">
                      Tinjau <Icon name="arrowRight" />
                    </button>
                  </form>
                </section>
                <section data-widget="recent" className="panel recent-transactions">
                  <div className="section-heading">
                    <div>
                      <h2>Transaksi terbaru</h2>
                      <p>Uang bergerak, semuanya tercatat.</p>
                    </div>
                    <button className="text-button" onClick={() => setPage('transactions')}>
                      Lihat semua <Icon name="arrowRight" />
                    </button>
                  </div>
                  {transactions}
                </section>
                <div data-widget="breakdown" className="dashboard-grid fintech-overview">
                  <section className="panel category-panel">
                    <div className="section-heading">
                      <div>
                        <h2>Pengeluaran per kategori</h2>
                        <p>Alokasi pengeluaran bulan ini</p>
                      </div>
                      <Icon name="budget" />
                    </div>
                    <div className="category-breakdown">
                      {categoryTotals(data, summary.rows).map(([name, amount]) => (
                        <div className="row" key={name}>
                          <span>
                            <i />
                            {name}
                          </span>
                          <strong>{fmt(amount)}</strong>
                          {!hide && (
                            <div className="category-meter" aria-hidden="true">
                              <span
                                style={{
                                  width: `${(amount / Math.max(summary.expense, 1)) * 100}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {!categoryTotals(data, summary.rows).length && (
                      <p className="muted category-empty">
                        Belum ada pengeluaran berkategori bulan ini.
                      </p>
                    )}
                  </section>
                  <section className="panel budget-panel">
                    <div className="section-heading">
                      <div>
                        <h2>Anggaran bulan ini</h2>
                        <p>Pantau pemakaian tanpa membatasi pencatatan.</p>
                      </div>
                      <button className="text-button" onClick={() => setPage('budgets')}>
                        Lihat semua <Icon name="arrowRight" />
                      </button>
                    </div>
                    {budgets}
                  </section>
                </div>
                <section data-widget="wallets">
                  <div className="section-heading">
                    <h2>Dompet keluarga</h2>
                    <button className="text-button" onClick={() => setPage('wallets')}>
                      Kelola dompet <Icon name="arrowRight" />
                    </button>
                  </div>
                  {wallets}
                </section>
                <section data-widget="goals">
                  <div className="section-heading">
                    <h2>Pelan-pelan, menuju tujuan.</h2>
                    <span className="muted">Kontribusi tidak mengubah saldo dompet</span>
                  </div>
                  {goals}
                </section>
              </DashboardWidgets>
            )}
            {(page === 'transactions' || page === 'trash') && (
              <section className="panel">
                <div className="section-heading">
                  <label className="search">
                    <span className="sr-only">Cari transaksi</span>
                    <input
                      id="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari merchant, dompet, pelaku…"
                    />
                  </label>
                  <div>
                    <button onClick={() => download(data, 'csv')}>Ekspor CSV</button>
                    <button onClick={() => download(data, 'json')}>Ekspor JSON</button>
                  </div>
                </div>
                <TransactionFilters data={data} hide={hide} onApply={setFilters} />
                {transactions}
                <nav className="row list-pagination" aria-label="Halaman transaksi">
                  <button
                    disabled={currentListPage === 1}
                    onClick={() => setListPage(currentListPage - 1)}
                  >
                    Sebelumnya
                  </button>
                  <span>
                    {currentListPage} / {totalPages} · {visible.length} transaksi
                  </span>
                  <button
                    disabled={currentListPage === totalPages}
                    onClick={() => setListPage(currentListPage + 1)}
                  >
                    Berikutnya
                  </button>
                </nav>
              </section>
            )}
            {page === 'reports' && <Reports data={data} owner={owner} hide={hide} />}
            {page === 'activity' &&
              (role === 'owner' ? (
                <Activity household={data.household.id} members={data.members} hide={hide} />
              ) : (
                <section className="panel">
                  <h2>Aktivitas keluarga</h2>
                  <p>Log aktivitas lengkap hanya tersedia untuk Owner keluarga.</p>
                </section>
              ))}
            {page === 'drafts' && (
              <AiDrafts
                household={data.household.id}
                hide={hide}
                onResume={(result) =>
                  setPreview({
                    initial: result.candidate,
                    key: crypto.randomUUID(),
                    draftId: result.draft_id,
                    confidence: result.confidence,
                  })
                }
              />
            )}
            {page === 'recurring' && (
              <RecurringPage
                data={data}
                user={user}
                role={role}
                hide={hide}
                onSaved={async (text) => {
                  if (!(await refresh()))
                    throw new Error('Tersimpan, tetapi data belum dapat dimuat ulang.');
                  setMessageKind('success');
                  setMessage(text);
                }}
              />
            )}
            {page === 'wallets' && (
              <WalletManager
                data={data}
                owner={owner}
                hide={hide}
                role={role}
                onSaved={async (text) => {
                  if (!(await refresh()))
                    throw new Error(
                      'Tersimpan, tetapi data belum dapat dimuat ulang. Coba muat ulang halaman.',
                    );
                  setMessageKind('success');
                  setMessage(text);
                }}
              />
            )}
            {page === 'budgets' && (
              <BudgetPage
                data={data}
                owner={owner}
                hide={hide}
                onSaved={async (text) => {
                  if (await refresh()) {
                    setMessageKind('success');
                    setMessage(text);
                  }
                }}
              />
            )}
            {page === 'goals' && (
              <GoalsPage
                data={data}
                user={user}
                hide={hide}
                onSaved={async (text) => {
                  if (await refresh()) {
                    setMessageKind('success');
                    setMessage(text);
                  }
                }}
              />
            )}
            {page === 'settings' && (
              <>
                {role === 'owner' && (
                  <ImportData
                    data={data}
                    user={user}
                    onSaved={async () => {
                      if (!(await refresh()))
                        throw new Error('Data diimpor, tetapi belum dapat dimuat ulang.');
                      setMessageKind('success');
                      setMessage('Data impor ditambahkan.');
                    }}
                  />
                )}
                <div className="settings-profile-action">
                  <button onClick={() => setPage('profile')}>
                    <Icon name="user" />
                    Edit profil saya
                  </button>
                </div>
                <Settings
                  data={data}
                  role={role}
                  busy={busy}
                  save={(r, l) =>
                    run(() => updateSettings(data.household.id, r, l), 'Pengaturan disimpan.')
                  }
                  capture={(text) =>
                    run(async () => {
                      const result = await aiPreview(data.household.id, text);
                      setPreview({
                        initial: result.candidate,
                        key: crypto.randomUUID(),
                        draftId: result.draft_id,
                        confidence: result.confidence,
                      });
                    })
                  }
                />
              </>
            )}
            {page === 'settings' && (
              <CatalogManager
                data={data}
                onSaved={async (text) => {
                  if (await refresh()) {
                    setMessageKind('success');
                    setMessage(text);
                  }
                }}
              />
            )}
            {page === 'settings' && (
              <HouseholdManager
                data={data}
                isOwner={role === 'owner'}
                initialInvite={inviteRequested}
                onInviteHandled={() => setInviteRequested(false)}
                onSaved={async () => {
                  await refresh();
                }}
              />
            )}
            {page === 'profile' && (
              <Profile
                onOpenAi={() => setPage('settings')}
                userId={user}
                nickname={member.display_name}
                onSaved={async () => {
                  setProfileVersion((v) => v + 1);
                  await refresh();
                }}
              />
            )}
          </MotionPage>
          <div className="page-actions">
            <button
              onClick={() => {
                setReceiptMode('upload');
                setReceiptOpen(true);
              }}
            >
              <Icon name="upload" /> Upload struk
            </button>
            <button className="primary" onClick={() => open()}>
              <Icon name="plus" /> Catat transaksi
            </button>
          </div>
          <footer className="page-footer">
            Masuk Saku · Satu saku, semua catatan keuangan.
            <span>AI-assisted, human-confirmed.</span>
          </footer>
        </main>
      </div>
      {captureOpen && (
        <CaptureChoices
          onClose={() => setCaptureOpen(false)}
          onSelect={(mode) => {
            setCaptureOpen(false);
            if (mode === 'manual') open();
            else {
              setReceiptMode(mode);
              setReceiptOpen(true);
            }
          }}
        />
      )}
      {commandOpen && (
        <CommandPalette
          pages={pages}
          onClose={() => setCommandOpen(false)}
          onNavigate={(id) => setPage(id as Page)}
          onSearch={(text) => {
            setSearch(text);
            setPage('transactions');
          }}
        />
      )}
      {receiptOpen && (
        <ReceiptCapture
          initialMode={receiptMode}
          household={data.household.id}
          retention={data.household.attachment_retention}
          hide={hide}
          onClose={() => setReceiptOpen(false)}
          onSettings={() => {
            setReceiptOpen(false);
            setPage('settings');
          }}
          onManual={() => {
            setReceiptOpen(false);
            open();
          }}
          onPreview={(result, file) => {
            setReceiptOpen(false);
            setPreview({
              initial: result.candidate,
              key: crypto.randomUUID(),
              draftId: result.draft_id,
              receiptFile: file,
              confidence: result.confidence,
            });
          }}
        />
      )}
      {history && (
        <TransactionHistory tx={history} data={data} hide={hide} onClose={() => setHistory(null)} />
      )}
      {preview && (
        <TransactionForm
          key={preview.key}
          data={data}
          user={user}
          initial={preview.initial}
          editing={!!preview.edit}
          receiptFile={preview.receiptFile}
          hideReceipt={hide}
          confidence={preview.confidence}
          onClose={() => setPreview(null)}
          onSave={async (input, ack) => {
            if (preview.edit) await reviseTransaction(preview.edit, input, preview.key);
            else await saveTransaction(data.household.id, input, preview.key, preview.draftId, ack);
            if (await refresh()) {
              setMessageKind('success');
              setMessage(preview.edit ? 'Perubahan transaksi tersimpan.' : 'Transaksi tersimpan.');
            }
            setQuick('');
          }}
        />
      )}
    </div>
  );
}
function Settings({
  data,
  role,
  busy,
  save,
  capture,
}: {
  data: Snapshot;
  role: string;
  busy: boolean;
  save: (r: string, l: number) => Promise<void>;
  capture: (text: string) => Promise<void>;
}) {
  const [retention, setRetention] = useState(data.household.attachment_retention),
    [lock, setLock] = useState(data.household.session_lock_minutes),
    [text, setText] = useState('');
  return (
    <div className="settings-grid">
      <AccountUsername />
      <section className="panel">
        <h2>Privasi & penyimpanan</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save(retention, lock);
          }}
        >
          <label>
            Retensi bukti setelah konfirmasi
            <select
              disabled={role !== 'owner'}
              value={retention}
              onChange={(e) => setRetention(e.target.value)}
            >
              <option value="immediate">Hapus setelah konfirmasi</option>
              <option value="24h">24 jam (default)</option>
              <option value="7d">7 hari</option>
              <option value="keep">Simpan terus</option>
            </select>
          </label>
          <label>
            Kunci sesi setelah tidak aktif (menit)
            <input
              disabled={role !== 'owner'}
              type="number"
              min={5}
              max={60}
              value={lock}
              onChange={(e) => setLock(Number(e.target.value))}
            />
          </label>
          <p className="muted">
            Sampah transaksi: 30 hari. Backup otomatis mingguan memakai konfigurasi server.
          </p>
          <button className="primary" disabled={busy || role !== 'owner'}>
            Simpan pengaturan
          </button>
        </form>
      </section>
      <section className="panel">
        <h2>AI dengan kuncimu sendiri</h2>
        <p className="muted">
          OpenRouter · openrouter/free. Hanya model gratis, kunci dienkripsi di server.
        </p>
        <AiCredentials key={data.household.id} household={data.household.id} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void capture(text);
          }}
        >
          <label>
            Catat dengan bahasa sehari-hari
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tadi beli bensin 50 ribu pakai BCA Utama"
              maxLength={4000}
              required
              disabled={!configured}
            />
          </label>
          <button disabled={busy || !configured}>Buat preview AI</button>
        </form>
        {!configured && (
          <p className="warning">
            Hubungkan Supabase dan Edge Functions untuk memakai AI. Quick Add tetap bisa dipakai di
            demo.
          </p>
        )}
      </section>
    </div>
  );
}
