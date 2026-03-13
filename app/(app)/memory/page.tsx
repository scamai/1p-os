"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  category: string;
  updatedAt: string;
}

export default function MemoryPage() {
  const [search, setSearch] = React.useState("");
  const [results, setResults] = React.useState<MemoryEntry[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/context/memory?q=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setResults(
        (data.memories ?? []).map(
          (m: {
            id: string;
            key: string;
            value: string;
            category: string;
            updated_at: string;
          }) => ({
            id: m.id,
            key: m.key,
            value: m.value,
            category: m.category ?? "general",
            updatedAt: m.updated_at,
          })
        )
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        Business Memory
      </h1>
      <p className="mb-6 text-sm text-[var(--muted-foreground)]">
        Search what your agents know about your business.
      </p>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search memories..."
          className="h-9 flex-1 rounded-md border border-[var(--border)] bg-transparent px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <button
          type="submit"
          className="h-9 rounded-md bg-[var(--foreground)] px-4 text-sm font-medium text-[var(--background)] transition-opacity hover:opacity-90"
        >
          Search
        </button>
      </form>

      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No memories found for &quot;{search}&quot;.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        {entry.key}
                      </span>
                      <Badge variant="outline">{entry.category}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {entry.value}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                    {new Date(entry.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!searched && !loading && (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Search to explore your business knowledge base.
          </p>
        </div>
      )}
    </div>
  );
}
