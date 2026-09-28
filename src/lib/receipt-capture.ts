import { z } from 'zod';
import { supabase } from './supabase';
import type { TransactionInput } from '../domain/types';

export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;
export async function validateReceipt(file: File) {
  if (!file.size || file.size > RECEIPT_MAX_BYTES)
    throw new Error('Pilih gambar berukuran 1 byte hingga 10 MiB.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const png = Array.from(bytes.slice(0, 8)).join(',') === '137,80,78,71,13,10,26,10';
  const webp =
    new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
    new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
  const pdf = new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-';
  if (!(
    (file.type === 'image/jpeg' && jpeg) ||
    (file.type === 'image/png' && png) ||
    (file.type === 'image/webp' && webp) ||
    (file.type === 'application/pdf' && pdf)
  ))
    throw new Error('Gunakan JPEG, PNG, WebP atau PDF yang valid.');
}
export async function prepareReceipt(file: File): Promise<File> {
  await validateReceipt(file);
  if (file.type !== 'application/pdf') return file;
  const { renderPdfReceipt } = await import('./pdf-receipt');
  const image = await renderPdfReceipt(file);
  await validateReceipt(image);
  return image;
}
const id = z.string().uuid().nullable(),
  score = z.number().min(0).max(1).nullable();
const responseSchema = z.object({
  draft_id: z.string().uuid(),
  candidate: z.object({
    type: z.enum(['income', 'expense', 'transfer']).nullable(),
    amount: z.number().int().min(1).max(9_000_000_000_000).nullable(),
    wallet_id: id,
    destination_wallet_id: id,
    occurred_at: z.string().datetime({ offset: true }).nullable(),
    category_id: id,
    merchant: z.string().max(200),
    notes: z.string().max(2000),
  }),
  confidence: z.object({
    type: score,
    amount: score,
    wallet_id: score,
    occurred_at: score,
    category_id: score,
  }),
});
export interface CapturePreview {
  draft_id: string;
  candidate: Partial<TransactionInput>;
  confidence: Record<string, number | null>;
}
export function parseCapturePreview(value: unknown): CapturePreview {
  const parsed = responseSchema.safeParse(value);
  if (!parsed.success) throw new Error('Hasil AI tidak valid. Coba lagi atau catat manual.');
  const { candidate: c, confidence, draft_id } = parsed.data;
  for (const field of ['amount', 'wallet_id', 'occurred_at', 'type'] as const)
    if (c[field] === null) confidence[field] = null;
  return {
    draft_id,
    confidence,
    candidate: {
      type: c.type ?? undefined,
      amount: c.amount ?? undefined,
      wallet_id: c.wallet_id ?? '',
      destination_wallet_id: c.destination_wallet_id,
      occurred_at: c.occurred_at ?? undefined,
      category_id: c.category_id,
      merchant: c.merchant,
      notes: c.notes,
    },
  };
}
async function edgeError(error: { message: string; context?: unknown } | null) {
  if (!error) return;
  const status = error.context instanceof Response ? error.context.status : 0;
  const messages: Record<number, string> = {
    400: 'File atau informasi tidak valid. Pilih gambar JPEG, PNG, atau WebP.',
    401: 'Sesi berakhir. Masuk kembali sebelum mengunggah struk.',
    403: 'Akses struk ditolak. Pastikan kamu masih anggota keluarga ini.',
    404: 'Lampiran tidak tersedia atau sudah kedaluwarsa. Pilih file kembali.',
    409: 'Periksa kunci BYOK di Pengaturan. Jika lampiran sudah diproses, pilih file kembali.',
    413: 'Ukuran unggahan terlalu besar. Maksimal 10 MiB.',
    422: 'Format ini belum mendukung ekstraksi AI. Gunakan gambar atau catat manual.',
    429: 'Batas preview AI tercapai. Coba nanti atau catat manual.',
    502: 'AI belum berhasil membaca struk. Periksa kunci/kuota BYOK atau catat manual.',
    504: 'AI terlalu lama merespons. Coba lagi atau catat manual.',
  };
  throw new Error(
    messages[status] ?? 'Layanan capture belum dapat dihubungi. Coba lagi atau catat manual.',
  );
}
export async function uploadReceipt(household: string, file: File): Promise<string> {
  if (!supabase) throw new Error('Upload AI memerlukan Supabase dan kunci BYOK.');
  await validateReceipt(file);
  const form = new FormData();
  form.append('household_id', household);
  form.append('file', file);
  const r = await supabase.functions.invoke('attachment-upload', { body: form, timeout: 60000 });
  await edgeError(r.error);
  const parsed = z.object({ attachment_id: z.string().uuid() }).safeParse(r.data);
  if (!parsed.success) throw new Error('Respons upload tidak valid. Pilih file kembali.');
  return parsed.data.attachment_id;
}
export async function previewCapture(
  household: string,
  text?: string,
  attachment?: string,
): Promise<CapturePreview> {
  if (!supabase) throw new Error('Capture AI memerlukan Supabase dan kunci BYOK.');
  const r = await supabase.functions.invoke('ai-preview', {
    timeout: 45000,
    body: {
      household_id: household,
      ...(text?.trim() ? { text: text.trim() } : {}),
      ...(attachment ? { attachment_id: attachment } : {}),
    },
  });
  await edgeError(r.error);
  return parseCapturePreview(r.data);
}
