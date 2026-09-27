import { credentialSchema } from '../_shared/openrouter.ts';
import { body, databaseError, HttpError, serve, userContext } from '../_shared/http.ts';
import { encryptKey } from '../_shared/crypto.ts';
const schema = credentialSchema;
serve(async (req) => {
  const parsed = schema.safeParse(await body(req));
  if (!parsed.success) throw new HttpError(400, 'Invalid credential request');
  const input = parsed.data;
  const { user, service } = await userContext(req, input.household_id);
  const encrypted = await encryptKey(input.api_key, input.household_id + ':' + user.id + ':v1');
  const result = await service.rpc('store_ai_credential', {
    p_household: input.household_id,
    p_user: user.id,
    p_ciphertext: encrypted.ciphertext,
    p_iv: encrypted.iv,
    p_model: input.model,
  });
  databaseError(result.error);
  return { saved: true, provider: 'openrouter', model: input.model };
});
