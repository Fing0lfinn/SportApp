import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Chips, Stepper, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { fmt } from '@/lib/challenge';
import { loadBar, plateSummary } from '@/lib/plates';

export default function Plates() {
  const params = useLocalSearchParams<{ weight?: string }>();
  const [total, setTotal] = useState(() => Math.max(20, Number(params.weight) || 100));
  const [bar, setBar] = useState<'20' | '15'>('20');
  const barKg = Number(bar);
  const { plates, perSide, loaded, exact } = loadBar(total, barKg);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 16 }}>
      <Txt size={24} weight="extrabold">
        Plaka hesaplayıcı
      </Txt>
      <Stepper
        title="Toplam ağırlık"
        sub="kg · bar dahil"
        value={fmt(total)}
        onDec={() => setTotal(Math.max(barKg, total - 2.5))}
        onInc={() => setTotal(Math.min(400, total + 2.5))}
      />
      <Chips
        items={[
          { key: '20', label: '20 kg bar' },
          { key: '15', label: '15 kg bar' },
        ]}
        value={bar}
        onChange={(b) => {
          setBar(b);
          setTotal(Math.max(Number(b), total));
        }}
      />

      <View
        accessible
        accessibilityLabel={`Her tarafa ${plateSummary(plates) || 'plaka yok'}`}
        style={{ height: 180, backgroundColor: C.surface2, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 14, right: 14, height: 10, borderRadius: 5, backgroundColor: '#5A616C' }} />
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 2 }}>
          {plates.map((p, i) => (
            <Animated.View
              key={`l${i}-${p.kg}`}
              entering={ZoomIn.delay(i * 50).duration(300)}
              style={{ width: p.width, height: p.height, borderRadius: 4, backgroundColor: p.color }}
            />
          ))}
        </View>
        <View style={{ width: 84, height: 16, borderRadius: 4, backgroundColor: C.muted, marginHorizontal: 6 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          {plates.map((p, i) => (
            <Animated.View
              key={`r${i}-${p.kg}`}
              entering={ZoomIn.delay(i * 50).duration(300)}
              style={{ width: p.width, height: p.height, borderRadius: 4, backgroundColor: p.color }}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <Txt size={14} color={C.sub}>
          Her iki tarafa
        </Txt>
        <Txt size={26} weight="black">
          {plates.length ? plateSummary(plates) : 'Sadece bar'}
        </Txt>
        <Txt size={14} color={C.sub}>
          {exact
            ? `Bar ${barKg} kg, her tarafa ${fmt(perSide)} kg.`
            : `Tam denk gelmiyor, en yakın ${fmt(loaded)} kg yüklenebilir.`}
        </Txt>
      </View>
    </ScrollView>
  );
}
