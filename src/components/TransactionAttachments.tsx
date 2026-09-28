import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
export function TransactionAttachments({
  transaction,
  hide,
}: {
  transaction: string;
  hide: boolean;
}) {
  const [rows, setRows] = useState<
      { id: string; object_path: string; mime_type: string; expires_at: string | null }[]
    >([]),
    [url, setUrl] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    if (!supabase) return;
    supabase
      .from('attachments')
      .select('id,object_path,mime_type,expires_at')
      .eq('transaction_id', transaction)
      .is('removed_at', null)
      .then(({ data, error }) => {
        if (live) {
          if (error) setError('Lampiran belum dapat dimuat.');
          else
            setRows(
              (data ?? []).filter((r) => !r.expires_at || new Date(r.expires_at) > new Date()),
            );
        }
      });
    return () => {
      live = false;
    };
  }, [transaction]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  useEffect(() => {
    if (hide) setUrl('');
  }, [hide]);
  return (
    <section>
      <h3>Lampiran transaksi</h3>
      {!rows.length && (
        <p>Tidak ada lampiran aktif. Masa penyimpanan dapat berakhir tanpa menghapus transaksi.</p>
      )}
      {rows.map((r) => (
        <button
          key={r.id}
          disabled={hide || busy}
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              const result = await supabase!.storage.from('receipts').download(r.object_path);
              if (result.error || !result.data) throw new Error();
              setUrl(URL.createObjectURL(result.data));
            } catch {
              setError('Lampiran tidak tersedia atau akses berakhir.');
            } finally {
              setBusy(false);
            }
          }}
        >
          Lihat bukti transaksi
        </button>
      ))}
      {hide && rows.length > 0 && <p>Lampiran disembunyikan bersama nominal.</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {url && !hide && (
        <div className="receipt-preview">
          <img src={url} alt="Bukti transaksi privat" />
          <button onClick={() => setUrl('')}>Tutup lampiran</button>
        </div>
      )}
    </section>
  );
}
