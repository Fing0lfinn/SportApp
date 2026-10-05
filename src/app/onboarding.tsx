import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Polygon } from 'react-native-svg';

import { ExerciseListEditor, StartDatePicker } from '@/components/challenge-editor';
import { Avatar, Bar, Btn, Field, Stepper, Txt } from '@/components/ui';
import { AVATAR_COLORS, C } from '@/constants/theme';
import { useStrings, type Dict } from '@/i18n';
import { useAuth } from '@/lib/auth';
import {
  DEFAULT_ROWS,
  exStats,
  fmtShort,
  fmtValue,
  progressOf,
  todayISO,
  XP,
  type Exercise,
  type ExerciseRow,
} from '@/lib/challenge';
import { useAddEntries, useCreateGroup, useJoinGroup, useMyStats, useUpdateProfile } from '@/lib/data';
import { usePro } from '@/lib/pro';
import { providerName } from '@/lib/social-auth';

/** Başlangıç testinde ilk gösterilen tahmini değer */
const START_GUESS: Record<string, number> = {
  squat: 60,
  deadlift: 80,
  bench: 50,
  ohp: 30,
  pushup: 15,
  pullup: 3,
  bulgarian: 8,
  farmer: 20,
  row: 50,
};

function guess(ex: Exercise) {
  if (START_GUESS[ex.key] !== undefined && !ex.custom) return START_GUESS[ex.key];
  return Math.max(ex.step, Math.round((ex.goal * 0.5) / ex.step) * ex.step);
}

