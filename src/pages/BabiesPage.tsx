import { useState } from 'react';
import { useStore } from '../store';

export function BabiesPage() {
  const babies = useStore((s) => s.babies);
  const activeId = useStore((s) => s.settings.activeBabyId);
  const addBaby = useStore((s) => s.addBaby);
  const updateBaby = useStore((s) => s.updateBaby);
  const deleteBaby = useStore((s) => s.deleteBaby);
  const setActiveBaby = useStore((s) => s.setActiveBaby);

  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');

  return (
    <section className="page babies-page">
      <h2>Babies</h2>
      <ul className="baby-list">
        {babies.map((b) => (
          <li key={b.id} className="baby-row">
            <div className="baby-fields">
              <input
                value={b.name}
                onChange={(e) => updateBaby(b.id, { name: e.target.value })}
              />
              <input
                type="date"
                value={b.birthDate ?? ''}
                onChange={(e) => updateBaby(b.id, { birthDate: e.target.value || undefined })}
              />
            </div>
            <div className="baby-actions">
              <button
                type="button"
                className={activeId === b.id ? 'primary' : ''}
                onClick={() => setActiveBaby(b.id)}
                disabled={activeId === b.id}
              >
                {activeId === b.id ? 'Active' : 'Set active'}
              </button>
              <button
                type="button"
                className="danger"
                disabled={babies.length <= 1}
                onClick={() => {
                  if (confirm(`Delete ${b.name} and all their events?`)) deleteBaby(b.id);
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <h3>Add baby</h3>
      <form
        className="add-baby"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addBaby(name, birth || undefined);
          setName('');
          setBirth('');
        }}
      >
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
        <button type="submit" className="primary">Add</button>
      </form>
    </section>
  );
}
