import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { strings, useLang } from '@/i18n';

import { useUserId } from './auth';
import {
  buildChallenge,
  computeStats,
  DEFAULT_ROWS,
  todayISO,
  type Challenge,
  type Entry,
  type ExerciseRow,
  type UserStats,
} from './challenge';
import type { Json, Tables } from './database.types';
import { applyOutbox, enqueue, flushOutbox, readOutbox, type EntryPatch, type OutboxOp } from './outbox';
import { supabase } from './supabase';

export type Profile = Tables<'profiles'>;
export type Group = Tables<'groups'>;
export type Membership = {
  group: Group;
  role: 'admin' | 'member';
  status: 'active' | 'pending';
  exercises: ExerciseRow[];
};
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
  outbox: (uid: string) => ['outbox', uid] as const,
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
    mutationFn: async (
      patch: Partial<Pick<Profile, 'name' | 'color' | 'body_weight' | 'onboarded' | 'notify' | 'locale'>>,
    ) =>
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
          .select('role, status, groups(*, group_exercises(*))')
          .eq('user_id', uid)
          .order('joined_at'),
      );
      return rows
        .filter((r) => r.groups)
        .map((r) => {
          const { group_exercises, ...group } = r.groups!;
          return {
            group: group as Group,
            role: r.role,
            status: r.status,
            exercises: (group_exercises ?? []).map((x) => ({ ...x, goal: Number(x.goal) })),
          } as Membership;
        });
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

/**
 * Aktif grubun meydan okuması: başlangıç tarihi ve hareketleri.
 * Grubu olmayan kişi ilk sürümün 9 hareketiyle, hesabını açtığı günden başlar.
 */
export function useChallenge(): Challenge {
  const lang = useLang();
  const { membership } = useActiveGroup();
  const profile = useProfile();
  const createdAt = profile.data?.created_at;
  return useMemo(() => {
    if (membership && membership.exercises.length) {
      return buildChallenge(membership.group.id, membership.group.start_date, membership.exercises, lang);
    }
    const start = createdAt ? todayISO(new Date(createdAt)) : todayISO();
    return buildChallenge(membership?.group.id ?? null, membership?.group.start_date ?? start, DEFAULT_ROWS, lang);
  }, [membership, createdAt, lang]);
}

/** Grubun hareketleri sunucuya gidecek biçimde */
function rowsJson(rows: ExerciseRow[]): Json {
  return rows.map((r, i) => ({
    exercise: r.exercise,
    type: r.type,
    goal: r.goal,
    per_hand: r.per_hand,
    distance: r.distance,
    name: r.name,
    position: i,
  }));
}

