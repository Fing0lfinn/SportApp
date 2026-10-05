import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { C } from '@/constants/theme';
import { getLang, useStrings } from '@/i18n';
import { CATALOG, catalogName, customKey, defaultStep, type CatalogCategory, type ExerciseType } from '@/lib/catalog';
import {
  catalogRow,
  fmtValue,
  formatDate,
  isoFromIndex,
  todayISO,
  toExercise,
  type ExerciseRow,
} from '@/lib/challenge';

import { Icon } from './icon';
import { ToggleRow } from './toggle-row';
import { Btn, Chips, Field, IconBtn, Segmented, Stepper, styles, Txt } from './ui';

export const MAX_EXERCISES = 20;

/** Gün ekleyerek tarih (YYYY-MM-DD) */
function shiftDate(iso: string, days: number) {
  return isoFromIndex(days, iso);
}

function nextMonday() {
  const d = new Date();
  const add = (8 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + add);
  return todayISO(d);
}

function firstOfNextMonth() {
  const d = new Date();
  return todayISO(new Date(d.getFullYear(), d.getMonth() + 1, 1));
}

/** Başlangıç tarihi: hızlı seçimler + gün gün ileri/geri */
export function StartDatePicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const t = useStrings().editor;
  const today = todayISO();
  const quick = [
    { key: today, label: t.today },
    { key: nextMonday(), label: t.nextMonday },
    { key: firstOfNextMonth(), label: t.firstOfMonth },
  ];
  return (
    <View style={{ gap: 10 }}>
      <Txt size={14} weight="bold" color={C.sub}>
        {t.startDate}
      </Txt>
      <View style={[styles.rowBetween, { backgroundColor: C.surface2, borderRadius: 20, padding: 10 }]}>
        <IconBtn name="back" label={t.dayEarlier} bg={C.surface3} onPress={() => onChange(shiftDate(value, -1))} />
        <Txt size={20} weight="extrabold" style={{ flex: 1, textAlign: 'center' }}>
          {formatDate(value)}
        </Txt>
        <IconBtn name="chevronRight" label={t.dayLater} bg={C.surface3} onPress={() => onChange(shiftDate(value, 1))} />
      </View>
      <Chips items={quick} value={quick.some((q) => q.key === value) ? value : ''} onChange={onChange} />
    </View>
  );
}

/** Grubun hareket listesi: hedefleri değiştir, sırala, çıkar, katalogdan ya da özel hareket ekle. */
export function ExerciseListEditor({
  rows,
  onChange,
  canCustom,
}: {
  rows: ExerciseRow[];
  onChange: (rows: ExerciseRow[]) => void;
  canCustom: boolean;
}) {
  const t = useStrings();
  const e = t.editor;
  const [adding, setAdding] = useState(false);
  const lang = getLang();
  const full = rows.length >= MAX_EXERCISES;

  const update = (i: number, patch: Partial<ExerciseRow>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <View style={{ gap: 10 }}>
      {rows.map((r, i) => {
        const ex = toExercise(r, lang);
        return (
          <Animated.View
            key={r.exercise}
            layout={LinearTransition.duration(250)}
            entering={FadeInDown.duration(300)}
            style={{ backgroundColor: C.surface2, borderRadius: 20, padding: 14, gap: 10 }}>
            <View style={[styles.row, { gap: 6 }]}>
              <View style={{ flex: 1 }}>
                <Txt size={16} weight="bold" numberOfLines={1}>
                  {ex.label}
                </Txt>
                <Txt size={13} color={C.sub}>
                  {e.types[ex.type]}
                  {ex.custom ? ` · ${e.custom}` : ''}
                </Txt>
              </View>
              <IconBtn name="up" label={e.moveUp} size={34} bg={C.surface3} onPress={() => move(i, -1)} />
              <IconBtn name="down" label={e.moveDown} size={34} bg={C.surface3} onPress={() => move(i, 1)} />
              <IconBtn
                name="trash"
                label={e.remove(ex.name)}
                size={34}
                bg={C.surface3}
                color={C.danger}
                onPress={() => rows.length > 1 && onChange(rows.filter((_, j) => j !== i))}
              />
            </View>
            <View style={[styles.rowBetween, { gap: 8 }]}>
              <Txt size={14} weight="semibold" color={C.sub}>
                {e.goal}
              </Txt>
              <View style={[styles.row, { gap: 8 }]}>
                <IconBtn
                  name="minus"
                  label={e.goalDown}
                  size={36}
                  bg={C.surface3}
                  onPress={() => update(i, { goal: Math.max(ex.step, Math.round((r.goal - ex.step) * 100) / 100) })}
                />
                <Txt size={18} weight="extrabold" style={{ minWidth: 92, textAlign: 'center' }}>
                  {fmtValue(ex, r.goal)}
                </Txt>
                <IconBtn
                  name="plus"
                  label={e.goalUp}
                  size={36}
                  bg={C.surface3}
                  onPress={() => update(i, { goal: Math.round((r.goal + ex.step) * 100) / 100 })}
                />
              </View>
            </View>
          </Animated.View>
        );
      })}

      {adding ? (
        <AddExercise
          existing={rows.map((r) => r.exercise)}
          canCustom={canCustom}
          onAdd={(row) => {
            onChange([...rows, row]);
            setAdding(false);
          }}
          onClose={() => setAdding(false)}
        />
      ) : (
        <Btn
          kind="secondary"
          height={50}
          icon="plus"
          title={full ? e.full(MAX_EXERCISES) : e.add}
          disabled={full}
          onPress={() => setAdding(true)}
        />
      )}
    </View>
  );
}

