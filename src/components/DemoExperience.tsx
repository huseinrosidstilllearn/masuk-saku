import { useState } from 'react';
import { loadDemo, demoUser } from '../lib/demo';
import { balances, budgetSpent, dashboard, money, monthInJakarta } from '../domain/finance';
import type { Snapshot, Transaction, TransactionInput } from '../domain/types';
import { CashflowChart } from './CashflowChart';
import { TransactionForm } from './TransactionForm';
import { Icon } from './Icon';

type Tab = 'dashboard' | 'wallets' | 'transactions' | 'budgets';
function withExampleTransaction(current: Snapshot, input: TransactionInput): Snapshot {
  const { fee_amount, splits = [], tag_ids = [], ...fields } = input;
  const id = crypto.randomUUID();
  const main: Transaction = {
    ...fields,
    id,
    household_id: current.household.id,
    created_by: demoUser,
    deleted_at: null,
  };
  const fee: Transaction[] =
    fee_amount > 0
      ? [
          {
            ...main,
            id: `${id}-fee`,
            type: 'expense',
            amount: fee_amount,
            destination_wallet_id: null,
            category_id: 'admin',
            merchant: 'Biaya admin',
            parent_transaction_id: id,
          },
        ]
      : [];
  return {
    ...current,
    transactions: [main, ...fee, ...current.transactions],
    splits: [...current.splits, ...splits.map((split) => ({ ...split, transaction_id: id }))],
    transactionTags: [
      ...current.transactionTags,
      ...tag_ids.map((tag_id) => ({ transaction_id: id, tag_id })),
    ],
  };
}

