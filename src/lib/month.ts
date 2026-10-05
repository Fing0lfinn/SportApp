import { dayIndex, EXERCISES, todayIndex, valueOf, type UserStats } from './challenge';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export type MonthRange = { from: number; to: number; title: string; short: string; ongoing: boolean };

function dayOf(year: number, month: number) {
  return dayIndex(`${year}-${String(month + 1).padStart(2, '0')}-01`);
}

/** Meydan okumanın ayları (Ekim 2026'dan bugüne). */
export function monthRanges(today = todayIndex()): MonthRange[] {
  const out: MonthRange[] = [];
  for (let i = 0; i < 13; i++) {
    const month = (9 + i) % 12;
    const year = 2026 + Math.floor((9 + i) / 12);
    const from = i === 0 ? 0 : dayOf(year, month);
    if (from > today) break;
    const nextMonth = (month + 1) % 12;
    const to = dayOf(year + (month === 11 ? 1 : 0), nextMonth) - 1;
    out.push({ from, to, title: `${MONTHS[month]} ${year}`, short: `${SHORT[month]} ${year}`, ongoing: today <= to });
  }
  return out;
}

export function monthSummary(stats: UserStats, r: MonthRange) {
  let entries = 0;
  let records = 0;
  let milestones = 0;
  let xp = 0;
  let best: { name: string; gain: number; unit: string; share: number } | null = null;

  for (const ex of EXERCISES) {
    const sorted = stats.byExercise[ex.key].sorted;
    let before = 0;
    let end = 0;
    sorted.forEach((e, i) => {
      const d = dayIndex(e.performed_on);
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
    if (gain > 0 && (!best || share > best.share)) best = { name: ex.name, gain, unit: ex.unit, share };
  }
  return { entries, records, milestones, xp, best };
}
