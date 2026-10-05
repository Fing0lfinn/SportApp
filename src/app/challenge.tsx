import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ExerciseListEditor, StartDatePicker } from '@/components/challenge-editor';
import { Btn, Empty, IconBtn, Screen, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { DEFAULT_ROWS, todayISO, type ExerciseRow } from '@/lib/challenge';
import { useActiveGroup, useCreateGroup, useGroupAdmin } from '@/lib/data';
import { usePro } from '@/lib/pro';

/**
 * Grubun meydan okuması: başlangıç tarihi ve hareketler.
 * ?newName=… ile açılırsa yeni grup kurar, yoksa aktif grubu düzenler (sadece yönetici).
 */
export default function ChallengeScreen() {
  const t = useStrings();
  const e = t.editor;
  const { newName } = useLocalSearchParams<{ newName?: string }>();
  const creating = !!newName;
  const { membership, isAdmin } = useActiveGroup();
  const pro = usePro();
  const create = useCreateGroup();
  const admin = useGroupAdmin(membership?.group.id);

  const [start, setStart] = useState(() => (creating ? todayISO() : (membership?.group.start_date ?? todayISO())));
  const [rows, setRows] = useState<ExerciseRow[]>(() =>
    creating || !membership?.exercises.length
      ? DEFAULT_ROWS
      : [...membership.exercises].sort((a, b) => a.position - b.position),
  );
  const [error, setError] = useState('');

  if (!creating && (!membership || !isAdmin)) {
    return (
      <Screen>
        <IconBtn name="back" label={t.common.back} onPress={() => router.back()} />
        <Empty title={t.admin.notAdminTitle} text={t.admin.notAdminText} />
      </Screen>
    );
  }

  const started = !creating && membership && membership.group.start_date <= todayISO();
  const busy = create.isPending || admin.saveExercises.isPending || admin.updateGroup.isPending;

  const save = async () => {
    setError('');
    try {
      if (creating) {
        await create.mutateAsync({ name: newName, start, exercises: rows });
        router.replace('/groups');
        return;
      }
      await admin.saveExercises.mutateAsync(rows);
      if (start !== membership?.group.start_date) await admin.updateGroup.mutateAsync({ start_date: start });
      router.back();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Screen bottom={40} gap={18}>
      <IconBtn name="back" label={t.common.back} onPress={() => router.back()} />
      <View>
        <Txt size={32} weight="extrabold" style={{ lineHeight: 38 }}>
          {creating ? newName : t.profile.challenge}
        </Txt>
        <Txt size={15} color={C.sub} style={{ lineHeight: 21 }}>
          {creating ? e.createIntro : e.editIntro}
        </Txt>
      </View>

      <StartDatePicker value={start} onChange={setStart} />
      {started ? (
        <Txt size={13} color={C.gold} style={{ lineHeight: 19 }}>
          {e.startedWarning}
        </Txt>
      ) : null}

      <View style={{ gap: 6 }}>
        <Txt size={20} weight="extrabold">
          {e.exercises(rows.length)}
        </Txt>
        <Txt size={13} color={C.sub} style={{ lineHeight: 19 }}>
          {e.exercisesNote}
        </Txt>
      </View>
      <ExerciseListEditor rows={rows} onChange={setRows} canCustom={pro.isPro} />

      {error ? (
        <Txt size={15} color={C.danger}>
          {error}
        </Txt>
      ) : null}
      <Btn title={creating ? e.create : t.common.save} loading={busy} disabled={!rows.length} onPress={save} />
    </Screen>
  );
}
