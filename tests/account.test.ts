import { beforeEach, expect, it, vi } from 'vitest';
const client = vi.hoisted(() => ({
  auth: { signInWithPassword: vi.fn(), setSession: vi.fn(), signUp: vi.fn() },
  functions: { invoke: vi.fn() },
  rpc: vi.fn(),
}));
vi.mock('../src/lib/supabase', () => ({ supabase: client }));
import { registerAccount, signInWithIdentifier, setMyUsername } from '../src/lib/account';

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('location', { origin: 'https://example.test' });
});
it('email login retains native Auth while username login installs returned tokens', async () => {
  client.auth.signInWithPassword.mockResolvedValue({ error: null });
  await signInWithIdentifier(' owner@example.test ', 'test-only-password');
  expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
    email: 'owner@example.test',
    password: 'test-only-password',
  });
  expect(client.functions.invoke).not.toHaveBeenCalled();
  const tokens = { access_token: 'fake-access', refresh_token: 'fake-refresh' };
  client.functions.invoke.mockResolvedValue({ data: tokens, error: null });
  client.auth.setSession.mockResolvedValue({ error: null });
  await signInWithIdentifier(' Owner_Saku ', 'test-only-password');
  expect(client.functions.invoke).toHaveBeenCalledWith('username-login', {
    body: { username: 'owner_saku', password: 'test-only-password' },
  });
  expect(client.auth.setSession).toHaveBeenCalledWith(tokens);
});
it('failure or incomplete tokens never open a session; server quota copy survives', async () => {
  client.functions.invoke.mockResolvedValue({
    error: { context: Response.json({ error: 'Terlalu banyak percobaan.' }, { status: 429 }) },
  });
  await expect(signInWithIdentifier('owner', 'test-only-password')).rejects.toThrow(
    'Terlalu banyak',
  );
  client.functions.invoke.mockResolvedValue({ data: { access_token: 'fake' }, error: null });
  await expect(signInWithIdentifier('owner', 'test-only-password')).rejects.toThrow(
    'Respons login',
  );
  expect(client.auth.setSession).not.toHaveBeenCalled();
});
it('signup submits normalized unique handle as metadata and keeps email confirmation', async () => {
  client.auth.signUp.mockResolvedValue({ error: null });
  await registerAccount(' owner@example.test ', 'test-only-password', ' Owner_Saku ');
  expect(client.auth.signUp).toHaveBeenCalledWith({
    email: 'owner@example.test',
    password: 'test-only-password',
    options: { emailRedirectTo: 'https://example.test', data: { username: 'owner_saku' } },
  });
  await expect(
    registerAccount('owner@example.test', 'test-only-password', 'bad name'),
  ).rejects.toThrow('3–30');
  expect(client.auth.signUp).toHaveBeenCalledTimes(1);
});
it('legacy account claims a handle with own-user RPC and reports collisions', async () => {
  client.rpc.mockResolvedValue({ data: 'owner_saku', error: null });
  expect(await setMyUsername(' Owner_Saku ')).toBe('owner_saku');
  expect(client.rpc).toHaveBeenCalledWith('set_my_username', { p_username: 'owner_saku' });
  client.rpc.mockResolvedValue({ error: { message: 'Username already in use' } });
  await expect(setMyUsername('taken')).rejects.toThrow('sudah dipakai');
});