export default function Onboarding() {
  const t = useStrings();
  const o = t.onboarding;
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [step, setStep] = useState(0);
  // Apple/Google ile girildiyse ad hazır gelir, istenirse değiştirilir.
  const [name, setName] = useState(() => providerName(session?.user.user_metadata));
  const [color, setColor] = useState<string>(AVATAR_COLORS[0]);
  const [bw, setBw] = useState(80);
  const [values, setValues] = useState<Record<string, number>>({});
  const [ex, setEx] = useState(0);
  const [error, setError] = useState('');

  const mine = useMyStats();
  const ch = mine.challenge;
  const addEntries = useAddEntries();
  const updateProfile = useUpdateProfile();

  // Başlangıç değeri olmayan hareketler sorulur
  const todo = ch.exercises.filter((e) => !exStats(mine.stats, e.key).hasData);
  const cur = todo.length ? todo[Math.min(ex, todo.length - 1)] : undefined;
  const valueFor = (e: Exercise) => values[e.key] ?? guess(e);
  const setValue = (e: Exercise, v: number) =>
    setValues({ ...values, [e.key]: Math.max(0, Math.round(v * 100) / 100) });

  const saveProfileAndNext = async () => {
    if (!name.trim()) {
      setError(o.nameRequired);
      return;
    }
    setError('');
    await updateProfile.mutateAsync({ name: name.trim(), color, body_weight: bw });
    setStep(1);
  };

  const finishTest = async () => {
    if (todo.length) {
      const day = todayISO();
      await addEntries.mutateAsync(
        todo.map((e) => {
          const v = valueFor(e);
          const count = e.type === 'reps' || e.type === 'time';
          return {
            exercise: e.key,
            weight: count ? 0 : v,
            reps: count ? v : 1,
            distance: e.type === 'carry' ? e.distance : 0,
            performed_on: day,
            is_start: true,
          };
        }),
      );
    }
    setStep(3);
  };

  const finish = () => updateProfile.mutate({ onboarded: true });
  const pct = progressOf(
    ch.exercises.map((e) => {
      const st = exStats(mine.stats, e.key);
      return st.hasData ? st.best : valueFor(e);
    }),
    ch.exercises,
  ).pct;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}>
        {step < 3 ? <Progress step={step} part={todo.length ? (ex + 1) / todo.length : 1} /> : null}

        {step === 0 ? (
          <Animated.View key="s0" entering={FadeInRight.duration(380)} style={{ flex: 1, gap: 22, marginTop: 24 }}>
            <View>
              <Txt size={32} weight="extrabold">
                {o.welcomeTitle}
              </Txt>
              <Txt size={16} color={C.sub}>
                {o.welcomeText}
              </Txt>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Avatar name={name || '?'} color={color} size={104} />
            </View>
            <Field
              label={t.profile.nameLabel}
              value={name}
              onChangeText={(v) => setName(v.slice(0, 24))}
              placeholder={o.namePlaceholder}
            />
            <View style={{ gap: 10 }}>
              <Txt size={14} weight="bold" color={C.sub}>
                {o.color}
              </Txt>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {AVATAR_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    accessibilityRole="button"
                    accessibilityLabel={t.profile.colorLabel(c)}
                    accessibilityState={{ selected: c === color }}
                    onPress={() => setColor(c)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: c,
                      borderWidth: c === color ? 3 : 0,
                      borderColor: C.text,
                    }}
                  />
                ))}
              </View>
            </View>
            <Stepper
              title={t.profile.bodyWeight}
              sub={o.bodyWeightSub}
              value={String(bw)}
              onDec={() => setBw(Math.max(30, bw - 1))}
              onInc={() => setBw(Math.min(300, bw + 1))}
            />
            {error ? (
              <Txt size={15} color={C.danger}>
                {error}
              </Txt>
            ) : null}
            <View style={{ flex: 1 }} />
            <Btn title={t.common.next} onPress={saveProfileAndNext} loading={updateProfile.isPending} />
          </Animated.View>
        ) : null}

        {step === 1 ? (
          <GroupStep
            onDone={() => {
              setEx(0);
              setStep(2);
            }}
          />
        ) : null}

        {step === 2 && !cur ? (
          <View style={{ flex: 1, gap: 18, marginTop: 24 }}>
            <Txt size={20} weight="extrabold">
              {o.allHaveStart}
            </Txt>
            <View style={{ flex: 1 }} />
            <Btn title={t.common.next} onPress={() => setStep(3)} />
          </View>
        ) : null}

        {step === 2 && cur ? (
          <View style={{ flex: 1, gap: 18, marginTop: 24 }}>
            <View>
              <Txt size={15} weight="bold" color={C.sub}>
                {o.testProgress(Math.min(ex, todo.length - 1) + 1, todo.length)}
              </Txt>
              <Txt size={16} color={C.sub} style={{ marginTop: 6 }}>
                {o.testIntro}
              </Txt>
            </View>
            <Animated.View key={`ex-${cur.key}`} entering={FadeInRight.duration(350)} style={{ gap: 14 }}>
              <View
                style={{ backgroundColor: C.surface, borderRadius: 28, padding: 22, gap: 16, alignItems: 'center' }}>
                <Txt size={30} weight="black" style={{ textAlign: 'center', lineHeight: 36 }}>
                  {cur.name}
                </Txt>
                <Txt size={16} color={C.sub} style={{ textAlign: 'center' }}>
                  {question(cur, o)}
                </Txt>
                <Stepper
                  big
                  title={
                    cur.type === 'reps'
                      ? t.units.reps
                      : cur.type === 'time'
                        ? t.units.sec
                        : cur.perHand
                          ? `kg · ${t.units.perHand}`
                          : 'kg'
                  }
                  value={cur.type === 'time' ? String(valueFor(cur)) : fmtShort(cur, valueFor(cur))}
                  onDec={() => setValue(cur, valueFor(cur) - cur.step)}
                  onInc={() => setValue(cur, valueFor(cur) + cur.step)}
                />
                <Txt size={15} weight="bold" color={C.gold}>
                  {t.exercise.goal(fmtValue(cur, cur.goal))}
                </Txt>
              </View>
              <Txt size={14} color={C.sub} style={{ textAlign: 'center' }}>
                {o.estimate}
              </Txt>
              <Txt size={12} color={C.muted} style={{ textAlign: 'center', lineHeight: 17 }}>
                {o.safety}
              </Txt>
            </Animated.View>
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn
                kind="secondary"
                title={t.common.back}
                style={{ flex: 1 }}
                onPress={() => (ex > 0 ? setEx(ex - 1) : setStep(1))}
              />
              <Btn
                title={ex >= todo.length - 1 ? o.finish : t.common.next}
                style={{ flex: 2 }}
                loading={addEntries.isPending}
                onPress={() => (ex < todo.length - 1 ? setEx(ex + 1) : finishTest())}
              />
            </View>
            {addEntries.error ? (
              <Txt size={15} color={C.danger}>
                {t.log.saveError(addEntries.error.message)}
              </Txt>
            ) : null}
          </View>
        ) : null}

        {step === 3 ? (
          <View style={{ flex: 1, alignItems: 'center', gap: 18 }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
              <Animated.View entering={ZoomIn.delay(100).duration(500)}>
                <Svg width={120} height={120} viewBox="0 0 120 120">
                  <Polygon points="60,6 107,33 107,87 60,114 13,87 13,33" fill={C.accent} />
                  <Path
                    d="M38 62l15 15 30-32"
                    stroke={C.accentInk}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </Svg>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(350).duration(500)}>
                <Txt size={32} weight="black" style={{ textAlign: 'center', lineHeight: 38 }}>
                  {o.doneTitle}
                </Txt>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(500).duration(500)}>
                <Txt size={17} color={C.sub} style={{ textAlign: 'center', lineHeight: 25 }}>
                  {o.doneText(pct)}
                </Txt>
              </Animated.View>
              <Animated.View entering={FadeIn.delay(700).duration(500)}>
                <Txt size={15} weight="bold" color={C.accent}>
                  +{t.common.xp(XP.start)} · {t.badges.firstStep}
                </Txt>
              </Animated.View>
            </View>
            <Animated.View entering={FadeInDown.delay(850).duration(500)} style={{ alignSelf: 'stretch' }}>
              <Btn title={o.letsGo} onPress={finish} loading={updateProfile.isPending} />
            </Animated.View>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function question(e: Exercise, o: Dict['onboarding']) {
  if (e.type === 'reps') return o.qReps;
  if (e.type === 'time') return o.qTime;
  if (e.type === 'carry') return o.qCarry(e.distance);
  if (e.perHand) return o.qPerHand;
  return o.qWeight;
}

function Progress({ step, part }: { step: number; part: number }) {
  const parts = [step >= 0 ? 1 : 0, step >= 1 ? 1 : 0, step >= 2 ? part : 0];
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {parts.map((p, i) => (
        <View key={i} style={{ flex: 1 }}>
          <Bar value={p} height={4} />
        </View>
      ))}
    </View>
  );
}

