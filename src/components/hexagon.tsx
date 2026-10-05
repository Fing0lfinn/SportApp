import { View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { C } from '@/constants/theme';

import { Txt } from './ui';

/** Rozet altıgeni: kazanıldıysa altın, değilse gri çerçeve. */
export function Hexagon({ glyph, earned, size = 56 }: { glyph: string; earned: boolean; size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 56 56">
        <Polygon
          points="28,3 51,16 51,40 28,53 5,40 5,16"
          fill={earned ? C.gold : C.surface}
          stroke={earned ? C.gold : '#3A3F48'}
          strokeWidth={2}
        />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Txt size={size * 0.27} weight="black" color={earned ? C.accentInk : C.muted}>
          {glyph}
        </Txt>
      </View>
    </View>
  );
}
