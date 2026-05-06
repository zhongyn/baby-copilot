import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { AppEvent, Baby, DisplayUnit, ID, Snapshot } from './types';
import { loadSnapshot, saveSnapshot } from './storage/localStore';

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
type NewEventInput = DistributiveOmit<AppEvent, 'id' | 'babyId'> & { babyId?: ID };

type State = Snapshot & {
  // selectors helpers
  activeBaby: () => Baby | null;
  babyEvents: () => AppEvent[];

  // baby actions
  addBaby: (name: string, birthDate?: string) => Baby;
  updateBaby: (id: ID, patch: Partial<Omit<Baby, 'id'>>) => void;
  deleteBaby: (id: ID) => void;
  setActiveBaby: (id: ID) => void;

  // event actions
  addEvent: (e: NewEventInput) => AppEvent | null;
  updateEvent: (id: ID, patch: Partial<AppEvent>) => void;
  deleteEvent: (id: ID) => void;

  // settings
  setUnit: (u: DisplayUnit) => void;
};

const initial = loadSnapshot();

// First-run: create a default baby so the app is usable immediately.
if (initial.babies.length === 0) {
  const b: Baby = { id: uuid(), name: 'Baby 1' };
  initial.babies.push(b);
  initial.settings.activeBabyId = b.id;
  saveSnapshot(initial);
} else if (!initial.settings.activeBabyId) {
  initial.settings.activeBabyId = initial.babies[0].id;
  saveSnapshot(initial);
}

export const useStore = create<State>((set, get) => ({
  ...initial,

  activeBaby: () => {
    const { babies, settings } = get();
    return babies.find((b) => b.id === settings.activeBabyId) ?? null;
  },

  babyEvents: () => {
    const { events, settings } = get();
    if (!settings.activeBabyId) return [];
    return events
      .filter((e) => e.babyId === settings.activeBabyId)
      .slice()
      .sort((a, b) => b.startTime.localeCompare(a.startTime));
  },

  addBaby: (name, birthDate) => {
    const baby: Baby = { id: uuid(), name: name.trim() || 'Baby', birthDate };
    set((s) => {
      const babies = [...s.babies, baby];
      const settings = s.settings.activeBabyId ? s.settings : { ...s.settings, activeBabyId: baby.id };
      const next = { ...s, babies, settings };
      saveSnapshot(next);
      return { babies, settings };
    });
    return baby;
  },

  updateBaby: (id, patch) =>
    set((s) => {
      const babies = s.babies.map((b) => (b.id === id ? { ...b, ...patch } : b));
      saveSnapshot({ ...s, babies });
      return { babies };
    }),

  deleteBaby: (id) =>
    set((s) => {
      if (s.babies.length <= 1) return s;
      const babies = s.babies.filter((b) => b.id !== id);
      const events = s.events.filter((e) => e.babyId !== id);
      const settings =
        s.settings.activeBabyId === id ? { ...s.settings, activeBabyId: babies[0].id } : s.settings;
      saveSnapshot({ ...s, babies, events, settings });
      return { babies, events, settings };
    }),

  setActiveBaby: (id) =>
    set((s) => {
      const settings = { ...s.settings, activeBabyId: id };
      saveSnapshot({ ...s, settings });
      return { settings };
    }),

  addEvent: (data) => {
    const state = get();
    const babyId = data.babyId ?? state.settings.activeBabyId;
    if (!babyId) return null;
    const event = { ...data, id: uuid(), babyId } as AppEvent;
    set((s) => {
      const events = [...s.events, event];
      saveSnapshot({ ...s, events });
      return { events };
    });
    return event;
  },

  updateEvent: (id, patch) =>
    set((s) => {
      const events = s.events.map((e) => (e.id === id ? ({ ...e, ...patch } as AppEvent) : e));
      saveSnapshot({ ...s, events });
      return { events };
    }),

  deleteEvent: (id) =>
    set((s) => {
      const events = s.events.filter((e) => e.id !== id);
      saveSnapshot({ ...s, events });
      return { events };
    }),

  setUnit: (u) =>
    set((s) => {
      const settings = { ...s.settings, displayUnit: u };
      saveSnapshot({ ...s, settings });
      return { settings };
    })
}));
