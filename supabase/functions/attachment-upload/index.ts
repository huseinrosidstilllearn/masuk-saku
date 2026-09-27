import { z } from 'zod';
import { databaseError, HttpError, multipart, serve, userContext } from '../_shared/http.ts';
serve(
  async (req) => {
    const form = await multipart(req),
      household = z.string().uuid().safeParse(form.get('household_id')),
      file = form.get('file');
    if (!household.success || !(file instanceof File) || file.size < 1 || file.size > 10485760) {
      throw new HttpError(400, 'Invalid attachment (maximum 10 MiB)');
    }
    const { user, service } = await userContext(req, household.data);
    const raw = new Uint8Array(await file.arrayBuffer());
    const signature = Array.from(raw.slice(0, 12));
    const jpeg = signature[0] === 255 && signature[1] === 216 && signature[2] === 255;
    const png = signature.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10';
    const pdf = new TextDecoder().decode(raw.slice(0, 5)) === '%PDF-';
    const webp =
      new TextDecoder().decode(raw.slice(0, 4)) === 'RIFF' &&
      new TextDecoder().decode(raw.slice(8, 12)) === 'WEBP';
    if (!(
      (file.type === 'image/jpeg' && jpeg) ||
      (file.type === 'image/png' && png) ||
      (file.type === 'image/webp' && webp) ||
      (file.type === 'application/pdf' && pdf)
    )) {
      throw new HttpError(400, 'Only verified JPEG, PNG, WebP or PDF files allowed');
    }
    const id = crypto.randomUUID(),
      path = household.data + '/' + user.id + '/' + id;
    const uploaded = await service.storage
      .from('receipts')
      .upload(path, raw, { contentType: file.type, upsert: false });
    databaseError(uploaded.error);
    const insert = await service.from('attachments').insert({
      id,
      household_id: household.data,
      created_by: user.id,
      object_path: path,
      mime_type: file.type,
      size_bytes: file.size,
    });
    if (insert.error) {
      await service.storage.from('receipts').remove([path]);
      databaseError(insert.error);
    }
    return { attachment_id: id, expires_in_hours: 24 };
  },
  11 * 1024 * 1024,
);
