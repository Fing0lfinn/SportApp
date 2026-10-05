import { EXERCISES, type UserStats } from './challenge';

export type Badge = {
  id: string;
  name: string;
  glyph: string;
  desc: string;
  current: number;
  need: number;
  unit?: string;
  earned: boolean;
};

/** 12 rozet; hepsi kişinin kayıtlarından hesaplanır, ayrıca saklanmaz. */
export function computeBadges(s: UserStats, bodyWeight: number | null | undefined): Badge[] {
  const b = s.byExercise;
  const any100 = EXERCISES.some((e) => e.unit === 'kg' && !e.perHand && b[e.key].best >= 100);
  const early = EXERCISES.some((e) => b[e.key].hasData && b[e.key].start >= e.goal);
  const hasStart = EXERCISES.some((e) => b[e.key].hasData);
  const bw2 = bodyWeight ? Math.round(bodyWeight * 2 * 10) / 10 : 0;

  const list: Omit<Badge, 'earned'>[] = [
    { id: 'first-step', name: 'İlk adım', glyph: '1', desc: 'Başlangıç testini tamamla.', current: hasStart ? 1 : 0, need: 1 },
    { id: 'early', name: 'Daha başlamadan', glyph: '0', desc: 'Daha ilk günden bir hedefi karşıla.', current: early ? 1 : 0, need: 1 },
    { id: 'first-record', name: 'İlk rekor', glyph: 'R', desc: 'Herhangi bir harekette rekorunu kır.', current: Math.min(s.records, 1), need: 1 },
    { id: 'milestone', name: 'Ara durak', glyph: '¼', desc: 'İlk ara hedefini geç.', current: Math.min(s.milestonesAfterStart, 1), need: 1 },
    { id: 'first-goal', name: 'İlk hedef', glyph: '✓', desc: 'Yıl içinde bir hedefi tamamla.', current: Math.min(s.goalsAfterStart, 1), need: 1 },
    { id: 'club-100', name: '100 kg kulübü', glyph: '100', desc: "Herhangi bir halter hareketinde 100 kg'ı geç.", current: any100 ? 1 : 0, need: 1 },
    { id: 'streak-4', name: '4 hafta seri', glyph: '4', desc: '4 hafta üst üste kayıt gir.', current: Math.min(s.maxStreak, 4), need: 4, unit: ' hafta' },
    { id: 'streak-12', name: '12 hafta seri', glyph: '12', desc: '12 hafta üst üste kayıt gir.', current: Math.min(s.maxStreak, 12), need: 12, unit: ' hafta' },
    { id: 'halfway', name: 'Yarı yol', glyph: '5', desc: "9 hedefin 5'ini tamamla.", current: Math.min(s.done, 5), need: 5, unit: ' hedef' },
    { id: 'records-10', name: 'Rekor makinesi', glyph: '10', desc: 'Toplam 10 rekor kır.', current: Math.min(s.records, 10), need: 10, unit: ' rekor' },
    {
      id: 'double',
      name: 'İki kat',
      glyph: '×2',
      desc: 'Vücut ağırlığının 2 katı deadlift kaldır.',
      current: bw2 ? Math.min(b.deadlift.best, bw2) : 0,
      need: bw2 || 1,
      unit: ' kg',
    },
    { id: 'all', name: 'Tam kadro', glyph: '9/9', desc: '9 hedefin hepsini tamamla.', current: s.done, need: 9, unit: ' hedef' },
  ];
  return list.map((x) => ({ ...x, earned: x.current >= x.need && (x.id !== 'double' || bw2 > 0) }));
}
