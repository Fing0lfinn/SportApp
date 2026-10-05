import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { EntryForm, type FormValue } from '@/components/entry-form';
import { Icon } from '@/components/icon';
import { Btn, Chips, Pill, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import {
  computeStats,
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
import { useAddEntries, useMyStats } from '@/lib/data';

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
  const add = useAddEntries();
  const [key, setKey] = useState<ExerciseKey>(params.exercise ?? 'squat');
  const [value, setValue] = useState<FormValue>(() => defaults(mine.stats, params.exercise ?? 'squat'));
  const [result, setResult] = useState<EntryEvent | null>(null);

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
    const rows = await add.mutateAsync([{ exercise: key, ...value, performed_on: todayISO() }]);
    const row = rows[0];
    const ev = computeStats([...(mine.data ?? []), row]).events[row.id] ?? { record: false, milestones: 0, goal: false, xp: 10 };
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(ev.record ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    }
    setResult(ev);
    setTimeout(() => router.back(), ev.record ? 1800 : 1100);
  };

  if (result) {
    const title = result.goal ? 'HEDEF TAMAM!' : result.milestones ? 'ARA HEDEF!' : result.record ? 'YENİ REKOR!' : 'Kaydedildi';
    const color = result.goal ? C.gold : C.accent;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
        <Animated.View
          entering={ZoomIn.duration(450)}
          style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={52} color={C.accentInk} stroke={3} />
        </Animated.View>
        <Animated.View entering={FadeIn.delay(200)}>
          <Txt size={28} weight="black" color={color} style={{ textAlign: 'center' }}>
            {title}
          </Txt>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(350)}>
          <Txt size={17} color={C.sub} style={{ textAlign: 'center' }}>
            {ex.name} · +{result.xp} XP
          </Txt>
        </Animated.View>
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