export function useCreateGroup() {
  const uid = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, start, exercises }: { name: string; start?: string; exercises?: ExerciseRow[] }) =>
      check(
        await supabase.rpc('create_group', {
          p_name: name,
          p_start: start,
          p_exercises: exercises ? rowsJson(exercises) : undefined,
        }),
      ),
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
        throw new Error(res.error.message.includes('invalid_code') ? strings().groups.invalidCode : res.error.message);
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
    mutationFn: async (patch: { name?: string; require_approval?: boolean; start_date?: string }) =>
      check(await supabase.from('groups').update(patch).eq('id', gid).select().single()),
    onSuccess: refresh,
  });
  /** Hareket listesini kaydeder: listede olmayanları siler, kalanları sırasıyla yazar. */
  const saveExercises = useMutation({
    mutationFn: async (rows: ExerciseRow[]) => {
      const keep = rows.map((r) => `"${r.exercise}"`).join(',');
      check(await supabase.from('group_exercises').delete().eq('group_id', gid).not('exercise', 'in', `(${keep})`));
      check(
        await supabase.from('group_exercises').upsert(
          rows.map((r, i) => ({
            group_id: gid,
            exercise: r.exercise,
            type: r.type,
            goal: r.goal,
            per_hand: r.per_hand,
            distance: r.distance,
            name: r.name,
            position: i,
          })),
          { onConflict: 'group_id,exercise' },
        ),
      );
    },
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
  return { updateGroup, saveExercises, regenerateCode, updateMember, removeMember };
}

// ---------------------------------------------------------------- kayıtlar

/** Telefonda bekleyen (henüz gönderilmemiş) işlemler. */
export function useOutbox() {
  const uid = useUserId();
  return useQuery({
    queryKey: keys.outbox(uid),
    enabled: !!uid,
    networkMode: 'always',
    staleTime: Infinity,
    queryFn: () => readOutbox(uid),
  });
}

/** Kendi kayıtların: sunucudakiler + telefonda bekleyenler. */
export function useMyEntries() {
  const uid = useUserId();
  const outbox = useOutbox();
  const q = useQuery({
    queryKey: keys.myEntries(uid),
    enabled: !!uid,
    queryFn: async () =>
      (check(await supabase.from('entries').select('*').eq('user_id', uid)) as Entry[]).map(toEntry),
  });
  const data = useMemo(
    () => (q.data || outbox.data?.length ? applyOutbox(q.data ?? [], outbox.data ?? []) : undefined),
    [q.data, outbox.data],
  );
  return { ...q, data, isLoading: q.isLoading && !data };
}

export function useMyStats() {
  const q = useMyEntries();
  const ch = useChallenge();
  const stats = useMemo(() => computeStats(q.data ?? [], ch), [q.data, ch]);
  return { ...q, stats, challenge: ch };
}

/** Grubun üyeleri, profilleri ve kayıtları + her biri için hesaplanmış istatistikler. */
export function useGroupBoard(ch: Challenge) {
  const uid = useUserId();
  const outbox = useOutbox();
  const groupId = ch.groupId;
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
      const server = q.data.entries.filter((e) => e.user_id === m.user_id);
      const own = m.user_id === uid ? applyOutbox(server, outbox.data ?? []) : server;
      return {
        id: m.user_id,
        name: m.profiles?.name || strings().common.noName,
        color: m.profiles?.color ?? '#C8F04A',
        bodyWeight: m.profiles?.body_weight ?? null,
        role: m.role as Player['role'],
        status: m.status as Player['status'],
        isMe: m.user_id === uid,
        entries: own,
        stats: computeStats(own, ch),
      };
    });
  }, [q.data, uid, outbox.data, ch]);

  const active = players.filter((p) => p.status === 'active');
  const ranked = [...active].sort((a, b) => b.stats.pct - a.stats.pct || b.stats.done - a.stats.done);
  return { ...q, players, active, ranked, pending: players.filter((p) => p.status === 'pending') };
}

export type EntryInput = {
  exercise: string;
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

/** Sıraya yazar, ekranı hemen günceller, sonra göndermeyi dener. */
function useOutboxWrite() {
  const uid = useUserId();
  const qc = useQueryClient();
  const sync = useSyncOutbox();
  return async (op: OutboxOp) => {
    const ops = await enqueue(uid, op);
    qc.setQueryData(keys.outbox(uid), ops);
    sync();
  };
}

/** Bekleyen işlemleri gönderir; gidenler olursa verileri tazeler. */
export function useSyncOutbox() {
  const uid = useUserId();
  const qc = useQueryClient();
  return useCallback(() => {
    if (!uid) return;
    flushOutbox(uid)
      .then(async ({ sent }) => {
        if (sent) {
          await Promise.all([
            qc.invalidateQueries({ queryKey: ['entries'] }),
            qc.invalidateQueries({ queryKey: ['group'] }),
          ]);
        }
        qc.setQueryData(keys.outbox(uid), await readOutbox(uid));
      })
      .catch(() => {});
  }, [uid, qc]);
}

/** Yeni kayıt: internet olmasa da kaydedilir. */
export function useLogEntry() {
  const uid = useUserId();
  const write = useOutboxWrite();
  return useMutation({
    networkMode: 'always',
    mutationFn: async (input: EntryInput) => {
      const row: Entry = {
        id: Crypto.randomUUID(),
        user_id: uid,
        exercise: input.exercise,
        weight: input.weight,
        reps: input.reps,
        distance: input.distance,
        is_start: !!input.is_start,
        performed_on: input.performed_on,
        edited: false,
        created_at: new Date().toISOString(),
      };
      await write({ kind: 'insert', id: row.id, row });
      return row;
    },
  });
}

export function useUpdateEntry() {
  const write = useOutboxWrite();
  return useMutation({
    networkMode: 'always',
    mutationFn: async ({ id, ...patch }: { id: string } & EntryPatch) => write({ kind: 'update', id, patch }),
  });
}

export function useDeleteEntry() {
  const write = useOutboxWrite();
  return useMutation({
    networkMode: 'always',
    mutationFn: async (id: string) => write({ kind: 'delete', id }),
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
