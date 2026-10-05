import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ProgressChart } from '@/components/progress-chart';
import { Avatar, Bar, Btn, Card, IconBtn, Loading, Pill, Screen, styles, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import {
  dateFromIndex,
  daysLeft,
  dayIndex,
  entrySub,
  entryText,
  EXERCISE_BY_KEY,
  fmt,
  formatDay,
  formatMonthYear,
  todayIndex,
  type ExerciseKey,
} from '@/lib/challenge';
import { useActiveGroup, useGroupBoard, useMyStats } from '@/lib/data';

export default function ExerciseDetail() {
  const { key } = useLocalSearchParams<{ key: ExerciseKey }>();
  const insets = useSafeAreaInsets();
  const ex = EXERCISE_BY_KEY[key];
  const mine = useMyStats();
  const { group } = useActiveGroup();
  const board = useGroupBoard(group?.id);

  if (!ex) return <Loading />;
  if (mine.isLoading) return <Loading />;

  const st = mine.stats.byExercise[ex.key];
  const q = Math.min(1, st.best / ex.goal);
  const done = q >= 1;
  const remain = Math.max(0, Math.round((ex.goal - st.best) * 10) / 10);
  const months = Math.max(0.5, daysLeft() / 30.4);
  const ticks = st.start < ex.goal ? st.milestones.slice(0, 3).map((m) => Math.min(1, m / ex.goal)) : [];
  const ranks = [...board.active].sort((a, b) => b.stats.byExercise[ex.key].best - a.stats.byExercise[ex.key].best);

  let forecast = 'Hedef tamam. Artık her rekor bonus.';
  if (!done) {
    const first = st.sorted[0];
    const elapsed = first ? todayIndex() - dayIndex(first.performed_on) : 0;
    if (elapsed < 21 || st.best <= st.start) {
      forecast = 'Kayıt girdikçe tahmin oluşacak. Kesikli çizgi hedefe giden düz yolu gösteriyor.';
    } else {
      const rate = (st.best - st.start) / elapsed;
      const eta = dayIndex(first.performed_on) + Math.round((ex.goal - st.start) / rate);
      forecast =
        eta <= 365
          ? `Bu tempoyla hedefe ${formatMonthYear(dateFromIndex(eta))} civarı ulaşırsın.`
          : 'Bu tempo yetmiyor, biraz hızlanman lazım.';
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Screen bottom={130}>
        <View style={styles.rowBetween}>
          <IconBtn name="back" label="Geri" onPress={() => router.back()} />
          <View style={[styles.row, { gap: 8 }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/guide/[key]', params: { key: ex.key } })}
              style={({ pressed }) => [
                styles.row,
                { gap: 6, height: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: C.surface, transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}>
              <Icon name="book" size={18} color={C.accent} />
              <Txt size={14} weight="bold">
                Nasıl yapılır?
              </Txt>
            </Pressable>
            <IconBtn
              name="share"
              label="Paylaş"
              onPress={() => router.push({ pathname: '/share', params: { exercise: ex.key } })}
            />
          </View>
        </View>
        <View>
          <Txt size={32} weight="extrabold" style={{ lineHeight: 38 }}>
            {ex.name}
          </Txt>
          <Txt size={16} color={C.sub}>
            Hedef: {ex.goal} {ex.unit}
            {ex.perHand ? ' her elde' : ''}
            {ex.type === 'carry' ? ', 20 m' : ''}
          </Txt>
        </View>

        <Card style={{ borderRadius: 28, padding: 22, gap: 16 }}>
          <View style={[styles.row, { alignItems: 'flex-end', gap: 6 }]}>
            <Txt size={64} weight="extrabold" style={{ lineHeight: 66 }}>
              {fmt(st.best)}
            </Txt>
            <Txt size={22} weight="bold" color={C.sub} style={{ marginBottom: 8 }}>
              {ex.unit}
            </Txt>
            <Txt size={22} weight="extrabold" color={done ? C.gold : C.accent} style={{ marginLeft: 'auto', marginBottom: 8 }}>
              %{Math.round(q * 100)}
            </Txt>
          </View>
          <Bar value={q} height={10} color={done ? C.gold : C.accent} ticks={ticks} delay={150} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Tile label="Kalan" value={done ? 'Tamamlandı' : `${fmt(remain)} ${ex.unit}`} color={done ? C.gold : C.text} />
            <Tile label="Gereken tempo" value={done ? 'Hedefte' : `+${fmt(Math.round((remain / months) * 10) / 10)} ${ex.unit} / ay`} />
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          <Txt size={20} weight="extrabold">
            Ara hedefler
          </Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {st.milestones.map((m, i) => {
              const ok = st.best >= m;
              const next = !ok && i === st.milestonesDone;
              const fill = ok ? (i === 3 ? C.gold : C.accent) : C.surface;
              return (
                <Animated.View
                  key={i}
                  entering={ZoomIn.delay(150 + i * 80).duration(400)}
                  style={{
                    flex: 1,
                    backgroundColor: fill,
                    borderWidth: 2,
                    borderColor: ok ? fill : next ? C.accent : C.line,
                    borderRadius: 16,
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}>
                  <Txt size={11} weight="extrabold" color={ok ? C.accentInk : next ? C.accent : C.sub}>
                    {i === 3 ? 'HEDEF' : `${i + 1}. DURAK`}
                  </Txt>
                  <Txt size={17} weight="black" color={ok ? C.accentInk : C.text}>
                    {fmt(m)}
                  </Txt>
                </Animated.View>
              );
            })}
          </View>
        </View>

        <Card style={{ paddingHorizontal: 12, gap: 8 }}>
          <View style={[styles.rowBetween, { paddingHorizontal: 4 }]}>
            <Txt size={20} weight="extrabold">
              Gelişim
            </Txt>
            <Txt size={13} color={C.sub}>
              - - tempo · ● kayıt
            </Txt>
          </View>
          <ProgressChart ex={ex} entries={st.sorted} start={st.start} />
          <Txt size={14} color={C.sub} style={{ paddingHorizontal: 4, lineHeight: 20 }}>
            {forecast}
          </Txt>
        </Card>

        {ranks.length > 1 ? (
          <View style={{ gap: 10 }}>
            <Txt size={20} weight="extrabold">
              Grupta bu hareket
            </Txt>
            {ranks.map((p, i) => (
              <Animated.View
                key={p.id}
                entering={FadeInDown.delay(120 + i * 45).duration(400)}
                style={[styles.row, { backgroundColor: p.isMe ? C.meBg : C.surface, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 }]}>
                <Txt size={18} weight="extrabold" color={i === 0 ? C.gold : C.sub} style={{ width: 20 }}>
                  {i + 1}
                </Txt>
                <Avatar name={p.name} color={p.color} size={36} />
                <Txt size={16} weight="bold" style={{ flex: 1 }} numberOfLines={1}>
                  {p.isMe ? 'Sen' : p.name}
                </Txt>
                <Txt size={18} weight="extrabold">
                  {fmt(p.stats.byExercise[ex.key].best)} {ex.unit === 'kg' ? 'kg' : ''}
                </Txt>
              </Animated.View>
            ))}
          </View>
        ) : null}

        <View style={{ gap: 10 }}>
          <View style={styles.rowBetween}>
            <Txt size={20} weight="extrabold">
              Geçmiş
            </Txt>
            <Txt size={13} color={C.sub}>
              Düzenlemek için dokun
            </Txt>
          </View>
          {[...st.sorted].reverse().map((e, i) => (
            <Animated.View key={e.id} entering={FadeInDown.delay(100 + Math.min(i, 8) * 45).duration(400)}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/entry/[id]', params: { id: e.id } })}
                style={({ pressed }) => [
                  styles.rowBetween,
                  { backgroundColor: C.surface, borderRadius: 18, padding: 16, transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}>
                <View style={{ flexShrink: 1 }}>
                  <Txt size={17} weight="bold">
                    {entryText(ex, e)}
                  </Txt>
                  <Txt size={14} color={C.sub}>
                    {formatDay(e.performed_on)} · {entrySub(ex, e)}
                    {e.edited ? ' · düzenlendi' : ''}
                  </Txt>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {e.pending ? (
                    <Pill bg={C.goldBg} fg={C.gold}>
                      BEKLİYOR
                    </Pill>
                  ) : null}
                  {mine.stats.events[e.id]?.record ? <Pill>REKOR</Pill> : null}
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </Screen>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          backgroundColor: C.bg,
        }}>
        <Btn title="Kayıt ekle" icon="plus" onPress={() => router.push({ pathname: '/log', params: { exercise: ex.key } })} />
      </View>
    </View>
  );
}

function Tile({ label, value, color = C.text }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.surface2, borderRadius: 18, padding: 14 }}>
      <Txt size={14} color={C.sub}>
        {label}
      </Txt>
      <Txt size={19} weight="extrabold" color={color}>
        {value}
      </Txt>
    </View>
  );
}
