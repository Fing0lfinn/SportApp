import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { Btn, Card, Empty, IconBtn, Loading, Pill, Screen, Stepper, styles, Txt } from '@/components/ui';
import { WeightChart } from '@/components/weight-chart';
import { C } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { fmt, formatDate } from '@/lib/challenge';
import { useProfile } from '@/lib/data';
import { useBodyWeights, useDeleteWeight, useHealthSettings, useLogWeight } from '@/lib/health';

const half = (v: number) => Math.round(v * 2) / 2;

/** Kilo takibi: bugünün kilosunu gir, hedefe doğru grafiği gör. */
export default function Weight() {
  const t = useStrings();
  const k = t.weight;
  const weights = useBodyWeights();
  const settings = useHealthSettings();
  const profile = useProfile();
  const log = useLogWeight();
  const del = useDeleteWeight();
  const list = weights.data ?? [];
  const latest = list.at(-1)?.weight ?? profile.data?.body_weight ?? null;
  const [value, setValue] = useState<number | null>(null);

  if (weights.isLoading || settings.isLoading) return <Loading />;
  const current = value ?? (latest ? Number(latest) : 75);
  const target = settings.data?.target_weight ? Number(settings.data.target_weight) : null;
  const first = list[0]?.weight;
  const change = first !== undefined && latest !== null ? Math.round((Number(latest) - first) * 10) / 10 : null;
  const toGo = target !== null && latest !== null ? Math.round((target - Number(latest)) * 10) / 10 : null;

  return (
    <Screen bottom={60} gap={16}>
      <IconBtn name="back" label={t.common.back} onPress={() => router.back()} />
      <Txt size={32} weight="extrabold">
        {k.title}
      </Txt>

      <Card style={{ gap: 14 }}>
        <View style={styles.rowBetween}>
          <View>
            <Txt size={14} weight="semibold" color={C.sub}>
              {k.current}
            </Txt>
            <Txt size={34} weight="black">
              {latest !== null ? `${fmt(Number(latest))} kg` : '–'}
            </Txt>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            {change !== null && list.length > 1 ? (
              <Txt size={15} weight="bold" color={C.sub}>
                {k.change(`${change > 0 ? '+' : ''}${fmt(change)} kg`)}
              </Txt>
            ) : null}
            {toGo !== null ? (
              <Pill bg={Math.abs(toGo) < 0.05 ? C.gold : C.surface2} fg={Math.abs(toGo) < 0.05 ? C.accentInk : C.text}>
                {Math.abs(toGo) < 0.05 ? k.reached : k.toGo(`${fmt(Math.abs(toGo))} kg`, fmt(target ?? 0))}
              </Pill>
            ) : null}
          </View>
        </View>
        {list.length ? (
          <WeightChart points={list.map((w) => ({ day: w.measured_on, weight: w.weight }))} target={target} />
        ) : null}
      </Card>

      <Stepper
        title={k.today}
        sub="kg"
        value={fmt(current)}
        onDec={() => setValue(Math.max(30, half(current - 0.5)))}
        onInc={() => setValue(Math.min(300, half(current + 0.5)))}
      />
      <Btn
        title={t.common.save}
        loading={log.isPending}
        onPress={async () => {
          await log.mutateAsync({ weight: current });
          setValue(null);
        }}
      />
      {target === null ? (
        <Btn kind="secondary" icon="target" height={48} title={k.setGoal} onPress={() => router.push('/goals')} />
      ) : null}

      <Txt size={20} weight="extrabold" style={{ marginTop: 6 }}>
        {k.history}
      </Txt>
      {!list.length ? <Empty title={k.emptyTitle} text={k.emptyText} /> : null}
      {[...list]
        .reverse()
        .slice(0, 60)
        .map((w) => (
          <View key={w.id} style={[styles.row, { backgroundColor: C.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 }]}>
            <Txt size={15} color={C.sub} style={{ flex: 1 }}>
              {formatDate(w.measured_on)}
            </Txt>
            {w.pending ? (
              <Pill bg={C.surface3} fg={C.sub}>
                {t.exercise.pending}
              </Pill>
            ) : null}
            <Txt size={17} weight="extrabold">
              {fmt(w.weight)} kg
            </Txt>
            <IconBtn name="trash" label={k.delete} size={36} bg={C.surface2} color={C.sub} onPress={() => del.mutate(w.id)} />
          </View>
        ))}
      <View style={[styles.row, { gap: 8 }]}>
        <Icon name="lock" size={16} color={C.muted} />
        <Txt size={13} color={C.muted} style={{ flex: 1 }}>
          {k.private}
        </Txt>
      </View>
    </Screen>
  );
}
