import type { Snapshot } from '../types';

const KEY = 'babycopilot:v1:snapshot';
const SCHEMA_VERSION = 1;

const empty: Snapshot = {
  schemaVersion: SCHEMA_VERSION,
  babies: [],
  events: [],
  settings: { activeBabyId: null, displayUnit: 'ml', theme: 'system' },
  activeBreastTimer: null
};

export function loadSnapshot(): Snapshot {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...empty };
    const parsed = JSON.parse(raw) as Snapshot;
    // Future migrations would inspect parsed.schemaVersion here.
    return {
      schemaVersion: SCHEMA_VERSION,
      babies: parsed.babies ?? [],
      events: parsed.events ?? [],
      settings: { ...empty.settings, ...(parsed.settings ?? {}) },
      activeBreastTimer: parsed.activeBreastTimer ?? null
    };
  } catch {
    return { ...empty };
  }
}

export function saveSnapshot(snap: Snapshot): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...snap, schemaVersion: SCHEMA_VERSION }));
  } catch {
    // ignore quota errors
  }
}
