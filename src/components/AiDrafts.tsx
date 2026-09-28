import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { parseCapturePreview, type CapturePreview } from '../lib/receipt-capture';
import { money } from '../domain/finance';
import { EditorDialog } from './Planning';
export function AiDrafts({
  household,
  hide,
  onResume,
}: {
  household: string;
  hide: boolean;
  onResume: (preview: CapturePreview) => void;
}) {
  const [rows, setRows] = useState<(CapturePreview & { created_at: string; expires_at: string })[]>(
      [],
    ),
    [error, setError] = useState(''),
    [discard, setDiscard] = useState<string | null>(null),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    if (!supabase) return;
    supabase
      .from('ai_drafts')
      .select('id,candidate,confidence,created_at,expires_at')
      .eq('household_id', household)
      .eq('status', 'preview')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!live) return;
        if (error) {
          setError('Draf belum dapat dimuat.');
          return;
        }
        try {
          setRows(
            (data ?? []).map((r) => ({
              ...parseCapturePreview({ ...r, draft_id: r.id }),
              created_at: r.created_at,
              expires_at: r.expires_at,
            })),
          );
        } catch {
          setError('Draf tidak valid.');
        }
      });
    return () => {
      live = false;
    };
  }, [household, revision]);
  return (
    <section className="panel">
      <h2>Draf AI saya</h2>
      <p>
        Hasil pembacaan belum memengaruhi saldo. Draf hanya terlihat oleh pembuatnya dan berlaku 24
        jam.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!rows.length && <p>Belum ada draf yang menunggu konfirmasi.</p>}
      {rows.map((r) => (
        <article className="recurring-row" key={r.draft_id}>
          <div>
            <strong>{r.candidate.merchant || 'Draf transaksi'}</strong>
            <p>
              {r.candidate.amount ? money(r.candidate.amount, hide) : 'Nominal perlu diperiksa'} ·{' '}
              {new Date(r.created_at).toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                hour12: false,
              })}{' '}
              WIB
            </p>
          </div>
          <div className="row-actions">
            <button onClick={() => onResume(r)}>Lanjutkan tinjauan</button>
            <button onClick={() => setDiscard(r.draft_id)}>Buang draf</button>
          </div>
        </article>
      ))}
      {discard && (
        <EditorDialog
          title="Buang draf ini?"
          submitLabel="Buang draf"
          onClose={() => setDiscard(null)}
          onSave={async () => {
            const result = await supabase!.rpc('discard_ai_draft', { p_id: discard });
            if (result.error) throw new Error('Draf belum dapat dibuang.');
            setRevision((n) => n + 1);
          }}
        >
          <p>Saldo tidak berubah. Lampiran yang belum dikonfirmasi dijadwalkan untuk dihapus.</p>
        </EditorDialog>
      )}
    </section>
  );
}
