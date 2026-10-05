import * as Sharing from 'expo-sharing';
import type { ReactNode, RefObject } from 'react';
import { Platform, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { C } from '@/constants/theme';

import { Avatar, Bar, Txt } from './ui';

export const SHARE_THEMES = [
  { key: 'neon', label: 'Neon', bg: C.accent, ink: C.accentInk, pillBg: C.accentInk, pillFg: C.accent, track: 'rgba(11,13,16,0.18)', bar: C.accentInk },
  { key: 'night', label: 'Gece', bg: C.bg, ink: C.text, pillBg: C.accent, pillFg: C.accentInk, track: C.line, bar: C.accent },
  { key: 'gold', label: 'Altın', bg: C.gold, ink: C.accentInk, pillBg: C.accentInk, pillFg: C.gold, track: 'rgba(11,13,16,0.18)', bar: C.accentInk },
] as const;

export type ShareTheme = (typeof SHARE_THEMES)[number];

export const CARD_W = 270;
export const CARD_H = 480;

/** Instagram hikayesi oranında (9:16) paylaşım kartı iskeleti. */
export function CardFrame({
  theme,
  dayNum,
  person,
  children,
}: {
  theme: ShareTheme;
  dayNum: number;
  person: { name: string; color: string; group?: string };
  children: ReactNode;
}) {
  return (
    <View
      collapsable={false}
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: 28,
        backgroundColor: theme.bg,
        padding: 22,
        justifyContent: 'space-between',
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt size={11} weight="black" color={theme.ink} style={{ letterSpacing: 1 }}>
          1 YIL MEYDAN OKUMASI
        </Txt>
        <Txt size={11} weight="black" color={theme.ink} style={{ letterSpacing: 1 }}>
          GÜN {dayNum}
        </Txt>
      </View>
      <View style={{ gap: 8 }}>{children}</View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Avatar name={person.name} color={person.color} size={38} />
        <View style={{ flexShrink: 1 }}>
          <Txt size={15} weight="black" color={theme.ink} numberOfLines={1}>
            {person.name}
          </Txt>
          {person.group ? (
            <Txt size={12} weight="bold" color={theme.ink} numberOfLines={1} style={{ opacity: 0.8 }}>
              {person.group}
            </Txt>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function RecordCardBody({
  theme,
  kicker,
  title,
  value,
  unit,
  sub,
  progress,
  goalText,
}: {
  theme: ShareTheme;
  kicker: string;
  title: string;
  value: string;
  unit: string;
  sub: string;
  progress: number;
  goalText: string;
}) {
  return (
    <>
      <View style={{ alignSelf: 'flex-start', backgroundColor: theme.pillBg, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 }}>
        <Txt size={11} weight="black" color={theme.pillFg} style={{ letterSpacing: 1 }}>
          {kicker}
        </Txt>
      </View>
      <Txt size={26} weight="black" color={theme.ink} style={{ lineHeight: 30 }}>
        {title}
      </Txt>
      <Txt size={76} weight="black" color={theme.ink} style={{ lineHeight: 80, letterSpacing: -2 }}>
        {value}
        <Txt size={22} weight="black" color={theme.ink}>
          {' '}
          {unit}
        </Txt>
      </Txt>
      <Txt size={13} weight="bold" color={theme.ink} style={{ opacity: 0.85 }}>
        {sub}
      </Txt>
      <View style={{ marginTop: 6, gap: 6 }}>
        <Bar value={progress} height={8} color={theme.bar} track={theme.track} delay={250} />
        <Txt size={12} weight="extrabold" color={theme.ink}>
          %{Math.round(Math.min(1, progress) * 100)} · hedef {goalText}
        </Txt>
      </View>
    </>
  );
}

/** Kartı görsel olarak yakalayıp telefonun paylaş menüsünü açar. */
export async function shareCard(ref: RefObject<View | null>) {
  if (Platform.OS === 'web') return false;
  const uri = await captureRef(ref, { format: 'png', quality: 1 });
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Paylaş', UTI: 'public.png' });
  return true;
}
