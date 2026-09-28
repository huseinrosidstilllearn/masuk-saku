import { useState } from 'react';
import type { Snapshot, Wallet } from '../domain/types';
import { balances, money } from '../domain/finance';
import { parseOpeningBalance, validateWallet, walletIcons } from '../domain/wallets';
import { saveWallet } from '../lib/wallet-repository';
import { EditorDialog } from './Planning';
import { Icon, type IconName } from './Icon';

type Props = {
  data: Snapshot;
  owner: string;
  hide: boolean;
  role: string;
  onSaved: (text: string) => Promise<void>;
};
export function WalletManager({ data, owner, hide, role, onSaved }: Props) {
  const [edit, setEdit] = useState<Wallet | 'new' | null>(null);
  const [archived, setArchived] = useState(false);
  const values = balances(data.wallets, data.transactions);
  const rows = data.wallets.filter(
    (wallet) => wallet.active !== archived && (owner === 'family' || wallet.wallet_owner === owner),
  );
  return (
    <section className="wallet-manager">
      <div className="panel-heading">
        <div>
          <h2>Dompet keluarga</h2>
          <p>Saldo berasal dari saldo awal dan transaksi tercatat.</p>
        </div>
        {role === 'owner' && (
          <button className="primary" onClick={() => setEdit('new')}>
            <Icon name="plus" /> Tambah dompet
          </button>
        )}
      </div>
      <div className="filter-bar" role="group" aria-label="Status dompet">
        <button aria-pressed={!archived} onClick={() => setArchived(false)}>
          Aktif
        </button>
        <button aria-pressed={archived} onClick={() => setArchived(true)}>
          Diarsipkan
        </button>
      </div>
      <div className="wallet-grid">
        {rows.map((wallet) => (
          <article className="wallet-card" key={wallet.id}>
            <span className="wallet-symbol" style={{ color: wallet.color ?? '#164c3e' }}>
              <Icon
                name={
                  walletIcons.includes(wallet.icon as (typeof walletIcons)[number])
                    ? (wallet.icon as IconName)
                    : wallet.type === 'bank'
                      ? 'bank'
                      : 'wallet'
                }
              />
            </span>
            <span className="badge">
              {wallet.ownership === 'shared'
                ? 'Bersama'
                : data.members.find((m) => m.user_id === wallet.wallet_owner)?.display_name}
            </span>
            <h3>{wallet.name}</h3>
            <p>{money(values[wallet.id], hide)}</p>
            <small>
              {wallet.type === 'bank' ? 'Bank' : wallet.type === 'cash' ? 'Uang tunai' : 'E-wallet'}{' '}
              · IDR{archived ? ' · Diarsipkan' : ''}
            </small>
            {wallet.account_identifier && (
              <small className="wallet-identifier">
                {hide ? 'Identitas disembunyikan' : wallet.account_identifier}
              </small>
            )}
            {role === 'owner' && (
              <button
                className="wallet-edit"
                onClick={() => setEdit(wallet)}
                aria-label={`Edit dompet ${wallet.name}`}
              >
                <Icon name="edit" /> Kelola dompet
              </button>
            )}
          </article>
        ))}
      </div>
      {!rows.length && (
        <div className="empty empty-panel">
          <Icon name="wallet" />
          <strong>
            {archived ? 'Belum ada dompet diarsipkan.' : 'Belum ada dompet aktif di lingkup ini.'}
          </strong>
        </div>
      )}
      {archived && (
        <p className="review-note">
          Dompet arsip dan riwayatnya tetap tersimpan, tetapi saldonya tidak masuk total dompet
          aktif. Aktifkan kembali untuk memakainya.
        </p>
      )}
      {edit && (
        <WalletEditor
          key={edit === 'new' ? 'new' : edit.id}
          data={data}
          original={edit === 'new' ? undefined : edit}
          onSaved={onSaved}
          onClose={() => setEdit(null)}
        />
      )}
    </section>
  );
}
function WalletEditor({
  data,
  original,
  onSaved,
  onClose,
}: {
  data: Snapshot;
  original?: Wallet;
  onSaved: Props['onSaved'];
  onClose: () => void;
}) {
  const [wallet, setWallet] = useState<Wallet>(() =>
    original
      ? { ...original }
      : {
          id: crypto.randomUUID(),
          household_id: data.household.id,
          name: '',
          type: 'bank',
          ownership: 'shared',
          wallet_owner: null,
          initial_balance: 0,
          active: true,
          icon: 'wallet',
          color: '#d85956',
          account_identifier: null,
        },
  );
  const [amount, setAmount] = useState(String(wallet.initial_balance));
  const memberOptions = data.members.filter(
    (m) => m.active !== false || m.user_id === original?.wallet_owner,
  );
  const set = (change: Partial<Wallet>) => setWallet((old) => ({ ...old, ...change }));
  return (
    <EditorDialog
      title={original ? 'Edit dompet' : 'Tambah dompet'}
      onClose={onClose}
      submitLabel="Konfirmasi & simpan"
      note="Perubahan saldo awal, pemilik, atau status aktif akan mengubah ringkasan keuangan. Riwayat transaksi tetap utuh."
      onSave={async () => {
        const input = { ...wallet, initial_balance: parseOpeningBalance(amount) };
        validateWallet(
          input,
          input.wallet_owner === original?.wallet_owner ? undefined : data.members,
        );
        await saveWallet(input, original);
        await onSaved(original ? 'Dompet diperbarui.' : 'Dompet ditambahkan.');
      }}
    >
      <div className="form-grid">
        <label>
          Nama dompet
          <input
            autoFocus
            required
            maxLength={100}
            value={wallet.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </label>
        <label>
          Jenis
          <select
            value={wallet.type}
            onChange={(e) => set({ type: e.target.value as Wallet['type'] })}
          >
            <option value="bank">Bank</option>
            <option value="cash">Uang tunai</option>
            <option value="e_wallet">E-wallet</option>
          </select>
        </label>
        <label>
          Pemilik
          <select
            value={wallet.wallet_owner ?? 'shared'}
            onChange={(e) =>
              set({
                ownership: e.target.value === 'shared' ? 'shared' : 'personal',
                wallet_owner: e.target.value === 'shared' ? null : e.target.value,
              })
            }
          >
            <option value="shared">Keluarga / bersama</option>
            {memberOptions.map((m) => (
              <option key={m.user_id} value={m.user_id} disabled={m.active === false}>
                {m.display_name}
                {m.active === false ? ' (tidak aktif)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          Saldo awal (rupiah)
          <input
            inputMode="text"
            pattern="-?[0-9]+"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <small>Boleh nol atau negatif. Ini saldo awal, bukan saldo terkini.</small>
        </label>
        <label>
          Ikon
          <select value={wallet.icon ?? 'wallet'} onChange={(e) => set({ icon: e.target.value })}>
            {walletIcons.map((icon, index) => (
              <option key={icon} value={icon}>
                {['Dompet', 'Bank', 'Pemasukan', 'Pengeluaran', 'Tabungan'][index]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Warna
          <input
            type="color"
            value={wallet.color ?? '#164c3e'}
            onChange={(e) => set({ color: e.target.value })}
          />
        </label>
        <label>
          Identitas rekening (opsional)
          <input
            maxLength={60}
            value={wallet.account_identifier ?? ''}
            placeholder="Contoh: rekening berakhir 1234"
            onChange={(e) => set({ account_identifier: e.target.value })}
          />
          <small>Terlihat oleh anggota keluarga. Jangan isi PIN atau password.</small>
        </label>
        <label>
          Status
          <select
            value={wallet.active ? 'active' : 'archived'}
            onChange={(e) => set({ active: e.target.value === 'active' })}
          >
            <option value="active">Aktif</option>
            <option value="archived">Arsipkan</option>
          </select>
          <small>Arsip menghentikan pemakaian baru, tidak menghapus riwayat.</small>
        </label>
      </div>
    </EditorDialog>
  );
}
