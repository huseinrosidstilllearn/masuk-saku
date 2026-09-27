import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { ReceiptCapture } from '../../../src/components/ReceiptCapture';
import { TransactionForm } from '../../../src/components/TransactionForm';
import { loadDemo, demoUser } from '../../../src/lib/demo';
import type { CapturePreview } from '../../../src/lib/receipt-capture';

function Fixture() {
  const [preview, setPreview] = useState<{ result: CapturePreview; file: File } | null>(null);
  const [open, setOpen] = useState(true);
  return preview ? (
    <TransactionForm
      data={loadDemo()}
      user={demoUser}
      initial={preview.result.candidate}
      confidence={preview.result.confidence}
      receiptFile={preview.file}
      onClose={() => setPreview(null)}
      onSave={async () => {
        throw new Error('Test must never commit');
      }}
    />
  ) : open ? (
    <ReceiptCapture
      household="11111111-1111-4111-8111-111111111111"
      retention="24h"
      hide={false}
      initialMode="camera"
      onClose={() => setOpen(false)}
      onManual={() => setOpen(false)}
      onSettings={() => setOpen(false)}
      onPreview={(result, file) => setPreview({ result, file })}
    />
  ) : null;
}
export function show() {
  document.getElementById('root')!.hidden = true;
  const target = document.createElement('div');
  document.body.append(target);
  createRoot(target).render(<Fixture />);
}
