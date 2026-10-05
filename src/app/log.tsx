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
import {
  computeStats,
  entryText,
  epley,
  EXERCISE_BY_KEY,
  EXERCISES,
  fmt,
  todayISO,
  valueOf,
  type EntryEvent,
  type ExerciseKey,
  type UserStats,
} from '@/lib/challenge';
import { useLogEntry, useMyStats } from '@/lib/data';
import { syncLocalNotifications } from '@/lib/notifications';

type Result = EntryEvent & { levelUp: string | null; text: string; nextStop: number | null };

function defaults(stats: UserStats, key: ExerciseKey): FormValue {
  const ex = EXERCISE_BY_KEY[key];
  const best = stats.byExercise[key].best;
  if (ex.type === 'reps') return { weight: 0, reps: Math.max(1, best), distance: 0 };
  if (ex.type === 'carry') return { weight: best, reps: 1, distance: 20 };
  return { weight: best, reps: 3, distance: 0 };
}

export default function LogEntry() {
  const params = useLocalSearchParams<{ exercise?: ExerciseKey }>();
  const mine = useMyStats();
  const add = useLogEntry();
  const [key, setKey] = useState<ExerciseKey>(params.exercise ?? 'squat');
  const [value, setValue] = useState<FormValue>(() => defaults(mine.stats, params.exercise ?? 'squat'));
  const [result, setResult] = useState<Result | null>(null);

  const ex = EXERCISE_BY_KEY[key];
  const best = mine.stats.byExercise[key].best;
  const v = valueOf(ex, value);
  const isRecord = v > best;
  const hitsGoal = isRecord && v >= ex.goal && best < ex.goal;

  let info = '';
  if (ex.type === 'weight') info = `Tahmini maks ${fmt(epley(value.weight, value.reps))} kg · en iyin ${fmt(best)} kg`;
  else if (ex.type === 'reps') info = `En iyin ${best} tekrar`;
  else info = value.distance >= 20 ? `Her elde · en iyin ${fmt(best)} kg` : 'Sayılması için en az 20 m';

  const save = async () => {
    const row = await add.mutateAsync({ exercise: key, ...value, performed_on: todayISO() });
    const all = [...(mine.data ?? []), row];
    const after = computeStats(all);
    const ev = after.events[row.id] ?? { record: false, milestones: 0, goal: false, xp: 10 };
    const st = after.byExercise[key];
    const res: Result = {
      ...ev,
      levelUp: after.level > mine.stats.level ? after.levelName : null,
      text: entryText(ex, value),
      nextStop: st.milestonesDone < 4 ? st.milestones[st.milestonesDone] : null,
    };
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(ev.record ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    }
    syncLocalNotifications(all).catch(() => {});
    setResult(res);
    const celebrate = ev.goal || ev.milestones > 0 || res.levelUp;
    if (!celebrate) setTimeout(() => router.back(), ev.record ? 1500 : 1000);
  };

  if (result) {
    const celebrate = result.goal || result.milestones > 0 || !!result.levelUp;
    const kicker = result.goal
      ? 'HEDEF TAMAM'
      : result.milestones
        ? 'ARA HEDEF'
        : result.levelUp
          ? 'SEVİYE ATLADIN'
          : result.record
            ? 'YENİ REKOR'
            : 'KAYDEDİLDİ';
    const color = result.goal || result.levelUp ? C.gold : C.accent;
    const sub = result.goal
      ? result.text
      : result.milestones && result.nextStop
        ? `Sıradaki durak: ${fmt(result.nextStop)} ${ex.unit}`
        : result.text;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
        {celebrate ? <Confetti /> : null}
        <Animated.View
          entering={ZoomIn.springify().damping(12)}
          style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
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
        <Animated.View entering={FadeIn.delay(500)} style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Pill bg={C.surface2} fg={C.accent}>
            +{result.xp} XP
          </Pill>
          {result.levelUp && (result.goal || result.milestones) ? (
            <Pill bg={C.surface2} fg={C.gold}>
              YENİ SEVİYE: {result.levelUp.toLocaleUpperCase('tr-TR')}
            </Pill>
          ) : null}
        </Animated.View>
        {celebrate || result.record ? (
          <Animated.View entering={FadeInDown.delay(650)} style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 12 }}>
            <Btn
              kind="secondary"
              title="Paylaş"
              icon="share"
              style={{ flex: 1 }}
              onPress={() =>
                router.replace({
                  pathname: '/share',
                  params: { exercise: key, kicker: result.goal ? 'HEDEF TAMAM' : result.milestones ? 'ARA HEDEF' : 'YENİ REKOR' },
                })
              }
            />
            {celebrate ? <Btn title="Devam" style={{ flex: 1 }} onPress={() => router.back()} /> : null}
          </Animated.View>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 16 }} keyboardShouldPersistTaps="handled">
      <Txt size={24} weight="extrabold">
        Kayıt ekle
      </Txt>
      <Chips
        items={EXERCISES.map((e) => ({ key: e.key, label: e.name }))}
        value={key}
        onChange={(k) => {
          setKey(k);
          setValue(defaults(mine.stats, k));
        }}
      />
      <EntryForm ex={ex} value={value} onChange={setValue} />
      {ex.type === 'weight' && !ex.perHand ? (
        <Btn
          kind="ghost"
          height={36}
          title="Plaka hesapla"
          style={{ alignSelf: 'flex-start', paddingHorizontal: 4 }}
          onPress={() => router.push({ pathname: '/plates', params: { weight: String(value.weight) } })}
        />
      ) : null}
      <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
        {isRecord ? (
          <Animated.View entering={FadeIn}>
            <Pill bg={hitsGoal ? C.gold : C.accent}>{hitsGoal ? 'HEDEF!' : 'REKOR'}</Pill>
          </Animated.View>
        ) : null}
        <Txt size={15} color={C.sub} style={{ flexShrink: 1 }}>
          {info}
        </Txt>
      </View>
      {add.error ? (
        <Txt size={15} color={C.danger}>
          Kaydedilemedi: {add.error.message}
        </Txt>
      ) : null}
      <Btn title="Kaydet" onPress={save} loading={add.isPending} />
    </ScrollView>
  );
}
