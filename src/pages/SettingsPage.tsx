import { useStore } from '../store';
import type { DisplayUnit, ThemePreference } from '../types';

export function SettingsPage() {
  const unit = useStore((s) => s.settings.displayUnit);
  const setUnit = useStore((s) => s.setUnit);
  const theme = useStore((s) => s.settings.theme);
  const setTheme = useStore((s) => s.setTheme);

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

      <label className="field">
        <span>Theme</span>
        <div className="seg">
          {(['system', 'light', 'dark'] as ThemePreference[]).map((t) => (
            <button
              key={t}
              type="button"
              className={theme === t ? 'on' : ''}
              onClick={() => setTheme(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </label>
      <p className="hint">“System” follows your device’s light/dark setting.</p>
    </section>
  );
}
