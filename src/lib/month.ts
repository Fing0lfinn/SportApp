import { strings } from '@/i18n';

import { dayIndex, exStats, todayIndex, TOTAL_DAYS, valueOf, type Challenge, type Exercise, type UserStats } from './challenge';

export type MonthRange = { from: number; to: number; title: string; short: string; ongoing: boolean };

/** Meydan okumanın takvim ayları (başlangıç ayından bugüne). */
export function monthRanges(ch: Challenge, today = todayIndex(ch.start)): MonthRange[] {
  const d = strings().dates;
  const [y0, m0] = ch.start.split('-').map(Number);
  const out: MonthRange[] = [];
  for (let i = 0; i < 14; i++) {
    const month = (m0 - 1 + i) % 12;
    const year = y0 + Math.floor((m0 - 1 + i) / 12);
    const from = i === 0 ? 0 : dayIndex(`${year}-${String(month + 1).padStart(2, '0')}-01`, ch.start);
    if (from > today || from >= TOTAL_DAYS) break;
    const nm = (month + 1) % 12;
    const ny = year + (month === 11 ? 1 : 0);
    const to = Math.min(TOTAL_DAYS - 1, dayIndex(`${ny}-${String(nm + 1).padStart(2, '0')}-01`, ch.start) - 1);
    out.push({ from, to, title: d.monthYear(month, year), short: d.monthShortYear(month, year), ongoing: today <= to });
  }
  return out;
}

export function monthSummary(stats: UserStats, r: MonthRange, ch: Challenge) {
  let entries = 0;
  let records = 0;
  let milestones = 0;
  let xp = 0;
  let best: { ex: Exercise; gain: number; share: number } | null = null;

  for (const ex of ch.exercises) {
    const sorted = exStats(stats, ex.key).sorted;
    let before = 0;
    let end = 0;
    sorted.forEach((e, i) => {
      const d = dayIndex(e.performed_on, ch.start);
      const v = valueOf(ex, e);
      if (i === 0 || d < r.from) before = Math.max(before, v);
      if (d <= r.to) end = Math.max(end, v);
      const ev = stats.events[e.id];
      if (i > 0 && ev && d >= r.from && d <= r.to) {
        entries++;
        xp += ev.xp;
        if (ev.record) records++;
        milestones += ev.milestones;
      }
    });
    const gain = end - before;
    const share = gain / ex.goal;
    if (gain > 0 && (!best || share > best.share)) best = { ex, gain, share };
  }
  return { entries, records, milestones, xp, best };
}
