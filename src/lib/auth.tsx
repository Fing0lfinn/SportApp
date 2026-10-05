import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { strings } from '@/i18n';

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
  const t = strings().auth;
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return t.invalidLogin;
  if (m.includes('already registered')) return t.alreadyRegistered;
  if (m.includes('password should be at least')) return t.shortPassword;
  if (m.includes('email not confirmed')) return t.notConfirmed;
  if (m.includes('unable to validate email') || m.includes('invalid format')) return t.invalidEmail;
  if (m.includes('rate limit')) return t.rateLimit;
  if (m.includes('network')) return t.network;
  return message;
}
