/**
 * LocalDB — Simple persistent storage layer for MVP.
 *
 * Uses localStorage in dev, can swap to Supabase/Postgres later
 * without changing any page code. Every page calls the same API.
 *
 * Pattern: each "table" is a key in localStorage holding a JSON array.
 * All CRUD goes through this module so we can swap the backend later.
 */

const PREFIX = "1pos_";

// ── Core CRUD ──

export function getAll<T>(table: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREFIX + table);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getById<T extends { id: string }>(table: string, id: string): T | null {
  const items = getAll<T>(table);
  return items.find((item) => item.id === id) ?? null;
}

export function create<T extends { id?: string }>(table: string, data: T): T & { id: string } {
  const items = getAll<T & { id: string }>(table);
  const record = {
    ...data,
    id: data.id ?? crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as T & { id: string };
  items.push(record);
  save(table, items);
  return record;
}

export function update<T extends { id: string }>(table: string, id: string, updates: Partial<T>): T | null {
  const items = getAll<T>(table);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() } as T;
  save(table, items);
  return items[index];
}

export function remove(table: string, id: string): boolean {
  const items = getAll<{ id: string }>(table);
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  save(table, filtered);
  return true;
}

export function upsert<T extends { id: string }>(table: string, data: T): T {
  const existing = getById<T>(table, data.id);
  if (existing) {
    return update<T>(table, data.id, data) as T;
  }
  return create(table, data) as T;
}

export function query<T>(table: string, filter: (item: T) => boolean): T[] {
  return getAll<T>(table).filter(filter);
}

export function count(table: string): number {
  return getAll(table).length;
}

// ── Batch operations ──

export function bulkCreate<T extends { id?: string }>(table: string, records: T[]): (T & { id: string })[] {
  const items = getAll<T & { id: string }>(table);
  const created = records.map((data) => ({
    ...data,
    id: (data as T & { id?: string }).id ?? crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })) as (T & { id: string })[];
  items.push(...created);
  save(table, items);
  return created;
}

export function clearTable(table: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFIX + table);
}

// ── Key-value store (for single objects like settings, company info) ──

export function getKV<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(PREFIX + "kv_" + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setKV<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + "kv_" + key, JSON.stringify(value));
  } catch {}
}

// ── Internal ──

function save(table: string, items: unknown[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + table, JSON.stringify(items));
  } catch {}
}

// ── Export/Import (for backup/restore) ──

export function exportAll(): Record<string, unknown[]> {
  if (typeof window === "undefined") return {};
  const result: Record<string, unknown[]> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) {
      const table = key.slice(PREFIX.length);
      try {
        result[table] = JSON.parse(localStorage.getItem(key) ?? "[]");
      } catch {}
    }
  }
  return result;
}

export function importAll(data: Record<string, unknown[]>): void {
  for (const [table, items] of Object.entries(data)) {
    save(table, items);
  }
}
