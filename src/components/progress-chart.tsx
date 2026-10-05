import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

import { C, F } from '@/constants/theme';
import { dayIndex, fmt, todayIndex, TOTAL_DAYS, valueOf, type Entry, type Exercise } from '@/lib/challenge';

const H = 176;
const TOP = 22;
const BOTTOM = 150;
const LEFT = 34;
const RIGHT = 8;
const MONTHS = [
  { day: 0, label: 'Eki', anchor: 'start' },
  { day: 89, label: 'Oca', anchor: 'middle' },
  { day: 179, label: 'Nis', anchor: 'middle' },
  { day: 270, label: 'Tem', anchor: 'middle' },
  { day: 365, label: 'Eki', anchor: 'end' },
] as const;

/** Yıl boyunca kayıtlar, başlangıçtan hedefe düz tempo çizgisi ve hedef çizgisi. */
export function ProgressChart({ ex, entries, start }: { ex: Exercise; entries: Entry[]; start: number }) {
  const [w, setW] = useState(0);
  const vals = entries.map((e) => valueOf(ex, e));
  let lo = Math.min(start, ex.goal, ...vals);
  let hi = Math.max(ex.goal, ...vals);
  const pad = Math.max((hi - lo) * 0.15, ex.step * 2);
  lo = Math.max(0, lo - pad);
  hi = hi + pad * 0.4;

  const x1 = w - RIGHT;
  const X = (d: number) => LEFT + (Math.max(0, Math.min(TOTAL_DAYS, d)) / TOTAL_DAYS) * (x1 - LEFT);
  const Y = (v: number) => TOP + ((hi - v) / (hi - lo)) * (BOTTOM - TOP);
  const pts = entries.map((e) => `${X(dayIndex(e.performed_on)).toFixed(1)} ${Y(valueOf(ex, e)).toFixed(1)}`);
  const goalY = Y(ex.goal);
  const startDay = entries.length ? dayIndex(entries[0].performed_on) : 0;
  const todayX = X(todayIndex());

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={`${ex.name} gelişim grafiği: başlangıç ${fmt(start)}, hedef ${ex.goal}`}
      style={{ height: H }}>
      {w > 0 ? (
        <Svg width={w} height={H}>
          <Line x1={LEFT} y1={BOTTOM} x2={x1} y2={BOTTOM} stroke={C.line} strokeWidth={1} />
          <Line x1={LEFT} y1={goalY} x2={x1} y2={goalY} stroke={C.gold} strokeWidth={1.5} strokeDasharray="2 4" />
          <SvgText x={x1} y={goalY - 6} fill={C.gold} fontSize={12} fontFamily={F.extrabold} textAnchor="end">
            {`Hedef ${fmt(ex.goal)}`}
          </SvgText>
          <SvgText x={LEFT - 4} y={Y(start) + 4} fill={C.sub} fontSize={11} fontFamily={F.medium} textAnchor="end">
            {fmt(start)}
          </SvgText>
          <Line
            x1={X(startDay)}
            y1={Y(start)}
            x2={X(TOTAL_DAYS)}
            y2={goalY}
            stroke={C.muted}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Line x1={todayX} y1={12} x2={todayX} y2={BOTTOM} stroke="#3A3F48" strokeWidth={1} />
          {pts.length > 1 ? (
            <Path
              d={`M${pts.join(' L')}`}
              stroke={C.accent}
              strokeWidth={2.5}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}
          {pts.length ? (
            <>
              <Path d={pts.map((p) => `M${p}h0`).join('')} stroke={C.surface} strokeWidth={12} strokeLinecap="round" />
              <Path d={pts.map((p) => `M${p}h0`).join('')} stroke={C.accent} strokeWidth={8} strokeLinecap="round" />
            </>
          ) : null}
          {MONTHS.map((m) => (
            <SvgText
              key={m.day}
              x={X(m.day)}
              y={170}
              fill={C.sub}
              fontSize={11}
              fontFamily={F.medium}
              textAnchor={m.anchor}>
              {m.label}
            </SvgText>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}
