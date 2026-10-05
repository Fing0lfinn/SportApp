import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Confetti } from '@/components/confetti';
import { Icon, type IconName } from '@/components/icon';
import { Btn, styles, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { buyPro, restorePro, usePro } from '@/lib/pro';

/** Pro: tek seferlik satın alma. */
export default function ProScreen() {
  const t = useStrings();
  const p = t.pro;
  const pro = usePro();
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const [msg, setMsg] = useState('');

  const perks: { icon: IconName; title: string; sub: string }[] = [
    { icon: 'close', title: p.perkAds, sub: p.perkAdsSub },
    { icon: 'target', title: p.perkCustom, sub: p.perkCustomSub },
    { icon: 'share', title: p.perkThemes, sub: p.perkThemesSub },
    { icon: 'bolt', title: p.perkSupport, sub: p.perkSupportSub },
  ];

  const run = async (kind: 'buy' | 'restore') => {
    setBusy(kind);
    setMsg('');
    try {
      const ok = kind === 'buy' ? await buyPro() : await restorePro();
      if (!ok && kind === 'restore') setMsg(p.nothingToRestore);
    } catch {
      setMsg(p.error);
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 18 }}>
      {pro.isPro ? <Confetti /> : null}
      <Animated.View
        entering={ZoomIn.duration(450)}
        style={{
          alignSelf: 'center',
          width: 88,
          height: 88,
          borderRadius: 26,
          backgroundColor: C.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon name="star" size={46} color={C.accentInk} stroke={2.4} />
      </Animated.View>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Txt size={30} weight="black" style={{ textAlign: 'center' }}>
          {pro.isPro ? p.activeTitle : p.title}
        </Txt>
        <Txt size={16} color={C.sub} style={{ textAlign: 'center', lineHeight: 23 }}>
          {pro.isPro ? p.activeText : p.subtitle}
        </Txt>
      </View>

      <View style={{ gap: 10 }}>
        {perks.map((k, i) => (
          <Animated.View
            key={k.title}
            entering={FadeInDown.delay(100 + i * 70).duration(400)}
            style={[styles.row, { backgroundColor: C.surface2, borderRadius: 18, padding: 14, gap: 14 }]}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: C.surface3,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon name={k.icon} size={20} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={16} weight="bold">
                {k.title}
              </Txt>
              <Txt size={13} color={C.sub}>
                {k.sub}
              </Txt>
            </View>
            {pro.isPro ? <Icon name="check" size={20} color={C.accent} stroke={3} /> : null}
          </Animated.View>
        ))}
      </View>

      {pro.isPro ? (
        <Btn title={t.common.close} onPress={() => router.back()} />
      ) : Platform.OS === 'web' || !pro.available ? (
        <Txt size={15} weight="semibold" color={C.gold} style={{ textAlign: 'center' }}>
          {pro.ready ? p.soon : t.common.loading}
        </Txt>
      ) : (
        <>
          <Btn
            title={p.buy(pro.price ?? '')}
            icon="star"
            loading={busy === 'buy'}
            disabled={!!busy}
            onPress={() => run('buy')}
          />
          <Txt size={13} color={C.sub} style={{ textAlign: 'center' }}>
            {p.oneTime}
          </Txt>
        </>
      )}
      {!pro.isPro && Platform.OS !== 'web' ? (
        <Btn
          kind="ghost"
          height={44}
          title={p.restore}
          loading={busy === 'restore'}
          disabled={!!busy}
          onPress={() => run('restore')}
        />
      ) : null}
      {msg ? (
        <Txt size={14} color={C.danger} style={{ textAlign: 'center' }}>
          {msg}
        </Txt>
      ) : null}
    </ScrollView>
  );
}
