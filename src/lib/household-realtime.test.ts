import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { subscribeHousehold } from './household-realtime';

function fixture() {
  const listeners = new Map<string, (payload: { status?: string }) => void>();
  let status: ((status: string) => void) | undefined;
  const channel = {
    on: vi.fn(
      (type: string, _filter: unknown, callback: (payload: { status?: string }) => void) => {
        listeners.set(type, callback);
        return channel;
      },
    ),
    subscribe: vi.fn((callback?: (value: string) => void) => {
      status = callback;
      return channel;
    }),
  };
  const client = {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(async () => 'ok'),
  };
  return {
    client,
    typed: client as unknown as Pick<SupabaseClient, 'channel' | 'removeChannel'>,
    joined: () => status?.('SUBSCRIBED'),
    signal: (type: string, payload = {}) => listeners.get(type)?.(payload),
  };
}

it('catches a committed change between the first snapshot and delayed subscription/reconnection', () => {
  const backend = fixture();
  let savedBalance = 150000;
  let displayedBalance = savedBalance;
  const stop = subscribeHousehold(backend.typed, 'family', 'member', () => {
    displayedBalance = savedBalance;
  });
  savedBalance += 20000; // No notification exists yet: the socket is still joining.
  backend.joined();
  expect(displayedBalance).toBe(170000);
  savedBalance -= 1000; // A reconnect must catch up even without a change event.
  backend.joined();
  expect(displayedBalance).toBe(169000);
  stop();
});

it('refreshes on replication readiness and prevents old channels refreshing a later session', () => {
  const backend = fixture(),
    refresh = vi.fn();
  const stop = subscribeHousehold(backend.typed, 'family', 'member', refresh);
  backend.signal('system', { status: 'ok' });
  expect(refresh).toHaveBeenCalledOnce();
  backend.signal('postgres_changes');
  expect(refresh).toHaveBeenCalledTimes(2);
  stop();
  backend.joined();
  backend.signal('system', { status: 'ok' });
  backend.signal('postgres_changes');
  expect(refresh).toHaveBeenCalledTimes(2);
  expect(backend.client.removeChannel).toHaveBeenCalledOnce();
});
