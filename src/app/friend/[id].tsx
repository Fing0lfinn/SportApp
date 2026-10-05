import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar, Bar, Card, IconBtn, Loading, Screen, styles, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { EXERCISES, fmt } from '@/lib/challenge';
import { useActiveGroup, useGroupBoard, useMyStats } from '@/lib/data';

export default function Friend() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { group } = useActiveGroup();
  const board = useGroupBoard(group?.id);
  const mine = useMyStats();
  const friend = board.active.find((p) => p.id === id);
  const me = board.active.find((p) => p.isMe);

  if (!friend || mine.isLoading) return <Loading />;
  const rank = board.ranked.findIndex((p) => p.id === friend.id) + 1;
  const myColor = me?.color ?? C.accent;

  let a = 0;
  let b = 0;
  const rows = EXERCISES.map((ex) => {
    const x = mine.stats.byExercise[ex.key].best;
    const y = friend.stats.byExercise[ex.key].best;
    if (x > y) a++;
    else if (y > x) b++;
    return { ex, x, y };
  });

  return (
    <Screen bottom={40}>
      <IconBtn name="back" label="Geri" onPress={() => router.back()} />
      <View style={styles.row}>
        <Avatar name={friend.name} color={friend.color} size={68} />
        <View style={{ flex: 1 }}>
          <Txt size={32} weight="extrabold" numberOfLines={1} style={{ lineHeight: 38 }}>
            {friend.name}
          </Txt>
          <Txt size={16} color={C.sub}>
            {rank}. sırada · %{friend.stats.pct} · {friend.stats.done}/9 hedef
          </Txt>
        </View>
      </View>

      <Card style={{ borderRadius: 28, padding: 20, gap: 18 }}>
        <View style={[styles.row, { justifyContent: 'center', gap: 18 }]}>
          <Txt size={15} weight="extrabold" color={myColor}>
            SEN
          </Txt>
          <Txt size={44} weight="extrabold" style={{ lineHeight: 50 }}>
            {a} – {b}
          </Txt>
          <Txt size={15} weight="extrabold" color={friend.color}>
            {friend.name.toLocaleUpperCase('tr-TR')}
          </Txt>
        </View>
        {rows.map(({ ex, x, y }, i) => {
          const meLead = x >= y;
          const themLead = y >= x;
          const unit = ex.unit === 'kg' ? ' kg' : '';
          return (
            <Animated.View key={ex.key} entering={FadeInDown.delay(120 + i * 45).duration(400)} style={{ gap: 6 }}>
              <View style={styles.rowBetween}>
                <Txt size={17} weight="extrabold" color={meLead ? C.text : C.muted} style={{ minWidth: 64 }}>
                  {fmt(x)}
                  {unit}
                </Txt>
                <Txt size={14} weight="semibold" color={C.sub} style={{ textAlign: 'center', flexShrink: 1 }}>
                  {ex.name}
                </Txt>
                <Txt size={17} weight="extrabold" color={themLead ? C.text : C.muted} style={{ minWidth: 64, textAlign: 'right' }}>
                  {fmt(y)}
                  {unit}
                </Txt>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={{ flex: 1, transform: [{ scaleX: -1 }] }}>
                  <Bar value={x / ex.goal} color={meLead ? myColor : '#3A3F48'} delay={300 + i * 45} />
                </View>
                <View style={{ flex: 1 }}>
                  <Bar value={y / ex.goal} color={themLead ? friend.color : '#3A3F48'} delay={300 + i * 45} />
                </View>
              </View>
            </Animated.View>
          );
        })}
      </Card>
    </Screen>
  );
}
