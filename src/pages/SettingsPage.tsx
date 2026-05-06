import { useStore } from '../store';
import type { DisplayUnit } from '../types';

export function SettingsPage() {
  const unit = useStore((s) => s.settings.displayUnit);
  const setUnit = useStore((s) => s.setUnit);

  return (
    <section className="page settings-page">
      <h2>Settings</h2>
      <label className="field">
        <span>Volume display unit</span>
        <div className="seg">
          {(['ml', 'oz'] as DisplayUnit[]).map((u) => (
            <button
              key={u}
              type="button"
              className={unit === u ? 'on' : ''}
              onClick={() => setUnit(u)}
            >
              {u}
            </button>
          ))}
        </div>
      </label>
      <p className="hint">
        Volumes are stored internally in millilitres. Switching units only changes how they’re shown.
      </p>
    </section>
  );
}
