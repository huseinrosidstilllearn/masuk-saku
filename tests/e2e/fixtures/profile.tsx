import { createRoot } from 'react-dom/client';
import { Profile } from '../../../src/components/Profile';
export function show() {
  document.getElementById('root')!.hidden = true;
  const target = document.createElement('div');
  document.body.append(target);
  createRoot(target).render(
    <Profile
      userId="11111111-1111-4111-8111-111111111111"
      nickname="Anggota"
      onSaved={async () => {}}
    />,
  );
}
