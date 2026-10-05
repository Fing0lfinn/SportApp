import { View } from 'react-native';

import { useStrings } from '@/i18n';
import { fmt, fmtTime, type Exercise } from '@/lib/challenge';

import { Stepper } from './ui';

export type FormValue = { weight: number; reps: number; distance: number };

/** Hareket tipine göre ağırlık / tekrar / mesafe girişleri. */
export function EntryForm({ ex, value, onChange }: { ex: Exercise; value: FormValue; onChange: (v: FormValue) => void }) {
  const t = useStrings().form;
  const set = (patch: Partial<FormValue>) => onChange({ ...value, ...patch });
  if (ex.type === 'time') {
    return (
      <Stepper
        title={t.time}
        sub={t.timeSub(ex.step)}
        value={fmtTime(value.reps)}
        onDec={() => set({ reps: Math.max(ex.step, value.reps - ex.step) })}
        onInc={() => set({ reps: value.reps + ex.step })}
      />
    );
  }
  return (
    <View style={{ gap: 12 }}>
      {ex.type !== 'reps' ? (
        <Stepper
          title={ex.perHand ? t.weightPerHand : t.weight}
          sub={t.weightSub(fmt(ex.step))}
          value={fmt(value.weight)}
          onDec={() => set({ weight: Math.max(0, Math.round((value.weight - ex.step) * 100) / 100) })}
          onInc={() => set({ weight: Math.round((value.weight + ex.step) * 100) / 100 })}
        />
      ) : null}
      {ex.type !== 'carry' ? (
        <Stepper
          title={t.reps}
          sub={ex.type === 'reps' ? t.repsSingle : t.repsSet}
          value={String(value.reps)}
          onDec={() => set({ reps: Math.max(1, value.reps - 1) })}
          onInc={() => set({ reps: value.reps + 1 })}
        />
      ) : null}
      {ex.type === 'carry' ? (
        <Stepper
          title={t.distance}
          sub={t.distanceSub(ex.distance)}
          value={String(value.distance)}
          onDec={() => set({ distance: Math.max(5, value.distance - 5) })}
          onInc={() => set({ distance: value.distance + 5 })}
        />
      ) : null}
    </View>
  );
}
