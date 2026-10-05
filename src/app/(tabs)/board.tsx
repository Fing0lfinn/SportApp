import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { Avatar, Btn, Chips, Empty, Loading, Screen, Segmented, styles, Title, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { EXERCISE_BY_KEY, EXERCISES, fmt, strengthRatio, type ExerciseKey } from '@/lib/challenge';
import { useActiveGroup, useGroupBoard, type Player } from '@/lib/data';

type Mode = 'overall' | 'exercise' | 'ratio';

export default function Board() {
  const { group, loading } = useActiveGroup();
  const board = useGroupBoard(group?.id);
  const [mode, setMode] = useState<Mode>('overall');
  const [exKey, setExKey] = useState<ExerciseKey>('squat');

  if (loading) return <Loading />;

  if (!group) {
    return (
      <Screen>
        <Title>Sıralama</Title>
        <Empty title="Henüz bir grubun yok" text="Arkadaşlarınla yarışmak için bir gruba katıl ya da yeni grup kur.">
          <Btn title="Gruplar" onPress={() => router.push('/groups')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
        </Empty>
      </Screen>
    );
  }

  const ex = EXERCISE_BY_KEY[exKey];
  const byEx = [...board.active].sort((a, b) => b.stats.byExercise[exKey].best - a.stats.byExercise[exKey].best);
  const byRatio = board.active
    .map((p) => ({ p, r: strengthRatio(p.stats, p.bodyWeight) }))
    .sort((a, b) => (b.r ?? -1) - (a.r ?? -1));

  return (
    <Screen refreshing={board.isRefetching} onRefresh={board.refetch} gap={18}>
      <Title sub={`${group.name} · ${board.active.length} kişi`}>Sıralama</Title>
      <Segmented
        items={[
          { key: 'overall', label: 'Genel' },
          { key: 'exercise', label: 'Hareket' },
          { key: 'ratio', label: 'Kilo oranı' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {board.isLoading ? <Loading /> : null}

      {mode === 'overall' ? (
        <View key="overall" style={{ gap: 10 }}>
          {board.ranked.map((p, i) => (
            <Row
              key={p.id}
              i={i}
              p={p}
              sub={`${p.stats.done} / 9 hedef`}
              right={`%${p.stats.pct}`}
            />
          ))}
          <Txt size={14} color={C.sub} style={{ marginHorizontal: 4, lineHeight: 20 }}>
            Puan, 9 hedefteki ilerlemenin ortalamasıdır. Eşitlikte daha çok hedef tamamlayan öne geçer.
          </Txt>
        </View>
      ) : null}

      {mode === 'exercise' ? (
        <View key="exercise" style={{ gap: 12 }}>
          <Chips items={EXERCISES.map((e) => ({ key: e.key, label: e.name }))} value={exKey} onChange={setExKey} />
          <Txt size={15} color={C.sub}>
            Hedef:{' '}
            <Txt size={15} weight="extrabold" color={C.gold}>
              {ex.goal} {ex.unit}
              {ex.perHand ? ' her el' : ''}
            </Txt>
          </Txt>
          {byEx.map((p, i) => {
            const v = p.stats.byExercise[exKey].best;
            return (
              <Row
                key={`${exKey}-${p.id}`}
                i={i}
                p={p}
                right={`${fmt(v)} ${ex.unit === 'kg' ? 'kg' : ''}`}
                done={v >= ex.goal}
              />
            );
          })}
        </View>
      ) : null}

      {mode === 'ratio' ? (
        <View key="ratio" style={{ gap: 10 }}>
          <Txt size={14} color={C.sub} style={{ marginHorizontal: 4, lineHeight: 20 }}>
            Squat + Deadlift + Bench toplamının vücut ağırlığına oranı. Ağır olanın avantajını dengeler.
          </Txt>
          {byRatio.map(({ p, r }, i) => {
            const b = p.stats.byExercise;
            const total = b.squat.best + b.deadlift.best + b.bench.best;
            return (
              <Row
                key={`r-${p.id}`}
                i={i}
                p={p}
                sub={p.bodyWeight ? `${fmt(total)} kg toplam · ${fmt(p.bodyWeight)} kg vücut` : 'Vücut ağırlığı girilmemiş'}
                right={r ? `${fmt(Math.round(r * 100) / 100)}×` : '–'}
              />
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}

function Row({ i, p, sub, right, done }: { i: number; p: Player; sub?: string; right: string; done?: boolean }) {
  return (
    <Animated.View entering={FadeInDown.delay(60 + i * 45).duration(450)}>
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          p.isMe ? router.push('/profile') : router.push({ pathname: '/friend/[id]', params: { id: p.id } })
        }
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: p.isMe ? C.meBg : C.surface,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 14,
            gap: 14,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}>
        <Txt size={20} weight="extrabold" color={i === 0 ? C.gold : C.sub} style={{ width: 24 }}>
          {i + 1}
        </Txt>
        <Avatar name={p.name} color={p.color} />
        <View style={{ flex: 1 }}>
          <Txt size={17} weight="bold" numberOfLines={1}>
            {p.isMe ? `${p.name} (sen)` : p.name}
          </Txt>
          {sub ? (
            <Txt size={14} color={C.sub} numberOfLines={1}>
              {sub}
            </Txt>
          ) : null}
        </View>
        {done ? <Icon name="check" size={20} color={C.gold} stroke={3} /> : null}
        <Txt size={22} weight="extrabold">
          {right}
        </Txt>
      </Pressable>
    </Animated.View>
  );
}
