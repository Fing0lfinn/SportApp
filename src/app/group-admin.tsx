import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { ToggleRow } from '@/components/toggle-row';
import { Avatar, Btn, Empty, Field, IconBtn, Pill, Screen, styles, Txt } from '@/components/ui';
import { C } from '@/constants/theme';
import { useActiveGroup, useGroupAdmin, useGroupBoard, type Player } from '@/lib/data';

export default function GroupAdmin() {
  const { group, isAdmin } = useActiveGroup();
  const board = useGroupBoard(group?.id);
  const admin = useGroupAdmin(group?.id);
  const [name, setName] = useState(group?.name ?? '');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  if (!group || !isAdmin) {
    return (
      <Screen>
        <IconBtn name="back" label="Geri" onPress={() => router.back()} />
        <Empty title="Yönetici değilsin" text="Bu grubu sadece yöneticileri düzenleyebilir." />
      </Screen>
    );
  }

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg('');
    try {
      await fn();
      setMsg(ok);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <Screen bottom={40} gap={14}>
      <IconBtn name="back" label="Geri" onPress={() => router.back()} />
      <Txt size={32} weight="extrabold">
        Grubu yönet
      </Txt>

      <Field label="Grup adı" value={name} onChangeText={setName} maxLength={40} />
      {name.trim() && name.trim() !== group.name ? (
        <Btn
          title="Adı kaydet"
          height={50}
          loading={admin.updateGroup.isPending}
          onPress={() => run(() => admin.updateGroup.mutateAsync({ name: name.trim() }), 'Grup adı güncellendi.')}
        />
      ) : null}

      <View style={[styles.rowBetween, { backgroundColor: C.surface, borderRadius: 18, padding: 16 }]}>
        <View>
          <Txt size={13} color={C.sub}>
            Davet kodu
          </Txt>
          <Txt size={24} weight="black" style={{ letterSpacing: 3 }}>
            {group.invite_code}
          </Txt>
        </View>
        <Btn
          kind="secondary"
          height={42}
          title="Yenile"
          loading={admin.regenerateCode.isPending}
          onPress={() => run(() => admin.regenerateCode.mutateAsync(), 'Yeni kod oluştu, eskisi artık geçersiz.')}
        />
      </View>

      <ToggleRow
        title="Yeni üyeleri onayla"
        sub="Kapalıysa kodu bilen herkes direkt katılır"
        value={group.require_approval}
        onChange={(v) => run(() => admin.updateGroup.mutateAsync({ require_approval: v }), v ? 'Artık katılımlar onayına düşecek.' : 'Kodla gelen direkt katılacak.')}
      />

      {msg ? (
        <Txt size={15} weight="semibold" color={C.accent}>
          {msg}
        </Txt>
      ) : null}

      {board.pending.length ? (
        <View style={{ gap: 10 }}>
          <Txt size={18} weight="extrabold" style={{ marginTop: 8 }}>
            Katılma istekleri
          </Txt>
          {board.pending.map((p) => (
            <View key={p.id} style={[styles.row, { backgroundColor: C.surface, borderRadius: 18, padding: 12 }]}>
              <Avatar name={p.name} color={p.color} size={40} />
              <Txt size={16} weight="bold" style={{ flex: 1 }} numberOfLines={1}>
                {p.name}
              </Txt>
              <IconBtn
                name="close"
                label={`${p.name} isteğini reddet`}
                bg={C.surface3}
                size={40}
                onPress={() => run(() => admin.removeMember.mutateAsync(p.id), 'İstek reddedildi.')}
              />
              <Btn
                title="Onayla"
                height={40}
                onPress={() => run(() => admin.updateMember.mutateAsync({ userId: p.id, status: 'active' }), `${p.name} gruba katıldı.`)}
              />
            </View>
          ))}
        </View>
      ) : null}

      <Txt size={18} weight="extrabold" style={{ marginTop: 8 }}>
        Üyeler · {board.active.length}
      </Txt>
      {board.active.map((p, i) => (
        <MemberRow
          key={p.id}
          i={i}
          p={p}
          confirming={confirm === p.id}
          onRole={() =>
            run(
              () => admin.updateMember.mutateAsync({ userId: p.id, role: p.role === 'admin' ? 'member' : 'admin' }),
              p.role === 'admin' ? `${p.name} artık üye.` : `${p.name} artık yönetici.`,
            )
          }
          onRemove={() => {
            if (confirm !== p.id) {
              setConfirm(p.id);
              return;
            }
            setConfirm(null);
            run(() => admin.removeMember.mutateAsync(p.id), `${p.name} gruptan çıkarıldı.`);
          }}
        />
      ))}
    </Screen>
  );
}

function MemberRow({
  i,
  p,
  confirming,
  onRole,
  onRemove,
}: {
  i: number;
  p: Player;
  confirming: boolean;
  onRole: () => void;
  onRemove: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(60 + i * 40).duration(400)} style={{ backgroundColor: C.surface, borderRadius: 18, padding: 14, gap: 12 }}>
      <View style={styles.row}>
        <Avatar name={p.name} color={p.color} size={40} />
        <Txt size={16} weight="bold" style={{ flex: 1 }} numberOfLines={1}>
          {p.isMe ? `${p.name} (sen)` : p.name}
        </Txt>
        {p.role === 'admin' ? (
          <Pill bg={C.goldBg} fg={C.gold}>
            YÖNETİCİ
          </Pill>
        ) : null}
      </View>
      {!p.isMe ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn kind="secondary" height={42} style={{ flex: 1, backgroundColor: C.surface2 }} title={p.role === 'admin' ? 'Yöneticilikten al' : 'Yönetici yap'} onPress={onRole} />
          <Btn
            kind={confirming ? 'primary' : 'danger'}
            height={42}
            style={[{ flex: 1 }, confirming ? { backgroundColor: C.dangerFill } : { backgroundColor: C.surface2 }]}
            title={confirming ? 'Emin misin?' : 'Çıkar'}
            onPress={onRemove}
          />
        </View>
      ) : (
        <View style={[styles.row, { gap: 6 }]}>
          <Icon name="check" size={16} color={C.sub} />
          <Txt size={13} color={C.sub}>
            Kendi rolünü değiştiremezsin.
          </Txt>
        </View>
      )}
    </Animated.View>
  );
}
