import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { Figtree_800ExtraBold } from '@expo-google-fonts/figtree/800ExtraBold';
import { Figtree_900Black } from '@expo-google-fonts/figtree/900Black';
import { focusManager, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { DarkTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { C } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useMyEntries, useProfile } from '@/lib/data';
import { configureNotifications, registerForPush, syncLocalNotifications } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync();
configureNotifications();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

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
  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
    Figtree_900Black,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="light" />
          <RootStack fontsLoaded={fontsLoaded} />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
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
  useNotificationSetup(signedIn && onboarded);

  if (!ready) return null;

  return (
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
      </Stack.Protected>
    </Stack>
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
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, qc]);
}

/** Giriş yapılınca: push jetonunu kaydet, hatırlatmaları kur, bildirime dokununca ilgili ekrana git. */
function useNotificationSetup(enabled: boolean) {
  const entries = useMyEntries();
  const loaded = entries.isSuccess;

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    registerForPush().catch(() => {});
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !loaded || Platform.OS === 'web') return;
    syncLocalNotifications(entries.data ?? []).catch(() => {});
  }, [enabled, loaded, entries.data]);

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
