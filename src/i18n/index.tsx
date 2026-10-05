import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { useSyncExternalStore } from 'react';

import { de } from './de';
import { en } from './en';
import { es } from './es';
import { ja } from './ja';
import { tr, type Dict } from './tr';

export type { Dict };
export type Lang = 'tr' | 'en' | 'ja' | 'es' | 'de';

export const LANGS: { code: Lang; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'ja', name: '日本語' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' },
];

const DICTS: Record<Lang, Dict> = { tr, en, ja, es, de };
const STORAGE_KEY = 'lang';

function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && v in DICTS;
}

/** Telefonun dili destekleniyorsa o, değilse İngilizce. */
export function deviceLang(): Lang {
  try {
    for (const l of getLocales()) {
      if (isLang(l.languageCode)) return l.languageCode;
    }
  } catch {}
  return 'en';
}

let current: Lang = deviceLang();
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Kullanıcının seçtiği dil (yoksa telefonun dili) açılışta bir kez okunur. */
export const langReady = AsyncStorage.getItem(STORAGE_KEY)
  .then((saved) => {
    if (isLang(saved)) current = saved;
  })
  .catch(() => {})
  .finally(() => {
    loaded = true;
    emit();
  });

export function getLang() {
  return current;
}

/** React dışındaki kod için (bildirimler, hesaplar). */
export function strings(): Dict {
  return DICTS[current];
}

export async function setLang(lang: Lang) {
  current = lang;
  emit();
  await AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {});
}

export function useLang() {
  return useSyncExternalStore(subscribe, getLang, getLang);
}

export function useLangLoaded() {
  return useSyncExternalStore(
    subscribe,
    () => loaded,
    () => loaded,
  );
}

export function useStrings(): Dict {
  return DICTS[useLang()];
}
