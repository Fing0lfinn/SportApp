import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Btn, Field, Pill, styles, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useStrings } from '@/i18n';
import { formatDate } from '@/lib/challenge';
import { useActiveGroup, useJoinGroup, useLeaveGroup, useMemberships } from '@/lib/data';

export default function Groups() {
  const t = useStrings();
  const gt = t.groups;
  const memberships = useMemberships();
  const active = useActiveGroup();
  const join = useJoinGroup();
  const leave = useLeaveGroup();
  const [code, setCode] = useState('');
  const [newName, setNewName] = useState('');
  const [msg, setMsg] = useState('');
  const [msgError, setMsgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const g = active.group;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Txt size={24} weight="extrabold">
        {t.board.groups}
      </Txt>
      <Txt size={14} color={C.sub} style={{ marginTop: -8 }}>
        {gt.intro}
      </Txt>

      {(memberships.data ?? []).map((m) => {
        const on = m.group.id === g?.id;
        const pending = m.status === 'pending';
        return (
          <Pressable
            key={m.group.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            disabled={pending}
            onPress={async () => {
              await active.setActive(m.group.id);
              router.back();
            }}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: on ? C.meBg : C.surface2,
                borderRadius: 20,
                padding: 16,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}>
            <View style={{ flex: 1 }}>
              <Txt size={17} weight="bold">
                {m.group.name}
              </Txt>
              <Txt size={14} color={C.sub}>
                {pending ? gt.pending : `${m.role === 'admin' ? gt.admin : gt.member} · ${formatDate(m.group.start_date)}`}
              </Txt>
            </View>
            {pending ? (
              <Pill bg={C.goldBg} fg={C.gold}>
                {t.exercise.pending}
              </Pill>
            ) : null}
            {on ? <Icon name="check" size={22} color={C.accent} stroke={3} /> : null}
          </Pressable>
        );
      })}

      {g ? (
        <View style={{ backgroundColor: C.surface2, borderRadius: 20, padding: 16, gap: 12 }}>
          <View style={styles.rowBetween}>
            <View>
              <Txt size={14} color={C.sub}>
                {gt.inviteCode(g.name)}
              </Txt>
              <Txt size={28} weight="black" style={{ letterSpacing: 3 }}>
                {g.invite_code}
              </Txt>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn
              kind="secondary"
              height={46}
              icon="copy"
              title={copied ? gt.copied : gt.copy}
              style={{ flex: 1, backgroundColor: C.surface3 }}
              onPress={async () => {
                await Clipboard.setStringAsync(g.invite_code);
                setCopied(true);
              }}
            />
            <Btn
              kind="secondary"
              height={46}
              icon="share"
              title={t.common.share}
              style={{ flex: 1, backgroundColor: C.surface3 }}
              onPress={() => Share.share({ message: gt.shareMessage(g.name, g.invite_code) })}
            />
          </View>
        </View>
      ) : null}

      {g && active.isAdmin ? (
        <Btn
          kind="secondary"
          height={50}
          icon="settings"
          title={t.profile.admin}
          onPress={() => {
            router.back();
            router.push('/group-admin');
          }}
        />
      ) : null}

      <View style={{ gap: 10, marginTop: 6 }}>
        <Field
          label={gt.joinLabel}
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={gt.codePlaceholder}
          style={{ backgroundColor: C.surface2, letterSpacing: 2 }}
        />
        <Btn
          title={gt.join}
          height={52}
          disabled={code.trim().length < 4}
          loading={join.isPending}
          onPress={async () => {
            setMsg('');
            try {
              const r = await join.mutateAsync(code);
              setCode('');
              setMsgError(false);
              setMsg(r.status === 'pending' ? gt.joinedPending(r.name) : gt.joined(r.name));
            } catch (e) {
              setMsgError(true);
              setMsg((e as Error).message);
            }
          }}
        />
      </View>

      <View style={{ gap: 10, marginTop: 6 }}>
        <Field
          label={gt.createLabel}
          value={newName}
          onChangeText={setNewName}
          maxLength={40}
          placeholder={gt.namePlaceholder}
          style={{ backgroundColor: C.surface2 }}
        />
        <Btn
          kind="secondary"
          height={52}
          title={gt.createNext}
          disabled={!newName.trim()}
          onPress={() => {
            const name = newName.trim();
            setNewName('');
            router.back();
            router.push({ pathname: '/challenge', params: { newName: name } });
          }}
        />
      </View>

      {msg ? (
        <Txt size={15} weight="semibold" color={msgError ? C.danger : C.accent}>
          {msg}
        </Txt>
      ) : null}

      {g ? (
        <Btn
          kind={confirmLeave ? 'primary' : 'danger'}
          height={50}
          style={[{ marginTop: 10 }, confirmLeave && { backgroundColor: C.dangerFill }]}
          title={confirmLeave ? gt.leaveConfirm(g.name) : gt.leave}
          loading={leave.isPending}
          onPress={async () => {
            if (!confirmLeave) {
              setConfirmLeave(true);
              return;
            }
            await leave.mutateAsync(g.id);
            setConfirmLeave(false);
          }}
        />
      ) : null}
    </ScrollView>
  );
}
