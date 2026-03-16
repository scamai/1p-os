"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useSingletonData<T>(table: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      try {
        const res = await fetch(`/api/data/${table}`);
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (mountedRef.current) {
          setData(json.data ?? defaultValue);
        }
      } catch (e) {
        if (mountedRef.current) {
          setError(e instanceof Error ? e.message : "Failed to fetch");
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    })();
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [table]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(
    async (value: T) => {
      try {
        setSaving(true);
        setError(null);
        const res = await fetch(`/api/data/${table}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
        });
        if (!res.ok) throw new Error(await res.text());
      } catch (e) {
        if (mountedRef.current) {
          setError(e instanceof Error ? e.message : "Failed to save");
        }
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    },
    [table]
  );

  const update = useCallback(
    (value: T) => {
      setData(value);
      // Debounce saves to avoid excessive API calls
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => save(value), 800);
    },
    [save]
  );

  const saveNow = useCallback(
    (value?: T) => {
      const v = value ?? data;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      save(v);
    },
    [save, data]
  );

  return { data, loading, saving, error, update, saveNow, setData };
}
