import { useEffect, useState } from 'react';
import { useMotionDialog } from '../lib/motion';
import { MotionLoadingText } from './Motion';
import { transactionHistory, type Revision } from '../lib/transaction-revisions';
import { money } from '../domain/finance';
import type { Snapshot, Transaction } from '../domain/types';
import { Icon } from './Icon';
import { TransactionAttachments } from './TransactionAttachments';

export function TransactionHistory({
  tx,
  data,
  hide,
  onClose,
}: {
  tx: Transaction;
  data: Snapshot;
  hide: boolean;
  onClose: () => void;
}) {
  const { ref, close } = useMotionDialog(onClose);
  const [rows, setRows] = useState<Revision[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    transactionHistory(tx.id)
      .then((r) => {
        if (live) setRows(r);
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [tx.id]);
  const fields = [
    'type',
    'amount',
    'wallet_id',
    'destination_wallet_id',
    'transaction_actor',
    'transaction_scope',
    'scope_member_id',
    'status',
    'occurred_at',
    'category_id',
    'merchant',
    'notes',
  ] as const;
  const labels: Record<string, string> = {
    type: 'Jenis',
    amount: 'Nominal',
    wallet_id: 'Dompet sumber',
    destination_wallet_id: 'Dompet tujuan',
    transaction_actor: 'Pelaku',
    transaction_scope: 'Lingkup',
    scope_member_id: 'Penerima manfaat',
    status: 'Status',
    occurred_at: 'Tanggal',
    category_id: 'Kategori',
    merchant: 'Keterangan',
    notes: 'Catatan',
  };
  function value(field: string, v: unknown): string {
    if (v == null || v === '') return 'Kosong';
    if (field === 'amount') return money(Number(v), hide);
    if (field.includes('wallet')) return data.wallets.find((w) => w.id === v)?.name ?? String(v);
    if (field === 'transaction_actor' || field === 'scope_member_id')
      return data.members.find((m) => m.user_id === v)?.display_name ?? String(v);
    if (field === 'category_id') return data.categories.find((c) => c.id === v)?.name ?? String(v);
    if (field === 'occurred_at')
      return new Date(String(v)).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    return (
      (
        {
          expense: 'Pengeluaran',
          income: 'Pemasukan',
          transfer: 'Transfer',
          family: 'Keluarga',
          personal: 'Personal',
          pending: 'Pending',
          completed: 'Selesai',
          cancelled: 'Dibatalkan',
        } as Record<string, string>
      )[String(v)] ?? String(v)
    );
  }
  return (
    <dialog
      ref={ref}
      aria-labelledby="history-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="modal-head">
        <h2 id="history-title">Riwayat perubahan</h2>
        <button
          aria-label="Tutup riwayat"
          onClick={() => {
            close();
          }}
        >
          <Icon name="close" />
        </button>
      </div>
      <p>{tx.merchant || 'Transaksi'} · Menampilkan maksimal 100 revisi terbaru.</p>
      <TransactionAttachments transaction={tx.id} hide={hide} />
      {loading && (
        <p role="status">
          <MotionLoadingText text="Memuat riwayat…" />
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!loading && !error && !rows.length && <p>Belum ada revisi transaksi.</p>}
      {rows.map((r) => (
        <article className="revision-item" key={r.id}>
          <h3>Versi {r.resulting_version}</h3>
          <small>
            {data.members.find((m) => m.user_id === r.actor_id)?.display_name ?? 'Anggota'} ·{' '}
            {new Date(r.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
          </small>
          <dl>
            {fields
              .filter((f) => r.before_snapshot.transaction[f] !== r.after_snapshot.transaction[f])
              .map((f) => (
                <div key={f}>
                  <dt>{labels[f]}</dt>
                  <dd>
                    {value(f, r.before_snapshot.transaction[f])} <Icon name="arrowRight" />{' '}
                    {value(f, r.after_snapshot.transaction[f])}
                  </dd>
                </div>
              ))}
            <div>
              <dt>Biaya admin</dt>
              <dd>
                {money(
                  r.before_snapshot.fees.reduce((n, t) => n + Number(t.amount), 0),
                  hide,
                )}{' '}
                <Icon name="arrowRight" />{' '}
                {money(
                  r.after_snapshot.fees.reduce((n, t) => n + Number(t.amount), 0),
                  hide,
                )}
              </dd>
            </div>
            <div>
              <dt>Tag</dt>
              <dd>
                {(r.before_snapshot.tags ?? [])
                  .map((t) => data.tags.find((tag) => tag.id === t.tag_id)?.name ?? 'Tag dihapus')
                  .join(', ') || 'Tanpa tag'}{' '}
                <Icon name="arrowRight" />{' '}
                {(r.after_snapshot.tags ?? [])
                  .map((t) => data.tags.find((tag) => tag.id === t.tag_id)?.name ?? 'Tag dihapus')
                  .join(', ') || 'Tanpa tag'}
              </dd>
            </div>
            <div>
              <dt>Split kategori</dt>
              <dd>
                {r.after_snapshot.splits.length
                  ? r.after_snapshot.splits
                      .map(
                        (s) =>
                          `${data.categories.find((c) => c.id === s.category_id)?.name ?? 'Kategori'}: ${money(Number(s.amount), hide)}`,
                      )
                      .join(', ')
                  : 'Tanpa split'}
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </dialog>
  );
}
