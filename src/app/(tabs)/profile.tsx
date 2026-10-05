import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import Animated, { ZoomIn } from 'react-native-reanimated';

import { Hexagon } from '@/components/hexagon';
import { FlameIcon, Icon, type IconName } from '@/components/icon';
import { Avatar, Bar, Btn, Card, Field, Loading, Screen, Stepper, styles, Txt } from '@/components/ui';
import { AVATAR_COLORS, C } from '@/constants/theme';
import { computeBadges } from '@/lib/badges';
import { EXERCISES, fmt, strengthRatio, XP } from '@/lib/challenge';
import { useActiveGroup, useGroupBoard, useMyStats, useProfile, useUpdateProfile } from '@/lib/data';
import { forgetPushToken } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const profile = useProfile();
  const mine = useMyStats();
  const { group, isAdmin } = useActiveGroup();
  const board = useGroupBoard(group?.id);
  const [editing, setEditing] = useState(false);

  if (!profile.data || mine.isLoading) return <Loading />;
  const p = profile.data;
  const s = mine.stats;
  const rank = board.ranked.findIndex((x) => x.isMe) + 1;
  const ratio = strengthRatio(s, p.body_weight);
  const badges = computeBadges(s, p.body_weight);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <Screen refreshing={mine.isRefetching} onRefresh={mine.refetch}>
      <View style={styles.row}>
        <Avatar name={p.name} color={p.color} size={72} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={30} weight="extrabold" numberOfLines={1} style={{ lineHeight: 36 }}>
            {p.name}
          </Txt>
          <Txt size={15} color={C.sub}>
            {group ? `${group.name}${rank ? ` · ${rank}. sıra` : ''}` : 'Grup yok'}
          </Txt>
          <Txt size={15} color={C.sub}>
            {p.body_weight ? `${fmt(p.body_weight)} kg` : 'Kilo girilmemiş'}
            {ratio ? ` · güç oranı ${fmt(Math.round(ratio * 100) / 100)}×` : ''}
          </Txt>
        </View>
      </View>

      {editing ? <EditProfile onClose={() => setEditing(false)} /> : null}

      <Card style={{ gap: 12 }}>
        <View style={styles.rowBetween}>
          <View>
            <Txt size={14} weight="semibold" color={C.sub}>
              Seviye {s.level + 1}
            </Txt>
            <Txt size={26} weight="black" color={C.accent}>
              {s.levelName}
            </Txt>
          </View>
          <Txt size={20} weight="extrabold">
            {s.xp} XP
          </Txt>
        </View>
        <Bar value={s.levelProgress} height={10} delay={200} />
        <Txt size={14} color={C.sub}>
          {s.nextLevel ? `${s.nextLevel.name} seviyesine ${s.nextLevel.xp - s.xp} XP kaldı` : 'En üst seviyedesin'}
        </Txt>
        <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 }}>
          <Txt size={13} color={C.sub}>
            Kayıt +{XP.entry} · Rekor +{XP.record} · Ara hedef +{XP.milestone} · Hedef +{XP.goal} XP
          </Txt>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat icon={<FlameIcon size={20} />} value={s.streak} label="hafta seri" />
        <Stat icon={<Icon name="bolt" size={20} color={C.gold} />} value={s.records} label="rekor" />
        <Stat icon={<Icon name="check" size={20} color={C.accent} stroke={3} />} value={s.entries} label="kayıt" />
      </View>

      <View style={{ gap: 12 }}>
        <View style={styles.rowBetween}>
          <Txt size={20} weight="extrabold">
            Rozetler
          </Txt>
          <Txt size={14} color={C.sub}>
            {earned} / {badges.length}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
          {badges.map((b, i) => (
            <Animated.View key={b.id} entering={ZoomIn.delay(100 + i * 40).duration(400)} style={{ width: '25%' }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${b.name}${b.earned ? ', kazanıldı' : ', kilitli'}`}
                onPress={() => router.push({ pathname: '/badge/[id]', params: { id: b.id } })}
                style={({ pressed }) => ({ alignItems: 'center', gap: 6, transform: [{ scale: pressed ? 0.94 : 1 }] })}>
                <Hexagon glyph={b.glyph} earned={b.earned} />
                <Txt size={12} weight="bold" color={b.earned ? C.text : C.sub} style={{ textAlign: 'center', lineHeight: 15 }}>
                  {b.name}
                </Txt>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Txt size={20} weight="extrabold">
          Başlangıç → şimdi
        </Txt>
        <Card style={{ paddingVertical: 6 }}>
          {EXERCISES.map((ex, i) => {
            const st = s.byExercise[ex.key];
            const gain = Math.round((st.best - st.start) * 100) / 100;
            return (
              <View
                key={ex.key}
                style={[styles.row, { paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.line, gap: 10 }]}>
                <Txt size={15} weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
                  {ex.name}
                </Txt>
                <Txt size={15} color={C.sub}>
                  {fmt(st.start)} →{' '}
                  <Txt size={15} weight="bold">
                    {fmt(st.best)}
                    {ex.unit === 'kg' ? ' kg' : ''}
                  </Txt>
                </Txt>
                <Txt size={15} weight="extrabold" color={gain > 0 ? C.accent : C.muted} style={{ minWidth: 52, textAlign: 'right' }}>
                  {gain > 0 ? `+${fmt(gain)}` : '–'}
                </Txt>
              </View>
            );
          })}
        </Card>
      </View>

      <View style={{ gap: 10 }}>
        <Txt size={20} weight="extrabold">
          Araçlar ve ayarlar
        </Txt>
        <MenuRow icon="calendar" title="Aylık özet" sub="Ayın kayıtları, rekorları, paylaşılabilir kart" onPress={() => router.push('/month')} />
        <MenuRow icon="scale" title="Plaka hesaplayıcı" sub="Bara hangi plakaları takacağını göster" onPress={() => router.push('/plates')} />
        <MenuRow icon="bell" title="Bildirimler" sub="Arkadaş bildirimleri ve hatırlatmalar" onPress={() => router.push('/notifications')} />
        {isAdmin ? (
          <MenuRow icon="settings" title="Grubu yönet" sub="Üyeler, istekler, davet kodu" onPress={() => router.push('/group-admin')} />
        ) : null}
        <MenuRow icon="user" title="Profili düzenle" sub="İsim, renk, vücut ağırlığı" onPress={() => setEditing(!editing)} />
        <MenuRow icon="home" title="Gruplar" sub="Katıl, kur, davet kodu paylaş" onPress={() => router.push('/groups')} />
        <Btn
          kind="danger"
          title="Çıkış yap"
          icon="logout"
          onPress={async () => {
            await forgetPushToken().catch(() => {});
            await supabase.auth.signOut();
          }}
        />
      </View>
    </Screen>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: 20, padding: 14, gap: 4 }}>
      {icon}
      <Txt size={24} weight="black">
        {value}
      </Txt>
      <Txt size={13} color={C.sub}>
        {label}
      </Txt>
    </View>
  );
}

function MenuRow({ icon, title, sub, onPress }: { icon: IconName; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: C.surface, borderRadius: 18, padding: 14, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color={C.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt size={16} weight="bold">
          {title}
        </Txt>
        <Txt size={13} color={C.sub}>
          {sub}
        </Txt>
      </View>
      <Icon name="chevronRight" size={20} color={C.sub} stroke={2.6} />
    </Pressable>
  );
}

function EditProfile({ onClose }: { onClose: () => void }) {
  const profile = useProfile();
  const update = useUpdateProfile();
  const [name, setName] = useState(profile.data?.name ?? '');
  const [color, setColor] = useState(profile.data?.color ?? AVATAR_COLORS[0]);
  const [bw, setBw] = useState(Number(profile.data?.body_weight ?? 80));

  return (
    <Card style={{ gap: 16 }}>
      <Field label="Adın" value={name} onChangeText={(t) => setName(t.slice(0, 24))} style={{ backgroundColor: C.surface2 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {AVATAR_COLORS.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`Renk ${c}`}
            accessibilityState={{ selected: c === color }}
            onPress={() => setColor(c)}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c, borderWidth: c === color ? 3 : 0, borderColor: C.text }}
          />
        ))}
      </View>
      <Stepper
        title="Vücut ağırlığı"
        sub="kg"
        value={fmt(bw)}
        onDec={() => setBw(Math.max(30, Math.round((bw - 0.5) * 10) / 10))}
        onInc={() => setBw(Math.min(300, Math.round((bw + 0.5) * 10) / 10))}
      />
      <Btn
        title="Kaydet"
        loading={update.isPending}
        disabled={!name.trim()}
        onPress={async () => {
          await update.mutateAsync({ name: name.trim(), color, body_weight: bw });
          onClose();
        }}
      />
    </Card>
  );
}
