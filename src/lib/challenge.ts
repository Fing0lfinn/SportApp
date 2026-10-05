// Meydan okumanın kuralları ve tüm hesaplar (ilerleme, ara hedefler, XP, seri).
// Her grubun kendi başlangıç tarihi ve hareket listesi var; sunucuda sadece ham kayıtlar tutulur.

import { strings, type Lang } from '@/i18n';

import { CATALOG_BY_KEY, catalogName, defaultStep, DEFAULT_KEYS, type ExerciseType } from './catalog';

export type { ExerciseType };

export type Exercise = {
  key: string;
  name: string;
  /** Ad + "her el", "20 m" gibi ek bilgi */
  label: string;
  type: ExerciseType;
  goal: number;
  step: number;
  perHand: boolean;
  /** carry: sayılması için gereken en az mesafe (m) */
  distance: number;
  custom: boolean;
};

export type Challenge = {
  groupId: string | null;
  start: string;
  exercises: Exercise[];
  byKey: Record<string, Exercise>;
};

/** Sunucudaki group_exercises satırı */
export type ExerciseRow = {
  exercise: string;
  type: string;
  goal: number;
  per_hand: boolean;
  distance: number;
  name: string | null;
  position: number;
};

export const TOTAL_DAYS = 365;

export const LEVEL_XP = [0, 500, 2000, 5000, 9000];

export const XP = { start: 100, entry: 10, record: 50, milestone: 100, goal: 300 } as const;

export type Entry = {
  id: string;
  user_id: string;
  exercise: string;
  weight: number;
  reps: number;
  distance: number;
  is_start: boolean;
  performed_on: string;
  edited: boolean;
  created_at: string;
  /** Telefonda bekliyor, henüz sunucuya gitmedi */
  pending?: boolean;
};

// ---------------------------------------------------------------- meydan okuma

export function toExercise(row: ExerciseRow, lang: Lang): Exercise {
  const type = (['weight', 'reps', 'carry', 'time'].includes(row.type) ? row.type : 'weight') as ExerciseType;
  const cat = CATALOG_BY_KEY[row.exercise];
  const name = row.name?.trim() || catalogName(row.exercise, lang);
  const s = strings();
  let label = name;
  if (row.per_hand) label += ` · ${s.units.perHand}`;
  if (type === 'carry' && row.distance) label += `${row.per_hand ? ',' : ' ·'} ${row.distance} m`;
  return {
    key: row.exercise,
    name,
    label,
    type,
    goal: Number(row.goal),
    step: cat && !row.name ? cat.step : defaultStep(type, row.per_hand),
    perHand: row.per_hand,
    distance: Number(row.distance) || 0,
    custom: !cat || !!row.name,
  };
}

export function buildChallenge(groupId: string | null, start: string, rows: ExerciseRow[], lang: Lang): Challenge {
  const exercises = [...rows].sort((a, b) => a.position - b.position).map((r) => toExercise(r, lang));
  return { groupId, start, exercises, byKey: Object.fromEntries(exercises.map((e) => [e.key, e])) };
}

/** Katalogdaki bir hareketin varsayılan satırı */
export function catalogRow(key: string, position = 0): ExerciseRow {
  const c = CATALOG_BY_KEY[key];
  return {
    exercise: key,
    type: c.type,
    goal: c.goal,
    per_hand: !!c.perHand,
    distance: c.distance ?? 0,
    name: null,
    position,
  };
}

export const DEFAULT_ROWS: ExerciseRow[] = DEFAULT_KEYS.map(catalogRow);

// ---------------------------------------------------------------- tarih

function utcDays(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}

/** Yerel saate göre bugünün tarihi, YYYY-MM-DD */
export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Başlangıçtan bu yana geçen gün (başlangıç günü = 0) */
export function dayIndex(iso: string, start: string) {
  return utcDays(iso) - utcDays(start);
}

export function todayIndex(start: string) {
  return Math.max(0, Math.min(TOTAL_DAYS, dayIndex(todayISO(), start)));
}

/** Henüz başlamadıysa başlamasına kalan gün */
export function daysUntilStart(start: string) {
  return Math.max(0, -dayIndex(todayISO(), start));
}

export function daysLeft(start: string) {
  return Math.max(0, Math.min(TOTAL_DAYS, TOTAL_DAYS - dayIndex(todayISO(), start)));
}

