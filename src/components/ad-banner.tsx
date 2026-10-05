import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { C } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { useAdsReady } from '@/lib/ads';
import { ADMOB_BANNER } from '@/lib/config';
import { usePro } from '@/lib/pro';

import { Txt } from './ui';

/** Liste sonunda küçük reklam; Pro'da ve reklam yüklenemezse hiç görünmez. */
export function AdBanner() {
  const t = useStrings();
  const ready = useAdsReady();
  const pro = usePro();
  const [failed, setFailed] = useState(false);
  if (!ready || pro.isPro || failed) return null;
  const real = Platform.OS === 'ios' ? ADMOB_BANNER.ios : ADMOB_BANNER.android;
  const unitId = __DEV__ || !real ? TestIds.ADAPTIVE_BANNER : real;
  return (
    <View style={{ alignItems: 'center', gap: 6, marginTop: 4 }}>
      <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} onAdFailedToLoad={() => setFailed(true)} />
      <Pressable accessibilityRole="button" onPress={() => router.push('/pro')} hitSlop={8}>
        <Txt size={12} weight="bold" color={C.sub}>
          {t.pro.removeAds}
        </Txt>
      </Pressable>
    </View>
  );
}
