import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Confetti } from '@/components/confetti';
import { Avatar, Btn, Empty, IconBtn, Loading, styles, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { endISO, formatDate } from '@/lib/challenge';
import { useActiveGroup, useChallenge, useGroupBoard } from '@/lib/data';
import { countdown, isFinalOver } from '@/lib/final';

type Step = 'countdown' | 'third' | 'second' | 'champion' | 'table';
const NEXT: Partial<Record<Step, Step>> = { third: 'second', second: 'champion', champion: 'table' };
const DELAY: Partial<Record<Step, number>> = { third: 2800, second: 2800, champion: 4500 };

export default function Final() {
  const t = useStrings();
  const f = t.final;
  const insets = useSafeAreaInsets();
  const { group } = useActiveGroup();
  const ch = useChallenge();
  const board = useGroupBoard(ch);
  const [step, setStep] = useState<Step>('countdown');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const next = NEXT[step];
    if (!next) return;
    const timer = setTimeout(() => setStep(next), DELAY[step]);
    return () => clearTimeout(timer);
  }, [step]);

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top + 16, paddingHorizontal: 20, gap: 20 }}>
        <IconBtn name="back" label={t.common.back} onPress={() => router.back()} />
        <Empty title={f.noGroupTitle} text={f.noGroupText} />
      </View>
    );
  }
  if (board.isLoading) return <Loading />;

  const ranked = board.ranked;
  const over = isFinalOver(ch.start, now);
  const cd = countdown(ch.start, now);
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
              {over ? f.arrived : f.day}
            </Txt>
          </Animated.View>
          <Animated.View entering={ZoomIn.delay(150).duration(600)}>
            <Txt size={46} weight="black" style={{ lineHeight: 50 }}>
              {formatDate(endISO(ch.start))}
            </Txt>
            <Txt size={30} weight="black" color={C.sub}>
              {f.at}
            </Txt>
          </Animated.View>
          {!over ? (
            <Animated.View entering={FadeInDown.delay(350)} style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { v: cd.days, l: f.days },
                { v: cd.hours, l: f.hours },
                { v: cd.minutes, l: f.minutes },
                { v: cd.seconds, l: f.seconds },
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
              {over ? f.overText : f.beforeText}
            </Txt>
          </Animated.View>
          {leader ? (
            <Animated.View entering={FadeInDown.delay(650)} style={[styles.row, { backgroundColor: C.surface, borderRadius: 20, padding: 14 }]}>
              <Avatar name={leader.name} color={leader.color} />
              <View style={{ flex: 1 }}>
                <Txt size={13} color={C.sub}>
                  {over ? f.championKnown : f.leaderNow}
                </Txt>
                <Txt size={17} weight="extrabold">
                  {over ? f.tapToReveal : `${leader.isMe ? t.common.you : leader.name} · ${t.pct(leader.stats.pct)}`}
                </Txt>
              </View>
            </Animated.View>
          ) : null}
          <View style={{ flex: 1 }} />
          <Animated.View entering={FadeInDown.delay(800)}>
            <Btn title={over ? f.openResults : f.playPreview} onPress={() => setStep(start)} />
          </Animated.View>
        </ScrollView>
      ) : null}

      {revealing && revealed ? (
        <View key={step} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
          {step === 'champion' ? <Confetti /> : null}
          <Animated.View entering={FadeIn.duration(400)}>
            <Txt size={step === 'champion' ? 20 : 18} weight="black" color={step === 'champion' ? C.gold : C.sub} style={{ letterSpacing: 2 }}>
              {step === 'champion' ? f.champion : f.place(place + 1)}
            </Txt>
          </Animated.View>
          <Animated.View
            entering={ZoomIn.delay(500).springify().damping(11)}
            style={step === 'champion' ? { borderRadius: 90, borderWidth: 5, borderColor: C.gold, padding: 6 } : undefined}>
            <Avatar name={revealed.name} color={revealed.color} size={step === 'champion' ? 156 : 132} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(900)}>
            <Txt size={step === 'champion' ? 52 : 44} weight="black" style={{ textAlign: 'center' }}>
              {revealed.isMe ? f.youExcl : revealed.name}
            </Txt>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(1100)}>
            <Txt size={18} weight="bold" color={C.sub}>
              {t.pct(revealed.stats.pct)} · {t.home.goalsDone(revealed.stats.done, ch.exercises.length)}
            </Txt>
          </Animated.View>
          <View style={{ position: 'absolute', bottom: insets.bottom + 28 }}>
            <Btn kind="secondary" height={44} title={f.skip} onPress={() => setStep('table')} />
          </View>
        </View>
      ) : null}

      {step === 'table' ? (
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: insets.bottom + 28, paddingHorizontal: 20, gap: 10 }}>
          <Animated.View entering={FadeInDown}>
            <Txt size={32} weight="black" style={{ marginBottom: 8 }}>
              {over ? f.finalTable : f.currentTable}
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
                  {p.isMe ? t.board.meName(p.name) : p.name}
                </Txt>
                <Txt size={14} color={C.sub}>
                  {t.home.goalsDone(p.stats.done, ch.exercises.length)}
                </Txt>
              </View>
              <Txt size={24} weight="black">
                {t.pct(p.stats.pct)}
              </Txt>
            </Animated.View>
          ))}
          <View style={{ height: 12 }} />
          <Btn title={f.openWrapped} onPress={() => router.replace('/wrapped')} />
          <Btn kind="secondary" title={t.common.close} onPress={() => router.back()} />
        </ScrollView>
      ) : null}

      {step === 'countdown' || step === 'table' ? (
        <View style={{ position: 'absolute', top: insets.top + 12, right: 16 }}>
          <IconBtn name="close" label={t.common.close} onPress={() => router.back()} />
        </View>
      ) : null}
    </View>
  );
}
