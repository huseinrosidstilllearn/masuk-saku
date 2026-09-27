import { useEffect, useState } from 'react';
import { useMotionDialog } from '../lib/motion';
import { confidenceWarning, parseMoney, validateTransaction } from '../domain/finance';
import type { Snapshot, TransactionInput } from '../domain/types';
import { Icon } from './Icon';
import { DateTimeField } from './DateTimeField';
import { toWibInstant, wibDateTime } from '../domain/date-time';
const confidenceLabels: Record<string, string> = {
  amount: 'Nominal',
  wallet_id: 'Dompet sumber',
  destination_wallet_id: 'Dompet tujuan',
  occurred_at: 'Tanggal & waktu',
  type: 'Jenis transaksi',
  category_id: 'Kategori',
  merchant: 'Keterangan',
  transaction_actor: 'Pelaku',
  transaction_scope: 'Lingkup',
  scope_member_id: 'Penerima manfaat',
  status: 'Status',
  notes: 'Catatan',
  fee_amount: 'Biaya admin',
};
export function TransactionForm({
  data,
  user,
  initial,
  confidence = {},
  editing = false,
  receiptFile,
  hideReceipt = false,
  onSave,
  onClose,
}: {
  data: Snapshot;
  user: string;
  initial: Partial<TransactionInput>;
  editing?: boolean;
  receiptFile?: File;
  hideReceipt?: boolean;
  confidence?: Record<string, number | null>;
  onSave: (input: TransactionInput, ack: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const { ref, close, isClosing } = useMotionDialog(onClose);
  const [type, setType] = useState(initial.type ?? 'expense'),
    [amount, setAmount] = useState(String(initial.amount ?? '')),
    [wallet, setWallet] = useState(initial.wallet_id ?? data.wallets[0]?.id ?? ''),
    [dest, setDest] = useState(initial.destination_wallet_id ?? ''),
    [category, setCategory] = useState(initial.category_id ?? ''),
    [actor, setActor] = useState(initial.transaction_actor ?? user),
    [scope, setScope] = useState(initial.transaction_scope ?? 'family'),
    [scopeMember, setScopeMember] = useState(initial.scope_member_id ?? user),
    [status, setStatus] = useState(initial.status ?? 'completed'),
    [merchant, setMerchant] = useState(initial.merchant ?? ''),
    [notes, setNotes] = useState(initial.notes ?? ''),
    [fee, setFee] = useState(String(initial.fee_amount ?? 0)),
    [date, setDate] = useState(() => wibDateTime(initial.occurred_at)),
    [splits, setSplits] = useState(
      (initial.splits ?? []).map((s) => ({ ...s, amount: String(s.amount) })),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [ack, setAck] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState(initial.tag_ids ?? []);
  const [receiptUrl, setReceiptUrl] = useState('');
  useEffect(() => {
    if (!receiptFile) return;
    const url = URL.createObjectURL(receiptFile);
    setReceiptUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [receiptFile]);
  const low = Object.keys(confidence).filter(
    (k) => ['amount', 'wallet_id', 'occurred_at', 'type'].includes(k) && (confidence[k] ?? 0) < 0.7,
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || isClosing) return;
    setError('');
    try {
      const input: TransactionInput = {
        type,
        amount: parseMoney(amount),
        wallet_id: wallet,
        destination_wallet_id: type === 'transfer' ? dest : null,
        transaction_actor: actor,
        transaction_scope: scope,
        scope_member_id: scope === 'personal' ? scopeMember : null,
        status,
        occurred_at: toWibInstant(date),
        category_id: type === 'transfer' ? null : category || null,
        merchant,
        notes,
        tag_ids: tagIds,
        splits:
          type === 'transfer'
            ? []
            : splits.map((s) => ({ category_id: s.category_id, amount: parseMoney(s.amount) })),
        fee_amount: type === 'transfer' && fee !== '0' ? parseMoney(fee) : 0,
      };
      if (tagIds.length > 30) throw new Error('Maksimal 30 tag per transaksi.');
      validateTransaction(input, data.wallets, input.splits ?? []);
      if (new Set(input.splits?.map((s) => s.category_id)).size !== input.splits?.length)
        throw new Error('Kategori split tidak boleh berulang.');
      if (low.some((k) => !ack.includes(k)))
        throw new Error('Periksa dan centang semua informasi yang belum pasti.');
      setBusy(true);
      await onSave(input, ack);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) close();
      }}
      aria-labelledby="transaction-title"
    >
      <form onSubmit={submit}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">TINJAU SEBELUM MENYIMPAN</span>
            <h2 id="transaction-title">{editing ? 'Ubah transaksi' : 'Catat transaksi'}</h2>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => {
              close();
            }}
            disabled={busy}
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="review-note">
          <Icon name="check" /> Periksa detailnya. Saldo baru berubah setelah konfirmasi.
        </p>
        {receiptFile && (
          <div className="receipt-preview">
            {hideReceipt ? (
              <p>Pratinjau struk disembunyikan.</p>
            ) : (
              receiptUrl && <img src={receiptUrl} alt="Struk untuk diperiksa sebelum konfirmasi" />
            )}
            <p>Bandingkan detail transaksi dengan struk. Hasil AI bisa salah.</p>
          </div>
        )}
        <fieldset disabled={busy}>
          <fieldset className="transaction-section">
            <legend>Detail transaksi</legend>
            <div className="form-grid">
              <label>
                Jenis
                <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                  <option value="transfer">Transfer</option>
                </select>
              </label>
              <label className="amount-field">
                Nominal (rupiah)
                <input
                  inputMode="numeric"
                  pattern="[0-9]+"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label>
                Dompet sumber
                <select required value={wallet} onChange={(e) => setWallet(e.target.value)}>
                  <option value="">Pilih dompet</option>
                  {data.wallets
                    .filter((w) => w.active)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
              </label>
              {type === 'transfer' ? (
                <label>
                  Dompet tujuan
                  <select required value={dest} onChange={(e) => setDest(e.target.value)}>
                    <option value="">Pilih dompet</option>
                    {data.wallets
                      .filter((w) => w.active && w.id !== wallet)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                  </select>
                </label>
              ) : (
                <label>
                  Kategori
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Tanpa kategori</option>
                    {data.categories
                      .filter((c) => c.kind === type || c.kind === 'both')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <DateTimeField value={date} onChange={setDate} />
              <label>
                Status
                <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  <option value="completed">Selesai</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </label>
              {type === 'transfer' && (
                <label>
                  Biaya admin (rupiah)
                  <input
                    inputMode="numeric"
                    pattern="[0-9]+"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                  />
                </label>
              )}
            </div>
          </fieldset>
          {type !== 'transfer' && (
            <fieldset className="transaction-section">
              <legend>Split kategori</legend>
              <p className="field-help">
                Opsional. Jumlah seluruh split harus sama dengan nominal transaksi. Tag yang sudah
                ada tetap dipertahankan saat mengedit.
              </p>
              {splits.map((split, index) => (
                <div className="form-grid" key={index}>
                  <label>
                    Kategori split {index + 1}
                    <select
                      required
                      value={split.category_id}
                      onChange={(e) =>
                        setSplits(
                          splits.map((s, i) =>
                            i === index ? { ...s, category_id: e.target.value } : s,
                          ),
                        )
                      }
                    >
                      <option value="">Pilih kategori</option>
                      {data.categories
                        .filter((c) => c.kind === type || c.kind === 'both')
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Nominal split {index + 1}
                    <input
                      required
                      inputMode="numeric"
                      pattern="[0-9]+"
                      value={split.amount}
                      onChange={(e) =>
                        setSplits(
                          splits.map((s, i) =>
                            i === index ? { ...s, amount: e.target.value } : s,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setSplits(splits.filter((_, i) => i !== index))}
                  >
                    Hapus split {index + 1}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSplits([...splits, { category_id: '', amount: '' }])}
              >
                Tambah split
              </button>
            </fieldset>
          )}
          <fieldset className="transaction-section" aria-describedby="actor-scope-help">
            <legend>Pelaku & lingkup</legend>
            <p id="actor-scope-help" className="field-help">
              Pelaku bisa berbeda dari pemilik dompet. Lingkup menunjukkan transaksi ini untuk
              keluarga atau anggota tertentu.
            </p>
            <div className="form-grid">
              <label>
                Dilakukan oleh
                <select value={actor} onChange={(e) => setActor(e.target.value)}>
                  {data.members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.display_name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ruang lingkup
                <select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
                  <option value="family">Keluarga</option>
                  <option value="personal">Personal</option>
                </select>
              </label>
              {scope === 'personal' && (
                <label>
                  Untuk siapa
                  <select value={scopeMember} onChange={(e) => setScopeMember(e.target.value)}>
                    {data.members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.display_name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </fieldset>
          <fieldset className="transaction-section">
            <legend>Catatan tambahan</legend>
            <fieldset>
              <legend>Tag (opsional)</legend>
              {data.tags.map((tag) => (
                <label key={tag.id}>
                  <input
                    type="checkbox"
                    checked={tagIds.includes(tag.id)}
                    onChange={(e) =>
                      setTagIds((ids) =>
                        e.target.checked ? [...ids, tag.id] : ids.filter((id) => id !== tag.id),
                      )
                    }
                  />
                  {tag.name}
                </label>
              ))}
              {!data.tags.length && <p>Tambahkan tag melalui Pengaturan.</p>}
            </fieldset>
            <p className="field-help">
              Opsional. Tambahkan nama toko atau konteks agar mudah ditemukan nanti.
            </p>
            <label>
              Merchant / keterangan
              <input
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                maxLength={200}
              />
            </label>
            <label>
              Catatan
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
            </label>
          </fieldset>
          {Object.entries(confidence)
            .filter(([, score]) => confidenceWarning(score))
            .map(([field, score]) => (
              <div className="warning" key={field}>
                {confidenceLabels[field] ?? 'Detail transaksi'}: {confidenceWarning(score)}
                {low.includes(field) && (
                  <label className="inline">
                    <input
                      type="checkbox"
                      checked={ack.includes(field)}
                      onChange={(e) =>
                        setAck(e.target.checked ? [...ack, field] : ack.filter((k) => k !== field))
                      }
                    />
                    Saya sudah memeriksa {confidenceLabels[field] ?? 'detail transaksi'}
                  </label>
                )}
              </div>
            ))}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </fieldset>
        <footer>
          <button type="button" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button className="primary" disabled={busy || !data.wallets.length}>
            <Icon name="check" />
            {busy ? 'Menyimpan…' : 'Konfirmasi & simpan'}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
