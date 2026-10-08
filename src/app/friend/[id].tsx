import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar, Bar, Btn, Card, IconBtn, Loading, Screen, styles, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { getLang, useStrings } from '@/i18n';
import { exStats, fmtShort, unitOf } from '@/lib/challenge';
import { useGroupBoard, useMyStats } from '@/lib/data';
import { useSetBlocked } from '@/lib/safety';

export default function Friend() {
  const t = useStrings();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mine = useMyStats();
  const ch = mine.challenge;
  const board = useGroupBoard(ch);
  const friend = board.players.find((p) => p.id === id && !p.isMe);
  const me = board.active.find((p) => p.isMe);
  const setBlocked = useSetBlocked();

  if (board.isLoading || mine.isLoading) return <Loading />;
  if (!friend) {
    return (
      <Screen bottom={40}>
        <IconBtn name="back" label={t.common.back} onPress={() => router.back()} />
        <Txt size={16} color={C.sub}>
          {t.safety.notInGroup}
        </Txt>
      </Screen>
    );
  }

  const safetyActions = (
    <View style={{ gap: 10 }}>
      <Btn
        kind="secondary"
        icon="flag"
        height={50}
        title={t.safety.report}
        onPress={() => router.push({ pathname: '/report', params: { user: friend.id, name: friend.name } })}
      />
      <Btn
        kind={friend.blocked ? 'secondary' : 'danger'}
        icon="block"
        height={50}
        title={friend.blocked ? t.safety.unblock : t.safety.block}
        loading={setBlocked.isPending}
        onPress={() => setBlocked.mutate({ userId: friend.id, blocked: !friend.blocked })}
      />
      <Txt size={13} color={C.sub} style={{ textAlign: 'center' }}>
        {friend.blocked ? t.safety.blockedHint : t.safety.blockHint}
      </Txt>
    </View>
  );

  if (friend.blocked) {
    return (
      <Screen bottom={40}>
        <IconBtn name="back" label={t.common.back} onPress={() => router.back()} />
        <View style={styles.row}>
          <Avatar name={friend.name} color={C.muted} size={68} />
          <Txt size={28} weight="extrabold" numberOfLines={1} style={{ flex: 1 }}>
            {friend.name}
          </Txt>
        </View>
        <Card>
          <Txt size={16} color={C.sub}>
            {t.safety.blockedTitle}
          </Txt>
        </Card>
        {safetyActions}
      </Screen>
    );
  }
  const rank = board.ranked.findIndex((p) => p.id === friend.id) + 1;
  const myColor = me?.color ?? C.accent;

  let a = 0;
  let b = 0;
  const rows = ch.exercises.map((ex) => {
    const x = exStats(mine.stats, ex.key).best;
    const y = exStats(friend.stats, ex.key).best;
    if (x > y) a++;
    else if (y > x) b++;
    return { ex, x, y };
  });

  return (
    <Screen bottom={40}>
      <IconBtn name="back" label={t.common.back} onPress={() => router.back()} />
      <View style={styles.row}>
        <Avatar name={friend.name} color={friend.color} size={68} />
        <View style={{ flex: 1 }}>
          <Txt size={32} weight="extrabold" numberOfLines={1} style={{ lineHeight: 38 }}>
            {friend.name}
          </Txt>
          <Txt size={16} color={C.sub}>
            {t.friend.summary(rank, friend.stats.pct, friend.stats.done, ch.exercises.length)}
          </Txt>
        </View>
      </View>

      <Card style={{ borderRadius: 28, padding: 20, gap: 18 }}>
        <View style={[styles.row, { justifyContent: 'center', gap: 18 }]}>
          <Txt size={15} weight="extrabold" color={myColor}>
            {t.friend.you}
          </Txt>
          <Txt size={44} weight="extrabold" style={{ lineHeight: 50 }}>
            {a} – {b}
          </Txt>
          <Txt size={15} weight="extrabold" color={friend.color}>
            {friend.name.toLocaleUpperCase(getLang())}
          </Txt>
        </View>
        {rows.map(({ ex, x, y }, i) => {
          const meLead = x >= y;
          const themLead = y >= x;
          const unit = (v: number) => (ex.type === 'reps' ? '' : ` ${unitOf(ex, v)}`.trimEnd());
          return (
            <Animated.View key={ex.key} entering={FadeInDown.delay(120 + i * 45).duration(400)} style={{ gap: 6 }}>
              <View style={styles.rowBetween}>
                <Txt size={17} weight="extrabold" color={meLead ? C.text : C.muted} style={{ minWidth: 64 }}>
                  {fmtShort(ex, x)}
                  {unit(x)}
                </Txt>
                <Txt size={14} weight="semibold" color={C.sub} style={{ textAlign: 'center', flexShrink: 1 }}>
                  {ex.name}
                </Txt>
                <Txt size={17} weight="extrabold" color={themLead ? C.text : C.muted} style={{ minWidth: 64, textAlign: 'right' }}>
                  {fmtShort(ex, y)}
                  {unit(y)}
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
      {safetyActions}
    </Screen>
  );
}
