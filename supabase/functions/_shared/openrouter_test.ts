import {
  credentialSchema,
  freeRequest,
  isFreeCredential,
  OPENROUTER_ENDPOINT,
} from './openrouter.ts';
function assert(value: boolean, message: string) {
  if (!value) throw new Error(message);
}
Deno.test('OpenRouter settings permit only free router and reject paid/arbitrary routes', () => {
  const input = {
    household_id: '11111111-1111-4111-8111-111111111111',
    api_key: 'test-only-not-a-real-key',
  };
  assert(credentialSchema.parse(input).model === 'openrouter/free', 'wrong default');
  for (const extra of [
    { model: 'openai/gpt-4.1' },
    { provider: 'openai' },
    { base_url: 'https://example.com' },
    { models: ['paid/model'] },
  ])
    assert(
      !credentialSchema.safeParse({ ...input, ...extra }).success,
      'paid/unknown route accepted',
    );
});
Deno.test(
  'free text/image request fixes endpoint, all price caps and JSON parameters without model fallback list',
  () => {
    for (const content of [
      [{ type: 'text', text: 'receipt facts' }],
      [{ type: 'image_url', image_url: { url: 'data:image/png;base64,test' } }],
    ]) {
      const body = freeRequest('extract facts', content, {
        provider: 'openrouter',
        model: 'openrouter/free',
      });
      assert(
        body.model === 'openrouter/free' &&
          OPENROUTER_ENDPOINT === 'https://openrouter.ai/api/v1/chat/completions',
        'wrong route',
      );
      assert(
        Object.values(body.provider.max_price).every((price) => price === 0),
        'nonzero price',
      );
      assert(
        body.provider.require_parameters && body.provider.data_collection === 'deny',
        'missing safeguards',
      );
      assert(
        body.response_format.type === 'json_object' &&
          !('models' in body) &&
          body.messages[1].content === content,
        'request changed',
      );
    }
  },
);
Deno.test('legacy OpenAI key is not silently sent to OpenRouter', () => {
  assert(!isFreeCredential({ provider: 'openai', model: 'gpt-4.1-mini' }), 'legacy key active');
  let failed = false;
  try {
    freeRequest('x', [], { provider: 'openai', model: 'gpt-4.1-mini' });
  } catch {
    failed = true;
  }
  assert(failed, 'legacy key leaked to new provider');
});
