import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { Avatar, Btn, Chips, Empty, Loading, Screen, Segmented, styles, Title, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { AdBanner } from '@/components/ad-banner';
import { getLang, useStrings } from '@/i18n';
import { catalogName } from '@/lib/catalog';
import { exStats, fmt, fmtShort, fmtValue, ratioKeys, strengthRatio, unitOf } from '@/lib/challenge';
import { useActiveGroup, useChallenge, useGroupBoard, type Player } from '@/lib/data';

type Mode = 'overall' | 'exercise' | 'ratio';

export default function Board() {
  const t = useStrings();
  const { group, loading } = useActiveGroup();
  const ch = useChallenge();
  const board = useGroupBoard(ch);
  const [mode, setMode] = useState<Mode>('overall');
  const [picked, setPicked] = useState('');

  if (loading) return <Loading />;

  if (!group) {
    return (
      <Screen>
        <Title>{t.board.title}</Title>
        <Empty title={t.board.noGroupTitle} text={t.board.noGroupText}>
          <Btn title={t.board.groups} onPress={() => router.push('/groups')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
        </Empty>
      </Screen>
    );
  }

  const ex = ch.byKey[picked] ?? ch.exercises[0];
  const exKey = ex?.key ?? '';
  const byEx = [...board.active].sort((a, b) => exStats(b.stats, exKey).best - exStats(a.stats, exKey).best);
  const rKeys = ratioKeys(ch);
  const byRatio = board.active
    .map((p) => ({ p, r: strengthRatio(p.stats, p.bodyWeight, ch) }))
    .sort((a, b) => (b.r ?? -1) - (a.r ?? -1));
  const modes = [
    { key: 'overall' as const, label: t.board.overall },
    { key: 'exercise' as const, label: t.board.exercise },
    ...(rKeys.length ? [{ key: 'ratio' as const, label: t.board.ratio }] : []),
  ];

  return (
    <Screen refreshing={board.isRefetching} onRefresh={board.refetch} gap={18}>
      <Title sub={t.board.sub(group.name, board.active.length)}>{t.board.title}</Title>
      <Segmented items={modes} value={mode} onChange={setMode} />

      {board.isLoading ? <Loading /> : null}

      {mode === 'overall' ? (
        <View key="overall" style={{ gap: 10 }}>
          {board.ranked.map((p, i) => (
            <Row
              key={p.id}
              i={i}
              p={p}
              sub={t.home.goalsDone(p.stats.done, ch.exercises.length)}
              right={t.pct(p.stats.pct)}
            />
          ))}
          <Txt size={14} color={C.sub} style={{ marginHorizontal: 4, lineHeight: 20 }}>
            {t.board.overallNote(ch.exercises.length)}
          </Txt>
        </View>
      ) : null}

      {mode === 'exercise' && ex ? (
        <View key="exercise" style={{ gap: 12 }}>
          <Chips items={ch.exercises.map((e) => ({ key: e.key, label: e.name }))} value={exKey} onChange={setPicked} />
          <Txt size={15} color={C.sub}>
            {t.board.goal}{' '}
            <Txt size={15} weight="extrabold" color={C.gold}>
              {fmtValue(ex, ex.goal)}
              {ex.perHand ? ` ${t.units.perHand}` : ''}
            </Txt>
          </Txt>
          {byEx.map((p, i) => {
            const v = exStats(p.stats, exKey).best;
            return (
              <Row
                key={`${exKey}-${p.id}`}
                i={i}
                p={p}
                right={`${fmtShort(ex, v)} ${ex.type === 'reps' ? '' : unitOf(ex, v)}`.trim()}
                done={v >= ex.goal}
              />
            );
          })}
        </View>
      ) : null}

      {mode === 'ratio' ? (
        <View key="ratio" style={{ gap: 10 }}>
          <Txt size={14} color={C.sub} style={{ marginHorizontal: 4, lineHeight: 20 }}>
            {t.board.ratioNote(rKeys.map((k) => catalogName(k, getLang())).join(' + '))}
          </Txt>
          {byRatio.map(({ p, r }, i) => {
            const total = rKeys.reduce((sum, k) => sum + exStats(p.stats, k).best, 0);
            return (
              <Row
                key={`r-${p.id}`}
                i={i}
                p={p}
                sub={p.bodyWeight ? t.board.ratioSub(fmt(total), fmt(p.bodyWeight)) : t.board.noBodyWeight}
                right={r ? `${fmt(Math.round(r * 100) / 100)}×` : '–'}
              />
            );
          })}
        </View>
      ) : null}
      <AdBanner />
    </Screen>
  );
}

function Row({ i, p, sub, right, done }: { i: number; p: Player; sub?: string; right: string; done?: boolean }) {
  const t = useStrings();
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
            {p.isMe ? t.board.meName(p.name) : p.name}
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
