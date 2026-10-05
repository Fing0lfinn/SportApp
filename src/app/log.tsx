import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Confetti } from '@/components/confetti';
import { EntryForm, type FormValue } from '@/components/entry-form';
import { Icon } from '@/components/icon';
import { Btn, Chips, Pill, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { getLang, useStrings } from '@/i18n';
import {
  computeStats,
  entryText,
  epley,
  exStats,
  fmt,
  fmtValue,
  todayISO,
  valueOf,
  type Exercise,
  type EntryEvent,
  type UserStats,
} from '@/lib/challenge';
import { useLogEntry, useMyStats } from '@/lib/data';
import { syncLocalNotifications } from '@/lib/notifications';

type Result = EntryEvent & { levelUp: string | null; text: string; nextStop: number | null };

function defaults(stats: UserStats, ex: Exercise | undefined): FormValue {
  if (!ex) return { weight: 0, reps: 1, distance: 0 };
  const best = exStats(stats, ex.key).best;
  if (ex.type === 'reps') return { weight: 0, reps: Math.max(1, best), distance: 0 };
  if (ex.type === 'time') return { weight: 0, reps: Math.max(ex.step, best || 30), distance: 0 };
  if (ex.type === 'carry') return { weight: best, reps: 1, distance: ex.distance || 20 };
  return { weight: best, reps: 3, distance: 0 };
}

export default function LogEntry() {
  const t = useStrings();
  const l = t.log;
  const params = useLocalSearchParams<{ exercise?: string }>();
  const mine = useMyStats();
  const ch = mine.challenge;
  const add = useLogEntry();
  const first = ch.byKey[params.exercise ?? ''] ?? ch.exercises[0];
  const [key, setKey] = useState(first?.key ?? '');
  const [value, setValue] = useState<FormValue>(() => defaults(mine.stats, first));
  const [result, setResult] = useState<Result | null>(null);

  const ex = ch.byKey[key] ?? first;
  if (!ex) return null;
  const st = exStats(mine.stats, ex.key);
  const best = st.best;
  const isFirst = !st.hasData;
  const v = valueOf(ex, value);
  const isRecord = !isFirst && v > best;
  const hitsGoal = isRecord && v >= ex.goal && best < ex.goal;

  let info = '';
  if (isFirst) info = l.firstHint;
  else if (ex.type === 'weight') info = l.weightInfo(fmt(epley(value.weight, value.reps)), fmt(best));
  else if (ex.type === 'reps' || ex.type === 'time') info = l.bestInfo(fmtValue(ex, best));
  else info = value.distance >= ex.distance ? l.carryInfo(fmt(best)) : l.carryShort(ex.distance);

  const save = async () => {
    const row = await add.mutateAsync({
      exercise: ex.key,
      ...value,
      performed_on: todayISO(),
      is_start: isFirst,
    });
    const all = [...(mine.data ?? []), row];
    const after = computeStats(all, ch);
    const ev = after.events[row.id] ?? { record: false, milestones: 0, goal: false, xp: 10 };
    const sa = exStats(after, ex.key);
    const res: Result = {
      ...ev,
      levelUp: after.level > mine.stats.level ? t.levels[after.level] : null,
      text: entryText(ex, value),
      nextStop: sa.milestonesDone < 4 ? sa.milestones[sa.milestonesDone] : null,
    };
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        ev.record ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
      );
    }
    syncLocalNotifications(all, ch).catch(() => {});
    setResult(res);
    const celebrate = ev.goal || ev.milestones > 0 || res.levelUp;
    if (!celebrate) setTimeout(() => router.back(), ev.record ? 1500 : 1000);
  };

  if (result) {
    const celebrate = result.goal || result.milestones > 0 || !!result.levelUp;
    const kicker = result.goal
      ? t.feed.badgeGoal
      : result.milestones
        ? t.feed.badgeMilestone
        : result.levelUp
          ? l.levelUp
          : result.record
            ? l.newRecord
            : l.saved;
    const color = result.goal || result.levelUp ? C.gold : C.accent;
    const sub = result.goal
      ? result.text
      : result.milestones && result.nextStop
        ? l.nextStop(fmtValue(ex, result.nextStop))
        : result.text;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
        {celebrate ? <Confetti /> : null}
        <Animated.View
          entering={ZoomIn.springify().damping(12)}
          style={{
            width: 104,
            height: 104,
            borderRadius: 52,
            backgroundColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name={result.record ? 'bolt' : 'check'} size={54} color={C.accentInk} stroke={2.6} />
        </Animated.View>
        <Animated.View entering={FadeIn.delay(200)}>
          <Txt size={15} weight="black" color={color} style={{ textAlign: 'center', letterSpacing: 1.5 }}>
            {kicker}
          </Txt>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(300)}>
          <Txt size={32} weight="black" style={{ textAlign: 'center', lineHeight: 38 }}>
            {result.levelUp && !result.goal && !result.milestones ? result.levelUp : ex.name}
          </Txt>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(400)}>
          <Txt size={17} color={C.sub} style={{ textAlign: 'center' }}>
            {sub}
          </Txt>
        </Animated.View>
        <Animated.View
          entering={FadeIn.delay(500)}
          style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Pill bg={C.surface2} fg={C.accent}>
            +{t.common.xp(result.xp)}
          </Pill>
          {result.levelUp && (result.goal || result.milestones) ? (
            <Pill bg={C.surface2} fg={C.gold}>
              {l.newLevel(result.levelUp.toLocaleUpperCase(getLang()))}
            </Pill>
          ) : null}
        </Animated.View>
        {celebrate || result.record ? (
          <Animated.View
            entering={FadeInDown.delay(650)}
            style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 12 }}>
            <Btn
              kind="secondary"
              title={t.common.share}
              icon="share"
              style={{ flex: 1 }}
              onPress={() =>
                router.replace({
                  pathname: '/share',
                  params: {
                    exercise: ex.key,
                    kicker: result.goal ? t.feed.badgeGoal : result.milestones ? t.feed.badgeMilestone : l.newRecord,
                  },
                })
              }
            />
            {celebrate ? <Btn title={t.common.next} style={{ flex: 1 }} onPress={() => router.back()} /> : null}
          </Animated.View>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 16 }} keyboardShouldPersistTaps="handled">
      <Txt size={24} weight="extrabold">
        {t.home.addEntry}
      </Txt>
      <Chips
        items={ch.exercises.map((e) => ({ key: e.key, label: e.name }))}
        value={ex.key}
        onChange={(k) => {
          setKey(k);
          setValue(defaults(mine.stats, ch.byKey[k]));
        }}
      />
      <EntryForm ex={ex} value={value} onChange={setValue} />
      {ex.type === 'weight' && !ex.perHand ? (
        <Btn
          kind="ghost"
          height={36}
          title={l.plates}
          style={{ alignSelf: 'flex-start', paddingHorizontal: 4 }}
          onPress={() => router.push({ pathname: '/plates', params: { weight: String(value.weight) } })}
        />
      ) : null}
      <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
        {isRecord ? (
          <Animated.View entering={FadeIn}>
            <Pill bg={hitsGoal ? C.gold : C.accent}>{hitsGoal ? l.goalPill : l.recordPill}</Pill>
          </Animated.View>
        ) : null}
        <Txt size={15} color={C.sub} style={{ flexShrink: 1 }}>
          {info}
        </Txt>
      </View>
      {add.error ? (
        <Txt size={15} color={C.danger}>
          {l.saveError(add.error.message)}
        </Txt>
      ) : null}
      <Btn title={t.common.save} onPress={save} loading={add.isPending} />
    </ScrollView>
  );
}
