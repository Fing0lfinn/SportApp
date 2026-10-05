import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

// Web'de açılan pencere geri döndüğünde oturumu tamamlar; telefonda etkisizdir.
WebBrowser.maybeCompleteAuthSession();

/** Kullanıcı pencereyi kapattıysa false, giriş yapıldıysa true döner; hata olursa fırlatır. */
export async function signInWithApple() {
  // Apple'a nonce'un özeti, Supabase'e kendisi gider; Supabase ikisini eşleştirir.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return false;
    throw e;
  }
  if (!credential.identityToken) throw new Error('Apple kimlik bilgisi gelmedi. Tekrar dene.');

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;

  // Apple adı sadece ilk girişte verir; kurulumda hazır gelsin diye sakla.
  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
  if (fullName) await supabase.auth.updateUser({ data: { full_name: fullName } });
  return true;
}

export async function signInWithGoogle() {
  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;

  const params = urlParams(result.url);
  if (params.error_description || params.error) throw new Error(params.error_description || params.error);
  if (params.code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
    if (exchangeError) throw exchangeError;
    return true;
  }
  if (params.access_token && params.refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) throw sessionError;
    return true;
  }
  throw new Error('Google girişi tamamlanamadı. Tekrar dene.');
}

/** Hem ?sorgu hem #parça parametrelerini okur (özel şemalı adreslerde URL sınıfına güvenmeden). */
function urlParams(url: string) {
  const out: Record<string, string> = {};
  const query = url.split(/[?#]/).slice(1).join('&');
  for (const pair of query.split('&')) {
    if (!pair) continue;
    const [key, value = ''] = pair.split('=');
    out[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
  }
  return out;
}

/** Giriş sağlayıcısından gelen ad (Google: full_name/name, Apple: ilk girişte sakladığımız full_name). */
export function providerName(meta: Record<string, unknown> | undefined) {
  const name = meta?.full_name ?? meta?.name;
  return typeof name === 'string' ? name.trim().slice(0, 24) : '';
}
