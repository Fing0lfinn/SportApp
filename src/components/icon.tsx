import Svg, { Path } from 'react-native-svg';

const PATHS = {
  home: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  board: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  feed: 'M3 12h4l3-8 4 16 3-8h4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c.9-4 4-6 8-6s7.1 2 8 6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  back: 'M15 18l-6-6 6-6',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  close: 'M6 6l12 12M18 6L6 18',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  share: 'M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
  copy: 'M8 8h12v12H8zM16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 22,
  color = '#F4F6F8',
  stroke = 2.2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={PATHS[name]} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function FlameIcon({ size = 18, color = '#FF8A3D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12 2c1.2 3.4 4.8 5.6 4.8 10.2A4.8 4.8 0 0 1 12 17a4.8 4.8 0 0 1-4.8-4.8c0-2 1-3.4 2.2-4.4.1 1.9 1.1 3.1 2.3 3.1 0-3.2-.9-5.4.3-8.9zM12 22a6 6 0 0 1-6-5.4A6.6 6.6 0 0 0 12 20a6.6 6.6 0 0 0 6-3.4A6 6 0 0 1 12 22z"
      />
    </Svg>
  );
}
