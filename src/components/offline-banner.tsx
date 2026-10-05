import { useNetInfo } from '@react-native-community/netinfo';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/constants/theme';
import { useOutbox } from '@/lib/data';

import { Txt } from './ui';

/** İnternet yokken ya da gönderilmeyi bekleyen kayıt varken üstte küçük şerit. */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const net = useNetInfo();
  const outbox = useOutbox();
  const pending = outbox.data?.length ?? 0;
  const offline = net.isConnected === false;
  if (!offline && pending === 0) return null;

  const text = offline
    ? pending
      ? `Çevrimdışısın · ${pending} kayıt telefonda bekliyor`
      : 'Çevrimdışısın · kayıtların telefonda saklanır'
    : `${pending} kayıt gönderiliyor…`;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 4, left: 0, right: 0, alignItems: 'center' }}>
      <Animated.View
        entering={FadeInUp.duration(300)}
        exiting={FadeOutUp.duration(250)}
        style={{ backgroundColor: C.goldBg, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 }}>
        <Txt size={13} weight="bold" color={C.gold}>
          {text}
        </Txt>
      </Animated.View>
    </View>
  );
}
