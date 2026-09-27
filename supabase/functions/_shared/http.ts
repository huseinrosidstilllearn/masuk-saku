import { createClient } from '@supabase/supabase-js';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new HttpError(503, 'Server configuration incomplete');
  return value;
}
export function admin() {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
function headers(req: Request) {
  const origin = req.headers.get('origin');
  const allowed = env('ALLOWED_ORIGINS')
    .split(',')
    .map((s) => s.trim());
  if (origin && !allowed.includes(origin)) {
    throw new HttpError(403, 'Origin not allowed');
  }
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
  if (origin) h['Access-Control-Allow-Origin'] = origin;
  h['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-client-info';
  h['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  return h;
}
export function serve(handler: (req: Request) => Promise<unknown>, maxBodyBytes = 16000) {
  Deno.serve(async (req) => {
    let h: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    };
    try {
      h = headers(req);
      if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: h });
      }
      if (req.method !== 'POST') throw new HttpError(405, 'POST required');
      const contentLength = Number(req.headers.get('content-length'));
      if (contentLength > maxBodyBytes) {
        throw new HttpError(413, 'Request too large');
      }
      const chunks: Uint8Array[] = [];
      let size = 0;
      const reader = req.body?.getReader();
      if (reader) {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.byteLength;
          if (size > maxBodyBytes) {
            await reader.cancel();
            throw new HttpError(413, 'Request too large');
          }
          chunks.push(part.value);
        }
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      const limited = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: bytes,
      });
      return new Response(JSON.stringify(await handler(limited)), {
        headers: h,
      });
    } catch (e) {
      const known = e instanceof HttpError;
      return new Response(JSON.stringify({ error: known ? e.message : 'Request failed' }), {
        status: known ? e.status : 500,
        headers: h,
      });
    }
  });
}
export async function multipart(req: Request) {
  if (!/^multipart\/form-data(?:;|$)/i.test(req.headers.get('content-type')?.trim() ?? '')) {
    throw new HttpError(400, 'Multipart attachment required');
  }
  try {
    return await req.formData();
  } catch {
    throw new HttpError(400, 'Invalid multipart attachment');
  }
}
export async function body(req: Request) {
  const text = await req.text();
  if (text.length > 16000) throw new HttpError(413, 'Request too large');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}
export async function userContext(req: Request, household: string) {
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new HttpError(401, 'Authentication required');
  const client = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: 'Bearer ' + token } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error,
  } = await client.auth.getUser(token);
  if (error || !user) throw new HttpError(401, 'Invalid session');
  const membership = await client
    .from('household_members')
    .select('role')
    .eq('household_id', household)
    .eq('user_id', user.id)
    .maybeSingle();
  if (membership.error || !membership.data) {
    throw new HttpError(403, 'Household access denied');
  }
  return { user, client, role: membership.data.role, service: admin() };
}
export function databaseError(error: { message: string } | null) {
  if (error) throw new HttpError(500, 'Database operation failed');
}
