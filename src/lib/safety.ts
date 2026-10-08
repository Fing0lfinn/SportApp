import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useUserId } from './auth';
import { supabase } from './supabase';

// Kullanıcıyı engelle ve şikayet et (App Store Guideline 1.2).
// Engellenen kişinin kayıtları, sıralaması ve akıştaki paylaşımları görünmez; ondan bildirim gelmez.
// Şikayetler Supabase'deki reports tablosuna yazılır ve oradan incelenir.

export type ReportReason = 'spam' | 'offensive' | 'harassment' | 'other';

function check<T>(res: { data: T; error: { message: string } | null }) {
  if (res.error) throw new Error(res.error.message);
  return res.data as NonNullable<T>;
}

const blocksKey = (uid: string) => ['blocks', uid] as const;

/** Engellediğin kişilerin kimlikleri. */
export function useBlocks() {
  const uid = useUserId();
  const q = useQuery({
    queryKey: blocksKey(uid),
    enabled: !!uid,
    queryFn: async () =>
      check(await supabase.from('blocks').select('blocked_id, created_at').eq('blocker_id', uid)).map(
        (b) => b.blocked_id,
      ),
  });
  const set = useMemo(() => new Set(q.data ?? []), [q.data]);
  return { ...q, set };
}

export function useSetBlocked() {
  const uid = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, blocked }: { userId: string; blocked: boolean }) => {
      if (blocked) {
        const { error } = await supabase.from('blocks').upsert(
          { blocker_id: uid, blocked_id: userId },
          { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true },
        );
        if (error) throw new Error(error.message);
      } else {
        check(await supabase.from('blocks').delete().eq('blocker_id', uid).eq('blocked_id', userId));
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: blocksKey(uid) }),
  });
}

export function useReport() {
  return useMutation({
    mutationFn: async (r: { userId: string; entryId?: string; reason: ReportReason; details: string }) =>
      check(
        await supabase.from('reports').insert({
          reported_id: r.userId,
          entry_id: r.entryId ?? null,
          reason: r.reason,
          details: r.details.trim().slice(0, 500),
        }),
      ),
  });
}

/** Engellenenler ekranı için adlar (aynı grupta olmayanların adı görünmez). */
export function useBlockedProfiles(ids: string[]) {
  return useQuery({
    queryKey: ['blockedProfiles', ids.join(',')],
    enabled: ids.length > 0,
    queryFn: async () =>
      check(await supabase.from('profiles').select('id, name, color').in('id', ids)),
  });
}
