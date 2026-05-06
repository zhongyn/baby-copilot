import { format, formatDistanceToNowStrict, differenceInMinutes } from 'date-fns';
import type { AppEvent, DisplayUnit } from '../types';
import { formatVolume } from './units';

export function eventTitle(e: AppEvent): string {
  switch (e.type) {
    case 'feed':
      if (e.feedKind === 'breast') return 'Breast feeding';
      if (e.feedKind === 'pumped') return 'Pumped milk';
      return 'Formula milk';
    case 'diaper':
      if (e.diaperKind === 'pee') return 'Pee';
      if (e.diaperKind === 'poo') return 'Poo';
      return 'Pee + Poo';
    case 'sleep':
      return 'Sleep';
  }
}

export function eventSummary(e: AppEvent, unit: DisplayUnit): string {
  switch (e.type) {
    case 'feed':
      if (e.feedKind === 'breast') {
        const sideLabel = e.side === 'left' ? 'Left' : e.side === 'right' ? 'Right' : 'Both';
        return e.durationMin ? `${sideLabel} • ${e.durationMin} min` : sideLabel;
      }
      return formatVolume(e.volumeMl, unit);
    case 'diaper':
      return '';
    case 'sleep': {
      const mins = differenceInMinutes(new Date(e.endTime), new Date(e.startTime));
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
  }
}

export function formatTime(iso: string): string {
  return format(new Date(iso), 'p');
}

export function formatDateHeader(iso: string): string {
  return format(new Date(iso), 'EEE, MMM d');
}

export function relativeFromNow(iso: string): string {
  return `${formatDistanceToNowStrict(new Date(iso))} ago`;
}

export function eventIcon(e: AppEvent): string {
  switch (e.type) {
    case 'feed':
      return e.feedKind === 'breast' ? '🤱' : e.feedKind === 'pumped' ? '🍼' : '🥛';
    case 'diaper':
      return e.diaperKind === 'pee' ? '💧' : e.diaperKind === 'poo' ? '💩' : '💧💩';
    case 'sleep':
      return '😴';
  }
}

/** Local-date YYYY-MM-DD key for grouping. */
export function dayKey(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd');
}
