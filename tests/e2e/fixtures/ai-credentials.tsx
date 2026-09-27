import { createRoot } from 'react-dom/client';
import { AiCredentials } from '../../../src/components/AiCredentials';
export function show() {
  document.getElementById('root')!.hidden = true;
  const target = document.createElement('div');
  document.body.append(target);
  createRoot(target).render(<AiCredentials household="11111111-1111-4111-8111-111111111111" />);
}
