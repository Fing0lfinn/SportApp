import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Btn, Field, Pill, styles, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useActiveGroup, useCreateGroup, useJoinGroup, useLeaveGroup, useMemberships } from '@/lib/data';

export default function Groups() {
  const memberships = useMemberships();
  const active = useActiveGroup();
  const join = useJoinGroup();
  const create = useCreateGroup();
  const leave = useLeaveGroup();
  const [code, setCode] = useState('');
  const [newName, setNewName] = useState('');
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const g = active.group;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 28, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Txt size={24} weight="extrabold">
        Gruplar
      </Txt>
      <Txt size={14} color={C.sub} style={{ marginTop: -8 }}>
        Kayıtların tüm gruplarda ortak, her grubun kendi sıralaması var.
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
                {pending ? 'Onay bekleniyor' : m.role === 'admin' ? 'Yöneticisin' : 'Üyesin'}
              </Txt>
            </View>
            {pending ? <Pill bg={C.goldBg} fg={C.gold}>BEKLİYOR</Pill> : null}
            {on ? <Icon name="check" size={22} color={C.accent} stroke={3} /> : null}
          </Pressable>
        );
      })}

      {g ? (
        <View style={{ backgroundColor: C.surface2, borderRadius: 20, padding: 16, gap: 12 }}>
          <View style={styles.rowBetween}>
            <View>
              <Txt size={14} color={C.sub}>
                {g.name} davet kodu
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
              title={copied ? 'Kopyalandı' : 'Kopyala'}
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
              title="Paylaş"
              style={{ flex: 1, backgroundColor: C.surface3 }}
              onPress={() =>
                Share.share({
                  message: `1 Yıl Meydan Okuması'nda "${g.name}" grubuna katıl! Uygulamayı açıp şu kodu gir: ${g.invite_code}`,
                })
              }
            />
          </View>
        </View>
      ) : null}

      <View style={{ gap: 10, marginTop: 6 }}>
        <Field
          label="Davet koduyla katıl"
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="ör. K7M2QX"
          style={{ backgroundColor: C.surface2, letterSpacing: 2 }}
        />
        <Btn
          title="Katıl"
          height={52}
          disabled={code.trim().length < 4}
          loading={join.isPending}
          onPress={async () => {
            setMsg('');
            try {
              const r = await join.mutateAsync(code);
              setCode('');
              setMsg(r.status === 'pending' ? `${r.name}: yönetici onayı bekleniyor.` : `${r.name} grubuna katıldın!`);
            } catch (e) {
              setMsg((e as Error).message);
            }
          }}
        />
      </View>

      <View style={{ gap: 10, marginTop: 6 }}>
        <Field
          label="Yeni grup kur"
          value={newName}
          onChangeText={setNewName}
          maxLength={40}
          placeholder="Grup adı"
          style={{ backgroundColor: C.surface2 }}
        />
        <Btn
          kind="secondary"
          height={52}
          title="Grubu kur"
          disabled={!newName.trim()}
          loading={create.isPending}
          onPress={async () => {
            setMsg('');
            try {
              const created = await create.mutateAsync(newName.trim());
              setNewName('');
              setMsg(`${created.name} kuruldu. Davet kodu: ${created.invite_code}`);
            } catch (e) {
              setMsg((e as Error).message);
            }
          }}
        />
      </View>

      {msg ? (
        <Txt size={15} weight="semibold" color={msg.includes('bulunamadı') ? C.danger : C.accent}>
          {msg}
        </Txt>
      ) : null}

      {g ? (
        <Btn
          kind={confirmLeave ? 'primary' : 'danger'}
          height={50}
          style={[{ marginTop: 10 }, confirmLeave && { backgroundColor: C.dangerFill }]}
          title={confirmLeave ? `Emin misin? ${g.name} grubundan ayrıl` : 'Bu gruptan ayrıl'}
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
