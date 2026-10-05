import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { ToggleRow } from '@/components/toggle-row';
import { Btn, IconBtn, Screen, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { notifyPrefs, useChallenge, useMyEntries, useProfile, useUpdateProfile, type NotifyPrefs } from '@/lib/data';
import {
  askPermission,
  getLocalPrefs,
  hasPermission,
  pushStatusText,
  registerForPush,
  setLocalPrefs,
  syncLocalNotifications,
  type LocalPrefs,
  type PushStatus,
} from '@/lib/notifications';

export default function NotificationSettings() {
  const t = useStrings();
  const n = t.notifScreen;
  const profile = useProfile();
  const entries = useMyEntries();
  const ch = useChallenge();
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
    setLocalPrefs(next, entries.data ?? [], ch);
  };

  return (
    <Screen bottom={40} gap={14}>
      <IconBtn name="back" label={t.common.back} onPress={() => router.back()} />
      <Txt size={32} weight="extrabold">
        {n.title}
      </Txt>

      {Platform.OS === 'web' ? (
        <Txt size={15} color={C.sub}>
          {n.webOnly}
        </Txt>
      ) : permitted === false ? (
        <View style={{ backgroundColor: C.goldBg, borderRadius: 18, padding: 16, gap: 12 }}>
          <Txt size={15} color={C.gold} style={{ lineHeight: 22 }}>
            {n.permissionOff}
          </Txt>
          <Btn
            title={n.allow}
            height={50}
            loading={busy}
            onPress={async () => {
              setBusy(true);
              const ok = await askPermission();
              setPermitted(ok);
              if (ok) {
                await syncLocalNotifications(entries.data ?? [], ch);
                setPush(await registerForPush());
              }
              setBusy(false);
            }}
          />
        </View>
      ) : null}

      <Txt size={18} weight="extrabold" style={{ marginTop: 8 }}>
        {n.friends}
      </Txt>
      <ToggleRow title={n.passed} sub={n.passedSub} value={server.passed} onChange={(v) => setServer({ passed: v })} />
      <ToggleRow
        title={n.goal}
        sub={n.goalSub}
        value={server.friend_goal}
        onChange={(v) => setServer({ friend_goal: v })}
      />
      <ToggleRow
        title={n.record}
        sub={n.recordSub}
        value={server.friend_record}
        onChange={(v) => setServer({ friend_record: v })}
      />
      {Platform.OS !== 'web' ? (
        <View style={{ gap: 10 }}>
          <Txt size={13} color={C.sub} style={{ lineHeight: 19 }}>
            {push ? pushStatusText(push) : n.registerHint}
          </Txt>
          {push !== 'ok' ? (
            <Btn kind="secondary" height={46} title={n.register} onPress={async () => setPush(await registerForPush())} />
          ) : null}
        </View>
      ) : null}

      <Txt size={18} weight="extrabold" style={{ marginTop: 8 }}>
        {n.reminders}
      </Txt>
      <ToggleRow title={n.weekly} sub={n.weeklySub} value={local.weekly} onChange={(v) => setLocalPref({ weekly: v })} />
      <ToggleRow
        title={n.milestones}
        sub={n.milestonesSub}
        value={local.milestones}
        onChange={(v) => setLocalPref({ milestones: v })}
      />
    </Screen>
  );
}
