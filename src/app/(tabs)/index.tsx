import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { FlameIcon, Icon } from '@/components/icon';
import { Bar, CountUp, Loading, Ring, Screen, styles, Txt } from '@/components/ui';
import { C, F } from '@/constants/theme';
import { daysLeft, EXERCISES, fmt, todayIndex } from '@/lib/challenge';
import { useActiveGroup, useGroupBoard, useMyStats } from '@/lib/data';

export default function Home() {
  const { group } = useActiveGroup();
  const mine = useMyStats();
  const board = useGroupBoard(group?.id);
  const myRank = board.ranked.findIndex((p) => p.isMe) + 1;
  const s = mine.stats;

  if (mine.isLoading) return <Loading />;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Screen
        bottom={170}
        refreshing={mine.isRefetching}
        onRefresh={() => {
          mine.refetch();
          board.refetch();
        }}>
        <View style={styles.rowBetween}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/groups')}
            style={({ pressed }) => [chip, { transform: [{ scale: pressed ? 0.97 : 1 }], flexShrink: 1 }]}>
            <Txt size={15} weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
              {group?.name ?? 'Gruba katıl'}
            </Txt>
            <Icon name="chevronDown" size={18} color={C.sub} stroke={2.6} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Seri: ${s.streak} hafta`}
            onPress={() => router.push('/profile')}
            style={({ pressed }) => [chip, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
            <FlameIcon />
            <Txt size={15} weight="extrabold">
              {s.streak} hafta
            </Txt>
          </Pressable>
        </View>

        <View style={{ backgroundColor: C.surface, borderRadius: 28, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 22 }}>
          <Ring value={s.pct / 100}>
            <CountUp to={s.pct} prefix="%" style={{ fontFamily: F.extrabold, fontSize: 36, color: C.text }} />
          </Ring>
          <View style={{ gap: 6, flexShrink: 1 }}>
            <Txt size={14} weight="semibold" color={C.sub}>
              Gün {todayIndex() + 1} / 365
            </Txt>
            <Txt size={24} weight="extrabold">
              {s.done} / 9 hedef
            </Txt>
            {myRank > 0 ? (
              <Pressable onPress={() => router.push('/board')} hitSlop={8}>
                <Txt size={15} weight="semibold" color={C.sub}>
                  Sıran: <Txt size={15} weight="extrabold" color={C.accent}>{myRank}.</Txt>
                </Txt>
              </Pressable>
            ) : null}
            <Txt size={15} color={C.sub}>
              {daysLeft()} gün kaldı
            </Txt>
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Txt size={20} weight="extrabold">
            Hedefler
          </Txt>
          {EXERCISES.map((ex, i) => {
            const st = s.byExercise[ex.key];
            const q = Math.min(1, st.best / ex.goal);
            const done = q >= 1;
            const ticks = st.start < ex.goal ? st.milestones.slice(0, 3).map((m) => Math.min(1, m / ex.goal)) : [];
            return (
              <Animated.View key={ex.key} entering={FadeInDown.delay(80 + i * 45).duration(450)}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/exercise/[key]', params: { key: ex.key } })}
                  style={({ pressed }) => ({
                    backgroundColor: C.surface,
                    borderRadius: 20,
                    paddingHorizontal: 18,
                    paddingVertical: 16,
                    gap: 12,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}>
                  <View style={styles.rowBetween}>
                    <View style={[styles.row, { gap: 8, flexShrink: 1 }]}>
                      <Txt size={17} weight="bold" style={{ flexShrink: 1 }}>
                        {ex.label}
                      </Txt>
                      {done ? <Icon name="check" size={18} color={C.gold} stroke={3} /> : null}
                    </View>
                    <Txt size={16} weight="bold">
                      {fmt(st.best)}
                      <Txt size={16} weight="semibold" color={C.sub}>
                        {' '}
                        / {ex.goal} {ex.unit}
                      </Txt>
                    </Txt>
                  </View>
                  <Bar value={q} color={done ? C.gold : C.accent} ticks={ticks} delay={260 + i * 45} />
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </Screen>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/log')}
        style={({ pressed }) => ({
          position: 'absolute',
          right: 20,
          bottom: 20,
          height: 58,
          paddingLeft: 20,
          paddingRight: 24,
          borderRadius: 29,
          backgroundColor: C.accent,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          transform: [{ scale: pressed ? 0.95 : 1 }],
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        })}>
        <Icon name="plus" size={22} color={C.accentInk} stroke={3} />
        <Txt size={17} weight="extrabold" color={C.accentInk}>
          Kayıt ekle
        </Txt>
      </Pressable>
    </View>
  );
}

const chip = {
  height: 44,
  paddingHorizontal: 16,
  borderRadius: 22,
  backgroundColor: C.surface,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
};
