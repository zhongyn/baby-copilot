import { useEffect, useState, type FormEvent } from 'react';
import type { AppEvent, BreastSide, DiaperKind, FeedKind } from '../types';
import { displayToMl, mlToDisplay } from '../utils/units';
import { useStore } from '../store';
import { NativePickerInput } from './NativePickerInput';

/** Local datetime string for <input type="datetime-local"> from an ISO string. */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local: string): string {
  return new Date(local).toISOString();
}

export type EventFormInitial =
  | { mode: 'create'; type: 'feed'; feedKind: FeedKind; side?: BreastSide }
  | { mode: 'create'; type: 'diaper'; diaperKind: DiaperKind }
  | { mode: 'create'; type: 'sleep' }
  | { mode: 'edit'; event: AppEvent };

type Props = {
  initial: EventFormInitial;
  onClose: () => void;
};

export function EventForm({ initial, onClose }: Props) {
  const unit = useStore((s) => s.settings.displayUnit);
  const addEvent = useStore((s) => s.addEvent);
  const updateEvent = useStore((s) => s.updateEvent);

  const isEdit = initial.mode === 'edit';
  const baseEvent = initial.mode === 'edit' ? initial.event : null;

  // Determine type & kind from initial
  const type: 'feed' | 'diaper' | 'sleep' = baseEvent?.type ?? (initial as Exclude<EventFormInitial, { mode: 'edit' }>).type;

  const initialFeedKind: FeedKind =
    baseEvent?.type === 'feed'
      ? baseEvent.feedKind
      : initial.mode === 'create' && initial.type === 'feed'
        ? initial.feedKind
        : 'breast';

  const initialSide: BreastSide =
    baseEvent?.type === 'feed' && baseEvent.feedKind === 'breast'
      ? baseEvent.side
      : initial.mode === 'create' && initial.type === 'feed' && initial.feedKind === 'breast'
        ? (initial.side ?? 'left')
        : 'left';

  const initialDiaperKind: DiaperKind =
    baseEvent?.type === 'diaper'
      ? baseEvent.diaperKind
      : initial.mode === 'create' && initial.type === 'diaper'
        ? initial.diaperKind
        : 'pee';

  const now = new Date().toISOString();
  const [startTime, setStartTime] = useState(isoToLocalInput(baseEvent?.startTime ?? now));
  const [endTime, setEndTime] = useState(
    isoToLocalInput(baseEvent?.type === 'sleep' ? baseEvent.endTime : now)
  );
  const [feedKind, setFeedKind] = useState<FeedKind>(initialFeedKind);
  const [side, setSide] = useState<BreastSide>(initialSide);
  const [durationMin, setDurationMin] = useState<string>(
    baseEvent?.type === 'feed' && baseEvent.feedKind === 'breast' && baseEvent.durationMin
      ? String(baseEvent.durationMin)
      : ''
  );
  const [volume, setVolume] = useState<string>(() => {
    if (baseEvent?.type === 'feed' && baseEvent.feedKind !== 'breast') {
      const v = mlToDisplay(baseEvent.volumeMl, unit);
      // Snap to nearest available step so the dropdown can pre-select it.
      if (unit === 'ml') return String(Math.max(10, Math.min(300, Math.round(v / 10) * 10)));
      return String(Math.max(1, Math.min(12, Math.round(v))));
    }
    // Sensible defaults for create
    return unit === 'ml' ? '60' : '2';
  });
  const [diaperKind, setDiaperKind] = useState<DiaperKind>(initialDiaperKind);
  const [notes, setNotes] = useState(baseEvent?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [type, feedKind, side, startTime, endTime, volume, diaperKind]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const startIso = localInputToIso(startTime);

    if (type === 'sleep') {
      const endIso = localInputToIso(endTime);
      if (new Date(endIso) <= new Date(startIso)) {
        setError('End time must be after start time.');
        return;
      }
      if (isEdit && baseEvent) {
        updateEvent(baseEvent.id, { startTime: startIso, endTime: endIso, notes: notes || undefined } as Partial<AppEvent>);
      } else {
        addEvent({ type: 'sleep', startTime: startIso, endTime: endIso, notes: notes || undefined });
      }
    } else if (type === 'diaper') {
      if (isEdit && baseEvent) {
        updateEvent(baseEvent.id, { startTime: startIso, diaperKind, notes: notes || undefined } as Partial<AppEvent>);
      } else {
        addEvent({ type: 'diaper', startTime: startIso, diaperKind, notes: notes || undefined });
      }
    } else {
      // feed
      if (feedKind === 'breast') {
        const dur = durationMin ? Number(durationMin) : undefined;
        if (dur !== undefined && (isNaN(dur) || dur < 0)) {
          setError('Duration must be a positive number.');
          return;
        }
        const payload = {
          type: 'feed' as const,
          feedKind: 'breast' as const,
          side,
          durationMin: dur,
          startTime: startIso,
          notes: notes || undefined
        };
        if (isEdit && baseEvent) updateEvent(baseEvent.id, payload as Partial<AppEvent>);
        else addEvent(payload);
      } else {
        const v = Number(volume);
        if (!volume || isNaN(v) || v <= 0) {
          setError('Enter a volume greater than 0.');
          return;
        }
        const ml = displayToMl(v, unit);
        const payload = {
          type: 'feed' as const,
          feedKind,
          volumeMl: ml,
          startTime: startIso,
          notes: notes || undefined
        };
        if (isEdit && baseEvent) updateEvent(baseEvent.id, payload as Partial<AppEvent>);
        else addEvent(payload);
      }
    }
    onClose();
  };

  const title =
    (isEdit ? 'Edit ' : 'Log ') +
    (type === 'sleep' ? 'sleep' : type === 'diaper' ? 'diaper' : feedKind === 'breast' ? 'breast feed' : feedKind === 'pumped' ? 'pumped milk' : 'formula');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{title}</h2>

        {type === 'feed' && (
          <>
            <label className="field">
              <span>Type</span>
              <div className="seg">
                {(['breast', 'pumped', 'formula'] as FeedKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={feedKind === k ? 'on' : ''}
                    onClick={() => setFeedKind(k)}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </label>
            {feedKind === 'breast' ? (
              <>
                <label className="field">
                  <span>Side</span>
                  <div className="seg">
                    {(['left', 'right', 'both'] as BreastSide[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={side === s ? 'on' : ''}
                        onClick={() => setSide(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </label>
                <label className="field">
                  <span>Duration (min, optional)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <label className="field">
                <span>Volume ({unit})</span>
                <select value={volume} onChange={(e) => setVolume(e.target.value)} autoFocus>
                  {(unit === 'ml'
                    ? Array.from({ length: 30 }, (_, i) => (i + 1) * 10)
                    : Array.from({ length: 12 }, (_, i) => i + 1)
                  ).map((v) => (
                    <option key={v} value={String(v)}>
                      {v} {unit}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}

        {type === 'diaper' && (
          <label className="field">
            <span>Kind</span>
            <div className="seg">
              {(['pee', 'poo', 'both'] as DiaperKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={diaperKind === k ? 'on' : ''}
                  onClick={() => setDiaperKind(k)}
                >
                  {k}
                </button>
              ))}
            </div>
          </label>
        )}

        <label className="field">
          <span>{type === 'sleep' ? 'Start' : 'Time'}</span>
          <NativePickerInput
            type="datetime-local"
            value={startTime}
            onChange={setStartTime}
            placeholder="Select date and time"
            required
            ariaLabel={type === 'sleep' ? 'Start' : 'Time'}
          />
        </label>

        {type === 'sleep' && (
          <label className="field">
            <span>End</span>
            <NativePickerInput
              type="datetime-local"
              value={endTime}
              onChange={setEndTime}
              placeholder="Select date and time"
              required
              ariaLabel="End"
            />
          </label>
        )}

        <label className="field">
          <span>Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary">{isEdit ? 'Save' : 'Log'}</button>
        </div>
      </form>
    </div>
  );
}
