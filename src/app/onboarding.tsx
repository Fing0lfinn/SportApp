import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Polygon } from 'react-native-svg';

import { Avatar, Bar, Btn, Field, Stepper, Txt } from '@/components/ui';
import { AVATAR_COLORS, C } from '@/constants/theme';
import { EXERCISES, fmt, progressOf, todayISO } from '@/lib/challenge';
import { useAddEntries, useCreateGroup, useJoinGroup, useMyEntries, useUpdateProfile } from '@/lib/data';

const DEFAULT_START = [60, 80, 50, 30, 15, 3, 8, 20, 50];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(AVATAR_COLORS[0]);
  const [bw, setBw] = useState(80);
  const [start, setStart] = useState(DEFAULT_START);
  const [ex, setEx] = useState(0);
  const [error, setError] = useState('');

  const myEntries = useMyEntries();
  const addEntries = useAddEntries();
  const updateProfile = useUpdateProfile();

  const saveProfileAndNext = async () => {
    if (!name.trim()) {
      setError('Arkadaşların seni tanısın diye bir isim gir.');
      return;
    }
    setError('');
    await updateProfile.mutateAsync({ name: name.trim(), color, body_weight: bw });
    setStep(1);
  };

  const finishTest = async () => {
    const hasStart = (myEntries.data ?? []).some((e) => e.is_start);
    if (!hasStart) {
      const day = todayISO();
      await addEntries.mutateAsync(
        EXERCISES.map((e, i) => ({
          exercise: e.key,
          weight: e.type === 'reps' ? 0 : start[i],
          reps: e.type === 'reps' ? start[i] : 1,
          distance: e.type === 'carry' ? 20 : 0,
          performed_on: day,
          is_start: true,
        })),
      );
    }
    setStep(3);
  };

  const finish = () => updateProfile.mutate({ onboarded: true });

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}>
        {step < 3 ? <Progress step={step} ex={ex} /> : null}

        {step === 0 ? (
          <Animated.View key="s0" entering={FadeInRight.duration(380)} style={{ flex: 1, gap: 22, marginTop: 24 }}>
            <View>
              <Txt size={32} weight="extrabold">
                Seni tanıyalım
              </Txt>
              <Txt size={16} color={C.sub}>
                Arkadaşların seni bu isimle görecek.
              </Txt>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Avatar name={name || '?'} color={color} size={104} />
            </View>
            <Field label="Adın" value={name} onChangeText={(t) => setName(t.slice(0, 24))} placeholder="ör. Ahmet" />
            <View style={{ gap: 10 }}>
              <Txt size={14} weight="bold" color={C.sub}>
                Rengin
              </Txt>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {AVATAR_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    accessibilityRole="button"
                    accessibilityLabel={`Renk ${c}`}
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
              title="Vücut ağırlığı"
              sub="kg · kilo oranı skoru için"
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
            <Btn title="Devam" onPress={saveProfileAndNext} loading={updateProfile.isPending} />
          </Animated.View>
        ) : null}

        {step === 1 ? <GroupStep onDone={() => setStep(2)} /> : null}

        {step === 2 ? (
          <View style={{ flex: 1, gap: 18, marginTop: 24 }}>
            <View>
              <Txt size={15} weight="bold" color={C.sub}>
                Başlangıç testi · {ex + 1} / 9
              </Txt>
              <Txt size={16} color={C.sub} style={{ marginTop: 6 }}>
                Şu anki seviyeni gir. Ara hedeflerin buna göre hesaplanır.
              </Txt>
            </View>
            <Animated.View key={`ex${ex}`} entering={FadeInRight.duration(350)} style={{ gap: 14 }}>
              <View style={{ backgroundColor: C.surface, borderRadius: 28, padding: 22, gap: 16, alignItems: 'center' }}>
                <Txt size={30} weight="black" style={{ textAlign: 'center', lineHeight: 36 }}>
                  {EXERCISES[ex].name}
                </Txt>
                <Txt size={16} color={C.sub} style={{ textAlign: 'center' }}>
                  {question(ex)}
                </Txt>
                <Stepper
                  big
                  title={EXERCISES[ex].type === 'reps' ? 'tekrar' : EXERCISES[ex].perHand ? 'kg · her el' : 'kg'}
                  value={fmt(start[ex])}
                  onDec={() => setStart(start.map((v, i) => (i === ex ? Math.max(0, v - EXERCISES[ex].step) : v)))}
                  onInc={() => setStart(start.map((v, i) => (i === ex ? v + EXERCISES[ex].step : v)))}
                />
                <Txt size={15} weight="bold" color={C.gold}>
                  Hedef: {EXERCISES[ex].goal} {EXERCISES[ex].unit}
                </Txt>
              </View>
              <Txt size={14} color={C.sub} style={{ textAlign: 'center' }}>
                Emin değilsen tahmini gir, sonra düzenleyebilirsin.
              </Txt>
              <Txt size={12} color={C.muted} style={{ textAlign: 'center', lineHeight: 17 }}>
                Maksimum denemeler sakatlık riski taşır. Isınmadan deneme yapma, ağır kaldırışlarda yanında biri olsun.
              </Txt>
            </Animated.View>
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn
                kind="secondary"
                title="Geri"
                style={{ flex: 1 }}
                onPress={() => (ex > 0 ? setEx(ex - 1) : setStep(1))}
              />
              <Btn
                title={ex === 8 ? 'Bitir' : 'Devam'}
                style={{ flex: 2 }}
                loading={addEntries.isPending}
                onPress={() => (ex < 8 ? setEx(ex + 1) : finishTest())}
              />
            </View>
            {addEntries.error ? (
              <Txt size={15} color={C.danger}>
                Kaydedilemedi: {addEntries.error.message}
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
                  <Path d="M38 62l15 15 30-32" stroke={C.accentInk} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </Svg>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(350).duration(500)}>
                <Txt size={32} weight="black" style={{ textAlign: 'center', lineHeight: 38 }}>
                  Başlangıç noktan kaydedildi
                </Txt>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(500).duration(500)}>
                <Txt size={17} color={C.sub} style={{ textAlign: 'center', lineHeight: 25 }}>
                  Bugün genel ilerlemen %{progressOf(start).pct}. Bir yıl sonra bakalım nereye geleceksin.
                </Txt>
              </Animated.View>
              <Animated.View entering={FadeIn.delay(700).duration(500)}>
                <Txt size={15} weight="bold" color={C.accent}>
                  +100 XP · İlk adım
                </Txt>
              </Animated.View>
            </View>
            <Animated.View entering={FadeInDown.delay(850).duration(500)} style={{ alignSelf: 'stretch' }}>
              <Btn title="Hadi başlayalım" onPress={finish} loading={updateProfile.isPending} />
            </Animated.View>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function question(i: number) {
  const e = EXERCISES[i];
  if (e.type === 'reps') return 'Tek sette, ara vermeden en fazla kaç tekrar yapabiliyorsun?';
  if (e.type === 'carry') return 'Her elde kaç kg ile 20 metre yürüyebiliyorsun?';
  if (e.perHand) return 'Her elde kaç kg dambılla en az 1 tekrar yapabiliyorsun?';
  return 'Tek tekrarda en fazla kaç kg kaldırabiliyorsun?';
}

function Progress({ step, ex }: { step: number; ex: number }) {
  const parts = [step >= 0 ? 1 : 0, step >= 1 ? 1 : 0, step >= 2 ? (ex + 1) / 9 : 0];
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
  const [code, setCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [msg, setMsg] = useState('');
  const join = useJoinGroup();
  const create = useCreateGroup();

  const doJoin = async () => {
    setMsg('');
    try {
      const r = await join.mutateAsync(code);
      setMsg(r.status === 'pending' ? `${r.name}: yönetici onayı bekleniyor.` : `${r.name} grubuna katıldın!`);
      setTimeout(onDone, 900);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const doCreate = async () => {
    setMsg('');
    if (!groupName.trim()) return;
    try {
      const g = await create.mutateAsync(groupName.trim());
      setMsg(`Grup kuruldu. Davet kodu: ${g.invite_code}`);
      setTimeout(onDone, 1400);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <Animated.View key="s1" entering={FadeInRight.duration(380)} style={{ flex: 1, gap: 20, marginTop: 24 }}>
      <View>
        <Txt size={32} weight="extrabold">
          {creating ? 'Grubunu kur' : 'Grubuna katıl'}
        </Txt>
        <Txt size={16} color={C.sub} style={{ lineHeight: 23 }}>
          {creating
            ? 'Grubu kur, davet kodunu arkadaşlarına gönder.'
            : 'Arkadaşının gönderdiği davet kodunu gir. Grubun yoksa yeni bir tane kurabilirsin.'}
        </Txt>
      </View>
      {creating ? (
        <Field label="Grup adı" value={groupName} onChangeText={setGroupName} placeholder="ör. Demir Kulübü" maxLength={40} />
      ) : (
        <Field
          label="Davet kodu"
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="ör. K7M2QX"
          style={{ fontSize: 24, letterSpacing: 3 }}
        />
      )}
      {msg ? (
        <Txt size={15} weight="semibold" color={msg.includes('bulunamadı') ? C.danger : C.accent}>
          {msg}
        </Txt>
      ) : null}
      <View style={{ flex: 1 }} />
      <View style={{ gap: 10 }}>
        {creating ? (
          <Btn title="Grubu kur" onPress={doCreate} loading={create.isPending} disabled={!groupName.trim()} />
        ) : (
          <Btn title="Katıl" onPress={doJoin} loading={join.isPending} disabled={code.trim().length < 4} />
        )}
        <Btn
          kind="secondary"
          height={52}
          title={creating ? 'Kodum var, katılacağım' : 'Yeni grup kur'}
          onPress={() => {
            setCreating(!creating);
            setMsg('');
          }}
        />
        <Btn kind="ghost" height={44} title="Şimdilik atla" onPress={onDone} />
      </View>
    </Animated.View>
  );
}
