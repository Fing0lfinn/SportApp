import { getLang } from '@/i18n';

export const C = {
  bg: '#0B0D10',
  surface: '#16191E',
  surface2: '#1E2228',
  surface3: '#2A2F37',
  line: '#262A31',
  text: '#F4F6F8',
  sub: '#A8B0BB',
  muted: '#8D95A0',
  accent: '#C8F04A',
  accentInk: '#0B0D10',
  gold: '#F2C14E',
  goldBg: '#2B2414',
  meBg: '#1D2416',
  danger: '#FF7A7A',
  dangerFill: '#E5484D',
  orange: '#FF8A3D',
} as const;

export const F = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  extrabold: 'Figtree_800ExtraBold',
  black: 'Figtree_900Black',
} as const;

const WEIGHTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

/** Yazı tipi: Figtree'de Japonca harf yok, Japoncada sistem fontu + kalınlık kullanılır. */
export function font(weight: keyof typeof F) {
  return getLang() === 'ja' ? { fontWeight: WEIGHTS[weight] } : { fontFamily: F[weight] };
}

export const AVATAR_COLORS = ['#C8F04A', '#4AA8FF', '#FF8A3D', '#B58CFF', '#3DD6B0', '#F2C14E'] as const;