export function DemoExperience({
  onLeave,
  onSignup,
}: {
  onLeave: () => void;
  onSignup: () => void;
}) {
  const [data, setData] = useState<Snapshot>(() => loadDemo());
  const [owner, setOwner] = useState('family');
  const [hide, setHide] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [draft, setDraft] = useState<Partial<TransactionInput> | null>(null);
  const [notice, setNotice] = useState('');
  const month = monthInJakarta(new Date().toISOString());
  const summary = dashboard(data.wallets, data.transactions, owner, month);
  const walletBalances = balances(data.wallets, data.transactions);
  const walletIds = new Set(summary.wallets.map((wallet) => wallet.id));
  const transactions = data.transactions.filter(
    (row) => !row.deleted_at && row.status === 'completed' && walletIds.has(row.wallet_id),
  );
  const totalBudget = data.budgets.reduce(
    (sum, budget) => sum + budget.amount + budget.rollover_amount,
    0,
  );
  const usedBudget = data.budgets.reduce(
    (sum, budget) => sum + budgetSpent(budget, data.transactions, data.splits),
    0,
  );
  const tabNames: {
    id: Tab;
    name: string;
    icon: 'dashboard' | 'wallet' | 'transfer' | 'budget';
  }[] = [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard' },
    { id: 'wallets', name: 'Dompet', icon: 'wallet' },
    { id: 'transactions', name: 'Transaksi', icon: 'transfer' },
    { id: 'budgets', name: 'Anggaran', icon: 'budget' },
  ];
  return (
    <main className="demo-experience">
      <header className="demo-header">
        <a
          className="brand"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            onLeave();
          }}
        >
          <span className="brand-mark">
            <Icon name="wallet" />
          </span>
          <span>masuk saku</span>
        </a>
        <span className="demo-badge">DEMO INTERAKTIF</span>
        <button onClick={onLeave}>Kembali ke beranda</button>
      </header>
      <div className="demo-layout">
        <aside className="demo-sidebar">
          <span>Jelajahi contoh</span>
          <nav aria-label="Navigasi demo">
            {tabNames.map((item) => (
              <button
                key={item.id}
                aria-current={tab === item.id ? 'page' : undefined}
                onClick={() => setTab(item.id)}
              >
                <Icon name={item.icon} />
                {item.name}
              </button>
            ))}
          </nav>
          <p>Semua angka dan nama di sini adalah contoh.</p>
        </aside>
        <div className="demo-main">
          <div className="demo-intro">
            <span className="eyebrow">COBA MASUK SAKU</span>
            <h1>{tabNames.find((item) => item.id === tab)?.name} keluarga contoh</h1>
            <p>
              Jelajahi catatan keluarga, pilih anggota, lalu coba catat transaksi tanpa membuat
              akun.
            </p>
          </div>
          <div className="demo-safety">
            <Icon name="lock" />
            <p>
              Simulasi lokal dengan data fiktif. Tidak memakai akun atau database Masuk Saku.
              Perubahan hilang saat kamu meninggalkan demo atau memuat ulang halaman. Foto struk dan
              AI tersedia setelah masuk dengan API key milikmu.
            </p>
          </div>
          <div className="demo-toolbar">
            <label>
              Lingkup tampilan
              <select value={owner} onChange={(event) => setOwner(event.target.value)}>
                <option value="family">Seluruh keluarga</option>
                {data.members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.display_name}
                  </option>
                ))}
              </select>
            </label>
            <button
              aria-label={hide ? 'Tampilkan saldo demo' : 'Sembunyikan saldo demo'}
              onClick={() => setHide(!hide)}
            >
              <Icon name={hide ? 'eyeOff' : 'eye'} />
              {hide ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            </button>
            <button
              className="demo-reset"
              onClick={() => {
                setData(loadDemo());
                setNotice('Demo kembali ke data awal.');
              }}
            >
              Reset contoh
            </button>
          </div>
          {notice && (
            <p className="demo-notice" role="status">
              {notice}
            </p>
          )}
          {tab === 'dashboard' && (
            <>
              <div className="demo-stats">
                <article className="demo-stat-primary">
                  <span>Total saldo tercatat</span>
                  <strong>{money(summary.balance, hide)}</strong>
                  <small>{summary.wallets.length} dompet dalam lingkup ini</small>
                </article>
                <article>
                  <span>Pemasukan bulan ini</span>
                  <strong>{money(summary.income, hide)}</strong>
                </article>
                <article>
                  <span>Pengeluaran bulan ini</span>
                  <strong>{money(summary.expense, hide)}</strong>
                </article>
              </div>
              <section className="demo-panel">
                <h2>Arus uang bulan ini</h2>
                <CashflowChart rows={summary.rows} month={month} hide={hide} />
              </section>
              <section className="demo-panel">
                <h2>Keuangan tiap anggota</h2>
                <div className="demo-member-grid">
                  {data.members.map((member) => {
                    const own = data.wallets.filter(
                      (wallet) => wallet.active && wallet.wallet_owner === member.user_id,
                    );
                    return (
                      <button key={member.user_id} onClick={() => setOwner(member.user_id)}>
                        <Icon name="user" />
                        <span>{member.display_name}</span>
                        <strong>
                          {money(
                            own.reduce((sum, wallet) => sum + walletBalances[wallet.id], 0),
                            hide,
                          )}
                        </strong>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}
          {tab === 'wallets' && (
            <section className="demo-panel">
              <h2>Dompet tercatat</h2>
              <div className="demo-list">
                {summary.wallets.map((wallet) => (
                  <div key={wallet.id}>
                    <span>
                      <Icon name={wallet.type === 'bank' ? 'bank' : 'wallet'} />
                      <span>
                        <strong>{wallet.name}</strong>
                        <small>
                          {wallet.ownership === 'shared'
                            ? 'Bersama'
                            : data.members.find((member) => member.user_id === wallet.wallet_owner)
                                ?.display_name}
                        </small>
                      </span>
                    </span>
                    <strong>{money(walletBalances[wallet.id], hide)}</strong>
                  </div>
                ))}
              </div>
            </section>
          )}
          {tab === 'transactions' && (
            <section className="demo-panel">
              <h2>Transaksi tercatat</h2>
              <div className="demo-list">
                {transactions.slice(0, 12).map((row) => (
                  <div key={row.id}>
                    <span>
                      <Icon
                        name={
                          row.type === 'income'
                            ? 'income'
                            : row.type === 'expense'
                              ? 'expense'
                              : 'transfer'
                        }
                      />
                      <span>
                        <strong>
                          {row.merchant || (row.type === 'transfer' ? 'Transfer' : 'Transaksi')}
                        </strong>
                        <small>
                          {data.wallets.find((wallet) => wallet.id === row.wallet_id)?.name} ·{' '}
                          {new Date(row.occurred_at).toLocaleDateString('id-ID', {
                            timeZone: 'Asia/Jakarta',
                          })}
                        </small>
                      </span>
                    </span>
                    <strong>{money(row.amount, hide)}</strong>
                  </div>
                ))}
              </div>
            </section>
          )}
          {tab === 'budgets' && (
            <section className="demo-panel">
              <h2>Anggaran keluarga</h2>
              <p>
                Alokasi {money(totalBudget, hide)} · Terpakai {money(usedBudget, hide)}
              </p>
              <div className="demo-list">
                {data.budgets.map((budget) => (
                  <div key={budget.id}>
                    <span>
                      <Icon name="budget" />
                      <strong>{budget.name}</strong>
                    </span>
                    <strong>
                      {money(
                        budget.amount +
                          budget.rollover_amount -
                          budgetSpent(budget, data.transactions, data.splits),
                        hide,
                      )}{' '}
                      tersisa
                    </strong>
                  </div>
                ))}
              </div>
              <p>
                Anggaran membantu memberi batas, tidak memblokir transaksi yang benar-benar terjadi.
              </p>
            </section>
          )}
          <section className="demo-try">
            <div>
              <h2>Coba catat transaksi contoh</h2>
              <p>
                Form yang sama seperti aplikasi utama. Periksa isinya, lalu simpan untuk melihat
                saldo dan daftar transaksi berubah.
              </p>
            </div>
            <button
              className="primary"
              onClick={() => {
                setDraft({
                  type: 'expense',
                  wallet_id: summary.wallets[0]?.id,
                  transaction_actor: demoUser,
                });
                setNotice('');
              }}
            >
              <Icon name="plus" />
              Tambah transaksi
            </button>
          </section>
          <section className="demo-next">
            <h2>Siap mencatat uangmu sendiri?</h2>
            <p>
              Buat akun untuk menyimpan data sungguhan, mengundang anggota, dan mengatur AI milikmu.
              Demo ini tidak memindahkan datanya ke akun.
            </p>
            <button onClick={onSignup}>
              Buat akun
              <Icon name="arrowRight" />
            </button>
          </section>
        </div>
      </div>
      {draft && (
        <TransactionForm
          data={data}
          user={demoUser}
          initial={draft}
          onClose={() => setDraft(null)}
          onSave={async (input) => {
            setData((current) => withExampleTransaction(current, input));
            setNotice('Transaksi contoh tersimpan hanya di demo.');
          }}
        />
      )}
    </main>
  );
}
