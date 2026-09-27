import { z } from 'zod';
export const FREE_MODEL = 'openrouter/free';
export const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export const credentialSchema = z
  .object({
    household_id: z.string().uuid(),
    api_key: z.string().min(16).max(512),
    provider: z.literal('openrouter').default('openrouter'),
    model: z.literal(FREE_MODEL).default(FREE_MODEL),
  })
  .strict();
export function isFreeCredential(value: { provider?: string; model?: string }) {
  return value.provider === 'openrouter' && value.model === FREE_MODEL;
}
export function freeRequest(
  prompt: string,
  content: Record<string, unknown>[],
  credential: { provider?: string; model?: string },
) {
  if (!isFreeCredential(credential))
    throw new Error('Replace legacy credential with OpenRouter key');
  return {
    model: FREE_MODEL,
    temperature: 0,
    max_tokens: 1200,
    stream: false,
    response_format: { type: 'json_object' },
    provider: {
      require_parameters: true,
      data_collection: 'deny',
      max_price: { prompt: 0, completion: 0, request: 0, image: 0 },
    },
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content },
    ],
  };
}
