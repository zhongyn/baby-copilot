import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { useToast } from './Toast';
import type { BreastSide } from '../types';

const SIDES: Exclude<BreastSide, 'both'>[] = ['left', 'right'];
const PRESETS = [5, 10, 15, 20];

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function BreastFeedingPanel() {
  const timer = useStore((s) => s.activeBreastTimer);
  const start = useStore((s) => s.startBreastTimer);
  const stop = useStore((s) => s.stopBreastTimer);
  const cancel = useStore((s) => s.cancelBreastTimer);
  const preset = useStore((s) => s.logBreastPreset);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const toast = useToast();

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);

  if (timer) {
    const elapsedMs = now - new Date(timer.startTime).getTime();
    const sideLabel = timer.side === 'left' ? 'Left' : timer.side === 'right' ? 'Right' : 'Both';
    return (
      <section className="breast-panel running">
        <div className="breast-panel-head">
          <span className="breast-panel-icon">🤱</span>
          <span className="breast-panel-title">Breast feeding · {sideLabel}</span>
        </div>
        <div className="breast-timer" aria-live="polite">{formatElapsed(elapsedMs)}</div>
        <div className="breast-actions">
          <button
            type="button"
            className="primary"
            onClick={() => {
              const e = stop();
              if (e && e.feedKind === 'breast') {
                toast.show(`Saved ${e.durationMin} min`, () => deleteEvent(e.id));
              }
            }}
          >
            Stop &amp; save
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Discard this feeding session?')) cancel();
            }}
          >
            Cancel
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="breast-panel idle">
      <div className="breast-panel-head">
        <span className="breast-panel-icon">🤱</span>
        <span className="breast-panel-title">Breast feeding</span>
      </div>
      <div className="breast-sides">
        {SIDES.map((s) => {
          const label = s === 'left' ? 'Left' : 'Right';
          return (
            <div key={s} className="breast-side">
              <div className="breast-side-label">{label}</div>
              <button
                type="button"
                className="primary breast-start"
                onClick={() => start(s)}
              >
                ▶ Start
              </button>
              <div className="preset-row">
                {PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="chip"
                    onClick={() => {
                      const e = preset(s, m);
                      if (e) toast.show(`${label} · ${m} min logged`, () => deleteEvent(e.id));
                    }}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
