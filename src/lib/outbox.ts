import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from './supabase';

// İnternetsiz kayıt: ekleme/düzenleme/silme önce bu sıraya yazılır, bağlantı varken
// sırayla sunucuya gönderilir. Kayıt kimlikleri telefonda üretildiği için tekrar
// gönderim aynı kaydı iki kez oluşturmaz. Hareket kayıtları, öğünler, su ve kilo aynı sırayı kullanır.

export type OutboxTable = 'entries' | 'meals' | 'water_logs' | 'body_weights';

type Row = { id: string; pending?: boolean } & Record<string, unknown>;
type Patch = Record<string, unknown>;

/** `table` yoksa eski sürümden kalan bir hareket kaydıdır. */
export type OutboxOp =
  | { kind: 'insert'; table?: OutboxTable; id: string; row: Row }
  | { kind: 'update'; table?: OutboxTable; id: string; patch: Patch }
  | { kind: 'delete'; table?: OutboxTable; id: string };

const key = (uid: string) => `outbox:${uid}`;

export const tableOf = (op: OutboxOp): OutboxTable => op.table ?? 'entries';
const sameRecord = (a: OutboxOp, b: OutboxOp) => tableOf(a) === tableOf(b) && a.id === b.id;
const opKey = (op: OutboxOp) => `${op.kind}:${tableOf(op)}:${op.id}`;

export async function readOutbox(uid: string): Promise<OutboxOp[]> {
  const raw = await AsyncStorage.getItem(key(uid));
  return raw ? (JSON.parse(raw) as OutboxOp[]) : [];
}

async function writeOutbox(uid: string, ops: OutboxOp[]) {
  if (ops.length) await AsyncStorage.setItem(key(uid), JSON.stringify(ops));
  else await AsyncStorage.removeItem(key(uid));
}

// Sıra telefonda tek bir değer olarak duruyor; oku-değiştir-yaz adımları üst üste binmesin diye sırayla çalışır.
let chain: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}

/** Şu an sunucuya gönderilmekte olan işlem (sıranın başı). Gönderim bitene kadar değiştirilmez. */
let inflight: { uid: string; key: string } | null = null;

function merge(ops: OutboxOp[], op: OutboxOp): OutboxOp[] {
  const pendingInsert = ops.find((o) => o.kind === 'insert' && sameRecord(o, op)) as
    | Extract<OutboxOp, { kind: 'insert' }>
    | undefined;

  if (op.kind === 'update') {
    if (pendingInsert) {
      return ops.map((o) => (o === pendingInsert ? { ...o, row: { ...o.row, ...op.patch } } : o));
    }
    const prev = ops.find((o) => o.kind === 'update' && sameRecord(o, op)) as
      | Extract<OutboxOp, { kind: 'update' }>
      | undefined;
    if (prev) return ops.map((o) => (o === prev ? { ...op, patch: { ...prev.patch, ...op.patch } } : o));
    return [...ops, op];
  }

  if (op.kind === 'delete') {
    const rest = ops.filter((o) => !sameRecord(o, op));
    // Sunucuya hiç gitmemiş bir kayıtsa silmek için sunucuya sormaya gerek yok.
    return pendingInsert ? rest : [...rest, op];
  }

  return [...ops, op];
}

/**
 * Sıraya ekler; aynı kayda ait bekleyen işlemleri birleştirir.
 * `lockHead`: ilk işlem şu an gönderiliyor, ona dokunma (gönderilmiş sayılır).
 */
export function coalesce(ops: OutboxOp[], op: OutboxOp, lockHead = false): OutboxOp[] {
  if (!lockHead || !ops.length) return merge(ops, op);
  return [ops[0], ...merge(ops.slice(1), op)];
}

/** Sunucudaki kayıtların üstüne bir tablonun bekleyen işlemlerini uygular. */
export function applyOutbox<T extends { id: string }>(
  server: T[],
  ops: OutboxOp[],
  table: OutboxTable = 'entries',
): (T & { pending?: boolean })[] {
  const mine = ops.filter((o) => tableOf(o) === table);
  const deleted = new Set(mine.filter((o) => o.kind === 'delete').map((o) => o.id));
  const updates = new Map(
    mine.filter((o): o is Extract<OutboxOp, { kind: 'update' }> => o.kind === 'update').map((o) => [o.id, o.patch]),
  );
  const extra = table === 'entries' ? { edited: true } : {};
  const serverIds = new Set(server.map((e) => e.id));
  const merged: (T & { pending?: boolean })[] = server
    .filter((e) => !deleted.has(e.id))
    .map((e) => {
      const patch = updates.get(e.id);
      return patch ? { ...e, ...patch, ...extra, pending: true } : e;
    });
  for (const o of mine) {
    if (o.kind === 'insert' && !serverIds.has(o.id) && !deleted.has(o.id)) {
      merged.push({ ...(o.row as unknown as T), pending: true });
    }
  }
  return merged;
}

export function enqueue(uid: string, op: OutboxOp) {
  return locked(async () => {
    const current = await readOutbox(uid);
    const busy = inflight?.uid === uid && !!current.length && opKey(current[0]) === inflight.key;
    const ops = coalesce(current, op, busy);
    await writeOutbox(uid, ops);
    return ops;
  });
}

function isNetworkError(message: string) {
  const m = message.toLowerCase();
  return m.includes('network') || m.includes('fetch') || m.includes('timeout') || m.includes('offline');
}

const running = new Map<string, Promise<{ sent: number; left: number }>>();

/** Bekleyen işlemleri sırayla gönderir. Ağ hatasında durur, kalıcı hatada o işlemi atlar. */
export function flushOutbox(uid: string) {
  let run = running.get(uid);
  if (!run) {
    run = doFlush(uid).finally(() => running.delete(uid));
    running.set(uid, run);
  }
  return run;
}

async function send(op: OutboxOp): Promise<{ message: string } | null> {
  const table = tableOf(op);
  // Tablo adı çalışma anında belli; tip denetimi her tablonun kendi hook'unda yapılıyor.
  const q = supabase.from(table as 'entries');
  if (op.kind === 'insert') {
    const { pending: _pending, ...row } = op.row;
    return (await q.upsert(row as never, { onConflict: 'id', ignoreDuplicates: true })).error;
  }
  if (op.kind === 'update') {
    const patch = table === 'entries' ? { ...op.patch, edited: true } : op.patch;
    return (await q.update(patch as never).eq('id', op.id)).error;
  }
  return (await q.delete().eq('id', op.id)).error;
}

async function doFlush(uid: string) {
  let sent = 0;
  for (;;) {
    // Sıranın başını her turda yeniden oku: gönderim sürerken eklenenler kaybolmasın.
    const op = await locked(async () => {
      const first = (await readOutbox(uid))[0] ?? null;
      inflight = first ? { uid, key: opKey(first) } : null;
      return first;
    });
    if (!op) break;

    let error: { message: string } | null;
    try {
      error = await send(op);
    } catch (e) {
      error = { message: (e as Error).message || 'network' };
    }
    const retryLater = !!error && isNetworkError(error.message);

    await locked(async () => {
      if (!retryLater) {
        // Başarılı ya da kalıcı hata (ör. geçersiz veri): sadece gönderilen işlemi sıradan çıkar.
        const ops = await readOutbox(uid);
        if (ops.length && opKey(ops[0]) === opKey(op)) await writeOutbox(uid, ops.slice(1));
      }
      inflight = null;
    });
    if (retryLater) break;
    if (!error) sent++;
  }
  return { sent, left: (await readOutbox(uid)).length };
}
