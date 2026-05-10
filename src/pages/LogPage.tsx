import { useEffect, useMemo, useState } from 'react';
import { differenceInMinutes, format } from 'date-fns';
import { EventForm, type EventFormInitial } from '../components/EventForm';
import { BreastFeedingPanel } from '../components/BreastFeedingPanel';
import { useToast } from '../components/Toast';
import { useStore } from '../store';
import { formatVolume } from '../utils/units';

type Tile = {
  label: string;
  emoji: string;
  className?: string;
  /** instant log: returns a quick-log payload, otherwise opens form */
  instant?: () => { message: string; undo?: () => void };
  formInitial?: EventFormInitial;
};

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatSince(iso: string | undefined, nowMs: number): string {
  if (!iso) return '—';
  const diff = Math.max(0, nowMs - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 24) return rem ? `${hours}h ${rem}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function LogPage() {
  const addEvent = useStore((s) => s.addEvent);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const sleepSession = useStore((s) => s.activeSleepSession);
  const startSleep = useStore((s) => s.startSleep);
  const stopSleep = useStore((s) => s.stopSleep);
  const cancelSleep = useStore((s) => s.cancelSleep);
  const events = useStore((s) => s.babyEvents());
  const unit = useStore((s) => s.settings.displayUnit);
  const toast = useToast();
  const [form, setForm] = useState<EventFormInitial | null>(null);

  // Tick periodically so "time since last" stays fresh, more often if a sleep session is active.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const period = sleepSession ? 30_000 : 60_000;
    const id = setInterval(() => setNowMs(Date.now()), period);
    return () => clearInterval(id);
  }, [sleepSession]);

  const todaySummary = useMemo(() => {
    const today = new Date().toDateString();
    let milkMl = 0;
    let breastFeeds = 0;
    let pee = 0;
    let poo = 0;
    let sleepMin = 0;
    for (const e of events) {
      if (new Date(e.startTime).toDateString() !== today) continue;
      if (e.type === 'feed') {
        if (e.feedKind === 'breast') breastFeeds++;
        else milkMl += e.volumeMl;
      } else if (e.type === 'diaper') {
        if (e.diaperKind === 'pee' || e.diaperKind === 'both') pee++;
        if (e.diaperKind === 'poo' || e.diaperKind === 'both') poo++;
      } else if (e.type === 'sleep') {
        sleepMin += differenceInMinutes(new Date(e.endTime), new Date(e.startTime));
      }
    }
    const sh = Math.floor(sleepMin / 60);
    const sm = sleepMin % 60;
    const sleepLabel = sleepMin === 0 ? '0m' : sh > 0 ? `${sh}h ${sm}m` : `${sm}m`;
    return { milkMl, breastFeeds, pee, poo, sleepLabel };
  }, [events]);

  const lastTimes = useMemo(() => {
    let feed: string | undefined;
    let bottle: string | undefined;
    let breast: string | undefined;
    let pee: string | undefined;
    let poo: string | undefined;
    let sleep: string | undefined;
    // events is already sorted newest-first
    for (const e of events) {
      if (e.type === 'feed') {
        if (!feed) feed = e.startTime;
        if (e.feedKind === 'breast') {
          if (!breast) breast = e.startTime;
        } else if (!bottle) bottle = e.startTime;
      } else if (e.type === 'diaper') {
        if ((e.diaperKind === 'pee' || e.diaperKind === 'both') && !pee) pee = e.startTime;
        if ((e.diaperKind === 'poo' || e.diaperKind === 'both') && !poo) poo = e.startTime;
      } else if (e.type === 'sleep') {
        // Use end of sleep — "time since last awake".
        if (!sleep) sleep = e.endTime;
      }
      if (feed && bottle && breast && pee && poo && sleep) break;
    }
    return { feed, bottle, breast, pee, poo, sleep };
  }, [events]);

  const quick = (
    label: string,
    payload: Parameters<typeof addEvent>[0]
  ) => () => {
    const e = addEvent(payload);
    return { message: `${label} logged`, undo: e ? () => deleteEvent(e.id) : undefined };
  };

  const now = () => new Date().toISOString();

  const sleepInstant = () => {
    if (sleepSession) {
      return { message: 'Already sleeping', undo: undefined };
    }
    const ok = startSleep();
    return ok
      ? { message: 'Sleep started', undo: () => cancelSleep() }
      : { message: 'Could not start sleep', undo: undefined };
  };

  const wakeInstant = () => {
    if (!sleepSession) {
      return { message: 'No active sleep', undo: undefined };
    }
    const e = stopSleep();
    if (!e) return { message: 'No active sleep', undo: undefined };
    const mins = Math.max(
      0,
      Math.round((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000)
    );
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const dur = h > 0 ? `${h}h ${m}m` : `${m}m`;
    return { message: `Slept ${dur}`, undo: () => deleteEvent(e.id) };
  };

  const tiles: Tile[] = [
    {
      label: 'Bottle',
      emoji: '🍼',
      className: 'tile-feed',
      formInitial: { mode: 'create', type: 'feed', feedKind: 'bottle' }
    },
    {
      label: 'Pee',
      emoji: '💧',
      className: 'tile-diaper',
      instant: quick('Pee', { type: 'diaper', diaperKind: 'pee', startTime: now() })
    },
    {
      label: 'Poo',
      emoji: '💩',
      className: 'tile-diaper',
      instant: quick('Poo', { type: 'diaper', diaperKind: 'poo', startTime: now() })
    },
    {
      label: 'Pee + Poo',
      emoji: '💧💩',
      className: 'tile-diaper',
      instant: quick('Pee + Poo', { type: 'diaper', diaperKind: 'both', startTime: now() })
    },
    {
      label: sleepSession ? 'Sleeping…' : 'Sleep',
      emoji: '😴',
      className: `tile-sleep${sleepSession ? ' tile-disabled' : ''}`,
      instant: sleepInstant
    },
    {
      label: 'Wake up',
      emoji: '🌅',
      className: `tile-sleep${sleepSession ? ' tile-active' : ' tile-disabled'}`,
      instant: wakeInstant
    }
  ];

  const sleepingMs = sleepSession
    ? Date.now() - new Date(sleepSession.startTime).getTime()
    : 0;

  return (
    <section className="page log-page">
      <div className="today-summary" aria-label="Today summary">
        <span className="today-summary-label">
          Today total <span className="today-summary-date">· {format(new Date(), 'EEE, MMM d')}</span>
        </span>
        <span className="today-summary-item" title="Bottle milk today">
          <span className="today-summary-icon">🍼</span>
          {formatVolume(todaySummary.milkMl, unit)}
        </span>
        <span className="today-summary-item" title="Breast feeds today">
          <span className="today-summary-icon">🤱</span>
          {todaySummary.breastFeeds}
        </span>
        <span className="today-summary-item" title="Pee today">
          <span className="today-summary-icon">💧</span>
          {todaySummary.pee}
        </span>
        <span className="today-summary-item" title="Poo today">
          <span className="today-summary-icon">💩</span>
          {todaySummary.poo}
        </span>
        <span className="today-summary-item" title="Sleep today">
          <span className="today-summary-icon">😴</span>
          {todaySummary.sleepLabel}
        </span>
      </div>
      <div className="today-summary since-summary" aria-label="Time since last">
        <span className="today-summary-label">Time since last</span>
        <span className="today-summary-item" title="Time since last bottle">
          <span className="today-summary-icon">🍼</span>
          {formatSince(lastTimes.bottle, nowMs)}
        </span>
        <span className="today-summary-item" title="Time since last breast feed">
          <span className="today-summary-icon">🤱</span>
          {formatSince(lastTimes.breast, nowMs)}
        </span>
        <span className="today-summary-item" title="Time since last pee">
          <span className="today-summary-icon">💧</span>
          {formatSince(lastTimes.pee, nowMs)}
        </span>
        <span className="today-summary-item" title="Time since last poo">
          <span className="today-summary-icon">💩</span>
          {formatSince(lastTimes.poo, nowMs)}
        </span>
        <span className="today-summary-item" title="Time since last wake up">
          <span className="today-summary-icon">🌅</span>
          {sleepSession ? 'sleeping' : formatSince(lastTimes.sleep, nowMs)}
        </span>
      </div>
      <BreastFeedingPanel />
      {sleepSession && (
        <section className="sleep-panel running">
          <div className="sleep-panel-head">
            <span className="sleep-panel-icon">😴</span>
            <span className="sleep-panel-title">
              Sleeping · {formatElapsed(sleepingMs)}
            </span>
          </div>
          <div className="sleep-actions">
            <button
              type="button"
              className="primary"
              onClick={() => {
                const r = wakeInstant();
                toast.show(r.message, r.undo);
              }}
            >
              🌅 Wake up
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Discard this sleep session?')) cancelSleep();
              }}
            >
              Cancel
            </button>
          </div>
        </section>
      )}
      <div className="tile-grid">
        {tiles.map((t) => (
          <button
            key={t.label}
            type="button"
            className={`tile ${t.className ?? ''}`}
            onClick={() => {
              if (t.instant) {
                const r = t.instant();
                toast.show(r.message, r.undo);
              } else if (t.formInitial) {
                setForm(t.formInitial);
              }
            }}
          >
            <span className="tile-emoji">{t.emoji}</span>
            <span className="tile-label">{t.label}</span>
          </button>
        ))}
      </div>
      {form && <EventForm initial={form} onClose={() => setForm(null)} />}
    </section>
  );
}
