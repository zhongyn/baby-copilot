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

  const filtered = useMemo(() => events.filter((e) => filters.has(e.type)), [events, filters]);

  const groups = useMemo(() => {
    const m = new Map<string, AppEvent[]>();
    for (const e of filtered) {
      const k = dayKey(e.startTime);
      const arr = m.get(k);
      if (arr) arr.push(e);
      else m.set(k, [e]);
    }
    return Array.from(m.entries());
  }, [filtered]);

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
          <h3 className="day-header">{formatDateHeader(items[0].startTime)}</h3>
          <ul className="event-list">
            {items.map((e) => (
              <li key={e.id} className="event-row">
                <span className="event-icon">{eventIcon(e)}</span>
                <div className="event-main">
                  <div className="event-title">{eventTitle(e)}</div>
                  <div className="event-sub">
                    {formatTime(e.startTime)}
                    {eventSummary(e, unit) && <> • {eventSummary(e, unit)}</>}
                  </div>
                  {e.notes && <div className="event-notes">{e.notes}</div>}
                </div>
                <div className="event-actions">
                  <button type="button" onClick={() => setEditing(e)}>Edit</button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      if (confirm('Delete this event?')) deleteEvent(e.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {editing && (
        <EventForm initial={{ mode: 'edit', event: editing }} onClose={() => setEditing(null)} />
      )}
    </section>
  );
}
