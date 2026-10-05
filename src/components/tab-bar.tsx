import * as Haptics from 'expo-haptics';
import type { Tabs } from 'expo-router/js-tabs';
import { useEffect, useState, type ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { C } from '@/constants/theme';

import { Icon, type IconName } from './icon';
import { EASE, Txt } from './ui';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const META: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Pano', icon: 'home' },
  board: { label: 'Sıralama', icon: 'board' },
  feed: { label: 'Akış', icon: 'feed' },
  profile: { label: 'Profil', icon: 'user' },
};

export function TabBar({ state, navigation, insets }: TabBarProps) {
  const [width, setWidth] = useState(0);
  const tabW = width ? (width - 24) / state.routes.length : 0;
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withTiming(state.index * tabW, { duration: 380, easing: EASE });
  }, [state.index, tabW, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {tabW > 0 ? (
        <Animated.View style={[styles.indicator, { width: tabW - 12, left: 18 }, indicator]} />
      ) : null}
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const meta = META[route.name] ?? { label: route.name, icon: 'home' };
        const color = focused ? C.accent : C.sub;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={meta.label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                navigation.navigate(route.name);
              }
            }}
            style={styles.tab}>
            <Icon name={meta.icon} size={24} color={color} stroke={2} />
            <Txt size={12} weight="bold" color={color}>
              {meta.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: 'rgba(11,13,16,0.97)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.surface2,
  },
  indicator: { position: 'absolute', top: 8, height: 54, borderRadius: 18, backgroundColor: C.surface2 },
  tab: { flex: 1, height: 54, alignItems: 'center', justifyContent: 'center', gap: 3 },
});