export function dateFromIndex(idx: number, start: string) {
  const d = new Date((utcDays(start) + idx) * 86400000);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function isoFromIndex(idx: number, start: string) {
  return todayISO(dateFromIndex(idx, start));
}

export function endISO(start: string) {
  return isoFromIndex(TOTAL_DAYS, start);
}

export function formatDay(iso: string) {
  const [, m, d] = iso.split('-').map(Number);
  return strings().dates.day(d, m - 1);
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return strings().dates.full(d, m - 1, y);
}

export function formatMonthYear(date: Date) {
  return strings().dates.monthYear(date.getMonth(), date.getFullYear());
}

// ---------------------------------------------------------------- sayılar

export function fmt(v: number) {
  const s = String(Math.round(v * 100) / 100);
  return strings().decimalComma ? s.replace('.', ',') : s;
}

export function fmtTime(sec: number) {
  const s = Math.round(sec);
  if (s < 60) return `${s} ${strings().units.sec}`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Hedef ya da değer, birimiyle: "120 kg", "20 tekrar", "1:30" */
export function fmtValue(ex: Exercise, v: number) {
  if (ex.type === 'reps') return `${fmt(v)} ${strings().units.reps}`;
  if (ex.type === 'time') return fmtTime(v);
  return `${fmt(v)} kg`;
}

/** Birimsiz kısa değer (grafik ve kartlarda; birim yanında ayrıca yazılır) */
export function fmtShort(ex: Exercise, v: number) {
  return ex.type === 'time' && v >= 60 ? fmtTime(v) : fmt(v);
}

export function unitOf(ex: Exercise, v = 0) {
  if (ex.type === 'reps') return strings().units.reps;
  if (ex.type === 'time') return v >= 60 ? '' : strings().units.sec;
  return 'kg';
}

export function epley(weight: number, reps: number) {
  return reps <= 1 ? weight : Math.round(weight * (1 + reps / 30));
}

/** Hedefe sayılan değer. Taşımada mesafe yetmezse sayılmaz. */
export function valueOf(ex: Exercise, e: Pick<Entry, 'weight' | 'reps' | 'distance'>) {
  if (ex.type === 'reps' || ex.type === 'time') return e.reps;
  if (ex.type === 'carry') return e.distance >= ex.distance ? e.weight : 0;
  return e.reps >= 1 ? e.weight : 0;
}

export function entryText(ex: Exercise, e: Pick<Entry, 'weight' | 'reps' | 'distance'>) {
  if (ex.type === 'reps') return `${e.reps} ${strings().units.reps}`;
  if (ex.type === 'time') return fmtTime(e.reps);
  if (ex.type === 'carry') return `${fmt(e.weight)} kg · ${e.distance} m`;
  return `${fmt(e.weight)} kg × ${e.reps}`;
}

export function entrySub(ex: Exercise, e: Pick<Entry, 'weight' | 'reps' | 'distance' | 'is_start'>) {
  const s = strings().entry;
  if (e.is_start) return s.start;
  if (ex.type === 'reps') return s.singleSet;
  if (ex.type === 'time') return s.held;
  if (ex.type === 'carry') return e.distance >= ex.distance ? s.perHand : s.tooShort(ex.distance);
  return `${ex.perHand ? `${s.perHand} · ` : ''}${s.estMax(fmt(epley(e.weight, e.reps)))}`;
}

/** Başlangıçtan hedefe 4 eşit durak, hareketin adımına yuvarlanmış. */
export function milestones(ex: Exercise, start: number) {
  if (start >= ex.goal) return [ex.goal, ex.goal, ex.goal, ex.goal];
  const out: number[] = [];
  let prev = start;
  for (let m = 1; m <= 4; m++) {
    let v = m === 4 ? ex.goal : Math.round((start + ((ex.goal - start) * m) / 4) / ex.step) * ex.step;
    if (v <= prev) v = prev + ex.step;
    if (v > ex.goal) v = ex.goal;
    out.push(v);
    prev = v;
  }
  return out;
}

// ---------------------------------------------------------------- kişi istatistikleri

export type EntryEvent = { record: boolean; milestones: number; goal: boolean; xp: number };

export type ExerciseStats = {
  best: number;
  start: number;
  hasData: boolean;
  milestones: number[];
  milestonesDone: number;
  /** İlki başlangıç değeri (başlamadan önceki son kayıt ya da dönemin ilk kaydı) */
  sorted: Entry[];
};

export type UserStats = {
  byExercise: Record<string, ExerciseStats>;
  events: Record<string, EntryEvent>;
  entries: number;
  records: number;
  milestonesAfterStart: number;
  goalsAfterStart: number;
  xp: number;
  level: number;
  nextLevelXp: number | null;
  levelProgress: number;
  streak: number;
  maxStreak: number;
  pct: number;
  done: number;
  activeDays: number;
};

function sortEntries(a: Entry, b: Entry) {
  return (
    a.performed_on.localeCompare(b.performed_on) ||
    Number(b.is_start) - Number(a.is_start) ||
    a.created_at.localeCompare(b.created_at)
  );
}

const EMPTY_STATS: ExerciseStats = { best: 0, start: 0, hasData: false, milestones: [], milestonesDone: 0, sorted: [] };

/** Bir hareketin istatistiği; grupta olmayan hareket için boş döner. */
export function exStats(stats: UserStats, key: string) {
  return stats.byExercise[key] ?? EMPTY_STATS;
}

export function computeStats(all: Entry[], ch: Challenge, today = todayIndex(ch.start)): UserStats {
  const byExercise: Record<string, ExerciseStats> = {};
  const events: Record<string, EntryEvent> = {};
  const weeks = new Set<number>();
  const days = new Set<string>();
  let entries = 0;
  let records = 0;
  let milestonesAfterStart = 0;
  let goalsAfterStart = 0;
  let hasStart = false;

  for (const ex of ch.exercises) {
    const mine = all.filter((e) => e.exercise === ex.key).sort(sortEntries);
    const before = mine.filter((e) => dayIndex(e.performed_on, ch.start) < 0);
    const during = mine.filter((e) => {
      const d = dayIndex(e.performed_on, ch.start);
      return d >= 0 && d < TOTAL_DAYS;
    });
    // Başlamadan önceki son kayıt başlangıç değeri sayılır; yoksa dönemin ilk kaydı.
    const sorted = before.length ? [before[before.length - 1], ...during] : during;
    const start = sorted.length ? valueOf(ex, sorted[0]) : 0;
    const ms = milestones(ex, start);
    let best = start;
    sorted.forEach((e, i) => {
      const d = dayIndex(e.performed_on, ch.start);
      if (d >= 0) weeks.add(Math.floor(d / 7));
      if (i === 0) {
        if (e.is_start) hasStart = true;
        return;
      }
      entries++;
      days.add(e.performed_on);
      const v = valueOf(ex, e);
      const ev: EntryEvent = { record: false, milestones: 0, goal: false, xp: XP.entry };
      if (v > best) {
        ev.record = true;
        ev.xp += XP.record;
        records++;
        if (start < ex.goal) {
          const before = ms.filter((m) => best >= m).length;
          const after = ms.filter((m) => v >= m).length;
          ev.milestones = after - before;
          ev.xp += ev.milestones * XP.milestone;
          if (best < ex.goal && v >= ex.goal) {
            ev.goal = true;
            ev.xp += XP.goal;
          }
        }
        best = v;
      }
      events[e.id] = ev;
    });
    const msDone = ms.filter((m) => best >= m).length;
    if (sorted.length && start < ex.goal) {
      milestonesAfterStart += msDone;
      if (best >= ex.goal) goalsAfterStart++;
    }
    byExercise[ex.key] = {
      best: sorted.length ? best : 0,
      start,
      hasData: sorted.length > 0,
      milestones: ms,
      milestonesDone: sorted.length ? msDone : 0,
      sorted,
    };
  }

  let xp = hasStart ? XP.start : 0;
  for (const id in events) xp += events[id].xp;
  let level = 0;
  LEVEL_XP.forEach((need, i) => {
    if (xp >= need) level = i;
  });
  const next = LEVEL_XP[level + 1] ?? null;

  const currentWeek = Math.floor(today / 7);
  let w = weeks.has(currentWeek) ? currentWeek : currentWeek - 1;
  let streak = 0;
  while (w >= 0 && weeks.has(w)) {
    streak++;
    w--;
  }
  let maxStreak = 0;
  let run = 0;
  for (let i = 0; i <= currentWeek; i++) {
    run = weeks.has(i) ? run + 1 : 0;
    maxStreak = Math.max(maxStreak, run);
  }

  const { pct, done } = progressOf(
    ch.exercises.map((ex) => byExercise[ex.key].best),
    ch.exercises,
  );

  return {
    byExercise,
    events,
    entries,
    records,
    milestonesAfterStart,
    goalsAfterStart,
    xp,
    level,
    nextLevelXp: next,
    levelProgress: next ? (xp - LEVEL_XP[level]) / (next - LEVEL_XP[level]) : 1,
    streak,
    maxStreak,
    pct,
    done,
    activeDays: days.size,
  };
}

/** Genel puan: hedeflerdeki ilerlemenin ortalaması (her biri en fazla %100). */
export function progressOf(bests: number[], exercises: Exercise[]) {
  if (!exercises.length) return { pct: 0, done: 0 };
  let sum = 0;
  let done = 0;
  bests.forEach((v, i) => {
    const q = Math.min(1, v / exercises[i].goal);
    sum += q;
    if (q >= 1) done++;
  });
  return { pct: Math.round((sum / exercises.length) * 100), done };
}

/** Kilo oranında kullanılan hareketler (grupta varsa): squat, deadlift, bench */
export const RATIO_KEYS = ['squat', 'deadlift', 'bench'];

export function ratioKeys(ch: Challenge) {
  return RATIO_KEYS.filter((k) => ch.byKey[k]);
}

/** (Squat + Deadlift + Bench) ÷ vücut ağırlığı; grupta bu hareketler yoksa null */
export function strengthRatio(stats: UserStats, bodyWeight: number | null | undefined, ch: Challenge) {
  const keys = ratioKeys(ch);
  if (!bodyWeight || !keys.length) return null;
  return keys.reduce((sum, k) => sum + exStats(stats, k).best, 0) / bodyWeight;
}
