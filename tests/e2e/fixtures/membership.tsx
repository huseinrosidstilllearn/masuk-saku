import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { loadDemo } from '../../../src/lib/demo';
import { HouseholdManager } from '../../../src/components/Household';
function Fixture() {
  const [data, setData] = useState(loadDemo());
  return (
    <HouseholdManager
      data={data}
      isOwner
      onSaved={async () =>
        setData({
          ...data,
          members: data.members.map((m) => (m.role === 'member' ? { ...m, active: false } : m)),
        })
      }
    />
  );
}
export function show() {
  document.getElementById('root')!.hidden = true;
  const target = document.createElement('div');
  document.body.append(target);
  createRoot(target).render(<Fixture />);
}
