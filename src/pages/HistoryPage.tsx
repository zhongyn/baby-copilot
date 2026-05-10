import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { AppEvent, EventType } from '../types';
import {
  dayKey,
  eventIcon,
  eventSummary,
  eventTitle,
  formatDateHeader,
  formatTime
} from '../utils/format';
import { EventForm } from '../components/EventForm';

const TYPES: { id: EventType; label: string }[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'diaper', label: 'Diaper' },
  { id: 'sleep', label: 'Sleep' }
];

export function HistoryPage() {
  const events = useStore((s) => s.babyEvents());
  const unit = useStore((s) => s.settings.displayUnit);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const [filters, setFilters] = useState<Set<EventType>>(new Set(['feed', 'diaper', 'sleep']));
  const [editing, setEditing] = useState<AppEvent | null>(null);

  type Row =
    | { kind: 'event'; event: AppEvent; time: string }
    | { kind: 'wake'; event: AppEvent; time: string };

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const e of events) {
      if (!filters.has(e.type)) continue;
      out.push({ kind: 'event', event: e, time: e.startTime });
      if (e.type === 'sleep') {
        out.push({ kind: 'wake', event: e, time: e.endTime });
      }
    }
    out.sort((a, b) => b.time.localeCompare(a.time));
    return out;
  }, [events, filters]);

  const groups = useMemo(() => {
    const m = new Map<string, Row[]>();
    for (const r of rows) {
      const k = dayKey(r.time);
      const arr = m.get(k);
      if (arr) arr.push(r);
      else m.set(k, [r]);
    }
    return Array.from(m.entries());
  }, [rows]);

  const toggle = (t: EventType) =>
    setFilters((s) => {
      const next = new Set(s);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  return (
    <section className="page history-page">
      <div className="filter-row">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip ${filters.has(t.id) ? 'on' : ''}`}
            onClick={() => toggle(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {groups.length === 0 && <p className="empty">No events yet. Log one from the Log tab.</p>}

      {groups.map(([day, items]) => (
        <div key={day} className="day-group">
          <h3 className="day-header">{formatDateHeader(items[0].time)}</h3>
          <ul className="event-list">
            {items.map((r) => {
              const e = r.event;
              const isWake = r.kind === 'wake';
              const icon = isWake ? '🌅' : eventIcon(e);
              const title = isWake ? 'Wake up' : eventTitle(e);
              const summary = isWake ? '' : eventSummary(e, unit);
              return (
                <li key={`${e.id}:${r.kind}`} className="event-row">
                  <span className="event-icon">{icon}</span>
                  <div className="event-main">
                    <div className="event-title">{title}</div>
                    <div className="event-sub">
                      {formatTime(r.time)}
                      {summary && <> • {summary}</>}
                    </div>
                    {!isWake && e.notes && <div className="event-notes">{e.notes}</div>}
                  </div>
                  <div className="event-actions">
                    <button type="button" onClick={() => setEditing(e)}>Edit</button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        const msg = isWake
                          ? 'Delete the sleep session this wake-up belongs to?'
                          : 'Delete this event?';
                        if (confirm(msg)) deleteEvent(e.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {editing && (
        <EventForm initial={{ mode: 'edit', event: editing }} onClose={() => setEditing(null)} />
      )}
    </section>
  );
}
