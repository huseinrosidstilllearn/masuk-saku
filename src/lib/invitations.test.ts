import { expect, it, vi } from 'vitest';
vi.mock('./supabase', () => ({ supabase: null }));
import { acceptInvitation, createInvitation, invitationCode, listInvitations } from './invitations';
it('creates unguessable-format codes independently without browser persistence', () => {
  const codes = Array.from({ length: 100 }, () => invitationCode());
  expect(new Set(codes).size).toBe(100);
  expect(codes.every((code) => /^[a-f0-9]{64}$/.test(code))).toBe(true);
});
it('demo cannot issue or accept a real invitation', async () => {
  expect(await listInvitations('demo')).toEqual([]);
  await expect(
    createInvitation('demo', 'fake@example.test', crypto.randomUUID(), invitationCode()),
  ).rejects.toThrow('Mode demo');
  await expect(acceptInvitation('invalid', 'Name')).rejects.toThrow('64 karakter');
  await expect(acceptInvitation(invitationCode(), 'Name')).rejects.toThrow('Mode demo');
});
