import { strings } from '@/i18n';

import { exStats, type Challenge, type UserStats } from './challenge';

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

/** Rozetler kişinin kayıtlarından hesaplanır, ayrıca saklanmaz. */
export function computeBadges(s: UserStats, bodyWeight: number | null | undefined, ch: Challenge): Badge[] {
  const t = strings().badges;
  const n = ch.exercises.length;
  const half = Math.ceil(n / 2);
  const any100 = ch.exercises.some((e) => e.type === 'weight' && !e.perHand && exStats(s, e.key).best >= 100);
  const early = ch.exercises.some((e) => exStats(s, e.key).hasData && exStats(s, e.key).start >= e.goal);
  const hasStart = ch.exercises.some((e) => exStats(s, e.key).hasData);
  const bw2 = bodyWeight ? Math.round(bodyWeight * 2 * 10) / 10 : 0;

  const list: Omit<Badge, 'earned'>[] = [
    { id: 'first-step', name: t.firstStep, glyph: '1', desc: t.firstStepDesc, current: hasStart ? 1 : 0, need: 1 },
    { id: 'early', name: t.early, glyph: '0', desc: t.earlyDesc, current: early ? 1 : 0, need: 1 },
    { id: 'first-record', name: t.firstRecord, glyph: 'R', desc: t.firstRecordDesc, current: Math.min(s.records, 1), need: 1 },
    { id: 'milestone', name: t.milestone, glyph: '¼', desc: t.milestoneDesc, current: Math.min(s.milestonesAfterStart, 1), need: 1 },
    { id: 'first-goal', name: t.firstGoal, glyph: '✓', desc: t.firstGoalDesc, current: Math.min(s.goalsAfterStart, 1), need: 1 },
    { id: 'club-100', name: t.club100, glyph: '100', desc: t.club100Desc, current: any100 ? 1 : 0, need: 1 },
    { id: 'streak-4', name: t.streak(4), glyph: '4', desc: t.streakDesc(4), current: Math.min(s.maxStreak, 4), need: 4, unit: t.unitWeeks },
    { id: 'streak-12', name: t.streak(12), glyph: '12', desc: t.streakDesc(12), current: Math.min(s.maxStreak, 12), need: 12, unit: t.unitWeeks },
    { id: 'halfway', name: t.halfway, glyph: String(half), desc: t.halfwayDesc(n, half), current: Math.min(s.done, half), need: half, unit: t.unitGoals },
    { id: 'records-10', name: t.records10, glyph: '10', desc: t.records10Desc, current: Math.min(s.records, 10), need: 10, unit: t.unitRecords },
    ...(ch.byKey.deadlift
      ? [
          {
            id: 'double',
            name: t.double,
            glyph: '×2',
            desc: t.doubleDesc,
            current: bw2 ? Math.min(exStats(s, 'deadlift').best, bw2) : 0,
            need: bw2 || 1,
            unit: ' kg',
          },
        ]
      : []),
    { id: 'all', name: t.all, glyph: `${n}/${n}`, desc: t.allDesc(n), current: s.done, need: n, unit: t.unitGoals },
  ];
  return list.map((x) => ({ ...x, earned: x.current >= x.need && (x.id !== 'double' || bw2 > 0) }));
}
