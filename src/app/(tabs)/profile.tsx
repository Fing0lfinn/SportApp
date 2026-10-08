import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import Animated, { ZoomIn } from 'react-native-reanimated';

import { Hexagon } from '@/components/hexagon';
import { FlameIcon, Icon, type IconName } from '@/components/icon';
import { Avatar, Bar, Btn, Card, Field, Loading, Screen, Stepper, styles, Txt } from '@/components/ui';
import { AVATAR_COLORS, C } from '@/constants/theme';
import { LANGS, useLang, useStrings } from '@/i18n';
import { computeBadges } from '@/lib/badges';
import { endISO, exStats, fmt, fmtShort, formatDate, strengthRatio, unitOf, XP } from '@/lib/challenge';
import { useActiveGroup, useGroupBoard, useMyStats, useProfile, useUpdateProfile } from '@/lib/data';
import { forgetPushToken } from '@/lib/notifications';
import { MONETIZATION } from '@/lib/config';
import { usePro } from '@/lib/pro';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const t = useStrings();
  const lang = useLang();
  const profile = useProfile();
  const mine = useMyStats();
  const ch = mine.challenge;
  const pro = usePro();
  const { group, isAdmin } = useActiveGroup();
  const board = useGroupBoard(ch);
  const [editing, setEditing] = useState(false);
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!profile.data || mine.isLoading) return <Loading />;
  const p = profile.data;
  const s = mine.stats;
  const rank = board.ranked.findIndex((x) => x.isMe) + 1;
  const ratio = strengthRatio(s, p.body_weight, ch);
  const badges = computeBadges(s, p.body_weight, ch);
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
            {group ? `${group.name}${rank ? ` · ${t.profile.rank(rank)}` : ''}` : t.profile.noGroup}
          </Txt>
          <Txt size={15} color={C.sub}>
            {p.body_weight ? `${fmt(p.body_weight)} kg` : t.profile.noWeight}
            {ratio ? ` · ${t.profile.ratio(fmt(Math.round(ratio * 100) / 100))}` : ''}
          </Txt>
        </View>
      </View>

      {editing ? <EditProfile onClose={() => setEditing(false)} /> : null}

      <Card style={{ gap: 12 }}>
        <View style={styles.rowBetween}>
          <View>
            <Txt size={14} weight="semibold" color={C.sub}>
              {t.profile.level(s.level + 1)}
            </Txt>
            <Txt size={26} weight="black" color={C.accent}>
              {t.levels[s.level]}
            </Txt>
          </View>
          <Txt size={20} weight="extrabold">
            {t.common.xp(s.xp)}
          </Txt>
        </View>
        <Bar value={s.levelProgress} height={10} delay={200} />
        <Txt size={14} color={C.sub}>
          {s.nextLevelXp !== null ? t.profile.nextLevel(t.levels[s.level + 1], s.nextLevelXp - s.xp) : t.profile.maxLevel}
        </Txt>
        <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10 }}>
          <Txt size={13} color={C.sub}>
            {t.profile.xpRules(XP.entry, XP.record, XP.milestone, XP.goal)}
          </Txt>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Stat icon={<FlameIcon size={20} />} value={s.streak} label={t.profile.statStreak} />
        <Stat icon={<Icon name="bolt" size={20} color={C.gold} />} value={s.records} label={t.profile.statRecords} />
        <Stat icon={<Icon name="check" size={20} color={C.accent} stroke={3} />} value={s.entries} label={t.profile.statEntries} />
      </View>

      <View style={{ gap: 12 }}>
        <View style={styles.rowBetween}>
          <Txt size={20} weight="extrabold">
            {t.profile.badges}
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
                accessibilityLabel={`${b.name}, ${b.earned ? t.profile.earned : t.profile.locked}`}
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
          {t.profile.startToNow}
        </Txt>
        <Card style={{ paddingVertical: 6 }}>
          {ch.exercises.map((ex, i) => {
            const st = exStats(s, ex.key);
            const gain = Math.round((st.best - st.start) * 100) / 100;
            return (
              <View
                key={ex.key}
                style={[styles.row, { paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.line, gap: 10 }]}>
                <Txt size={15} weight="semibold" style={{ flex: 1 }} numberOfLines={1}>
                  {ex.name}
                </Txt>
                <Txt size={15} color={C.sub}>
                  {fmtShort(ex, st.start)} →{' '}
                  <Txt size={15} weight="bold">
                    {fmtShort(ex, st.best)}
                    {ex.type === 'reps' ? '' : ` ${unitOf(ex, st.best)}`.trimEnd()}
                  </Txt>
                </Txt>
                <Txt size={15} weight="extrabold" color={gain > 0 ? C.accent : C.muted} style={{ minWidth: 52, textAlign: 'right' }}>
                  {gain > 0 ? `+${ex.type === 'time' ? fmtShort(ex, gain) : fmt(gain)}` : '–'}
                </Txt>
              </View>
            );
          })}
        </Card>
      </View>

      <View style={{ gap: 10 }}>
        <Txt size={20} weight="extrabold">
          {t.profile.tools}
        </Txt>
        {MONETIZATION ? (
          <MenuRow
            icon="star"
            title={pro.isPro ? t.profile.proActive : t.profile.pro}
            sub={pro.isPro ? t.profile.proActiveSub : t.profile.proSub}
            onPress={() => router.push('/pro')}
          />
        ) : null}
        <MenuRow icon="target" title={t.goals.title} sub={t.goals.menuSub} onPress={() => router.push('/goals')} />
        <MenuRow icon="scale" title={t.weight.title} sub={t.weight.menuSub} onPress={() => router.push('/weight')} />
        <MenuRow icon="bolt" title={t.profile.wrapped} sub={t.profile.wrappedSub} onPress={() => router.push('/wrapped')} />
        <MenuRow
          icon="board"
          title={t.profile.final}
          sub={t.profile.finalSub(formatDate(endISO(ch.start)))}
          onPress={() => router.push('/final')}
        />
        <MenuRow icon="calendar" title={t.profile.month} sub={t.profile.monthSub} onPress={() => router.push('/month')} />
        <MenuRow icon="scale" title={t.profile.plates} sub={t.profile.platesSub} onPress={() => router.push('/plates')} />
        <MenuRow icon="bell" title={t.profile.notifications} sub={t.profile.notificationsSub} onPress={() => router.push('/notifications')} />
        <MenuRow
          icon="globe"
          title={t.profile.language}
          sub={LANGS.find((l) => l.code === lang)?.name ?? ''}
          onPress={() => router.push('/language')}
        />
        {isAdmin ? (
          <>
            <MenuRow icon="target" title={t.profile.challenge} sub={t.profile.challengeSub} onPress={() => router.push('/challenge')} />
            <MenuRow icon="settings" title={t.profile.admin} sub={t.profile.adminSub} onPress={() => router.push('/group-admin')} />
          </>
        ) : null}
        <MenuRow icon="user" title={t.profile.edit} sub={t.profile.editSub} onPress={() => setEditing(!editing)} />
        <MenuRow icon="home" title={t.board.groups} sub={t.profile.groupsSub} onPress={() => router.push('/groups')} />
        <MenuRow icon="block" title={t.safety.blockedList} sub={t.safety.blockedMenuSub} onPress={() => router.push('/blocked')} />
        <Btn
          kind="danger"
          title={t.profile.signOut}
          icon="logout"
          onPress={async () => {
            await forgetPushToken().catch(() => {});
            await supabase.auth.signOut();
            qc.clear();
          }}
        />
        <Btn
          kind={confirmDelete ? 'primary' : 'ghost'}
          height={48}
          style={confirmDelete ? { backgroundColor: C.dangerFill } : undefined}
          title={confirmDelete ? t.profile.deleteConfirm : t.profile.deleteAccount}
          loading={deleting}
          onPress={async () => {
            if (!confirmDelete) {
              setConfirmDelete(true);
              return;
            }
            setDeleting(true);
            setDeleteError('');
            const { error } = await supabase.rpc('delete_account');
            if (error) {
              setDeleting(false);
              setDeleteError(t.profile.deleteError);
              return;
            }
            await forgetPushToken().catch(() => {});
            await supabase.auth.signOut();
            qc.clear();
          }}
        />
        {deleteError ? (
          <Txt size={14} color={C.danger} style={{ textAlign: 'center' }}>
            {deleteError}
          </Txt>
        ) : null}
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
  const t = useStrings();
  const profile = useProfile();
  const update = useUpdateProfile();
  const [name, setName] = useState(profile.data?.name ?? '');
  const [color, setColor] = useState(profile.data?.color ?? AVATAR_COLORS[0]);
  const [bw, setBw] = useState(Number(profile.data?.body_weight ?? 80));

  return (
    <Card style={{ gap: 16 }}>
      <Field label={t.profile.nameLabel} value={name} onChangeText={(v) => setName(v.slice(0, 24))} style={{ backgroundColor: C.surface2 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {AVATAR_COLORS.map((c) => (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={t.profile.colorLabel(c)}
            accessibilityState={{ selected: c === color }}
            onPress={() => setColor(c)}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c, borderWidth: c === color ? 3 : 0, borderColor: C.text }}
          />
        ))}
      </View>
      <Stepper
        title={t.profile.bodyWeight}
        sub="kg"
        value={fmt(bw)}
        onDec={() => setBw(Math.max(30, Math.round((bw - 0.5) * 10) / 10))}
        onInc={() => setBw(Math.min(300, Math.round((bw + 0.5) * 10) / 10))}
      />
      <Btn
        title={t.common.save}
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
