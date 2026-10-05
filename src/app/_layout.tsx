import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { Figtree_800ExtraBold } from '@expo-google-fonts/figtree/800ExtraBold';
import { Figtree_900Black } from '@expo-google-fonts/figtree/900Black';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient, useQueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { DarkTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { OfflineBanner } from '@/components/offline-banner';
import { C } from '@/constants/theme';
import { useLang, useLangLoaded } from '@/i18n';
import { initAds } from '@/lib/ads';
import { MONETIZATION } from '@/lib/config';
import { AuthProvider, useAuth, useUserId } from '@/lib/auth';
import { useChallenge, useMyEntries, useProfile, useSyncOutbox, useUpdateProfile } from '@/lib/data';
import { configureNotifications, registerForPush, syncLocalNotifications } from '@/lib/notifications';
import { initPro, setProUser, usePro } from '@/lib/pro';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync();
configureNotifications();
initPro();

const WEEK = 7 * 24 * 60 * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, gcTime: WEEK } },
});

// Son görülen veriler telefonda saklanır: uygulama internetsiz de açılır.
const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'query-cache' });

// İnternet yokken sorgular hata vermek yerine bekler.
onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((s) => setOnline(s.isConnected !== false)));

// Uygulamaya geri dönülünce verileri tazele.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (s) => focusManager.setFocused(s === 'active'));
}

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.bg, primary: C.accent, text: C.text, border: C.line },
};

const sheet = {
  presentation: 'formSheet' as const,
  sheetAllowedDetents: [0.92],
  sheetCornerRadius: 30,
  sheetGrabberVisible: true,
  contentStyle: { backgroundColor: C.surface },
};

export default function RootLayout() {
  const lang = useLang();
  const langLoaded = useLangLoaded();
  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    Figtree_900Black,
  });

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: WEEK, buster: 'v4' }}>
      <AuthProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="light" />
          {/* Dil değişince tüm ekranlar yeni dille yeniden kurulur */}
          <RootStack key={lang} fontsLoaded={fontsLoaded && langLoaded} />
        </ThemeProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

function RootStack({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { session, loading } = useAuth();
  const profile = useProfile();
  const signedIn = !!session;
  const ready = fontsLoaded && !loading && (!signedIn || !profile.isLoading);
  const onboarded = !!profile.data?.onboarded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useLiveUpdates(signedIn);
  useOutboxSync(signedIn);
  useNotificationSetup(signedIn && onboarded);
  useLocaleSync(signedIn);
  useMonetization(signedIn, signedIn && onboarded);

  if (!ready) return null;

  return (
    <>
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.bg },
        animation: 'slide_from_right',
      }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="exercise/[key]" />
        <Stack.Screen name="friend/[id]" />
        <Stack.Screen name="log" options={sheet} />
        <Stack.Screen name="entry/[id]" options={sheet} />
        <Stack.Screen name="groups" options={sheet} />
        <Stack.Screen name="share" options={sheet} />
        <Stack.Screen name="plates" options={sheet} />
        <Stack.Screen name="guide/[key]" options={sheet} />
        <Stack.Screen name="badge/[id]" options={{ ...sheet, sheetAllowedDetents: [0.6] }} />
        <Stack.Screen name="month" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="group-admin" />
        <Stack.Screen name="challenge" />
        <Stack.Screen name="pro" options={sheet} />
        <Stack.Screen name="wrapped" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="final" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      </Stack.Protected>
      {/* Girişten önce de açılabilir; ilk ekran olmasın diye en sonda */}
      <Stack.Screen name="language" options={sheet} />
    </Stack>
    {signedIn && onboarded ? <OfflineBanner /> : null}
    </>
  );
}

/** Gruptan biri kayıt girince ya da beğenince ekranlar kendiliğinden güncellensin. */
function useLiveUpdates(enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel('live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, () => {
        qc.invalidateQueries({ queryKey: ['group'] });
        qc.invalidateQueries({ queryKey: ['entries'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
        qc.invalidateQueries({ queryKey: ['likes'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, () => {
        qc.invalidateQueries({ queryKey: ['group'] });
        qc.invalidateQueries({ queryKey: ['memberships'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_exercises' }, () => {
        qc.invalidateQueries({ queryKey: ['memberships'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, qc]);
}

/** Giriş yapılınca: push jetonunu kaydet, hatırlatmaları kur, bildirime dokununca ilgili ekrana git. */
function useNotificationSetup(enabled: boolean) {
  const entries = useMyEntries();
  const ch = useChallenge();
  const loaded = entries.isSuccess;

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    registerForPush().catch(() => {});
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !loaded || Platform.OS === 'web') return;
    syncLocalNotifications(entries.data ?? [], ch).catch(() => {});
  }, [enabled, loaded, entries.data, ch]);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { exercise?: string } | undefined;
      if (data?.exercise) router.push({ pathname: '/exercise/[key]', params: { key: data.exercise } });
      else router.push('/');
    });
    return () => sub.remove();
  }, [enabled]);
}

/** Arkadaş bildirimleri telefonun dilinde gelsin: seçili dili profile yaz. */
function useLocaleSync(enabled: boolean) {
  const lang = useLang();
  const profile = useProfile();
  const update = useUpdateProfile();
  const current = profile.data?.locale;
  useEffect(() => {
    if (enabled && current && current !== lang) update.mutate({ locale: lang });
    // update her render'da yeni nesne; sadece dil ya da profil değişince çalışsın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, current, lang]);
}

/** Pro hesaba bağlanır; Pro değilse kurulumdan sonra reklamlar başlar. */
function useMonetization(signedIn: boolean, onboarded: boolean) {
  const uid = useUserId();
  const pro = usePro();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    setProUser(signedIn ? uid : null);
  }, [signedIn, uid]);
  useEffect(() => {
    if (!MONETIZATION || Platform.OS === 'web' || !onboarded || !pro.ready || pro.isPro) return;
    initAds();
  }, [onboarded, pro.ready, pro.isPro]);
}

/** Bekleyen kayıtları açılışta, internet gelince ve uygulamaya dönünce gönder. */
function useOutboxSync(enabled: boolean) {
  const sync = useSyncOutbox();
  useEffect(() => {
    if (!enabled) return;
    sync();
    const net = NetInfo.addEventListener((s) => {
      if (s.isConnected) sync();
    });
    const app = AppState.addEventListener('change', (st) => {
      if (st === 'active') sync();
    });
    return () => {
      net();
      app.remove();
    };
  }, [enabled, sync]);
}
