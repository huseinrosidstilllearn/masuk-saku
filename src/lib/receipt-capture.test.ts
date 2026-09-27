import { beforeEach, expect, it, vi } from 'vitest';
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('./supabase', () => ({ supabase: { functions: { invoke } }, configured: true }));
import {
  parseCapturePreview,
  previewCapture,
  RECEIPT_MAX_BYTES,
  uploadReceipt,
  validateReceipt,
} from './receipt-capture';
const uuid = '11111111-1111-4111-8111-111111111111';
const png = () =>
  new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], 'receipt.png', {
    type: 'image/png',
  });
const result = () => ({
  draft_id: uuid,
  candidate: {
    type: 'expense',
    amount: 27000,
    wallet_id: uuid,
    destination_wallet_id: null,
    occurred_at: '2026-09-27T12:00:00+07:00',
    category_id: null,
    merchant: 'Belanja',
    notes: '',
  },
  confidence: { type: 0.99, amount: 0.8, wallet_id: 0.6, occurred_at: 0.99, category_id: null },
});
beforeEach(() => invoke.mockReset());
it('rejects PDF, MIME/signature mismatch, empty and oversized files; accepts verified image headers', async () => {
  await expect(validateReceipt(png())).resolves.toBeUndefined();
  await expect(
    validateReceipt(new File(['%PDF-test'], 'receipt.pdf', { type: 'application/pdf' })),
  ).rejects.toThrow(/PDF/);
  await expect(
    validateReceipt(new File(['not png'], 'x.png', { type: 'image/png' })),
  ).rejects.toThrow(/valid/);
  await expect(validateReceipt(new File([], 'empty.png', { type: 'image/png' }))).rejects.toThrow(
    /10 MiB/,
  );
  await expect(
    validateReceipt(
      new File([new Uint8Array(RECEIPT_MAX_BYTES + 1)], 'large.png', { type: 'image/png' }),
    ),
  ).rejects.toThrow(/10 MiB/);
  await expect(
    validateReceipt(new File([new Uint8Array([255, 216, 255])], 'x.jpg', { type: 'image/jpeg' })),
  ).resolves.toBeUndefined();
  await expect(
    validateReceipt(new File(['RIFF0000WEBP'], 'x.webp', { type: 'image/webp' })),
  ).resolves.toBeUndefined();
});
it('does not invent critical fields and rejects malformed AI outputs', () => {
  const value = result();
  Object.assign(value.candidate, { amount: null, wallet_id: null, occurred_at: null, type: null });
  const parsed = parseCapturePreview(value);
  expect(parsed.candidate.amount).toBeUndefined();
  expect(parsed.candidate.wallet_id).toBe('');
  expect(parsed.confidence).toMatchObject({
    amount: null,
    wallet_id: null,
    occurred_at: null,
    type: null,
  });
  expect(() =>
    parseCapturePreview({ ...result(), candidate: { ...result().candidate, amount: 1.5 } }),
  ).toThrow(/tidak valid/);
  expect(() => parseCapturePreview({ ...result(), draft_id: 'bad' })).toThrow(/tidak valid/);
});
it('uploads multipart then extracts an editable draft without invoking confirm or ledger', async () => {
  invoke
    .mockResolvedValueOnce({ data: { attachment_id: uuid }, error: null })
    .mockResolvedValueOnce({ data: result(), error: null });
  const file = png();
  const attachment = await uploadReceipt(uuid, file);
  const preview = await previewCapture(uuid, '  Belanja keluarga  ', attachment);
  expect(attachment).toBe(uuid);
  expect(preview.draft_id).toBe(uuid);
  const [name, options] = invoke.mock.calls[0];
  expect(name).toBe('attachment-upload');
  expect(options.body).toBeInstanceOf(FormData);
  expect(options.body.get('household_id')).toBe(uuid);
  expect(options.body.get('file').name).toBe('receipt.png');
  expect(options.headers).toBeUndefined();
  expect(invoke.mock.calls[1]).toEqual([
    'ai-preview',
    { body: { household_id: uuid, text: 'Belanja keluarga', attachment_id: uuid }, timeout: 45000 },
  ]);
  expect(invoke).toHaveBeenCalledTimes(2);
});
it('localizes missing BYOK and provider failures without exposing response details', async () => {
  invoke.mockResolvedValue({
    data: null,
    error: { message: 'sensitive provider content', context: new Response('', { status: 409 }) },
  });
  await expect(previewCapture(uuid, 'text', uuid)).rejects.toThrow(/BYOK/);
  invoke.mockResolvedValue({
    data: null,
    error: { message: 'sensitive provider content', context: new Response('', { status: 504 }) },
  });
  await expect(previewCapture(uuid, 'text', uuid)).rejects.toThrow(/terlalu lama/);
});
