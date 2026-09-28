import { useState } from 'react';
import type { Snapshot } from '../domain/types';
import { previewImport } from '../domain/import';
import { supabase } from '../lib/supabase';
import { EditorDialog } from './Planning';
import { Icon } from './Icon';
export function ImportData({
  data,
  user,
  onSaved,
}: {
  data: Snapshot;
  user: string;
  onSaved: () => Promise<void>;
}) {
  const [source, setSource] = useState<Snapshot | null>(null),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [error, setError] = useState('');
  const [key, setKey] = useState('');
  return (
    <section className="panel">
      <h3>Impor data JSON</h3>
      <p>
        Tambahkan data dari ekspor Masuk Saku. Data yang sudah ada tetap utuh. Periksa pemetaan
        anggota sebelum menyimpan.
      </p>
      <label className="file-pick">
        <Icon name="upload" /> Pilih ekspor JSON
        <input
          type="file"
          accept="application/json,.json"
          onChange={async (event) => {
            setError('');
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            try {
              if (file.size > 5 * 1024 * 1024) throw new Error('Maksimal 5 MB.');
              const imported = previewImport(JSON.parse(await file.text()));
              setSource(imported);
              setMapping(
                Object.fromEntries(
                  imported.members.map((m) => [
                    m.user_id,
                    data.members.some((c) => c.user_id === m.user_id && c.active !== false)
                      ? m.user_id
                      : user,
                  ]),
                ),
              );
              setKey(crypto.randomUUID());
            } catch {
              setError(
                'File belum valid. Gunakan ekspor JSON versi 1; maksimal 500 transaksi utama dan 1.000 baris per jenis.',
              );
            }
          }}
        />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {source && (
        <EditorDialog
          title="Tinjau impor data"
          submitLabel="Konfirmasi dan tambahkan data"
          onClose={() => setSource(null)}
          onSave={async () => {
            if (!supabase)
              throw new Error('Impor data pribadi hanya tersedia pada akun yang masuk.');
            const result = await supabase.rpc('import_household_snapshot', {
              p_household: data.household.id,
              p_data: source,
              p_members: mapping,
              p_request_key: key,
            });
            if (result.error) throw new Error('Impor belum disimpan: ' + result.error.message);
            await onSaved();
          }}
        >
          <p>
            {source.wallets.length} dompet ·{' '}
            {source.transactions.filter((t) => !t.deleted_at && !t.parent_transaction_id).length}{' '}
            transaksi utama · {source.budgets.length} anggaran · {source.goals.length} target.
          </p>
          <p className="review-note">
            ID baru dibuat untuk seluruh data. Transaksi sampah, berkas, audit, profil dan jadwal
            berulang tidak diimpor. Anggaran menjadi rencana baru tanpa sisa bawaan. Akun anggota
            tidak dibuat atau dipindahkan. Pembuat transaksi impor adalah akunmu.
          </p>
          {source.members.map((m) => (
            <label key={m.user_id}>
              Anggota asal: {m.display_name}
              <select
                value={mapping[m.user_id]}
                onChange={(e) => setMapping({ ...mapping, [m.user_id]: e.target.value })}
              >
                {data.members
                  .filter((c) => c.active !== false)
                  .map((c) => (
                    <option key={c.user_id} value={c.user_id}>
                      {c.display_name}
                    </option>
                  ))}
              </select>
            </label>
          ))}
          <p>
            Impor yang sama dengan permintaan ini aman dicoba kembali. Memilih file lagi membuat
            impor baru; hindari memasukkan ekspor yang sama dua kali.
          </p>
        </EditorDialog>
      )}
    </section>
  );
}
