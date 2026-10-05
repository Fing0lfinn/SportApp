import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withTiming, ZoomIn, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { shareCard } from '@/components/share-card';
import { Avatar, Btn, Loading, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { computeBadges } from '@/lib/badges';
import { endISO, exStats, fmtShort, formatDate, formatDay, unitOf } from '@/lib/challenge';
import { useActiveGroup, useGroupBoard, useMyStats, useProfile } from '@/lib/data';
import { isFinalOver } from '@/lib/final';

const SLIDE_MS = 5000;
const BG = [C.accent, C.orange, '#4AA8FF', C.gold, '#B58CFF', C.bg];

/** Yıl sonu özeti: hikaye gibi ilerleyen slaytlar. Finalden önce "önizleme" olarak açılır. */
export default function Wrapped() {
  const t = useStrings();
  const w = t.wrapped;
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const mine = useMyStats();
  const ch = mine.challenge;
  const { group } = useActiveGroup();
  const board = useGroupBoard(ch);
  const [slide, setSlide] = useState(0);
  const shareRef = useRef<View>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (slide < BG.length - 1) setSlide(slide + 1);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [slide]);

  if (!profile.data || mine.isLoading) return <Loading />;

  const s = mine.stats;
  const final = isFinalOver(ch.start);
  const ink = slide === BG.length - 1 ? C.text : C.accentInk;
  let bestKey = -1;
  let bestShare = 0;
  ch.exercises.forEach((ex, i) => {
    const st = exStats(s, ex.key);
    const share = (st.best - st.start) / ex.goal;
    if (share > bestShare) {
      bestShare = share;
      bestKey = i;
    }
  });
  const bestEx = bestKey >= 0 ? ch.exercises[bestKey] : null;
  const bestSt = bestEx ? exStats(s, bestEx.key) : null;
  const doneNames = ch.exercises.filter((ex) => exStats(s, ex.key).best >= ex.goal).map((ex) => ex.name);
  const badgeCount = computeBadges(s, profile.data.body_weight, ch).filter((b) => b.earned).length;
  const rank = board.ranked.findIndex((p) => p.isMe) + 1;
  const top = board.ranked.slice(0, 3);
  const podium = [top[1], top[0], top[2]].filter(Boolean);

  const go = (n: number) => {
    if (n < 0) return;
    if (n >= BG.length) router.back();
    else setSlide(n);
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG[slide] }}>
      <View ref={shareRef} collapsable={false} style={{ flex: 1, backgroundColor: BG[slide], paddingTop: insets.top + 90, paddingBottom: insets.bottom + 40, paddingHorizontal: 28, justifyContent: 'center' }}>
        {slide === 0 ? (
          <View key="s0" style={{ gap: 14 }}>
            {!final ? (
              <Animated.View entering={FadeIn.delay(100)} style={{ alignSelf: 'flex-start', backgroundColor: C.accentInk, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Txt size={13} weight="black" color={C.accent} style={{ letterSpacing: 1 }}>
                  {w.preview}
                </Txt>
              </Animated.View>
            ) : null}
            <Animated.View entering={ZoomIn.delay(200).duration(600)}>
              <Txt size={72} weight="black" color={ink} style={{ lineHeight: 72, letterSpacing: -2 }}>
                {w.yourYear}
              </Txt>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(500)}>
              <Txt size={18} weight="bold" color={ink}>
                {formatDate(ch.start)} – {formatDate(endISO(ch.start))}
              </Txt>
            </Animated.View>
            {!final ? (
              <Animated.View entering={FadeInDown.delay(700)}>
                <Txt size={15} weight="semibold" color={ink} style={{ opacity: 0.75, lineHeight: 21 }}>
                  {w.previewNote(formatDay(endISO(ch.start)))}
                </Txt>
              </Animated.View>
            ) : null}
          </View>
        ) : null}

        {slide === 1 ? (
          <View key="s1" style={{ gap: 6 }}>
            <Animated.View entering={FadeInDown.delay(100)}>
              <Txt size={22} weight="extrabold" color={ink}>
                {final ? w.thisYear : w.soFar}
              </Txt>
            </Animated.View>
            <Animated.View entering={ZoomIn.delay(250).duration(600)}>
              <Txt size={140} weight="black" color={ink} style={{ lineHeight: 140, letterSpacing: -4 }}>
                {s.entries}
              </Txt>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(500)}>
              <Txt size={30} weight="black" color={ink}>
                {w.entries}
              </Txt>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(800)}>
              <Txt size={18} weight="bold" color={ink} style={{ marginTop: 12 }}>
                {w.activeDays(s.activeDays)}
              </Txt>
            </Animated.View>
          </View>
        ) : null}

        {slide === 2 ? (
          <View key="s2" style={{ gap: 10 }}>
            <Animated.View entering={FadeInDown.delay(100)}>
              <Txt size={22} weight="extrabold" color={ink}>
                {w.biggest}
              </Txt>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(300)}>
              <Txt size={42} weight="black" color={ink} style={{ lineHeight: 46 }}>
                {bestEx ? bestEx.name : w.none}
              </Txt>
            </Animated.View>
            <Animated.View entering={ZoomIn.delay(500).duration(600)}>
              <Txt size={110} weight="black" color={ink} style={{ lineHeight: 112, letterSpacing: -3 }}>
                {bestEx && bestSt ? `+${fmtShort(bestEx, bestSt.best - bestSt.start)}` : '–'}
              </Txt>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(800)}>
              <Txt size={20} weight="bold" color={ink}>
                {bestEx && bestSt
                  ? `${fmtShort(bestEx, bestSt.start)} → ${fmtShort(bestEx, bestSt.best)} ${bestEx.type === 'reps' ? t.units.reps : unitOf(bestEx, bestSt.best)}`.trim()
                  : w.noneYet}
              </Txt>
            </Animated.View>
          </View>
        ) : null}

        {slide === 3 ? (
          <View key="s3" style={{ gap: 12 }}>
            <Animated.View entering={FadeInDown.delay(100)}>
              <Txt size={22} weight="extrabold" color={ink}>
                {w.goalsDone}
              </Txt>
            </Animated.View>
            <Animated.View entering={ZoomIn.delay(250).duration(600)}>
              <Txt size={140} weight="black" color={ink} style={{ lineHeight: 140, letterSpacing: -4 }}>
                {s.done}
                <Txt size={60} weight="black" color={ink}>
                  /{ch.exercises.length}
                </Txt>
              </Txt>
            </Animated.View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {doneNames.map((n, i) => (
                <Animated.View key={n} entering={ZoomIn.delay(500 + i * 90)} style={{ backgroundColor: C.accentInk, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Txt size={15} weight="extrabold" color={C.gold}>
                    {n}
                  </Txt>
                </Animated.View>
              ))}
            </View>
          </View>
        ) : null}

        {slide === 4 ? (
          <View key="s4" style={{ gap: 6 }}>
            <Animated.View entering={FadeInDown.delay(100)}>
              <Txt size={22} weight="extrabold" color={ink}>
                {w.longestStreak}
              </Txt>
            </Animated.View>
            <Animated.View entering={ZoomIn.delay(250).duration(600)}>
              <Txt size={140} weight="black" color={ink} style={{ lineHeight: 140, letterSpacing: -4 }}>
                {s.maxStreak}
              </Txt>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(500)}>
              <Txt size={30} weight="black" color={ink}>
                {w.weeksInRow}
              </Txt>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(800)}>
              <Txt size={18} weight="bold" color={ink} style={{ marginTop: 12 }}>
                {w.summary(badgeCount, s.xp, t.levels[s.level])}
              </Txt>
            </Animated.View>
          </View>
        ) : null}

        {slide === 5 ? (
          <View key="s5" style={{ gap: 16 }}>
            <Animated.View entering={FadeInDown.delay(100)}>
              <Txt size={22} weight="extrabold" color={ink}>
                {group?.name ?? w.yourGroup}
              </Txt>
            </Animated.View>
            <Animated.View entering={ZoomIn.delay(200).duration(600)}>
              <Txt size={52} weight="black" color={ink} style={{ lineHeight: 56 }}>
                {rank ? w.rank(rank) : w.joinGroup}
              </Txt>
            </Animated.View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 240 }}>
              {podium.map((p, j) => {
                const place = board.ranked.indexOf(p) + 1;
                const h = [150, 110, 80][place - 1] ?? 70;
                return (
                  <View key={p.id} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                    <Animated.View entering={FadeInDown.delay(500 + j * 150)}>
                      <Avatar name={p.name} color={p.color} size={52} />
                    </Animated.View>
                    <Animated.View
                      entering={FadeInDown.delay(350 + j * 150).duration(600)}
                      style={{ width: '100%', height: h, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: C.surface2, alignItems: 'center', paddingTop: 10 }}>
                      <Txt size={30} weight="black" color={place === 1 ? C.gold : C.sub}>
                        {place}
                      </Txt>
                      <Txt size={14} weight="bold" color={C.sub}>
                        {t.pct(p.stats.pct)}
                      </Txt>
                    </Animated.View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>

      <Pressable accessibilityLabel={w.prev} onPress={() => go(slide - 1)} style={{ position: 'absolute', top: 90, left: 0, bottom: 0, width: '35%' }} />
      <Pressable accessibilityLabel={w.next} onPress={() => go(slide + 1)} style={{ position: 'absolute', top: 90, right: 0, bottom: 0, width: '65%' }} />

      <View style={{ position: 'absolute', top: insets.top + 12, left: 16, right: 16, flexDirection: 'row', gap: 4 }}>
        {BG.map((_, i) => (
          <Segment key={i} state={i < slide ? 'done' : i === slide ? 'active' : 'todo'} color={ink} />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.common.close}
        onPress={() => router.back()}
        hitSlop={10}
        style={{ position: 'absolute', top: insets.top + 28, right: 12, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="close" size={26} color={ink} stroke={2.6} />
      </Pressable>

      {slide === BG.length - 1 ? (
        <Animated.View entering={FadeInDown.delay(900)} style={{ position: 'absolute', left: 28, right: 28, bottom: insets.bottom + 24 }}>
          <Btn title={t.common.share} icon="share" onPress={() => shareCard(shareRef).catch(() => {})} />
        </Animated.View>
      ) : null}
    </View>
  );
}

function Segment({ state, color }: { state: 'done' | 'active' | 'todo'; color: string }) {
  const w = useSharedValue(state === 'done' ? 1 : 0);
  useEffect(() => {
    if (state === 'active') {
      w.value = 0;
      w.value = withTiming(1, { duration: SLIDE_MS, easing: Easing.linear });
    } else {
      w.value = state === 'done' ? 1 : 0;
    }
  }, [state, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: color === C.text ? 'rgba(244,246,248,0.25)' : 'rgba(11,13,16,0.2)', overflow: 'hidden' }}>
      <Animated.View style={[{ height: 4, borderRadius: 2, backgroundColor: color }, fill]} />
    </View>
  );
}
