import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { CardFrame, RecordCardBody, SHARE_THEMES, shareCard } from '@/components/share-card';
import { Btn, Chips, Loading, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { exStats, fmtShort, fmtValue, todayIndex, unitOf } from '@/lib/challenge';
import { useActiveGroup, useMyStats, useProfile } from '@/lib/data';
import { usePro } from '@/lib/pro';

/** Rekor / hedef kartı: tema seç, telefonun paylaş menüsüyle gönder. */
export default function Share() {
  const t = useStrings();
  const { exercise, kicker } = useLocalSearchParams<{ exercise: string; kicker?: string }>();
  const profile = useProfile();
  const mine = useMyStats();
  const pro = usePro();
  const { group } = useActiveGroup();
  const [themeKey, setThemeKey] = useState<(typeof SHARE_THEMES)[number]['key']>('neon');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const ref = useRef<View>(null);

  const ch = mine.challenge;
  const ex = ch.byKey[exercise];
  if (!ex || !profile.data || mine.isLoading) return <Loading />;

  const st = exStats(mine.stats, ex.key);
  const gain = st.best - st.start;
  const theme = SHARE_THEMES.find((x) => x.key === themeKey) ?? SHARE_THEMES[0];
  const locked = theme.pro && !pro.isPro;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 16, alignItems: 'center' }}>
      <Txt size={24} weight="extrabold" style={{ alignSelf: 'flex-start' }}>
        {t.common.share}
      </Txt>
      <Animated.View entering={ZoomIn.duration(450)} ref={ref} collapsable={false}>
        <CardFrame
          theme={theme}
          dayNum={todayIndex(ch.start) + 1}
          person={{ name: profile.data.name, color: profile.data.color, group: group?.name }}>
          <RecordCardBody
            theme={theme}
            kicker={kicker || (st.best >= ex.goal ? t.feed.badgeGoal : t.share.best)}
            title={ex.name}
            value={fmtShort(ex, st.best)}
            unit={unitOf(ex, st.best)}
            sub={`${ex.perHand ? `${t.entry.perHand} · ` : ''}${gain > 0 ? t.share.sinceStart(`${fmtShort(ex, gain)} ${unitOf(ex, gain)}`.trim()) : t.entry.start}`}
            progress={st.best / ex.goal}
            goalText={fmtValue(ex, ex.goal)}
          />
        </CardFrame>
      </Animated.View>
      <View style={{ alignSelf: 'stretch' }}>
        <Chips
          items={SHARE_THEMES.map((x) => ({
            key: x.key,
            label: `${t.share.themes[x.key]}${x.pro && !pro.isPro ? ' · Pro' : ''}`,
          }))}
          value={themeKey}
          onChange={setThemeKey}
        />
      </View>
      {locked ? (
        <Btn title={t.share.unlock} icon="star" style={{ alignSelf: 'stretch' }} onPress={() => router.push('/pro')} />
      ) : (
        <Btn
          title={t.common.share}
          icon="share"
          loading={busy}
          style={{ alignSelf: 'stretch' }}
          onPress={async () => {
            setBusy(true);
            setNote('');
            try {
              const ok = await shareCard(ref);
              if (!ok) setNote(Platform.OS === 'web' ? t.share.webOnly : t.share.unavailable);
            } catch (e) {
              setNote((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      )}
      <Txt size={14} color={C.sub} style={{ textAlign: 'center' }}>
        {note || t.share.hint}
      </Txt>
    </ScrollView>
  );
}
