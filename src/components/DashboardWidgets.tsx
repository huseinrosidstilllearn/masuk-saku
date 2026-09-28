import { Children, isValidElement, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { EditorDialog } from './Planning';
const widgets = [
  ['overview', 'Ringkasan keuangan'],
  ['family', 'Anggota keluarga'],
  ['menu', 'Menu aplikasi'],
  ['quick', 'Catat cepat'],
  ['recent', 'Transaksi terbaru'],
  ['breakdown', 'Kategori dan anggaran'],
  ['wallets', 'Dompet'],
  ['goals', 'Target tabungan'],
] as const;
export function parseLayout(value: unknown) {
  if (!Array.isArray(value)) return widgets.map(([id]) => ({ id, visible: true }));
  const seen = new Set<string>();
  const valid = value
    .filter(
      (r) =>
        r &&
        typeof r === 'object' &&
        widgets.some(([id]) => id === r.id) &&
        typeof r.visible === 'boolean' &&
        !seen.has(r.id) &&
        seen.add(r.id),
    )
    .map((r) => ({
      id: String(r.id),
      visible: r.id === 'overview' || r.id === 'menu' || r.visible,
    }));
  return [
    ...valid,
    ...widgets.filter(([id]) => !seen.has(id)).map(([id]) => ({ id, visible: true })),
  ];
}
export function DashboardWidgets({
  household,
  user,
  children,
}: {
  household: string;
  user: string;
  children: ReactNode;
}) {
  const [layout, setLayout] = useState(() => parseLayout(null)),
    [draft, setDraft] = useState(layout),
    [editing, setEditing] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    setLayout(parseLayout(null));
    if (supabase)
      supabase
        .from('member_preferences')
        .select('dashboard_layout')
        .eq('household_id', household)
        .eq('user_id', user)
        .maybeSingle()
        .then(({ data, error }) => {
          if (live) {
            if (error) setError('Susunan dashboard belum dapat dimuat.');
            else setLayout(parseLayout(data?.dashboard_layout));
          }
        });
    return () => {
      live = false;
    };
  }, [household, user]);
  const parts = Children.toArray(children).filter(isValidElement);
  return (
    <div className="dashboard-widgets">
      <div className="widget-controls">
        <button
          onClick={() => {
            setDraft(layout.map((r) => ({ ...r })));
            setEditing(true);
          }}
        >
          Atur dashboard
        </button>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {layout
        .filter((r) => r.visible)
        .map((r) => {
          const part = parts.find(
            (p) => (p.props as Record<string, unknown>)['data-widget'] === r.id,
          );
          return part ? <div key={r.id}>{part}</div> : null;
        })}
      {editing && (
        <EditorDialog
          title="Susun dashboard saya"
          onClose={() => setEditing(false)}
          onSave={async () => {
            if (supabase) {
              const result = await supabase
                .from('member_preferences')
                .upsert(
                  { household_id: household, user_id: user, dashboard_layout: draft },
                  { onConflict: 'household_id,user_id' },
                );
              if (result.error) throw new Error('Susunan belum tersimpan.');
            }
            setLayout(parseLayout(draft));
          }}
        >
          <p>Susunan berlaku untuk akunmu. Ringkasan dan menu selalu tersedia.</p>
          {draft.map((r, index) => (
            <div className="recurring-row" key={r.id}>
              <label>
                <input
                  type="checkbox"
                  checked={r.visible}
                  disabled={r.id === 'overview' || r.id === 'menu'}
                  onChange={(e) =>
                    setDraft(
                      draft.map((item) =>
                        item.id === r.id ? { ...item, visible: e.target.checked } : item,
                      ),
                    )
                  }
                />
                {widgets.find(([id]) => id === r.id)?.[1]}
              </label>
              <div className="row-actions">
                <button
                  type="button"
                  aria-label={'Naikkan ' + widgets.find(([id]) => id === r.id)?.[1]}
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...draft];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    setDraft(next);
                  }}
                >
                  Naik
                </button>
                <button
                  type="button"
                  aria-label={'Turunkan ' + widgets.find(([id]) => id === r.id)?.[1]}
                  disabled={index === draft.length - 1}
                  onClick={() => {
                    const next = [...draft];
                    [next[index + 1], next[index]] = [next[index], next[index + 1]];
                    setDraft(next);
                  }}
                >
                  Turun
                </button>
              </div>
            </div>
          ))}
        </EditorDialog>
      )}
    </div>
  );
}
