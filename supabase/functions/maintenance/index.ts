import { admin, databaseError, env, HttpError, serve } from '../_shared/http.ts';
async function constantTimeEqual(a: string, b: string) {
  const digest = (x: string) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(x));
  const [aa, bb] = await Promise.all([digest(a), digest(b)]);
  const x = new Uint8Array(aa),
    y = new Uint8Array(bb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
serve(async (req) => {
  const expected = env('MAINTENANCE_SECRET');
  if (expected.length < 32) throw new HttpError(503, 'Invalid maintenance configuration');
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1] ?? '';
  if (!(await constantTimeEqual(token, expected))) throw new HttpError(401, 'Unauthorized');
  const service = admin();
  const rows = await service
    .from('attachments')
    .select('id,object_path')
    .lte('expires_at', new Date().toISOString())
    .is('removed_at', null)
    .limit(100);
  databaseError(rows.error);
  let removed = 0;
  for (const row of rows.data ?? []) {
    const file = await service.storage.from('receipts').remove([row.object_path]);
    if (file.error) continue;
    const marked = await service
      .from('attachments')
      .update({ removed_at: new Date().toISOString() })
      .eq('id', row.id);
    databaseError(marked.error);
    removed++;
  }
  const purge = await service.rpc('purge_expired_transactions');
  databaseError(purge.error);
  const recurring = await service.rpc('run_recurring_maintenance');
  databaseError(recurring.error);
  const budgets = await service.rpc('run_budget_maintenance');
  databaseError(budgets.error);
  return {
    attachments_removed: removed,
    transactions_purged: purge.data,
    recurring_processed: recurring.data,
    budget_periods_closed: budgets.data,
  };
});
