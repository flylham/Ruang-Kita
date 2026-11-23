import { openDB, type IDBPDatabase } from 'idb';
import { supabase } from './supabase';

export type QueueOperation = 'insert' | 'update' | 'delete' | 'upsert';

export interface OfflineMutation {
  id: string;
  table: string;
  operation: QueueOperation;
  payload?: Record<string, unknown>;
  match?: Record<string, unknown>;
  upsertOptions?: { onConflict?: string };
  createdAt: number;
}

const DB_NAME = 'ruang_kita_sync_db';
const STORE_NAME = 'pending_mutations';

type Listener = (count: number) => void;
const listeners = new Set<Listener>();

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

async function notifyCount() {
  const all = await getPendingMutations();
  listeners.forEach((fn) => fn(all.length));
}

export function subscribeQueueCount(fn: Listener): () => void {
  listeners.add(fn);
  getPendingMutations()
    .then((items) => fn(items.length))
    .catch(() => fn(0));
  return () => {
    listeners.delete(fn);
  };
}

export async function getPendingMutations(): Promise<OfflineMutation[]> {
  const db = await getDb();
  const items = (await db.getAll(STORE_NAME)) as OfflineMutation[];
  return items.sort((a, b) => a.createdAt - b.createdAt);
}

export async function enqueueMutation(
  mutation: Omit<OfflineMutation, 'id' | 'createdAt'>
): Promise<OfflineMutation> {
  const db = await getDb();
  const entry: OfflineMutation = {
    ...mutation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };
  await db.put(STORE_NAME, entry);
  await notifyCount();
  return entry;
}

export async function removeMutation(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
  await notifyCount();
}

let isFlushing = false;

export async function flushOfflineQueue(): Promise<{ processed: number; remaining: number }> {
  if (!supabase || !navigator.onLine || isFlushing) {
    const pending = await getPendingMutations().catch(() => []);
    return { processed: 0, remaining: pending.length };
  }

  isFlushing = true;
  let processed = 0;

  try {
    const queue = await getPendingMutations();
    for (const item of queue) {
      if (!navigator.onLine) break;
      let error: unknown = null;

      if (item.operation === 'insert' && item.payload) {
        const res = await supabase.from(item.table).insert(item.payload);
        error = res.error;
      } else if (item.operation === 'upsert' && item.payload) {
        const res = await supabase
          .from(item.table)
          .upsert(item.payload, item.upsertOptions);
        error = res.error;
      } else if (item.operation === 'update' && item.payload && item.match) {
        const res = await supabase.from(item.table).update(item.payload).match(item.match);
        error = res.error;
      } else if (item.operation === 'delete' && item.match) {
        const res = await supabase.from(item.table).delete().match(item.match);
        error = res.error;
      }

      if (!error) {
        await removeMutation(item.id);
        processed += 1;
      } else {
        // Hentikan sementara bila jaringan masih bermasalah
        break;
      }
    }
  } finally {
    isFlushing = false;
  }

  const remaining = (await getPendingMutations().catch(() => [])).length;
  return { processed, remaining };
}

export async function mutateWithOfflineFallback(
  params: Omit<OfflineMutation, 'id' | 'createdAt'>
): Promise<{ queued: boolean; data?: unknown }> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi');
  }

  if (!navigator.onLine) {
    await enqueueMutation(params);
    return { queued: true };
  }

  try {
    if (params.operation === 'insert' && params.payload) {
      const { data, error } = await supabase.from(params.table).insert(params.payload).select().single();
      if (error) throw error;
      return { queued: false, data };
    }
    if (params.operation === 'upsert' && params.payload) {
      const { data, error } = await supabase
        .from(params.table)
        .upsert(params.payload, params.upsertOptions)
        .select()
        .single();
      if (error) throw error;
      return { queued: false, data };
    }
    if (params.operation === 'update' && params.payload && params.match) {
      const { data, error } = await supabase
        .from(params.table)
        .update(params.payload)
        .match(params.match)
        .select()
        .single();
      if (error) throw error;
      return { queued: false, data };
    }
    if (params.operation === 'delete' && params.match) {
      const { error } = await supabase.from(params.table).delete().match(params.match);
      if (error) throw error;
      return { queued: false };
    }
    return { queued: false };
  } catch (err) {
    // Jika gagal karena jaringan terputus, simpan di IndexedDB
    if (!navigator.onLine || (err instanceof TypeError && err.message.toLowerCase().includes('fetch'))) {
      await enqueueMutation(params);
      return { queued: true };
    }
    throw err;
  }
}
