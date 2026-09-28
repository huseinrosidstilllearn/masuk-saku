import type { SupabaseClient } from '@supabase/supabase-js';

type Client = Pick<SupabaseClient, 'channel' | 'removeChannel'>;

export function subscribeHousehold(
  client: Client,
  household: string,
  user: string,
  refresh: () => void,
) {
  let active = true;
  const notify = () => {
    if (active) refresh();
  };
  let channel = client.channel('household:' + household + ':' + user, {
    config: { postgres_changes_options: { wait: true } },
  });
  for (const table of [
    'transactions',
    'wallets',
    'budgets',
    'household_members',
    'goal_contributions',
    'savings_goals',
  ])
    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: 'household_id=eq.' + household },
      notify,
    );
  // Changes committed before replication joins are not replayed. Catch up once
  // the subscription is ready, including after a reconnect.
  channel.on('system', {}, (payload) => {
    if (payload.status === 'ok') notify();
  });
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') notify();
  });
  return () => {
    active = false;
    void client.removeChannel(channel);
  };
}
