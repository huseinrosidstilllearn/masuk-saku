import { test, expect } from '@playwright/test';

test('configured photo auto-reads to editable review; provider failure retries the same upload without a ledger write', async ({
  page,
}) => {
  let uploads = 0,
    previews = 0,
    writes = 0;
  await page.route(/https:\/\/[^/]+\.supabase\.co\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
    };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const reply = (value: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers,
        body: JSON.stringify(value),
      });
    if (path === '/functions/v1/attachment-upload') {
      uploads++;
      expect(route.request().postDataBuffer()!.includes(Buffer.from('foto-struk.jpg'))).toBe(true);
      return reply({ attachment_id: '22222222-2222-4222-8222-222222222222' });
    }
    if (path === '/functions/v1/ai-preview') {
      previews++;
      expect(route.request().postDataJSON().attachment_id).toBe(
        '22222222-2222-4222-8222-222222222222',
      );
      if (previews === 1) return reply({ error: 'fixture failure' }, 502);
      return reply({
        draft_id: '33333333-3333-4333-8333-333333333333',
        candidate: {
          type: 'expense',
          amount: 27000,
          wallet_id: null,
          destination_wallet_id: null,
          occurred_at: '2026-09-27T04:00:00Z',
          category_id: null,
          merchant: 'Belanja contoh',
          notes: '',
        },
        confidence: {
          type: 0.95,
          amount: 0.65,
          wallet_id: null,
          occurred_at: 0.9,
          category_id: null,
        },
      });
    }
    if (path.includes('/rpc/') || path === '/functions/v1/ai-confirm') writes++;
    throw new Error('Unexpected backend call: ' + path);
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const stream = canvas.captureStream(10);
        const timer = setInterval(() => {
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, 640, 480);
        }, 50);
        stream.getTracks().forEach((t) => {
          const stop = t.stop.bind(t);
          t.stop = () => {
            clearInterval(timer);
            stop();
          };
        });
        return stream;
      },
    });
  });
  await page.goto('/');
  await page.addScriptTag({
    type: 'module',
    content: "import {show} from '/tests/e2e/fixtures/receipt.tsx';show();",
  });
  const snap = page.getByRole('button', { name: 'Ambil foto & baca AI', exact: true });
  await expect(snap).toBeEnabled();
  await snap.click();
  await expect(page.getByRole('alert')).toContainText('AI belum berhasil membaca struk');
  expect(uploads).toBe(1);
  expect(previews).toBe(1);
  expect(writes).toBe(0);
  await page.getByRole('button', { name: 'Baca dengan AI', exact: true }).click();
  await expect(page.getByLabel('Nominal (rupiah)', { exact: true })).toHaveValue('27000');
  await expect(page.getByLabel('Merchant / keterangan', { exact: true })).toHaveValue(
    'Belanja contoh',
  );
  await page.getByLabel('Nominal (rupiah)', { exact: true }).fill('28000');
  await page.keyboard.press('Escape');
  expect(uploads).toBe(1);
  expect(previews).toBe(2);
  expect(writes).toBe(0);
});
