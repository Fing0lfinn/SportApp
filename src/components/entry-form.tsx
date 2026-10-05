import { View } from 'react-native';

import { fmt, type Exercise } from '@/lib/challenge';

import { Stepper } from './ui';

export type FormValue = { weight: number; reps: number; distance: number };

/** Hareket tipine göre ağırlık / tekrar / mesafe girişleri. */
export function EntryForm({ ex, value, onChange }: { ex: Exercise; value: FormValue; onChange: (v: FormValue) => void }) {
  const set = (patch: Partial<FormValue>) => onChange({ ...value, ...patch });
  return (
    <View style={{ gap: 12 }}>
      {ex.type !== 'reps' ? (
        <Stepper
          title={ex.perHand ? 'Ağırlık (her el)' : 'Ağırlık'}
          sub={`kg · ${fmt(ex.step)} kg adım`}
          value={fmt(value.weight)}
          onDec={() => set({ weight: Math.max(0, Math.round((value.weight - ex.step) * 100) / 100) })}
          onInc={() => set({ weight: Math.round((value.weight + ex.step) * 100) / 100 })}
        />
      ) : null}
      {ex.type !== 'carry' ? (
        <Stepper
          title="Tekrar"
          sub={ex.type === 'reps' ? 'tek sette, ara vermeden' : 'bu sette'}
          value={String(value.reps)}
          onDec={() => set({ reps: Math.max(1, value.reps - 1) })}
          onInc={() => set({ reps: value.reps + 1 })}
        />
      ) : null}
      {ex.type === 'carry' ? (
        <Stepper
          title="Mesafe"
          sub="metre · en az 20 m"
          value={String(value.distance)}
          onDec={() => set({ distance: Math.max(5, value.distance - 5) })}
          onInc={() => set({ distance: value.distance + 5 })}
        />
      ) : null}
    </View>
  );
}
