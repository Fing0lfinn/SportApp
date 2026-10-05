import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Hexagon } from '@/components/hexagon';
import { Bar, Loading, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { computeBadges } from '@/lib/badges';
import { fmt } from '@/lib/challenge';
import { useMyStats, useProfile } from '@/lib/data';

export default function BadgeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mine = useMyStats();
  const profile = useProfile();
  if (mine.isLoading || !profile.data) return <Loading />;
  const b = computeBadges(mine.stats, profile.data.body_weight).find((x) => x.id === id);
  if (!b) return null;

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 36, gap: 16, alignItems: 'center' }}>
      <Animated.View entering={ZoomIn.duration(500)}>
        <Hexagon glyph={b.glyph} earned={b.earned} size={120} />
      </Animated.View>
      <Txt size={28} weight="black" style={{ textAlign: 'center' }}>
        {b.name}
      </Txt>
      <Txt size={16} color={C.sub} style={{ textAlign: 'center', lineHeight: 23 }}>
        {b.desc}
      </Txt>
      <View style={{ alignSelf: 'stretch', backgroundColor: C.surface2, borderRadius: 18, padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt size={15} weight="bold" color={b.earned ? C.gold : C.sub}>
            {b.earned ? 'Kazanıldı' : 'Kilitli'}
          </Txt>
          <Txt size={15} weight="bold">
            {b.need > 1 ? `${fmt(b.current)} / ${fmt(b.need)}${b.unit ?? ''}` : b.earned ? '1 / 1' : '0 / 1'}
          </Txt>
        </View>
        <Bar value={b.current / b.need} height={8} color={b.earned ? C.gold : C.accent} track={C.surface3} delay={200} />
      </View>
      {b.id === 'double' && !profile.data.body_weight ? (
        <Txt size={14} color={C.sub} style={{ textAlign: 'center' }}>
          Bu rozet için profilinde vücut ağırlığını gir.
        </Txt>
      ) : null}
    </ScrollView>
  );
}
