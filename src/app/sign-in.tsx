import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Field, Txt } from '@/components/ui';
import { C, F } from '@/constants/theme';
import { authErrorText } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const submit = async () => {
    setError('');
    setInfo('');
    if (!email.trim() || password.length < 6) {
      setError('E-posta ve en az 6 karakterlik bir şifre gir.');
      return;
    }
    setBusy(true);
    const creds = { email: email.trim(), password };
    const res = mode === 'signup' ? await supabase.auth.signUp(creds) : await supabase.auth.signInWithPassword(creds);
    setBusy(false);
    if (res.error) setError(authErrorText(res.error.message));
    else if (mode === 'signup' && !res.data.session) {
      setInfo('Hesabın oluştu. E-postana gelen onay linkine tıkla, sonra buradan giriş yap.');
      setMode('signin');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 56,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 24,
          gap: 28,
        }}>
        <View style={{ gap: 2 }}>
          <Animated.Text entering={FadeInDown.delay(100).duration(600)} style={big}>
            1 yıl.
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(250).duration(600)} style={[big, { color: C.accent }]}>
            9 hedef.
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={big}>
            Arkadaşlarınla.
          </Animated.Text>
          <Animated.View entering={FadeIn.delay(600).duration(600)}>
            <Txt size={17} color={C.sub} style={{ marginTop: 14, lineHeight: 25 }}>
              4 Ekim 2026 – 4 Ekim 2027 arasında listeyi kim tamamlayacak? İlerlemeni gir, arkadaşlarınla yarış.
            </Txt>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(700).duration(500)} style={{ gap: 14, marginTop: 'auto' }}>
          <Field
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="ornek@mail.com"
          />
          <Field
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder="En az 6 karakter"
            onSubmitEditing={submit}
          />
          {error ? (
            <Txt size={15} color={C.danger}>
              {error}
            </Txt>
          ) : null}
          {info ? (
            <Txt size={15} color={C.accent}>
              {info}
            </Txt>
          ) : null}
          <Btn title={mode === 'signup' ? 'Hesap oluştur' : 'Giriş yap'} onPress={submit} loading={busy} />
          <Btn
            kind="ghost"
            height={48}
            title={mode === 'signup' ? 'Zaten hesabım var · Giriş yap' : 'Hesabım yok · Kayıt ol'}
            onPress={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup');
              setError('');
            }}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const big = { fontFamily: F.black, fontSize: 48, lineHeight: 52, color: C.text, letterSpacing: -1 };
