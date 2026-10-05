import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useUserId } from './auth';
import { computeStats, type Entry, type ExerciseKey, type UserStats } from './challenge';
import type { Tables } from './database.types';
import { supabase } from './supabase';

export type Profile = Tables<'profiles'>;
export type Group = Tables<'groups'>;
export type Membership = { group: Group; role: 'admin' | 'member'; status: 'active' | 'pending' };
export type Player = {
  id: string;
  name: string;
  color: string;
  bodyWeight: number | null;
  role: 'admin' | 'member';
  status: 'active' | 'pending';
  isMe: boolean;
  entries: Entry[];
  stats: UserStats;
};

function check<T>(res: { data: T; error: { message: string } | null }) {
  if (res.error) throw new Error(res.error.message);
  return res.data as NonNullable<T>;
}

/** Postgres numeric değerleri bazen metin gelebilir; hesaplardan önce sayıya çevir. */
function toEntry(e: Entry): Entry {
  return { ...e, weight: Number(e.weight), reps: Number(e.reps), distance: Number(e.distance) };
}

export type NotifyPrefs = { passed: boolean; friend_goal: boolean; friend_record: boolean };

export function notifyPrefs(p: Profile | undefined): NotifyPrefs {
  const n = (p?.notify ?? {}) as Partial<NotifyPrefs>;
  return { passed: n.passed ?? true, friend_goal: n.friend_goal ?? true, friend_record: n.friend_record ?? true };
}

export const keys = {
  profile: (uid: string) => ['profile', uid] as const,
  memberships: (uid: string) => ['memberships', uid] as const,
  activeGroup: (uid: string) => ['activeGroup', uid] as const,
  myEntries: (uid: string) => ['entries', 'me', uid] as const,
  group: (gid: string) => ['group', gid] as const,
  likes: (gid: string) => ['likes', gid] as const,
};

// ---------------------------------------------------------------- profil

export function useProfile() {
  const uid = useUserId();
  return useQuery({
    queryKey: keys.profile(uid),
    enabled: !!uid,
    queryFn: async () =>
      check(await supabase.from('profiles').select('*').eq('id', uid).single()) as Profile,
  });
}

export function useUpdateProfile() {
  const uid = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, 'name' | 'color' | 'body_weight' | 'onboarded' | 'notify'>>) =>
      check(await supabase.from('profiles').update(patch).eq('id', uid).select().single()),
    onSuccess: (p) => {
      qc.setQueryData(keys.profile(uid), p);
      qc.invalidateQueries({ queryKey: ['group'] });
    },
  });
}

// ---------------------------------------------------------------- gruplar

export function useMemberships() {
  const uid = useUserId();
  return useQuery({
    queryKey: keys.memberships(uid),
    enabled: !!uid,
    queryFn: async () => {
      const rows = check(
        await supabase
          .from('group_members')
          .select('role, status, groups(*)')
          .eq('user_id', uid)
          .order('joined_at'),
      );
      return rows
        .filter((r) => r.groups)
        .map((r) => ({ group: r.groups as Group, role: r.role, status: r.status }) as Membership);
    },
  });
}

const ACTIVE_KEY = 'activeGroupId';

/** Seçili grup: cihazda saklanır; yoksa ilk aktif grup. */
export function useActiveGroup() {
  const uid = useUserId();
  const qc = useQueryClient();
  const memberships = useMemberships();
  const stored = useQuery({
    queryKey: keys.activeGroup(uid),
    enabled: !!uid,
    queryFn: async () => (await AsyncStorage.getItem(`${ACTIVE_KEY}:${uid}`)) ?? '',
  });
  const active = (memberships.data ?? []).filter((m) => m.status === 'active');
  const current = active.find((m) => m.group.id === stored.data) ?? active[0] ?? null;

  const setActive = async (gid: string) => {
    await AsyncStorage.setItem(`${ACTIVE_KEY}:${uid}`, gid);
    qc.setQueryData(keys.activeGroup(uid), gid);
  };

  return {
    membership: current,
    group: current?.group ?? null,
    isAdmin: current?.role === 'admin',
    loading: memberships.isLoading || stored.isLoading,
    setActive,
  };
}

export function useCreateGroup() {
  const uid = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => check(await supabase.rpc('create_group', { p_name: name })),
    onSuccess: async (g) => {
      await AsyncStorage.setItem(`${ACTIVE_KEY}:${uid}`, g.id);
      qc.setQueryData(keys.activeGroup(uid), g.id);
      await qc.invalidateQueries({ queryKey: keys.memberships(uid) });
    },
  });
}

export function useJoinGroup() {
  const uid = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await supabase.rpc('join_group', { p_code: code });
      if (res.error) {
        throw new Error(res.error.message.includes('invalid_code') ? 'Bu kodla bir grup bulunamadı.' : res.error.message);
      }
      return res.data as { group_id: string; name: string; status: 'active' | 'pending' };
    },
    onSuccess: async (r) => {
      if (r.status === 'active') {
        await AsyncStorage.setItem(`${ACTIVE_KEY}:${uid}`, r.group_id);
        qc.setQueryData(keys.activeGroup(uid), r.group_id);
      }
      await qc.invalidateQueries({ queryKey: keys.memberships(uid) });
    },
  });
}

export function useLeaveGroup() {
  const uid = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (gid: string) =>
      check(await supabase.from('group_members').delete().eq('group_id', gid).eq('user_id', uid)),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.memberships(uid) }),
  });
}

