import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { ToggleRow } from '@/components/toggle-row';
import { Btn, IconBtn, Screen, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { notifyPrefs, useMyEntries, useProfile, useUpdateProfile, type NotifyPrefs } from '@/lib/data';
import {
  askPermission,
  getLocalPrefs,
  hasPermission,
  PUSH_STATUS_TEXT,
  registerForPush,
  setLocalPrefs,
  syncLocalNotifications,
  type LocalPrefs,
  type PushStatus,
} from '@/lib/notifications';

export default function NotificationSettings() {
  const profile = useProfile();
  const entries = useMyEntries();
  const update = useUpdateProfile();
  const [local, setLocal] = useState<LocalPrefs>({ weekly: true, milestones: true });
  const [permitted, setPermitted] = useState<boolean | null>(null);
  const [push, setPush] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getLocalPrefs().then(setLocal);
    hasPermission().then(setPermitted);
  }, []);

  const server = notifyPrefs(profile.data);
  const setServer = (patch: Partial<NotifyPrefs>) => update.mutate({ notify: { ...server, ...patch } });
  const setLocalPref = (patch: Partial<LocalPrefs>) => {
    const next = { ...local, ...patch };
    setLocal(next);
    setLocalPrefs(next, entries.data ?? []);
  };

  return (
    <Screen bottom={40} gap={14}>
      <IconBtn name="back" label="Geri" onPress={() => router.back()} />
      <Txt size={32} weight="extrabold">
        Bildirimler
      </Txt>

      {Platform.OS === 'web' ? (
        <Txt size={15} color={C.sub}>
          Bildirimler telefonda çalışır.
        </Txt>
      ) : permitted === false ? (
        <View style={{ backgroundColor: C.goldBg, borderRadius: 18, padding: 16, gap: 12 }}>
          <Txt size={15} color={C.gold} style={{ lineHeight: 22 }}>
            Bildirim izni kapalı. Açmazsan hatırlatmalar ve arkadaş bildirimleri gelmez.
          </Txt>
          <Btn
            title="Bildirimlere izin ver"
            height={50}
            loading={busy}
            onPress={async () => {
              setBusy(true);
              const ok = await askPermission();
              setPermitted(ok);
              if (ok) {
                await syncLocalNotifications(entries.data ?? []);
                setPush(await registerForPush());
              }
              setBusy(false);
            }}
          />
        </View>
      ) : null}

      <Txt size={18} weight="extrabold" style={{ marginTop: 8 }}>
        Arkadaşların
      </Txt>
      <ToggleRow
        title="Biri seni geçince"
        sub="Bir harekette arkadaşın senin en iyini geçerse"
        value={server.passed}
        onChange={(v) => setServer({ passed: v })}
      />
      <ToggleRow
        title="Hedef tamamlayınca"
        sub="Gruptan biri bir hedefi bitirince"
        value={server.friend_goal}
        onChange={(v) => setServer({ friend_goal: v })}
      />
      <ToggleRow
        title="Rekor kırınca"
        sub="Gruptakilerin tüm rekorları"
        value={server.friend_record}
        onChange={(v) => setServer({ friend_record: v })}
      />
      {Platform.OS !== 'web' ? (
        <View style={{ gap: 10 }}>
          <Txt size={13} color={C.sub} style={{ lineHeight: 19 }}>
            {push ? PUSH_STATUS_TEXT[push] : 'Arkadaş bildirimleri için bu telefonu kaydet.'}
          </Txt>
          {push !== 'ok' ? (
            <Btn
              kind="secondary"
              height={46}
              title="Bu telefonu kaydet"
              onPress={async () => setPush(await registerForPush())}
            />
          ) : null}
        </View>
      ) : null}

      <Txt size={18} weight="extrabold" style={{ marginTop: 8 }}>
        Hatırlatmalar
      </Txt>
      <ToggleRow
        title="Haftalık hatırlatma"
        sub="Haftanın son günü 20:00, o hafta kayıt yoksa"
        value={local.weekly}
        onChange={(v) => setLocalPref({ weekly: v })}
      />
      <ToggleRow
        title="Kilometre taşları"
        sub="100. gün, yarı yol, son 30 gün, final günü"
        value={local.milestones}
        onChange={(v) => setLocalPref({ milestones: v })}
      />
    </Screen>
  );
}
