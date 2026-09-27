import { supabase } from './supabase';
import { catalogDemo, removeCatalogDemo } from './demo';
import { writePlanning } from './planning-repository';
import type { Category, Snapshot, Tag } from '../domain/types';

export const catalogIcons = [
  'tag',
  'expense',
  'income',
  'budget',
  'goal',
  'bank',
  'wallet',
] as const;
export function validateCatalog(
  table: 'categories' | 'tags',
  item: Category | Tag,
  data: Snapshot,
) {
  if (!item.name.trim() || item.name.length > (table === 'tags' ? 60 : 100))
    throw new Error('Nama terlalu panjang atau kosong.');
  if (table === 'tags') {
    if (data.tags.some((t) => t.id !== item.id && t.name === item.name.trim()))
      throw new Error('Nama tag sudah digunakan.');
    return;
  }
  const c = item as Category;
  if (
    !['income', 'expense', 'both'].includes(c.kind) ||
    !/^#[0-9a-f]{6}$/i.test(c.color ?? '') ||
    !catalogIcons.includes(c.icon as (typeof catalogIcons)[number]) ||
    !Number.isInteger(c.sort_order) ||
    c.sort_order! < 0 ||
    c.sort_order! > 9999
  )
    throw new Error('Jenis, warna, ikon, atau urutan kategori tidak valid.');
  if (
    c.parent_id &&
    (c.parent_id === c.id ||
      !data.categories.some((p) => p.id === c.parent_id && !p.parent_id) ||
      data.categories.some((p) => p.parent_id === c.id))
  )
    throw new Error('Subkategori hanya boleh satu tingkat.');
}
export async function saveCatalog(
  table: 'categories' | 'tags',
  item: Category | Tag,
  data: Snapshot,
  original?: Category | Tag,
) {
  const value = { ...item, name: item.name.trim() };
  validateCatalog(table, value, data);
  if (!supabase) return catalogDemo(table, value, original);
  await writePlanning(
    table,
    { ...value, household_id: data.household.id },
    original ? { ...original } : undefined,
  );
}
export async function removeCatalog(table: 'categories' | 'tags', id: string, data: Snapshot) {
  if (!supabase) return removeCatalogDemo(table, id);
  const result = await supabase
    .from(table)
    .delete()
    .eq('id', id)
    .eq('household_id', data.household.id)
    .select('id');
  if (result.error)
    throw new Error(
      result.error.code === '23503'
        ? 'Masih digunakan. Ubah referensinya terlebih dahulu.'
        : result.error.message,
    );
  if (!result.data?.length)
    throw new Error('Data sudah berubah atau akses tidak tersedia. Muat ulang halaman.');
}
