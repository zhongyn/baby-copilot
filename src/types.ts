export type ID = string;

export type Baby = {
  id: ID;
  name: string;
  birthDate?: string; // ISO date
};

export type FeedKind = 'breast' | 'bottle';
export type BreastSide = 'left' | 'right' | 'both';
export type DiaperKind = 'pee' | 'poo' | 'both';

export type EventType = 'feed' | 'diaper' | 'sleep';

interface EventBase {
  id: ID;
  babyId: ID;
  type: EventType;
  startTime: string; // ISO
  notes?: string;
}

export interface BreastFeedEvent extends EventBase {
  type: 'feed';
  feedKind: 'breast';
  side: BreastSide;
  durationMin?: number;
}

export interface BottleFeedEvent extends EventBase {
  type: 'feed';
  feedKind: 'bottle';
  volumeMl: number;
}

export type FeedEvent = BreastFeedEvent | BottleFeedEvent;

export interface DiaperEvent extends EventBase {
  type: 'diaper';
  diaperKind: DiaperKind;
}

export interface SleepEvent extends EventBase {
  type: 'sleep';
  endTime: string; // ISO
}

export type AppEvent = FeedEvent | DiaperEvent | SleepEvent;

export type DisplayUnit = 'ml' | 'oz';

export type ThemePreference = 'system' | 'light' | 'dark';

export type Settings = {
  activeBabyId: ID | null;
  displayUnit: DisplayUnit;
  theme: ThemePreference;
};

export type ActiveBreastTimer = {
  babyId: ID;
  side: BreastSide;
  startTime: string; // ISO
  targetMin?: number;
};

export type ActiveSleepSession = {
  babyId: ID;
  startTime: string; // ISO
};

export type Snapshot = {
  schemaVersion: number;
  babies: Baby[];
  events: AppEvent[];
  settings: Settings;
  activeBreastTimer: ActiveBreastTimer | null;
  activeSleepSession: ActiveSleepSession | null;
};
