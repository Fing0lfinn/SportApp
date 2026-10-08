// Günlük kalori, protein ve su hedefi hesabı (saf fonksiyonlar, test edilebilir).

export type Goal = 'lose' | 'gain' | 'muscle' | 'maintain';
export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export const GOALS: Goal[] = ['lose', 'gain', 'muscle', 'maintain'];
export const ACTIVITIES: Activity[] = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};
/** Seçilebilen hızlar (kg/hafta). Haftada 0,75 kg'dan hızlı kayıp önerilmez. */
export const PACES: Record<'lose' | 'gain', number[]> = { lose: [0.25, 0.5, 0.75], gain: [0.25, 0.5] };

/** 1 kg vücut ağırlığı ≈ 7700 kcal */
const KCAL_PER_KG = 7700;
/** Güvenli alt sınır: bunun altında kalori önerilmez */
export const KCAL_FLOOR: Record<Sex, number> = { male: 1500, female: 1200 };
export const DEFAULT_WATER = 2500;

export type TargetInput = {
  goal: Goal;
  sex: Sex;
  age: number;
  heightCm: number;
  weight: number;
  activity: Activity;
  targetWeight?: number | null;
  pace?: number | null;
};

export type Targets = {
  bmr: number;
  tdee: number;
  kcal: number;
  protein: number;
  water: number;
  /** Öneri güvenli alt sınıra çekildi */
  floored: boolean;
  /** Tahmini değişim, kg/hafta (eksi: kayıp) */
  weekly: number;
  /** Hedef kiloya kaç hafta; hesaplanamıyorsa null */
  weeks: number | null;
  /** Hedef kilo sağlıklı aralığın (VKİ 18,5) altında */
  lowTarget: boolean;
};

const round = (v: number, step: number) => Math.round(v / step) * step;

/**
 * Mifflin-St Jeor ile bazal metabolizma, hareket katsayısıyla günlük harcama,
 * hedefe göre kalori farkı; protein kilo başına, su kiloya göre.
 */
export function calcTargets(i: TargetInput): Targets {
  const bmr = 10 * i.weight + 6.25 * i.heightCm - 5 * i.age + (i.sex === 'male' ? 5 : -161);
  const tdee = bmr * ACTIVITY_FACTOR[i.activity];
  const pace = i.pace ?? 0.5;
  let kcal = tdee;
  if (i.goal === 'lose') kcal = tdee - (pace * KCAL_PER_KG) / 7;
  else if (i.goal === 'gain') kcal = tdee + (pace * KCAL_PER_KG) / 7;
  else if (i.goal === 'muscle') kcal = tdee + 250;

  const floor = KCAL_FLOOR[i.sex];
  const floored = kcal < floor;
  kcal = round(Math.max(kcal, floor), 10);

  // Fazla kilolu kişilerde protein, sağlıklı kilo üst sınırına göre hesaplanır.
  const h = i.heightCm / 100;
  const bmi = i.weight / (h * h);
  const refWeight = bmi > 30 ? 25 * h * h : i.weight;
  const perKg = i.goal === 'lose' || i.goal === 'muscle' ? 2 : 1.6;
  const protein = Math.min(300, round(refWeight * perKg, 5));
  const water = Math.min(4500, Math.max(1500, round(i.weight * 35, 100)));

  const weekly = ((kcal - tdee) * 7) / KCAL_PER_KG;
  let weeks: number | null = null;
  const target = i.targetWeight ?? null;
  if (target && (i.goal === 'lose' || i.goal === 'gain')) {
    const diff = target - i.weight;
    const sameWay = (i.goal === 'lose' && diff < 0 && weekly < -0.01) || (i.goal === 'gain' && diff > 0 && weekly > 0.01);
    if (sameWay) weeks = Math.max(1, Math.round(Math.abs(diff / weekly)));
  }
  const lowTarget = !!target && i.goal === 'lose' && target / (h * h) < 18.5;

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, protein, water, floored, weekly, weeks, lowTarget };
}

export function ageFromBirthYear(year: number | null | undefined, now = new Date()) {
  return year ? now.getFullYear() - year : null;
}
