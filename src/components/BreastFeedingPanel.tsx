import { useEffect, useRef, useState } from 'react';
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

function formatRemaining(ms: number): string {
  const sign = ms < 0 ? '-' : '';
  return sign + formatElapsed(Math.abs(ms));
}

function beep() {
  try {
    const win = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctx = win.AudioContext || win.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const tone = (delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.4);
    };
    tone(0);
    tone(0.5);
    tone(1.0);
    setTimeout(() => ctx.close().catch(() => {}), 1800);
  } catch {
    /* ignore */
  }
}

function notify(title: string, body: string) {
  try {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, tag: 'baby-copilot-feed' });
    }
  } catch {
    /* ignore */
  }
}

function ensureNotificationPermission() {
  try {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

export function BreastFeedingPanel() {
  const timer = useStore((s) => s.activeBreastTimer);
  const start = useStore((s) => s.startBreastTimer);
  const stop = useStore((s) => s.stopBreastTimer);
  const cancel = useStore((s) => s.cancelBreastTimer);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const toast = useToast();

  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // Reminder when target reached
  useEffect(() => {
    if (!timer || !timer.targetMin) return;
    const targetMs = new Date(timer.startTime).getTime() + timer.targetMin * 60000;
    const key = `${timer.startTime}:${timer.targetMin}`;
    if (now >= targetMs && firedRef.current !== key) {
      firedRef.current = key;
      const sideLabel = timer.side === 'left' ? 'Left' : 'Right';
      beep();
      notify('Feeding time reached', `${sideLabel} breast · ${timer.targetMin} min`);
      toast.show(`⏰ ${sideLabel} ${timer.targetMin} min reached`);
    }
  }, [now, timer, toast]);

  if (timer) {
    const startMs = new Date(timer.startTime).getTime();
    const elapsedMs = now - startMs;
    const target = timer.targetMin;
    const reached = target ? elapsedMs >= target * 60000 : false;
    const remainingMs = target ? target * 60000 - elapsedMs : 0;
    const sideLabel = timer.side === 'left' ? 'Left' : timer.side === 'right' ? 'Right' : 'Both';
    return (
      <section className={`breast-panel running${reached ? ' reached' : ''}`}>
        <div className="breast-panel-head">
          <span className="breast-panel-icon">🤱</span>
          <span className="breast-panel-title">
            Breast feeding · {sideLabel}
            {target ? ` · target ${target}m` : ''}
          </span>
        </div>
        <div className="breast-timer" aria-live="polite">
          {formatElapsed(elapsedMs)}
        </div>
        {target ? (
          <div className="breast-target-row">
            {reached ? (
              <span className="breast-target-reached">⏰ Time's up · +{formatElapsed(-remainingMs)}</span>
            ) : (
              <span className="breast-target-remaining">{formatRemaining(remainingMs)} remaining</span>
            )}
          </div>
        ) : null}
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
                onClick={() => {
                  ensureNotificationPermission();
                  start(s);
                }}
              >
                ▶ Start
              </button>
              <div className="preset-row">
                {PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="chip"
                    title={`Start ${m} min timer`}
                    onClick={() => {
                      ensureNotificationPermission();
                      start(s, m);
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
