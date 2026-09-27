import { z } from 'zod';
import { supabase } from './supabase';
import { renameDemoMember } from './demo';
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const profileSchema = z.object({
  user_id: z.string(),
  full_name: z.string(),
  nickname: z.string(),
  phone: z.string(),
  birth_date: z.string().nullable(),
  city: z.string(),
  bio: z.string(),
  avatar_path: z.string().nullable(),
  revision: z.number().int().min(0),
});
export type Profile = z.infer<typeof profileSchema>;
export type ProfileFields = Omit<Profile, 'user_id' | 'revision'>;
let demoProfile: Profile | null = null;
export function blankProfile(userId: string, nickname: string): Profile {
  return {
    user_id: userId,
    full_name: '',
    nickname,
    phone: '',
    birth_date: null,
    city: '',
    bio: '',
    avatar_path: null,
    revision: 0,
  };
}
export async function validateAvatar(file: File): Promise<'jpg' | 'png' | 'webp'> {
  if (!file.size || file.size > AVATAR_MAX_BYTES)
    throw new Error('Ukuran foto harus lebih dari 0 dan maksimal 2 MB.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return 'jpg';
  if (
    file.type === 'image/png' &&
    Array.from(bytes.slice(0, 8)).join(',') === '137,80,78,71,13,10,26,10'
  )
    return 'png';
  if (
    file.type === 'image/webp' &&
    new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
    new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
  )
    return 'webp';
  throw new Error('Gunakan foto JPEG, PNG, atau WebP yang valid.');
}
export async function getProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return demoProfile;
  const result = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (result.error) throw new Error('Profil belum bisa dimuat. Coba lagi.');
  return result.data ? profileSchema.parse(result.data) : null;
}
export async function avatarUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (!supabase) return path;
  const result = await supabase.storage.from('avatars').createSignedUrl(path, 300);
  if (result.error) return null;
  return result.data.signedUrl;
}
export async function saveProfile(
  previous: Profile,
  fields: ProfileFields,
  file?: File,
): Promise<{ profile: Profile; cleanupPending: boolean }> {
  let uploaded: string | null = null;
  if (file) {
    const extension = await validateAvatar(file);
    if (!supabase) throw new Error('Upload foto tersedia setelah masuk ke akun.');
    uploaded = `${previous.user_id}/${crypto.randomUUID()}.${extension}`;
    const upload = await supabase.storage
      .from('avatars')
      .upload(uploaded, file, { upsert: false, contentType: file.type });
    if (upload.error) throw new Error('Foto belum berhasil diunggah. Coba lagi.');
  }
  if (!supabase) {
    demoProfile = { ...fields, user_id: previous.user_id, revision: previous.revision + 1 };
    renameDemoMember(previous.user_id, fields.nickname);
    return { profile: demoProfile, cleanupPending: false };
  }
  const result = await supabase.rpc('save_my_profile', {
    p_profile: { ...fields, avatar_path: uploaded ?? fields.avatar_path },
    p_expected_revision: previous.revision,
  });
  if (result.error) {
    // P0001 is an explicit transaction rollback. A transport error is ambiguous;
    // keep its candidate because the in-flight save might still commit.
    if (uploaded && result.error.code === 'P0001')
      await supabase.storage.from('avatars').remove([uploaded]);
    throw new Error(
      result.error.message.includes('profile conflict')
        ? 'Profil berubah di sesi lain. Muat ulang sebelum menyimpan.'
        : 'Profil belum berhasil disimpan. Data masukan tetap tersedia.',
    );
  }
  const profile = profileSchema.parse(result.data);
  let cleanupPending = false;
  if (previous.avatar_path && previous.avatar_path !== profile.avatar_path) {
    const cleanup = await supabase.storage.from('avatars').remove([previous.avatar_path]);
    cleanupPending = Boolean(cleanup.error);
  }
  return { profile, cleanupPending };
}
