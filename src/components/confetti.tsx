import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const COLORS = ['#C8F04A', '#F2C14E', '#4AA8FF', '#FF8A3D', '#B58CFF', '#3DD6B0', '#F4F6F8'];

function rnd(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const PIECES = Array.from({ length: 44 }, (_, i) => ({
  left: rnd(i),
  w: 6 + Math.round(rnd(i + 50) * 5),
  h: 9 + Math.round(rnd(i + 90) * 8),
  color: COLORS[i % COLORS.length],
  duration: 1700 + Math.round(rnd(i + 130) * 1500),
  delay: Math.round(rnd(i + 170) * 600),
  drift: (i % 2 ? 1 : -1) * (30 + rnd(i + 210) * 60),
  spin: (i % 2 ? 1 : -1) * (360 + rnd(i + 250) * 360),
}));

/** Ekrandan aşağı dökülen konfeti. */
export function Confetti() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PIECES.map((p, i) => (
        <Piece key={i} {...p} left={p.left * width} fall={height + 80} />
      ))}
    </View>
  );
}

function Piece({
  left,
  w,
  h,
  color,
  duration,
  delay,
  drift,
  spin,
  fall,
}: (typeof PIECES)[number] & { fall: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration, easing: Easing.bezier(0.3, 0.6, 0.4, 1) }));
  }, [t, delay, duration]);
  const style = useAnimatedStyle(() => ({
    opacity: t.value === 0 ? 0 : 1,
    transform: [
      { translateY: -60 + t.value * fall },
      { translateX: t.value * drift },
      { rotate: `${t.value * spin}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[{ position: 'absolute', top: 0, left, width: w, height: h, borderRadius: 2, backgroundColor: color }, style]}
    />
  );
}
