import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Entry } from './challenge';
import { supabase } from './supabase';

// İnternetsiz kayıt: ekleme/düzenleme/silme önce bu sıraya yazılır, bağlantı varken
// sırayla sunucuya gönderilir. Kayıt kimlikleri telefonda üretildiği için tekrar
// gönderim aynı kaydı iki kez oluşturmaz.

export type EntryPatch = { weight: number; reps: number; distance: number };

export type OutboxOp =
  | { kind: 'insert'; id: string; row: Entry }
  | { kind: 'update'; id: string; patch: EntryPatch }
  | { kind: 'delete'; id: string };

const key = (uid: string) => `outbox:${uid}`;

export async function readOutbox(uid: string): Promise<OutboxOp[]> {
  const raw = await AsyncStorage.getItem(key(uid));
  return raw ? (JSON.parse(raw) as OutboxOp[]) : [];
}

async function writeOutbox(uid: string, ops: OutboxOp[]) {
  if (ops.length) await AsyncStorage.setItem(key(uid), JSON.stringify(ops));
  else await AsyncStorage.removeItem(key(uid));
}

/** Sıraya ekler; aynı kayda ait bekleyen işlemleri birleştirir. */
export function coalesce(ops: OutboxOp[], op: OutboxOp): OutboxOp[] {
  const pendingInsert = ops.find((o) => o.kind === 'insert' && o.id === op.id) as
    | Extract<OutboxOp, { kind: 'insert' }>
    | undefined;

  if (op.kind === 'update') {
    if (pendingInsert) {
      return ops.map((o) => (o === pendingInsert ? { ...o, row: { ...o.row, ...op.patch } } : o));
    }
    const prev = ops.find((o) => o.kind === 'update' && o.id === op.id);
    if (prev) return ops.map((o) => (o === prev ? op : o));
    return [...ops, op];
  }

  if (op.kind === 'delete') {
    const rest = ops.filter((o) => o.id !== op.id);
    // Sunucuya hiç gitmemiş bir kayıtsa silmek için sunucuya sormaya gerek yok.
    return pendingInsert ? rest : [...rest, op];
  }

  return [...ops, op];
}

/** Sunucudaki kayıtların üstüne bekleyen işlemleri uygular. */
export function applyOutbox(server: Entry[], ops: OutboxOp[]): Entry[] {
  const deleted = new Set(ops.filter((o) => o.kind === 'delete').map((o) => o.id));
  const updates = new Map(
    ops.filter((o): o is Extract<OutboxOp, { kind: 'update' }> => o.kind === 'update').map((o) => [o.id, o.patch]),
  );
  const serverIds = new Set(server.map((e) => e.id));
  const merged = server
    .filter((e) => !deleted.has(e.id))
    .map((e) => {
      const patch = updates.get(e.id);
      return patch ? { ...e, ...patch, edited: true, pending: true } : e;
    });
  for (const o of ops) {
    if (o.kind === 'insert' && !serverIds.has(o.id)) merged.push({ ...o.row, pending: true });
  }
  return merged;
}

export async function enqueue(uid: string, op: OutboxOp) {
  const ops = coalesce(await readOutbox(uid), op);
  await writeOutbox(uid, ops);
  return ops;
}

function isNetworkError(message: string) {
  const m = message.toLowerCase();
  return m.includes('network') || m.includes('fetch') || m.includes('timeout') || m.includes('offline');
}

let running: Promise<{ sent: number; left: number }> | null = null;

/** Bekleyen işlemleri sırayla gönderir. Ağ hatasında durur, kalıcı hatada o işlemi atlar. */
export function flushOutbox(uid: string) {
  if (!running) {
    running = doFlush(uid).finally(() => {
      running = null;
    });
  }
  return running;
}

async function doFlush(uid: string) {
  let ops = await readOutbox(uid);
  let sent = 0;
  while (ops.length) {
    const op = ops[0];
    let error: { message: string } | null = null;
    try {
      if (op.kind === 'insert') {
        const { pending: _pending, ...row } = op.row;
        ({ error } = await supabase.from('entries').upsert(row, { onConflict: 'id', ignoreDuplicates: true }));
      } else if (op.kind === 'update') {
        ({ error } = await supabase.from('entries').update({ ...op.patch, edited: true }).eq('id', op.id));
      } else {
        ({ error } = await supabase.from('entries').delete().eq('id', op.id));
      }
    } catch (e) {
      error = { message: (e as Error).message || 'network' };
    }
    if (error && isNetworkError(error.message)) break;
    // Başarılı ya da kalıcı hata (ör. geçersiz veri): sıradan çıkar.
    ops = ops.slice(1);
    await writeOutbox(uid, ops);
    if (!error) sent++;
  }
  return { sent, left: ops.length };
}
