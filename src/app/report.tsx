import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { Btn, Field, styles, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { useReport, useSetBlocked, type ReportReason } from '@/lib/safety';

const REASONS: ReportReason[] = ['spam', 'offensive', 'harassment', 'other'];

/** Bir kişiyi ya da kaydını şikayet et; ardından istersen engelle. */
export default function Report() {
  const t = useStrings();
  const s = t.safety;
  const params = useLocalSearchParams<{ user: string; entry?: string; name?: string }>();
  const report = useReport();
  const setBlocked = useSetBlocked();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const [blocked, setBlockedDone] = useState(false);
  const [error, setError] = useState('');

  if (sent) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
        <Animated.View
          entering={ZoomIn.springify().damping(12)}
          style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={44} color={C.accentInk} stroke={3} />
        </Animated.View>
        <Txt size={24} weight="extrabold" style={{ textAlign: 'center' }}>
          {s.sentTitle}
        </Txt>
        <Txt size={15} color={C.sub} style={{ textAlign: 'center', lineHeight: 22 }}>
          {s.sentText}
        </Txt>
        {blocked ? (
          <Txt size={15} weight="bold" color={C.accent}>
            {s.blockedDone}
          </Txt>
        ) : (
          <Btn
            kind="danger"
            icon="block"
            title={s.alsoBlock(params.name || t.common.noName)}
            loading={setBlocked.isPending}
            style={{ alignSelf: 'stretch' }}
            onPress={async () => {
              await setBlocked.mutateAsync({ userId: params.user, blocked: true });
              setBlockedDone(true);
            }}
          />
        )}
        <Btn kind="secondary" title={t.common.close} style={{ alignSelf: 'stretch' }} onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 16 }} keyboardShouldPersistTaps="handled">
      <Txt size={24} weight="extrabold">
        {params.entry ? s.reportEntryTitle : s.reportUserTitle(params.name || t.common.noName)}
      </Txt>
      <Txt size={15} color={C.sub} style={{ lineHeight: 22 }}>
        {s.reportIntro}
      </Txt>
      <View style={{ gap: 8 }}>
        {REASONS.map((r) => {
          const on = r === reason;
          return (
            <Pressable
              key={r}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setReason(r)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: on ? C.meBg : C.surface2,
                  borderColor: on ? C.accent : 'transparent',
                  borderWidth: 2,
                  borderRadius: 16,
                  padding: 14,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}>
              <Txt size={16} weight="bold" style={{ flex: 1 }}>
                {s.reasons[r]}
              </Txt>
              {on ? <Icon name="check" size={20} color={C.accent} stroke={3} /> : null}
            </Pressable>
          );
        })}
      </View>
      <Field
        label={s.details}
        value={details}
        onChangeText={(v) => setDetails(v.slice(0, 500))}
        placeholder={s.detailsPlaceholder}
        multiline
        style={{ height: 110, paddingTop: 16, textAlignVertical: 'top', backgroundColor: C.surface2, fontSize: 16 }}
      />
      {error ? (
        <Txt size={14} color={C.danger}>
          {error}
        </Txt>
      ) : null}
      <Btn
        title={s.send}
        icon="flag"
        disabled={!reason}
        loading={report.isPending}
        onPress={async () => {
          if (!reason) return;
          setError('');
          try {
            await report.mutateAsync({ userId: params.user, entryId: params.entry, reason, details });
            setSent(true);
          } catch {
            setError(s.sendError);
          }
        }}
      />
    </ScrollView>
  );
}
