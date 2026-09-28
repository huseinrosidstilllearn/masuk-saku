import { useEffect, useId, useRef, useState } from 'react';
import { configured } from '../lib/supabase';
import {
  previewCapture,
  uploadReceipt,
  prepareReceipt,
  type CapturePreview,
} from '../lib/receipt-capture';
import { Icon } from './Icon';
import { useMotionDialog } from '../lib/motion';
import { MotionLoadingText } from './Motion';
import { ReceiptCamera } from './ReceiptCamera';

export function ReceiptCapture({
  household,
  retention,
  hide,
  onPreview,
  onManual,
  onSettings,
  onClose,
  initialMode = 'upload',
}: {
  household: string;
  retention: string;
  hide: boolean;
  onPreview: (preview: CapturePreview, file: File) => void;
  onManual: () => void;
  onSettings: () => void;
  onClose: () => void;
  initialMode?: 'upload' | 'camera';
}) {
  const { ref, close: dismiss, isClosing } = useMotionDialog(onClose);
  const id = useId(),
    selection = useRef(0),
    live = useRef(true);
  const [file, setFile] = useState<File | null>(null),
    [url, setUrl] = useState(''),
    [text, setText] = useState(''),
    [attachment, setAttachment] = useState(''),
    [error, setError] = useState(''),
    [stage, setStage] = useState<'idle' | 'validating' | 'uploading' | 'extracting'>('idle');
  const busy = stage !== 'idle';
  const [camera, setCamera] = useState(initialMode === 'camera');
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      selection.current++;
    };
  }, []);
  useEffect(() => {
    if (!file) {
      setUrl('');
      return;
    }
    const blob = URL.createObjectURL(file);
    setUrl(blob);
    return () => URL.revokeObjectURL(blob);
  }, [file]);
  function close() {
    setCamera(false);
    dismiss();
  }
  async function select(next: File | undefined, autoRead = false) {
    const token = ++selection.current;
    setFile(null);
    setAttachment('');
    setError('');
    if (!next) return;
    setStage('validating');
    try {
      const prepared = await prepareReceipt(next);
      if (live.current && token === selection.current) {
        setFile(prepared);
        if (autoRead && configured) await read(prepared, '');
      }
    } catch (e) {
      if (live.current && token === selection.current)
        setError(e instanceof Error ? e.message : 'Gambar tidak valid.');
    } finally {
      if (live.current && token === selection.current) setStage('idle');
    }
  }
  async function extract(e: React.FormEvent) {
    e.preventDefault();
    if (!file || busy || isClosing) return;
    await read(file, attachment);
  }
  async function read(image: File, existing: string) {
    setError('');
    try {
      let uploaded = existing;
      if (!uploaded) {
        setStage('uploading');
        uploaded = await uploadReceipt(household, image);
        if (!live.current) return;
        setAttachment(uploaded);
      }
      setStage('extracting');
      const result = await previewCapture(household, text, uploaded);
      if (!live.current) return;
      dismiss(() => onPreview(result, image));
    } catch (e) {
      if (live.current) setError(e instanceof Error ? e.message : 'Gagal membaca struk.');
    } finally {
      if (live.current) setStage('idle');
    }
  }
  const retentionLabel =
    (
      {
        immediate: 'hapus setelah konfirmasi',
        '24h': '24 jam setelah konfirmasi',
        '7d': '7 hari setelah konfirmasi',
        keep: 'simpan terus',
      } as Record<string, string>
    )[retention] ?? '24 jam setelah konfirmasi';
  return (
    <dialog
      ref={ref}
      className="receipt-dialog"
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) close();
      }}
    >
      <form onSubmit={extract}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">STRUK MENJADI CATATAN</span>
            <h2 id={id}>{initialMode === 'camera' ? 'Foto struk' : 'Upload struk'}</h2>
          </div>
          <button type="button" disabled={busy} aria-label="Tutup upload struk" onClick={close}>
            <Icon name="close" />
          </button>
        </div>
        <p className="review-note">
          <Icon name="lock" /> AI hanya menyiapkan draft. Saldo tidak berubah sebelum kamu
          mengonfirmasi.
        </p>
        <fieldset disabled={busy}>
          {camera && !isClosing && (
            <ReceiptCamera
              hide={hide}
              autoRead={configured}
              onPhoto={(photo) => {
                setCamera(false);
                void select(photo, true);
              }}
              onUpload={() => setCamera(false)}
            />
          )}
          {!camera && (
            <>
              <label className="receipt-picker">
                Gambar struk
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => {
                    const next = e.target.files?.[0];
                    e.target.value = '';
                    void select(next);
                  }}
                />
                <span className="field-help">
                  JPEG, PNG, WebP atau PDF · maksimal 10 MiB. PDF maksimal 3 halaman dikonversi
                  menjadi gambar di browser; hanya gambar hasil konversi yang diunggah.
                </span>
              </label>
              {initialMode === 'camera' && (
                <button
                  type="button"
                  onClick={() => {
                    selection.current++;
                    setFile(null);
                    setAttachment('');
                    setCamera(true);
                  }}
                >
                  Ambil foto ulang
                </button>
              )}
              {file && (
                <div className="receipt-preview">
                  {hide ? (
                    <p>Pratinjau gambar disembunyikan karena nominal sedang disembunyikan.</p>
                  ) : (
                    url && <img src={url} alt="Pratinjau struk pilihan" />
                  )}
                  <p>
                    {file.name} · {(file.size / 1024).toFixed(1)} KiB
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      selection.current++;
                      setFile(null);
                      setAttachment('');
                      setError('');
                    }}
                  >
                    Lepas gambar
                  </button>
                </div>
              )}
              <label>
                Konteks tambahan (opsional)
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={4000}
                  placeholder="Misalnya: belanja untuk keluarga, dibayar dari BCA."
                />
              </label>
              <p className="field-help">
                File diunggah ke penyimpanan privat saat kamu memilih Baca dengan AI. Gambar dan
                konteks dikirim melalui OpenRouter ke provider model gratis menggunakan kunci BYOK
                akunmu.
              </p>
              <p className="field-help">
                Kebijakan lampiran: {retentionLabel}. Unggahan yang belum dikonfirmasi kedaluwarsa
                setelah 24 jam.
              </p>
              {!configured && (
                <p className="warning">
                  Mode demo: gambar hanya dipratinjau lokal. Upload dan pembacaan AI memerlukan
                  Supabase serta BYOK; tidak ada hasil OCR simulasi.
                </p>
              )}
              {attachment && (
                <p className="field-help">
                  Gambar sudah diunggah. Percobaan berikutnya memakai unggahan yang sama selama
                  masih tersedia.
                </p>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </>
          )}
        </fieldset>
        {busy && (
          <p role="status">
            <MotionLoadingText
              text={
                stage === 'validating'
                  ? 'Memeriksa gambar…'
                  : stage === 'uploading'
                    ? 'Mengunggah ke penyimpanan privat…'
                    : 'Membaca struk dengan AI…'
              }
            />
          </p>
        )}
        <footer className="receipt-actions">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              dismiss(onSettings);
            }}
          >
            Pengaturan BYOK
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              dismiss(onManual);
            }}
          >
            Catat manual tanpa lampiran
          </button>
          {!camera && (
            <button className="primary" disabled={busy || !file || !configured}>
              <Icon name="sparkle" /> Baca dengan AI
            </button>
          )}
        </footer>
      </form>
    </dialog>
  );
}
