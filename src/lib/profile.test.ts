import { expect, it } from 'vitest';
import { validateAvatar, AVATAR_MAX_BYTES } from './profile';
it('avatar rejects oversized, empty, spoofed and SVG files before upload', async () => {
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  await expect(validateAvatar(new File([png], 'profile.png', { type: 'image/png' }))).resolves.toBe(
    'png',
  );
  await expect(
    validateAvatar(
      new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], 'large.png', { type: 'image/png' }),
    ),
  ).rejects.toThrow(/2 MB/);
  await expect(validateAvatar(new File([], 'empty.png', { type: 'image/png' }))).rejects.toThrow(
    /2 MB/,
  );
  await expect(
    validateAvatar(new File(['<svg/>'], 'image.svg', { type: 'image/svg+xml' })),
  ).rejects.toThrow(/JPEG/);
  await expect(
    validateAvatar(new File(['plain text'], 'image.png', { type: 'image/png' })),
  ).rejects.toThrow(/JPEG/);
});
