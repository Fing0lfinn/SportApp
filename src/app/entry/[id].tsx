import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { EntryForm, type FormValue } from '@/components/entry-form';
import { Btn, Loading, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { formatDay, type Entry } from '@/lib/challenge';
import { useChallenge, useDeleteEntry, useMyEntries, useUpdateEntry } from '@/lib/data';

export default function EditEntry() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entries = useMyEntries();
  const entry = entries.data?.find((e) => e.id === id);
  if (!entry) return <Loading />;
  return <Editor key={entry.id} entry={entry} />;
}

function Editor({ entry }: { entry: Entry }) {
  const t = useStrings();
  const ch = useChallenge();
  const ex = ch.byKey[entry.exercise];
  const update = useUpdateEntry();
  const remove = useDeleteEntry();
  const [value, setValue] = useState<FormValue>({
    weight: Number(entry.weight),
    reps: entry.reps,
    distance: entry.distance || ex?.distance || 20,
  });
  const [confirm, setConfirm] = useState(false);

  if (!ex) return <Loading />;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 16 }}>
      <Txt size={24} weight="extrabold">
        {t.editEntry.title}
      </Txt>
      <Txt size={16} color={C.sub} style={{ marginTop: -8 }}>
        {ex.name} · {formatDay(entry.performed_on)}
        {entry.is_start ? ` · ${t.editEntry.start}` : ''}
      </Txt>
      <EntryForm ex={ex} value={value} onChange={setValue} />
      {update.error || remove.error ? (
        <Txt size={15} color={C.danger}>
          {(update.error ?? remove.error)?.message}
        </Txt>
      ) : null}
      <Btn
        title={t.editEntry.save}
        loading={update.isPending}
        onPress={async () => {
          await update.mutateAsync({ id: entry.id, ...value });
          router.back();
        }}
      />
      <Btn
        kind={confirm ? 'primary' : 'danger'}
        style={confirm ? { backgroundColor: C.dangerFill } : undefined}
        title={confirm ? t.editEntry.confirmDelete : t.editEntry.delete}
        loading={remove.isPending}
        onPress={async () => {
          if (!confirm) {
            setConfirm(true);
            return;
          }
          await remove.mutateAsync(entry.id);
          router.back();
        }}
      />
    </ScrollView>
  );
}
