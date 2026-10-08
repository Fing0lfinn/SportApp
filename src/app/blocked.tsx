import { router } from 'expo-router';
import { View } from 'react-native';

import { Avatar, Btn, Empty, IconBtn, Loading, Screen, styles, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { useBlockedProfiles, useBlocks, useSetBlocked } from '@/lib/safety';

/** Engellediğin kişiler; buradan engeli kaldırabilirsin. */
export default function Blocked() {
  const t = useStrings();
  const s = t.safety;
  const blocks = useBlocks();
  const ids = blocks.data ?? [];
  const profiles = useBlockedProfiles(ids);
  const setBlocked = useSetBlocked();

  if (blocks.isLoading) return <Loading />;

  return (
    <Screen bottom={40} gap={14}>
      <IconBtn name="back" label={t.common.back} onPress={() => router.back()} />
      <Txt size={32} weight="extrabold">
        {s.blockedList}
      </Txt>
      <Txt size={15} color={C.sub} style={{ lineHeight: 22 }}>
        {s.blockedListSub}
      </Txt>
      {!ids.length ? <Empty title={s.noBlocked} /> : null}
      {ids.map((id) => {
        const p = profiles.data?.find((x) => x.id === id);
        const name = p?.name || t.common.noName;
        return (
          <View key={id} style={[styles.row, { backgroundColor: C.surface, borderRadius: 18, padding: 14 }]}>
            <Avatar name={name} color={C.muted} size={40} />
            <Txt size={16} weight="bold" style={{ flex: 1 }} numberOfLines={1}>
              {name}
            </Txt>
            <Btn
              kind="secondary"
              height={40}
              title={s.unblock}
              loading={setBlocked.isPending && setBlocked.variables?.userId === id}
              onPress={() => setBlocked.mutate({ userId: id, blocked: false })}
            />
          </View>
        );
      })}
    </Screen>
  );
}