function GroupStep({ onDone }: { onDone: () => void }) {
  const t = useStrings();
  const o = t.onboarding;
  const [code, setCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [start, setStart] = useState(todayISO());
  const [rows, setRows] = useState<ExerciseRow[]>(DEFAULT_ROWS);
  const [msg, setMsg] = useState('');
  const [msgError, setMsgError] = useState(false);
  const join = useJoinGroup();
  const create = useCreateGroup();
  const pro = usePro();

  const doJoin = async () => {
    setMsg('');
    try {
      const r = await join.mutateAsync(code);
      setMsgError(false);
      setMsg(r.status === 'pending' ? t.groups.joinedPending(r.name) : t.groups.joined(r.name));
      setTimeout(onDone, 900);
    } catch (e) {
      setMsgError(true);
      setMsg((e as Error).message);
    }
  };

  const doCreate = async () => {
    setMsg('');
    if (!groupName.trim()) return;
    try {
      const g = await create.mutateAsync({ name: groupName.trim(), start, exercises: rows });
      setMsgError(false);
      setMsg(o.created(g.invite_code));
      setTimeout(onDone, 1400);
    } catch (e) {
      setMsgError(true);
      setMsg((e as Error).message);
    }
  };

  return (
    <Animated.View key="s1" entering={FadeInRight.duration(380)} style={{ flex: 1, gap: 20, marginTop: 24 }}>
      <View>
        <Txt size={32} weight="extrabold">
          {creating ? o.createTitle : o.joinTitle}
        </Txt>
        <Txt size={16} color={C.sub} style={{ lineHeight: 23 }}>
          {creating ? o.createText : o.joinText}
        </Txt>
      </View>
      {creating ? (
        <>
          <Field
            label={t.admin.groupName}
            value={groupName}
            onChangeText={setGroupName}
            placeholder={o.groupPlaceholder}
            maxLength={40}
          />
          <StartDatePicker value={start} onChange={setStart} />
          <Txt size={18} weight="extrabold">
            {t.editor.exercises(rows.length)}
          </Txt>
          <ExerciseListEditor rows={rows} onChange={setRows} canCustom={pro.isPro} />
        </>
      ) : (
        <Field
          label={t.admin.inviteCode}
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={t.groups.codePlaceholder}
          style={{ fontSize: 24, letterSpacing: 3 }}
        />
      )}
      {msg ? (
        <Txt size={15} weight="semibold" color={msgError ? C.danger : C.accent}>
          {msg}
        </Txt>
      ) : null}
      <View style={{ flex: 1 }} />
      <View style={{ gap: 10 }}>
        {creating ? (
          <Btn title={t.editor.create} onPress={doCreate} loading={create.isPending} disabled={!groupName.trim()} />
        ) : (
          <Btn title={t.groups.join} onPress={doJoin} loading={join.isPending} disabled={code.trim().length < 4} />
        )}
        <Btn
          kind="secondary"
          height={52}
          title={creating ? o.haveCode : t.groups.createLabel}
          onPress={() => {
            setCreating(!creating);
            setMsg('');
          }}
        />
        <Btn kind="ghost" height={44} title={o.skip} onPress={onDone} />
      </View>
    </Animated.View>
  );
}
