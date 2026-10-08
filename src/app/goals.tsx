import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/icon';
import { Btn, Card, Chips, IconBtn, Loading, Screen, Stepper, styles, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { fmt, formatDate, isoFromIndex, todayISO } from '@/lib/challenge';
import { useProfile } from '@/lib/data';
import {
  ACTIVITIES,
  ageFromBirthYear,
  calcTargets,
  GOALS,
  PACES,
  useBodyWeights,
  useHealthSettings,
  useLogWeight,
  useSaveHealthSettings,
  type Activity,
  type Goal,
  type HealthSettings,
  type Sex,
} from '@/lib/health';

const GOAL_ICON: Record<Goal, IconName> = { lose: 'down', gain: 'up', muscle: 'bolt', maintain: 'scale' };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const half = (v: number) => Math.round(v * 2) / 2;

export default function Goals() {
  const settings = useHealthSettings();
  const profile = useProfile();
  const weights = useBodyWeights();
  if (settings.isLoading || profile.isLoading || weights.isLoading) return <Loading />;
  const latest = weights.data?.at(-1)?.weight ?? profile.data?.body_weight ?? null;
  return <GoalsForm initial={settings.data ?? null} weight={latest ? Number(latest) : null} />;
}

function GoalsForm({ initial, weight: startWeight }: { initial: HealthSettings | null; weight: number | null }) {
  const t = useStrings();
  const g = t.goals;
  const save = useSaveHealthSettings();
  const logWeight = useLogWeight();

  const [goal, setGoal] = useState<Goal | null>((initial?.goal as Goal) ?? null);
  const [sex, setSex] = useState<Sex | null>((initial?.sex as Sex) ?? null);
  const [age, setAge] = useState(ageFromBirthYear(initial?.birth_year) ?? 25);
  const [height, setHeight] = useState(initial?.height_cm ?? 175);
  const [weight, setWeight] = useState(startWeight ?? 75);
  const [activity, setActivity] = useState<Activity>((initial?.activity as Activity) ?? 'moderate');
  const [target, setTarget] = useState(initial?.target_weight ? Number(initial.target_weight) : null);
  const [pace, setPace] = useState(initial?.pace ? Number(initial.pace) : 0.5);
  // Elle değiştirilen günlük hedefler; null ise öneri kullanılır.
  const [custom, setCustom] = useState<{ kcal: number; protein: number; water: number } | null>(
    initial?.kcal_target && initial.protein_target && initial.water_target
      ? { kcal: initial.kcal_target, protein: initial.protein_target, water: initial.water_target }
      : null,
  );
  const [error, setError] = useState('');

  const needsTarget = goal === 'lose' || goal === 'gain';
  const paces = goal === 'lose' || goal === 'gain' ? PACES[goal] : [];
  const pacing = paces.includes(pace) ? pace : 0.25;
  const targetWeight = needsTarget ? (target ?? (goal === 'lose' ? weight - 5 : weight + 5)) : null;

  const rec = useMemo(
    () =>
      goal && sex
        ? calcTargets({ goal, sex, age, heightCm: height, weight, activity, targetWeight, pace: pacing })
        : null,
    [goal, sex, age, height, weight, activity, targetWeight, pacing],
  );
  const daily = custom ?? (rec ? { kcal: rec.kcal, protein: rec.protein, water: rec.water } : null);
  const edit = (patch: Partial<{ kcal: number; protein: number; water: number }>) =>
    daily && setCustom({ ...daily, ...patch });

  const eta = rec?.weeks ? isoFromIndex(rec.weeks * 7, todayISO()) : null;

  return (
    <Screen bottom={60} gap={18}>
      <IconBtn name="back" label={t.common.back} onPress={() => router.back()} />
      <View style={{ gap: 4 }}>
        <Txt size={32} weight="extrabold">
          {g.title}
        </Txt>
        <Txt size={15} color={C.sub}>
          {g.sub}
        </Txt>
      </View>

      <Section title={g.goalTitle}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {GOALS.map((k) => {
            const on = k === goal;
            return (
              <Pressable
                key={k}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  setGoal(k);
                  setTarget(null);
                  setCustom(null);
                }}
                style={({ pressed }) => ({
                  width: '48%',
                  flexGrow: 1,
                  backgroundColor: on ? C.meBg : C.surface,
                  borderColor: on ? C.accent : 'transparent',
                  borderWidth: 2,
                  borderRadius: 20,
                  padding: 14,
                  gap: 6,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                })}>
                <Icon name={GOAL_ICON[k]} size={22} color={on ? C.accent : C.sub} stroke={2.6} />
                <Txt size={16} weight="extrabold">
                  {g.goals[k]}
                </Txt>
                <Txt size={13} color={C.sub}>
                  {g.goalsSub[k]}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title={g.aboutYou}>
        <Chips
          items={[
            { key: 'male' as const, label: g.male },
            { key: 'female' as const, label: g.female },
          ]}
          value={sex ?? ('' as Sex)}
          onChange={(v) => {
            setSex(v);
            setCustom(null);
          }}
        />
        <Stepper
          title={g.age}
          sub={g.years}
          value={String(age)}
          onDec={() => setAge(clamp(age - 1, 14, 90))}
          onInc={() => setAge(clamp(age + 1, 14, 90))}
        />
        <Stepper
          title={g.height}
          sub="cm"
          value={String(height)}
          onDec={() => setHeight(clamp(height - 1, 120, 220))}
          onInc={() => setHeight(clamp(height + 1, 120, 220))}
        />
        <Stepper
          title={g.weight}
          sub="kg"
          value={fmt(weight)}
          onDec={() => setWeight(clamp(half(weight - 0.5), 30, 300))}
          onInc={() => setWeight(clamp(half(weight + 0.5), 30, 300))}
        />
        <Txt size={14} weight="bold" color={C.sub} style={{ marginTop: 4 }}>
          {g.activity}
        </Txt>
        {ACTIVITIES.map((a) => {
          const on = a === activity;
          return (
            <Pressable
              key={a}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => {
                setActivity(a);
                setCustom(null);
              }}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: on ? C.meBg : C.surface,
                  borderColor: on ? C.accent : 'transparent',
                  borderWidth: 2,
                  borderRadius: 16,
                  padding: 12,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}>
              <View style={{ flex: 1 }}>
                <Txt size={15} weight="bold">
                  {g.activities[a]}
                </Txt>
                <Txt size={13} color={C.sub}>
                  {g.activitiesSub[a]}
                </Txt>
              </View>
              {on ? <Icon name="check" size={20} color={C.accent} stroke={3} /> : null}
            </Pressable>
          );
        })}
      </Section>

      {needsTarget && targetWeight !== null ? (
        <Section title={g.targetTitle}>
          <Stepper
            title={g.targetWeight}
            sub="kg"
            value={fmt(targetWeight)}
            onDec={() => setTarget(clamp(half(targetWeight - 0.5), 30, 300))}
            onInc={() => setTarget(clamp(half(targetWeight + 0.5), 30, 300))}
          />
          <Chips
            items={paces.map((p) => ({ key: String(p), label: g.pace(fmt(p)) }))}
            value={String(pacing)}
            onChange={(v) => {
              setPace(Number(v));
              setCustom(null);
            }}
          />
        </Section>
      ) : null}

      {rec && daily ? (
        <Animated.View entering={FadeIn.duration(300)}>
          <Card style={{ gap: 14 }}>
            <View style={styles.rowBetween}>
              <Txt size={20} weight="extrabold">
                {g.dailyTitle}
              </Txt>
              {custom ? (
                <Pressable accessibilityRole="button" onPress={() => setCustom(null)} hitSlop={8}>
                  <Txt size={14} weight="bold" color={C.accent}>
                    {g.useRecommended}
                  </Txt>
                </Pressable>
              ) : null}
            </View>
            <Stepper
              title={g.kcal}
              sub="kcal"
              value={String(daily.kcal)}
              onDec={() => edit({ kcal: clamp(daily.kcal - 50, 800, 6000) })}
              onInc={() => edit({ kcal: clamp(daily.kcal + 50, 800, 6000) })}
            />
            <Stepper
              title={g.protein}
              sub="g"
              value={`${daily.protein}`}
              onDec={() => edit({ protein: clamp(daily.protein - 5, 0, 400) })}
              onInc={() => edit({ protein: clamp(daily.protein + 5, 0, 400) })}
            />
            <Stepper
              title={g.water}
              sub="ml"
              value={`${daily.water}`}
              onDec={() => edit({ water: clamp(daily.water - 100, 500, 6000) })}
              onInc={() => edit({ water: clamp(daily.water + 100, 500, 6000) })}
            />
            <Txt size={14} color={C.sub} style={{ lineHeight: 20 }}>
              {g.recommended(rec.kcal, rec.protein, rec.water)} {g.tdee(rec.tdee)}
            </Txt>
            {eta && targetWeight !== null ? (
              <Txt size={15} weight="bold" color={C.accent} style={{ lineHeight: 21 }}>
                {g.eta(fmt(targetWeight), rec.weeks ?? 0, formatDate(eta))}
              </Txt>
            ) : null}
            {goal === 'muscle' ? (
              <Txt size={14} color={C.sub} style={{ lineHeight: 20 }}>
                {g.muscleNote}
              </Txt>
            ) : null}
            {rec.floored ? <Warning text={g.floored} /> : null}
            {rec.lowTarget ? <Warning text={g.lowTarget} /> : null}
            {needsTarget && !rec.weeks && !rec.floored ? <Warning text={g.wrongWay} /> : null}
          </Card>
        </Animated.View>
      ) : (
        <Txt size={14} color={C.sub}>
          {g.fillIn}
        </Txt>
      )}

      <Txt size={13} color={C.muted} style={{ lineHeight: 19 }}>
        {g.disclaimer}
      </Txt>
      {error ? (
        <Txt size={14} color={C.danger}>
          {error}
        </Txt>
      ) : null}
      <Btn
        title={t.common.save}
        disabled={!goal || !sex || !daily}
        loading={save.isPending}
        onPress={async () => {
          if (!goal || !sex || !daily) return;
          setError('');
          try {
            await save.mutateAsync({
              goal,
              sex,
              birth_year: new Date().getFullYear() - age,
              height_cm: height,
              activity,
              target_weight: targetWeight,
              pace: needsTarget ? pacing : null,
              kcal_target: daily.kcal,
              protein_target: daily.protein,
              water_target: daily.water,
            });
            if (weight !== startWeight) await logWeight.mutateAsync({ weight });
            router.back();
          } catch {
            setError(g.saveError);
          }
        }}
      />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Txt size={20} weight="extrabold">
        {title}
      </Txt>
      {children}
    </View>
  );
}

function Warning({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: C.goldBg, borderRadius: 14, padding: 12 }}>
      <Txt size={14} color={C.gold} style={{ lineHeight: 20 }}>
        {text}
      </Txt>
    </View>
  );
}
