import { useState } from 'react';
import { EventForm, type EventFormInitial } from '../components/EventForm';
import { BreastFeedingPanel } from '../components/BreastFeedingPanel';
import { useToast } from '../components/Toast';
import { useStore } from '../store';

type Tile = {
  label: string;
  emoji: string;
  className?: string;
  /** instant log: returns a quick-log payload, otherwise opens form */
  instant?: () => { message: string; eventId: string | null };
  formInitial?: EventFormInitial;
};

export function LogPage() {
  const addEvent = useStore((s) => s.addEvent);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const toast = useToast();
  const [form, setForm] = useState<EventFormInitial | null>(null);

  const quick = (
    label: string,
    payload: Parameters<typeof addEvent>[0]
  ) => () => {
    const e = addEvent(payload);
    return { message: `${label} logged`, eventId: e?.id ?? null };
  };

  const now = () => new Date().toISOString();

  const tiles: Tile[] = [
    {
      label: 'Pumped',
      emoji: '🍼',
      className: 'tile-feed',
      formInitial: { mode: 'create', type: 'feed', feedKind: 'pumped' }
    },
    {
      label: 'Formula',
      emoji: '🥛',
      className: 'tile-feed',
      formInitial: { mode: 'create', type: 'feed', feedKind: 'formula' }
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
      label: 'Sleep',
      emoji: '😴',
      className: 'tile-sleep',
      formInitial: { mode: 'create', type: 'sleep' }
    }
  ];

  return (
    <section className="page log-page">
      <BreastFeedingPanel />
      <div className="tile-grid">
        {tiles.map((t) => (
          <button
            key={t.label}
            type="button"
            className={`tile ${t.className ?? ''}`}
            onClick={() => {
              if (t.instant) {
                const r = t.instant();
                toast.show(r.message, r.eventId ? () => deleteEvent(r.eventId!) : undefined);
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
