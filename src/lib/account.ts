import { supabase } from './supabase';

export const USERNAME_PATTERN = '[a-zA-Z0-9][a-zA-Z0-9_]{2,29}';
export const USERNAME_HELP = '3–30 karakter: huruf, angka, atau underscore. Tanpa spasi.';

export async function registerAccount(email: string, password: string, username: string) {
  if (!supabase) throw new Error('Hubungkan Supabase untuk mendaftar.');
  const normalized = username.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_]{2,29}$/.test(normalized)) throw new Error(USERNAME_HELP);
  const r = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: location.origin, data: { username: normalized } },
  });
  if (r.error)
    throw new Error(
      r.error.message.includes('Database error')
        ? 'Pendaftaran belum berhasil. Coba username lain atau ulangi nanti.'
        : r.error.message,
    );
}

export async function signInWithIdentifier(identifier: string, password: string) {
  if (!supabase) throw new Error('Hubungkan Supabase untuk masuk.');
  const value = identifier.trim();
  if (value.includes('@')) {
    const r = await supabase.auth.signInWithPassword({ email: value, password });
    if (r.error) throw new Error('Email atau password salah. Pastikan email sudah dikonfirmasi.');
    return;
  }
  const r = await supabase.functions.invoke('username-login', {
    body: { username: value.toLowerCase(), password },
  });
  if (r.error) {
    const response = r.error.context;
    const detail = response instanceof Response ? await response.json().catch(() => null) : null;
    throw new Error(detail?.error ?? 'Belum bisa masuk. Periksa koneksi lalu coba lagi.');
  }
  if (!r.data?.access_token || !r.data?.refresh_token)
    throw new Error('Respons login tidak valid.');
  const session = await supabase.auth.setSession(r.data);
  if (session.error) throw new Error('Sesi belum bisa dibuka. Silakan masuk lagi.');
}

export async function getMyUsername(): Promise<string | null> {
  if (!supabase) return null;
  const r = await supabase.rpc('get_my_username');
  if (r.error) throw new Error('Username belum bisa dimuat. Coba lagi.');
  return r.data;
}

export async function setMyUsername(username: string): Promise<string> {
  if (!supabase) throw new Error('Username akun tersedia setelah masuk ke Supabase.');
  const r = await supabase.rpc('set_my_username', { p_username: username.trim().toLowerCase() });
  if (r.error) {
    throw new Error(
      r.error.message.includes('already in use')
        ? 'Username sudah dipakai. Pilih username lain.'
        : 'Username belum bisa disimpan. Periksa format dan coba lagi.',
    );
  }
  return r.data;
}
