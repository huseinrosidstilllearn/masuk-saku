import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Member } from '../domain/types';
const actions: Record<string, string> = {
  insert: 'Ditambahkan',
  update: 'Diperbarui',
  delete: 'Dihapus',
  trash: 'Dipindahkan ke sampah',
  restore: 'Dipulihkan',
  period_closed: 'Periode anggaran ditutup',
  snapshot_imported: 'Data diimpor',
};
const entities: Record<string, string> = {
  wallet: 'Dompet',
  wallets: 'Dompet',
  transaction: 'Transaksi',
  transactions: 'Transaksi',
  budget: 'Anggaran',
  budgets: 'Anggaran',
  household: 'Keluarga',
  categories: 'Kategori',
  tags: 'Tag',
  goal_contributions: 'Kontribusi tabungan',
  savings_goals: 'Target tabungan',
};
export function Activity({
  household,
  members,
  hide,
}: {
  household: string;
  members: Member[];
  hide: boolean;
}) {
  const [rows, setRows] = useState<
      {
        id: number;
        actor_id: string | null;
        entity_type: string;
        action: string;
        created_at: string;
      }[]
    >([]),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    if (supabase)
      supabase
        .from('activity_log')
        .select('id,actor_id,entity_type,action,created_at')
        .eq('household_id', household)
        .order('created_at', { ascending: false })
        .limit(100)
        .then(({ data, error }) => {
          if (live) {
            if (error) setError('Aktivitas belum dapat dimuat.');
            else setRows(data ?? []);
          }
        });
    return () => {
      live = false;
    };
  }, [household]);
  return (
    <section className="panel">
      <h2>Aktivitas keluarga</h2>
      <p>100 aktivitas terbaru. Nominal dan isi transaksi tidak ditampilkan di sini.</p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!rows.length && <p>Belum ada aktivitas untuk ditampilkan.</p>}
      {rows.map((r) => (
        <article className="recurring-row" key={r.id}>
          <span>
            {entities[r.entity_type] ?? 'Data keuangan'} · {actions[r.action] ?? 'Diperbarui'}
            {!hide &&
              ' · ' + (members.find((m) => m.user_id === r.actor_id)?.display_name ?? 'Sistem')}
          </span>
          <time>
            {new Date(r.created_at).toLocaleString('id-ID', {
              timeZone: 'Asia/Jakarta',
              hour12: false,
            })}{' '}
            WIB
          </time>
        </article>
      ))}
    </section>
  );
}
