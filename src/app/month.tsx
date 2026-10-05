import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { CardFrame, SHARE_THEMES, shareCard } from '@/components/share-card';
import { Btn, Chips, IconBtn, Loading, Screen, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { fmt, todayIndex } from '@/lib/challenge';
import { useActiveGroup, useMyStats, useProfile } from '@/lib/data';
import { monthRanges, monthSummary } from '@/lib/month';

export default function Month() {
  const profile = useProfile();
  const mine = useMyStats();
  const { group } = useActiveGroup();
  const ranges = monthRanges();
  // Ayın ilk günlerindeysek geçen ay daha anlamlı
  const [idx, setIdx] = useState(String(Math.max(0, ranges.length - (ranges.length > 1 && todayIndex() - ranges[ranges.length - 1].from < 7 ? 2 : 1))));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const ref = useRef<View>(null);

  if (mine.isLoading || !profile.data) return <Loading />;
  const r = ranges[Number(idx)] ?? ranges[ranges.length - 1];
  const sum = monthSummary(mine.stats, r);
  const theme = SHARE_THEMES[0];

  const stats = [
    { v: String(sum.entries), l: 'kayıt' },
    { v: String(sum.records), l: 'rekor' },
    { v: String(sum.milestones), l: 'ara hedef' },
    { v: `+${sum.xp}`, l: 'XP' },
  ];

  return (
    <Screen bottom={40}>
      <IconBtn name="back" label="Geri" onPress={() => router.back()} />
      <Txt size={32} weight="extrabold">
        Aylık özet
      </Txt>
      <Chips items={ranges.map((m, i) => ({ key: String(i), label: m.short }))} value={idx} onChange={setIdx} />

      <View style={{ alignItems: 'center' }}>
        <Animated.View key={idx} entering={ZoomIn.duration(400)} ref={ref} collapsable={false}>
          <CardFrame
            theme={theme}
            dayNum={todayIndex() + 1}
            person={{ name: profile.data.name, color: profile.data.color, group: group?.name }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt size={12} weight="black" color={theme.ink} style={{ letterSpacing: 1 }}>
                AYLIK ÖZET
              </Txt>
              <Txt size={12} weight="bold" color={theme.ink}>
                {r.ongoing ? 'devam ediyor' : 'tamamlandı'}
              </Txt>
            </View>
            <Txt size={36} weight="black" color={theme.ink} style={{ lineHeight: 40 }}>
              {r.title}
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {stats.map((s) => (
                <View key={s.l} style={{ width: '48%', backgroundColor: 'rgba(11,13,16,0.1)', borderRadius: 16, padding: 12 }}>
                  <Txt size={28} weight="black" color={theme.ink} style={{ lineHeight: 32 }}>
                    {s.v}
                  </Txt>
                  <Txt size={13} weight="bold" color={theme.ink}>
                    {s.l}
                  </Txt>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: C.bg, borderRadius: 16, padding: 12 }}>
              <Txt size={12} weight="bold" color={C.sub}>
                En çok gelişen
              </Txt>
              <Txt size={18} weight="black">
                {sum.best ? `${sum.best.name} +${fmt(sum.best.gain)} ${sum.best.unit}` : 'Henüz rekor yok'}
              </Txt>
            </View>
          </CardFrame>
        </Animated.View>
      </View>

      <Btn
        title="Paylaş"
        icon="share"
        loading={busy}
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
      {note ? (
        <Txt size={14} color={C.sub} style={{ textAlign: 'center' }}>
          {note}
        </Txt>
      ) : null}
    </Screen>
  );
}
