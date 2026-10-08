import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { strings } from '@/i18n';

import { todayISO } from './challenge';
import { useDailyTargets } from './health';
import { hasPermission } from './notifications';
import { useWater } from './nutrition';

// Su hatırlatmaları telefonda kurulur (sunucu gerekmez): 09:00–21:00 arası seçilen aralıklarla.
// Bugünün hedefi tamamlanınca bugünün kalan hatırlatmaları iptal edilir.
// iOS en fazla 64 bekleyen bildirim tutar; bu yüzden birkaç günlük kurulur ve uygulama her açıldığında yenilenir.

export type WaterPrefs = { enabled: boolean; every: 1 | 2 | 3 };

const PREFS_KEY = 'notif:water';
const PREFIX = 'water-';
const START_HOUR = 9;
const END_HOUR = 21;
/** Su hatırlatmalarına ayrılan en fazla bildirim sayısı (diğer hatırlatmalara yer kalsın) */
const BUDGET = 40;

export async function getWaterPrefs(): Promise<WaterPrefs> {
  const raw = await AsyncStorage.getItem(PREFS_KEY);
  return { enabled: true, every: 2, ...(raw ? JSON.parse(raw) : {}) };
}

export async function setWaterPrefs(prefs: WaterPrefs) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function reminderHours(every: number) {
  const hours: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h += every) hours.push(h);
  return hours;
}

/** Su hatırlatmalarını bugünkü duruma göre yeniden kurar. */
export async function syncWaterReminders(todayTotal: number, goal: number) {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );
  const prefs = await getWaterPrefs();
  if (!prefs.enabled || !(await hasPermission())) return;

  const t = strings().water;
  const hours = reminderHours(prefs.every);
  const days = Math.max(2, Math.min(5, Math.floor(BUDGET / hours.length)));
  const now = Date.now();
  const left = Math.max(0, goal - todayTotal);

  for (let d = 0; d < days; d++) {
    if (d === 0 && left === 0) continue;
    for (const h of hours) {
      const at = new Date();
      at.setDate(at.getDate() + d);
      at.setHours(h, 0, 0, 0);
      if (at.getTime() <= now) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}${todayISO(at)}-${h}`,
        content: {
          title: t.reminderTitle,
          body: d === 0 ? t.reminderToday(left) : t.reminderBody,
          data: { screen: 'nutrition' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
      });
    }
  }
}

/** Giriş yapılmışken: bugünün suyu ya da hedef değişince ve uygulamaya dönünce hatırlatmaları yenile. */
export function useWaterReminderSync(enabled: boolean) {
  const day = todayISO();
  const water = useWater(day);
  const targets = useDailyTargets();
  const loaded = !water.isLoading && !targets.loading;
  const total = water.total;
  const goal = targets.water;

  useEffect(() => {
    if (!enabled || !loaded || Platform.OS === 'web') return;
    syncWaterReminders(total, goal).catch(() => {});
  }, [enabled, loaded, total, goal]);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (s) => {
      // Gece yarısı geçtiyse dünün toplamı bugüne sayılmasın.
      if (s === 'active') syncWaterReminders(todayISO() === day ? total : 0, goal).catch(() => {});
    });
    return () => sub.remove();
  }, [enabled, day, total, goal]);
}
