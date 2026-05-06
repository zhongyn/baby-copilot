import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { differenceInMinutes, format, startOfDay, subDays } from 'date-fns';
import { useStore } from '../store';
import { formatVolume, mlToDisplay } from '../utils/units';
import { relativeFromNow } from '../utils/format';
import type { AppEvent } from '../types';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function lastEventOfType(events: AppEvent[], pred: (e: AppEvent) => boolean): AppEvent | null {
  for (const e of events) if (pred(e)) return e;
  return null;
}

export function StatsPage() {
  const events = useStore((s) => s.babyEvents());
  const unit = useStore((s) => s.settings.displayUnit);
  const [days, setDays] = useState<7 | 30>(7);

  const today = useMemo(() => events.filter((e) => isToday(e.startTime)), [events]);

  const totals = useMemo(() => {
    let milkMl = 0;
    let feeds = 0;
    let pee = 0;
    let poo = 0;
    let sleepMin = 0;
    for (const e of today) {
      if (e.type === 'feed') {
        feeds++;
        if (e.feedKind !== 'breast') milkMl += e.volumeMl;
      } else if (e.type === 'diaper') {
        if (e.diaperKind === 'pee' || e.diaperKind === 'both') pee++;
        if (e.diaperKind === 'poo' || e.diaperKind === 'both') poo++;
      } else if (e.type === 'sleep') {
        sleepMin += differenceInMinutes(new Date(e.endTime), new Date(e.startTime));
      }
    }
    return { milkMl, feeds, pee, poo, sleepMin };
  }, [today]);

  const lastFeed = lastEventOfType(events, (e) => e.type === 'feed');
  const lastDiaper = lastEventOfType(events, (e) => e.type === 'diaper');
  const lastSleep = lastEventOfType(events, (e) => e.type === 'sleep');

  const chartData = useMemo(() => {
    const buckets: Record<string, { day: string; breast: number; pumped: number; formula: number; pee: number; poo: number; sleepHr: number }> = {};
    const start = startOfDay(subDays(new Date(), days - 1));
    for (let i = 0; i < days; i++) {
      const d = startOfDay(subDays(new Date(), days - 1 - i));
      const k = format(d, 'yyyy-MM-dd');
      buckets[k] = { day: format(d, 'MMM d'), breast: 0, pumped: 0, formula: 0, pee: 0, poo: 0, sleepHr: 0 };
    }
    for (const e of events) {
      const d = startOfDay(new Date(e.startTime));
      if (d < start) continue;
      const k = format(d, 'yyyy-MM-dd');
      const b = buckets[k];
      if (!b) continue;
      if (e.type === 'feed') {
        if (e.feedKind === 'breast') b.breast += 1; // count sessions for breast
        else {
          const v = mlToDisplay(e.volumeMl, unit);
          if (e.feedKind === 'pumped') b.pumped += v;
          else b.formula += v;
        }
      } else if (e.type === 'diaper') {
        if (e.diaperKind === 'pee' || e.diaperKind === 'both') b.pee += 1;
        if (e.diaperKind === 'poo' || e.diaperKind === 'both') b.poo += 1;
      } else if (e.type === 'sleep') {
        b.sleepHr += differenceInMinutes(new Date(e.endTime), new Date(e.startTime)) / 60;
      }
    }
    return Object.values(buckets).map((b) => ({
      ...b,
      pumped: Math.round(b.pumped * 100) / 100,
      formula: Math.round(b.formula * 100) / 100,
      sleepHr: Math.round(b.sleepHr * 10) / 10
    }));
  }, [events, days, unit]);

  return (
    <section className="page stats-page">
      <h2>Today</h2>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Milk</div>
          <div className="stat-value">{formatVolume(totals.milkMl, unit)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Feeds</div>
          <div className="stat-value">{totals.feeds}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pee</div>
          <div className="stat-value">{totals.pee}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Poo</div>
          <div className="stat-value">{totals.poo}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sleep</div>
          <div className="stat-value">
            {Math.floor(totals.sleepMin / 60)}h {totals.sleepMin % 60}m
          </div>
        </div>
      </div>

      <h2>Time since last</h2>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">Feed</div>
          <div className="stat-value-sm">{lastFeed ? relativeFromNow(lastFeed.startTime) : '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Diaper</div>
          <div className="stat-value-sm">{lastDiaper ? relativeFromNow(lastDiaper.startTime) : '—'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sleep</div>
          <div className="stat-value-sm">{lastSleep ? relativeFromNow(lastSleep.startTime) : '—'}</div>
        </div>
      </div>

      <div className="range-row">
        <h2>Trends</h2>
        <div className="seg">
          <button type="button" className={days === 7 ? 'on' : ''} onClick={() => setDays(7)}>7d</button>
          <button type="button" className={days === 30 ? 'on' : ''} onClick={() => setDays(30)}>30d</button>
        </div>
      </div>

      <h3>Bottle milk ({unit}) per day</h3>
      <div className="chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="pumped" stackId="a" fill="#7cb7e8" />
            <Bar dataKey="formula" stackId="a" fill="#e8a87c" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3>Diapers per day</h3>
      <div className="chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="pee" fill="#f6d365" />
            <Bar dataKey="poo" fill="#a98467" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h3>Sleep (hours) per day</h3>
      <div className="chart">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sleepHr" fill="#9c89b8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
