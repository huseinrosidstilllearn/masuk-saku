/** Collect every row, including API servers whose response cap is below our page size. */
export async function collectPages<T>(
  fetchPage: (
    offset: number,
    size: number,
  ) => Promise<{ data: T[] | null; count: number | null; error: { message: string } | null }>,
) {
  const rows: T[] = [];
  let total: number | null = null;
  do {
    const page = await fetchPage(rows.length, 500);
    if (page.error) throw new Error(page.error.message);
    total ??= page.count;
    if (!page.data?.length) {
      if (total !== null && rows.length < total)
        throw new Error('Data berubah saat dimuat. Coba muat ulang.');
      break;
    }
    rows.push(...page.data);
    if (total === null && page.data.length < 500) break;
  } while (total === null || rows.length < total);
  return rows;
}
