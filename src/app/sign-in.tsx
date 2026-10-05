import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Icon } from '@/components/icon';
import { Btn, Field, Txt } from '@/components/ui';
import { C, font } from '@/constants/theme';
import { LANGS, useLang, useStrings } from '@/i18n';
import { authErrorText } from '@/lib/auth';
import { signInWithApple, signInWithGoogle } from '@/lib/social-auth';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const t = useStrings().auth;
  const lang = useLang();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [social, setSocial] = useState<'apple' | 'google' | null>(null);

  useEffect(() => {
    if (Platform.OS === 'ios') AppleAuthentication.isAvailableAsync().then(setAppleAvailable, () => {});
  }, []);

  const socialSignIn = async (provider: 'apple' | 'google') => {
    setError('');
    setInfo('');
    setSocial(provider);
    try {
      await (provider === 'apple' ? signInWithApple() : signInWithGoogle());
    } catch (e) {
      setError(authErrorText(e instanceof Error ? e.message : String(e)));
    } finally {
      setSocial(null);
    }
  };

  const submit = async () => {
    setError('');
    setInfo('');
    if (!email.trim() || password.length < 6) {
      setError(t.missing);
      return;
    }
    setBusy(true);
    const creds = { email: email.trim(), password };
    const res = mode === 'signup' ? await supabase.auth.signUp(creds) : await supabase.auth.signInWithPassword(creds);
    setBusy(false);
    if (res.error) setError(authErrorText(res.error.message));
    else if (mode === 'signup' && !res.data.session) {
      setInfo(t.confirmSent);
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.language}
          onPress={() => router.push('/language')}
          style={({ pressed }) => ({
            position: 'absolute',
            top: insets.top + 8,
            right: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            height: 40,
            paddingHorizontal: 14,
            borderRadius: 20,
            backgroundColor: C.surface,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}>
          <Icon name="globe" size={18} color={C.sub} />
          <Txt size={14} weight="bold" color={C.sub}>
            {LANGS.find((l) => l.code === lang)?.name}
          </Txt>
        </Pressable>
        <View style={{ gap: 2 }}>
          <Animated.Text entering={FadeInDown.delay(100).duration(600)} style={big}>
            {t.hero1}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(250).duration(600)} style={[big, { color: C.accent }]}>
            {t.hero2}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={big}>
            {t.hero3}
          </Animated.Text>
          <Animated.View entering={FadeIn.delay(600).duration(600)}>
            <Txt size={17} color={C.sub} style={{ marginTop: 14, lineHeight: 25 }}>
              {t.intro}
            </Txt>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(700).duration(500)} style={{ gap: 14, marginTop: 'auto' }}>
          {appleAvailable ? (
            <View style={{ height: 56, opacity: social ? 0.6 : 1 }} pointerEvents={social ? 'none' : 'auto'}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={18}
                style={{ flex: 1 }}
                onPress={() => socialSignIn('apple')}
              />
            </View>
          ) : null}
          <GoogleButton busy={social === 'google'} disabled={!!social} onPress={() => socialSignIn('google')} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
            <Txt size={14} color={C.sub}>
              {t.orEmail}
            </Txt>
            <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
          </View>
          <Field
            label={t.email}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder={t.emailPlaceholder}
          />
          <Field
            label={t.password}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder={t.passwordPlaceholder}
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
          <Btn title={mode === 'signup' ? t.signUp : t.signIn} onPress={submit} loading={busy} />
          <Btn
            kind="ghost"
            height={48}
            title={mode === 'signup' ? t.haveAccount : t.noAccount}
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

function GoogleButton({ busy, disabled, onPress }: { busy: boolean; disabled: boolean; onPress: () => void }) {
  const t = useStrings().auth;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.google}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 18,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.line,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        opacity: disabled && !busy ? 0.6 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}>
      {busy ? (
        <ActivityIndicator color={C.text} />
      ) : (
        <>
          <Svg width={20} height={20} viewBox="0 0 48 48">
            <Path
              fill="#FFC107"
              d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
            />
            <Path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <Path
              fill="#4CAF50"
              d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
            />
            <Path
              fill="#1976D2"
              d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
            />
          </Svg>
          <Txt size={17} weight="extrabold">
            {t.google}
          </Txt>
        </>
      )}
    </Pressable>
  );
}

const big = { ...font('black'), fontSize: 48, lineHeight: 52, color: C.text, letterSpacing: -1 };
