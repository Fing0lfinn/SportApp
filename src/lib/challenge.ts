// Meydan okumanın kuralları ve tüm hesaplar (ilerleme, ara hedefler, XP, seri).
// Sunucuda sadece ham kayıtlar tutulur; her şey buradan türetilir.

export type ExerciseKey =
  | 'squat'
  | 'deadlift'
  | 'bench'
  | 'ohp'
  | 'pushup'
  | 'pullup'
  | 'bulgarian'
  | 'farmer'
  | 'row';

/** weight: kg × tekrar, reps: tek sette tekrar, carry: her elde kg + mesafe */
export type ExerciseType = 'weight' | 'reps' | 'carry';

export type Exercise = {
  key: ExerciseKey;
  name: string;
  label: string;
  goal: number;
  unit: 'kg' | 'tekrar';
  type: ExerciseType;
  step: number;
  perHand?: boolean;
};

export const EXERCISES: Exercise[] = [
  { key: 'squat', name: 'Squat', label: 'Squat', goal: 120, unit: 'kg', type: 'weight', step: 2.5 },
  { key: 'deadlift', name: 'Deadlift', label: 'Deadlift', goal: 160, unit: 'kg', type: 'weight', step: 2.5 },
  { key: 'bench', name: 'Bench Press', label: 'Bench Press', goal: 80, unit: 'kg', type: 'weight', step: 2.5 },
  { key: 'ohp', name: 'Overhead Press', label: 'Overhead Press', goal: 60, unit: 'kg', type: 'weight', step: 2.5 },
  { key: 'pushup', name: 'Şınav', label: 'Şınav', goal: 20, unit: 'tekrar', type: 'reps', step: 1 },
  { key: 'pullup', name: 'Barfiks', label: 'Barfiks', goal: 8, unit: 'tekrar', type: 'reps', step: 1 },
  {
    key: 'bulgarian',
    name: 'Bulgarian Split Squat',
    label: 'Bulgarian Split Squat · her el',
    goal: 20,
    unit: 'kg',
    type: 'weight',
    step: 2,
    perHand: true,
  },
  {
    key: 'farmer',
    name: "Farmer's Walk",
    label: "Farmer's Walk · her el, 20 m",
    goal: 50,
    unit: 'kg',
    type: 'carry',
    step: 2,
    perHand: true,
  },
  { key: 'row', name: 'Bent Over Row', label: 'Bent Over Row', goal: 80, unit: 'kg', type: 'weight', step: 2.5 },
];

export const EXERCISE_BY_KEY = Object.fromEntries(EXERCISES.map((e) => [e.key, e])) as Record<
  ExerciseKey,
  Exercise
>;

export const FARMER_DISTANCE = 20;
export const CHALLENGE_START = '2026-10-04';
export const CHALLENGE_END = '2027-10-04';
export const TOTAL_DAYS = 365;

export const LEVELS = [
  { name: 'Çaylak', xp: 0 },
  { name: 'Demir', xp: 500 },
  { name: 'Çelik', xp: 2000 },
  { name: 'Titan', xp: 5000 },
  { name: 'Efsane', xp: 9000 },
];

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
};

// ---------------------------------------------------------------- tarih

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MONTHS_LONG = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

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

/** Başlangıçtan bu yana geçen gün (4 Ekim = 0) */
export function dayIndex(iso: string) {
  return utcDays(iso) - utcDays(CHALLENGE_START);
}

export function todayIndex() {
  return Math.max(0, Math.min(TOTAL_DAYS, dayIndex(todayISO())));
}

export function daysLeft() {
  return Math.max(0, TOTAL_DAYS - dayIndex(todayISO()));
}

