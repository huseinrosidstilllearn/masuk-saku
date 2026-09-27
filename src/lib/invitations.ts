import { supabase } from './supabase';
import { z } from 'zod';

export const invitationSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
  status: z.enum(['pending', 'accepted', 'revoked', 'expired']),
});
export type Invitation = z.infer<typeof invitationSchema>;
export function invitationCode() {
  return (crypto.randomUUID() + crypto.randomUUID()).replaceAll('-', '');
}
function client() {
  if (!supabase) throw new Error('Mode demo: undangan nyata memerlukan login Supabase.');
  return supabase;
}
function failure(message: string) {
  if (/Owner required/.test(message)) return 'Hanya Owner yang dapat mengelola undangan.';
  if (/verified email required/.test(message)) return 'Verifikasi email akunmu terlebih dahulu.';
  if (/account already belongs/.test(message))
    return 'Akunmu sudah memiliki keluarga. Pergantian keluarga belum tersedia.';
  if (/active invitation already exists/.test(message))
    return 'Undangan aktif untuk email ini sudah ada. Batalkan dahulu untuk membuat kode baru.';
  if (/recipient is already/.test(message)) return 'Email ini sudah menjadi anggota keluarga.';
  if (/maximum20/.test(message))
    return 'Maksimal 20 undangan aktif. Batalkan undangan yang tidak diperlukan.';
  return 'Undangan tidak tersedia atau akses ditolak. Periksa kode, email akun, dan masa berlakunya.';
}
export async function listInvitations(household: string) {
  if (!supabase) return [];
  const result = await client().rpc('list_household_invitations', { p_household: household });
  if (result.error) throw new Error(failure(result.error.message));
  return z.array(invitationSchema).parse(result.data);
}
export async function createInvitation(household: string, email: string, id: string, code: string) {
  const result = await client().rpc('create_household_invitation', {
    p_household: household,
    p_email: email.trim().toLowerCase(),
    p_id: id,
    p_token: code,
  });
  if (result.error) throw new Error(failure(result.error.message));
}
export async function revokeInvitation(id: string) {
  const result = await client().rpc('revoke_household_invitation', { p_id: id });
  if (result.error) throw new Error(failure(result.error.message));
}
export async function revokeHouseholdMember(household: string, user: string) {
  const result = await client().rpc('revoke_household_member', {
    p_household: household,
    p_user: user,
  });
  if (result.error) throw new Error('Akses anggota belum berhasil dinonaktifkan. Coba lagi.');
}
export async function acceptInvitation(code: string, displayName: string) {
  const token = code.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Kode undangan harus berisi 64 karakter.');
  const result = await client().rpc('accept_household_invitation', {
    p_token: token,
    p_display_name: displayName.trim(),
  });
  if (result.error) throw new Error(failure(result.error.message));
}
