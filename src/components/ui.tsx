import * as Haptics from 'expo-haptics';
import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { C, F, font } from '@/constants/theme';
import { strings } from '@/i18n';

import { Icon, type IconName } from './icon';

export const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

// ---------------------------------------------------------------- metin

type Weight = keyof typeof F;

export function Txt({
  children,
  size = 16,
  weight = 'regular',
  color = C.text,
  style,
  numberOfLines,
}: PropsWithChildren<{
  size?: number;
  weight?: Weight;
  color?: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}>) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ ...font(weight), fontSize: size, color, lineHeight: Math.round(size * 1.3) }, style]}>
      {children}
    </Text>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <View style={{ gap: 2 }}>
      <Txt size={32} weight="extrabold" style={{ lineHeight: 38 }}>
        {children}
      </Txt>
      {sub ? (
        <Txt size={15} color={C.sub}>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.rowBetween}>
      <Txt size={20} weight="extrabold">
        {children}
      </Txt>
      {right}
    </View>
  );
}

// ---------------------------------------------------------------- yerleşim

export function Screen({
  children,
  refreshing,
  onRefresh,
  bottom = 120,
  gap = 22,
}: PropsWithChildren<{ refreshing?: boolean; onRefresh?: () => void; bottom?: number; gap?: number }>) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: bottom, paddingHorizontal: 20, gap }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        ) : undefined
      }>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
      <ActivityIndicator color={C.accent} />
    </View>
  );
}

export function Empty({ title, text, children }: PropsWithChildren<{ title: string; text?: string }>) {
  return (
    <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
      <Txt size={18} weight="extrabold" style={{ textAlign: 'center' }}>
        {title}
      </Txt>
      {text ? (
        <Txt size={15} color={C.sub} style={{ textAlign: 'center' }}>
          {text}
        </Txt>
      ) : null}
      {children}
    </Card>
  );
}

// ---------------------------------------------------------------- butonlar

type BtnKind = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light';

const BTN: Record<BtnKind, { bg: string; fg: string }> = {
  primary: { bg: C.accent, fg: C.accentInk },
  secondary: { bg: C.surface2, fg: C.text },
  ghost: { bg: 'transparent', fg: C.sub },
  danger: { bg: C.surface2, fg: C.danger },
  light: { bg: C.text, fg: C.bg },
};

export function Btn({
  title,
  onPress,
  kind = 'primary',
  disabled,
  loading,
  icon,
  height = 56,
  style,
}: {
  title: string;
  onPress?: () => void;
  kind?: BtnKind;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const k = BTN[kind];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        if (kind === 'primary' && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: k.bg, height, opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={k.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={20} color={k.fg} stroke={2.8} /> : null}
          <Txt size={17} weight="extrabold" color={k.fg}>
            {title}
          </Txt>
        </>
      )}
    </Pressable>
  );
}

export function IconBtn({
  name,
  onPress,
  label,
  size = 44,
  bg = C.surface,
  color = C.text,
}: {
  name: IconName;
  onPress: () => void;
  label: string;
  size?: number;
  bg?: string;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}>
      <Icon name={name} size={size * 0.48} color={color} stroke={2.6} />
    </Pressable>
  );
}

export function Pill({ children, bg = C.accent, fg = C.accentInk }: PropsWithChildren<{ bg?: string; fg?: string }>) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 }}>
      <Txt size={12} weight="extrabold" color={fg} style={{ letterSpacing: 0.5 }}>
        {children}
      </Txt>
    </View>
  );
}

export function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Txt size={size * 0.34} weight="black" color={C.accentInk}>
        {initials(name)}
      </Txt>
    </View>
  );
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join('')
    .toLocaleUpperCase('tr-TR');
}

// ---------------------------------------------------------------- girdi

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Txt size={14} weight="bold" color={C.sub}>
        {label}
      </Txt>
      <TextInput
        placeholderTextColor="#7E8793"
        selectionColor={C.accent}
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

