import { useEffect, useState } from 'react';
import {
  avatarUrl,
  blankProfile,
  getProfile,
  saveProfile,
  validateAvatar,
  type Profile as ProfileData,
} from '../lib/profile';
import { configured, supabase } from '../lib/supabase';
import { dateInJakarta } from '../domain/finance';
import { Icon } from './Icon';
import { getMyUsername, setMyUsername, USERNAME_PATTERN, USERNAME_HELP } from '../lib/account';
export function Profile({
  userId,
  nickname,
  onSaved,
}: {
  userId: string;
  nickname: string;
  onSaved: () => Promise<void>;
}) {
  const [profile, setProfile] = useState<ProfileData>(() => blankProfile(userId, nickname));
  const [persisted, setPersisted] = useState<ProfileData>(() => blankProfile(userId, nickname));
  const [file, setFile] = useState<File>();
  const [username, setUsername] = useState('');
  const [usernameReady, setUsernameReady] = useState(false);
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setUsernameReady(false);
    void getMyUsername()
      .then((value) => {
        if (active) {
          setUsername(value ?? '');
          setUsernameReady(true);
          setUsernameError('');
        }
      })
      .catch(() => {
        if (active)
          setUsernameError('Username belum bisa dimuat. Muat ulang profil untuk mencoba lagi.');
      });
    return () => {
      active = false;
    };
  }, [userId, reload]);
  const [signed, setSigned] = useState<string | null>(null),
    [preview, setPreview] = useState<string | null>(null);
  const [email, setEmail] = useState(''),
    [loading, setLoading] = useState(true),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(''),
    [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setReady(false);
    setError('');
    void (async () => {
      try {
        const value = (await getProfile(userId)) ?? blankProfile(userId, nickname);
        const url = await avatarUrl(value.avatar_path);
        const session = supabase ? await supabase.auth.getSession() : null;
        if (active) {
          setProfile(value);
          setPersisted(value);
          setSigned(url);
          setEmail(session?.data.session?.user.email ?? '');
          setFile(undefined);
          setReady(true);
        }
      } catch {
        if (active) setError('Profil belum bisa dimuat. Coba muat ulang.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, reload]);
  useEffect(() => {
    const url = file ? URL.createObjectURL(file) : null;
    setPreview(url);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);
  const update = (
    key: 'full_name' | 'nickname' | 'phone' | 'birth_date' | 'city' | 'bio',
    value: string,
  ) => {
    setProfile({ ...profile, [key]: key === 'birth_date' ? value || null : value });
    setMessage('');
  };
  const shownPhoto = preview ?? (profile.avatar_path ? signed : null);
  return (
    <section className="panel profile-panel" aria-labelledby="profile-heading">
      <div className="profile-heading">
        <span className="eyebrow">AKUN PRIBADI</span>
        <h2 id="profile-heading">Profil saya</h2>
        <p>
          Lengkapi profilmu. Nama panggilan tampil di keluarga; informasi lainnya hanya untukmu.
        </p>
      </div>
      {loading && <p role="status">Memuat profil…</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="success">
          {message}
        </p>
      )}
      {!loading && !ready && (
        <button onClick={() => setReload(reload + 1)}>Muat ulang profil</button>
      )}
      {ready && (
        <div className="profile-photo-row">
          <div className="profile-photo">
            {shownPhoto ? (
              <img
                src={shownPhoto}
                alt="Foto profil saya"
                onError={() => {
                  setSigned(null);
                  setPreview(null);
                }}
              />
            ) : (
              <Icon name="user" size={42} />
            )}
          </div>
          <div>
            <strong>Foto profil</strong>
            <p>JPEG, PNG, atau WebP. Maksimal 2 MB.</p>
            <label className="profile-upload-label">
              <Icon name="camera" />
              Pilih foto
              <input
                aria-label="Pilih foto profil"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy || !configured}
                onChange={async (e) => {
                  const selected = e.target.files?.[0];
                  e.target.value = '';
                  if (!selected) return;
                  setError('');
                  setMessage('');
                  try {
                    await validateAvatar(selected);
                    setFile(selected);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Foto tidak valid.');
                  }
                }}
              />
            </label>
            {(file || profile.avatar_path) && (
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setFile(undefined);
                  setProfile({ ...profile, avatar_path: null });
                  setMessage('');
                }}
              >
                Hapus foto
              </button>
            )}
            {!configured && <small>Upload foto tersedia saat masuk ke akun.</small>}
          </div>
        </div>
      )}
      {ready && (
        <form
          className="profile-username"
          onSubmit={async (e) => {
            e.preventDefault();
            setUsernameBusy(true);
            setUsernameError('');
            setUsernameMessage('');
            try {
              setUsername(await setMyUsername(username));
              setUsernameMessage(
                'Username berhasil disimpan. Gunakan username baru saat login berikutnya.',
              );
            } catch (error) {
              setUsernameError(
                error instanceof Error ? error.message : 'Username belum bisa disimpan.',
              );
            } finally {
              setUsernameBusy(false);
            }
          }}
        >
          <label>
            Username
            <input
              autoComplete="username"
              value={username}
              required
              pattern={USERNAME_PATTERN}
              minLength={3}
              maxLength={30}
              disabled={!configured || !usernameReady || usernameBusy}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameMessage('');
              }}
              aria-describedby="profile-username-help"
            />
          </label>
          <small id="profile-username-help">
            {USERNAME_HELP} Username berbeda dari nama panggilan dan digunakan untuk login.
          </small>
          {usernameError && (
            <p role="alert" className="error">
              {usernameError}
            </p>
          )}
          {usernameMessage && (
            <p role="status" className="success">
              {usernameMessage}
            </p>
          )}
          <button disabled={!configured || !usernameReady || usernameBusy} type="submit">
            {usernameBusy ? 'Menyimpan username…' : 'Simpan username'}
          </button>
        </form>
      )}
      {ready && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            setMessage('');
            try {
              if (!/^[0-9+ ().-]*$/.test(profile.phone.trim()))
                throw new Error(
                  'Nomor telepon hanya boleh berisi angka dan tanda +, spasi, kurung, titik, atau strip.',
                );
              const { user_id: _id, revision: _revision, ...fields } = profile;
              const result = await saveProfile(
                persisted,
                { ...fields, full_name: fields.full_name.trim(), nickname: fields.nickname.trim() },
                file,
              );
              setProfile(result.profile);
              setPersisted(result.profile);
              setSigned(await avatarUrl(result.profile.avatar_path));
              setFile(undefined);
              await onSaved();
              setMessage(
                result.cleanupPending
                  ? 'Profil tersimpan; pembersihan foto lama belum selesai.'
                  : 'Profil berhasil disimpan.',
              );
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Profil belum berhasil disimpan.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy} className="profile-fields">
            <legend className="sr-only">Informasi profil</legend>
            <label>
              Nama lengkap
              <input
                autoComplete="name"
                maxLength={100}
                required
                value={profile.full_name}
                onChange={(e) => update('full_name', e.target.value)}
              />
            </label>
            <label>
              Nama panggilan
              <input
                autoComplete="nickname"
                maxLength={50}
                required
                value={profile.nickname}
                onChange={(e) => update('nickname', e.target.value)}
              />
            </label>
            <label>
              Nomor telepon <small>(opsional)</small>
              <input
                type="tel"
                autoComplete="tel"
                maxLength={30}
                value={profile.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </label>
            <label>
              Tanggal lahir <small>(opsional)</small>
              <input
                type="date"
                autoComplete="bday"
                min="1900-01-01"
                max={dateInJakarta(new Date().toISOString())}
                value={profile.birth_date ?? ''}
                onChange={(e) => update('birth_date', e.target.value)}
              />
            </label>
            <label>
              Kota <small>(opsional)</small>
              <input
                autoComplete="address-level2"
                maxLength={100}
                value={profile.city}
                onChange={(e) => update('city', e.target.value)}
              />
            </label>
            <label>
              Email akun
              <input
                type="email"
                readOnly
                value={email}
                placeholder={configured ? 'Email akun' : 'Mode demo'}
                aria-describedby="profile-email-note"
              />
              <small id="profile-email-note">
                Email masuk tidak diubah melalui formulir profil.
              </small>
            </label>
            <label className="profile-bio">
              Bio singkat <small>(opsional)</small>
              <textarea
                maxLength={500}
                rows={3}
                value={profile.bio}
                onChange={(e) => update('bio', e.target.value)}
              />
              <small>{profile.bio.length}/500 karakter</small>
            </label>
          </fieldset>
          <div className="profile-form-actions">
            <button type="submit" className="primary" disabled={busy}>
              {busy ? 'Menyimpan…' : 'Simpan profil'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm('Muat ulang profil dan buang perubahan yang belum disimpan?'))
                  setReload(reload + 1);
              }}
            >
              Batalkan perubahan
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
export function AccountAvatar({
  userId,
  name,
  version = 0,
}: {
  userId: string;
  name: string;
  version?: number;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setUrl(null);
    void getProfile(userId)
      .then(async (p) => {
        const signed = await avatarUrl(p?.avatar_path ?? null);
        if (active) setUrl(signed);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId, version]);
  return (
    <span className="avatar small-avatar">
      {url ? (
        <img src={url} alt="" onError={() => setUrl(null)} />
      ) : (
        name.trim().slice(0, 1).toUpperCase()
      )}
    </span>
  );
}
