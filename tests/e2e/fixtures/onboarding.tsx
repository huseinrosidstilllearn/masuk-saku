// Browser-only component harness; never imported by the application build.
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { Onboarding } from '../../../src/components/Auth';

export function show() {
  document.getElementById('root')!.hidden = true;
  const root = document.createElement('div');
  document.body.append(root);
  createRoot(root).render(
    createElement(Onboarding, {
      done: () => {
        document.body.dataset.joinDone = 'true';
      },
    }),
  );
}