export function Stepper({
  title,
  sub,
  value,
  onDec,
  onInc,
  big,
  right,
}: {
  title: string;
  sub?: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
  big?: boolean;
  right?: ReactNode;
}) {
  return (
    <View style={[styles.stepper, big && { flexDirection: 'column', gap: 16, paddingVertical: 22 }]}>
      <View style={{ flexShrink: 1, alignItems: big ? 'center' : 'flex-start' }}>
        <Txt size={17} weight="bold">
          {title}
        </Txt>
        {sub ? (
          <Txt size={14} color={C.sub}>
            {sub}
          </Txt>
        ) : null}
        {right}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconBtn name="minus" label={strings().ui.dec(title)} onPress={onDec} size={big ? 56 : 48} bg={C.surface3} />
        <Txt
          size={big ? 52 : 32}
          weight="extrabold"
          style={{ minWidth: big ? 130 : 88, textAlign: 'center', lineHeight: big ? 60 : 40 }}>
          {value}
        </Txt>
        <IconBtn name="plus" label={strings().ui.inc(title)} onPress={onInc} size={big ? 56 : 48} bg={C.surface3} />
      </View>
    </View>
  );
}

export function Chips<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Pressable
            key={it.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(it.key)}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: on ? C.accent : C.surface2, transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}>
            <Txt size={15} weight="bold" color={on ? C.accentInk : C.text}>
              {it.label}
            </Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Segmented<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (k: T) => void;
}) {
  const [width, setWidth] = useState(0);
  const idx = Math.max(
    0,
    items.findIndex((i) => i.key === value),
  );
  const seg = width ? (width - 8) / items.length : 0;
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withTiming(idx * seg, { duration: 350, easing: EASE });
  }, [idx, seg, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.segment} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {seg > 0 ? (
        <Animated.View style={[styles.segmentIndicator, { width: seg }, indicator]} />
      ) : null}
      {items.map((it) => (
        <Pressable
          key={it.key}
          accessibilityRole="button"
          accessibilityState={{ selected: it.key === value }}
          onPress={() => onChange(it.key)}
          style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Txt size={15} weight="bold" color={it.key === value ? C.accentInk : C.text}>
            {it.label}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- ilerleme

export function Bar({
  value,
  color = C.accent,
  height = 6,
  ticks = [],
  delay = 0,
  track = C.line,
}: {
  value: number;
  color?: string;
  height?: number;
  ticks?: number[];
  delay?: number;
  track?: string;
}) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delay, withTiming(Math.max(0, Math.min(1, value)), { duration: 850, easing: EASE }));
  }, [value, delay, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: color }, fill]} />
      {ticks.map((t) => (
        <View
          key={t}
          style={{ position: 'absolute', top: 0, bottom: 0, width: 2, left: `${t * 100}%`, backgroundColor: C.surface }}
        />
      ))}
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function Ring({
  value,
  size = 128,
  stroke = 12,
  color = C.accent,
  children,
}: PropsWithChildren<{ value: number; size?: number; stroke?: number; color?: string }>) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, value)), { duration: 1100, easing: EASE });
  }, [value, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.value) }));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.line} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          animatedProps={props}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>{children}</View>
    </View>
  );
}

/** Değere kadar sayan rakam. */
export function CountUp({
  to,
  style,
  format = String,
}: {
  to: number;
  style?: StyleProp<TextStyle>;
  format?: (n: number) => string;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = Date.now();
    const from = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / 950);
      setN(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return (
    <Text style={style}>{format(n)}</Text>
  );
}

// ---------------------------------------------------------------- stiller

export const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  card: { backgroundColor: C.surface, borderRadius: 24, padding: 18 },
  btn: {
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  input: {
    height: 56,
    borderRadius: 18,
    backgroundColor: C.surface,
    color: C.text,
    paddingHorizontal: 18,
    fontFamily: F.semibold,
    fontSize: 18,
  },
  stepper: {
    backgroundColor: C.surface2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chip: { height: 42, paddingHorizontal: 16, borderRadius: 21, justifyContent: 'center' },
  segment: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 16, padding: 4 },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 12,
    backgroundColor: C.accent,
  },
});
