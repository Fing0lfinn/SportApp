import * as Crypto from 'expo-crypto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useUserId } from './auth';
import { todayISO } from './challenge';
import { fetchAll, useOutbox, useOutboxWrite } from './data';
import type { Json, Tables } from './database.types';
import { applyOutbox } from './outbox';
import { supabase } from './supabase';
import { DEFAULT_WATER } from './targets';

// Kişisel hedef (kilo verme/alma, kas, koruma), günlük kalori/protein/su hedefleri ve kilo takibi.
// Bu veriler sadece kişinin kendisine görünür (RLS).

export {
  ACTIVITIES,
  ACTIVITY_FACTOR,
  ageFromBirthYear,
  calcTargets,
  DEFAULT_WATER,
  GOALS,
  KCAL_FLOOR,
  PACES,
  type Activity,
  type Goal,
  type Sex,
  type TargetInput,
  type Targets,
} from './targets';
export type HealthSettings = Tables<'health_settings'>;

// ---------------------------------------------------------------- ayarlar

const settingsKey = (uid: string) => ['health', uid] as const;

export function useHealthSettings() {
  const uid = useUserId();
  return useQuery({
    queryKey: settingsKey(uid),
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from('health_settings').select('*').eq('user_id', uid).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export type HealthPatch = Partial<Omit<HealthSettings, 'user_id' | 'updated_at'>>;

export function useSaveHealthSettings() {
  const uid = useUserId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: HealthPatch) => {
      const { data, error } = await supabase
        .from('health_settings')
        .upsert({ ...patch, user_id: uid, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onMutate: async (patch) => {
      // Ekran beklemesin: yerelde hemen uygula, hata olursa geri al.
      await qc.cancelQueries({ queryKey: settingsKey(uid) });
      const prev = qc.getQueryData<HealthSettings | null>(settingsKey(uid));
      if (prev) qc.setQueryData(settingsKey(uid), { ...prev, ...patch });
      return { prev };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.prev) qc.setQueryData(settingsKey(uid), ctx.prev);
    },
    onSuccess: (data) => qc.setQueryData(settingsKey(uid), data),
  });
}

/** Günlük hedefler: kayıtlı değilse null (su için varsayılan var). */
export function useDailyTargets() {
  const s = useHealthSettings();
  const d = s.data;
  return {
    loading: s.isLoading,
    hasGoal: !!d?.goal,
    kcal: d?.kcal_target ?? null,
    protein: d?.protein_target ?? null,
    water: d?.water_target ?? DEFAULT_WATER,
  };
}

/** Favoriler: katalog yiyeceğinin anahtarı ya da elle girilen yiyecek. */
export type CustomFood = { name: string; kcal: number; protein: number; carbs: number; fat: number };
export type Favorite = string | CustomFood;

export function favoritesOf(s: HealthSettings | null | undefined): Favorite[] {
  const raw = (s?.favorites ?? []) as unknown;
  return Array.isArray(raw)
    ? (raw.filter((f) => typeof f === 'string' || (f && typeof f === 'object' && 'name' in f)) as Favorite[])
    : [];
}

export const favoriteId = (f: Favorite) => (typeof f === 'string' ? `food:${f}` : `custom:${f.name.toLowerCase()}`);

export function useToggleFavorite() {
  const settings = useHealthSettings();
  const save = useSaveHealthSettings();
  /** `onlyAdd`: zaten favoriyse çıkarma (elle girilen yiyeceği favoriye eklerken). */
  return (f: Favorite, onlyAdd = false) => {
    const list = favoritesOf(settings.data);
    const id = favoriteId(f);
    const exists = list.some((x) => favoriteId(x) === id);
    if (exists && onlyAdd) return;
    const next = exists ? list.filter((x) => favoriteId(x) !== id) : [f, ...list].slice(0, 60);
    save.mutate({ favorites: next as unknown as Json });
  };
}

// ---------------------------------------------------------------- kilo takibi

export type BodyWeight = Tables<'body_weights'> & { pending?: boolean };

function sortWeights(a: BodyWeight, b: BodyWeight) {
  return a.measured_on.localeCompare(b.measured_on) || a.created_at.localeCompare(b.created_at);
}

/** Kilo ölçümleri, eskiden yeniye (telefonda bekleyenler dahil). */
export function useBodyWeights() {
  const uid = useUserId();
  const outbox = useOutbox();
  const q = useQuery({
    queryKey: ['weights', uid],
    enabled: !!uid,
    queryFn: async () =>
      (
        await fetchAll((from, to) =>
          supabase.from('body_weights').select('*').eq('user_id', uid).order('id').range(from, to),
        )
      ).map((w) => ({ ...w, weight: Number(w.weight) })),
  });
  const data = useMemo(
    () =>
      q.data || outbox.data?.length
        ? applyOutbox<BodyWeight>(q.data ?? [], outbox.data ?? [], 'body_weights')
            .map((w) => ({ ...w, weight: Number(w.weight) }))
            .sort(sortWeights)
        : undefined,
    [q.data, outbox.data],
  );
  return { ...q, data, isLoading: q.isLoading && !data };
}

/** Bugünün ölçümü varsa onu günceller, yoksa yeni ölçüm ekler (internetsiz de çalışır). */
export function useLogWeight() {
  const uid = useUserId();
  const write = useOutboxWrite();
  const weights = useBodyWeights();
  return useMutation({
    networkMode: 'always',
    mutationFn: async ({ weight, day = todayISO() }: { weight: number; day?: string }) => {
      const existing = [...(weights.data ?? [])].reverse().find((w) => w.measured_on === day);
      if (existing) {
        await write({ kind: 'update', table: 'body_weights', id: existing.id, patch: { weight } });
        return;
      }
      const id = Crypto.randomUUID();
      await write({
        kind: 'insert',
        table: 'body_weights',
        id,
        row: { id, user_id: uid, weight, measured_on: day, created_at: new Date().toISOString() },
      });
    },
  });
}

export function useDeleteWeight() {
  const write = useOutboxWrite();
  return useMutation({
    networkMode: 'always',
    mutationFn: async (id: string) => write({ kind: 'delete', table: 'body_weights', id }),
  });
}
