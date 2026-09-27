import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { Auth } from '../../../src/components/Auth';

export function show(path?: string) {
  if (path) window.history.replaceState(null, '', path);
  document.getElementById('root')!.hidden = true;
  const root = document.createElement('div');
  document.body.append(root);
  createRoot(root).render(createElement(Auth));
}
