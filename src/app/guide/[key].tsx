import { useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useLang, useStrings } from '@/i18n';
import { useChallenge } from '@/lib/data';
import { guideFor } from '@/lib/guide';

export default function GuideScreen() {
  const t = useStrings().guide;
  const lang = useLang();
  const { key } = useLocalSearchParams<{ key: string }>();
  const ch = useChallenge();
  const ex = ch.byKey[key];
  if (!ex) return null;
  const { detailed: g, rule, video } = guideFor(ex, lang);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 18 }}>
      <Txt size={24} weight="extrabold">
        {ex.name}
      </Txt>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.videoA11y}
        onPress={() => Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(video)}`)}
        style={({ pressed }) => ({
          height: 160,
          borderRadius: 22,
          backgroundColor: C.bg,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={26} height={26} viewBox="0 0 24 24">
            <Path d="M8 5v14l11-7z" fill={C.accentInk} />
          </Svg>
        </View>
        <Txt size={14} weight="bold" color={C.sub}>
          {t.watch}
        </Txt>
      </Pressable>

      {g ? (
      <View style={{ gap: 8 }}>
        <Txt size={14} weight="bold" color={C.sub}>
          {t.muscles}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {g.muscles.map((m) => (
            <View key={m} style={{ backgroundColor: C.surface2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 }}>
              <Txt size={14} weight="bold">
                {m}
              </Txt>
            </View>
          ))}
        </View>
      </View>
      ) : null}

      {g ? (
      <View style={{ gap: 14 }}>
        {g.steps.map((s, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(120 + i * 60).duration(400)} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Txt size={15} weight="black" color={C.accentInk}>
                {i + 1}
              </Txt>
            </View>
            <Txt size={16} style={{ flex: 1, lineHeight: 24, paddingTop: 2 }}>
              {s}
            </Txt>
          </Animated.View>
        ))}
      </View>

      ) : null}

      {g ? (
      <View style={{ backgroundColor: C.goldBg, borderRadius: 18, padding: 16, gap: 10 }}>
        <Txt size={15} weight="extrabold" color={C.gold}>
          {t.mistakes}
        </Txt>
        {g.mistakes.map((m) => (
          <View key={m} style={{ flexDirection: 'row', gap: 10 }}>
            <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginTop: 2 }}>
              <Path d="M12 3l10 18H2zM12 10v4M12 17.5v.5" stroke={C.gold} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
            <Txt size={15} style={{ flex: 1, lineHeight: 22 }}>
              {m}
            </Txt>
          </View>
        ))}
      </View>
      ) : null}

      <View style={{ backgroundColor: C.surface2, borderRadius: 18, padding: 16 }}>
        <Txt size={15} style={{ lineHeight: 22 }}>
          <Txt size={15} weight="extrabold" color={C.accent}>
            {t.rule}{' '}
          </Txt>
          {rule}
        </Txt>
      </View>
    </ScrollView>
  );
}
