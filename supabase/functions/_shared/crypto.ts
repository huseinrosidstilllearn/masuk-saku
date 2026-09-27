import { env, HttpError } from './http.ts';
const encoder = new TextEncoder();
function bytes(base64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
function base64(data: Uint8Array) {
  let s = '';
  for (const b of data) s += String.fromCharCode(b);
  return btoa(s);
}
async function encryptionKey() {
  let raw: Uint8Array<ArrayBuffer>;
  try {
    raw = bytes(env('AI_ENCRYPTION_KEY'));
  } catch {
    throw new HttpError(503, 'Invalid encryption configuration');
  }
  if (raw.length !== 32) throw new HttpError(503, 'Invalid encryption configuration');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function encryptKey(value: string, context: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(context) },
    await encryptionKey(),
    encoder.encode(value),
  );
  return { iv: base64(iv), ciphertext: base64(new Uint8Array(ciphertext)) };
}
export async function decryptKey(ciphertext: string, iv: string, context: string) {
  const result = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes(iv), additionalData: encoder.encode(context) },
    await encryptionKey(),
    bytes(ciphertext),
  );
  return new TextDecoder().decode(result);
}
export function encodeBytes(bytes: Uint8Array) {
  return base64(bytes);
}
