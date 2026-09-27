import { z } from 'zod';
import { HttpError } from './http.ts';

export const loginSchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9][a-z0-9_]{2,29}$/),
    password: z.string().min(1).max(1024),
  })
  .strict();
export const INVALID_LOGIN = 'Username atau password salah. Pastikan email sudah dikonfirmasi.';

type Tokens = { access_token: string; refresh_token: string };
export type LoginDependencies = {
  quota: (key: string) => Promise<boolean>;
  resolve: (username: string) => Promise<string | null>;
  authenticate: (email: string, password: string) => Promise<Tokens | null>;
};

export async function usernameLogin(raw: unknown, deps: LoginDependencies): Promise<Tokens> {
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) throw new HttpError(400, 'Format username atau password tidak valid.');
  const { username, password } = parsed.data;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(username));
  const key = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  if (!(await deps.quota(key))) {
    throw new HttpError(429, 'Terlalu banyak percobaan. Coba lagi dalam 10 menit.');
  }
  const email = await deps.resolve(username);
  // An unknown handle follows the same Auth request path; never return its email.
  const tokens = await deps.authenticate(email ?? 'missing-username@invalid.invalid', password);
  if (!email || !tokens) throw new HttpError(401, INVALID_LOGIN);
  return { access_token: tokens.access_token, refresh_token: tokens.refresh_token };
}
