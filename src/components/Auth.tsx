import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { acceptInvitation } from '../lib/invitations';
import { createHousehold } from '../lib/repository';
import { Icon } from './Icon';
import { Welcome } from './Welcome';
import { MotionLoadingText } from './Motion';
import { PasswordResetRequest } from './PasswordRecovery';
import {
  registerAccount,
  signInWithIdentifier,
  USERNAME_HELP,
  USERNAME_PATTERN,
} from '../lib/account';
export function Auth() {
  const [reset, setReset] = useState(false);
  const [email, setEmail] = useState(''),
    [username, setUsername] = useState(''),
    [password, setPassword] = useState(''),
    [signup, setSignup] = useState(false),
    [showPassword, setShowPassword] = useState(false),
    [message, setMessage] = useState(''),
    [failed, setFailed] = useState(false),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      if (signup) {
        await registerAccount(email, password, username);
        setMessage(
          'Periksa email untuk mengonfirmasi akun. Setelah itu, masuk dengan username atau email.',
        );
      } else {
        await signInWithIdentifier(email, password);
      }
    } catch (e) {
      setFailed(true);
      setMessage(e instanceof Error ? e.message : 'Gagal masuk.');
    } finally {
      setBusy(false);
    }
  }
  if (reset) return <PasswordResetRequest onBack={() => setReset(false)} />;
  return (
    <main className="billow-page">
      <Welcome
        onAccess={(nextSignup) => {
          setSignup(nextSignup);
          setMessage('');
          document.getElementById('akses')?.scrollIntoView({
            behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
            block: 'start',
          });
          setTimeout(
            () =>
              document
                .getElementById('akses')
                ?.querySelector<HTMLInputElement>('input')
                ?.focus({ preventScroll: true }),
            0,
          );
        }}
      />
      <section className="auth-form-area" id="akses" aria-label="Akses akun">
        <form onSubmit={submit} className="panel auth-card">
          <span className="eyebrow">
            {signup ? 'MULAI PERJALANANMU' : 'SELAMAT DATANG KEMBALI'}
          </span>
          <h2>{signup ? 'Buat akun pertamamu' : 'Masuk ke sakumu.'}</h2>
          <p className="muted">
            {signup
              ? 'Satu akun untuk memulai catatan keuangan keluarga.'
              : 'Catatan dan rencana keluargamu menunggu di sini.'}
          </p>
          <label>
            {signup ? 'Email' : 'Username atau email'}
            <input
              type={signup ? 'email' : 'text'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete={signup ? 'email' : 'username'}
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              placeholder={signup ? 'nama@email.com' : 'username atau nama@email.com'}
              disabled={busy}
              required
            />
          </label>
          {signup && (
            <label>
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-label="Username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                pattern={USERNAME_PATTERN}
                minLength={3}
                maxLength={30}
                required
                disabled={busy}
                placeholder="contoh: pengguna_saku"
                aria-describedby="signup-username-help"
              />
              <small id="signup-username-help" className="muted">
                {USERNAME_HELP} Tidak membedakan huruf besar dan kecil.
              </small>
            </label>
          )}
          <label htmlFor="auth-password">Password</label>
          <div className="password-field">
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={signup ? 'new-password' : 'current-password'}
              placeholder="Minimal 8 karakter"
              disabled={busy}
              required
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              aria-pressed={showPassword}
              aria-controls="auth-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span
                className="t-icon-swap"
                data-state={showPassword ? 'b' : 'a'}
                aria-hidden="true"
              >
                <span className="t-icon" data-icon="a">
                  <Icon name="eye" />
                </span>
                <span className="t-icon" data-icon="b">
                  <Icon name="eyeOff" />
                </span>
              </span>
            </button>
          </div>
          {message && (
            <p
              className={'auth-message ' + (failed ? 'error' : 'success')}
              role={failed ? 'alert' : 'status'}
            >
              {message}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? <MotionLoadingText text="Mohon tunggu…" /> : signup ? 'Daftar' : 'Masuk'}
          </button>
          {!signup && (
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => {
                setPassword('');
                setMessage('');
                setReset(true);
              }}
            >
              Lupa password?
            </button>
          )}
          <div className="auth-divider">
            <span>atau</span>
          </div>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setFailed(false);
              setMessage('');
              try {
                const r = await supabase!.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: location.origin },
                });
                if (r.error) throw r.error;
              } catch (e) {
                setFailed(true);
                setMessage(e instanceof Error ? e.message : 'Gagal masuk dengan Google.');
              } finally {
                setBusy(false);
              }
            }}
          >
            Lanjutkan dengan Google
          </button>
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => {
              setSignup(!signup);
              setMessage('');
              setShowPassword(false);
            }}
          >
            {signup ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
          </button>
        </form>
        <p className="auth-footnote">
          <Icon name="lock" /> Kuncimu tetap milikmu. Catatan tetap dalam kendalimu.
        </p>
      </section>
    </main>
  );
}
export function Onboarding({ done }: { done: () => void }) {
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState(''),
    [household, setHousehold] = useState('Keluarga kami'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <main className="auth">
      <div className="brand">
        <span className="brand-mark">
          <Icon name="wallet" />
        </span>
        <span>masuk saku</span>
      </div>
      <form
        className="panel auth-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            setError('');
            if (joining) await acceptInvitation(code, name);
            else await createHousehold(household, name);
            done();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Gagal membuat keluarga');
          } finally {
            setBusy(false);
          }
        }}
      >
        <span className="eyebrow">MULAI DARI KELUARGAMU</span>
        <h1>{joining ? 'Bergabung dengan keluarga' : 'Saku pertama keluargamu'}</h1>
        <p>
          {joining
            ? 'Gunakan akun dengan email tujuan undangan yang sudah diverifikasi.'
            : 'Kamu menjadi Owner. Tambahkan dompet setelah ini.'}
        </p>
        <label>
          Nama panggilan
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
        </label>
        {joining ? (
          <label>
            Kode undangan
            <input
              required
              maxLength={64}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        ) : (
          <label>
            Nama keluarga
            <input
              value={household}
              onChange={(e) => setHousehold(e.target.value)}
              maxLength={100}
              required
            />
          </label>
        )}
        <button className="primary" disabled={busy}>
          {busy ? 'Menyiapkan saku…' : joining ? 'Terima undangan' : 'Buat household'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setJoining(!joining);
            setError('');
          }}
        >
          {joining ? 'Buat keluarga sendiri' : 'Punya kode undangan? Bergabung'}
        </button>
        <button type="button" disabled={busy} onClick={() => void supabase?.auth.signOut()}>
          Keluar / ganti akun
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </main>
  );
}
