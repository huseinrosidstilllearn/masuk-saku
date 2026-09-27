import { useState } from 'react';
import { requestPasswordReset, replaceRecoveredPassword } from '../lib/password-recovery';
import { MotionLoadingText } from './Motion';
import { Icon } from './Icon';

export function PasswordResetRequest({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState(''),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState('');
  return (
    <main className="auth">
      <form
        className="panel auth-card"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError('');
          try {
            await requestPasswordReset(email);
            setSent(true);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Pemulihan belum tersedia.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <span className="eyebrow">AKSES AKUN</span>
        <h2>Lupa password?</h2>
        <p className="muted">Gunakan email akunmu. Username tetap sama setelah password diubah.</p>
        <label>
          Email pemulihan
          <input
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={254}
            value={email}
            disabled={busy}
            onChange={(e) => {
              setEmail(e.target.value);
              setSent(false);
            }}
          />
        </label>
        {sent && (
          <p role="status" className="success">
            Jika email terdaftar, tautan pemulihan akan dikirim. Buka tautan di browser dan tab yang
            sama dengan permintaan ini.
          </p>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy || sent}>
          {busy ? <MotionLoadingText text="Mengirim permintaan…" /> : 'Kirim tautan pemulihan'}
        </button>
        <button type="button" className="text-button" disabled={busy} onClick={onBack}>
          Kembali ke masuk
        </button>
      </form>
    </main>
  );
}

export function PasswordRecovery({
  authenticated,
  onDone,
}: {
  authenticated: boolean;
  onDone: () => void;
}) {
  const [password, setPassword] = useState(''),
    [repeat, setRepeat] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  if (!authenticated)
    return (
      <main className="auth">
        <section className="panel auth-card">
          <span className="eyebrow">PEMULIHAN AKUN</span>
          <h2>Tautan pemulihan belum valid</h2>
          <p>
            Tautan mungkin kedaluwarsa atau dibuka di browser berbeda. Kembali ke halaman masuk dan
            minta tautan baru.
          </p>
          <button className="primary" onClick={onDone}>
            Kembali ke masuk
          </button>
        </section>
      </main>
    );
  return (
    <main className="auth">
      <form
        className="panel auth-card"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setError('');
          if (password !== repeat) {
            setError('Password belum sama. Periksa kembali kedua kolom.');
            return;
          }
          setBusy(true);
          try {
            await replaceRecoveredPassword(password);
            setPassword('');
            setRepeat('');
            onDone();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Password belum bisa disimpan.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <span className="eyebrow">PEMULIHAN AKUN</span>
        <h2>Buat password baru</h2>
        <p className="muted">Setelah disimpan, masuk kembali dengan password baru.</p>
        <label>
          Password baru
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            value={password}
            disabled={busy}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          Ulangi password baru
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            value={repeat}
            disabled={busy}
            onChange={(e) => setRepeat(e.target.value)}
          />
        </label>
        <p className="field-help">
          <Icon name="lock" /> Minimal 8 karakter. Password tidak disimpan di perangkat.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? <MotionLoadingText text="Menyimpan password…" /> : 'Simpan password baru'}
        </button>
      </form>
    </main>
  );
}