// ---------------------------------------------------------------- grup yönetimi (yönetici)

export function useGroupAdmin(groupId: string | undefined) {
  const uid = useUserId();
  const qc = useQueryClient();
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['group'] }),
      qc.invalidateQueries({ queryKey: keys.memberships(uid) }),
    ]);
  const gid = groupId ?? '';

  const updateGroup = useMutation({
    mutationFn: async (patch: { name?: string; require_approval?: boolean }) =>
      check(await supabase.from('groups').update(patch).eq('id', gid).select().single()),
    onSuccess: refresh,
  });
  const regenerateCode = useMutation({
    mutationFn: async () => check(await supabase.rpc('regenerate_invite_code', { p_group: gid })),
    onSuccess: refresh,
  });
  const updateMember = useMutation({
    mutationFn: async ({ userId, ...patch }: { userId: string; role?: 'admin' | 'member'; status?: 'active' }) =>
      check(await supabase.from('group_members').update(patch).eq('group_id', gid).eq('user_id', userId).select()),
    onSuccess: refresh,
  });
  const removeMember = useMutation({
    mutationFn: async (userId: string) =>
      check(await supabase.from('group_members').delete().eq('group_id', gid).eq('user_id', userId)),
    onSuccess: refresh,
  });
  return { updateGroup, regenerateCode, updateMember, removeMember };
}

// ---------------------------------------------------------------- kayıtlar

export function useMyEntries() {
  const uid = useUserId();
  return useQuery({
    queryKey: keys.myEntries(uid),
    enabled: !!uid,
    queryFn: async () =>
      (check(await supabase.from('entries').select('*').eq('user_id', uid)) as Entry[]).map(toEntry),
  });
}

export function useMyStats() {
  const q = useMyEntries();
  const stats = useMemo(() => computeStats(q.data ?? []), [q.data]);
  return { ...q, stats };
}

/** Grubun üyeleri, profilleri ve kayıtları + her biri için hesaplanmış istatistikler. */
export function useGroupBoard(groupId: string | undefined) {
  const uid = useUserId();
  const q = useQuery({
    queryKey: keys.group(groupId ?? ''),
    enabled: !!groupId,
    queryFn: async () => {
      const members = check(
        await supabase
          .from('group_members')
          .select('user_id, role, status, profiles(id, name, color, body_weight)')
          .eq('group_id', groupId!),
      );
      const activeIds = members.filter((m) => m.status === 'active').map((m) => m.user_id);
      const entries = activeIds.length
        ? (check(await supabase.from('entries').select('*').in('user_id', activeIds)) as Entry[]).map(toEntry)
        : [];
      return { members, entries };
    },
  });

  const players = useMemo<Player[]>(() => {
    if (!q.data) return [];
    return q.data.members.map((m) => {
      const own = q.data.entries.filter((e) => e.user_id === m.user_id);
      return {
        id: m.user_id,
        name: m.profiles?.name || 'İsimsiz',
        color: m.profiles?.color ?? '#C8F04A',
        bodyWeight: m.profiles?.body_weight ?? null,
        role: m.role as Player['role'],
        status: m.status as Player['status'],
        isMe: m.user_id === uid,
        entries: own,
        stats: computeStats(own),
      };
    });
  }, [q.data, uid]);

  const active = players.filter((p) => p.status === 'active');
  const ranked = [...active].sort((a, b) => b.stats.pct - a.stats.pct || b.stats.done - a.stats.done);
  return { ...q, players, active, ranked, pending: players.filter((p) => p.status === 'pending') };
}

export type EntryInput = {
  exercise: ExerciseKey;
  weight: number;
  reps: number;
  distance: number;
  performed_on: string;
  is_start?: boolean;
};

function useInvalidateEntries() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['entries'] }),
      qc.invalidateQueries({ queryKey: ['group'] }),
    ]);
}

export function useAddEntries() {
  const invalidate = useInvalidateEntries();
  return useMutation({
    mutationFn: async (rows: EntryInput[]) =>
      (check(await supabase.from('entries').insert(rows).select()) as Entry[]).map(toEntry),
    onSuccess: invalidate,
  });
}

export function useUpdateEntry() {
  const invalidate = useInvalidateEntries();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; weight: number; reps: number; distance: number }) =>
      check(await supabase.from('entries').update({ ...patch, edited: true }).eq('id', id).select().single()),
    onSuccess: invalidate,
  });
}

export function useDeleteEntry() {
  const invalidate = useInvalidateEntries();
  return useMutation({
    mutationFn: async (id: string) => check(await supabase.from('entries').delete().eq('id', id)),
    onSuccess: invalidate,
  });
}

// ---------------------------------------------------------------- beğeniler

export function useLikes(groupId: string | undefined, entryIds: string[]) {
  return useQuery({
    queryKey: [...keys.likes(groupId ?? ''), entryIds.length, entryIds[0] ?? ''],
    enabled: !!groupId && entryIds.length > 0,
    queryFn: async () =>
      check(await supabase.from('likes').select('entry_id, user_id').in('entry_id', entryIds)),
  });
}

export function useToggleLike() {
  const uid = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryId, liked }: { entryId: string; liked: boolean }) => {
      if (liked) {
        check(await supabase.from('likes').delete().eq('entry_id', entryId).eq('user_id', uid));
      } else {
        check(await supabase.from('likes').insert({ entry_id: entryId }));
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['likes'] }),
  });
}
