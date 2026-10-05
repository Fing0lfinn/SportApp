import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { supabase } from './supabase';

type AuthState = { session: Session | null; loading: boolean };

const AuthContext = createContext<AuthState>({ session: null, loading: true });

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setState({ session: data.session, loading: false }));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, loading: false });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}

export function useAuth() {
  return use(AuthContext);
}

/** Giriş yapılmış ekranlarda kullanıcı kimliği. */
export function useUserId() {
  const { session } = useAuth();
  return session?.user.id ?? '';
}

/** Supabase hata mesajlarını Türkçeleştirir. */
export function authErrorText(message: string) {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-posta ya da şifre hatalı.';
  if (m.includes('already registered')) return 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.';
  if (m.includes('password should be at least')) return 'Şifre en az 6 karakter olmalı.';
  if (m.includes('email not confirmed')) return 'E-postanı henüz onaylamadın. Gelen kutunu kontrol et.';
  if (m.includes('unable to validate email') || m.includes('invalid format')) return 'Geçerli bir e-posta gir.';
  if (m.includes('rate limit')) return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.';
  if (m.includes('network')) return 'İnternet bağlantısı yok gibi görünüyor.';
  return message;
}
