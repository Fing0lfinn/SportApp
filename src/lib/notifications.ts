import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { strings } from '@/i18n';

import { dateFromIndex, dayIndex, todayIndex, todayISO, TOTAL_DAYS, type Challenge, type Entry } from './challenge';
import { supabase } from './supabase';

// Telefonun kendi kurduğu bildirimler (sunucu gerekmez):
//   * haftalık hatırlatma: o hafta kayıt yoksa haftanın son günü 20:00
//   * kilometre taşları: 100. gün, yarı yol, son 30 gün, final günü
// Arkadaş bildirimleri (seni geçti, hedef, rekor) sunucudan push olarak gelir.

export type LocalPrefs = { weekly: boolean; milestones: boolean };
const PREFS_KEY = 'notif:local';
const TOKEN_KEY = 'notif:pushToken';

const MILESTONES = [
  { id: 'm-100', day: 100, key: 'day100' },
  { id: 'm-half', day: 182, key: 'half' },
  { id: 'm-30', day: 335, key: 'last30' },
  { id: 'm-final', day: 365, key: 'final' },
] as const;

const isWeb = Platform.OS === 'web';

export function configureNotifications() {
  if (isWeb) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: strings().notif.channel,
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#C8F04A',
    }).catch(() => {});
  }
}

export async function getLocalPrefs(): Promise<LocalPrefs> {
  const raw = await AsyncStorage.getItem(PREFS_KEY);
  return { weekly: true, milestones: true, ...(raw ? JSON.parse(raw) : {}) };
}

export async function setLocalPrefs(prefs: LocalPrefs, entries: Entry[], ch: Challenge) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  await syncLocalNotifications(entries, ch);
}

export async function hasPermission() {
  if (isWeb) return false;
  const p = await Notifications.getPermissionsAsync();
  return p.granted;
}

export async function askPermission() {
  if (isWeb) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

/** Haftalık hatırlatmayı ve kilometre taşlarını kayıtlara göre yeniden kurar. */
export async function syncLocalNotifications(entries: Entry[], ch: Challenge) {
  if (isWeb || !(await hasPermission())) return;
  const prefs = await getLocalPrefs();
  const t = strings().notif;

  await Notifications.cancelScheduledNotificationAsync('weekly').catch(() => {});
  if (prefs.weekly) {
    const today = todayIndex(ch.start);
    const week = Math.floor(today / 7);
    const loggedThisWeek = entries.some(
      (e) => !e.is_start && Math.floor(dayIndex(e.performed_on, ch.start) / 7) === week,
    );
    // Meydan okuma haftası başlangıç gününde başlar; hatırlatma haftanın son günü.
    let target = reminderTime(week * 7 + 6, ch.start);
    if (loggedThisWeek || target.getTime() <= Date.now()) target = reminderTime((week + 1) * 7 + 6, ch.start);
    if (dayIndex(todayISO(target), ch.start) <= TOTAL_DAYS) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'weekly',
        content: { title: t.weeklyTitle, body: t.weeklyBody },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
      });
    }
  }

  for (const m of MILESTONES) {
    await Notifications.cancelScheduledNotificationAsync(m.id).catch(() => {});
    const at = dateFromIndex(m.day, ch.start);
    at.setHours(m.day === TOTAL_DAYS ? 10 : 12, 0, 0, 0);
    if (prefs.milestones && at.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        identifier: m.id,
        content: { title: t.milestones[m.key].title, body: t.milestones[m.key].body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
      });
    }
  }
}

function reminderTime(day: number, start: string) {
  const d = dateFromIndex(day, start);
  d.setHours(20, 0, 0, 0);
  return d;
}

export type PushStatus = 'ok' | 'denied' | 'simulator' | 'expo-go-android' | 'no-project' | 'error';

/** Arkadaş bildirimleri için cihazın Expo push jetonunu sunucuya kaydeder. */
export async function registerForPush(): Promise<PushStatus> {
  if (isWeb || !Device.isDevice) return 'simulator';
  if (Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    // Expo Go Android'de uzak bildirim yok; geliştirme derlemesi gerekir.
    return 'expo-go-android';
  }
  if (!(await askPermission())) return 'denied';
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return 'no-project';
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS });
    if (error) return 'error';
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return 'ok';
  } catch {
    return 'error';
  }
}

/** Çıkışta bu cihaza bildirim gitmesin. */
export async function forgetPushToken() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    await supabase.from('push_tokens').delete().eq('token', token);
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
  if (!isWeb) await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

export function pushStatusText(status: PushStatus) {
  return strings().notif.status[status];
}
