import { expect, it } from 'vitest';
import { collectPages } from './pagination';
it('collects more than 1000 rows despite a lower server cap and refuses silent truncation', async () => {
  const all = Array.from({ length: 1234 }, (_, i) => i);
  expect(
    await collectPages(async (offset) => ({
      data: all.slice(offset, offset + 100),
      count: all.length,
      error: null,
    })),
  ).toEqual(all);
  await expect(collectPages(async () => ({ data: [], count: 1, error: null }))).rejects.toThrow(
    'Data berubah',
  );
});
