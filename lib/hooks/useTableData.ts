"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTableDataOptions {
  /** Extra query params for filtering, e.g. { round_id: "abc" } */
  filter?: Record<string, string>;
  /** Column to order by (default: created_at) */
  orderBy?: string;
  /** Ascending order (default: false = newest first) */
  ascending?: boolean;
}

export function useTableData<T extends { id: string }>(
  table: string,
  options?: UseTableDataOptions
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const buildUrl = useCallback(
    (extra?: Record<string, string>) => {
      const params = new URLSearchParams();
      if (options?.orderBy) params.set("order", options.orderBy);
      if (options?.ascending) params.set("asc", "true");
      if (options?.filter) {
        Object.entries(options.filter).forEach(([k, v]) => params.set(k, v));
      }
      if (extra) {
        Object.entries(extra).forEach(([k, v]) => params.set(k, v));
      }
      const qs = params.toString();
      return `/api/data/${table}${qs ? `?${qs}` : ""}`;
    },
    [table, options?.orderBy, options?.ascending, options?.filter]
  );

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      if (mountedRef.current) {
        setData(json.data ?? []);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : "Failed to fetch");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const create = useCallback(
    async (item: Partial<T>): Promise<T | null> => {
      try {
        const res = await fetch(`/api/data/${table}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        const created = json.data as T;
        setData((prev) => [created, ...prev]);
        return created;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create");
        return null;
      }
    },
    [table]
  );

  const update = useCallback(
    async (id: string, updates: Partial<T>): Promise<T | null> => {
      try {
        const res = await fetch(`/api/data/${table}?id=${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        const updated = json.data as T;
        setData((prev) => prev.map((item) => (item.id === id ? updated : item)));
        return updated;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update");
        return null;
      }
    },
    [table]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/data/${table}?id=${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(await res.text());
        setData((prev) => prev.filter((item) => item.id !== id));
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
        return false;
      }
    },
    [table]
  );

  return { data, loading, error, create, update, remove, refresh, setData };
}
