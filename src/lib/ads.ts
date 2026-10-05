import {
  getTrackingPermissionsAsync,
  PermissionStatus,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import mobileAds, { AdsConsent } from 'react-native-google-mobile-ads';

// Reklamlar: önce Avrupa için onay formu (Google UMP), iPhone'da izleme izni, sonra SDK başlar.
// Pro kullanıcıda hiç başlatılmaz.

let ready = false;
let started = false;
const listeners = new Set<() => void>();

export async function initAds() {
  if (started) return;
  started = true;
  let canRequest = true;
  try {
    await AdsConsent.requestInfoUpdate();
    const info = await AdsConsent.loadAndShowConsentFormIfRequired();
    canRequest = info.canRequestAds;
  } catch {
    // onay formu ayarlanmamışsa (AdMob → Gizlilik ve mesajlar) kişiselleştirilmemiş reklamla devam
  }
  if (!canRequest) return;
  if (Platform.OS === 'ios') {
    try {
      const current = await getTrackingPermissionsAsync();
      if (current.status === PermissionStatus.UNDETERMINED && current.canAskAgain) {
        await requestTrackingPermissionsAsync();
      }
    } catch {}
  }
  try {
    await mobileAds().initialize();
    ready = true;
    listeners.forEach((l) => l());
  } catch {}
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAdsReady() {
  return useSyncExternalStore(
    subscribe,
    () => ready,
    () => ready,
  );
}
