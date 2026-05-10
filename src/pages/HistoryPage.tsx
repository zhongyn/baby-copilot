import { useMemo, useState } from 'react';
import { addDays, format, isSameDay, isToday } from 'date-fns';
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

function dateInputValue(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function parseDateInput(v: string): Date {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function HistoryPage() {
  const events = useStore((s) => s.babyEvents());
  const unit = useStore((s) => s.settings.displayUnit);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const [filters, setFilters] = useState<Set<EventType>>(new Set(['feed', 'diaper', 'sleep']));
  const [editing, setEditing] = useState<AppEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  type Row =
    | { kind: 'event'; event: AppEvent; time: string }
    | { kind: 'wake'; event: AppEvent; time: string };

  const dayRows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    const selKey = dayKey(selectedDate.toISOString());
    for (const e of events) {
      if (!filters.has(e.type)) continue;
      if (dayKey(e.startTime) === selKey) {
        out.push({ kind: 'event', event: e, time: e.startTime });
      }
      if (e.type === 'sleep' && dayKey(e.endTime) === selKey) {
        out.push({ kind: 'wake', event: e, time: e.endTime });
      }
    }
    out.sort((a, b) => b.time.localeCompare(a.time));
    return out;
  }, [events, filters, selectedDate]);

  const toggle = (t: EventType) =>
    setFilters((s) => {
      const next = new Set(s);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const goPrev = () => setSelectedDate((d) => addDays(d, -1));
  const goNext = () => setSelectedDate((d) => addDays(d, 1));
  const goToday = () => setSelectedDate(new Date());
  const isOnToday = isToday(selectedDate);

  return (
    <section className="page history-page">
      <div className="date-nav">
        <button type="button" className="date-nav-btn" onClick={goPrev} aria-label="Previous day">
          ‹
        </button>
        <label className="date-nav-current">
          <span className="date-nav-label">{formatDateHeader(selectedDate.toISOString())}</span>
          <input
            type="date"
            value={dateInputValue(selectedDate)}
            max={dateInputValue(new Date())}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(parseDateInput(e.target.value));
            }}
            aria-label="Pick date"
          />
        </label>
        <button
          type="button"
          className="date-nav-btn"
          onClick={goNext}
          disabled={isOnToday}
          aria-label="Next day"
        >
          ›
        </button>
        {!isOnToday && (
          <button type="button" className="chip date-nav-today" onClick={goToday}>
            Today
          </button>
        )}
      </div>

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

      {dayRows.length === 0 && (
        <p className="empty">
          {isSameDay(selectedDate, new Date())
            ? 'No events today yet.'
            : 'No events on this day.'}
        </p>
      )}

      {dayRows.length > 0 && (
        <div className="day-group">
          <ul className="event-list">
            {dayRows.map((r) => {
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
      )}

      {editing && (
        <EventForm initial={{ mode: 'edit', event: editing }} onClose={() => setEditing(null)} />
      )}
    </section>
  );
}
