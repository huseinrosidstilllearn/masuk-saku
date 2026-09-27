import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

/** Mount only after an explicit Foto struk action. Never keep tracks alive outside this surface. */
export function ReceiptCamera({
  onPhoto,
  onUpload,
  autoRead,
  hide,
}: {
  onPhoto: (file: File) => void;
  onUpload: () => void;
  autoRead: boolean;
  hide: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const live = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [taking, setTaking] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    live.current = true;
    setReady(false);
    setError('');
    function stop() {
      active = false;
      live.current = false;
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      if (video.current) video.current.srcObject = null;
    }
    function pause() {
      stop();
      setReady(false);
      setError('Kamera dihentikan saat halaman ditinggalkan. Buka kembali jika diperlukan.');
    }
    function hidden() {
      if (document.hidden) pause();
    }
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', pause);
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
        const next = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1600 },
            height: { ideal: 1200 },
          },
        });
        if (!active) {
          next.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.current = next;
        if (video.current) {
          video.current.srcObject = next;
          await video.current.play();
        }
      } catch (e) {
        if (!active) return;
        stream.current?.getTracks().forEach((track) => track.stop());
        stream.current = null;
        const denied = e instanceof DOMException && e.name === 'NotAllowedError';
        setError(
          denied
            ? 'Izin kamera belum diberikan. Izinkan kamera di pengaturan browser atau upload gambar struk.'
            : 'Kamera tidak tersedia. Coba kembali atau upload gambar struk.',
        );
      }
    }
    void start();
    return () => {
      stop();
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', pause);
    };
  }, [attempt]);
  async function snap() {
    const frame = video.current;
    if (!frame || !ready || taking || !live.current || !frame.videoWidth) return;
    setTaking(true);
    try {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 2000 / Math.max(frame.videoWidth, frame.videoHeight));
      canvas.width = Math.round(frame.videoWidth * scale);
      canvas.height = Math.round(frame.videoHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error();
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.9),
      );
      if (!live.current) return;
      if (!blob) throw new Error();
      onPhoto(new File([blob], 'foto-struk.jpg', { type: 'image/jpeg' }));
    } catch {
      if (live.current) setError('Foto belum berhasil diambil. Coba kembali.');
    } finally {
      if (live.current) setTaking(false);
    }
  }
  return (
    <section className="receipt-camera" aria-label="Kamera struk">
      <p>Pastikan seluruh struk terlihat dan tulisan cukup terang. Kamera tidak merekam audio.</p>
      <div hidden={!!error} className={`camera-frame ${hide ? 'camera-masked' : ''}`}>
        <video
          ref={video}
          muted
          playsInline
          aria-label="Pratinjau kamera"
          onLoadedData={() => {
            if (live.current) setReady(true);
          }}
        />
        {hide ? (
          <p className="camera-mask-note">Pratinjau kamera disembunyikan bersama saldo.</p>
        ) : (
          <span className="camera-guide" aria-hidden="true" />
        )}
      </div>
      {!ready && !error && <p role="status">Menunggu izin dan menyiapkan kamera…</p>}
      {error && (
        <p className="warning" role="alert">
          {error}
        </p>
      )}
      {autoRead && (
        <p>
          Ambil foto &amp; baca AI akan mengunggah gambar ke penyimpanan privat dan mengirimkannya
          melalui OpenRouter memakai BYOK. Hasilnya berupa draft untuk kamu konfirmasi.
        </p>
      )}
      <div className="camera-actions">
        <button
          type="button"
          className="primary"
          disabled={!ready || taking}
          onClick={() => void snap()}
        >
          <Icon name="camera" />
          {autoRead ? 'Ambil foto & baca AI' : 'Ambil foto'}
        </button>
        {error && (
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            Coba kamera lagi
          </button>
        )}
        <button type="button" onClick={onUpload}>
          <Icon name="upload" />
          Pilih upload struk
        </button>
      </div>
    </section>
  );
}
