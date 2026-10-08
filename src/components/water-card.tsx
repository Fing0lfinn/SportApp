import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { C, F } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { useDailyTargets, useSaveHealthSettings } from '@/lib/health';
import { useAddWater, useDeleteWater, useWater } from '@/lib/nutrition';

import { Icon } from './icon';
import { Bar, Btn, Card, Pill, Stepper, styles, Txt } from './ui';

export const WATER = '#4AA8FF';
const QUICK = [200, 330, 500];

/** Sabit su kartı: bugün içilen / hedef, dolan bar, hızlı ekleme, geri alma ve hedef ayarı. */
export function WaterCard({ day }: { day: string }) {
  const t = useStrings();
  const w = t.water;
  const water = useWater(day);
  const targets = useDailyTargets();
  const add = useAddWater();
  const del = useDeleteWater();
  const save = useSaveHealthSettings();
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const [editGoal, setEditGoal] = useState<number | null>(null);

  const goal = targets.water;
  const total = water.total;
  const done = total >= goal;
  const last = water.data?.at(-1);

  const addMl = (ml: number) => {
    if (!ml || ml < 1) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    add.mutate({ ml: Math.min(5000, Math.round(ml)), day });
  };

  return (
    <Card style={{ gap: 14 }}>
      <View style={styles.rowBetween}>
        <View style={[styles.row, { gap: 10 }]}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#14263A', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="drop" size={20} color={WATER} stroke={2.4} />
          </View>
          <Txt size={20} weight="extrabold">
            {w.title}
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={w.editGoal}
          hitSlop={8}
          onPress={() => setEditGoal(editGoal === null ? goal : null)}>
          <Txt size={16} weight="bold" color={C.sub}>
            <Txt size={20} weight="black" color={done ? WATER : C.text}>
              {total}
            </Txt>{' '}
            / {goal} ml
          </Txt>
        </Pressable>
      </View>

      <Bar value={goal ? total / goal : 0} color={WATER} height={14} />

      {done ? (
        <Animated.View entering={FadeIn.duration(300)} style={{ alignSelf: 'flex-start' }}>
          <Pill bg={WATER} fg={C.accentInk}>
            {w.reached}
          </Pill>
        </Animated.View>
      ) : (
        <Txt size={14} color={C.sub}>
          {w.left(goal - total)}
        </Txt>
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {QUICK.map((ml) => (
          <Pressable
            key={ml}
            accessibilityRole="button"
            accessibilityLabel={w.addMl(ml)}
            onPress={() => addMl(ml)}
            style={({ pressed }) => ({
              flex: 1,
              height: 46,
              borderRadius: 14,
              backgroundColor: C.surface2,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}>
            <Txt size={15} weight="extrabold">
              +{ml}
            </Txt>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={w.custom}
          onPress={() => setCustomOpen(!customOpen)}
          style={({ pressed }) => ({
            flex: 1,
            height: 46,
            borderRadius: 14,
            backgroundColor: customOpen ? WATER : C.surface2,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}>
          <Txt size={15} weight="extrabold" color={customOpen ? C.accentInk : C.text}>
            {w.custom}
          </Txt>
        </Pressable>
      </View>

      {customOpen ? (
        <View style={[styles.row, { gap: 8 }]}>
          <TextInput
            value={custom}
            onChangeText={(v) => setCustom(v.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="number-pad"
            placeholder="ml"
            placeholderTextColor="#7E8793"
            selectionColor={WATER}
            accessibilityLabel={w.customLabel}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 14,
              backgroundColor: C.surface2,
              color: C.text,
              paddingHorizontal: 14,
              fontFamily: F.semibold,
              fontSize: 17,
            }}
          />
          <Btn
            title={w.add}
            height={48}
            disabled={!Number(custom)}
            onPress={() => {
              addMl(Number(custom));
              setCustom('');
              setCustomOpen(false);
            }}
          />
        </View>
      ) : null}

      {last ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => del.mutate(last.id)}
          hitSlop={6}
          style={[styles.row, { gap: 6, alignSelf: 'flex-start' }]}>
          <Icon name="undo" size={16} color={C.sub} />
          <Txt size={14} weight="semibold" color={C.sub}>
            {w.undo(Number(last.ml))}
          </Txt>
        </Pressable>
      ) : null}

      {editGoal !== null ? (
        <View style={{ gap: 10 }}>
          <Stepper
            title={w.goal}
            sub="ml"
            value={String(editGoal)}
            onDec={() => setEditGoal(Math.max(500, editGoal - 250))}
            onInc={() => setEditGoal(Math.min(6000, editGoal + 250))}
          />
          {save.isError ? (
            <Txt size={14} color={C.danger}>
              {w.goalError}
            </Txt>
          ) : null}
          <Btn
            title={t.common.save}
            height={48}
            loading={save.isPending}
            onPress={() =>
              save
                .mutateAsync({ water_target: editGoal })
                .then(() => setEditGoal(null))
                .catch(() => {})
            }
          />
        </View>
      ) : null}
    </Card>
  );
}
