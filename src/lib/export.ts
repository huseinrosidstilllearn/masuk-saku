import type { Snapshot } from '../domain/types';
export function download(snapshot: Snapshot, format: 'json' | 'csv') {
  const rows = snapshot.transactions.filter((t) => !t.deleted_at);
  const csv = (value: unknown) => '"' + String(value ?? '').replaceAll('"', '""') + '"';
  // Prefix formula-like strings to avoid spreadsheet formula execution.
  const safe = (v: unknown) => (typeof v === 'string' && /^[=+@\-\t\r]/.test(v) ? "'" + v : v);
  const fields = [
    'id',
    'type',
    'amount',
    'wallet_id',
    'transaction_actor',
    'transaction_scope',
    'status',
    'occurred_at',
    'merchant',
    'notes',
  ] as const;
  const text =
    format === 'json'
      ? JSON.stringify(
          {
            schema_version: 1,
            exported_at: new Date().toISOString(),
            kind: 'household_snapshot',
            data: snapshot,
          },
          null,
          2,
        )
      : '\uFEFF' +
        fields.join(',') +
        '\r\n' +
        rows.map((t) => fields.map((k) => csv(safe(t[k]))).join(',')).join('\r\n');
  const url = URL.createObjectURL(
    new Blob([text], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'masuk-saku.' + format;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
