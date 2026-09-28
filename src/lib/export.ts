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
    'destination_wallet_id',
    'scope_member_id',
    'category_id',
    'created_by',
    'parent_transaction_id',
    'source',
    'version',
    'recurring_template_id',
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
        [...fields, 'splits_json', 'tags_json'].join(',') +
        '\r\n' +
        rows
          .map((t) =>
            [
              ...fields.map((k) => csv(safe(t[k]))),
              csv(JSON.stringify(snapshot.splits.filter((s) => s.transaction_id === t.id))),
              csv(
                JSON.stringify(
                  snapshot.transactionTags
                    .filter((s) => s.transaction_id === t.id)
                    .map((s) => snapshot.tags.find((tag) => tag.id === s.tag_id)),
                ),
              ),
            ].join(','),
          )
          .join('\r\n');
  const url = URL.createObjectURL(
    new Blob([text], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'masuk-saku.' + format;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
