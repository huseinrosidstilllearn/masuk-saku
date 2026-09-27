import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL?.trim(),
  key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
// Demo mode never creates a live backend client, even when .env.local exists.
export const configured = import.meta.env.MODE !== 'demo' && Boolean(url && key);
export const supabase = configured
  ? createClient(url!, key!, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        storage: sessionStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
