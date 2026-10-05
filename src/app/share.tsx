import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { CardFrame, RecordCardBody, SHARE_THEMES, shareCard } from '@/components/share-card';
import { Btn, Chips, Loading, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { EXERCISE_BY_KEY, fmt, todayIndex, type ExerciseKey } from '@/lib/challenge';
import { useActiveGroup, useMyStats, useProfile } from '@/lib/data';

/** Rekor / hedef kartı: tema seç, telefonun paylaş menüsüyle gönder. */
export default function Share() {
  const { exercise, kicker } = useLocalSearchParams<{ exercise: ExerciseKey; kicker?: string }>();
  const profile = useProfile();
  const mine = useMyStats();
  const { group } = useActiveGroup();
  const [themeKey, setThemeKey] = useState<(typeof SHARE_THEMES)[number]['key']>('neon');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const ref = useRef<View>(null);

  const ex = EXERCISE_BY_KEY[exercise];
  if (!ex || !profile.data || mine.isLoading) return <Loading />;

  const st = mine.stats.byExercise[ex.key];
  const gain = st.best - st.start;
  const theme = SHARE_THEMES.find((t) => t.key === themeKey) ?? SHARE_THEMES[0];

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 16, alignItems: 'center' }}>
      <Txt size={24} weight="extrabold" style={{ alignSelf: 'flex-start' }}>
        Paylaş
      </Txt>
      <Animated.View entering={ZoomIn.duration(450)} ref={ref} collapsable={false}>
        <CardFrame
          theme={theme}
          dayNum={todayIndex() + 1}
          person={{ name: profile.data.name, color: profile.data.color, group: group?.name }}>
          <RecordCardBody
            theme={theme}
            kicker={kicker || (st.best >= ex.goal ? 'HEDEF TAMAM' : 'EN İYİ')}
            title={ex.name}
            value={fmt(st.best)}
            unit={ex.unit}
            sub={`${ex.perHand ? 'Her elde · ' : ''}${gain > 0 ? `Başlangıçtan beri +${fmt(gain)} ${ex.unit}` : 'Başlangıç ölçümü'}`}
            progress={st.best / ex.goal}
            goalText={`${ex.goal} ${ex.unit}`}
          />
        </CardFrame>
      </Animated.View>
      <View style={{ alignSelf: 'stretch' }}>
        <Chips
          items={SHARE_THEMES.map((t) => ({ key: t.key, label: t.label }))}
          value={themeKey}
          onChange={setThemeKey}
        />
      </View>
      <Btn
        title="Paylaş"
        icon="share"
        loading={busy}
        style={{ alignSelf: 'stretch' }}
        onPress={async () => {
          setBusy(true);
          setNote('');
          try {
            const ok = await shareCard(ref);
            if (!ok) setNote(Platform.OS === 'web' ? 'Paylaşım telefonda çalışır.' : 'Bu cihazda paylaşım açılamadı.');
          } catch (e) {
            setNote((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
      <Txt size={14} color={C.sub} style={{ textAlign: 'center' }}>
        {note || 'Açılan menüden Instagram hikayesi, WhatsApp ya da Fotoğraflar\'a kaydet seçebilirsin.'}
      </Txt>
    </ScrollView>
  );
}
