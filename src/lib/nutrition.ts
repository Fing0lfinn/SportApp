import * as Crypto from 'expo-crypto';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Lang } from '@/i18n';

import { useUserId } from './auth';
import { isoFromIndex, todayISO } from './challenge';
import { useOutbox, useOutboxWrite } from './data';
import type { Json, Tables } from './database.types';
import { FOOD_BY_KEY, foodName, type PortionUnit } from './foods';
import { applyOutbox } from './outbox';
import { supabase } from './supabase';

// Öğünler ve su: sadece kişinin kendisine görünür. Kayıtlar internetsiz de girilir (outbox).

export type Slot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const SLOTS: Slot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export type MealItem = {
  /** Katalog yiyeceğinin anahtarı; elle girilenlerde yok */
  food?: string;
  name: string;
  unit: PortionUnit | 'g';
  qty: number;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Meal = Omit<Tables<'meals'>, 'items'> & { items: MealItem[]; pending?: boolean };
export type WaterLog = Tables<'water_logs'> & { pending?: boolean };

export type Totals = { kcal: number; protein: number; carbs: number; fat: number };

const r1 = (v: number) => Math.round(v * 10) / 10;

export function sumItems(items: Pick<MealItem, 'kcal' | 'protein' | 'carbs' | 'fat'>[]): Totals {
  const t = items.reduce(
    (a, i) => ({
      kcal: a.kcal + (Number(i.kcal) || 0),
      protein: a.protein + (Number(i.protein) || 0),
      carbs: a.carbs + (Number(i.carbs) || 0),
      fat: a.fat + (Number(i.fat) || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  return { kcal: Math.round(t.kcal), protein: r1(t.protein), carbs: r1(t.carbs), fat: r1(t.fat) };
}

/** Kalemin gösterilecek adı: katalog yiyeceğiyse seçili dilde. */
export function itemName(item: Pick<MealItem, 'food' | 'name'>, lang: Lang) {
  const food = item.food ? FOOD_BY_KEY[item.food] : undefined;
  return food ? foodName(food, lang) : item.name;
}

function toMeal(m: Record<string, unknown>): Meal {
  const raw = m.items;
  return {
    ...(m as unknown as Meal),
    items: Array.isArray(raw) ? (raw as MealItem[]) : [],
    kcal: Number(m.kcal) || 0,
    protein: Number(m.protein) || 0,
    carbs: Number(m.carbs) || 0,
    fat: Number(m.fat) || 0,
  };
}

function check<T>(res: { data: T; error: { message: string } | null }) {
  if (res.error) throw new Error(res.error.message);
  return res.data as NonNullable<T>;
}

// ---------------------------------------------------------------- öğünler

/** Bir günün öğünleri (telefonda bekleyenler dahil). */
export function useMeals(day: string) {
  const uid = useUserId();
  const outbox = useOutbox();
  const q = useQuery({
    queryKey: ['meals', uid, day],
    enabled: !!uid,
    queryFn: async () =>
      check(await supabase.from('meals').select('*').eq('user_id', uid).eq('eaten_on', day).order('created_at')),
  });
  const data = useMemo(
    () =>
      q.data || outbox.data?.length
        ? applyOutbox<Record<string, unknown> & { id: string }>(q.data ?? [], outbox.data ?? [], 'meals')
            .map(toMeal)
            .filter((m) => m.eaten_on === day)
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
        : undefined,
    [q.data, outbox.data, day],
  );
  return { ...q, data, isLoading: q.isLoading && !data };
}

/** Son 30 günün öğünleri: "son yediklerim" için. */
export function useRecentMeals() {
  const uid = useUserId();
  const outbox = useOutbox();
  const since = isoFromIndex(-30, todayISO());
  const q = useQuery({
    queryKey: ['meals', uid, 'recent', since],
    enabled: !!uid,
    queryFn: async () =>
      check(
        await supabase
          .from('meals')
          .select('*')
          .eq('user_id', uid)
          .gte('eaten_on', since)
          .order('created_at', { ascending: false })
          .limit(300),
      ),
  });
  const data = useMemo(
    () =>
      applyOutbox<Record<string, unknown> & { id: string }>(q.data ?? [], outbox.data ?? [], 'meals')
        .map(toMeal)
        .filter((m) => m.eaten_on >= since)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [q.data, outbox.data, since],
  );
  return { ...q, data };
}

export function useSaveMeal() {
  const uid = useUserId();
  const write = useOutboxWrite();
  return useMutation({
    networkMode: 'always',
    mutationFn: async ({
      id,
      day,
      slot,
      items,
      lang,
    }: {
      id?: string;
      day: string;
      slot: Slot;
      items: MealItem[];
      lang: Lang;
    }) => {
      const totals = sumItems(items);
      const name = items
        .map((i) => itemName(i, lang))
        .join(', ')
        .slice(0, 160);
      const fields = { slot, name, items: items as unknown as Json, ...totals };
      if (id) {
        await write({ kind: 'update', table: 'meals', id, patch: fields });
        return id;
      }
      const newId = Crypto.randomUUID();
      await write({
        kind: 'insert',
        table: 'meals',
        id: newId,
        row: { id: newId, user_id: uid, eaten_on: day, created_at: new Date().toISOString(), ...fields },
      });
      return newId;
    },
  });
}

export function useDeleteMeal() {
  const write = useOutboxWrite();
  return useMutation({
    networkMode: 'always',
    mutationFn: async (id: string) => write({ kind: 'delete', table: 'meals', id }),
  });
}

// ---------------------------------------------------------------- su

/** Bir günün su kayıtları (telefonda bekleyenler dahil). */
export function useWater(day: string) {
  const uid = useUserId();
  const outbox = useOutbox();
  const q = useQuery({
    queryKey: ['water', uid, day],
    enabled: !!uid,
    queryFn: async () =>
      check(await supabase.from('water_logs').select('*').eq('user_id', uid).eq('drunk_on', day).order('created_at')),
  });
  const data = useMemo(
    () =>
      q.data || outbox.data?.length
        ? applyOutbox<WaterLog>(q.data ?? [], outbox.data ?? [], 'water_logs')
            .filter((w) => w.drunk_on === day)
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
        : undefined,
    [q.data, outbox.data, day],
  );
  const total = useMemo(() => (data ?? []).reduce((s, w) => s + (Number(w.ml) || 0), 0), [data]);
  return { ...q, data, total, isLoading: q.isLoading && !data };
}

export function useAddWater() {
  const uid = useUserId();
  const write = useOutboxWrite();
  return useMutation({
    networkMode: 'always',
    mutationFn: async ({ ml, day }: { ml: number; day: string }) => {
      const id = Crypto.randomUUID();
      await write({
        kind: 'insert',
        table: 'water_logs',
        id,
        row: { id, user_id: uid, drunk_on: day, ml, created_at: new Date().toISOString() },
      });
    },
  });
}

export function useDeleteWater() {
  const write = useOutboxWrite();
  return useMutation({
    networkMode: 'always',
    mutationFn: async (id: string) => write({ kind: 'delete', table: 'water_logs', id }),
  });
}
