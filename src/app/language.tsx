import { router } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';

import { Icon } from '@/components/icon';
import { styles, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { LANGS, setLang, useLang, useStrings } from '@/i18n';

/** Dil seçimi: telefonun dili varsayılan, buradan değiştirilebilir. */
export default function Language() {
  const t = useStrings();
  const lang = useLang();
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 10 }}>
      <Txt size={24} weight="extrabold" style={{ marginBottom: 6 }}>
        {t.profile.language}
      </Txt>
      {LANGS.map((l) => {
        const on = l.code === lang;
        return (
          <Pressable
            key={l.code}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={async () => {
              router.back();
              await setLang(l.code);
            }}
            style={({ pressed }) => [
              styles.rowBetween,
              {
                backgroundColor: on ? C.meBg : C.surface2,
                borderRadius: 18,
                paddingHorizontal: 18,
                paddingVertical: 16,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}>
            <Txt size={18} weight="bold">
              {l.name}
            </Txt>
            {on ? <Icon name="check" size={22} color={C.accent} stroke={3} /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
