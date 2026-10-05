import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { Avatar, Btn, Empty, Loading, Pill, Screen, styles, Title, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { EXERCISE_BY_KEY, entryText, type ExerciseKey } from '@/lib/challenge';
import { useActiveGroup, useGroupBoard, useLikes, useToggleLike } from '@/lib/data';
import { useUserId } from '@/lib/auth';

export default function Feed() {
  const uid = useUserId();
  const { group, loading } = useActiveGroup();
  const board = useGroupBoard(group?.id);

  const items = board.active
    .flatMap((p) =>
      p.entries
        .filter((e) => !e.is_start)
        .map((e) => ({ e, p, ev: p.stats.events[e.id] })),
    )
    .sort((a, b) => b.e.created_at.localeCompare(a.e.created_at))
    .slice(0, 60);

  const likes = useLikes(group?.id, items.map((i) => i.e.id));
  const toggle = useToggleLike();

  if (loading) return <Loading />;

  return (
    <Screen refreshing={board.isRefetching} onRefresh={board.refetch} gap={14}>
      <Title sub={group?.name}>Akış</Title>

      {!group ? (
        <Empty title="Henüz bir grubun yok" text="Arkadaşlarının rekorlarını burada görmek için bir gruba katıl.">
          <Btn title="Gruplar" onPress={() => router.push('/groups')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
        </Empty>
      ) : null}

      {group && !board.isLoading && items.length === 0 ? (
        <Empty title="Henüz kayıt yok" text="İlk kaydı sen gir, akış hareketlensin." />
      ) : null}

      {items.map(({ e, p, ev }, i) => {
        const ex = EXERCISE_BY_KEY[e.exercise as ExerciseKey];
        const likeRows = (likes.data ?? []).filter((l) => l.entry_id === e.id);
        const liked = likeRows.some((l) => l.user_id === uid);
        const badge = ev?.goal
          ? { t: 'HEDEF TAMAM', bg: C.gold }
          : ev?.milestones
            ? { t: 'ARA HEDEF', bg: C.accent }
            : ev?.record
              ? { t: 'REKOR', bg: C.accent }
              : null;
        const verb = ev?.goal ? 'hedefini tamamladı' : ev?.record ? '· yeni rekor' : '· kayıt';
        return (
          <Animated.View key={e.id} entering={FadeInDown.delay(Math.min(i, 8) * 45 + 60).duration(450)}>
            <View style={{ backgroundColor: C.surface, borderRadius: 22, padding: 18, gap: 14 }}>
              <View style={styles.row}>
                <Avatar name={p.name} color={p.color} size={42} />
                <View style={{ flex: 1 }}>
                  <Txt size={16} weight="bold">
                    {p.isMe ? 'Sen' : p.name}
                  </Txt>
                  <Txt size={14} color={C.sub}>
                    {timeAgo(e.created_at)}
                  </Txt>
                </View>
                {badge ? (
                  <Pill bg={badge.bg}>{badge.t}</Pill>
                ) : null}
              </View>
              <View>
                <Txt size={16} color={C.sub}>
                  {ex.name} {verb}
                </Txt>
                <Txt size={30} weight="extrabold" style={{ lineHeight: 36 }}>
                  {entryText(ex, e)}
                </Txt>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: liked }}
                onPress={() => toggle.mutate({ entryId: e.id, liked })}
                style={({ pressed }) => [
                  styles.row,
                  {
                    alignSelf: 'flex-start',
                    gap: 8,
                    height: 44,
                    paddingHorizontal: 18,
                    borderRadius: 22,
                    backgroundColor: liked ? C.accent : C.surface2,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}>
                <Icon name="bolt" size={18} color={liked ? C.accentInk : C.text} />
                <Txt size={15} weight="bold" color={liked ? C.accentInk : C.text}>
                  Helal · {likeRows.length}
                </Txt>
              </Pressable>
            </View>
          </Animated.View>
        );
      })}
    </Screen>
  );
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Şimdi';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  if (diff < 172800) return 'Dün';
  return `${Math.floor(diff / 86400)} gün önce`;
}
