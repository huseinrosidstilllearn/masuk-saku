import type { Snapshot } from '../domain/types';
import { Icon } from './Icon';

export function FamilyOverview({
  data,
  balance,
  fmt,
  owner,
  onSelect,
  isOwner,
  onInvite,
  onManage,
}: {
  data: Snapshot;
  balance: Record<string, number>;
  fmt: (amount: number) => string;
  owner: string;
  onSelect: (owner: string) => void;
  isOwner: boolean;
  onInvite: () => void;
  onManage: () => void;
}) {
  const activeWallets = data.wallets.filter((wallet) => wallet.active);
  const shared = activeWallets.filter((wallet) => wallet.ownership === 'shared');
  return (
    <section className="panel family-overview" aria-labelledby="family-overview-title">
      <div className="section-heading">
        <div>
          <h2 id="family-overview-title">Keuangan keluarga</h2>
          <p>Saldo tiap anggota, dalam satu tempat.</p>
        </div>
        {isOwner && (
          <button onClick={onInvite}>
            <Icon name="plus" />
            Tambah anggota
          </button>
        )}
      </div>
      <div className="family-balance-grid">
        {data.members.map((member) => {
          const wallets = activeWallets.filter(
            (wallet) => wallet.ownership === 'personal' && wallet.wallet_owner === member.user_id,
          );
          return (
            <button
              className="family-balance-card"
              key={member.user_id}
              aria-pressed={owner === member.user_id}
              onClick={() => onSelect(member.user_id)}
            >
              <span className="family-member-name">
                <Icon name="user" />
                {member.display_name}
              </span>
              <strong>{fmt(wallets.reduce((sum, wallet) => sum + balance[wallet.id], 0))}</strong>
              <small>
                {member.active === false ? 'Akses nonaktif · ' : ''}
                {wallets.length} dompet pribadi
              </small>
              <span className="family-card-link">
                Lihat dashboard
                <Icon name="arrowRight" />
              </span>
            </button>
          );
        })}
        <button
          className="family-balance-card family-shared-card"
          aria-pressed={owner === 'family'}
          onClick={() => onSelect('family')}
        >
          <span className="family-member-name">
            <Icon name="wallet" />
            Dompet bersama
          </span>
          <strong>{fmt(shared.reduce((sum, wallet) => sum + balance[wallet.id], 0))}</strong>
          <small>{shared.length} dompet bersama · Di luar saldo pribadi</small>
          <span className="family-card-link">
            Lihat seluruh keluarga
            <Icon name="arrowRight" />
          </span>
        </button>
      </div>
      <div className="family-overview-footer">
        <p>
          Saldo berdasarkan transaksi yang dicatat di Masuk Saku, bukan sinkronisasi bank. Dompet
          bersama dihitung sekali dalam total keluarga.
        </p>
        <button onClick={onManage}>
          Kelola anggota
          <Icon name="chevronRight" />
        </button>
      </div>
      {data.members.filter((member) => member.active !== false).length === 1 && (
        <p>Belum ada anggota lain. Undang keluarga, lalu tetapkan pemilik dompet masing-masing.</p>
      )}
    </section>
  );
}
