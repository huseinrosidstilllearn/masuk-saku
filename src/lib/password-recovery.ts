import { supabase } from './supabase';

export const RECOVERY_HASH = '#pemulihan-password';
export async function cancelPasswordRecovery() {
  const result = await supabase?.auth.signOut({ scope: 'local' });
  if (result?.error) throw new Error('Sesi belum bisa ditutup. Coba lagi.');
}
export async function requestPasswordReset(email: string) {
  if (!supabase) throw new Error('Pemulihan akun memerlukan koneksi Supabase.');
  const result = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: location.origin + '/' + RECOVERY_HASH,
  });
  if (result.error) throw new Error('Tautan belum bisa dikirim. Tunggu sebentar lalu coba lagi.');
}
export async function replaceRecoveredPassword(password: string) {
  if (!supabase) throw new Error('Sesi pemulihan belum tersedia.');
  const result = await supabase.auth.updateUser({ password });
  if (result.error)
    throw new Error(
      'Password belum bisa diubah. Periksa tautan dan gunakan password yang berbeda.',
    );
  const logout = await supabase.auth.signOut({ scope: 'local' });
  if (logout.error) throw new Error('Password sudah diubah. Tutup halaman lalu masuk kembali.');
}
