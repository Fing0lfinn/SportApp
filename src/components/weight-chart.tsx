import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { C, F } from '@/constants/theme';
import { dayIndex, fmt, formatDay } from '@/lib/challenge';

const H = 180;
const TOP = 18;
const BOTTOM = 152;
const LEFT = 36;
const RIGHT = 10;

/** Kilo ölçümleri zaman içinde; varsa hedef kilo kesikli çizgi. */
export function WeightChart({
  points,
  target,
}: {
  points: { day: string; weight: number }[];
  target?: number | null;
}) {
  const [w, setW] = useState(0);
  if (!points.length) return null;

  const first = points[0].day;
  const span = Math.max(1, dayIndex(points[points.length - 1].day, first));
  const values = points.map((p) => p.weight).concat(target ? [target] : []);
  let lo = Math.floor(Math.min(...values) - 1);
  let hi = Math.ceil(Math.max(...values) + 1);
  if (hi - lo < 4) {
    lo -= 2;
    hi += 2;
  }
  const x = (day: string) => LEFT + ((w - LEFT - RIGHT) * dayIndex(day, first)) / span;
  const y = (v: number) => TOP + ((BOTTOM - TOP) * (hi - v)) / (hi - lo);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)},${y(p.weight).toFixed(1)}`).join(' ');

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: H }}>
      {w > 0 ? (
        <Svg width={w} height={H}>
          {[hi, (hi + lo) / 2, lo].map((v) => (
            <SvgText key={v} x={0} y={y(v) + 4} fill={C.muted} fontSize={11} fontFamily={F.semibold}>
              {fmt(Math.round(v * 10) / 10)}
            </SvgText>
          ))}
          <Line x1={LEFT} x2={w - RIGHT} y1={BOTTOM} y2={BOTTOM} stroke={C.line} strokeWidth={1} />
          {target ? (
            <Line
              x1={LEFT}
              x2={w - RIGHT}
              y1={y(target)}
              y2={y(target)}
              stroke={C.gold}
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
          ) : null}
          {points.length > 1 ? (
            <Path d={path} stroke={C.accent} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          ) : null}
          {points.map((p, i) => (
            <Circle key={`${p.day}-${i}`} cx={x(p.day)} cy={y(p.weight)} r={points.length > 40 ? 2 : 3.5} fill={C.accent} />
          ))}
          <SvgText x={LEFT} y={H - 6} fill={C.muted} fontSize={11} fontFamily={F.semibold}>
            {formatDay(first)}
          </SvgText>
          {points.length > 1 ? (
            <SvgText x={w - RIGHT} y={H - 6} fill={C.muted} fontSize={11} fontFamily={F.semibold} textAnchor="end">
              {formatDay(points[points.length - 1].day)}
            </SvgText>
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}
