import { Switch, View } from 'react-native';

import { C } from '@/constants/theme';

import { styles, Txt } from './ui';

export function ToggleRow({
  title,
  sub,
  value,
  onChange,
  disabled,
}: {
  title: string;
  sub?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.row, { backgroundColor: C.surface, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 }]}>
      <View style={{ flex: 1 }}>
        <Txt size={16} weight="bold">
          {title}
        </Txt>
        {sub ? (
          <Txt size={13} color={C.sub}>
            {sub}
          </Txt>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: '#3A3F48', true: C.accent }}
        thumbColor={C.text}
        ios_backgroundColor="#3A3F48"
      />
    </View>
  );
}
