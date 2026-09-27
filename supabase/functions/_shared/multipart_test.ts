import { HttpError, multipart } from './http.ts';

Deno.test(
  'malformed upload types and boundaries are client errors, not server failures',
  async () => {
    for (const headers of [
      { 'content-type': 'application/json' },
      { 'content-type': 'multipart/form-data' },
      { 'content-type': 'multipart/form-data; boundary=missing' },
    ]) {
      try {
        await multipart(
          new Request('https://example.test/upload', {
            method: 'POST',
            headers,
            body: '{}',
          }),
        );
        throw new Error('Malformed request accepted');
      } catch (e) {
        if (!(e instanceof HttpError) || e.status !== 400) throw e;
      }
    }
  },
);
Deno.test('valid browser multipart preserves household and file bytes', async () => {
  const form = new FormData();
  form.set('household_id', 'test-household');
  form.set(
    'file',
    new File([new Uint8Array([137, 80, 78, 71])], 'receipt.png', {
      type: 'image/png',
    }),
  );
  const parsed = await multipart(
    new Request('https://example.test/upload', { method: 'POST', body: form }),
  );
  const file = parsed.get('file');
  if (
    parsed.get('household_id') !== 'test-household' ||
    !(file instanceof File) ||
    file.size !== 4 ||
    file.type !== 'image/png'
  )
    throw new Error('Multipart data changed');
});
