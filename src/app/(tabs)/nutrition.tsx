import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { Bar, Btn, Card, IconBtn, Pill, Ring, Screen, styles, Title, Txt } from '@/components/ui';
import { WaterCard } from '@/components/water-card';
import { C } from '@/constants/theme';
import { useLang, useStrings } from '@/i18n';
import { fmt, formatDate, isoFromIndex, todayISO } from '@/lib/challenge';
import { useDailyTargets } from '@/lib/health';
import { itemName, SLOTS, sumItems, useMeals, type Meal, type Slot } from '@/lib/nutrition';

const MACRO_COLORS = { protein: C.accent, carbs: C.gold, fat: C.orange };

const shiftDay = (iso: string, days: number) => isoFromIndex(days, iso);

export default function Nutrition() {
  const t = useStrings();
  const n = t.nutrition;
  const today = todayISO();
  const [day, setDay] = useState(today);
  const meals = useMeals(day);
  const targets = useDailyTargets();
  const totals = sumItems(meals.data ?? []);
  const isToday = day === today;

  return (
    <Screen refreshing={meals.isRefetching} onRefresh={meals.refetch} gap={16}>
      <Title>{n.title}</Title>

      <View style={styles.rowBetween}>
        <IconBtn name="back" label={n.prevDay} onPress={() => setDay(shiftDay(day, -1))} />
        <Txt size={17} weight="extrabold">
          {isToday ? n.today : day === shiftDay(today, -1) ? n.yesterday : formatDate(day)}
        </Txt>
        {isToday ? (
          <View style={{ width: 44 }} />
        ) : (
          <IconBtn name="chevronRight" label={n.nextDay} onPress={() => setDay(shiftDay(day, 1))} />
        )}
      </View>

      <WaterCard day={day} />

      {!targets.loading && !targets.hasGoal ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/goals')}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: C.meBg, borderRadius: 20, padding: 16, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}>
          <Icon name="target" size={24} color={C.accent} />
          <View style={{ flex: 1 }}>
            <Txt size={16} weight="extrabold">
              {n.setGoalTitle}
            </Txt>
            <Txt size={14} color={C.sub}>
              {n.setGoalText}
            </Txt>
          </View>
          <Icon name="chevronRight" size={20} color={C.sub} stroke={2.6} />
        </Pressable>
      ) : null}

      <Card style={{ gap: 16 }}>
        <View style={[styles.row, { gap: 18 }]}>
          <Ring value={targets.kcal ? totals.kcal / targets.kcal : 0} size={124} stroke={12}>
            <Txt size={26} weight="black">
              {totals.kcal}
            </Txt>
            <Txt size={12} weight="bold" color={C.sub}>
              {targets.kcal ? `/ ${targets.kcal} kcal` : 'kcal'}
            </Txt>
          </Ring>
          <View style={{ flex: 1, gap: 6 }}>
            {targets.kcal ? (
              <Txt size={15} weight="bold" color={totals.kcal > targets.kcal ? C.orange : C.text}>
                {totals.kcal > targets.kcal ? n.over(totals.kcal - targets.kcal) : n.left(targets.kcal - totals.kcal)}
              </Txt>
            ) : (
              <Txt size={14} color={C.sub}>
                {n.noTarget}
              </Txt>
            )}
            <Macro label={n.protein} value={totals.protein} target={targets.protein} color={MACRO_COLORS.protein} />
            <Macro label={n.carbs} value={totals.carbs} color={MACRO_COLORS.carbs} />
            <Macro label={n.fat} value={totals.fat} color={MACRO_COLORS.fat} />
          </View>
        </View>
      </Card>

      {SLOTS.map((slot, i) => (
        <Animated.View key={slot} entering={FadeInDown.delay(80 + i * 50).duration(400)}>
          <SlotCard slot={slot} day={day} meals={(meals.data ?? []).filter((m) => m.slot === slot)} />
        </Animated.View>
      ))}

      <Txt size={12} color={C.muted} style={{ lineHeight: 18 }}>
        {n.source}
      </Txt>
    </Screen>
  );
}

function Macro({ label, value, target, color }: { label: string; value: number; target?: number | null; color: string }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={styles.rowBetween}>
        <Txt size={13} weight="bold" color={C.sub}>
          {label}
        </Txt>
        <Txt size={13} weight="bold">
          {fmt(value)}
          {target ? ` / ${target}` : ''} g
        </Txt>
      </View>
      {target ? <Bar value={value / target} color={color} height={6} /> : null}
    </View>
  );
}

function SlotCard({ slot, day, meals }: { slot: Slot; day: string; meals: Meal[] }) {
  const t = useStrings();
  const lang = useLang();
  const n = t.nutrition;
  const kcal = sumItems(meals).kcal;
  const open = (id?: string) => router.push({ pathname: '/meal', params: { slot, day, ...(id ? { id } : {}) } });

  return (
    <Card style={{ gap: 10 }}>
      <View style={styles.rowBetween}>
        <View>
          <Txt size={18} weight="extrabold">
            {n.slots[slot]}
          </Txt>
          {meals.length ? (
            <Txt size={13} color={C.sub}>
              {kcal} kcal
            </Txt>
          ) : null}
        </View>
        <Btn kind="secondary" icon="plus" height={40} title={n.add} onPress={() => open()} />
      </View>
      {meals.map((m) => (
        <Pressable
          key={m.id}
          accessibilityRole="button"
          accessibilityHint={n.tapToEdit}
          onPress={() => open(m.id)}
          style={({ pressed }) => [
            { backgroundColor: C.surface2, borderRadius: 16, padding: 12, gap: 4, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}>
          <View style={styles.rowBetween}>
            <Txt size={15} weight="bold" style={{ flex: 1 }} numberOfLines={2}>
              {m.items.length ? m.items.map((it) => itemName(it, lang)).join(', ') : m.name}
            </Txt>
            {m.pending ? (
              <Pill bg={C.surface3} fg={C.sub}>
                {t.exercise.pending}
              </Pill>
            ) : null}
          </View>
          <Txt size={13} color={C.sub}>
            {n.mealLine(Math.round(m.kcal), fmt(m.protein), fmt(m.carbs), fmt(m.fat))}
          </Txt>
        </Pressable>
      ))}
    </Card>
  );
}
