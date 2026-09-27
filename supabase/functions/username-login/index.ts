import { createClient } from '@supabase/supabase-js';
import { admin, body, env, HttpError, serve } from '../_shared/http.ts';
import { usernameLogin } from '../_shared/username-login.ts';

// Public password endpoint: no session yet. Auth still checks password/confirmation.
serve(async (req) => {
  const service = admin();
  const auth = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: {
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(12000) }),
    },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return await usernameLogin(await body(req), {
    quota: async (key) => {
      const r = await service.rpc('consume_username_login_quota', { p_key: key });
      if (r.error) throw new HttpError(503, 'Login sementara tidak tersedia.');
      return r.data === true;
    },
    resolve: async (username) => {
      const r = await service.rpc('resolve_username_email', { p_username: username });
      if (r.error) throw new HttpError(503, 'Login sementara tidak tersedia.');
      return r.data;
    },
    authenticate: async (email, password) => {
      const r = await auth.auth.signInWithPassword({ email, password });
      if (r.error?.status === 429)
        throw new HttpError(429, 'Terlalu banyak percobaan. Coba lagi nanti.');
      if (r.error && (r.error.status ?? 500) >= 500) {
        throw new HttpError(503, 'Login sementara tidak tersedia.');
      }
      return r.error ? null : r.data.session;
    },
  });
}, 4096);
