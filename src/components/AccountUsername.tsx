import { useEffect, useState } from 'react';
import { configured } from '../lib/supabase';
import { getMyUsername, setMyUsername, USERNAME_HELP, USERNAME_PATTERN } from '../lib/account';

export function AccountUsername() {
  const [username, setUsername] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(configured);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    if (!configured) return;
    setBusy(true);
    setError('');
    getMyUsername()
      .then((value) => {
        if (active) {
          setSaved(value);
          setUsername(value ?? '');
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  return (
    <section className="panel">
      <h2>Username akun</h2>
      <p className="muted">
        Masuk dengan username atau email. Username berbeda dari nama anggota keluarga.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          setMessage('');
          try {
            const value = await setMyUsername(username);
            setSaved(value);
            setUsername(value);
            setMessage('Username disimpan. Gunakan saat login berikutnya.');
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Gagal menyimpan username.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            pattern={USERNAME_PATTERN}
            minLength={3}
            maxLength={30}
            required
            aria-describedby="account-username-help"
            disabled={busy || !configured}
          />
        </label>
        <p id="account-username-help" className="muted">
          {USERNAME_HELP} Huruf besar disimpan sebagai huruf kecil.
        </p>
        {saved && (
          <p>
            Username saat ini: <strong>{saved}</strong>. Setelah diganti, username lama tidak dapat
            dipakai untuk masuk ke akun ini.
          </p>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="success" role="status">
            {message}
          </p>
        )}
        {!configured && (
          <p className="warning">
            Username akun hanya tersedia pada aplikasi yang terhubung ke Supabase.
          </p>
        )}
        <button className="primary" disabled={busy || !configured}>
          {busy ? 'Mohon tunggu…' : 'Simpan username'}
        </button>
        {error && (
          <button type="button" disabled={busy} onClick={() => setRetry(retry + 1)}>
            Muat ulang
          </button>
        )}
      </form>
    </section>
  );
}
