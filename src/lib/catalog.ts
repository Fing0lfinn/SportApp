// Gruba eklenebilecek hazır hareketler. Adlar dile göre; yoksa İngilizcesi.
// Anahtarlar sunucuda da kullanılır (supabase/migrations/*group_challenges.sql → exercise_name).

import type { Lang } from '@/i18n';

/** weight: kg × tekrar, reps: tek sette tekrar, carry: kg + mesafe, time: saniye */
export type ExerciseType = 'weight' | 'reps' | 'carry' | 'time';
export type CatalogCategory = 'barbell' | 'bodyweight' | 'other';

export type CatalogItem = {
  key: string;
  type: ExerciseType;
  goal: number;
  step: number;
  perHand?: boolean;
  distance?: number;
  cat: CatalogCategory;
  names: { en: string } & Partial<Record<Lang, string>>;
};

export const CATALOG: CatalogItem[] = [
  { key: 'squat', type: 'weight', goal: 120, step: 2.5, cat: 'barbell', names: { en: 'Squat', ja: 'スクワット', es: 'Sentadilla', de: 'Kniebeuge' } },
  { key: 'deadlift', type: 'weight', goal: 160, step: 2.5, cat: 'barbell', names: { en: 'Deadlift', ja: 'デッドリフト', es: 'Peso muerto', de: 'Kreuzheben' } },
  { key: 'bench', type: 'weight', goal: 80, step: 2.5, cat: 'barbell', names: { en: 'Bench Press', ja: 'ベンチプレス', es: 'Press de banca', de: 'Bankdrücken' } },
  { key: 'ohp', type: 'weight', goal: 60, step: 2.5, cat: 'barbell', names: { en: 'Overhead Press', ja: 'オーバーヘッドプレス', es: 'Press militar', de: 'Schulterdrücken' } },
  { key: 'row', type: 'weight', goal: 80, step: 2.5, cat: 'barbell', names: { en: 'Bent Over Row', ja: 'ベントオーバーロウ', es: 'Remo con barra', de: 'Langhantelrudern' } },
  { key: 'front_squat', type: 'weight', goal: 100, step: 2.5, cat: 'barbell', names: { en: 'Front Squat', ja: 'フロントスクワット', es: 'Sentadilla frontal', de: 'Frontkniebeuge' } },
  { key: 'incline_bench', type: 'weight', goal: 70, step: 2.5, cat: 'barbell', names: { en: 'Incline Bench Press', ja: 'インクラインベンチプレス', es: 'Press inclinado', de: 'Schrägbankdrücken' } },
  { key: 'rdl', type: 'weight', goal: 120, step: 2.5, cat: 'barbell', names: { en: 'Romanian Deadlift', ja: 'ルーマニアンデッドリフト', es: 'Peso muerto rumano', de: 'Rumänisches Kreuzheben' } },
  { key: 'hip_thrust', type: 'weight', goal: 140, step: 2.5, cat: 'barbell', names: { en: 'Hip Thrust', ja: 'ヒップスラスト' } },
  { key: 'power_clean', type: 'weight', goal: 80, step: 2.5, cat: 'barbell', names: { en: 'Power Clean', ja: 'パワークリーン', es: 'Cargada de potencia' } },
  { key: 'barbell_curl', type: 'weight', goal: 40, step: 2.5, cat: 'barbell', names: { en: 'Barbell Curl', ja: 'バーベルカール', es: 'Curl con barra', de: 'Langhantel-Curl' } },
  { key: 'leg_press', type: 'weight', goal: 200, step: 5, cat: 'other', names: { en: 'Leg Press', ja: 'レッグプレス', es: 'Prensa de piernas', de: 'Beinpresse' } },
  { key: 'bulgarian', type: 'weight', goal: 20, step: 2, perHand: true, cat: 'other', names: { en: 'Bulgarian Split Squat', ja: 'ブルガリアンスクワット', es: 'Sentadilla búlgara', de: 'Bulgarische Kniebeuge' } },
  { key: 'farmer', type: 'carry', goal: 50, step: 2, perHand: true, distance: 20, cat: 'other', names: { en: "Farmer's Walk", ja: 'ファーマーズウォーク', es: 'Paseo del granjero' } },
  { key: 'weighted_pullup', type: 'weight', goal: 20, step: 2.5, cat: 'other', names: { en: 'Weighted Pull-up', tr: 'Ağırlıklı Barfiks', ja: '加重懸垂', es: 'Dominada lastrada', de: 'Klimmzug mit Zusatzgewicht' } },
  { key: 'weighted_dip', type: 'weight', goal: 30, step: 2.5, cat: 'other', names: { en: 'Weighted Dip', tr: 'Ağırlıklı Dips', ja: '加重ディップス', es: 'Fondos lastrados', de: 'Dips mit Zusatzgewicht' } },
  { key: 'pushup', type: 'reps', goal: 20, step: 1, cat: 'bodyweight', names: { en: 'Push-ups', tr: 'Şınav', ja: '腕立て伏せ', es: 'Flexiones', de: 'Liegestütze' } },
  { key: 'pullup', type: 'reps', goal: 8, step: 1, cat: 'bodyweight', names: { en: 'Pull-ups', tr: 'Barfiks', ja: '懸垂', es: 'Dominadas', de: 'Klimmzüge' } },
  { key: 'chinup', type: 'reps', goal: 10, step: 1, cat: 'bodyweight', names: { en: 'Chin-ups', tr: 'Ters Barfiks', ja: 'チンアップ', es: 'Dominadas supinas' } },
  { key: 'dip', type: 'reps', goal: 15, step: 1, cat: 'bodyweight', names: { en: 'Dips', ja: 'ディップス', es: 'Fondos' } },
  { key: 'pistol', type: 'reps', goal: 5, step: 1, cat: 'bodyweight', names: { en: 'Pistol Squat', ja: 'ピストルスクワット', es: 'Sentadilla pistol' } },
  { key: 'muscle_up', type: 'reps', goal: 3, step: 1, cat: 'bodyweight', names: { en: 'Muscle-up', ja: 'マッスルアップ' } },
  { key: 'hspu', type: 'reps', goal: 5, step: 1, cat: 'bodyweight', names: { en: 'Handstand Push-ups', tr: 'Amuda Kalkış Şınavı', ja: '逆立ち腕立て伏せ', es: 'Flexiones en pino', de: 'Handstand-Liegestütze' } },
  { key: 'plank', type: 'time', goal: 180, step: 5, cat: 'bodyweight', names: { en: 'Plank', ja: 'プランク', es: 'Plancha', de: 'Unterarmstütz' } },
  { key: 'dead_hang', type: 'time', goal: 60, step: 5, cat: 'bodyweight', names: { en: 'Dead Hang', tr: 'Barda Asılı Kalma', ja: 'ぶら下がり', es: 'Colgarse de la barra' } },
];

export const CATALOG_BY_KEY: Record<string, CatalogItem> = Object.fromEntries(CATALOG.map((c) => [c.key, c]));

/** İlk sürümün 9 hareketi: yeni grup kurulurken hazır seçili gelir. */
export const DEFAULT_KEYS = ['squat', 'deadlift', 'bench', 'ohp', 'pushup', 'pullup', 'bulgarian', 'farmer', 'row'];

export function catalogName(key: string, lang: Lang) {
  const c = CATALOG_BY_KEY[key];
  return c ? (c.names[lang] ?? c.names.en) : key;
}

/** Gruba özel hareketlerin adımı (hedef ve kayıt girişinde artış miktarı). */
export function defaultStep(type: ExerciseType, perHand: boolean) {
  if (type === 'reps') return 1;
  if (type === 'time') return 5;
  return perHand || type === 'carry' ? 2 : 2.5;
}

/** Gruba özel hareket anahtarı: c_ + 8 harf/rakam */
export function customKey() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = 'c_';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