export function formatDay(iso: string) {
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export function formatMonthYear(date: Date) {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export function dateFromIndex(idx: number) {
  const ms = (utcDays(CHALLENGE_START) + idx) * 86400000;
  const d = new Date(ms);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// ---------------------------------------------------------------- sayılar

export function fmt(v: number) {
  return String(Math.round(v * 100) / 100).replace('.', ',');
}

export function epley(weight: number, reps: number) {
  return reps <= 1 ? weight : Math.round(weight * (1 + reps / 30));
}

/** Hedefe sayılan değer. Farmer's walk 20 m'nin altındaysa sayılmaz. */
export function valueOf(ex: Exercise, e: Pick<Entry, 'weight' | 'reps' | 'distance'>) {
  if (ex.type === 'reps') return e.reps;
  if (ex.type === 'carry') return e.distance >= FARMER_DISTANCE ? e.weight : 0;
  return e.reps >= 1 ? e.weight : 0;
}

export function entryText(ex: Exercise, e: Pick<Entry, 'weight' | 'reps' | 'distance'>) {
  if (ex.type === 'reps') return `${e.reps} tekrar`;
  if (ex.type === 'carry') return `${fmt(e.weight)} kg · ${e.distance} m`;
  return `${fmt(e.weight)} kg × ${e.reps}`;
}

export function entrySub(ex: Exercise, e: Pick<Entry, 'weight' | 'reps' | 'distance' | 'is_start'>) {
  if (e.is_start) return 'Başlangıç ölçümü';
  if (ex.type === 'reps') return 'Tek set';
  if (ex.type === 'carry') return e.distance >= FARMER_DISTANCE ? 'Her elde' : '20 m altında, sayılmaz';
  return `${ex.perHand ? 'Her elde · ' : ''}Tahmini maks ${fmt(epley(e.weight, e.reps))} kg`;
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
  sorted: Entry[];
};

export type UserStats = {
  byExercise: Record<ExerciseKey, ExerciseStats>;
  events: Record<string, EntryEvent>;
  entries: number;
  records: number;
  milestonesAfterStart: number;
  goalsAfterStart: number;
  xp: number;
  level: number;
  levelName: string;
  nextLevel: { name: string; xp: number } | null;
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

export function computeStats(all: Entry[], today = todayIndex()): UserStats {
  const byExercise = {} as Record<ExerciseKey, ExerciseStats>;
  const events: Record<string, EntryEvent> = {};
  const weeks = new Set<number>();
  const days = new Set<string>();
  let entries = 0;
  let records = 0;
  let milestonesAfterStart = 0;
  let goalsAfterStart = 0;
  let hasStart = false;

  for (const ex of EXERCISES) {
    const sorted = all.filter((e) => e.exercise === ex.key).sort(sortEntries);
    const start = sorted.length ? valueOf(ex, sorted[0]) : 0;
    const ms = milestones(ex, start);
    let best = start;
    sorted.forEach((e, i) => {
      weeks.add(Math.floor(dayIndex(e.performed_on) / 7));
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
  LEVELS.forEach((l, i) => {
    if (xp >= l.xp) level = i;
  });
  const next = LEVELS[level + 1] ?? null;

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

  const { pct, done } = progressOf(EXERCISES.map((ex) => byExercise[ex.key].best));

  return {
    byExercise,
    events,
    entries,
    records,
    milestonesAfterStart,
    goalsAfterStart,
    xp,
    level,
    levelName: LEVELS[level].name,
    nextLevel: next,
    levelProgress: next ? (xp - LEVELS[level].xp) / (next.xp - LEVELS[level].xp) : 1,
    streak,
    maxStreak,
    pct,
    done,
    activeDays: days.size,
  };
}

/** Genel puan: 9 hedefteki ilerlemenin ortalaması (her biri en fazla %100). */
export function progressOf(bests: number[]) {
  let sum = 0;
  let done = 0;
  bests.forEach((v, i) => {
    const q = Math.min(1, v / EXERCISES[i].goal);
    sum += q;
    if (q >= 1) done++;
  });
  return { pct: Math.round((sum / EXERCISES.length) * 100), done };
}

/** (Squat + Deadlift + Bench) ÷ vücut ağırlığı */
export function strengthRatio(stats: UserStats, bodyWeight: number | null | undefined) {
  if (!bodyWeight) return null;
  const b = stats.byExercise;
  return (b.squat.best + b.deadlift.best + b.bench.best) / bodyWeight;
}
