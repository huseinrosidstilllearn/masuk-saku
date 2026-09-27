import { useState } from 'react';
import type { Category, Snapshot, Tag } from '../domain/types';
import { catalogIcons, removeCatalog, saveCatalog } from '../lib/catalog-repository';
import { EditorDialog } from './Planning';
import { Icon, type IconName } from './Icon';

export function CatalogManager({
  data,
  onSaved,
}: {
  data: Snapshot;
  onSaved: (message: string) => Promise<void>;
}) {
  const [editor, setEditor] = useState<{
    table: 'categories' | 'tags';
    item: Category | Tag;
    original?: Category | Tag;
  } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (changes: Partial<Category>) =>
    setEditor((old) => old && { ...old, item: { ...old.item, ...changes } });
  async function remove(table: 'categories' | 'tags', item: Category | Tag) {
    if (!window.confirm(`Hapus ${item.name}? Data yang masih digunakan tidak dapat dihapus.`))
      return;
    setBusy(true);
    setError('');
    try {
      await removeCatalog(table, item.id, data);
      await onSaved('Data dihapus.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel catalog-panel">
      <h2>Kategori & tag</h2>
      <p>
        Kelompokkan transaksi keluarga. Subkategori tersedia satu tingkat; tag dapat dipilih lebih
        dari satu.
      </p>
      {error && <p role="alert">{error}</p>}
      {(['categories', 'tags'] as const).map((table) => (
        <section key={table}>
          <div className="catalog-heading">
            <h3>{table === 'categories' ? 'Kategori' : 'Tag'}</h3>
            <button
              disabled={busy}
              onClick={() =>
                setEditor({
                  table,
                  item:
                    table === 'categories'
                      ? {
                          id: crypto.randomUUID(),
                          name: '',
                          parent_id: null,
                          kind: 'expense',
                          color: '#86b49c',
                          icon: 'tag',
                          sort_order: 0,
                        }
                      : { id: crypto.randomUUID(), name: '' },
                })
              }
            >
              <Icon name="plus" />
              Tambah {table === 'categories' ? 'kategori' : 'tag'}
            </button>
          </div>
          {!data[table].length && <p>Belum ada tag. Tambahkan untuk menandai transaksi.</p>}
          {data[table].map((item) => (
            <div className="catalog-row" key={item.id}>
              <span>
                <Icon
                  name={
                    'icon' in item &&
                    catalogIcons.includes(item.icon as (typeof catalogIcons)[number])
                      ? (item.icon as IconName)
                      : 'tag'
                  }
                  style={{
                    color:
                      'color' in item && /^#[0-9a-f]{6}$/i.test(item.color ?? '')
                        ? item.color
                        : undefined,
                  }}
                />{' '}
                {'parent_id' in item && item.parent_id
                  ? `${data.categories.find((c) => c.id === item.parent_id)?.name ?? 'Kategori'} / `
                  : ''}
                {item.name}
                {'kind' in item && (
                  <small>
                    {' '}
                    ·{' '}
                    {item.kind === 'income'
                      ? 'Pemasukan'
                      : item.kind === 'expense'
                        ? 'Pengeluaran'
                        : 'Semua'}
                  </small>
                )}
              </span>
              <div>
                <button
                  disabled={busy}
                  aria-label={`Edit ${item.name}`}
                  onClick={() =>
                    setEditor({
                      table,
                      original: item,
                      item:
                        table === 'categories'
                          ? { color: '#86b49c', icon: 'tag', sort_order: 0, ...item }
                          : { ...item },
                    })
                  }
                >
                  <Icon name="edit" />
                </button>
                <button
                  disabled={busy}
                  aria-label={`Hapus ${item.name}`}
                  onClick={() => remove(table, item)}
                >
                  <Icon name="trash" />
                </button>
              </div>
            </div>
          ))}
        </section>
      ))}
      {editor && (
        <EditorDialog
          title={editor.table === 'categories' ? 'Kelola kategori' : 'Kelola tag'}
          onClose={() => setEditor(null)}
          onSave={async () => {
            await saveCatalog(editor.table, editor.item, data, editor.original);
            await onSaved('Kategori atau tag disimpan.');
          }}
        >
          <label>
            Nama
            <input
              required
              maxLength={editor.table === 'tags' ? 60 : 100}
              value={editor.item.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </label>
          {'kind' in editor.item && (
            <>
              <label>
                Jenis
                <select
                  value={editor.item.kind}
                  onChange={(e) => update({ kind: e.target.value as Category['kind'] })}
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                  <option value="both">Semua</option>
                </select>
              </label>
              <label>
                Kategori induk
                <select
                  value={editor.item.parent_id ?? ''}
                  onChange={(e) => update({ parent_id: e.target.value || null })}
                >
                  <option value="">Tanpa induk</option>
                  {data.categories
                    .filter((c) => !c.parent_id && c.id !== editor.item.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Warna
                <input
                  type="color"
                  value={editor.item.color}
                  onChange={(e) => update({ color: e.target.value })}
                />
              </label>
              <label>
                Ikon
                <select value={editor.item.icon} onChange={(e) => update({ icon: e.target.value })}>
                  {catalogIcons.map((icon) => (
                    <option key={icon}>{icon}</option>
                  ))}
                </select>
              </label>
              <label>
                Urutan
                <input
                  type="number"
                  required
                  min="0"
                  max="9999"
                  value={editor.item.sort_order}
                  onChange={(e) => update({ sort_order: Number(e.target.value) })}
                />
              </label>
            </>
          )}
        </EditorDialog>
      )}
    </section>
  );
}
