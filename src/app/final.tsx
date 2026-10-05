import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Confetti } from '@/components/confetti';
import { Avatar, Btn, Empty, IconBtn, Loading, styles, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useActiveGroup, useGroupBoard } from '@/lib/data';
import { countdown, isFinalOver } from '@/lib/final';

type Step = 'countdown' | 'third' | 'second' | 'champion' | 'table';
const NEXT: Partial<Record<Step, Step>> = { third: 'second', second: 'champion', champion: 'table' };
const DELAY: Partial<Record<Step, number>> = { third: 2800, second: 2800, champion: 4500 };

export default function Final() {
  const insets = useSafeAreaInsets();
  const { group } = useActiveGroup();
  const board = useGroupBoard(group?.id);
  const [step, setStep] = useState<Step>('countdown');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const next = NEXT[step];
    if (!next) return;
    const t = setTimeout(() => setStep(next), DELAY[step]);
    return () => clearTimeout(t);
  }, [step]);

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 16, paddingHorizontal: 20, gap: 20 }}>
        <IconBtn name="back" label="Geri" onPress={() => router.back()} />
        <Empty title="Final bir grupla anlamlı" text="Sıralamanın açıklanması için bir gruba katıl." />
      </View>
    );
  }
  if (board.isLoading) return <Loading />;

  const ranked = board.ranked;
  const over = isFinalOver(now);
  const cd = countdown(now);
  const leader = ranked[0];
  // Sıralamada 3'ten az kişi varsa olmayan basamağı atla
  const start: Step = ranked.length >= 3 ? 'third' : ranked.length === 2 ? 'second' : 'champion';
  const place = step === 'third' ? 2 : step === 'second' ? 1 : 0;
  const revealed = ranked[place];
  const revealing = step === 'third' || step === 'second' || step === 'champion';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {step === 'countdown' ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 80, paddingBottom: insets.bottom + 28, paddingHorizontal: 24, gap: 20 }}>
          <Animated.View entering={FadeIn.delay(100)}>
            <Txt size={14} weight="black" color={C.accent} style={{ letterSpacing: 1.5 }}>
              {over ? 'FİNAL GELDİ' : 'FİNAL GÜNÜ'}
            </Txt>
          </Animated.View>
          <Animated.View entering={ZoomIn.delay(150).duration(600)}>
            <Txt size={46} weight="black" style={{ lineHeight: 50 }}>
              4 Ekim 2027
            </Txt>
            <Txt size={30} weight="black" color={C.sub}>
              saat 20:00
            </Txt>
          </Animated.View>
          {!over ? (
            <Animated.View entering={FadeInDown.delay(350)} style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { v: cd.days, l: 'gün' },
                { v: cd.hours, l: 'saat' },
                { v: cd.minutes, l: 'dakika' },
                { v: cd.seconds, l: 'saniye' },
              ].map((x) => (
                <View key={x.l} style={{ flex: 1, backgroundColor: C.surface, borderRadius: 20, paddingVertical: 16, alignItems: 'center' }}>
                  <Txt size={30} weight="black">
                    {String(x.v).padStart(2, '0')}
                  </Txt>
                  <Txt size={13} weight="bold" color={C.sub}>
                    {x.l}
                  </Txt>
                </View>
              ))}
            </Animated.View>
          ) : null}
          <Animated.View entering={FadeInDown.delay(500)}>
            <Txt size={16} color={C.sub} style={{ lineHeight: 23 }}>
              {over
                ? 'Meydan okuma bitti. Sıralama tek tek açıklanıyor, sonra herkesin yıl özeti çıkıyor.'
                : 'Final ekranı gruptaki herkes için aynı anda açılır: sıralama tek tek açıklanır, şampiyon ilan edilir.'}
            </Txt>
          </Animated.View>
          {leader ? (
            <Animated.View entering={FadeInDown.delay(650)} style={[styles.row, { backgroundColor: C.surface, borderRadius: 20, padding: 14 }]}>
              <Avatar name={leader.name} color={leader.color} />
              <View style={{ flex: 1 }}>
                <Txt size={13} color={C.sub}>
                  {over ? 'Şampiyon belli' : 'Şu an lider'}
                </Txt>
                <Txt size={17} weight="extrabold">
                  {over ? 'Açıklamak için dokun' : `${leader.isMe ? 'Sen' : leader.name} · %${leader.stats.pct}`}
                </Txt>
              </View>
            </Animated.View>
          ) : null}
          <View style={{ flex: 1 }} />
          <Animated.View entering={FadeInDown.delay(800)}>
            <Btn title={over ? 'Sonuçları aç' : 'Önizlemeyi oynat'} onPress={() => setStep(start)} />
          </Animated.View>
        </ScrollView>
      ) : null}

      {revealing && revealed ? (
        <View key={step} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
          {step === 'champion' ? <Confetti /> : null}
          <Animated.View entering={FadeIn.duration(400)}>
            <Txt size={step === 'champion' ? 20 : 18} weight="black" color={step === 'champion' ? C.gold : C.sub} style={{ letterSpacing: 2 }}>
              {step === 'champion' ? 'ŞAMPİYON' : `${place + 1}. SIRA`}
            </Txt>
          </Animated.View>
          <Animated.View
            entering={ZoomIn.delay(500).springify().damping(11)}
            style={step === 'champion' ? { borderRadius: 90, borderWidth: 5, borderColor: C.gold, padding: 6 } : undefined}>
            <Avatar name={revealed.name} color={revealed.color} size={step === 'champion' ? 156 : 132} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(900)}>
            <Txt size={step === 'champion' ? 52 : 44} weight="black" style={{ textAlign: 'center' }}>
              {revealed.isMe ? 'Sen!' : revealed.name}
            </Txt>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(1100)}>
            <Txt size={18} weight="bold" color={C.sub}>
              %{revealed.stats.pct} · {revealed.stats.done}/9 hedef
            </Txt>
          </Animated.View>
          <View style={{ position: 'absolute', bottom: insets.bottom + 28 }}>
            <Btn kind="secondary" height={44} title="Atla" onPress={() => setStep('table')} />
          </View>
        </View>
      ) : null}

      {step === 'table' ? (
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: insets.bottom + 28, paddingHorizontal: 20, gap: 10 }}>
          <Animated.View entering={FadeInDown}>
            <Txt size={32} weight="black" style={{ marginBottom: 8 }}>
              {over ? 'Final sıralaması' : 'Şu anki sıralama'}
            </Txt>
          </Animated.View>
          {ranked.map((p, i) => (
            <Animated.View
              key={p.id}
              entering={FadeInDown.delay(150 + i * 60)}
              style={[styles.row, { backgroundColor: p.isMe ? C.meBg : C.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14, gap: 14 }]}>
              <Txt size={22} weight="black" color={i === 0 ? C.gold : C.sub} style={{ width: 26 }}>
                {i + 1}
              </Txt>
              <Avatar name={p.name} color={p.color} />
              <View style={{ flex: 1 }}>
                <Txt size={17} weight="bold" numberOfLines={1}>
                  {p.isMe ? `${p.name} (sen)` : p.name}
                </Txt>
                <Txt size={14} color={C.sub}>
                  {p.stats.done} / 9 hedef
                </Txt>
              </View>
              <Txt size={24} weight="black">
                %{p.stats.pct}
              </Txt>
            </Animated.View>
          ))}
          <View style={{ height: 12 }} />
          <Btn title="Yıl özetini aç" onPress={() => router.replace('/wrapped')} />
          <Btn kind="secondary" title="Kapat" onPress={() => router.back()} />
        </ScrollView>
      ) : null}

      {step === 'countdown' || step === 'table' ? (
        <View style={{ position: 'absolute', top: insets.top + 12, right: 16 }}>
          <IconBtn name="close" label="Kapat" onPress={() => router.back()} />
        </View>
      ) : null}
    </View>
  );
}