const CATS: CatalogCategory[] = ['barbell', 'bodyweight', 'other'];

function AddExercise({
  existing,
  canCustom,
  onAdd,
  onClose,
}: {
  existing: string[];
  canCustom: boolean;
  onAdd: (row: ExerciseRow) => void;
  onClose: () => void;
}) {
  const t = useStrings();
  const e = t.editor;
  const lang = getLang();
  const [cat, setCat] = useState<CatalogCategory | 'custom'>('barbell');

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={{ backgroundColor: C.surface2, borderRadius: 22, padding: 14, gap: 12 }}>
      <View style={styles.rowBetween}>
        <Txt size={17} weight="extrabold">
          {e.add}
        </Txt>
        <IconBtn name="close" label={t.common.close} size={36} bg={C.surface3} onPress={onClose} />
      </View>
      <Chips
        items={[...CATS.map((c) => ({ key: c, label: e.cats[c] })), { key: 'custom' as const, label: e.customTab }]}
        value={cat}
        onChange={setCat}
      />
      {cat === 'custom' ? (
        canCustom ? (
          <CustomExerciseForm onAdd={onAdd} />
        ) : (
          <View style={{ gap: 10 }}>
            <Txt size={15} color={C.sub} style={{ lineHeight: 21 }}>
              {e.customPro}
            </Txt>
            <Btn title={t.share.unlockPro} icon="star" height={48} onPress={() => router.push('/pro')} />
          </View>
        )
      ) : (
        <View style={{ gap: 6 }}>
          {CATALOG.filter((c) => c.cat === cat).map((c) => {
            const added = existing.includes(c.key);
            return (
              <Pressable
                key={c.key}
                accessibilityRole="button"
                disabled={added}
                onPress={() => onAdd(catalogRow(c.key))}
                style={({ pressed }) => [
                  styles.rowBetween,
                  {
                    backgroundColor: C.surface3,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    opacity: added ? 0.45 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}>
                <Txt size={15} weight="bold" style={{ flexShrink: 1 }}>
                  {catalogName(c.key, lang)}
                </Txt>
                {added ? (
                  <Icon name="check" size={18} color={C.accent} stroke={3} />
                ) : (
                  <Icon name="plus" size={18} color={C.text} stroke={2.6} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
}

function CustomExerciseForm({ onAdd }: { onAdd: (row: ExerciseRow) => void }) {
  const t = useStrings();
  const e = t.editor;
  const [name, setName] = useState('');
  const [type, setType] = useState<ExerciseType>('weight');
  const [perHand, setPerHand] = useState(false);
  const [goal, setGoal] = useState(50);
  const [distance, setDistance] = useState(20);
  const step = defaultStep(type, perHand);
  const row: ExerciseRow = {
    exercise: '',
    type,
    goal,
    per_hand: perHand && (type === 'weight' || type === 'carry'),
    distance: type === 'carry' ? distance : 0,
    name: name.trim() || null,
    position: 0,
  };
  const preview = toExercise({ ...row, name: row.name ?? '?' }, getLang());

  return (
    <View style={{ gap: 12 }}>
      <Field
        label={e.customName}
        value={name}
        onChangeText={(v) => setName(v.slice(0, 32))}
        placeholder={e.customPlaceholder}
        style={{ backgroundColor: C.surface3 }}
      />
      <Segmented
        items={(['weight', 'reps', 'time', 'carry'] as const).map((k) => ({ key: k, label: e.typesShort[k] }))}
        value={type}
        onChange={(k) => {
          setType(k);
          setGoal(k === 'reps' ? 20 : k === 'time' ? 60 : 50);
        }}
      />
      {type === 'weight' || type === 'carry' ? (
        <ToggleRow title={e.perHand} value={perHand} onChange={setPerHand} />
      ) : null}
      {type === 'carry' ? (
        <Stepper
          title={t.form.distance}
          sub="m"
          value={String(distance)}
          onDec={() => setDistance(Math.max(5, distance - 5))}
          onInc={() => setDistance(distance + 5)}
        />
      ) : null}
      <Stepper
        title={e.goal}
        value={fmtValue(preview, goal)}
        onDec={() => setGoal(Math.max(step, Math.round((goal - step) * 100) / 100))}
        onInc={() => setGoal(Math.round((goal + step) * 100) / 100)}
      />
      <Btn
        title={e.addCustom}
        height={50}
        disabled={!name.trim()}
        onPress={() => onAdd({ ...row, exercise: customKey() })}
      />
    </View>
  );
}
