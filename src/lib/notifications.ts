import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { dateFromIndex, dayIndex, todayIndex, todayISO, type Entry } from './challenge';
import { supabase } from './supabase';

// Telefonun kendi kurduğu bildirimler (sunucu gerekmez):
//   * haftalık hatırlatma: o hafta kayıt yoksa haftanın son günü 20:00
//   * kilometre taşları: 100. gün, yarı yol, son 30 gün, final günü
// Arkadaş bildirimleri (seni geçti, hedef, rekor) sunucudan push olarak gelir.

export type LocalPrefs = { weekly: boolean; milestones: boolean };
const PREFS_KEY = 'notif:local';
const TOKEN_KEY = 'notif:pushToken';

const MILESTONES = [
  { id: 'm-100', day: 100, title: '100. gün!', body: 'Meydan okumanın 100. günü. Bakalım ne kadar ilerledin?' },
  { id: 'm-half', day: 182, title: 'Yarı yoldayız', body: 'Yılın yarısı bitti. Hedeflerine ne kadar kaldı, bir göz at.' },
  { id: 'm-30', day: 335, title: 'Son 30 gün', body: 'Final 30 gün sonra. Son düzlüğe girdik!' },
  { id: 'm-final', day: 365, title: 'Bugün final günü!', body: 'Akşam 20:00 sıralama belli oluyor.' },
];

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
      name: 'Genel',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#C8F04A',
    }).catch(() => {});
  }
}

export async function getLocalPrefs(): Promise<LocalPrefs> {
  const raw = await AsyncStorage.getItem(PREFS_KEY);
  return { weekly: true, milestones: true, ...(raw ? JSON.parse(raw) : {}) };
}

export async function setLocalPrefs(prefs: LocalPrefs, entries: Entry[]) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  await syncLocalNotifications(entries);
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
export async function syncLocalNotifications(entries: Entry[]) {
  if (isWeb || !(await hasPermission())) return;
  const prefs = await getLocalPrefs();

  await Notifications.cancelScheduledNotificationAsync('weekly').catch(() => {});
  if (prefs.weekly) {
    const today = todayIndex();
    const week = Math.floor(today / 7);
    const loggedThisWeek = entries.some((e) => !e.is_start && Math.floor(dayIndex(e.performed_on) / 7) === week);
    // Meydan okuma haftası pazar başlar; son günü cumartesi.
    let target = reminderTime(week * 7 + 6);
    if (loggedThisWeek || target.getTime() <= Date.now()) target = reminderTime((week + 1) * 7 + 6);
    if (dayIndex(todayISO(target)) <= 365) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'weekly',
        content: { title: 'Seri bozulmasın!', body: 'Bu hafta henüz kayıt girmedin. Salondan sonra eklemeyi unutma.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: target },
      });
    }
  }

  for (const m of MILESTONES) {
    await Notifications.cancelScheduledNotificationAsync(m.id).catch(() => {});
    const at = dateFromIndex(m.day);
    at.setHours(m.day === 365 ? 10 : 12, 0, 0, 0);
    if (prefs.milestones && at.getTime() > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        identifier: m.id,
        content: { title: m.title, body: m.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
      });
    }
  }
}

function reminderTime(day: number) {
  const d = dateFromIndex(day);
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

export const PUSH_STATUS_TEXT: Record<PushStatus, string> = {
  ok: 'Bu telefon arkadaş bildirimlerini alıyor.',
  denied: 'Bildirim izni kapalı. Telefon ayarlarından açabilirsin.',
  simulator: 'Arkadaş bildirimleri sadece gerçek telefonda çalışır.',
  'expo-go-android':
    "Android'de Expo Go uzak bildirim almıyor. Uygulamanın kendi derlemesi kurulunca açılacak.",
  'no-project': 'Uygulama henüz EAS projesine bağlanmadı (eas init). Bağlanınca arkadaş bildirimleri açılır.',
  error: 'Bildirim kaydı yapılamadı. Biraz sonra tekrar dene.',
};
