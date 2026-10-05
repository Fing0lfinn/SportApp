import * as Sharing from 'expo-sharing';
import type { ReactNode, RefObject } from 'react';
import { Platform, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { C } from '@/constants/theme';
import { strings } from '@/i18n';

import { Avatar, Bar, Txt } from './ui';

/** pro: sadece Pro'da açık temalar */
export const SHARE_THEMES = [
  { key: 'neon', pro: false, bg: C.accent, ink: C.accentInk, pillBg: C.accentInk, pillFg: C.accent, track: 'rgba(11,13,16,0.18)', bar: C.accentInk },
  { key: 'night', pro: false, bg: C.bg, ink: C.text, pillBg: C.accent, pillFg: C.accentInk, track: C.line, bar: C.accent },
  { key: 'gold', pro: false, bg: C.gold, ink: C.accentInk, pillBg: C.accentInk, pillFg: C.gold, track: 'rgba(11,13,16,0.18)', bar: C.accentInk },
  { key: 'ocean', pro: true, bg: '#2D6BFF', ink: '#FFFFFF', pillBg: '#FFFFFF', pillFg: '#2D6BFF', track: 'rgba(255,255,255,0.25)', bar: '#FFFFFF' },
  { key: 'rose', pro: true, bg: '#FF5C8A', ink: '#1A0B10', pillBg: '#1A0B10', pillFg: '#FF5C8A', track: 'rgba(26,11,16,0.18)', bar: '#1A0B10' },
  { key: 'paper', pro: true, bg: '#F4F1EA', ink: '#0B0D10', pillBg: '#0B0D10', pillFg: '#F4F1EA', track: 'rgba(11,13,16,0.12)', bar: '#0B0D10' },
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
          {strings().share.brand}
        </Txt>
        <Txt size={11} weight="black" color={theme.ink} style={{ letterSpacing: 1 }}>
          {strings().share.day(dayNum)}
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
          {strings().share.goalLine(Math.round(Math.min(1, progress) * 100), goalText)}
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
  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: strings().common.share, UTI: 'public.png' });
  return true;
}
