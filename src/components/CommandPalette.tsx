import { useEffect, useState } from 'react';
import { useMotionDialog } from '../lib/motion';
export function CommandPalette({
  pages,
  onNavigate,
  onSearch,
  onClose,
}: {
  pages: { id: string; label: string }[];
  onNavigate: (id: string) => void;
  onSearch: (text: string) => void;
  onClose: () => void;
}) {
  const { ref, close } = useMotionDialog(onClose),
    [query, setQuery] = useState('');
  useEffect(() => {
    ref.current?.querySelector('input')?.focus();
  }, [ref]);
  return (
    <dialog
      ref={ref}
      aria-labelledby="command-title"
      className="planning-dialog"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          close(() => onSearch(query));
        }}
      >
        <h2 id="command-title">Cari atau buka menu</h2>
        <label>
          Pencarian global
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Transaksi, dompet, kategori, tag…"
          />
        </label>
        <button className="primary">Cari transaksi</button>
        <div className="command-options">
          {pages
            .filter((p) =>
              p.label.toLocaleLowerCase('id-ID').includes(query.toLocaleLowerCase('id-ID')),
            )
            .map((p) => (
              <button type="button" key={p.id} onClick={() => close(() => onNavigate(p.id))}>
                {p.label}
              </button>
            ))}
        </div>
        <button type="button" onClick={() => close()}>
          Tutup
        </button>
      </form>
    </dialog>
  );
}
