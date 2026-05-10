import { NavLink } from 'react-router-dom';
import { useStore } from '../store';

export function Header() {
  const babies = useStore((s) => s.babies);
  const activeId = useStore((s) => s.settings.activeBabyId);
  const setActiveBaby = useStore((s) => s.setActiveBaby);

  return (
    <header className="app-header">
      <div className="app-header-row">
        <h1 className="app-title">👶 Baby Copilot</h1>
        {babies.length > 0 && (
          <select
            className="baby-switch"
            value={activeId ?? ''}
            onChange={(e) => setActiveBaby(e.target.value)}
            aria-label="Active baby"
          >
            {babies.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <nav className="app-nav">
        <NavLink to="/" end>Log</NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/stats">Stats</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
    </header>
  );
}
