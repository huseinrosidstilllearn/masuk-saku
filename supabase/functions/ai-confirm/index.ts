import { z } from 'zod';
import { body, databaseError, HttpError, serve, userContext } from '../_shared/http.ts';
const schema = z
  .object({
    draft_id: z.string().uuid(),
    input: z.record(z.string(), z.unknown()),
    acknowledged: z.array(z.enum(['amount', 'wallet_id', 'occurred_at', 'type'])),
    request_key: z.string().uuid(),
  })
  .strict();
serve(async (req) => {
  const result = schema.safeParse(await body(req));
  if (!result.success) throw new HttpError(400, 'Invalid confirmation');
  const input = result.data,
    household = z.string().uuid().safeParse(input.input.household_id);
  if (!household.success) throw new HttpError(400, 'Household required');
  const { client, service } = await userContext(req, household.data);
  const committed = await client.rpc('confirm_ai_draft', {
    p_draft_id: input.draft_id,
    p_input: input.input,
    p_acknowledged: input.acknowledged,
    p_request_key: input.request_key,
  });
  if (committed.error) throw new HttpError(400, committed.error.message);
  const attachments = await service
    .from('attachments')
    .select('id,object_path')
    .eq('draft_id', input.draft_id)
    .eq('retention', 'immediate')
    .is('removed_at', null);
  databaseError(attachments.error);
  let cleanup_pending = false;
  for (const a of attachments.data ?? []) {
    const removed = await service.storage.from('receipts').remove([a.object_path]);
    if (removed.error) {
      cleanup_pending = true;
      continue;
    }
    const marked = await service
      .from('attachments')
      .update({ removed_at: new Date().toISOString() })
      .eq('id', a.id);
    if (marked.error) cleanup_pending = true;
  }
  return { transaction_id: committed.data, cleanup_pending };
});
