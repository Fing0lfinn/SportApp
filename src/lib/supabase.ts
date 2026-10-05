import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';

// Publishable anahtar uygulamaya gömülmek için tasarlandı; verileri RLS kuralları korur.
// Başka bir projeye geçmek için .env dosyasında EXPO_PUBLIC_SUPABASE_* değişkenlerini ver.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://zjarkghlkoflhijlpleo.supabase.co';
const SUPABASE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_K9Rbi1X1pHYc4p17nqBVgg_cGbPuvra';

const isSSR = Platform.OS === 'web' && typeof window === 'undefined';

const storage = {
  getItem: (key: string) => (isSSR ? Promise.resolve(null) : AsyncStorage.getItem(key)),
  setItem: (key: string, value: string) => (isSSR ? Promise.resolve() : AsyncStorage.setItem(key, value)),
  removeItem: (key: string) => (isSSR ? Promise.resolve() : AsyncStorage.removeItem(key)),
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Google girişi tarayıcıdan ?code= ile döner, kod telefonda oturuma çevrilir.
    flowType: 'pkce',
  },
});

// Uygulama ön plandayken oturumu tazele, arka plandayken dur.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
