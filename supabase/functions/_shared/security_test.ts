import { decryptKey, encryptKey } from './crypto.ts';
import { extractionSchema } from './ai-schema.ts';
Deno.test('AES-GCM roundtrip does not return plaintext ciphertext', async () => {
  Deno.env.set(
    'AI_ENCRYPTION_KEY',
    btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))),
  );
  const data = await encryptKey('unit-test-key-only', 'household:user:v1');
  if (data.ciphertext.includes('unit-test-key-only')) throw new Error('plaintext leak');
  if ((await decryptKey(data.ciphertext, data.iv, 'household:user:v1')) !== 'unit-test-key-only')
    throw new Error('roundtrip failed');
});
Deno.test('AES-GCM rejects cross-user associated data', async () => {
  const data = await encryptKey('test-key', 'household:user:v1');
  let rejected = false;
  try {
    await decryptKey(data.ciphertext, data.iv, 'household:other:v1');
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error('cross-user decryption allowed');
});
Deno.test('provider output schema rejects decimal or out-of-range confidence', () => {
  const output = {
    candidate: {
      type: 'expense',
      amount: 1.5,
      wallet_id: null,
      destination_wallet_id: null,
      occurred_at: null,
      category_id: null,
      merchant: 'Test',
      notes: '',
    },
    confidence: { type: 0.9, amount: 1.2, wallet_id: null, occurred_at: null, category_id: null },
  };
  if (extractionSchema.safeParse(output).success) throw new Error('unsafe model output accepted');
});
